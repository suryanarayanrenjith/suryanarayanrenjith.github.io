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
      console.error("Error initializing Config:", error);
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
  } else {
    console.error("Unauthorized domain");
  }

  
const scalerMean = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const scalerStd  = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

let model = null;
async function loadModel() {
  if (!model) {
    const modelPath = '/assets/tfjs_model/model.json';
    model = await tf.loadLayersModel(modelPath);
    console.log("Model loaded successfully.");
  }
}

document.addEventListener('DOMContentLoaded', loadModel);

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
    console.error("Error checking email", error);
    return true;
  }

  if (lowerEmail.endsWith('@gmail.com')) {
    try {
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
      console.error("Error in Model check:", error);
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

goSignupBtn.addEventListener('click', () => {
  authChoiceContainer.style.display = 'none';
  signupContainer.style.display = 'block';
});
goSigninBtn.addEventListener('click', () => {
  authChoiceContainer.style.display = 'none';
  signinContainer.style.display = 'block';
});
signupBackBtn.addEventListener('click', () => {
  signupContainer.style.display = 'none';
  authChoiceContainer.style.display = 'block';
});
signinBackBtn.addEventListener('click', () => {
  signinContainer.style.display = 'none';
  authChoiceContainer.style.display = 'block';
});

function validateEmail(email) {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=[\]{};:'",.<>/?\\|~]).{8,}$/;
  return passwordRegex.test(password);
}

function startLoader(button) {
  const originalText = button.textContent;
  let dotCount = 0;
  button.disabled = true;
  const intervalId = setInterval(() => {
    dotCount = (dotCount % 3) + 1;
    button.textContent = originalText + ' ' + '.'.repeat(dotCount);
  }, 500);
  return {
    stop: () => {
      clearInterval(intervalId);
      button.textContent = originalText;
      button.disabled = false;
    }
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
      fetch("https://surya-api.vercel.app/api/captcha")
        .then(res => {
          if (res.status === 429) {
            throw new Error("Too many refresh requests. Please wait a moment.");
          }
          return res.json();
        })
        .then(data => {
          captchaImage.src = "data:image/svg+xml;base64," + btoa(data.image);
          captchaToken = data.token;
        })
        .catch(err => {
          captchaError.textContent = err.message || "Error loading captcha.";
          console.error("Captcha load error:", err);
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
          localStorage.setItem("verifiedCaptcha", data.verifiedCaptcha);
          localStorage.setItem("captchaVerifiedAt", Date.now().toString());

          modal.style.display = "none";
          resolve();
        } else {
          captchaError.textContent = data.error || "Incorrect captcha. Please try again.";
        }
      })
      .catch(err => {
        captchaError.textContent = err.message || "Error verifying captcha.";
        console.error("Captcha verify error:", err);
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
  const email = signupEmailInput.value.trim();
  const password = signupPasswordInput.value.trim();

  if (!email || !password) {
    signupMessageEl.style.color = 'red';
    signupMessageEl.textContent = 'Email and password cannot be empty.';
    return;
  }
  if (!validateEmail(email)) {
    signupMessageEl.style.color = 'red';
    signupMessageEl.textContent = 'Invalid email format.';
    return;
  }
  if (!validatePassword(password)) {
    signupMessageEl.style.color = 'red';
    signupMessageEl.textContent =
      'Password must be at least 8 characters long and include at least one letter, one number, and one special character.';
    return;
  }
  
  try {
    const isDisposable = await checkDisposable(email);
    if (isDisposable) {
      signupMessageEl.style.color = 'red';
      signupMessageEl.textContent = 'Disposable email addresses are not allowed. Please use a valid email.';
      return;
    }
  } catch (err) {
    console.error("Error during disposable check", err);
    signupMessageEl.style.color = 'red';
    signupMessageEl.textContent = 'Unable to validate email. Please try again later.';
    return;
  }

  try {
    await solveCaptcha();
  } catch (err) {
    signupMessageEl.style.color = 'red';
    signupMessageEl.textContent = 'Captcha verification failed or cancelled. Please try again.';
    return;
  }

  const loader = startLoader(signupSubmitBtn);

  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    await userCredential.user.sendEmailVerification();
    loader.stop();
    signupMessageEl.style.color = 'green';
    signupMessageEl.textContent =
      'Sign-up successful! Please check your email for a verification link. The page will refresh shortly. Once verified, please log in again.';
    setTimeout(() => {
      location.reload();
    }, 5000);
  } catch (error) {
    loader.stop();
    console.error("Sign-up error", error);
    signupMessageEl.style.color = 'red';
    signupMessageEl.textContent = 'Sign-up failed. Please try again later.';
  }
});

signinSubmitBtn.addEventListener('click', async () => {
  const email = signinEmailInput.value.trim();
  const password = signinPasswordInput.value.trim();
  if (!email || !password) {
    signinMessageEl.style.color = 'red';
    signinMessageEl.textContent = 'Email and password cannot be empty.';
    return;
  }

  const storedCaptcha = localStorage.getItem('verifiedCaptcha');
  const storedTimestamp = parseInt(localStorage.getItem('captchaVerifiedAt'), 10);
  const MAX_CAPTCHA_AGE = 5 * 60 * 1000;

  let captchaValid = false;
  if (storedCaptcha && storedTimestamp) {
    const age = Date.now() - storedTimestamp;
    if (age <= MAX_CAPTCHA_AGE) {
      captchaValid = true;
    }
  }

  if (!captchaValid) {
    try {
      await solveCaptcha();
    } catch (err) {
      signinMessageEl.style.color = 'red';
      signinMessageEl.textContent = 'Captcha verification failed or cancelled. Please try again.';
      return;
    }
  }

  const loader = startLoader(signinSubmitBtn);
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    if (!user.emailVerified) {
      loader.stop();
      signinMessageEl.style.color = 'red';
      signinMessageEl.textContent = 'Please verify your email before signing in.';
      return;
    }
    loader.stop();
    signinContainer.style.display = 'none';
    decryptionContainer.style.display = 'block';
    userEmailSpan.textContent = user.email;
  } catch (error) {
    loader.stop();
    console.error("Sign-in error", error);
    signinMessageEl.style.color = 'red';
    signinMessageEl.textContent = 'Sign-in failed. Please check your credentials and try again.';
  }
});

signoutBtn.addEventListener('click', async () => {
  try {
    await auth.signOut();
  } catch (error) {
    console.error("Sign-out error", error);
  }
  localStorage.removeItem("Key");
  location.reload();
});

signout.addEventListener('click', async () => {
  try {
    await auth.signOut();
  } catch (error) {
    console.error("Sign-out error", error);
  }
  localStorage.removeItem("Key");
  location.reload();
});

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
    console.error("Error fetching encryption keys:", error);
    throw new Error("Access denied or encryption keys not found.");
  }
}

