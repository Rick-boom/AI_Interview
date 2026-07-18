const API_BASE = "http://localhost:8000/api/interview";

async function startMockSession() {
    DOM.consoleOutputBox.innerHTML = '<div class="console-message info"><i class="fa-solid fa-spinner fa-spin"></i> Starting session on backend...</div>';
    DOM.btnSubmitMock.disabled = true;
    
    try {
        const res = await fetch(`${API_BASE}/start`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ candidate_name: "Candidate", num_questions: 6, difficulty: null, topic: null })
        });
        const data = await res.json();
        
        state.sessionId = data.session_id;
        state.totalQuestions = data.total_questions;
        state.isPracticeMode = false;
        
        state.mockQuestions = [formatBackendQuestion(data.question)];
        state.activeQuestionIdx = 0;
        state.codeSubmissions = {};
        
        const q = state.mockQuestions[0];
        state.codeSubmissions[q.id] = {
            code: q.starterCode.python,
            lang: "python",
            saved: false,
            evaluation: null
        };
        
        DOM.btnSubmitMock.style.display = "";
        DOM.btnSubmitMock.disabled = false;
        DOM.sessionTimer.style.display = "";
        
        DOM.workspaceTabsContainer.innerHTML = `<button class="tab-btn active"><i class="fa-solid fa-circle-check"></i> Question 1 of ${state.totalQuestions}</button>`;
        
        startTimer(90 * 60);
        switchPanel("workspace");
        loadQuestion(0);
        
    } catch(e) {
        alert("Failed to start session: " + e.message);
        DOM.btnSubmitMock.disabled = false;
    }
}

function formatBackendQuestion(bq) {
    return {
        id: bq.id,
        title: bq.title,
        company: (bq.company_tags && bq.company_tags[0]) || "General",
        category: bq.topic || "Algorithms",
        difficulty: bq.difficulty || "Medium",
        description: bq.prompt,
        inputFormat: "",
        outputFormat: "",
        constraints: bq.constraints || "None",
        targetTime: "Optimal",
        targetSpace: "Optimal",
        testCases: [],
        starterCode: {
            python: bq.starter_code
        }
    };
}

function loadQuestion(idx) {
    state.activeQuestionIdx = idx;
    const q = state.mockQuestions[idx];

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
        
        <div class="q-section-title">Constraints</div>
        <div class="q-detail-text">${q.constraints}</div>
    `;

    loadQuestionCodeTemplate();

    DOM.consoleOutputBox.innerHTML = `
        <div class="console-message system">Loaded workspace for ${q.title}. Click "Submit & Next" when you are done.</div>
    `;
}

async function finishMockSession() {
    const q = state.mockQuestions[state.activeQuestionIdx];
    saveActiveQuestionCode();
    const sub = state.codeSubmissions[q.id];
    
    DOM.consoleOutputBox.innerHTML += `<div class="console-message info"><i class="fa-solid fa-spinner fa-spin"></i> Submitting to backend for evaluation...</div>`;
    DOM.consoleOutputBox.scrollTop = DOM.consoleOutputBox.scrollHeight;
    DOM.btnSubmitMock.disabled = true;
    
    const timeTaken = (90*60) - state.timeLeft; 
    
    try {
        const res = await fetch(`${API_BASE}/${state.sessionId}/submit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: sub.code, language: "python", time_taken_seconds: timeTaken })
        });
        
        const data = await res.json();
        const ev = data.evaluation;
        
        DOM.consoleOutputBox.innerHTML += `
            <div class="console-message log"><strong>Correctness:</strong> ${ev.correctnessScore}%</div>
            <div class="console-message log"><strong>Time Score:</strong> ${ev.timeScore} | <strong>Space Score:</strong> ${ev.spaceScore}</div>
            <div class="console-message log" style="white-space: pre-wrap;"><strong>Feedback:</strong>\n${ev.feedback}</div>
        `;
        DOM.consoleOutputBox.scrollTop = DOM.consoleOutputBox.scrollHeight;
        
        setTimeout(() => {
            if (data.is_last_question) {
                fetchAndShowReport();
            } else {
                const nq = formatBackendQuestion(data.next_question);
                state.mockQuestions.push(nq);
                state.activeQuestionIdx++;
                
                state.codeSubmissions[nq.id] = {
                    code: nq.starterCode.python,
                    lang: "python",
                    saved: false,
                    evaluation: null
                };
                
                DOM.workspaceTabsContainer.innerHTML = `<button class="tab-btn active"><i class="fa-solid fa-circle-check"></i> Question ${state.activeQuestionIdx + 1} of ${state.totalQuestions}</button>`;
                
                loadQuestion(state.activeQuestionIdx);
                DOM.btnSubmitMock.disabled = false;
            }
        }, 3000);
        
    } catch(e) {
        DOM.consoleOutputBox.innerHTML += `<div class="console-message error">Failed to submit: ${e.message}</div>`;
        DOM.btnSubmitMock.disabled = false;
    }
}

