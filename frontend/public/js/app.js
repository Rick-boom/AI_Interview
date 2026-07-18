// js/app.js

// --- Global State ---
let state = {
    currentPanel: "dashboard",
    mockQuestions: [],         // 6 questions for the active mock
    activeQuestionIdx: 0,      // Index of currently active question (0-5)
    codeSubmissions: {},       // key: questionId, value: { code, lang, saved, evaluation }
    timerInterval: null,
    timeLeft: 0,               // seconds left
    mockHistory: [],           // past attempts
    isPracticeMode: false,     // practice single question
    activePracticeQuestion: null
};

// --- DOM Elements ---
const DOM = {
    // Nav
    btnNavDashboard: document.getElementById("nav-btn-dashboard"),
    btnNavLibrary: document.getElementById("nav-btn-library"),

    // Panels
    panelDashboard: document.getElementById("panel-dashboard"),
    panelLibrary: document.getElementById("panel-library"),
    panelWorkspace: document.getElementById("panel-workspace"),
    panelReport: document.getElementById("panel-report"),

    // Dashboard
    btnStartMock: document.getElementById("btn-start-mock"),
    statAvgScore: document.getElementById("stat-avg-score"),
    statMocksCount: document.getElementById("stat-mocks-count"),
    statSolvedCount: document.getElementById("stat-solved-count"),
    historyContainer: document.getElementById("history-container"),

    // Library
    libSearch: document.getElementById("lib-search"),
    libFilterDifficulty: document.getElementById("lib-filter-difficulty"),
    libFilterCompany: document.getElementById("lib-filter-company"),
    libFilterCategory: document.getElementById("lib-filter-category"),
    libTableBody: document.getElementById("lib-table-body"),

    // Workspace
    workspaceTabsContainer: document.getElementById("workspace-tabs-container"),
    questionDetails: document.getElementById("question-details"),
    sessionTimer: document.getElementById("session-timer"),
    btnRunCode: document.getElementById("btn-run-code"),
    btnSaveCode: document.getElementById("btn-save-code"),
    btnSubmitMock: document.getElementById("btn-submit-mock"),
    langSelect: document.getElementById("lang-select"),
    consoleOutputBox: document.getElementById("console-output-box"),
    btnClearConsole: document.getElementById("btn-clear-console"),

    // Report
    reportScoreNum: document.getElementById("report-score-num"),
    reportRingFg: document.getElementById("report-ring-fg"),
    reportGrade: document.getElementById("report-grade"),
    reportValCorrectness: document.getElementById("report-val-correctness"),
    reportValTime: document.getElementById("report-val-time"),
    reportValSpace: document.getElementById("report-val-space"),
    reportFillCorrectness: document.getElementById("report-fill-correctness"),
    reportFillTime: document.getElementById("report-fill-time"),
    reportFillSpace: document.getElementById("report-fill-space"),
    reportQuestionsContainer: document.getElementById("report-questions-container"),
    btnReportClose: document.getElementById("btn-report-close")
};

// --- Initialization ---
window.addEventListener("DOMContentLoaded", () => {
    loadStateFromStorage();
    setupEventListeners();
    renderDashboardStats();
    populateLibraryTable();
});

// Monaco initialization callback hook
window.onMonacoLoad = () => {
    if (state.currentPanel === "workspace") {
        loadQuestionCodeTemplate();
    }
};

// --- Navigation ---
function switchPanel(panelName) {
    state.currentPanel = panelName;

    // Hide all
    DOM.panelDashboard.classList.remove("active");
    DOM.panelLibrary.classList.remove("active");
    DOM.panelWorkspace.classList.remove("active");
    DOM.panelReport.classList.remove("active");

    DOM.btnNavDashboard.classList.remove("active");
    DOM.btnNavLibrary.classList.remove("active");

    // Show active
    if (panelName === "dashboard") {
        DOM.panelDashboard.classList.add("active");
        DOM.btnNavDashboard.classList.add("active");
        renderDashboardStats();
    } else if (panelName === "library") {
        DOM.panelLibrary.classList.add("active");
        DOM.btnNavLibrary.classList.add("active");
        populateLibraryTable();
    } else if (panelName === "workspace") {
        DOM.panelWorkspace.classList.add("active");
    } else if (panelName === "report") {
        DOM.panelReport.classList.add("active");
    }
}

