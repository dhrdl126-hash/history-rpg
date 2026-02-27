document.addEventListener('DOMContentLoaded', () => {
    // === DOM 요소를 미리 캐싱합니다 ===
    const screens = {
        login: document.getElementById('login-screen'),
        adminLogin: document.getElementById('admin-login-screen'),
        dashboard: document.getElementById('dashboard-screen'),
        gallery: document.getElementById('gallery-screen')
    };

    const loginElements = {
        inputId: document.getElementById('student-id'),
        inputPwd: document.getElementById('student-pwd'),
        btnEnter: document.getElementById('login-btn'),
        errorMsg: document.getElementById('login-err'),
        btnShowAdmin: document.getElementById('show-admin-login-btn'),
        adminPwdInput: document.getElementById('admin-pwd-input'),
        btnAdminSubmit: document.getElementById('admin-login-submit-btn'),
        btnAdminCancel: document.getElementById('admin-login-cancel-btn'),
        adminErrorMsg: document.getElementById('admin-login-err')
    };

    const dashElements = {
        displayId: document.getElementById('display-id'),
        displayLevel: document.getElementById('display-level'),
        displayTitle: document.getElementById('display-title'),
        displayExp: document.getElementById('display-exp'),
        displayPower: document.getElementById('display-power'),

        // 프로필 영역
        displayBio: document.getElementById('display-bio'),
        profileImgBox: document.getElementById('profile-img-box'),
        btnEditProfile: document.getElementById('edit-profile-btn'),

        btnLogout: document.getElementById('logout-btn'),
        btnTeacherMode: document.getElementById('teacher-mode-btn'),

        statStr: document.getElementById('stat-str'),
        statInt: document.getElementById('stat-int'),
        statCha: document.getElementById('stat-cha'),

        statStrVal: document.getElementById('stat-str-val'),
        statIntVal: document.getElementById('stat-int-val'),
        statChaVal: document.getElementById('stat-cha-val'),

        activityLog: document.getElementById('activity-log'),
        btnSaveLog: document.getElementById('save-activity-btn'),
        saveStatus: document.getElementById('save-status'),

        btnGallery: document.getElementById('view-gallery-btn'),

        levelGuideModal: document.getElementById('level-guide-modal'),
        btnCloseLevelGuide: document.getElementById('close-level-guide-btn'),

        teacherPwdModal: document.getElementById('teacher-pwd-modal'),
        teacherPwdInput: document.getElementById('teacher-pwd-input'),
        teacherPwdCancelBtn: document.getElementById('teacher-pwd-cancel-btn'),
        teacherPwdSubmitBtn: document.getElementById('teacher-pwd-submit-btn'),
        teacherPwdErr: document.getElementById('teacher-pwd-err')
    };

    const profileModalElements = {
        overlay: document.getElementById('profile-edit-modal'),
        imgInput: document.getElementById('profile-img-input'),
        imgPreview: document.getElementById('profile-img-preview'),

        btnOpenLife: document.getElementById('open-life-modal-btn'),
        btnOpenAchievement: document.getElementById('open-achievement-modal-btn'),

        btnCancel: document.getElementById('cancel-profile-btn'),
        btnSave: document.getElementById('save-profile-btn'),

        // 서브 모달 1 (생애)
        subLayerLife: document.getElementById('sub-modal-life'),
        tempLifeInput: document.getElementById('temp-life-input'),
        btnSubCancelLife: document.getElementById('sub-cancel-life-btn'),
        btnSubConfirmLife: document.getElementById('sub-confirm-life-btn'),

        // 서브 모달 2 (업적)
        subLayerAchievement: document.getElementById('sub-modal-achievement'),
        tempAchievementInput: document.getElementById('temp-achievement-input'),
        btnSubCancelAchievement: document.getElementById('sub-cancel-achievement-btn'),
        btnSubConfirmAchievement: document.getElementById('sub-confirm-achievement-btn')
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

        for (let i = 1; i <= 25; i++) {
            const studentId = `26jls11${i.toString().padStart(2, '0')}`;

            // 학번 문자열에 기반해서 고유한 시드(Seed) 값 생성 (항상 같은 기본 능력치 부여용)
            let seed = 0;
            for (let j = 0; j < studentId.length; j++) {
                seed += studentId.charCodeAt(j);
            }

            // 기본 스탯 생성
            let strScore = (seed % 65) + 25;
            let intScore = ((seed * 7) % 65) + 25;
            let chaScore = ((seed * 13) % 65) + 25;

            // 로컬스토리지에서 부여받은 스탯 불러오기 및 합산
            const savedStats = JSON.parse(localStorage.getItem(`historyRpg_stats_${studentId}`)) || { str: 0, int: 0, cha: 0 };
            strScore += savedStats.str;
            intScore += savedStats.int;
            chaScore += savedStats.cha;

            // 로컬 스토리지에서 경험치 불러오기 및 칭호 계산
            let currentExp = parseInt(localStorage.getItem(`historyRpg_exp_${studentId}`)) || 0;
            const { level, title } = getLevelAndTitle(currentExp);

            dummies.push({
                id: studentId,
                title: title,
                level: level,
                str: strScore,
                int: intScore,
                cha: chaScore
            });
        }
        return dummies;
    };

    // === 데이터 시뮬레이션: 레벨 및 칭호 계산 ===
    const getLevelAndTitle = (exp) => {
        if (exp >= 140) return { level: 5, title: '영웅' };
        if (exp >= 90) return { level: 4, title: '사관' };
        if (exp >= 50) return { level: 3, title: '전략가' };
        if (exp >= 20) return { level: 2, title: '탐험가' };
        return { level: 1, title: '훈련병' };
    };

    // === 로직: 로그인 처리 ===
    const handleLogin = () => {
        const idVal = loginElements.inputId.value.trim().toLowerCase();
        const pwdVal = loginElements.inputPwd.value.trim();

        let isValid = false;

        // 더미 계정 타겟 반 (26jls1101 ~ 26jls1125) 비밀번호 검증
        if (idVal.startsWith('26jls11') && idVal.length === 9) {
            const studentNum = parseInt(idVal.substring(5), 10);
            if (studentNum >= 1101 && studentNum <= 1125) {
                if (pwdVal === idVal.substring(5)) {
                    isValid = true;
                } else {
                    loginElements.errorMsg.textContent = "비밀번호가 일치하지 않습니다.";
                }
            } else {
                // 11반이 아니더라도 26jls 규칙을 따르는 그 외 아이디인 경우에도 뒤 4자리 검증
                if (pwdVal === idVal.substring(5)) {
                    isValid = true;
                } else {
                    loginElements.errorMsg.textContent = "비밀번호가 일치하지 않습니다.";
                }
            }
        }
        // 기존의 일반 아이디 로그인 허용 로직 유지 (안전망)
        else if (idVal.length >= 6) {
            isValid = true;
        } else {
            loginElements.errorMsg.textContent = "올바른 학번 형식을 입력해주세요 (6자 이상).";
        }

        if (isValid) {
            currentUser = idVal;
            loginElements.errorMsg.style.display = 'none';
            loginElements.inputPwd.value = ''; // 비밀번호 초기화

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
        if (e.key === 'Enter') loginElements.inputPwd.focus();
    });
    if (loginElements.inputPwd) {
        loginElements.inputPwd.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleLogin();
        });
    }

    // === 로직: 관리자(교사) 첫 화면 로그인 ===
    if (loginElements.btnShowAdmin) {
        loginElements.btnShowAdmin.addEventListener('click', () => {
            loginElements.adminPwdInput.value = '';
            loginElements.adminErrorMsg.style.display = 'none';
            switchScreen(screens.adminLogin);
        });
    }

    if (loginElements.btnAdminCancel) {
        loginElements.btnAdminCancel.addEventListener('click', () => {
            switchScreen(screens.login);
        });
    }

    const handleAdminLogin = () => {
        const pwd = loginElements.adminPwdInput.value;
        if (pwd === "8971") {
            loginElements.adminErrorMsg.style.display = 'none';
            localStorage.setItem('teacherAuth', 'true');
            localStorage.setItem('teacherAuthAt', Date.now().toString());
            window.location.href = './teacher.html';
        } else {
            loginElements.adminErrorMsg.style.display = 'block';
            loginElements.btnAdminSubmit.style.transform = "translateX(-10px)";
            setTimeout(() => { loginElements.btnAdminSubmit.style.transform = "translateX(10px)"; }, 50);
            setTimeout(() => { loginElements.btnAdminSubmit.style.transform = "translateX(0)"; }, 100);
        }
    };

    if (loginElements.btnAdminSubmit) {
        loginElements.btnAdminSubmit.addEventListener('click', handleAdminLogin);
    }

    if (loginElements.adminPwdInput) {
        loginElements.adminPwdInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleAdminLogin();
        });
    }

    // === 로직: 대시보드 데이터 초기화 ===
    const initDashboard = () => {
        dashElements.displayId.textContent = currentUser;

        // 학번 문자열에 기반해서 고유한 시드(Seed) 값 생성 (항상 같은 능력치 부여용)
        let seed = 0;
        for (let i = 0; i < currentUser.length; i++) {
            seed += currentUser.charCodeAt(i);
        }

        // 스탯 생성 (가짜 데이터 + 교사가 내려준 추가 스탯 합산)
        let strScore = (seed % 65) + 25; // 25~90 제한
        let intScore = ((seed * 7) % 65) + 25;
        let chaScore = ((seed * 13) % 65) + 25;

        // 로컬스토리지에서 부여받은 스탯 불러오기
        const savedStats = JSON.parse(localStorage.getItem(`historyRpg_stats_${currentUser}`)) || { str: 0, int: 0, cha: 0 };
        strScore += savedStats.str;
        intScore += savedStats.int;
        chaScore += savedStats.cha;

        const totalPower = strScore + intScore + chaScore;

        // 로컬 스토리지에서 경험치 불러오기
        let currentExp = parseInt(localStorage.getItem(`historyRpg_exp_${currentUser}`)) || 0;
        const updateExpUI = (exp) => {
            const { level, title } = getLevelAndTitle(exp);
            dashElements.displayLevel.textContent = `Lv. ${level}`;
            dashElements.displayTitle.textContent = title;
            dashElements.displayExp.textContent = exp;
        };
        updateExpUI(currentExp);

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
            animateValue(dashElements.displayPower, 0, totalPower, 1500);
        }, 300);

        // 로컬 스토리지에서 이전 탐험 일지 불러오기
        const savedLog = localStorage.getItem(`historyRpg_log_${currentUser}`);
        if (savedLog !== null) {
            dashElements.activityLog.value = savedLog;
        } else {
            dashElements.activityLog.value = '';
        }
        let bioData = '역사를 탐구하는 탐험가입니다. 아직 생애나 업적이 기록되지 않았습니다.';
        let imgData = null;

        const savedProfile = JSON.parse(localStorage.getItem(`historyRpg_profile_${currentUser}`));
        if (savedProfile) {
            let combinedBio = '';
            if (savedProfile.bio && savedProfile.bio.life) combinedBio += `[생애] ${savedProfile.bio.life}\n`;
            if (savedProfile.bio && savedProfile.bio.achievement) combinedBio += `[업적] ${savedProfile.bio.achievement}`;

            // 하위호환성 유지 (이전에 단순 문자열로 저장했을 경우)
            if (typeof savedProfile.bio === 'string') combinedBio = savedProfile.bio;

            if (combinedBio.trim()) bioData = combinedBio;
            if (savedProfile.img) imgData = savedProfile.img;
        }

        dashElements.displayBio.textContent = bioData;
        if (imgData) {
            dashElements.profileImgBox.innerHTML = `<img src="${imgData}" alt="프로필">`;
        } else {
            dashElements.profileImgBox.innerHTML = `<span class="profile-img-placeholder">📸</span>`;
        }

    };

    // === 로직: 프로필 편집 모달 및 서브 모달 관리 ===
    let tempImgBase64 = null;
    let tempLifeText = '';
    let tempAchievementText = '';

    if (dashElements.btnEditProfile) {
        dashElements.btnEditProfile.addEventListener('click', () => {
            const savedProfile = JSON.parse(localStorage.getItem(`historyRpg_profile_${currentUser}`)) || {};

            if (typeof savedProfile.bio === 'object' && savedProfile.bio !== null) {
                tempLifeText = savedProfile.bio.life || '';
                tempAchievementText = savedProfile.bio.achievement || '';
            } else if (typeof savedProfile.bio === 'string') {
                tempLifeText = savedProfile.bio; // 과거 데이터 호환성
                tempAchievementText = '';
            } else {
                tempLifeText = '';
                tempAchievementText = '';
            }

            tempImgBase64 = savedProfile.img || null;

            if (tempImgBase64) {
                profileModalElements.imgPreview.innerHTML = `<img src="${tempImgBase64}" style="width:100%; height:100%; object-fit:cover;">`;
            } else {
                profileModalElements.imgPreview.innerHTML = `<span style="font-size: 2rem; color: #94a3b8;">📸</span>`;
            }

            profileModalElements.overlay.style.display = 'flex';
        });
    }

    if (profileModalElements.btnCancel) {
        profileModalElements.btnCancel.addEventListener('click', () => {
            profileModalElements.overlay.style.display = 'none';
            profileModalElements.imgInput.value = '';
        });
    }

    if (profileModalElements.imgInput) {
        profileModalElements.imgInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                tempImgBase64 = event.target.result;
                profileModalElements.imgPreview.innerHTML = `<img src="${tempImgBase64}" style="width:100%; height:100%; object-fit:cover;">`;
            };
            reader.readAsDataURL(file);
        });
    }

    // --- 서브 모달 구동부 ---
    if (profileModalElements.btnOpenLife) {
        profileModalElements.btnOpenLife.addEventListener('click', () => {
            profileModalElements.tempLifeInput.value = tempLifeText;
            profileModalElements.subLayerLife.style.display = 'flex';
        });
    }

    if (profileModalElements.btnSubCancelLife) {
        profileModalElements.btnSubCancelLife.addEventListener('click', () => {
            profileModalElements.subLayerLife.style.display = 'none';
        });
    }

    if (profileModalElements.btnSubConfirmLife) {
        profileModalElements.btnSubConfirmLife.addEventListener('click', () => {
            tempLifeText = profileModalElements.tempLifeInput.value.trim();
            profileModalElements.subLayerLife.style.display = 'none';
        });
    }

    if (profileModalElements.btnOpenAchievement) {
        profileModalElements.btnOpenAchievement.addEventListener('click', () => {
            profileModalElements.tempAchievementInput.value = tempAchievementText;
            profileModalElements.subLayerAchievement.style.display = 'flex';
        });
    }

    if (profileModalElements.btnSubCancelAchievement) {
        profileModalElements.btnSubCancelAchievement.addEventListener('click', () => {
            profileModalElements.subLayerAchievement.style.display = 'none';
        });
    }

    if (profileModalElements.btnSubConfirmAchievement) {
        profileModalElements.btnSubConfirmAchievement.addEventListener('click', () => {
            tempAchievementText = profileModalElements.tempAchievementInput.value.trim();
            profileModalElements.subLayerAchievement.style.display = 'none';
        });
    }

    // -- 메인 모달 최종 저장 --
    if (profileModalElements.btnSave) {
        profileModalElements.btnSave.addEventListener('click', () => {
            const profileData = {
                bio: {
                    life: tempLifeText,
                    achievement: tempAchievementText
                },
                img: tempImgBase64
            };

            localStorage.setItem(`historyRpg_profile_${currentUser}`, JSON.stringify(profileData));

            // UI 즉시 반영
            let combinedBio = '';
            if (tempLifeText) combinedBio += `[생애] ${tempLifeText}\n`;
            if (tempAchievementText) combinedBio += `[업적] ${tempAchievementText}`;

            dashElements.displayBio.textContent = combinedBio.trim() || '역사를 탐구하는 탐험가입니다. 아직 생애나 업적이 기록되지 않았습니다.';

            if (tempImgBase64) {
                dashElements.profileImgBox.innerHTML = `<img src="${tempImgBase64}" alt="프로필">`;
            } else {
                dashElements.profileImgBox.innerHTML = `<span class="profile-img-placeholder">📸</span>`;
            }

            // 초기화
            profileModalElements.overlay.style.display = 'none';
        });
    }

    // === 로직: 탐험 일지 저장 ======
    dashElements.btnSaveLog.addEventListener('click', () => {
        if (!currentUser) return;

        const logContent = dashElements.activityLog.value;
        if (!logContent.trim()) return;

        // 임시 저장용
        localStorage.setItem(`historyRpg_log_${currentUser}`, logContent);

        // 제출 내역(배열)으로 저장되도록 수정 (선생님 승인 시 EXP +10)
        let submissions = JSON.parse(localStorage.getItem('historyRpg_submissions')) || [];
        submissions.push({
            id: Date.now().toString(),
            studentId: currentUser,
            content: logContent,
            timestamp: new Date().toLocaleString(),
            approved: false
        });
        localStorage.setItem('historyRpg_submissions', JSON.stringify(submissions));

        // 피드백 UI 표시
        dashElements.saveStatus.textContent = "✔ 선생님께 제출되었습니다! (승인 대기 중)";
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

    // === 로직: 교사 화면 진입 (비밀번호 모달 적용) ===
    if (dashElements.btnTeacherMode) {
        dashElements.btnTeacherMode.addEventListener('click', (e) => {
            e.preventDefault();
            dashElements.teacherPwdInput.value = '';
            dashElements.teacherPwdErr.style.display = 'none';
            dashElements.teacherPwdModal.style.display = 'flex';
        });
    }

    if (dashElements.teacherPwdCancelBtn) {
        dashElements.teacherPwdCancelBtn.addEventListener('click', () => {
            dashElements.teacherPwdModal.style.display = 'none';
        });
    }

    if (dashElements.teacherPwdSubmitBtn) {
        dashElements.teacherPwdSubmitBtn.addEventListener('click', () => {
            const pwd = dashElements.teacherPwdInput.value;
            if (pwd === "8971") {
                dashElements.teacherPwdModal.style.display = 'none';
                localStorage.setItem('teacherAuth', 'true');
                localStorage.setItem('teacherAuthAt', Date.now().toString());
                window.location.href = './teacher.html';
            } else {
                dashElements.teacherPwdErr.style.display = 'block';
                dashElements.teacherPwdSubmitBtn.style.transform = "translateX(-10px)";
                setTimeout(() => { dashElements.teacherPwdSubmitBtn.style.transform = "translateX(10px)"; }, 50);
                setTimeout(() => { dashElements.teacherPwdSubmitBtn.style.transform = "translateX(0)"; }, 100);
            }
        });
    }

    if (dashElements.teacherPwdInput) {
        dashElements.teacherPwdInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') dashElements.teacherPwdSubmitBtn.click();
        });
    }

    // === 로직: 갤러리 화면 전환 ===
    dashElements.btnGallery.addEventListener('click', () => {
        renderGallery();
        switchScreen(screens.gallery);
    });

    // === 로직: 레벨/칭호 안내 가이드 모달 구동 ===
    const openLevelGuide = () => {
        if (dashElements.levelGuideModal) {
            dashElements.levelGuideModal.style.display = 'flex';
        }
    };

    if (dashElements.displayLevel) dashElements.displayLevel.addEventListener('click', openLevelGuide);
    if (dashElements.displayTitle) dashElements.displayTitle.addEventListener('click', openLevelGuide);

    if (dashElements.btnCloseLevelGuide) {
        dashElements.btnCloseLevelGuide.addEventListener('click', () => {
            dashElements.levelGuideModal.style.display = 'none';
        });
    }

    galElements.btnBack.addEventListener('click', () => {
        switchScreen(screens.dashboard);
    });

    // === 로직: 동료 갤러리 렌더링 ===
    const renderGallery = () => {
        galElements.container.innerHTML = '';
        const students = generateDummyStudents();

        students.forEach((student, index) => {
            const savedProfile = JSON.parse(localStorage.getItem(`historyRpg_profile_${student.id}`));
            if (savedProfile) {
                if (savedProfile.bio) {
                    let combinedBio = '';
                    if (typeof savedProfile.bio === 'object') {
                        if (savedProfile.bio.life) combinedBio += `[생애] ${savedProfile.bio.life}\n`;
                        if (savedProfile.bio.achievement) combinedBio += `[업적] ${savedProfile.bio.achievement}`;
                    } else if (typeof savedProfile.bio === 'string') {
                        combinedBio = savedProfile.bio;
                    }
                    student.bio = combinedBio;
                }
                if (savedProfile.img) student.img = savedProfile.img;
            }

            const card = document.createElement('div');
            card.className = 'glass-card dummy-card';
            // 등장 애니메이션 딜레이 효과
            card.style.animation = `fadeUp 0.5s ease forwards ${index * 0.1}s`;
            card.style.opacity = '0';

            const imgHtml = student.img ? `<img src="${student.img}" alt="프로필" style="width:100%; height:100%; object-fit:cover;">` : `<span style="font-size:1.5rem;">👤</span>`;

            card.innerHTML = `
                <div style="display: flex; gap: 1rem; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 1rem;">
                    <div class="avatar-sm" style="width: 40px; height: 40px; overflow: hidden; padding: 0;">
                        ${imgHtml}
                    </div>
                    <div>
                        <h3 style="margin-bottom: 0.2rem;">${student.id}</h3>
                        <div class="user-badges" style="font-size: 0.75rem;">
                            <span class="badge title-badge">${student.title}</span>
                        </div>
                    </div>
                </div>
                <p style="font-size:0.85rem; color:#94a3b8; flex:1; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; margin-top: 1rem; white-space: pre-wrap;">
                    ${student.bio || '아직 기록된 프로필 내용이 없습니다.'}
                </p>
                <div class="dummy-stats" style="margin-top: 1rem; justify-content: flex-start;">
                    <span>💪 ${student.str}</span>
                    <span>🧠 ${student.int}</span>
                    <span>✨ ${student.cha}</span>
                </div>
            `;
            galElements.container.appendChild(card);
        });
    };
});
