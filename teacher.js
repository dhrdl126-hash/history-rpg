document.addEventListener("DOMContentLoaded", () => {
  // =========================
  // 설정
  // =========================
  const TEACHER_PASSWORD = "8971";
  const EXPIRATION_MS = 12 * 60 * 60 * 1000; // 12시간
  const SUBMISSIONS_KEY = "historyRpg_submissions";
  const LOGS_KEY = "historyRpg_approvalLogs";

  // =========================
  // DOM
  // =========================
  const el = {
    authScreen: document.getElementById("auth-screen"),
    dashScreen: document.getElementById("teacher-dashboard"),
    pwdInput: document.getElementById("teacher-pwd-input"),
    btnLogin: document.getElementById("teacher-login-btn"),
    loginErr: document.getElementById("teacher-login-err"),
    btnLogout: document.getElementById("teacher-logout-btn"),
    btnBackToStudent: document.getElementById("back-to-student-btn"),
    btnStudentMode: document.getElementById("student-mode-btn"),

    statToday: document.getElementById("stat-today-subs"),
    statApproved: document.getElementById("stat-approved-subs"),
    statAvgLevel: document.getElementById("stat-avg-level"),

    top3Container: document.getElementById("top3-container"),
    smContainer: document.getElementById("student-manager-container"),
    container: document.getElementById("submission-container"),
  };

  const setText = (node, value) => {
    if (!node) return;
    node.textContent = String(value);
  };

  const safeJsonParse = (raw, fallback) => {
    try {
      const v = JSON.parse(raw);
      return v ?? fallback;
    } catch {
      return fallback;
    }
  };

  const loadSubmissions = () => {
    return safeJsonParse(localStorage.getItem(SUBMISSIONS_KEY), []);
  };

  const saveSubmissions = (subs) => {
    localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(subs));
  };

  // 학생 스탯 계산 함수 (시드 스탯 + 부여받은 스탯 파싱)
  const getStudentPower = (studentId) => {
    let seed = 0;
    for (let i = 0; i < studentId.length; i++) {
      seed += studentId.charCodeAt(i);
    }
    let str = (seed % 65) + 25;
    let int = ((seed * 7) % 65) + 25;
    let cha = ((seed * 13) % 65) + 25;

    // 로컬스토리지에서 추가 스탯 가져오기
    const savedStats = safeJsonParse(localStorage.getItem(`historyRpg_stats_${studentId}`), { str: 0, int: 0, cha: 0 });
    return (str + savedStats.str) + (int + savedStats.int) + (cha + savedStats.cha);
  };

  // =========================
  // 날짜/레벨
  // =========================
  const parseToDate = (ts) => {
    if (!ts) return null;
    const d1 = new Date(ts);
    if (!isNaN(d1.getTime())) return d1;
    const d2 = new Date(String(ts).replace(" ", "T"));
    if (!isNaN(d2.getTime())) return d2;
    return null;
  };

  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const getLevelFromExp = (exp) => {
    if (exp >= 140) return 5;
    if (exp >= 90) return 4;
    if (exp >= 50) return 3;
    if (exp >= 20) return 2;
    return 1;
  };

  const calcAverageLevel = () => {
    const expKeys = Object.keys(localStorage).filter((k) =>
      k.startsWith("historyRpg_exp_")
    );
    const n = expKeys.length || 1;
    let sum = 0;
    expKeys.forEach((k) => {
      const exp = parseInt(localStorage.getItem(k) || "0", 10) || 0;
      sum += getLevelFromExp(exp);
    });
    return (sum / n).toFixed(1);
  };

  // =========================
  // 학생 스탯 수동 관리
  // =========================
  const getRawStudentStats = (studentId) => {
    let seed = 0;
    for (let i = 0; i < studentId.length; i++) {
      seed += studentId.charCodeAt(i);
    }
    let str = (seed % 65) + 25;
    let int = ((seed * 7) % 65) + 25;
    let cha = ((seed * 13) % 65) + 25;
    return { str, int, cha };
  };

  const saveStudentManagerStats = (studentId) => {
    const elStr = document.getElementById(`sm-str-${studentId}`);
    const elInt = document.getElementById(`sm-int-${studentId}`);
    const elCha = document.getElementById(`sm-cha-${studentId}`);

    if (!elStr || !elInt || !elCha) return;

    const raw = getRawStudentStats(studentId);

    const targetStr = parseInt(elStr.value) || raw.str;
    const targetInt = parseInt(elInt.value) || raw.int;
    const targetCha = parseInt(elCha.value) || raw.cha;

    const newSavedStats = {
      str: targetStr - raw.str,
      int: targetInt - raw.int,
      cha: targetCha - raw.cha
    };

    localStorage.setItem(`historyRpg_stats_${studentId}`, JSON.stringify(newSavedStats));
    alert(`${studentId} 학생의 능력치가 수정되었습니다!`);
    render();
  };

  window.adjustStatSlider = (inputId, delta) => {
    const input = document.getElementById(inputId);
    if (!input) return;
    let val = parseInt(input.value) || 0;
    val += delta;
    if (val < parseInt(input.min)) val = parseInt(input.min);
    if (val > parseInt(input.max)) val = parseInt(input.max);
    input.value = val;
    input.dispatchEvent(new Event('input'));
  };

  // =========================
  // 화면 전환
  // =========================
  const showAuth = () => {
    if (el.dashScreen) {
      el.dashScreen.style.display = "none";
      el.dashScreen.classList.remove("active");
    }
    if (el.authScreen) {
      el.authScreen.style.display = "block";
      setTimeout(() => el.authScreen.classList.add("active"), 10);
    }
  };

  const showDashboard = () => {
    if (el.authScreen) {
      el.authScreen.style.display = "none";
      el.authScreen.classList.remove("active");
    }
    if (el.dashScreen) {
      el.dashScreen.style.display = "block";
      setTimeout(() => el.dashScreen.classList.add("active"), 10);
    }
    render();
  };

  const checkAuth = () => {
    const isAuth = localStorage.getItem("teacherAuth") === "true";
    const authAt = parseInt(localStorage.getItem("teacherAuthAt") || "0", 10) || 0;
    const now = Date.now();

    if (isAuth && now - authAt < EXPIRATION_MS) showDashboard();
    else {
      localStorage.removeItem("teacherAuth");
      localStorage.removeItem("teacherAuthAt");
      showAuth();
    }
  };

  // =========================
  // 로그인/로그아웃
  // =========================
  const handleLogin = () => {
    const pwd = el.pwdInput ? el.pwdInput.value : "";
    if (pwd === TEACHER_PASSWORD) {
      if (el.loginErr) el.loginErr.style.display = "none";
      localStorage.setItem("teacherAuth", "true");
      localStorage.setItem("teacherAuthAt", String(Date.now()));
      showDashboard();
    } else {
      if (el.loginErr) el.loginErr.style.display = "block";
    }
  };

  if (el.btnLogin) el.btnLogin.addEventListener("click", handleLogin);
  if (el.pwdInput) {
    el.pwdInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleLogin();
    });
  }

  const goStudent = () => (window.location.href = "index.html");
  if (el.btnBackToStudent) el.btnBackToStudent.addEventListener("click", goStudent);
  if (el.btnStudentMode) el.btnStudentMode.addEventListener("click", goStudent);

  if (el.btnLogout) {
    el.btnLogout.addEventListener("click", () => {
      localStorage.removeItem("teacherAuth");
      localStorage.removeItem("teacherAuthAt");
      if (el.pwdInput) el.pwdInput.value = "";
      showAuth();
    });
  }

  // =========================
  // 승인 처리
  // =========================
  const approve = (submissionId, studentId) => {
    const subs = loadSubmissions();
    const idx = subs.findIndex((s) => String(s.id) === String(submissionId));
    if (idx === -1) {
      alert("제출 항목을 찾지 못했습니다. (id 불일치)");
      return;
    }

    subs[idx].approved = true;
    saveSubmissions(subs);

    // 배분된 추가 능력치 부여 (input 요소에서 추출)
    const strInput = document.getElementById(`adj-str-${submissionId}`);
    const intInput = document.getElementById(`adj-int-${submissionId}`);
    const chaInput = document.getElementById(`adj-cha-${submissionId}`);
    const expInput = document.getElementById(`adj-exp-${submissionId}`); // 커스텀 EXP

    const dStr = parseInt(strInput ? strInput.value : 0) || 0;
    const dInt = parseInt(intInput ? intInput.value : 0) || 0;
    const dCha = parseInt(chaInput ? chaInput.value : 0) || 0;
    const dExp = parseInt(expInput ? expInput.value : 10) || 0; // 디폴트 10

    // EXP 증가 로직
    const expKey = `historyRpg_exp_${studentId}`;
    const cur = parseInt(localStorage.getItem(expKey) || "0", 10) || 0;
    localStorage.setItem(expKey, String(cur + dExp));

    let savedStats = safeJsonParse(localStorage.getItem(`historyRpg_stats_${studentId}`), { str: 0, int: 0, cha: 0 });
    savedStats.str += dStr;
    savedStats.int += dInt;
    savedStats.cha += dCha;
    localStorage.setItem(`historyRpg_stats_${studentId}`, JSON.stringify(savedStats));

    // approvalLogs에 기록
    let approvalLogs = safeJsonParse(localStorage.getItem(LOGS_KEY), []);
    approvalLogs.push({
      studentId: studentId,
      timestamp: new Date().toLocaleString(),
      delta: { str: dStr, int: dInt, cha: dCha },
      exp: dExp,
      note: "교사승인"
    });
    localStorage.setItem(LOGS_KEY, JSON.stringify(approvalLogs));

    render();
  };

  // 이벤트 위임
  if (el.container) {
    el.container.addEventListener("click", (e) => {
      const target = e.target;
      const btn = target.classList.contains("approve-btn")
        ? target
        : target.closest(".approve-btn");

      if (!btn) return;

      const submissionId = btn.dataset.id;
      const studentId = btn.dataset.student;

      if (!submissionId || !studentId) {
        console.error("승인 버튼에 data-id 또는 data-student 속성이 없습니다.");
        return;
      }

      approve(submissionId, studentId);
    });
  }

  // =========================
  // 렌더링
  // =========================
  const render = () => {
    const subs = loadSubmissions();

    // id가 없으면 생성 (안전)
    let changed = false;
    subs.forEach((s) => {
      if (!s.id) {
        s.id = `${s.studentId || "unknown"}_${s.timestamp || Date.now()}`;
        changed = true;
      }
    });
    if (changed) saveSubmissions(subs);

    // 날짜 연산을 통해 오늘 승인 수 등 계산
    const approvalLogs = safeJsonParse(localStorage.getItem(LOGS_KEY), []);
    const now = new Date();
    let todayCount = 0;
    let approvedCount = approvalLogs.length;

    approvalLogs.forEach((log) => {
      const d = parseToDate(log.timestamp);
      if (d && isSameDay(d, now)) todayCount++;
    });

    // 학생들 EXP 기반 통계/랭킹 로직
    const expKeys = Object.keys(localStorage).filter(k => k.startsWith('historyRpg_exp_'));
    let studentsList = [];

    expKeys.forEach(key => {
      const studentId = key.replace('historyRpg_exp_', '');
      studentsList.push({
        id: studentId,
        power: getStudentPower(studentId)
      });
    });

    // 통계 UI 갱신
    if (el.statToday) setText(el.statToday, todayCount);
    if (el.statApproved) setText(el.statApproved, approvedCount);
    if (el.statAvgLevel) setText(el.statAvgLevel, `Lv. ${calcAverageLevel()}`);

    // Top 3 계산 및 렌더링
    studentsList.sort((a, b) => b.power - a.power);
    const top3 = studentsList.slice(0, 3);

    if (el.top3Container) {
      el.top3Container.innerHTML = '';
      if (top3.length === 0) {
        el.top3Container.innerHTML = '<div style="color: #94a3b8; text-align: center; width: 100%;">데이터가 없습니다.</div>';
      } else {
        top3.forEach((s, i) => {
          const rankClass = `rank-${i + 1}`;
          const rankIcon = i === 0 ? '🥇' : (i === 1 ? '🥈' : '🥉');
          el.top3Container.innerHTML += `
                    <div class="top3-card">
                        <div class="top3-rank ${rankClass}">${rankIcon} ${i + 1}위</div>
                        <div class="top3-id">${s.id}</div>
                        <div class="top3-power">전투력: ${s.power}</div>
                    </div>
                `;
        });
      }
    }

    // 학생 관리 리스트 렌더링
    if (el.smContainer) {
      el.smContainer.innerHTML = '';
      if (studentsList.length === 0) {
        el.smContainer.innerHTML = '<div style="color: #94a3b8; text-align: center; padding: 1rem;">제출 기록이 있는 학생부터 표시됩니다.</div>';
      } else {
        studentsList.forEach(s => {
          const raw = getRawStudentStats(s.id);
          const savedStr = (safeJsonParse(localStorage.getItem(`historyRpg_stats_${s.id}`), { str: 0 }).str || 0);
          const savedInt = (safeJsonParse(localStorage.getItem(`historyRpg_stats_${s.id}`), { int: 0 }).int || 0);
          const savedCha = (safeJsonParse(localStorage.getItem(`historyRpg_stats_${s.id}`), { cha: 0 }).cha || 0);

          const curStr = raw.str + savedStr;
          const curInt = raw.int + savedInt;
          const curCha = raw.cha + savedCha;

          const card = document.createElement('div');
          card.className = 'manager-card';

          card.innerHTML = `
            <div class="manager-header">
                <span class="manager-id">${s.id}</span>
                <span class="manager-lvl">Lv. ${getLevelFromExp(parseInt(localStorage.getItem(`historyRpg_exp_${s.id}`) || 0))} / 전투력: <span id="sm-pow-${s.id}">${s.power}</span></span>
            </div>
            
            <div class="stat-sliders-grid">
                <div class="slider-group">
                    <span class="slider-label">💪 힘</span>
                    <div style="display: flex; align-items: center; gap: 0.5rem; justify-content: center; width: 100%;">
                        <button class="outline-btn sm-btn" style="padding: 0 0.5rem; min-width: 30px;" onclick="window.adjustStatSlider('sm-str-${s.id}', -1)">-</button>
                        <input type="range" id="sm-str-${s.id}" class="stat-range" min="25" max="300" value="${curStr}" style="flex: 1;"
                               oninput="document.getElementById('sm-str-val-${s.id}').innerText=this.value; 
                                        document.getElementById('sm-str-diff-${s.id}').innerText= (this.value - ${curStr} > 0 ? '+' : '') + (this.value - ${curStr}); 
                                        document.getElementById('sm-str-diff-${s.id}').style.color = (this.value - ${curStr} > 0 ? '#10b981' : (this.value - ${curStr} < 0 ? '#ef4444' : '#94a3b8'));">
                        <button class="outline-btn sm-btn" style="padding: 0 0.5rem; min-width: 30px;" onclick="window.adjustStatSlider('sm-str-${s.id}', 1)">+</button>
                    </div>
                    <div class="stat-diff">
                        <span>현재: ${curStr}</span>
                        <span id="sm-str-diff-${s.id}" style="font-weight:bold; color:#94a3b8;">0</span>
                    </div>
                    <div class="stat-result" id="sm-str-val-${s.id}">${curStr}</div>
                </div>

                <div class="slider-group">
                    <span class="slider-label">🧠 지력</span>
                    <div style="display: flex; align-items: center; gap: 0.5rem; justify-content: center; width: 100%;">
                        <button class="outline-btn sm-btn" style="padding: 0 0.5rem; min-width: 30px;" onclick="window.adjustStatSlider('sm-int-${s.id}', -1)">-</button>
                        <input type="range" id="sm-int-${s.id}" class="stat-range" min="25" max="300" value="${curInt}" style="flex: 1;"
                               oninput="document.getElementById('sm-int-val-${s.id}').innerText=this.value; 
                                        document.getElementById('sm-int-diff-${s.id}').innerText= (this.value - ${curInt} > 0 ? '+' : '') + (this.value - ${curInt}); 
                                        document.getElementById('sm-int-diff-${s.id}').style.color = (this.value - ${curInt} > 0 ? '#10b981' : (this.value - ${curInt} < 0 ? '#ef4444' : '#94a3b8'));">
                        <button class="outline-btn sm-btn" style="padding: 0 0.5rem; min-width: 30px;" onclick="window.adjustStatSlider('sm-int-${s.id}', 1)">+</button>
                    </div>
                    <div class="stat-diff">
                        <span>현재: ${curInt}</span>
                        <span id="sm-int-diff-${s.id}" style="font-weight:bold; color:#94a3b8;">0</span>
                    </div>
                    <div class="stat-result" id="sm-int-val-${s.id}">${curInt}</div>
                </div>

                <div class="slider-group">
                    <span class="slider-label">✨ 매력</span>
                    <div style="display: flex; align-items: center; gap: 0.5rem; justify-content: center; width: 100%;">
                        <button class="outline-btn sm-btn" style="padding: 0 0.5rem; min-width: 30px;" onclick="window.adjustStatSlider('sm-cha-${s.id}', -1)">-</button>
                        <input type="range" id="sm-cha-${s.id}" class="stat-range" min="25" max="300" value="${curCha}" style="flex: 1;"
                               oninput="document.getElementById('sm-cha-val-${s.id}').innerText=this.value; 
                                        document.getElementById('sm-cha-diff-${s.id}').innerText= (this.value - ${curCha} > 0 ? '+' : '') + (this.value - ${curCha}); 
                                        document.getElementById('sm-cha-diff-${s.id}').style.color = (this.value - ${curCha} > 0 ? '#10b981' : (this.value - ${curCha} < 0 ? '#ef4444' : '#94a3b8'));">
                        <button class="outline-btn sm-btn" style="padding: 0 0.5rem; min-width: 30px;" onclick="window.adjustStatSlider('sm-cha-${s.id}', 1)">+</button>
                    </div>
                    <div class="stat-diff">
                        <span>현재: ${curCha}</span>
                        <span id="sm-cha-diff-${s.id}" style="font-weight:bold; color:#94a3b8;">0</span>
                    </div>
                    <div class="stat-result" id="sm-cha-val-${s.id}">${curCha}</div>
                </div>
            </div>
            <div class="manager-actions">
                <button class="primary-btn sm-btn" id="sm-save-${s.id}">변경 내용 저장하기 💾</button>
            </div>
          `;
          el.smContainer.appendChild(card);

          document.getElementById(`sm-save-${s.id}`).addEventListener('click', () => {
            saveStudentManagerStats(s.id);
          });
        });
      }
    }

    // 제출 목록
    if (!el.container) return;
    el.container.innerHTML = "";

    const list = subs.slice().reverse();
    if (list.length === 0) {
      el.container.innerHTML =
        `<div style="text-align:center; padding: 2rem; color: #94a3b8;">아직 제출된 교훈 일지가 없습니다.</div>`;
      return;
    }

    list.forEach((sub) => {
      const item = document.createElement("div");
      item.className = "submission-item";

      const statusHtml = sub.approved
        ? '<div class="status-badge status-approved">✔ 승인완료</div>'
        : '<div class="status-badge status-pending">대기 중</div>';

      let actionHtml = '';
      if (!sub.approved) {
        actionHtml = `
              <div class="stat-adjuster">
                  <label>🔥 EXP</label>
                  <input type="number" id="adj-exp-${sub.id}" value="10" min="0" max="100">
              </div>
              <div class="stat-adjuster">
                  <label>💪 힘</label>
                  <input type="number" id="adj-str-${sub.id}" value="1" min="0" max="5">
              </div>
              <div class="stat-adjuster">
                  <label>🧠 지력</label>
                  <input type="number" id="adj-int-${sub.id}" value="1" min="0" max="5">
              </div>
              <div class="stat-adjuster">
                  <label>✨ 매력</label>
                  <input type="number" id="adj-cha-${sub.id}" value="1" min="0" max="5">
              </div>
              <button class="primary-btn approve-btn" data-id="${sub.id}" data-student="${sub.studentId}" style="margin-top: 0.5rem;">
                  승인 & EXP/스탯 지급
              </button>
          `;
      }

      item.innerHTML = `
        <div class="sub-left">
            <div class="sub-header">
                <span class="sub-id">${sub.studentId || "알수없음"}</span>
                <span class="sub-time">${sub.timestamp || "날짜모름"}</span>
            </div>
            <div class="sub-content">${sub.content || "내용없음"}</div>
        </div>
        <div class="sub-right">
            ${statusHtml}
            ${actionHtml}
        </div>
      `;
      el.container.appendChild(item);
    });
  };

  // 초기 실행
  checkAuth();
});
