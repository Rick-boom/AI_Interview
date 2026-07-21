// js/backend.js — Backend integration layer (FastAPI)
// Research upgrade: Voice-to-text engine, cognitive load telemetry, multimodal submit,
//                   XAI score rendering, and CSV export trigger.

const API_BASE = (window.VITE_API_URL || 'http://localhost:8000') + '/api/interview';

// ─── Language Templates ────────────────────────────────────────────────────────
// Tracks the last language so we can detect user modifications before swapping
let _previousLang = 'python';

function sanitizeHTML(str) {
    if (!str) return '';
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

// ─── Monaco Language + Code Manager ──────────────────────────────────────────
/**
 * Safely updates the Monaco editor language and content.
 * Uses setModelLanguage — does NOT destroy/recreate the model.
 * @param {string} language  - 'python' | 'cpp'
 * @param {string} code      - starter template code
 * @param {boolean} force    - skip the "overwrite?" confirmation
 * @returns {boolean} whether the swap happened
 */
function setEditorLanguageAndCode(language, code, force = false) {
    if (!window.monacoEditorInstance) return false;

    const currentCode = window.monacoEditorInstance.getValue();
    const q = state.mockQuestions?.[state.activeQuestionIdx];
    const prevTemplate = q?.starterCode?.[_previousLang] ?? '';

    // Warn if the candidate has written custom code (differs from old template)
    if (!force && currentCode.trim() !== '' && currentCode !== prevTemplate) {
        const confirmSwap = confirm(
            `Switching to ${language.toUpperCase()} will replace your current code with the ${language.toUpperCase()} starter template.\n\nContinue? (Your code will be lost.)`
        );
        if (!confirmSwap) {
            // Revert the dropdown visually
            DOM.langSelect.value = _previousLang;
            return false;
        }
    }

    // Swap language syntax highlighting without destroying the model
    const model = window.monacoEditorInstance.getModel();
    if (model) {
        const monacoLang = language === 'cpp' ? 'cpp' : 'python';
        monaco.editor.setModelLanguage(model, monacoLang);
    }

    window.monacoEditorInstance.setValue(code);
    _previousLang = language;
    return true;
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESEARCH MODULE 1: COGNITIVE LOAD TELEMETRY
// Tracks paste events and compilation retries as cognitive load signals.
// Reset on each new session start.
// ═══════════════════════════════════════════════════════════════════════════════

window._telemetry = {
    startTime:           null,   // performance.now() at session start
    timeToFirstCompile:  null,   // seconds from start to first Run attempt
    compilationRetries:  0,
    pasteCount:          0,
};

function _resetTelemetry() {
    window._telemetry = {
        startTime:          performance.now(),
        timeToFirstCompile: null,
        compilationRetries: 0,
        pasteCount:         0,
    };
    _updateTelemetryBadge();
}

function _logCompilationAttempt() {
    const tel = window._telemetry;
    if (tel.timeToFirstCompile === null && tel.startTime !== null) {
        tel.timeToFirstCompile = Math.round((performance.now() - tel.startTime) / 1000);
    }
    tel.compilationRetries++;
    _updateTelemetryBadge();
}

function _updateTelemetryBadge() {
    const runsEl   = document.getElementById('tel-runs');
    const pastesEl = document.getElementById('tel-pastes');
    if (runsEl)   runsEl.textContent   = window._telemetry.compilationRetries;
    if (pastesEl) pastesEl.textContent = window._telemetry.pasteCount;
}

function _getTelemetryPayload() {
    const t = window._telemetry;
    return {
        time_to_first_compile: t.timeToFirstCompile,
        compilation_retries:   t.compilationRetries,
        paste_count:           t.pasteCount,
    };
}

// Wire paste tracking onto Monaco editor once it's ready.
// We use the editor's own onDidPaste event (more reliable than a DOM paste listener).
function _attachEditorPasteListener() {
    if (!window.monacoEditorInstance) return;
    window.monacoEditorInstance.onDidPaste(() => {
        window._telemetry.pasteCount++;
        _updateTelemetryBadge();
    });
}


// ═══════════════════════════════════════════════════════════════════════════════
// RESEARCH MODULE 2: VOICE-TO-TEXT ENGINE (Web Speech API)
// Captures the candidate's verbal explanation in real-time.
// ═══════════════════════════════════════════════════════════════════════════════

const _SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let _recognition    = null;
let _isRecording    = false;
window._verbalExplanation = '';   // Latest finalized transcript

function _initSpeechRecognition() {
    if (!_SpeechRecognition) return;

    _recognition = new _SpeechRecognition();
    _recognition.continuous     = true;
    _recognition.interimResults = true;
    _recognition.lang           = 'en-US';

    let _finalTranscript = '';

    _recognition.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const t = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                _finalTranscript += t + ' ';
            } else {
                interim += t;
            }
        }
        window._verbalExplanation = _finalTranscript.trim() + interim.trim();
    };

    _recognition.onend = () => {
        // Auto-stop state cleanup if recognition ends on its own
        if (_isRecording) {
            _isRecording = false;
            _updateRecordButton(false);
        }
    };

    _recognition.onerror = (e) => {
        console.warn('[Voice] SpeechRecognition error:', e.error);
        if (e.error !== 'no-speech') {
            _isRecording = false;
            _updateRecordButton(false);
            const status = document.getElementById('record-status');
            if (status) status.textContent = `Mic error`;
            setTimeout(() => { if (status) status.textContent = ''; }, 3000);
        }
    };
}