async function fetchAndShowReport() {
    DOM.consoleOutputBox.innerHTML += `<div class="console-message info">Generating final report...</div>`;
    DOM.consoleOutputBox.scrollTop = DOM.consoleOutputBox.scrollHeight;
    
    try {
        const res = await fetch(`${API_BASE}/${state.sessionId}/report`);
        const report = await res.json();
        
        DOM.reportScoreNum.innerText = report.overall_score;
        const offset = 440 - (440 * report.overall_score) / 100;
        DOM.reportRingFg.style.strokeDashoffset = offset;
        
        DOM.reportGrade.innerText = getScoreBadgeLabel(report.overall_score);
        DOM.reportGrade.className = "grade-label " + getScoreBadgeClass(report.overall_score);
        
        let cAvg = 0, tAvg = 0, sAvg = 0;
        if(report.evaluations.length > 0) {
             cAvg = Math.round(report.evaluations.reduce((a,c) => a + c.correctnessScore, 0) / report.evaluations.length);
             tAvg = Math.round(report.evaluations.reduce((a,c) => a + c.timeScore, 0) / report.evaluations.length);
             sAvg = Math.round(report.evaluations.reduce((a,c) => a + c.spaceScore, 0) / report.evaluations.length);
        }
        
        DOM.reportValCorrectness.innerText = `${cAvg}%`;
        DOM.reportValTime.innerText = `${tAvg}%`;
        DOM.reportValSpace.innerText = `${sAvg}%`;
        
        DOM.reportFillCorrectness.style.width = `${cAvg}%`;
        DOM.reportFillTime.style.width = `${tAvg}%`;
        DOM.reportFillSpace.style.width = `${sAvg}%`;
        
        DOM.reportQuestionsContainer.innerHTML = "";
        
        report.evaluations.forEach((ev, i) => {
            const q = state.mockQuestions[i] || { title: "Question", company: "General", difficulty: "Medium", targetTime: "?", targetSpace: "?" };
            const isCorrect = ev.correctnessScore >= 70;
            const statusIcon = isCorrect ? 'fa-solid fa-circle-check text-success' : 'fa-solid fa-triangle-exclamation text-warning';
            
            const div = document.createElement("div");
            div.className = "accordion-item";
            div.innerHTML = `
                <div class="accordion-header" onclick="this.parentElement.classList.toggle('active')">
                    <div class="acc-title-col">
                        <i class="${statusIcon}"></i>
                        <div>
                            <h4>Q${i + 1}: ${q.title}</h4>
                        </div>
                    </div>
                    <div class="acc-status-col">
                        <div class="acc-score">${ev.score} <span style="font-size: 0.75rem; color: var(--text-muted)">/100</span></div>
                        <i class="fa-solid fa-chevron-down acc-toggle-icon"></i>
                    </div>
                </div>
                <div class="accordion-content">
                     <div class="q-report-scores">
                        <div class="q-score-card"><div class="lbl">Correctness</div><div class="val">${ev.correctnessScore}%</div></div>
                        <div class="q-score-card"><div class="lbl">Time Score</div><div class="val">${ev.timeScore}%</div></div>
                        <div class="q-score-card"><div class="lbl">Space Score</div><div class="val">${ev.spaceScore}%</div></div>
                     </div>
                     <div class="q-feedback-text" style="white-space: pre-wrap; margin-top: 15px;">${ev.feedback}</div>
                </div>
            `;
            DOM.reportQuestionsContainer.appendChild(div);
        });
        
        if(state.timerInterval) clearInterval(state.timerInterval);
        switchPanel("report");
        DOM.btnSubmitMock.disabled = false;
        
    } catch(e) {
        alert("Failed to get report: " + e.message);
        DOM.btnSubmitMock.disabled = false;
    }
}
