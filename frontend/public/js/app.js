// js/app.js — Core application state and UI orchestration
// backend.js overrides: startMockSession, loadQuestion, saveActiveQuestionCode,
//                       runActiveQuestion, finishMockSession

// ─── Global State ─────────────────────────────────────────────────────────────
let state = {
    currentPanel:          'dashboard',
    mockQuestions:         [],       // Questions for the active mock
    activeQuestionIdx:     0,
    codeSubmissions:       {},       // { questionId: { code, lang, saved, evaluation } }
    timerInterval:         null,
    timeLeft:              0,        // seconds
    mockHistory:           [],       // past attempts
    isPracticeMode:        false,
    activePracticeQuestion: null,
    sessionId:             null,
};

// ─── DOM References ────────────────────────────────────────────────────────────
const DOM = {
    // Nav
    btnNavDashboard: document.getElementById('nav-btn-dashboard'),
    btnNavLibrary:   document.getElementById('nav-btn-library'),

    // Panels
    panelDashboard: document.getElementById('panel-dashboard'),
    panelLibrary:   document.getElementById('panel-library'),
    panelWorkspace: document.getElementById('panel-workspace'),
    panelReport:    document.getElementById('panel-report'),

    // Dashboard
    btnStartMock:      document.getElementById('btn-start-mock'),
    statAvgScore:      document.getElementById('stat-avg-score'),
    statMocksCount:    document.getElementById('stat-mocks-count'),
    statSolvedCount:   document.getElementById('stat-solved-count'),
    historyContainer:  document.getElementById('history-container'),

    // Library
    libSearch:           document.getElementById('lib-search'),
    libFilterDifficulty: document.getElementById('lib-filter-difficulty'),
    libFilterCompany:    document.getElementById('lib-filter-company'),
    libFilterCategory:   document.getElementById('lib-filter-category'),
    libTableBody:        document.getElementById('lib-table-body'),

    // Workspace
    workspaceTabsContainer: document.getElementById('workspace-tabs-container'),
    questionDetails:        document.getElementById('question-details'),
    sessionTimer:           document.getElementById('session-timer'),
    btnRunCode:             document.getElementById('btn-run-code'),
    btnSaveCode:            document.getElementById('btn-save-code'),
    btnSubmitMock:          document.getElementById('btn-submit-mock'),
    langSelect:             document.getElementById('lang-select'),
    consoleOutputBox:       document.getElementById('console-output-box'),
    btnClearConsole:        document.getElementById('btn-clear-console'),

    // Report
    reportScoreNum:         document.getElementById('report-score-num'),
    reportRingFg:           document.getElementById('report-ring-fg'),
    reportGrade:            document.getElementById('report-grade'),
    reportValCorrectness:   document.getElementById('report-val-correctness'),
    reportValTime:          document.getElementById('report-val-time'),
    reportValSpace:         document.getElementById('report-val-space'),
    reportFillCorrectness:  document.getElementById('report-fill-correctness'),
    reportFillTime:         document.getElementById('report-fill-time'),
    reportFillSpace:        document.getElementById('report-fill-space'),
    reportQuestionsContainer: document.getElementById('report-questions-container'),
    btnReportClose:         document.getElementById('btn-report-close'),
};

// ─── XSS-Safe HTML Sanitizer ──────────────────────────────────────────────────
// Simple but effective: uses the browser's own text-node escaping.
function sanitizeHTML(str) {
    if (str == null) return '';
    const temp = document.createElement('div');
    temp.textContent = String(str);
    return temp.innerHTML;
}

// ─── Initialization ────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
    loadStateFromStorage();
    setupEventListeners();
    renderDashboardStats();
    populateLibraryTable();
    setupNameModal();
});

// Monaco ready callback — defined here, called from index.html after Monaco loads
window.onMonacoLoad = () => {
    // If workspace is already active (unlikely on first load), sync the editor
    if (state.currentPanel === 'workspace' && state.mockQuestions.length > 0) {
        const q   = state.mockQuestions[state.activeQuestionIdx];
        const sub = state.codeSubmissions[q?.id];
        if (sub && window.monacoEditorInstance) {
            const model = window.monacoEditorInstance.getModel();
            if (model) {
                const monacoLang = sub.lang === 'cpp' ? 'cpp' : 'python';
                monaco.editor.setModelLanguage(model, monacoLang);
            }
            window.monacoEditorInstance.setValue(sub.code);
        }
    }
};

