let auth;
let firestore;

async function initializeFirebase() {
  try {
    const response = await fetch("https://surya-api.vercel.app/api/config");
    if (!response.ok) {
      throw new Error(`Failed to fetch Config`);
    }

    const encryptedJSON = await response.json();

    const key = unscrambleData(encryptedJSON.alpha);
    const iv = unscrambleData(encryptedJSON.beta);
    const encryptedData = unscrambleData(encryptedJSON.gamma);

    const firebaseConfig = JSON.parse(decryptAES(encryptedData, key, iv));

    firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    firestore = firebase.firestore();
  } catch (error) {
    console.error("Error initializing Firebase:", error);
  }
}

function unscrambleData(scrambledText) {
  return scrambledText.slice(16, scrambledText.length - 16);
}

function decryptAES(encryptedText, key, iv) {
  const cryptoKey = CryptoJS.enc.Hex.parse(key);
  const cryptoIV = CryptoJS.enc.Hex.parse(iv);
  const ciphertextWordArray = CryptoJS.enc.Hex.parse(encryptedText);
  const cipherParams = CryptoJS.lib.CipherParams.create({
    ciphertext: ciphertextWordArray
  });
  const decrypted = CryptoJS.AES.decrypt(cipherParams, cryptoKey, {
    iv: cryptoIV,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  return decrypted.toString(CryptoJS.enc.Utf8);
}

const hostname = window.location.hostname;
if (hostname === "is-a.dev" || hostname.endsWith(".is-a.dev")) {
  initializeFirebase();
}


const scalerMean = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const scalerStd  = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

let model = null;
async function loadModel() {
  if (!model) {
    const modelPath = 'https://model.surya-ops.workers.dev/model.json';
    model = await tf.loadLayersModel(modelPath);
  }
}

function computeEntropy(s) {
  if (s.length === 0) return 0;
  const freq = {};
  for (const char of s) {
    freq[char] = (freq[char] || 0) + 1;
  }
  let entropy = 0;
  for (const char in freq) {
    const p = freq[char] / s.length;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

function extractFeatures(email) {
  email = email.trim().toLowerCase();
  let local = '', domain = '';
  if (email.includes('@')) {
    [local, domain] = email.split('@');
  } else {
    return new Array(15).fill(0);
  }
  const isGmail = (domain === 'gmail.com') ? 1 : 0;
  const isGooglemail = (domain === 'googlemail.com') ? 1 : 0;
  const plusPresent = local.includes('+') ? 1 : 0;
  const segments = local.split('.');
  const numSegments = segments.length;
  const avgSegLength = segments.reduce((sum, seg) => sum + seg.length, 0) / numSegments;
  const digitMatches = local.match(/\d/g) || [];
  const letterMatches = local.match(/[a-z]/g) || [];
  const countDigits = digitMatches.length;
  const countLetters = letterMatches.length;
  const digitLetterRatio = (countLetters > 0) ? countDigits / countLetters : 0;
  const localLength = local.length;
  const numDots = numSegments - 1;
  const specialMatches = local.match(/[^a-z0-9.+_-]/g) || [];
  const specialCount = specialMatches.length;
  const domainLength = domain.length;
  const countUnderscores = (local.match(/_/g) || []).length;
  const countHyphens = (local.match(/-/g) || []).length;
  const localEntropy = computeEntropy(local);
  return [
    isGmail,
    isGooglemail,
    plusPresent,
    numSegments,
    avgSegLength,
    digitLetterRatio,
    localLength,
    countDigits,
    countLetters,
    numDots,
    specialCount,
    domainLength,
    countUnderscores,
    countHyphens,
    localEntropy
  ];
}

function scaleFeatures(features) {
  return features.map((val, i) => (val - scalerMean[i]) / scalerStd[i]);
}

async function checkDisposable(email) {
  const lowerEmail = email.toLowerCase();

  if (lowerEmail.endsWith('@googlemail.com')) {
    return true;
  }

  if (lowerEmail.endsWith('@gmail.com')) {
    const localPart = email.split('@')[0];
    if (localPart.includes('+')) {
      return true;
    }
  }

  try {
    const response = await fetch(`https://disposable.debounce.io/?email=${encodeURIComponent(email)}`);
    if (!response.ok) {
      throw new Error("API response not OK");
    }
    const data = await response.json();
    if (data.disposable === "true") {
      return true;
    }
  } catch (error) {
    return true;
  }

  if (lowerEmail.endsWith('@gmail.com')) {
    try {
      if (!model) await loadModel();
      const features = extractFeatures(email);
      const scaledFeatures = scaleFeatures(features);

      const prediction = tf.tidy(() => {
        const inputTensor = tf.tensor2d([scaledFeatures]);
        return model.predict(inputTensor).dataSync()[0];
      });
      if (prediction >= 0.5) {
        return true;
      }
    } catch (error) {
      return true;
    }
  }
  return false;
}

const authChoiceContainer = document.getElementById('auth-choice');
const goSignupBtn = document.getElementById('go-signup-btn');
const goSigninBtn = document.getElementById('go-signin-btn');

const signupContainer = document.getElementById('signup-container');
const signupEmailInput = document.getElementById('signup-email');
const signupPasswordInput = document.getElementById('signup-password');
const signupPasswordConfirmInput  = document.getElementById('signup-password-confirm');
const signupSubmitBtn = document.getElementById('signup-submit-btn');
const signupBackBtn = document.getElementById('signup-back-btn');
const signupMessageEl = document.getElementById('signup-message');

const signinContainer = document.getElementById('signin-container');
const signinEmailInput = document.getElementById('signin-email');
const signinPasswordInput = document.getElementById('signin-password');
const signinSubmitBtn = document.getElementById('signin-submit-btn');
const signinBackBtn = document.getElementById('signin-back-btn');
const signinMessageEl = document.getElementById('signin-message');

const decryptionContainer = document.getElementById('decryption-container');
const resumeContainer = document.getElementById('resume-container');
const decryptionMessageEl = document.getElementById('decryption-message');
const userEmailSpan = document.getElementById('user-email');
const signoutBtn = document.getElementById('signout-btn');
const signout = document.getElementById('signout');

function switchView(hideEl, showEl) {
  hideEl.classList.add('view-exit');
  setTimeout(() => {
    hideEl.style.display = 'none';
    hideEl.classList.remove('view-exit');
    showEl.style.display = 'block';
    showEl.classList.add('view-enter');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => { showEl.classList.add('view-enter-active'); });
    });
    setTimeout(() => {
      showEl.classList.remove('view-enter', 'view-enter-active');
    }, 400);
  }, 250);
}

goSignupBtn.addEventListener('click', () => switchView(authChoiceContainer, signupContainer));
goSigninBtn.addEventListener('click', () => switchView(authChoiceContainer, signinContainer));
signupBackBtn.addEventListener('click', () => switchView(signupContainer, authChoiceContainer));
signinBackBtn.addEventListener('click', () => switchView(signinContainer, authChoiceContainer));

function validateEmail(email) {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=[\]{};:'",.<>\/?\\|~]).{8,20}$/;
  return passwordRegex.test(password);
}

function startLoader(button) {
  const originalHTML = button.innerHTML;
  const originalText = button.textContent;
  button.disabled = true;
  button.classList.add('btn-loading');
  button.innerHTML = '<span class="btn-spinner"></span><span class="btn-label">' + originalText + '</span>';
  return {
    stop: () => {
      button.classList.remove('btn-loading');
      button.innerHTML = originalHTML;
      button.disabled = false;
    }
  };
}

/* ── Full-screen processing overlay for heavy ops ── */
function showProcessingOverlay(msg) {
  let overlay = document.getElementById('processing-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'processing-overlay';
    overlay.innerHTML = '<div class="processing-content"><div class="processing-ring"></div><p class="processing-text"></p><div class="processing-bar"><div class="processing-bar-fill"></div></div></div>';
    document.body.appendChild(overlay);
  }
  overlay.querySelector('.processing-text').textContent = msg || 'Processing...';
  overlay.classList.add('visible');
  return {
    update: (text) => { overlay.querySelector('.processing-text').textContent = text; },
    hide: () => { overlay.classList.remove('visible'); }
  };
}

function solveCaptcha() {
  return new Promise((resolve, reject) => {
    const modal = document.getElementById("captcha-modal");
    const captchaImage = document.getElementById("captcha-image");
    const captchaInput = document.getElementById("captcha-input");
    const verifyBtn = document.getElementById("captcha-verify-btn");
    const refreshBtn = document.getElementById("captcha-refresh-btn");
    const closeBtn = document.getElementById("captcha-close-btn");
    const captchaError = document.getElementById("captcha-error");
    let captchaToken = "";

    function loadCaptcha() {
      captchaError.textContent = "";
      captchaInput.value = "";
      const loader = startLoader(refreshBtn);
      fetch("https://surya-api.vercel.app/api/captcha")
        .then(res => {
          if (res.status === 429) {
            throw new Error("Too many refresh requests. Please wait a moment.");
          }
          return res.json();
        })
        .then(data => {
          loader.stop();
          captchaImage.src = "data:image/svg+xml;base64," + btoa(data.image);
          captchaToken = data.token;
        })
        .catch(err => {
          loader.stop();
          captchaError.textContent = err.message || "Error loading captcha.";
          refreshBtn.disabled = true;
          setTimeout(() => {
            refreshBtn.disabled = false;
          }, 1000);
        });
    }

    loadCaptcha();
    modal.style.display = "flex";

    verifyBtn.onclick = function() {
      const answer = captchaInput.value.trim();

      if (!answer) {
        captchaError.textContent = "Please enter the captcha.";
        return;
      }
      if (answer.length !== 6) {
        captchaError.textContent = "Captcha must be exactly 6 characters.";
        return;
      }
      const captchaRegex = /^[A-Za-z0-9]{6}$/;
      if (!captchaRegex.test(answer)) {
        captchaError.textContent = "Captcha can only contain letters and numbers.";
        return;
      }

      fetch("https://surya-api.vercel.app/api/verify-captcha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: captchaToken, answer })
      })
        .then(res => {
          if (res.status === 429) {
            throw new Error("Too many verification attempts. Please wait a moment.");
          }
          return res.json();
        })
        .then(data => {
          if (data.success) {
            modal.style.display = "none";
            resolve();
          } else {
            captchaError.textContent = data.error || "Incorrect captcha. Please try again.";
          }
        })
        .catch(err => {
          captchaError.textContent = err.message || "Error verifying captcha.";
          verifyBtn.disabled = true;
          setTimeout(() => {
            verifyBtn.disabled = false;
          }, 1000);
        });
    };

    refreshBtn.onclick = function() {
      loadCaptcha();
    };

    closeBtn.onclick = function() {
      modal.style.display = "none";
      reject(new Error("User closed captcha"));
    };

    captchaInput.addEventListener('keydown', function(e) {
      if (e.key === "Enter") {
        verifyBtn.click();
      }
    });
  });
}