function _updateRecordButton(recording) {
    const btn    = document.getElementById('record-btn');
    const icon   = document.getElementById('record-icon');
    const status = document.getElementById('record-status');
    if (!btn) return;

    if (recording) {
        btn.classList.add('recording');
        if (icon)   icon.className   = 'fa-solid fa-stop';
        if (status) status.textContent = '⏺ Listening…';
    } else {
        btn.classList.remove('recording');
        if (icon)   icon.className   = 'fa-solid fa-microphone';
        if (status) {
            const hasText = window._verbalExplanation && window._verbalExplanation.length > 0;
            status.textContent = hasText ? '✓ Captured' : '';
            if (hasText) {
                setTimeout(() => { if (status && !_isRecording) status.textContent = ''; }, 3000);
            }
        }
    }
}

function _wireRecordButton() {
    const btn = document.getElementById('record-btn');
    if (!btn) return;

    btn.addEventListener('click', () => {
        if (!_recognition) {
            alert('Web Speech API is not supported in this browser. Please use Chrome or Edge for voice transcription.');
            return;
        }

        if (!_isRecording) {
            try {
                _recognition.start();
                _isRecording = true;
                _updateRecordButton(true);
            } catch (e) {
                console.warn('[Voice] Could not start recognition:', e);
            }
        } else {
            _recognition.stop();
            _isRecording = false;
            _updateRecordButton(false);
        }
    });
}

function _resetVoice() {
    if (_isRecording && _recognition) {
        _recognition.stop();
        _isRecording = false;
    }
    _updateRecordButton(false);
    window._verbalExplanation = '';
}


// ═══════════════════════════════════════════════════════════════════════════════
// START MOCK SESSION (Backend) — overrides app.js stub
// ═══════════════════════════════════════════════════════════════════════════════

