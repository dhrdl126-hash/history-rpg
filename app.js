document.addEventListener('DOMContentLoaded', () => {
    // === DOM 요소를 미리 캐싱합니다 ===
    const screens = {
        login: document.getElementById('login-screen'),
        dashboard: document.getElementById('dashboard-screen'),
        gallery: document.getElementById('gallery-screen')
    };

    const loginElements = {
        inputId: document.getElementById('student-id'),
        btnEnter: document.getElementById('login-btn'),
        errorMsg: document.getElementById('login-err')
    };

    const dashElements = {
        displayId: document.getElementById('display-id'),
        btnLogout: document.getElementById('logout-btn'),
        
        statStr: document.getElementById('stat-str'),
        statInt: document.getElementById('stat-int'),
        statCha: document.getElementById('stat-cha'),
        
        statStrVal: document.getElementById('stat-str-val'),
        statIntVal: document.getElementById('stat-int-val'),
        statChaVal: document.getElementById('stat-cha-val'),

        activityLog: document.getElementById('activity-log'),
        btnSaveLog: document.getElementById('save-activity-btn'),
        saveStatus: document.getElementById('save-status'),

        btnGallery: document.getElementById('view-gallery-btn')
    };

    const galElements = {
        btnBack: document.getElementById('back-to-dash-btn'),
        container: document.getElementById('gallery-container')
    };

    let currentUser = null;

    // === 유틸 함수: 화면 전환 ===
    const switchScreen = (targetScreen) => {
        Object.values(screens).forEach(screen => {
            screen.classList.remove('active');
        });
        targetScreen.classList.add('active');
    };

    // === 유틸 함수: 숫자 애니메이션 (카운팅 효과) ===
    const animateValue = (obj, start, end, duration) => {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    };

    // === 데이터 시뮬레이션: 더미 학생 생성기 ===
    const generateDummyStudents = () => {
        const dummies = [];
        const profiles = [
            { title: '떠오르는 책략가', icon: '🧠' },
            { title: '용맹한 선봉장', icon: '⚔️' },
            { title: '사교계의 샛별', icon: '✨' },
            { title: '숨겨진 암살자', icon: '🗡️' },
            { title: '궁중의 학자', icon: '📜' },
            { title: '전장의 방랑자', icon: '🛡️' }
        ];

        for (let i = 0; i < 6; i++) {
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            dummies.push({
                id: `26jls${randomSuffix}`,
                title: profiles[i].title,
                avatar: profiles[i].icon,
                str: Math.floor(Math.random() * 60) + 20, // 20~80
                int: Math.floor(Math.random() * 60) + 20,
                cha: Math.floor(Math.random() * 60) + 20
            });
        }
        return dummies;
    };

    // === 로직: 로그인 처리 ===
    const handleLogin = () => {
        const idVal = loginElements.inputId.value.trim().toLowerCase();
        
        // 간단한 검증: 6자리 이상이면 통과 (아이디 형식 유연하게 허용)
        if (idVal.length >= 6) {
            currentUser = idVal;
            loginElements.errorMsg.style.display = 'none';
            
            initDashboard();
            switchScreen(screens.dashboard);
        } else {
            loginElements.errorMsg.style.display = 'block';
            // 버튼 흔들림 효과
            loginElements.btnEnter.style.transform = "translateX(-10px)";
            setTimeout(() => { loginElements.btnEnter.style.transform = "translateX(10px)"; }, 50);
            setTimeout(() => { loginElements.btnEnter.style.transform = "translateX(0)"; }, 100);
        }
    };

    loginElements.btnEnter.addEventListener('click', handleLogin);
    loginElements.inputId.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });

    // === 로직: 대시보드 데이터 초기화 ===
    const initDashboard = () => {
        dashElements.displayId.textContent = currentUser;

        // 학번 문자열에 기반해서 고유한 시드(Seed) 값 생성 (항상 같은 능력치 부여용)
        let seed = 0;
        for(let i = 0; i < currentUser.length; i++) {
            seed += currentUser.charCodeAt(i);
        }

        // 스탯 생성 (가짜 데이터)
        const strScore = (seed % 65) + 25; // 25~90 제한
        const intScore = ((seed * 7) % 65) + 25;
        const chaScore = ((seed * 13) % 65) + 25;

        // UI 애니메이션 트리거 (약간의 딜레이를 주어 화면 전환 후 실행)
        setTimeout(() => {
            // 막대 길이 애니메이션
            dashElements.statStr.style.width = `${strScore}%`;
            dashElements.statInt.style.width = `${intScore}%`;
            dashElements.statCha.style.width = `${chaScore}%`;

            // 숫자 카운팅 애니메이션
            animateValue(dashElements.statStrVal, 0, strScore, 1500);
            animateValue(dashElements.statIntVal, 0, intScore, 1500);
            animateValue(dashElements.statChaVal, 0, chaScore, 1500);
        }, 300);

        // 로컬 스토리지에서 이전 탐험 일지 불러오기
        const savedLog = localStorage.getItem(`historyRpg_log_${currentUser}`);
        if (savedLog !== null) {
            dashElements.activityLog.value = savedLog;
        } else {
            dashElements.activityLog.value = '';
        }
    };

    // === 로직: 탐험 일지 저장 ===
    dashElements.btnSaveLog.addEventListener('click', () => {
        if (!currentUser) return;
        
        const logContent = dashElements.activityLog.value;
        localStorage.setItem(`historyRpg_log_${currentUser}`, logContent);
        
        // 피드백 UI 표시
        dashElements.saveStatus.textContent = "✔ 성공적으로 기록되었습니다!";
        dashElements.saveStatus.style.opacity = '1';
        
        // 버튼 펄스 효과
        dashElements.btnSaveLog.style.transform = "scale(0.95)";
        setTimeout(() => dashElements.btnSaveLog.style.transform = "scale(1)", 150);

        setTimeout(() => {
            dashElements.saveStatus.style.opacity = '0';
        }, 2500);
    });

    // === 로직: 로그아웃 ===
    dashElements.btnLogout.addEventListener('click', () => {
        currentUser = null;
        loginElements.inputId.value = '';
        
        // 능력치 바 초기화
        dashElements.statStr.style.width = '0%';
        dashElements.statInt.style.width = '0%';
        dashElements.statCha.style.width = '0%';
        
        switchScreen(screens.login);
    });

    // === 로직: 갤러리 화면 전환 ===
    dashElements.btnGallery.addEventListener('click', () => {
        renderGallery();
        switchScreen(screens.gallery);
    });

    galElements.btnBack.addEventListener('click', () => {
        switchScreen(screens.dashboard);
    });

    // === 로직: 동료 갤러리 렌더링 ===
    const renderGallery = () => {
        galElements.container.innerHTML = '';
        const students = generateDummyStudents();
        
        students.forEach((student, index) => {
            const card = document.createElement('div');
            card.className = 'glass-card dummy-card';
            // 등장 애니메이션 딜레이 효과
            card.style.animation = `fadeUp 0.5s ease forwards ${index * 0.1}s`;
            card.style.opacity = '0';
            
            card.innerHTML = `
                <div class="dummy-avatar">${student.avatar}</div>
                <div class="dummy-id">${student.id}</div>
                <div class="dummy-title">${student.title}</div>
                <div class="dummy-stats">
                    <span>💪 ${student.str}</span>
                    <span>🧠 ${student.int}</span>
                    <span>✨ ${student.cha}</span>
                </div>
            `;
            galElements.container.appendChild(card);
        });
    };
});
