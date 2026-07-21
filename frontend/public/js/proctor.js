// js/proctor.js — Intelligent Proctoring Engine v2
// Design Principles:
//   1. Debounce: Same incident type has a minimum cooldown window
//   2. Grace Period: No incidents logged in first 12 seconds after session start
//   3. Smart Camera: Canvas heuristic only fires if camera stream is ACTUALLY active and playing
//   4. Severity System: LOW / MEDIUM / HIGH / CRITICAL — each has different cooldowns
//   5. Risk Scoring: Weighted cumulative score, not raw count
//   6. Monaco Exemption: Clipboard events inside Monaco don't count as suspicious
//   7. Pattern Detection: Repeated same-type incidents escalate severity
//   8. DevTools: Removed flaky resize heuristic, use focused timing approach instead

class ProctorEngine {
    constructor() {
        this.incidents      = [];
        this.mediaStream    = null;
        this.screenStream   = null;
        this.cameraActive   = false;
        this.screenActive   = false;

        // Intelligence layer
        this._riskScore     = 0;
        this._lastSeen      = {};           // type → timestamp of last log
        this._incidentCount = {};           // type → count of times logged (for escalation)
        this._sessionStart  = null;         // set on startAll()
        this._gracePeriodMs = 12000;        // first 12s: no incidents

        // Cooldown windows (ms) per severity
        this._cooldowns = {
            LOW:      60000,   // 1 min between same low-severity event
            MEDIUM:   30000,   // 30s between medium events
            HIGH:     15000,   // 15s between high events
            CRITICAL:  5000,   // 5s between critical (face gone is critical)
        };

        // Severity of each incident type
        this._severity = {
            FACE_NOT_DETECTED:     'HIGH',
            CANDIDATE_ABSENT:      'HIGH',
            MULTIPLE_FACES:        'CRITICAL',
            TAB_SWITCH:            'HIGH',
            WINDOW_BLUR:           'LOW',       // Often caused by browser itself
            CLIPBOARD_PASTE:       'MEDIUM',
            CLIPBOARD_COPY:        'LOW',
            CLIPBOARD_CUT:         'LOW',
            SCREEN_SHARE_STOPPED:  'HIGH',
            CAMERA_DENIED:         'MEDIUM',
            SCREEN_SHARE_DENIED:   'LOW',
            CAMERA_UNAVAILABLE:    'LOW',
            SCREEN_UNAVAILABLE:    'LOW',
        };

        // Risk weights per severity
        this._weights = { LOW: 1, MEDIUM: 3, HIGH: 8, CRITICAL: 15 };

        // Face detection state
        this._faceDetector   = null;
        this._diffCanvas     = null;
        this._diffCtx        = null;
        this._prevFrame      = null;
        this._faceInterval   = null;
        this._consecutiveNoFace = 0;
        this._videoEl        = null;
        this._statusBar      = null;
        this._videoReady     = false;      // true only when video stream is playing
        this._tabHiddenAt    = null;       // timestamp when tab was hidden
    }

    // ── Public API ─────────────────────────────────────────────────────────────

    async startAll() {
        this._sessionStart = Date.now();
        this._videoEl      = document.getElementById('proctor-video');
        this._statusBar    = document.getElementById('proctor-status-bar');

        await Promise.allSettled([
            this._startCamera(),
            this._startScreenShare(),
        ]);

        this._initTabMonitoring();
        this._initClipboardMonitoring();
        this._initDraggableCamera();
        this._updateStatusBar();
        this._showStatusBar();
    }

    stopAll() {
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(t => t.stop());
            this.mediaStream = null;
        }
        if (this.screenStream) {
            this.screenStream.getTracks().forEach(t => t.stop());
            this.screenStream = null;
        }
        if (this._faceInterval) {
            clearInterval(this._faceInterval);
            this._faceInterval = null;
        }
        this._videoReady = false;

