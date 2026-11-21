const fs = require('fs');
const path = require('path');

const authPath = path.resolve('C:/Users/Zion/Desktop/SNI-Website/auth.html');
let content = fs.readFileSync(authPath, 'utf8');

// 1. Add "Enter existing OTP" link below the join form prompt
const joinSwitchOld = `<div class="auth-switch-prompt">
                        Already have an account? <a id="switchToSignInLink">Sign In here</a>
                    </div>`;

const joinSwitchNew = `<div class="auth-switch-prompt">
                        Already have an account? <a id="switchToSignInLink">Sign In here</a>
                    </div>
                    <div style="margin-top: 12px; font-size: 0.82rem; text-align: center; color: #64748b;">
                        Already registered? <a id="enterExistingOtpLink" style="color: #124b91; font-weight: 700; cursor: pointer; text-decoration: underline;">Enter your 6-digit OTP code here</a>
                    </div>`;

if (content.includes(joinSwitchOld) && !content.includes('enterExistingOtpLink')) {
  content = content.replace(joinSwitchOld, joinSwitchNew);
  console.log('Added enterExistingOtpLink to Join form');
}

// 2. Update join form submit handler: do NOT prefill OTP in modal, and save to localStorage
const joinSubmitOld = `                } else {
                    joinForm.reset();
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<span>✨ Submit Registration</span>';

                    showVerificationModal({
                        userId,
                        fullName,
                        email,
                        pass,
                        otp: verifyOtp
                    });
                }`;

const joinSubmitNew = `                } else {
                    joinForm.reset();
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<span>✨ Submit Registration</span>';

                    const pendingInfo = {
                        userId,
                        fullName,
                        email,
                        pass
                    };
                    try {
                        localStorage.setItem('sni_pending_verify_user', JSON.stringify(pendingInfo));
                    } catch(e) {}

                    showVerificationModal(pendingInfo);
                }`;

if (content.includes(joinSubmitOld)) {
  content = content.replace(joinSubmitOld, joinSubmitNew);
  console.log('Updated join form submit handler to not prefill OTP and save to localStorage');
}

// 3. Update showVerificationModal to keep OTP input empty for user entry
const showModalOld = `            if (otpInput) {
                otpInput.value = info.otp || '';
                setTimeout(() => otpInput.focus(), 200);
            }`;

const showModalNew = `            if (otpInput) {
                otpInput.value = (info && info.otp) ? info.otp : '';
                setTimeout(() => otpInput.focus(), 200);
            }`;

if (content.includes(showModalOld)) {
  content = content.replace(showModalOld, showModalNew);
  console.log('Updated showVerificationModal OTP input handling');
}

// 4. Update handleOtpSubmit to restore session from localStorage if needed
const handleOtpSubmitOld = `        async function handleOtpSubmit() {
            if (!currentModalInfo || !currentModalInfo.userId) {
                showOtpStatus('⚠️ Session expired. Please fill out the registration form again.', '#dc2626');
                return;
            }
            const enteredOtp = (otpCodeInput?.value || '').trim();
            if (!enteredOtp || enteredOtp.length !== 6 || !/^\d{6}$/.test(enteredOtp)) {
                showOtpStatus('⚠️ Please enter the full 6-digit numeric OTP code.', '#dc2626');
                if (otpCodeInput) otpCodeInput.focus();
                return;
            }

            if (submitOtpBtn) {
                submitOtpBtn.disabled = true;
                submitOtpBtn.textContent = 'Verifying...';
            }
            showOtpStatus('Verifying OTP code...', '#2563eb');

            const success = await handleOtpVerificationSuccess(currentModalInfo.userId, enteredOtp);
            if (submitOtpBtn) {
                submitOtpBtn.disabled = false;
                submitOtpBtn.textContent = 'Verify OTP →';
            }
        }`;