signupSubmitBtn.addEventListener('click', async () => {
  if (signupSubmitBtn.disabled) return;
  const email = signupEmailInput.value.trim();
  const password = signupPasswordInput.value.trim();
  const confirmPassword = signupPasswordConfirmInput.value.trim();

  if (!email || !password || !confirmPassword) {
    showMessage(signupMessageEl, 'Email and both password fields are required.', 'red');
    return;
  }
  if (!validateEmail(email)) {
    showMessage(signupMessageEl, 'Invalid email format.', 'red');
    return;
  }
  if (!validatePassword(password)) {
    showMessage(signupMessageEl, 'Password must be 8\u201320 chars long and include uppercase, lowercase, number & one special character.', 'red');
    return;
  }

  if (password !== confirmPassword) {
    showMessage(signupMessageEl, 'Passwords do not match.', 'red');
    return;
  }

  signupSubmitBtn.disabled = true;
  signupMessageEl.textContent = '';
  signupMessageEl.classList.remove('msg-animate');

  try {
    await solveCaptcha();
  } catch (err) {
    showMessage(signupMessageEl, 'Captcha verification failed or cancelled. Please try again.', 'red');
    signupSubmitBtn.disabled = false;
    return;
  }

  try {
    const isDisposable = await checkDisposable(email);
    if (isDisposable) {
      showMessage(signupMessageEl, 'Disposable email addresses are not allowed. Please use a valid email.', 'red');
      signupSubmitBtn.disabled = false;
      return;
    }
  } catch (err) {
    showMessage(signupMessageEl, 'Unable to validate email. Please try again later.', 'red');
    signupSubmitBtn.disabled = false;
    return;
  }

  const loader = startLoader(signupSubmitBtn);

  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    await userCredential.user.sendEmailVerification();
    (async () => {
      const now = new Date();
      const payload = {
        email,
        signupTime: now.toLocaleTimeString(),
        timestamp: now.toISOString().split('T')[0]
      };
      try {
        await fetch('https://surya-verify.vercel.app/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (notifyErr) {}
    })();
    loader.stop();
    showMessage(signupMessageEl, 'Sign-up successful! Please check your email for a verification link. Once verified, please log in.', 'green');
    setTimeout(() => {
      signupEmailInput.value = '';
      signupPasswordInput.value = '';
      signupPasswordConfirmInput.value = '';
      signupSubmitBtn.disabled = false;
      switchView(signupContainer, signinContainer);
    }, 5000);
  } catch (error) {
    loader.stop();
    showMessage(signupMessageEl, 'Sign-up failed. Please try again later.', 'red');
    setTimeout(() => { location.reload(); }, 3000);
  }
});

function startSessionTimer() {
    const signoutBtn = document.getElementById('signout-btn');
    const countdownEl = document.getElementById('countdown-timer');

    let timeLeft = 120;

    const countdown = setInterval(() => {
      if (timeLeft <= 0) {
        clearInterval(countdown);
        signoutBtn.click();
      } else {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        const display = `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
        countdownEl.textContent = `Time left: ${display}`;
        timeLeft -= 1;
      }
    }, 1000);
  }

signinSubmitBtn.addEventListener('click', async () => {
  if (signinSubmitBtn.disabled) return;
  const email = signinEmailInput.value.trim();
  const password = signinPasswordInput.value.trim();
  if (!email || !password) {
    showMessage(signinMessageEl, 'Email and password cannot be empty.', 'red');
    return;
  }

  signinSubmitBtn.disabled = true;
  signinMessageEl.textContent = '';
  signinMessageEl.classList.remove('msg-animate');

  try {
    await solveCaptcha();
  } catch (err) {
    showMessage(signinMessageEl, 'Captcha verification failed or cancelled. Please try again.', 'red');
    signinSubmitBtn.disabled = false;
    return;
  }

  const loader = startLoader(signinSubmitBtn);
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    if (!user.emailVerified) {
      loader.stop();
      signinSubmitBtn.disabled = false;
      showMessage(signinMessageEl, 'Please verify your email before signing in.', 'red');
      return;
    }
    
    (async () => {
      const now = new Date();
      const payload = {
        email: user.email,
        loginTime: now.toLocaleTimeString(),
        timestamp: now.toISOString().split('T')[0]
      };
      
      try {
        await fetch('https://surya-verify.vercel.app/api/notify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      } catch (notifyErr) {}
    })();
    
    loader.stop();
    switchView(signinContainer, decryptionContainer);
    userEmailSpan.textContent = user.email;
    startSessionTimer();
  } catch (error) {
    loader.stop();
    signinSubmitBtn.disabled = false;
    showMessage(signinMessageEl, 'Sign-in failed. Please check your credentials and try again.', 'red');
  }
});

function handleSignOut() {
  auth.signOut().catch(function(){}).finally(function() {
    localStorage.removeItem("Key");
    location.reload();
  });
}
signoutBtn.addEventListener('click', handleSignOut);
signout.addEventListener('click', handleSignOut);

function base64ToArrayBuffer(base64) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

async function decryptResume(encryptedData, password, salt, iv) {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      encryptedData
    );
    return decrypted;
  } catch (e) {
    throw new Error("Incorrect decryption password");
  }
}

async function fetchEncryptionKeys() {
  try {
    const user = auth.currentUser;
    if (!user || !user.emailVerified) {
      throw new Error("You must be signed in with a verified email.");
    }
    const docRef = firestore.collection("config").doc("encryption_keys");
    const docSnapshot = await docRef.get();
    if (!docSnapshot.exists) {
      throw new Error("Encryption keys not found.");
    }
    const saltBase64 = docSnapshot.data().salt;
    const ivBase64 = docSnapshot.data().iv;
    if (!saltBase64 || !ivBase64) {
      throw new Error("Salt or IV is not available.");
    }
    const salt = base64ToArrayBuffer(saltBase64);
    const iv = base64ToArrayBuffer(ivBase64);
    return { salt, iv };
  } catch (error) {
    throw new Error("Access denied or encryption keys not found.");
  }
}

document.addEventListener("DOMContentLoaded", function() {
  const savedKey = localStorage.getItem("Key");
  if (savedKey) {
    document.getElementById("decrypt-password").value = savedKey;
  }
});

const decryptBtn = document.getElementById('decrypt-btn');
decryptBtn.addEventListener('click', async () => {
  if (decryptBtn.disabled) return;
  const decryptPassword = document.getElementById('decrypt-password').value.trim();
  if (!decryptPassword) {
    showMessage(decryptionMessageEl, 'Please enter the decryption password.', 'red');
    return;
  }

  const overlay = showProcessingOverlay('Fetching encryption keys...');
  const loader = startLoader(decryptBtn);
  decryptionMessageEl.textContent = '';

  try {
    overlay.update('Retrieving encryption keys...');
    const { salt, iv } = await fetchEncryptionKeys();

    overlay.update('Downloading encrypted resume...');
    const response = await fetch("https://surya-api.vercel.app/api/cvEnc");
    if (!response.ok) throw new Error("Failed to load the resume file.");
    const encryptedData = await response.arrayBuffer();

    overlay.update('Decrypting resume...');
    const decryptedBuffer = await decryptResume(encryptedData, decryptPassword, salt, iv);
    localStorage.setItem("Key", decryptPassword);

    overlay.update('Rendering document...');
    const blob = new Blob([decryptedBuffer], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    document.getElementById('resume-frame').src = url;

    fetch('https://surya-verify.vercel.app/api/notify-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    }).catch(function(){});

    overlay.hide();
    loader.stop();
    switchView(decryptionContainer, resumeContainer);
  } catch (error) {
    overlay.hide();
    loader.stop();
    showMessage(decryptionMessageEl, error.message, 'red');
  }
});

document.querySelectorAll('.show-password').forEach(function(link) {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    var inputId = this.getAttribute('data-toggle');
    var input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
      this.textContent = 'Hide';
    } else {
      input.type = 'password';
      this.textContent = 'Show';
    }
  });
});

signupContainer.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    signupSubmitBtn.click();
  }
});

signinContainer.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    signinSubmitBtn.click();
  }
});

decryptionContainer.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    document.getElementById('decrypt-btn').click();
  }
});

function showMessage(el, text, color) {
  el.classList.remove('msg-animate');
  void el.offsetWidth;
  el.style.color = color;
  el.textContent = text;
  el.classList.add('msg-animate');
}