async function startMockSession() {
    const candidateName = (window._candidateName || 'Candidate').trim() || 'Candidate';

    DOM.consoleOutputBox.innerHTML =
        '<div class="console-message info"><i class="fa-solid fa-spinner fa-spin"></i> Starting session on backend...</div>';
    DOM.btnStartMock.disabled = true;

    try {
        const res = await fetch(`${API_BASE}/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                candidate_name: candidateName,
                num_questions: 6,
                difficulty: null,
                topic: null,
            }),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || `HTTP ${res.status}`);
        }

        const data = await res.json();

        state.sessionId      = data.session_id;
        state.isPracticeMode = false;

        state.mockQuestions     = data.questions.map(formatBackendQuestion);
        state.activeQuestionIdx = 0;
        state.codeSubmissions   = {};

        state.mockQuestions.forEach((q) => {
            state.codeSubmissions[q.id] = {
                code:       q.starterCode.python,
                lang:       'python',
                saved:      false,
                evaluation: null,
            };
        });

        DOM.btnStartMock.disabled = false;
        DOM.btnSubmitMock.style.display = '';
        DOM.sessionTimer.style.display  = '';

        // Sync language select to default
        DOM.langSelect.value = 'python';
        _previousLang = 'python';

        // ── Research: reset telemetry + voice for new session ──────────────
        _resetTelemetry();
        _resetVoice();

        // Show the research panel
        const panel = document.getElementById('research-panel');
        if (panel) panel.style.display = '';

        startTimer(90 * 60);
        switchPanel('workspace');
        renderWorkspaceTabs();
        loadQuestion(0);

        // Attach Monaco paste listener (Monaco may not exist yet — retry after Monaco loads)
        if (window.monacoEditorInstance) {
            _attachEditorPasteListener();
        } else {
            const _origOnMonaco = window.onMonacoLoad;
            window.onMonacoLoad = function () {
                if (typeof _origOnMonaco === 'function') _origOnMonaco();
                _attachEditorPasteListener();
            };
        }

        // Start proctoring (non-blocking)
        if (window.proctor) {
            window.proctor.startAll();
        }

    } catch (e) {
        alert('Failed to start session: ' + e.message);
        DOM.btnStartMock.disabled = false;
    }
}

// ─── Question Data Formatter ──────────────────────────────────────────────────
function formatBackendQuestion(bq) {
    return {
        id:          bq.id,
        title:       bq.title,
        company:     (bq.company_tags && bq.company_tags[0]) || 'General',
        category:    bq.topic || 'Algorithms',
        difficulty:  bq.difficulty || 'Medium',
        description: bq.prompt,
        constraints: Array.isArray(bq.constraints)
            ? bq.constraints.join('\n')
            : (bq.constraints || 'None'),
        targetTime:  'Optimal',
        targetSpace: 'Optimal',
        testCases:   [],
        starterCode: bq.starter_code,   // { python: "...", cpp: "..." }
        companyTags: bq.company_tags || [],
    };
}

// ─── Load Question (overrides app.js version) ─────────────────────────────────
function loadQuestion(idx) {
    state.activeQuestionIdx = idx;
    const q = state.mockQuestions[idx];

    // Update tab highlight
    document.querySelectorAll('.tab-btn').forEach((btn, i) => {
        btn.classList.toggle('active', i === idx);
    });

    // Build question detail panel with XSS-safe sanitisation
    DOM.questionDetails.innerHTML = `
        <div class="question-header">
            <h2>${sanitizeHTML(q.title)}</h2>
            <div class="q-meta-row">
                <span class="company-tag ${sanitizeHTML(q.company.toLowerCase())}">
                    <i class="fa-solid fa-building"></i> ${sanitizeHTML(q.company)}
                </span>
                <span class="company-tag">
                    <i class="fa-solid fa-tags"></i> ${sanitizeHTML(q.category)}
                </span>
                <span class="diff-badge ${getDiffClass(q.difficulty)}">${sanitizeHTML(q.difficulty)}</span>
            </div>
        </div>
        <div class="q-desc">${sanitizeHTML(q.description)}</div>
        <div class="q-section-title">Constraints</div>
        <div class="q-detail-text">${sanitizeHTML(q.constraints)}</div>
    `;

    // Sync submission state to editor
    const sub = state.codeSubmissions[q.id];
    if (sub) {
        DOM.langSelect.value = sub.lang;
        _previousLang = sub.lang;

        if (window.monacoEditorInstance) {
            const model = window.monacoEditorInstance.getModel();
            if (model) {
                const monacoLang = sub.lang === 'cpp' ? 'cpp' : 'python';
                monaco.editor.setModelLanguage(model, monacoLang);
            }
            window.monacoEditorInstance.setValue(sub.code);
        }
    }

    DOM.consoleOutputBox.innerHTML = `
        <div class="console-message system">
            Loaded <strong>${sanitizeHTML(q.title)}</strong>. 
            Write your solution and click <em>Run & Submit</em>.
        </div>`;
}

// ─── Language Change Listener ─────────────────────────────────────────────────
DOM.langSelect.addEventListener('change', (e) => {
    if (!state.mockQuestions || state.activeQuestionIdx == null) return;
    const q   = state.mockQuestions[state.activeQuestionIdx];
    const sub = state.codeSubmissions[q.id];
    if (!sub) return;

    const newLang     = e.target.value;
    const newTemplate = q.starterCode?.[newLang] ?? `# No ${newLang} template available\n`;

    const swapped = setEditorLanguageAndCode(newLang, newTemplate);
    if (swapped) {
        sub.lang = newLang;
        sub.code = newTemplate;
    }
});

// ─── Save Code ────────────────────────────────────────────────────────────────
function saveActiveQuestionCode() {
    if (!window.monacoEditorInstance) return;
    const q = state.mockQuestions?.[state.activeQuestionIdx];
    if (!q) return;

    const code = window.monacoEditorInstance.getValue();
    state.codeSubmissions[q.id].code  = code;
    state.codeSubmissions[q.id].saved = true;
    renderWorkspaceTabs();
}

// ─── Run / Submit (single question) ──────────────────────────────────────────
async function runActiveQuestion() {
    if (!window.monacoEditorInstance) return;
    const q = state.mockQuestions?.[state.activeQuestionIdx];
    if (!q) return;

    saveActiveQuestionCode();
    const sub = state.codeSubmissions[q.id];

    // ── Research: log compilation attempt before the fetch ────────────────
    _logCompilationAttempt();

    const timeTaken = (90 * 60) - (state.timeLeft ?? 0);

    DOM.consoleOutputBox.innerHTML += `
        <div class="console-message info">
            <i class="fa-solid fa-spinner fa-spin"></i>
            Submitting <strong>${sanitizeHTML(q.title)}</strong> (${sub.lang.toUpperCase()}) to backend…
        </div>`;
    DOM.consoleOutputBox.scrollTop = DOM.consoleOutputBox.scrollHeight;

    // ── Collect verbal explanation (from voice textarea) ──────────────────
    const verbalText = (
        document.getElementById('explanation-display')?.value?.trim()
        || window._verbalExplanation
        || ''
    ) || 'No verbal explanation provided.';

    try {
        const res = await fetch(`${API_BASE}/${state.sessionId}/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question_id:        q.id,
                code:               sub.code,
                language:           sub.lang,
                time_taken_seconds: timeTaken,
                // ── Research fields ──────────────────────────────────────────
                verbal_explanation: verbalText,
                telemetry:          _getTelemetryPayload(),
            }),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || `HTTP ${res.status}`);
        }

        const data = await res.json();
        const ev   = data.evaluation;

        // Backend returns snake_case fields — read them correctly
        const correctness = ev.correctness_score ?? ev.correctnessScore ?? 0;
        const efficiency  = ev.efficiency_score  ?? ev.efficiencyScore  ?? 0;
        const quality     = ev.code_quality_score ?? ev.codeQualityScore ?? 0;
        const testsPassed = ev.tests_passed ?? 0;
        const testsTotal  = ev.tests_total  ?? 0;

        // ── XAI fields (only present when verbal explanation was given) ────
        const hasXAI      = ev.alignment_score != null;
        const alignScore  = ev.alignment_score ?? null;
        const bluffing    = ev.bluffing_detected ?? null;
        const verbalScore = ev.verbal_clarity_score ?? null;
        const confidence  = ev.confidence_percentage ?? null;
        const biasOk      = ev.bias_audit_passed ?? null;

        // Build XAI metrics block
        const xaiHtml = hasXAI ? `
            <div class="xai-metrics-block">
                <div class="xai-header">
                    <i class="fa-solid fa-flask-vial"></i> Research Metrics
                    ${bluffing ? '<span class="bluffing-badge"><i class="fa-solid fa-triangle-exclamation"></i> Bluffing Detected</span>' : ''}
                </div>
                <div class="xai-chips">
                    <div class="xai-chip ${_alignClass(alignScore)}" title="Verbal explanation matches code logic">
                        <i class="fa-solid fa-link"></i>
                        Alignment: <strong>${alignScore}%</strong>
                    </div>
                    <div class="xai-chip" title="Clarity of verbal explanation">
                        <i class="fa-solid fa-microphone"></i>
                        Verbal Clarity: <strong>${verbalScore}%</strong>
                    </div>
                    <div class="xai-chip" title="AI self-confidence in this grade">
                        <i class="fa-solid fa-gauge-high"></i>
                        AI Confidence: <strong>${confidence}%</strong>
                    </div>
                    <div class="xai-chip ${biasOk ? 'xai-good' : 'xai-warn'}" title="Bias audit result">
                        <i class="fa-solid fa-scale-balanced"></i>
                        Bias Audit: <strong>${biasOk ? '✓ Passed' : '⚠ Review'}</strong>
                    </div>
                </div>
                ${ev.verbal_explanation_summary ? `
                <div class="xai-summary">
                    <i class="fa-regular fa-comment-dots"></i>
                    <em>${sanitizeHTML(ev.verbal_explanation_summary)}</em>
                </div>` : ''}
            </div>` : '';

        DOM.consoleOutputBox.innerHTML += `
            <div class="console-result-card">
                <div class="result-header">
                    <span class="result-title">${sanitizeHTML(ev.title || q.title)}</span>
                    <span class="result-score">${ev.score ?? 0}<span class="score-denom">/100</span></span>
                </div>
                <div class="result-metrics">
                    <div class="metric-chip correctness">
                        <i class="fa-solid fa-circle-check"></i>
                        Correctness: ${correctness}%
                    </div>
                    <div class="metric-chip efficiency">
                        <i class="fa-solid fa-gauge-high"></i>
                        Efficiency: ${efficiency}%
                    </div>
                    <div class="metric-chip quality">
                        <i class="fa-solid fa-star"></i>
                        Code Quality: ${quality}%
                    </div>
                    <div class="metric-chip tests">
                        <i class="fa-solid fa-flask"></i>
                        Tests: ${testsPassed}/${testsTotal}
                    </div>
                </div>
                ${ev.detected_time_complexity ? `
                <div class="result-complexity">
                    <span>⏱ Detected Time: <strong>${sanitizeHTML(ev.detected_time_complexity)}</strong>
                        (Optimal: ${sanitizeHTML(ev.optimal_time_complexity || '?')})</span>
                    <span>💾 Detected Space: <strong>${sanitizeHTML(ev.detected_space_complexity)}</strong>
                        (Optimal: ${sanitizeHTML(ev.optimal_space_complexity || '?')})</span>
                </div>` : ''}
                ${ev.feedback ? `
                <div class="result-feedback">
                    <i class="fa-regular fa-comment-dots"></i>
                    ${sanitizeHTML(ev.feedback)}
                </div>` : ''}
                ${xaiHtml}
            </div>`;

        DOM.consoleOutputBox.scrollTop = DOM.consoleOutputBox.scrollHeight;

        // Mark tab as submitted
        const tabs = document.querySelectorAll('.tab-btn');
        if (tabs[state.activeQuestionIdx]) {
            tabs[state.activeQuestionIdx].classList.add('submitted');
        }

        // Cache evaluation in state
        state.codeSubmissions[q.id].evaluation = ev;
        state.codeSubmissions[q.id].saved = true;
        renderWorkspaceTabs();

    } catch (e) {
        DOM.consoleOutputBox.innerHTML +=
            `<div class="console-message error"><i class="fa-solid fa-triangle-exclamation"></i> Failed: ${sanitizeHTML(e.message)}</div>`;
        DOM.consoleOutputBox.scrollTop = DOM.consoleOutputBox.scrollHeight;
    }
}

/** Maps an alignment score to a CSS modifier class for colour-coding. */
function _alignClass(score) {
    if (score == null) return '';
    if (score >= 75)   return 'xai-good';
    if (score >= 45)   return 'xai-warn';
    return 'xai-bad';
}

// ─── Finish Mock Session (Submit Interview) ───────────────────────────────────
async function finishMockSession() {
    // Stop the timer
    if (state.timerInterval) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
    }

    // Stop voice recording if still active
    if (_isRecording && _recognition) {
        _recognition.stop();
        _isRecording = false;
    }

    // Hide research panel
    const researchPanel = document.getElementById('research-panel');
    if (researchPanel) researchPanel.style.display = 'none';

    DOM.consoleOutputBox.innerHTML +=
        '<div class="console-message info"><i class="fa-solid fa-spinner fa-spin"></i> Generating final performance report…</div>';
    DOM.consoleOutputBox.scrollTop = DOM.consoleOutputBox.scrollHeight;

    try {
        const res = await fetch(`${API_BASE}/${state.sessionId}/report`);
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || 'Failed to fetch report');
        }
        const report = await res.json();

        // Render score ring
        DOM.reportScoreNum.innerText = report.overall_score;
        const offset = 440 - (440 * report.overall_score) / 100;
        DOM.reportRingFg.style.strokeDashoffset = offset;

        DOM.reportGrade.innerText = getScoreBadgeLabel(report.overall_score);
        DOM.reportGrade.className = 'grade-label ' + getScoreBadgeClass(report.overall_score);

        // Aggregate metrics — read snake_case fields from API
        let cAvg = 0, eAvg = 0, qAvg = 0;
        if (report.evaluations.length > 0) {
            cAvg = Math.round(
                report.evaluations.reduce((a, c) => a + (c.correctness_score ?? 0), 0) / report.evaluations.length
            );
            eAvg = Math.round(
                report.evaluations.reduce((a, c) => a + (c.efficiency_score ?? 0), 0) / report.evaluations.length
            );
            qAvg = Math.round(
                report.evaluations.reduce((a, c) => a + (c.code_quality_score ?? 0), 0) / report.evaluations.length
            );
        }

        DOM.reportValCorrectness.innerText = `${cAvg}%`;
        DOM.reportValTime.innerText        = `${eAvg}%`;
        DOM.reportValSpace.innerText       = `${qAvg}%`;

        DOM.reportFillCorrectness.style.width = `${cAvg}%`;
        DOM.reportFillTime.style.width        = `${eAvg}%`;
        DOM.reportFillSpace.style.width       = `${qAvg}%`;

        // Build per-question accordions
        DOM.reportQuestionsContainer.innerHTML = '';
        report.evaluations.forEach((ev, i) => {
            const q = state.mockQuestions.find((x) => x.id === ev.question_id) || { title: ev.title };
            const correct    = ev.correctness_score ?? 0;
            const efficiency = ev.efficiency_score  ?? 0;
            const quality    = ev.code_quality_score ?? 0;
            const isGood     = correct >= 70;
            const statusIcon = isGood
                ? 'fa-solid fa-circle-check text-success'
                : 'fa-solid fa-triangle-exclamation text-warning';

            const strengthsHtml = (ev.strengths || []).map(
                s => `<li>${sanitizeHTML(s)}</li>`
            ).join('');
            const missedHtml = (ev.missed_points || []).map(
                m => `<li>${sanitizeHTML(m)}</li>`
            ).join('');

            // XAI section for report accordion
            const hasXAI    = ev.alignment_score != null;
            const xaiReport = hasXAI ? `
                <div class="q-xai-section">
                    <h5><i class="fa-solid fa-flask-vial"></i> Research Metrics</h5>
                    <div class="xai-chips">
                        <div class="xai-chip ${_alignClass(ev.alignment_score)}">
                            <i class="fa-solid fa-link"></i>
                            Alignment: <strong>${ev.alignment_score}%</strong>
                            ${ev.bluffing_detected ? '<span class="bluffing-badge-sm">Bluffing</span>' : ''}
                        </div>
                        <div class="xai-chip">
                            <i class="fa-solid fa-microphone"></i>
                            Verbal Clarity: <strong>${ev.verbal_clarity_score}%</strong>
                        </div>
                        <div class="xai-chip">
                            <i class="fa-solid fa-gauge-high"></i>
                            AI Confidence: <strong>${ev.confidence_percentage}%</strong>
                        </div>
                        <div class="xai-chip ${ev.bias_audit_passed ? 'xai-good' : 'xai-warn'}">
                            <i class="fa-solid fa-scale-balanced"></i>
                            Bias Audit: <strong>${ev.bias_audit_passed ? '✓ Passed' : '⚠ Review'}</strong>
                        </div>
                    </div>
                    ${ev.verbal_explanation_summary ? `
                    <div class="xai-summary">
                        <i class="fa-regular fa-comment-dots"></i>
                        <em>${sanitizeHTML(ev.verbal_explanation_summary)}</em>
                    </div>` : ''}
                </div>` : '';

            const div = document.createElement('div');
            div.className = 'accordion-item';
            div.innerHTML = `
                <div class="accordion-header" onclick="this.parentElement.classList.toggle('active')">
                    <div class="acc-title-col">
                        <i class="${statusIcon}"></i>
                        <div>
                            <h4>Q${i + 1}: ${sanitizeHTML(q.title)}</h4>
                            <div style="display:flex;gap:0.5rem;margin-top:0.25rem;">
                                ${ev.detected_time_complexity
                                    ? `<span class="code-type">⏱ ${sanitizeHTML(ev.detected_time_complexity)}</span>`
                                    : ''}
                                ${ev.tests_passed != null
                                    ? `<span class="code-type">✅ ${ev.tests_passed}/${ev.tests_total} tests</span>`
                                    : ''}
                                ${ev.alignment_score != null
                                    ? `<span class="code-type ${_alignClass(ev.alignment_score)}">🔗 Align: ${ev.alignment_score}%</span>`
                                    : ''}
                            </div>
                        </div>
                    </div>
                    <div class="acc-status-col">
                        <div class="acc-score">${ev.score ?? 0} <span style="font-size:0.75rem;color:var(--text-muted)">/100</span></div>
                        <i class="fa-solid fa-chevron-down acc-toggle-icon"></i>
                    </div>
                </div>
                <div class="accordion-content">
                    <div class="q-report-scores">
                        <div class="q-score-card">
                            <div class="lbl">Correctness</div>
                            <div class="val" style="color:var(--color-success)">${correct}%</div>
                        </div>
                        <div class="q-score-card">
                            <div class="lbl">Efficiency</div>
                            <div class="val" style="color:var(--accent-cyan)">${efficiency}%</div>
                        </div>
                        <div class="q-score-card">
                            <div class="lbl">Code Quality</div>
                            <div class="val" style="color:var(--accent-purple)">${quality}%</div>
                        </div>
                    </div>
                    ${ev.detected_approach ? `
                    <div class="q-approach-row">
                        <strong>Your Approach:</strong> ${sanitizeHTML(ev.detected_approach)}<br>
                        <strong>Optimal Approach:</strong> ${sanitizeHTML(ev.optimal_approach || '?')}
                    </div>` : ''}
                    ${strengthsHtml ? `
                    <div class="q-strengths"><strong>✅ Strengths:</strong><ul>${strengthsHtml}</ul></div>` : ''}
                    ${missedHtml ? `
                    <div class="q-missed"><strong>⚠️ Areas to Improve:</strong><ul>${missedHtml}</ul></div>` : ''}
                    ${ev.feedback ? `
                    <div class="q-feedback-text">${sanitizeHTML(ev.feedback)}</div>` : ''}
                    ${xaiReport}
                </div>`;
            DOM.reportQuestionsContainer.appendChild(div);
        });

        // Attach proctoring metadata to report display
        if (window.proctor) {
            const incidents = window.proctor.incidents || [];
            renderProctoringReport(incidents, report);
            window.proctor.stopAll();
        }

        // Save to local history
        const attempt = {
            timestamp:        Date.now(),
            score:            report.overall_score,
            correctnessScore: cAvg,
            timeScore:        eAvg,
            spaceScore:       qAvg,
            isPractice:       false,
            summary:          report.summary || '',
            results:          {},
        };
        report.evaluations.forEach((ev) => {
            attempt.results[ev.question_id] = {
                correctnessScore: ev.correctness_score ?? 0,
                score:            ev.score ?? 0,
            };
        });
        state.mockHistory.push(attempt);
        saveHistoryToStorage();

        switchPanel('report');

    } catch (e) {
        DOM.consoleOutputBox.innerHTML +=
            `<div class="console-message error"><i class="fa-solid fa-triangle-exclamation"></i> Failed to generate report: ${sanitizeHTML(e.message)}<br><br>Hint: Make sure you have submitted at least one question with "Run & Submit".</div>`;
        DOM.consoleOutputBox.scrollTop = DOM.consoleOutputBox.scrollHeight;
    }
}


// ═══════════════════════════════════════════════════════════════════════════════
// RESEARCH MODULE 3: CSV EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

async function exportResearchCSV() {
    const btn = document.getElementById('btn-export-csv');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Exporting…';
    }

    try {
        const res = await fetch(`${API_BASE}/export-research-data`);
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || `HTTP ${res.status}`);
        }

        const blob     = await res.blob();
        const url      = URL.createObjectURL(blob);
        const anchor   = document.createElement('a');
        anchor.href    = url;
        anchor.download = `interview_research_data_${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);

    } catch (e) {
        alert('Export failed: ' + e.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-file-csv"></i> Export Research CSV';
        }
    }
}

// Wire the export button (it exists in the Report panel)
document.getElementById('btn-export-csv')?.addEventListener('click', exportResearchCSV);


// ─── Proctoring Report Section ────────────────────────────────────────────────
function renderProctoringReport(incidents, report) {
    const container = document.getElementById('proctor-report-section');
    if (!container) return;

    container.style.display = 'block';
    const cameraActive = window.proctor?.cameraActive ?? false;
    const screenActive = window.proctor?.screenActive ?? false;

    const incidentRows = incidents.length
        ? incidents.map(inc => `
            <tr>
                <td>${sanitizeHTML(inc.timestamp)}</td>
                <td><span class="incident-type">${sanitizeHTML(inc.type)}</span></td>
                <td>${sanitizeHTML(inc.details)}</td>
            </tr>`).join('')
        : `<tr><td colspan="3" style="text-align:center;color:var(--color-success)">No incidents recorded ✓</td></tr>`;

    container.innerHTML = `
        <div class="proctor-report-card">
            <h3><i class="fa-solid fa-shield-halved"></i> Proctoring Summary</h3>
            <div class="proctor-status-row">
                <span class="proctor-chip ${cameraActive ? 'active' : 'inactive'}">
                    <i class="fa-solid fa-video${cameraActive ? '' : '-slash'}"></i>
                    Camera: ${cameraActive ? 'Active' : 'Not Available'}
                </span>
                <span class="proctor-chip ${screenActive ? 'active' : 'inactive'}">
                    <i class="fa-solid fa-desktop"></i>
                    Screen: ${screenActive ? 'Monitored' : 'Not Available'}
                </span>
                <span class="proctor-chip ${incidents.length === 0 ? 'active' : 'inactive'}">
                    <i class="fa-solid fa-flag"></i>
                    Incidents: ${incidents.length}
                </span>
            </div>
            <table class="incident-table">
                <thead><tr><th>Timestamp</th><th>Type</th><th>Details</th></tr></thead>
                <tbody>${incidentRows}</tbody>
            </table>
        </div>`;
}


// ─── Fullscreen Toggle Logic ──────────────────────────────────────────────────
function _wireFullscreenButton() {
    const btn = document.getElementById('btn-fullscreen');
    if (!btn) return;

    btn.addEventListener('click', () => {
        const rightPanel = document.querySelector('.split-right');
        if (!rightPanel) return;
        
        const isFullscreen = rightPanel.classList.toggle('fullscreen');
        
        // Update icon
        const icon = btn.querySelector('i');
        if (icon) {
            icon.className = isFullscreen ? 'fa-solid fa-compress' : 'fa-solid fa-expand';
        }
        
        // Notify monaco to resize
        if (window.monacoEditorInstance) {
            setTimeout(() => {
                window.monacoEditorInstance.layout();
            }, 50);
        }
    });
}

// ─── Bootstrap: wire buttons once DOM is ready ──────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    _initSpeechRecognition();
    _wireRecordButton();
    _wireFullscreenButton();
});