// ─── Candidate Name Modal ──────────────────────────────────────────────────────
function setupNameModal() {
    const modal   = document.getElementById('name-modal');
    const input   = document.getElementById('candidate-name-input');
    const startBtn = document.getElementById('modal-start-btn');
    const cancelBtn = document.getElementById('modal-cancel-btn');

    if (!modal || !input || !startBtn) return;

    // Wire the Dashboard "Start Mock" button to show modal
    DOM.btnStartMock.addEventListener('click', () => {
        modal.classList.add('active');
        input.value = '';
        input.focus();
    });

    startBtn.addEventListener('click', () => {
        const name = input.value.trim();
        window._candidateName = name || 'Candidate';
        modal.classList.remove('active');
        startMockSession();        // defined in backend.js
    });

    cancelBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    // Allow Enter key to submit
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') startBtn.click();
    });

    // Click outside backdrop to dismiss
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
    });
}

// ─── Navigation ───────────────────────────────────────────────────────────────
function switchPanel(panelName) {
    state.currentPanel = panelName;

    // Remove all active states
    DOM.panelDashboard.classList.remove('active');
    DOM.panelLibrary.classList.remove('active');
    DOM.panelWorkspace.classList.remove('active');
    DOM.panelReport.classList.remove('active');
    DOM.btnNavDashboard.classList.remove('active');
    DOM.btnNavLibrary.classList.remove('active');

    if (panelName === 'dashboard') {
        DOM.panelDashboard.classList.add('active');
        DOM.btnNavDashboard.classList.add('active');
        renderDashboardStats();
    } else if (panelName === 'library') {
        DOM.panelLibrary.classList.add('active');
        DOM.btnNavLibrary.classList.add('active');
        populateLibraryTable();
    } else if (panelName === 'workspace') {
        DOM.panelWorkspace.classList.add('active');
    } else if (panelName === 'report') {
        DOM.panelReport.classList.add('active');
    }
}

// ─── Event Listeners ──────────────────────────────────────────────────────────
function setupEventListeners() {
    // Navigation — warn if mid-session
    DOM.btnNavDashboard.addEventListener('click', () => {
        if (state.timerInterval) {
            if (confirm('You are in an active session. The timer will continue. Proceed?'))
                switchPanel('dashboard');
        } else {
            switchPanel('dashboard');
        }
    });

    DOM.btnNavLibrary.addEventListener('click', () => {
        if (state.timerInterval) {
            if (confirm('You are in an active session. The timer will continue. Proceed?'))
                switchPanel('library');
        } else {
            switchPanel('library');
        }
    });

    // Note: btnStartMock click is wired via setupNameModal() to show the modal first.
    // The actual startMockSession() (in backend.js) is called after the modal confirms.

    // Library filters
    DOM.libSearch.addEventListener('input', filterLibrary);
    DOM.libFilterDifficulty.addEventListener('change', filterLibrary);
    DOM.libFilterCompany.addEventListener('change', filterLibrary);
    DOM.libFilterCategory.addEventListener('change', filterLibrary);

    // Workspace controls
    DOM.btnRunCode.addEventListener('click', runActiveQuestion);       // defined in backend.js
    DOM.btnSaveCode.addEventListener('click', saveActiveQuestionCode); // defined in backend.js
    DOM.btnSubmitMock.addEventListener('click', finishMockSession);    // defined in backend.js
    DOM.btnClearConsole.addEventListener('click', () => {
        DOM.consoleOutputBox.innerHTML =
            '<div class="console-message system">Console cleared.</div>';
    });

    // Report
    DOM.btnReportClose.addEventListener('click', () => switchPanel('dashboard'));
}

// ─── Local Storage ────────────────────────────────────────────────────────────
function loadStateFromStorage() {
    try {
        const data = localStorage.getItem('ai_interview_history');
        if (data) state.mockHistory = JSON.parse(data);
    } catch (e) {
        console.error('Failed to load history:', e);
        state.mockHistory = [];
    }
}