// --- Setup Actions & Events ---
function setupEventListeners() {
    // Navigation
    DOM.btnNavDashboard.addEventListener("click", () => {
        if (state.timerInterval) {
            if (confirm("You are currently in an active mock session. Navigating away will NOT pause the timer. Proceed?")) {
                switchPanel("dashboard");
            }
        } else {
            switchPanel("dashboard");
        }
    });

    DOM.btnNavLibrary.addEventListener("click", () => {
        if (state.timerInterval) {
            if (confirm("You are currently in an active mock session. Navigating away will NOT pause the timer. Proceed?")) {
                switchPanel("library");
            }
        } else {
            switchPanel("library");
        }
    });

    // Start mock button
    DOM.btnStartMock.addEventListener("click", () => {
        startMockSession();
    });

    // Library Filtering
    DOM.libSearch.addEventListener("input", filterLibrary);
    DOM.libFilterDifficulty.addEventListener("change", filterLibrary);
    DOM.libFilterCompany.addEventListener("change", filterLibrary);
    DOM.libFilterCategory.addEventListener("change", filterLibrary);

    // Workspace Editor controls
    DOM.btnRunCode.addEventListener("click", runActiveQuestion);
    DOM.btnSaveCode.addEventListener("click", saveActiveQuestionCode);
    DOM.btnSubmitMock.addEventListener("click", finishMockSession);
    DOM.btnClearConsole.addEventListener("click", () => {
        DOM.consoleOutputBox.innerHTML = '<div class="console-message system">Console cleared.</div>';
    });

    // Report returning
    DOM.btnReportClose.addEventListener("click", () => {
        switchPanel("dashboard");
    });
}

// --- Local Storage Management ---
function loadStateFromStorage() {
    try {
        const historyData = localStorage.getItem("portal_mock_history");
        if (historyData) {
            state.mockHistory = JSON.parse(historyData);
        }
    } catch (e) {
        console.error("Failed to load history data", e);
    }
}

function saveHistoryToStorage() {
    try {
        localStorage.setItem("portal_mock_history", JSON.stringify(state.mockHistory));
    } catch (e) {
        console.error("Failed to save history", e);
    }
}