const handleOtpSubmitNew = `        async function handleOtpSubmit() {
            let info = currentModalInfo;
            if (!info || !info.userId) {
                try {
                    const saved = localStorage.getItem('sni_pending_verify_user');
                    if (saved) {
                        info = JSON.parse(saved);
                        currentModalInfo = info;
                    }
                } catch(e) {}
            }
            if (!info || !info.userId) {
                const manualId = document.getElementById('joinUserId')?.value.trim() || document.getElementById('signInUserId')?.value.trim();
                if (manualId) {
                    info = { userId: manualId };
                    currentModalInfo = info;
                }
            }
            if (!info || !info.userId) {
                showOtpStatus('⚠️ Session expired. Please fill out the registration form again.', '#dc2626');
                return;
            }
            const enteredOtp = (otpCodeInput?.value || '').trim();
            if (!enteredOtp || enteredOtp.length !== 6 || !/^\d{6}$/.test(enteredOtp)) {
                showOtpStatus('⚠️ Please enter the full 6-digit numeric OTP code.', '#dc2626');
                if (otpCodeInput) otpCodeInput.focus();
                return;
            }

            if (submitOtpBtn) {
                submitOtpBtn.disabled = true;
                submitOtpBtn.textContent = 'Verifying...';
            }
            showOtpStatus('Verifying OTP code...', '#2563eb');

            const success = await handleOtpVerificationSuccess(info.userId, enteredOtp);
            if (submitOtpBtn) {
                submitOtpBtn.disabled = false;
                submitOtpBtn.textContent = 'Verify OTP →';
            }
        }`;

if (content.includes(handleOtpSubmitOld)) {
  content = content.replace(handleOtpSubmitOld, handleOtpSubmitNew);
  console.log('Updated handleOtpSubmit session fallback');
}

// 5. Update showVerifiedSuccessModal to display EXACT text required by user
const successModalOld = `        function showVerifiedSuccessModal(uid, fullName, email) {
            const modal = document.getElementById('verifyModal');
            const icon = document.getElementById('verifyModalIcon');
            const title = document.getElementById('verifyModalTitle');
            const subtitle = document.getElementById('verifyModalSubtitle');
            const actions = document.getElementById('verifyModalActions');
            const target = document.getElementById('verifyModalTarget');
            const otpSection = document.getElementById('otpInputSection');

            if (otpSection) otpSection.style.display = 'none';

            icon.className = 'modal-icon success';
            icon.innerHTML = '🎉';
            title.innerText = 'Email Verified Successfully!';
            target.innerText = email || uid;
            subtitle.innerHTML = \`Congratulations, <strong>\${fullName}</strong>! <br>Your email address has been verified. Your application for SNI ID <strong class="modal-target">\${uid}</strong> has now been forwarded to the Admin.<br><div style="color: #b45309; font-weight: 700; margin-top: 10px; background: #fef3c7; padding: 12px 14px; border-radius: 10px; border: 1px solid #fde68a; font-size: 0.85rem;">⏳ Waiting for Admin Approval: You will be able to sign in once an administrator approves your account.</div>\`;

            actions.innerHTML = \`
                <button type="button" class="modal-btn modal-btn-primary" onclick="proceedToSignInAfterVerify('\${uid}')" style="background: #071b3b; color: #f5c75e; font-weight: 700; width: 100%;">
                    🔑 Return to Sign In
                </button>
            \`;

            modal.classList.add('active');
        }`;