function saveHistoryToStorage() {
    try {
        localStorage.setItem('ai_interview_history', JSON.stringify(state.mockHistory));
    } catch (e) {
        console.error('Failed to save history:', e);
    }
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
function renderDashboardStats() {
    const total = state.mockHistory.length;
    DOM.statMocksCount.innerText = total;

    if (total > 0) {
        const avgScore = Math.round(
            state.mockHistory.reduce((a, c) => a + c.score, 0) / total
        );
        DOM.statAvgScore.innerText = `${avgScore}%`;

        const solvedSet = new Set();
        state.mockHistory.forEach(h => {
            Object.entries(h.results || {}).forEach(([qId, res]) => {
                if ((res.correctnessScore ?? 0) >= 70) solvedSet.add(qId);
            });
        });
        DOM.statSolvedCount.innerText = solvedSet.size;
    } else {
        DOM.statAvgScore.innerText   = '--';
        DOM.statSolvedCount.innerText = '0';
    }

    // Render history list
    DOM.historyContainer.innerHTML = '';
    if (total === 0) {
        DOM.historyContainer.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-folder-open"></i>
                <p>No mock interviews taken yet. Click <strong>Start Mock Interview</strong> to begin!</p>
            </div>`;
        return;
    }

    [...state.mockHistory].reverse().forEach((item, idx) => {
        const dateStr = new Date(item.timestamp).toLocaleDateString(undefined, {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
        });
        const qCount     = Object.keys(item.results || {}).length;
        const badgeClass = getScoreBadgeClass(item.score);
        const badgeLabel = getScoreBadgeLabel(item.score);
        const realIdx    = total - 1 - idx;

        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
            <div class="hist-left">
                <h4>${item.isPractice ? 'Practice Session' : 'Mock Coding Assessment'}</h4>
                <div class="hist-meta">
                    <span><i class="fa-regular fa-clock"></i> ${dateStr}</span>
                    <span><i class="fa-solid fa-code"></i> ${qCount} Questions</span>
                    ${item.summary ? `<span class="hist-summary">${sanitizeHTML(item.summary.substring(0,80))}…</span>` : ''}
                </div>
            </div>
            <div class="hist-right">
                <div class="hist-score">
                    <span class="score-num">${item.score}</span>
                    <span class="score-total">/100</span>
                </div>
                <span class="hist-badge ${badgeClass}">${badgeLabel}</span>
                <button class="btn btn-secondary btn-sm"
                        onclick="viewHistoricalReport(${realIdx})">
                    <i class="fa-solid fa-file-invoice"></i> Report
                </button>
            </div>`;
        DOM.historyContainer.appendChild(div);
    });
}

function getScoreBadgeClass(score) {
    if (score >= 90) return 'badge-excellent';
    if (score >= 70) return 'badge-good';
    if (score >= 50) return 'badge-average';
    return 'badge-poor';
}

function getScoreBadgeLabel(score) {
    if (score >= 90) return 'Outstanding';
    if (score >= 70) return 'Proficient';
    if (score >= 50) return 'Developing';
    return 'Needs Focus';
}

// ─── Question Library ──────────────────────────────────────────────────────────
function populateLibraryTable() {
    DOM.libTableBody.innerHTML = '';
    if (typeof QUESTIONS === 'undefined') return;

    QUESTIONS.forEach(q => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-id', q.id);
        tr.innerHTML = `
            <td><strong>${sanitizeHTML(q.title)}</strong></td>
            <td>
                <span class="company-tag ${sanitizeHTML(q.company.toLowerCase())}">
                    <i class="fa-solid fa-building"></i> ${sanitizeHTML(q.company)}
                </span>
            </td>
            <td>${sanitizeHTML(q.category)}</td>
            <td><span class="diff-badge ${getDiffClass(q.difficulty)}">${sanitizeHTML(q.difficulty)}</span></td>
            <td>
                <span class="code-type">${sanitizeHTML(q.targetTime)}</span>
                / <span class="code-type">${sanitizeHTML(q.targetSpace)}</span>
            </td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="startPracticeSingle('${sanitizeHTML(q.id)}')">
                    <i class="fa-solid fa-dumbbell"></i> Practice
                </button>
            </td>`;
        DOM.libTableBody.appendChild(tr);
    });
}

function getDiffClass(diff) {
    if (diff === 'Easy')   return 'diff-easy';
    if (diff === 'Medium') return 'diff-medium';
    return 'diff-hard';
}

function filterLibrary() {
    const searchVal = DOM.libSearch.value.toLowerCase();
    const diffVal   = DOM.libFilterDifficulty.value;
    const compVal   = DOM.libFilterCompany.value;
    const catVal    = DOM.libFilterCategory.value;

    Array.from(DOM.libTableBody.getElementsByTagName('tr')).forEach(row => {
        const qId = row.getAttribute('data-id');
        const q   = QUESTIONS?.find(x => x.id === qId);
        if (!q) return;

        const ok =
            (q.title.toLowerCase().includes(searchVal) || (q.description || '').toLowerCase().includes(searchVal)) &&
            (diffVal === 'all' || q.difficulty === diffVal) &&
            (compVal === 'all' || q.company === compVal) &&
            (catVal  === 'all' || q.category === catVal);

        row.style.display = ok ? '' : 'none';
    });
}

// ─── Practice Single Question ──────────────────────────────────────────────────
function startPracticeSingle(qId) {
    if (typeof QUESTIONS === 'undefined') return;
    const q = QUESTIONS.find(x => x.id === qId);
    if (!q) return;

    state.mockQuestions         = [q];
    state.activeQuestionIdx     = 0;
    state.codeSubmissions       = {};
    state.isPracticeMode        = true;
    state.activePracticeQuestion = q;

    // Default to python starter
    state.codeSubmissions[q.id] = {
        code:  q.starterCode?.python ?? '',
        lang:  'python',
        saved: false,
        evaluation: null,
    };

    DOM.btnSubmitMock.style.display = 'none';
    DOM.sessionTimer.style.display  = 'none';
    if (state.timerInterval) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
    }

    switchPanel('workspace');
    renderWorkspaceTabs();
    loadQuestion(0);   // overridden by backend.js
}