// --- Dashboard Rendering ---
function renderDashboardStats() {
    // Calculate Stats
    const totalMocks = state.mockHistory.length;
    DOM.statMocksCount.innerText = totalMocks;

    if (totalMocks > 0) {
        const sumScore = state.mockHistory.reduce((acc, curr) => acc + curr.score, 0);
        DOM.statAvgScore.innerText = `${Math.round(sumScore / totalMocks)}%`;

        // count solved questions: unique questionIds where score >= 70 (passed correctness)
        const solvedQuestions = new Set();
        state.mockHistory.forEach(hist => {
            Object.keys(hist.results).forEach(qId => {
                if (hist.results[qId].correctnessScore >= 70) {
                    solvedQuestions.add(qId);
                }
            });
        });
        DOM.statSolvedCount.innerText = solvedQuestions.size;
    } else {
        DOM.statAvgScore.innerText = "--";
        DOM.statSolvedCount.innerText = "0";
    }

    // Render Past History List
    DOM.historyContainer.innerHTML = "";
    if (totalMocks === 0) {
        DOM.historyContainer.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-folder-open"></i>
                <p>No mock interviews taken yet. Click start to begin your placement preparation!</p>
            </div>
        `;
    } else {
        // Render in reverse chronological order
        const sortedHistory = [...state.mockHistory].reverse();
        sortedHistory.forEach((item, index) => {
            const dateStr = new Date(item.timestamp).toLocaleDateString(undefined, {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            const qCount = Object.keys(item.results).length;
            const badgeClass = getScoreBadgeClass(item.score);
            const badgeLabel = getScoreBadgeLabel(item.score);

            const div = document.createElement("div");
            div.className = "history-item";
            div.innerHTML = `
                <div class="hist-left">
                    <h4>${item.isPractice ? "Practice Session" : "Mock Coding Assessment"}</h4>
                    <div class="hist-meta">
                        <span><i class="fa-regular fa-clock"></i> ${dateStr}</span>
                        <span><i class="fa-solid fa-code"></i> ${qCount} Questions</span>
                    </div>
                </div>
                <div class="hist-right">
                    <div class="hist-score">
                        <span class="score-num">${item.score}</span>
                        <span class="score-total">/100</span>
                    </div>
                    <span class="hist-badge ${badgeClass}">${badgeLabel}</span>
                    <button class="btn btn-secondary btn-sm" onclick="viewHistoricalReport(${state.mockHistory.length - 1 - index})">
                        <i class="fa-solid fa-file-invoice"></i> View Report
                    </button>
                </div>
            `;
            DOM.historyContainer.appendChild(div);
        });
    }
}

function getScoreBadgeClass(score) {
    if (score >= 90) return "badge-excellent";
    if (score >= 70) return "badge-good";
    if (score >= 50) return "badge-average";
    return "badge-poor";
}

function getScoreBadgeLabel(score) {
    if (score >= 90) return "Outstanding";
    if (score >= 70) return "Proficient";
    if (score >= 50) return "Developing";
    return "Needs Focus";
}

// --- Question Library Management ---
function populateLibraryTable() {
    DOM.libTableBody.innerHTML = "";

    QUESTIONS.forEach(q => {
        const tr = document.createElement("tr");
        tr.setAttribute("data-id", q.id);
        tr.innerHTML = `
            <td><strong>${q.title}</strong></td>
            <td><span class="company-tag ${q.company.toLowerCase()}"><i class="fa-solid fa-building"></i> ${q.company}</span></td>
            <td>${q.category}</td>
            <td><span class="diff-badge ${getDiffClass(q.difficulty)}">${q.difficulty}</span></td>
            <td><span class="code-type">${q.targetTime}</span> / <span class="code-type">${q.targetSpace}</span></td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="startPracticeSingle('${q.id}')">
                    <i class="fa-solid fa-dumbbell"></i> Practice
                </button>
            </td>
        `;
        DOM.libTableBody.appendChild(tr);
    });
}

function getDiffClass(diff) {
    if (diff === "Easy") return "diff-easy";
    if (diff === "Medium") return "diff-medium";
    return "diff-hard";
}

function filterLibrary() {
    const searchVal = DOM.libSearch.value.toLowerCase();
    const diffVal = DOM.libFilterDifficulty.value;
    const compVal = DOM.libFilterCompany.value;
    const catVal = DOM.libFilterCategory.value;

    const rows = DOM.libTableBody.getElementsByTagName("tr");

    for (let row of rows) {
        const qId = row.getAttribute("data-id");
        const q = QUESTIONS.find(x => x.id === qId);

        if (!q) continue;

        const matchesSearch = q.title.toLowerCase().includes(searchVal) || q.description.toLowerCase().includes(searchVal);
        const matchesDiff = diffVal === "all" || q.difficulty === diffVal;
        const matchesComp = compVal === "all" || q.company === compVal;
        const matchesCat = catVal === "all" || q.category === catVal;

        if (matchesSearch && matchesDiff && matchesComp && matchesCat) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }
    }
}

// --- Mock Interview Session Flow ---
function startMockSession() {
    // Select 6 random questions: 2 Easy, 2 Medium, 2 Hard
    const easyQ = QUESTIONS.filter(q => q.difficulty === "Easy");
    const medQ = QUESTIONS.filter(q => q.difficulty === "Medium");
    const hardQ = QUESTIONS.filter(q => q.difficulty === "Hard");

    if (easyQ.length < 2 || medQ.length < 2 || hardQ.length < 2) {
        alert("Not enough questions loaded in database to create balanced mock.");
        return;
    }

    const selected = [
        ...getRandomSubset(easyQ, 2),
        ...getRandomSubset(medQ, 2),
        ...getRandomSubset(hardQ, 2)
    ];

    // Shuffle slightly so difficulties are mixed in order
    selected.sort(() => Math.random() - 0.5);

    state.mockQuestions = selected;
    state.activeQuestionIdx = 0;
    state.codeSubmissions = {};
    state.isPracticeMode = false;
    state.activePracticeQuestion = null;

    // Reset code templates
    selected.forEach(q => {
        state.codeSubmissions[q.id] = {
            code: q.starterCode.javascript,
            lang: "javascript",
            saved: false,
            evaluation: null
        };
    });

    // Configure Workspace UI
    DOM.btnSubmitMock.style.display = "";
    DOM.sessionTimer.style.display = "";

    // Start countdown timer: 90 minutes
    startTimer(90 * 60);

    // Switch Panel
    switchPanel("workspace");

    // Render Workspace UI components
    renderWorkspaceTabs();
    loadQuestion(0);
}

function startPracticeSingle(qId) {
    const q = QUESTIONS.find(x => x.id === qId);
    if (!q) return;

    state.mockQuestions = [q];
    state.activeQuestionIdx = 0;
    state.codeSubmissions = {};
    state.isPracticeMode = true;
    state.activePracticeQuestion = q;

    state.codeSubmissions[q.id] = {
        code: q.starterCode.javascript,
        lang: "javascript",
        saved: false,
        evaluation: null
    };

    // Configure practice UI (hide countdown and mock submit)
    DOM.btnSubmitMock.style.display = "none";
    DOM.sessionTimer.style.display = "none";
    if (state.timerInterval) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
    }

    switchPanel("workspace");
    renderWorkspaceTabs();
    loadQuestion(0);
}

function getRandomSubset(arr, size) {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, size);
}

// Timer Logic
function startTimer(durationSeconds) {
    if (state.timerInterval) {
        clearInterval(state.timerInterval);
    }
    state.timeLeft = durationSeconds;
    updateTimerDisplay();

    state.timerInterval = setInterval(() => {
        state.timeLeft--;
        updateTimerDisplay();

        if (state.timeLeft <= 0) {
            clearInterval(state.timerInterval);
            state.timerInterval = null;
            alert("Time is up! Your solutions will be automatically graded.");
            autoSubmitMock();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(state.timeLeft / 60);
    const seconds = state.timeLeft % 60;
    const minutesStr = minutes < 10 ? "0" + minutes : minutes;
    const secondsStr = seconds < 10 ? "0" + seconds : seconds;
    DOM.sessionTimer.innerHTML = `<i class="fa-regular fa-clock"></i> ${minutesStr}:${secondsStr}`;

    // Danger color if under 5 minutes
    if (state.timeLeft < 5 * 60) {
        DOM.sessionTimer.style.background = "rgba(239,68,68,0.2)";
    } else {
        DOM.sessionTimer.style.background = "rgba(239,68,68,0.1)";
    }
}

// Workspace UI Render
function renderWorkspaceTabs() {
    DOM.workspaceTabsContainer.innerHTML = "";

    state.mockQuestions.forEach((q, idx) => {
        const btn = document.createElement("button");
        btn.className = `tab-btn ${idx === state.activeQuestionIdx ? 'active' : ''}`;

        const isSaved = state.codeSubmissions[q.id]?.saved;
        btn.innerHTML = `
            <i class="${isSaved ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'}"></i> 
            Q${idx + 1}: ${q.title.substring(0, 14)}${q.title.length > 14 ? '..' : ''}
        `;

        btn.addEventListener("click", () => {
            // Save current code
            saveActiveQuestionCode();
            // Load selected
            loadQuestion(idx);
        });

        DOM.workspaceTabsContainer.appendChild(btn);
    });
}

function loadQuestion(idx) {
    state.activeQuestionIdx = idx;
    const q = state.mockQuestions[idx];

    // Highlight correct tab
    const tabs = DOM.workspaceTabsContainer.getElementsByClassName("tab-btn");
    for (let i = 0; i < tabs.length; i++) {
        if (i === idx) {
            tabs[i].classList.add("active");
        } else {
            tabs[i].classList.remove("active");
        }
    }

    // Populate details panel
    DOM.questionDetails.innerHTML = `
        <div class="question-header">
            <h2>${q.title}</h2>
            <div class="q-meta-row">
                <span class="company-tag ${q.company.toLowerCase()}"><i class="fa-solid fa-building"></i> ${q.company}</span>
                <span class="company-tag"><i class="fa-solid fa-tags"></i> ${q.category}</span>
                <span class="diff-badge ${getDiffClass(q.difficulty)}">${q.difficulty}</span>
            </div>
        </div>
        
        <div class="q-desc">${q.description}</div>
        
        <div class="q-section-title">Input Format</div>
        <div class="q-detail-text">${q.inputFormat}</div>
        
        <div class="q-section-title">Output Format</div>
        <div class="q-detail-text">${q.outputFormat}</div>
        
        <div class="q-section-title">Constraints</div>
        <div class="q-detail-text">${q.constraints}</div>
        
        <div class="q-section-title">Target Complexity</div>
        <div class="q-detail-text">Time: <span class="code-type">${q.targetTime}</span> &nbsp;|&nbsp; Space: <span class="code-type">${q.targetSpace}</span></div>
        
        <div class="q-section-title">Example Test Cases</div>
        ${q.testCases.map((tc, index) => {
        const displayInput = JSON.stringify(tc.input).substring(1, JSON.stringify(tc.input).length - 1);
        return `
                <div class="example-block">
                    <strong>Test Case ${index + 1}:</strong><br>
                    Input: <code>${displayInput}</code><br>
                    Expected Output: <code>${JSON.stringify(tc.expected)}</code>
                </div>
            `;
    }).join('')}
    `;

    // Load code into editor
    loadQuestionCodeTemplate();

    // Reset console output
    DOM.consoleOutputBox.innerHTML = `
        <div class="console-message system">Loaded workspace for ${q.title}. Click "Run Code" to test against examples.</div>
    `;
}

function loadQuestionCodeTemplate() {
    if (!window.isMonacoReady || !monacoEditorInstance) return;

    const q = state.mockQuestions[state.activeQuestionIdx];
    const sub = state.codeSubmissions[q.id];

    monacoEditorInstance.setValue(sub.code);

    // Set Editor language
    const model = monacoEditorInstance.getModel();
    if (model) {
        monaco.editor.setModelLanguage(model, sub.lang);
    }
}

function saveActiveQuestionCode() {
    if (!window.isMonacoReady || !monacoEditorInstance) return;

    const q = state.mockQuestions[state.activeQuestionIdx];
    const code = monacoEditorInstance.getValue();

    state.codeSubmissions[q.id].code = code;
    state.codeSubmissions[q.id].saved = true;

    renderWorkspaceTabs();
}

// --- Sandbox Runner ---
async function runActiveQuestion() {
    if (!window.isMonacoReady || !monacoEditorInstance) return;

    const q = state.mockQuestions[state.activeQuestionIdx];
    const code = monacoEditorInstance.getValue();

    // Save state
    state.codeSubmissions[q.id].code = code;

    writeConsole("Executing code against sample test cases...", "info");

    // Run evaluation against the evaluator (which calls the worker)
    const result = await evaluateQuestion(code, q);

    if (result.testResults.length === 0) {
        writeConsole(result.feedback, "error");
        return;
    }

    // Output results to console
    let allPassed = true;
    let htmlResult = `<div class="console-tc-report">`;

    result.testResults.forEach((tc, idx) => {
        const passed = tc.passed;
        if (!passed) allPassed = false;

        const tcLabel = `Test Case ${idx + 1}`;
        const status = passed ? `<span class="tc-passed">PASSED</span>` : `<span class="tc-failed">FAILED</span>`;
        const timeTaken = tc.duration !== undefined ? `${tc.duration}ms` : "N/A";

        htmlResult += `
            <div class="tc-row">
                <span><strong>${tcLabel}:</strong> ${status} (${timeTaken})</span>
            </div>
            ${!passed && tc.error ? `<div class="console-message error" style="margin-left: 10px;">Error: ${tc.error}</div>` : ''}
            ${!passed && !tc.error ? `<div class="console-message log" style="margin-left: 10px;">Expected: ${JSON.stringify(q.testCases[idx].expected)} | Got: ${JSON.stringify(tc.output)}</div>` : ''}
        `;
    });

    htmlResult += `</div>`;

    DOM.consoleOutputBox.innerHTML += htmlResult;

    if (allPassed) {
        writeConsole(`✔ Success! All sample test cases passed. Code is functionally correct.`, "success");
    } else {
        writeConsole(`❌ Failed! Some test cases failed. Please review your logic.`, "error");
    }

    // Append complexity timing analysis preview
    writeConsole(`Estimated Time Complexity: ${result.detectedTime} | Target: ${q.targetTime}`, "info");
    writeConsole(`Estimated Space Complexity: ${result.detectedSpace} | Target: ${q.targetSpace}`, "info");

    // Auto-scroll console
    DOM.consoleOutputBox.scrollTop = DOM.consoleOutputBox.scrollHeight;
}

function writeConsole(msg, type = "log") {
    const div = document.createElement("div");
    div.className = `console-message ${type}`;
    div.innerText = msg;
    DOM.consoleOutputBox.appendChild(div);
    DOM.consoleOutputBox.scrollTop = DOM.consoleOutputBox.scrollHeight;
}

// --- Submit & Evaluation Portal Flow ---
async function finishMockSession() {
    if (state.timerInterval) {
        const emptyAnswers = state.mockQuestions.filter(q => {
            const sub = state.codeSubmissions[q.id];
            return !sub || sub.code === q.starterCode.javascript || sub.code.trim() === "";
        });

        let confirmMsg = "Are you sure you want to end this mock interview?";
        if (emptyAnswers.length > 0) {
            confirmMsg += `\nWarning: You have ${emptyAnswers.length} unanswered questions. They will receive a 0 score.`;
        }

        if (!confirm(confirmMsg)) {
            return;
        }
    }

    // Stop timer
    if (state.timerInterval) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
    }

    // Show a loading screen in console
    DOM.consoleOutputBox.innerHTML = `
        <div class="console-message info"><i class="fa-solid fa-spinner fa-spin"></i> Triggering portal evaluation framework... Please wait. Evaluating 6 questions.</div>
    `;

    // Save final code in editor
    saveActiveQuestionCode();

    // Grade all 6 questions in parallel
    const gradingPromises = state.mockQuestions.map(async q => {
        const sub = state.codeSubmissions[q.id];
        // If code hasn't changed from starter code, score is 0
        if (!sub || sub.code.trim() === "" || sub.code === q.starterCode.javascript) {
            return {
                questionId: q.id,
                evaluation: {
                    score: 0,
                    correctnessScore: 0,
                    timeScore: 0,
                    spaceScore: 0,
                    detectedTime: "N/A",
                    detectedSpace: "N/A",
                    feedback: "No solution submitted for this question.",
                    testResults: []
                }
            };
        }

        const evalResult = await evaluateQuestion(sub.code, q);
        return {
            questionId: q.id,
            evaluation: evalResult
        };
    });

    const evaluations = await Promise.all(gradingPromises);

    // Populate back into submissions state
    evaluations.forEach(ev => {
        state.codeSubmissions[ev.questionId].evaluation = ev.evaluation;
    });

    // Calculate overall scoring aggregates
    const totalScore = evaluations.reduce((acc, curr) => acc + curr.evaluation.score, 0);
    const avgScore = Math.round(totalScore / evaluations.length);

    const correctnessAvg = Math.round(evaluations.reduce((acc, curr) => acc + curr.evaluation.correctnessScore, 0) / evaluations.length);
    const timeAvg = Math.round(evaluations.reduce((acc, curr) => acc + curr.evaluation.timeScore, 0) / evaluations.length);
    const spaceAvg = Math.round(evaluations.reduce((acc, curr) => acc + curr.evaluation.spaceScore, 0) / evaluations.length);

    // Save attempt to history database
    const attempt = {
        timestamp: Date.now(),
        score: avgScore,
        correctnessScore: correctnessAvg,
        timeScore: timeAvg,
        spaceScore: spaceAvg,
        isPractice: state.isPracticeMode,
        results: {}
    };

    evaluations.forEach(ev => {
        attempt.results[ev.questionId] = ev.evaluation;
    });

    state.mockHistory.push(attempt);
    saveHistoryToStorage();

    // Render report and switch views
    renderReport(attempt);
    switchPanel("report");
}

async function autoSubmitMock() {
    // When time expires, submit automatically
    finishMockSession();
}

// --- Report Panel Rendering ---
function renderReport(attempt) {
    // Score ring percentage
    DOM.reportScoreNum.innerText = attempt.score;

    // Animate score ring SVG dashoffset
    // Perimeter of R=70 circle is 2 * PI * 70 = ~439.82
    const offset = 440 - (440 * attempt.score) / 100;
    DOM.reportRingFg.style.strokeDashoffset = offset;

    // Set grade labels
    DOM.reportGrade.innerText = getScoreBadgeLabel(attempt.score);
    DOM.reportGrade.className = "grade-label " + getScoreBadgeClass(attempt.score);

    // Metric bars values
    DOM.reportValCorrectness.innerText = `${attempt.correctnessScore}%`;
    DOM.reportValTime.innerText = `${attempt.timeScore}%`;
    DOM.reportValSpace.innerText = `${attempt.spaceScore}%`;

    DOM.reportFillCorrectness.style.width = `${attempt.correctnessScore}%`;
    DOM.reportFillTime.style.width = `${attempt.timeScore}%`;
    DOM.reportFillSpace.style.width = `${attempt.spaceScore}%`;

    // Render individual question list breakdown
    DOM.reportQuestionsContainer.innerHTML = "";

    const qIds = Object.keys(attempt.results);
    qIds.forEach((qId, index) => {
        const q = QUESTIONS.find(x => x.id === qId);
        if (!q) return;
        const res = attempt.results[qId];

        const isCorrect = res.correctnessScore >= 70;
        const statusIcon = isCorrect ? 'fa-solid fa-circle-check text-success' : 'fa-solid fa-triangle-exclamation text-warning';

        const accordion = document.createElement("div");
        accordion.className = "accordion-item";
        accordion.innerHTML = `
            <div class="accordion-header" onclick="toggleReportAccordion(this)">
                <div class="acc-title-col">
                    <i class="${statusIcon}"></i>
                    <div>
                        <h4>Q${index + 1}: ${q.title}</h4>
                        <span class="company-tag ${q.company.toLowerCase()}">${q.company}</span>
                        <span class="diff-badge ${getDiffClass(q.difficulty)}">${q.difficulty}</span>
                    </div>
                </div>
                <div class="acc-status-col">
                    <div class="acc-score">${res.score} <span style="font-size: 0.75rem; color: var(--text-muted)">/100</span></div>
                    <i class="fa-solid fa-chevron-down acc-toggle-icon"></i>
                </div>
            </div>
            
            <div class="accordion-content">
                <div class="q-report-scores">
                    <div class="q-score-card">
                        <div class="lbl">Correctness</div>
                        <div class="val" style="color: var(--color-success)">${res.correctnessScore}%</div>
                    </div>
                    <div class="q-score-card">
                        <div class="lbl">Time Complexity</div>
                        <div class="val" style="color: var(--accent-cyan)">${res.detectedTime}</div>
                        <span class="lbl">(Target: ${q.targetTime})</span>
                    </div>
                    <div class="q-score-card">
                        <div class="lbl">Space Complexity</div>
                        <div class="val" style="color: var(--accent-purple)">${res.detectedSpace}</div>
                        <span class="lbl">(Target: ${q.targetSpace})</span>
                    </div>
                </div>
                
                <div class="q-feedback-text">
                    ${formatFeedbackMarkdown(res.feedback)}
                </div>
            </div>
        `;
        DOM.reportQuestionsContainer.appendChild(accordion);
    });
}

function toggleReportAccordion(headerElement) {
    const item = headerElement.parentElement;
    item.classList.toggle("active");
}

function viewHistoricalReport(historyIndex) {
    const attempt = state.mockHistory[historyIndex];
    if (!attempt) return;
    renderReport(attempt);
    switchPanel("report");
}

// Convert simple markdown styling from feedback strings into HTML elements
function formatFeedbackMarkdown(text) {
    return text
        .replace(/\n/g, '<br>')
        .replace(/\*\*([\s\S]*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([\s\S]*?)\*/g, '<em>$1</em>')
        .replace(/`([\s\S]*?)`/g, '<code>$1</code>')
        .replace(/### ([\s\S]*?)<br>/g, '<h3>$1</h3>')
        .replace(/🎉/g, '🎉')
        .replace(/⚠️/g, '⚠️')
        .replace(/💡/g, '💡');
}