const successModalNew = `        function showVerifiedSuccessModal(uid, fullName, email) {
            const modal = document.getElementById('verifyModal');
            const icon = document.getElementById('verifyModalIcon');
            const title = document.getElementById('verifyModalTitle');
            const subtitle = document.getElementById('verifyModalSubtitle');
            const actions = document.getElementById('verifyModalActions');
            const target = document.getElementById('verifyModalTarget');
            const otpSection = document.getElementById('otpInputSection');

            if (otpSection) otpSection.style.display = 'none';

            icon.className = 'modal-icon success';
            icon.innerHTML = '🎉';
            title.innerText = 'Email Verified Successfully!';
            target.innerText = email || uid;
            subtitle.innerHTML = \`
                <div style="margin: 12px 0;">
                    <div style="font-size: 1.1rem; font-weight: 900; color: #16a34a; margin-bottom: 10px;">
                        Email Verified Successfully!
                    </div>
                    <div style="background: #fef3c7; border: 1.5px solid #fde68a; border-radius: 12px; padding: 14px 16px; color: #b45309; font-weight: 700; font-size: 0.88rem; line-height: 1.5; text-align: left;">
                        ⏳ Waiting for Admin Approval: Your email is verified! Your application has been submitted to Admin (info@sni.org.in). Please wait until the Admin approves your account before signing in.
                    </div>
                </div>
            \`;

            actions.innerHTML = \`
                <button type="button" class="modal-btn modal-btn-primary" onclick="proceedToSignInAfterVerify('\${uid}')" style="background: #071b3b; color: #f5c75e; font-weight: 700; width: 100%;">
                    🔑 Return to Sign In
                </button>
            \`;

            modal.classList.add('active');
        }`;

if (content.includes(successModalOld)) {
  content = content.replace(successModalOld, successModalNew);
  console.log('Updated showVerifiedSuccessModal with exact text');
}

// 6. Update proceedToSignInAfterVerify with exact alert text
const proceedOld = `showAlert('⏳ Waiting for Admin Approval: Email verified! Your application has been submitted to Admin. You can sign in once approved.', 'info');`;
const proceedNew = `showAlert('⏳ Waiting for Admin Approval: Your email is verified! Your application has been submitted to Admin (info@sni.org.in). Please wait until the Admin approves your account before signing in.', 'info');`;
if (content.includes(proceedOld)) {
  content = content.replace(proceedOld, proceedNew);
  console.log('Updated proceedToSignInAfterVerify alert text');
}

// 7. Update pending user check in login
const pendingLoginOld = `showAlert('⏳ Waiting for Admin Approval: Your email is verified! Your application has been submitted to Admin. Please wait until the Admin approves your account before signing in.');`;
const pendingLoginNew = `showAlert('⏳ Waiting for Admin Approval: Your email is verified! Your application has been submitted to Admin (info@sni.org.in). Please wait until the Admin approves your account before signing in.', 'info');`;
if (content.includes(pendingLoginOld)) {
  content = content.replace(pendingLoginOld, pendingLoginNew);
  console.log('Updated pending login alert text');
}

// 8. Add event listener for enterExistingOtpLink and localStorage auto-restore at script bottom
const scriptEndOld = `        } else if (mode === 'join' || window.location.pathname.includes('join')) {
            switchMode('join');
        } else {
            switchMode('signin');
        }
        checkExistingSession();`;

const scriptEndNew = `        } else if (mode === 'join' || window.location.pathname.includes('join')) {
            switchMode('join');
            // Auto restore pending verification modal if present
            try {
                const savedPending = localStorage.getItem('sni_pending_verify_user');
                if (savedPending && !otpParam) {
                    const parsed = JSON.parse(savedPending);
                    if (parsed && parsed.userId) {
                        showVerificationModal(parsed);
                    }
                }
            } catch(e) {}
        } else {
            switchMode('signin');
        }

        const existingOtpLink = document.getElementById('enterExistingOtpLink');
        if (existingOtpLink) {
            existingOtpLink.addEventListener('click', () => {
                let saved = null;
                try { saved = JSON.parse(localStorage.getItem('sni_pending_verify_user')); } catch(e) {}
                const uid = saved?.userId || document.getElementById('joinUserId')?.value.trim() || prompt('Please enter your SNI User ID:')?.trim().toLowerCase();
                if (uid) {
                    showVerificationModal(saved || { userId: uid, email: document.getElementById('joinContact')?.value.trim() || uid });
                }
            });
        }

        checkExistingSession();`;

if (content.includes(scriptEndOld)) {
  content = content.replace(scriptEndOld, scriptEndNew);
  console.log('Updated script bottom with enterExistingOtpLink and localStorage auto-restore');
}

fs.writeFileSync(authPath, content, 'utf8');
console.log('Successfully written auth.html!');