// ─── Workspace Tab Renderer ────────────────────────────────────────────────────
function renderWorkspaceTabs() {
    DOM.workspaceTabsContainer.innerHTML = '';

    state.mockQuestions.forEach((q, idx) => {
        const btn   = document.createElement('button');
        const sub   = state.codeSubmissions[q.id];
        const saved = sub?.saved ?? false;
        const evald = sub?.evaluation != null;

        btn.className = `tab-btn ${idx === state.activeQuestionIdx ? 'active' : ''} ${evald ? 'submitted' : (saved ? 'saved' : '')}`;

        let icon = 'fa-regular fa-circle';
        if (evald)  icon = 'fa-solid fa-circle-check';
        else if (saved) icon = 'fa-solid fa-floppy-disk';

        btn.innerHTML = `
            <i class="${icon}"></i>
            Q${idx + 1}: ${sanitizeHTML(q.title.substring(0, 13))}${q.title.length > 13 ? '…' : ''}`;

        btn.addEventListener('click', () => {
            saveActiveQuestionCode();   // save before switching (defined in backend.js)
            loadQuestion(idx);
        });

        DOM.workspaceTabsContainer.appendChild(btn);
    });
}

// ─── Timer ─────────────────────────────────────────────────────────────────────
function startTimer(durationSeconds) {
    if (state.timerInterval) clearInterval(state.timerInterval);
    state.timeLeft = durationSeconds;
    updateTimerDisplay();

    state.timerInterval = setInterval(() => {
        state.timeLeft--;
        updateTimerDisplay();

        if (state.timeLeft <= 0) {
            clearInterval(state.timerInterval);
            state.timerInterval = null;
            alert('⏰ Time is up! Your solutions will be automatically submitted.');
            finishMockSession();  // defined in backend.js
        }
    }, 1000);
}

function updateTimerDisplay() {
    const m = Math.floor(state.timeLeft / 60);
    const s = state.timeLeft % 60;
    const mm = m < 10 ? '0' + m : m;
    const ss = s < 10 ? '0' + s : s;

    DOM.sessionTimer.innerHTML = `<i class="fa-regular fa-clock"></i> ${mm}:${ss}`;

    if (state.timeLeft < 5 * 60) {
        DOM.sessionTimer.classList.add('timer-danger');
    } else {
        DOM.sessionTimer.classList.remove('timer-danger');
    }
}

// ─── Console Helper ────────────────────────────────────────────────────────────
function writeConsole(msg, type = 'log') {
    const div = document.createElement('div');
    div.className = `console-message ${type}`;
    div.textContent = msg;
    DOM.consoleOutputBox.appendChild(div);
    DOM.consoleOutputBox.scrollTop = DOM.consoleOutputBox.scrollHeight;
}

// ─── View Historical Report ────────────────────────────────────────────────────
function viewHistoricalReport(historyIndex) {
    const attempt = state.mockHistory[historyIndex];
    if (!attempt) return;

    // Render a simplified historical report using the cached data
    DOM.reportScoreNum.innerText = attempt.score;
    const offset = 440 - (440 * attempt.score) / 100;
    DOM.reportRingFg.style.strokeDashoffset = offset;

    DOM.reportGrade.innerText = getScoreBadgeLabel(attempt.score);
    DOM.reportGrade.className = 'grade-label ' + getScoreBadgeClass(attempt.score);

    DOM.reportValCorrectness.innerText = `${attempt.correctnessScore ?? '--'}%`;
    DOM.reportValTime.innerText        = `${attempt.timeScore ?? '--'}%`;
    DOM.reportValSpace.innerText       = `${attempt.spaceScore ?? '--'}%`;

    DOM.reportFillCorrectness.style.width = `${attempt.correctnessScore ?? 0}%`;
    DOM.reportFillTime.style.width        = `${attempt.timeScore ?? 0}%`;
    DOM.reportFillSpace.style.width       = `${attempt.spaceScore ?? 0}%`;

    DOM.reportQuestionsContainer.innerHTML =
        '<div class="console-message system" style="padding:1rem">' +
        'Full question breakdown available only for the most recent session. ' +
        'Historical records show aggregate scores only.</div>';

    const proctor = document.getElementById('proctor-report-section');
    if (proctor) proctor.style.display = 'none';

    switchPanel('report');
}

// ─── Utility ───────────────────────────────────────────────────────────────────
function getRandomSubset(arr, size) {
    return [...arr].sort(() => Math.random() - 0.5).slice(0, size);
}