        if (this._videoEl) {
            this._videoEl.srcObject = null;
            this._videoEl.closest?.('.proctor-cam-pip')?.classList.add('hidden');
        }
        this._hideStatusBar();
    }

    getMetadata() {
        return {
            camera_active:  this.cameraActive,
            screen_active:  this.screenActive,
            risk_score:     this._riskScore,
            incident_count: this.incidents.length,
            incidents:      this.incidents,
        };
    }

    // ── Intelligent Incident Logging ───────────────────────────────────────────

    /**
     * Log an incident with full intelligence filtering:
     *   - Grace period: ignored in first 12s
     *   - Cooldown: same type cannot fire again within its cooldown window
     *   - Escalation: if same type fires 3+ times, severity escalates one level
     */
    logIncident(type, details, forceSeverity = null) {
        const now = Date.now();

        // 1. Grace period — ignore all incidents in first 12 seconds
        if (this._sessionStart && (now - this._sessionStart) < this._gracePeriodMs) {
            return;
        }

        // 2. Cooldown check
        const severity = forceSeverity || this._severity[type] || 'LOW';
        const cooldown = this._cooldowns[severity];
        const lastSeen = this._lastSeen[type] || 0;
        if (now - lastSeen < cooldown) {
            return; // Too soon — swallow this event
        }

        // 3. Escalation — repeated incidents get bumped up in severity
        const count = (this._incidentCount[type] || 0) + 1;
        this._incidentCount[type] = count;
        this._lastSeen[type]      = now;

        let effectiveSeverity = severity;
        if (count >= 5 && severity === 'LOW')    effectiveSeverity = 'MEDIUM';
        if (count >= 4 && severity === 'MEDIUM') effectiveSeverity = 'HIGH';
        if (count >= 3 && severity === 'HIGH')   effectiveSeverity = 'CRITICAL';

        // 4. Risk score accumulation
        this._riskScore += this._weights[effectiveSeverity] || 1;

        const incident = {
            type,
            details,
            severity: effectiveSeverity,
            riskDelta: this._weights[effectiveSeverity],
            occurrence: count,
            timestamp: new Date().toISOString(),
        };
        this.incidents.push(incident);

        // 5. Update badge
        this._updateIncidentBadge();
        this._updateRiskMeter();

        console.warn(`[Proctor][${effectiveSeverity}] ${type} (#${count}):`, details);
    }

    // ── Camera ─────────────────────────────────────────────────────────────────

    async _startCamera() {
        if (!navigator.mediaDevices?.getUserMedia) {
            this.logIncident('CAMERA_UNAVAILABLE', 'getUserMedia not supported.');
            return;
        }
        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 320, height: 240, facingMode: 'user' },
                audio: false,
            });

            if (this._videoEl) {
                this._videoEl.srcObject = this.mediaStream;
                // Only start face detection AFTER video is playing real frames
                this._videoEl.addEventListener('playing', () => {
                    this._videoReady = true;
                    this._videoEl.closest?.('.proctor-cam-pip')?.classList.remove('hidden');
                    // Start face detection only here, when frames are actually available
                    this._initFaceDetection();
                }, { once: true });
                this._videoEl.play().catch(() => {});
            }

            this.cameraActive = true;
            // NOTE: _initFaceDetection() is called inside the 'playing' event listener above
            // to guarantee _videoReady = true before the loop starts

        } catch (err) {
            this.logIncident('CAMERA_DENIED', err.message);
            this.cameraActive = false;
            // Explicitly do NOT start face detection
        }
    }

    // ── Face Detection ─────────────────────────────────────────────────────────

    async _initFaceDetection() {
        if ('FaceDetector' in window) {
            try {
                this._faceDetector = new FaceDetector({ fastMode: true, maxDetectedFaces: 3 });
                this._runNativeFaceLoop();
                return;
            } catch { /* fall through */ }
        }
        this._runCanvasHeuristic();
    }

    _runNativeFaceLoop() {
        const detect = async () => {
            // Only run if video is ACTUALLY streaming
            if (!this._videoReady || !this._videoEl?.srcObject) return;
            if (this._videoEl.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) return;

            try {
                const faces = await this._faceDetector.detect(this._videoEl);

                if (faces.length === 0) {
                    this._consecutiveNoFace++;
                    // Require 8 consecutive no-face detections (~4s) before logging
                    if (this._consecutiveNoFace >= 8) {
                        this.logIncident('FACE_NOT_DETECTED', 'Candidate not visible in camera.');
                        this._consecutiveNoFace = 0;
                    }
                } else if (faces.length > 1) {
                    this._consecutiveNoFace = 0;
                    this.logIncident('MULTIPLE_FACES', `${faces.length} faces detected.`, 'CRITICAL');
                } else {
                    this._consecutiveNoFace = 0;
                }

                this._updateCamIndicator(faces.length > 0);
            } catch { /* silently ignore detection errors */ }
        };

        this._faceInterval = setInterval(detect, 500); // 2 FPS
    }

    _runCanvasHeuristic() {
        // Critical fix: canvas heuristic must ONLY run if:
        //   (a) camera stream is active and playing
        //   (b) video element has real data (readyState >= 2)
        this._diffCanvas = document.createElement('canvas');
        this._diffCanvas.width  = 80;
        this._diffCanvas.height = 60;
        this._diffCtx = this._diffCanvas.getContext('2d', { willReadFrequently: true });

        let noMotionCount    = 0;
        let motionCount      = 0;
        const MOTION_THRESHOLD  = 12;
        const NO_MOTION_FRAMES  = 12; // 6 seconds of no motion before logging

        this._faceInterval = setInterval(() => {
            // Guard: only run if camera is truly live and playing
            if (!this._videoReady) { noMotionCount = 0; this._prevFrame = null; return; }
            if (!this._videoEl?.srcObject) { noMotionCount = 0; this._prevFrame = null; return; }
            if (this._videoEl.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) return;
            if (this._videoEl.videoWidth === 0) return; // no frames decoded yet

            try {
                this._diffCtx.drawImage(this._videoEl, 0, 0, 80, 60);
                const frame = this._diffCtx.getImageData(0, 0, 80, 60).data;

                if (!this._prevFrame || this._prevFrame.length !== frame.length) {
                    this._prevFrame = new Uint8ClampedArray(frame);
                    return;
                }

                let diff = 0;
                for (let i = 0; i < frame.length; i += 16) { // sample every 4th pixel
                    diff += Math.abs(frame[i] - this._prevFrame[i]);
                }
                const mean = diff / (frame.length / 16);

                this._prevFrame = new Uint8ClampedArray(frame);

                if (mean < MOTION_THRESHOLD) {
                    noMotionCount++;
                    motionCount = 0;
                    if (noMotionCount >= NO_MOTION_FRAMES) {
                        this.logIncident('CANDIDATE_ABSENT', 'No movement in camera — candidate may be away.');
                        noMotionCount = 0;
                    }
                } else {
                    noMotionCount = 0;
                    motionCount++;
                    this._updateCamIndicator(true);
                }
            } catch { /* ignore draw errors */ }
        }, 500);
    }

    _updateCamIndicator(present) {
        const el = document.getElementById('proctor-cam-indicator');
        if (!el) return;
        el.className   = present ? 'proctor-dot proctor-dot-green' : 'proctor-dot proctor-dot-amber';
        el.title       = present ? 'Face detected' : 'Watching…';
    }

    // ── Screen Share ───────────────────────────────────────────────────────────

    async _startScreenShare() {
        if (!navigator.mediaDevices?.getDisplayMedia) {
            this.logIncident('SCREEN_UNAVAILABLE', 'getDisplayMedia not supported.');
            return;
        }
        try {
            this.screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: { frameRate: 1 },
                audio: false,
            });
            this.screenActive = true;

            const track = this.screenStream.getVideoTracks()[0];
            if (track) {
                track.onended = () => {
                    this.logIncident('SCREEN_SHARE_STOPPED', 'User ended screen share.');
                    this.screenActive = false;
                    this._updateStatusBar();
                };
            }
        } catch (err) {
            // NotAllowedError is expected — user cancelled, flag but don't crash
            this.logIncident('SCREEN_SHARE_DENIED', err.message);
            this.screenActive = false;
        }
    }

    // ── Tab / Window Monitoring ────────────────────────────────────────────────

    _initTabMonitoring() {
        // Tab visibility: only log if hidden for > 2 seconds (user switched away intentionally)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this._tabHiddenAt = Date.now();
            } else if (this._tabHiddenAt) {
                const hiddenDuration = Date.now() - this._tabHiddenAt;
                if (hiddenDuration > 2000) {
                    this.logIncident('TAB_SWITCH',
                        `Tab hidden for ${Math.round(hiddenDuration / 1000)}s.`);
                }
                this._tabHiddenAt = null;
            }
        });

        // Window blur: only log after 5s of blur (not a single accidental click)
        let blurTimer = null;
        window.addEventListener('blur', () => {
            blurTimer = setTimeout(() => {
                this.logIncident('WINDOW_BLUR', 'Interview window lost focus for 5+ seconds.');
            }, 5000);
        });
        window.addEventListener('focus', () => {
            if (blurTimer) { clearTimeout(blurTimer); blurTimer = null; }
        });
    }

    // ── Clipboard Monitoring ───────────────────────────────────────────────────

    _initClipboardMonitoring() {
        // Smart exemption: clipboard events inside Monaco editor are legitimate
        // (candidates copy/paste their own code, variable names, etc.)
        const isInsideMonaco = (e) => {
            const el = e.target;
            return el?.closest?.('.monaco-editor') != null;
        };

        document.addEventListener('paste', (e) => {
            if (isInsideMonaco(e)) return; // Monaco paste — not suspicious
            this.logIncident('CLIPBOARD_PASTE', 'Paste detected outside code editor.');
        });

        document.addEventListener('copy', (e) => {
            if (isInsideMonaco(e)) return;
            this.logIncident('CLIPBOARD_COPY', 'Copy detected outside code editor.');
        });

        document.addEventListener('cut', (e) => {
            if (isInsideMonaco(e)) return;
            this.logIncident('CLIPBOARD_CUT', 'Cut detected outside code editor.');
        });
    }

    // ── Draggable Camera PIP ───────────────────────────────────────────────────

    _initDraggableCamera() {
        const pip = document.querySelector('.proctor-cam-pip');
        const header = pip?.querySelector('.cam-pip-header');
        if (!pip || !header) return;

        let isDragging = false;
        let startX, startY, initialX, initialY;

        const pointerDown = (e) => {
            isDragging = true;
            const rect = pip.getBoundingClientRect();
            // Store the initial left/top relative to viewport
            initialX = rect.left;
            initialY = rect.top;
            startX = e.clientX;
            startY = e.clientY;

            // Remove right/bottom constraints to prevent jumping
            pip.style.right = 'auto';
            pip.style.bottom = 'auto';
            pip.style.left = `${initialX}px`;
            pip.style.top = `${initialY}px`;
            
            // Disable transition while dragging for smoothness
            pip.style.transition = 'none';

            document.addEventListener('pointermove', pointerMove);
            document.addEventListener('pointerup', pointerUp);
        };

        const pointerMove = (e) => {
            if (!isDragging) return;
            e.preventDefault(); // prevent text selection
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            // Constrain to window bounds
            const maxX = window.innerWidth - pip.offsetWidth;
            const maxY = window.innerHeight - pip.offsetHeight;
            let newX = Math.max(0, Math.min(initialX + dx, maxX));
            let newY = Math.max(0, Math.min(initialY + dy, maxY));

            pip.style.left = `${newX}px`;
            pip.style.top = `${newY}px`;
        };

        const pointerUp = () => {
            if (!isDragging) return;
            isDragging = false;
            document.removeEventListener('pointermove', pointerMove);
            document.removeEventListener('pointerup', pointerUp);
            // Restore transition for opacity/transform
            pip.style.transition = 'opacity var(--dur-normal) var(--ease-smooth), transform var(--dur-normal) var(--ease-smooth)';
        };

        header.addEventListener('pointerdown', pointerDown);
    }

    // ── UI Updates ─────────────────────────────────────────────────────────────

    _updateIncidentBadge() {
        const badge = document.getElementById('proctor-incident-count');
        if (!badge) return;
        badge.textContent = this.incidents.length;
        badge.classList.add('badge-pulse');
        setTimeout(() => badge.classList.remove('badge-pulse'), 800);
    }

    _updateRiskMeter() {
        const meter    = document.getElementById('proctor-risk-meter');
        const riskText = document.getElementById('proctor-risk-label');
        if (!meter) return;

        // Risk score → level
        let level, label, pct;
        if (this._riskScore < 10)       { level = 'safe';     label = 'Low Risk';      pct = Math.min(this._riskScore * 3, 30); }
        else if (this._riskScore < 30)  { level = 'caution';  label = 'Caution';        pct = 30 + (this._riskScore - 10) * 1.5; }
        else if (this._riskScore < 60)  { level = 'warning';  label = 'Warning';        pct = 60 + (this._riskScore - 30); }
        else                             { level = 'critical'; label = 'High Risk';      pct = 100; }

        meter.className       = `proctor-risk-bar risk-${level}`;
        meter.style.width     = `${Math.min(pct, 100)}%`;
        if (riskText) riskText.textContent = label;
    }

    _showStatusBar() { this._statusBar?.classList.remove('hidden'); }
    _hideStatusBar() { this._statusBar?.classList.add('hidden'); }

    _updateStatusBar() {
        const camIcon    = document.getElementById('proctor-cam-status');
        const screenIcon = document.getElementById('proctor-screen-status');
        if (camIcon) {
            camIcon.className = this.cameraActive ? 'proctor-status-item active' : 'proctor-status-item inactive';
        }
        if (screenIcon) {
            screenIcon.className = this.screenActive ? 'proctor-status-item active' : 'proctor-status-item inactive';
        }
    }
}

// Initialise singleton
window.proctor = new ProctorEngine();