document.addEventListener("DOMContentLoaded", function() {
  const savedKey = localStorage.getItem("Key");
  if (savedKey) {
    document.getElementById("decrypt-password").value = savedKey;
  }
});

  document.getElementById('decrypt-btn').addEventListener('click', async () => {
    const decryptPassword = document.getElementById('decrypt-password').value.trim();
    if (!decryptPassword) {
      decryptionMessageEl.style.color = "red";
      decryptionMessageEl.textContent = "Please enter the decryption password.";
      return;
    }
    decryptionMessageEl.style.color = "black";
    decryptionMessageEl.textContent = "Fetching encryption keys, verifying password, and decrypting resume, please wait...";
    try {
      const { salt, iv } = await fetchEncryptionKeys();
      const response = await fetch("/assets/CV.enc");
      if (!response.ok) {
        throw new Error("Failed to load the encrypted resume file.");
      }
      const encryptedData = await response.arrayBuffer();
      const decryptedBuffer = await decryptResume(encryptedData, decryptPassword, salt, iv);
      localStorage.setItem("Key", decryptPassword);
      const blob = new Blob([decryptedBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      document.getElementById('resume-frame').src = url;
      decryptionContainer.style.display = "none";
      resumeContainer.style.display = "block";
    } catch (error) {
      decryptionMessageEl.style.color = "red";
      decryptionMessageEl.textContent = error.message;
    }
  });

  function togglePassword(inputId, event) {
    event.preventDefault();
    var passwordInput = document.getElementById(inputId);
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
    } else {
        passwordInput.type = "password";
    }
  }

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
