const PERSONAL_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "yahoo.com",
  "ymail.com",
  "rocketmail.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "proton.me",
  "protonmail.com",
  "pm.me",
  "tuta.io",
  "tutanota.com",
  "tutamail.com",
  "startmail.com",
  "mailfence.com",
  "disroot.org",
  "posteo.net",
  "gmx.com",
  "gmx.de",
  "gmx.net",
  "web.de",
  "mail.com",
  "email.com",
  "usa.com",
  "inbox.com",
  "aol.com",
  "aim.com",
  "comcast.net",
  "verizon.net",
  "att.net",
  "bellsouth.net",
  "btinternet.com",
  "virginmedia.com",
  "orange.fr",
  "wanadoo.fr",
]);

const FIELD_LABELS = {
    name: "identity",
    email: "reply route",
    subject: "mission header",
    message: "full brief"
};

const INTENT_PATTERNS = [
    ["Hiring", ["hire", "hiring", "role", "job", "position", "interview", "recruit"]],
    ["Collaboration", ["collab", "collaboration", "partner", "partnership", "team up", "co-build", "together"]],
    ["Project request", ["project", "website", "app", "design", "develop", "build", "freelance", "contract"]],
    ["Bug report", ["bug", "issue", "broken", "error", "fix", "problem", "crash"]],
    ["Question", ["question", "help", "support", "curious", "ask", "wondering", "can you", "could you"]],
    ["Speaking", ["event", "speak", "talk", "podcast", "panel", "workshop"]]
];

const HIGH_URGENCY_PATTERN = /(urgent|asap|immediately|right away|today|tonight|deadline|critical)/i;
const MEDIUM_URGENCY_PATTERN = /(soon|this week|quick|whenever possible|follow up)/i;
const TIMELINE_PATTERN = /(monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tomorrow|next week|next month|deadline|by\s+[a-z0-9]|q[1-4]|january|february|march|april|may|june|july|august|september|october|november|december)/i;
const BUDGET_PATTERN = /(budget|paid|compensation|rate|pricing|\$|usd|inr)/i;
const LINK_PATTERN = /(https?:\/\/|www\.)/i;
const CTA_PATTERN = /(call|meet|chat|reply|respond|schedule|connect|follow up|next step|available|availability|intro call|let me know)/i;
const DELIVERABLE_PATTERN = /(landing page|dashboard|prototype|brand|site|website|app|system|audit|consult|review|demo|feature|launch|migration|integration)/i;
const TIMELINE_INTENTS = new Set(["Project request", "Collaboration", "Hiring", "Speaking"]);
const CTA_INTENTS = new Set(["Project request", "Collaboration", "Hiring", "Question", "Speaking"]);
const DELIVERABLE_INTENTS = new Set(["Project request", "Bug report"]);
const REFERENCE_INTENTS = new Set(["Project request", "Bug report"]);
const CONTACT_API_URL = "https://surya-verify.vercel.app/api/contact.js";
const CONTACT_ALLOWED_ORIGIN = "https://surya.is-a.dev";
const DISPOSABLE_SCALER_MEAN = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const DISPOSABLE_SCALER_STD = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_ALLOWED_PATTERN = /^[\p{L}\p{M}\s.'-]+$/u;
const PLACEHOLDER_PATTERN = /\b(?:test(?:ing)?|dummy|sample|placeholder|lorem(?:\s+ipsum)?|foo|bar)\b/i;
const KEYBOARD_MASH_PATTERN = /\b(?:asdf(?:gh)?|qwer(?:ty)?|zxcv(?:bn)?|fdsa|poiuy|lkjhg|mnbvc|qazwsx|wsxedc|edcrfv|sdfgh|dfghj|abc123|12345|54321|sdfsdf|dfsdf)\b/i;
const TEST_MESSAGE_ONLY_PATTERN = /^\s*(?:hi[,.!\s]+)?(?:this\s+is\s+)?(?:just\s+)?(?:a\s+)?(?:test|testing|dummy|sample)(?:\s+message)?[.!?\s]*$/i;

let disposableModel = null;
const disposableCheckCache = new Map();

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function countWords(value) {
    return value.trim() ? value.trim().split(/\s+/).filter(Boolean).length : 0;
}

function firstName(value) {
    const part = value.trim().split(/\s+/).filter(Boolean)[0] || "";
    const cleaned = part.replace(/^[^A-Za-z]+|[^A-Za-z'-]+$/g, "");
    if (cleaned.length < 2) return "";
    return cleaned
        .split(/(['-])/)
        .map((segment) => (/['-]/.test(segment)
            ? segment
            : segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase()))
        .join("");
}

function readableList(items) {
    if (!items.length) return "";
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} and ${items[1]}`;
    return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function normalizeToken(value) {
    return value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}

function extractLetters(value) {
    return (value.match(/\p{L}/gu) || []).join("");
}

function tokenizeText(value) {
    return value.match(/[\p{L}\p{N}]+(?:['-][\p{L}\p{N}]+)*/gu) || [];
}

function hasVowel(value) {
    return /[aeiouy]/i.test(value);
}

function uniqueTokenRatio(tokens) {
    const normalized = tokens.map((token) => normalizeToken(token)).filter(Boolean);
    if (!normalized.length) return 0;
    return new Set(normalized).size / normalized.length;
}

function isAcronymToken(token) {
    const compact = token.replace(/[^A-Za-z0-9]/g, "");
    return compact.length >= 2 && compact.length <= 6 && compact === compact.toUpperCase();
}

function isRepeatedPattern(value) {
    const normalized = normalizeToken(value);
    if (normalized.length < 3) return false;

    for (let size = 1; size <= Math.floor(normalized.length / 2); size += 1) {
        if (normalized.length % size !== 0) continue;
        const chunk = normalized.slice(0, size);
        if (chunk.repeat(normalized.length / size) === normalized) {
            return true;
        }
    }

    return false;
}

function isSuspiciousWord(token) {
    const letters = extractLetters(token).toLowerCase();
    const normalized = normalizeToken(token);
    if (!normalized) return false;
    if (KEYBOARD_MASH_PATTERN.test(token)) return true;
    if (letters.length >= 3 && isRepeatedPattern(letters)) return true;
    if (letters.length >= 4 && !hasVowel(letters) && !isAcronymToken(token)) return true;
    if (letters.length >= 5 && computeEntropy(letters) < 1.45) return true;
    return false;
}

function getTextSignals(value) {
    const words = tokenizeText(value);
    const suspiciousWordCount = words.filter((word) => isSuspiciousWord(word)).length;
    const naturalWordCount = words.filter((word) => {
        const letters = extractLetters(word);
        if (!letters) return false;
        if (isAcronymToken(word)) return true;
        if (letters.length <= 2) return true;
        return hasVowel(letters);
    }).length;

    const placeholderHits = [
        PLACEHOLDER_PATTERN.test(value),
        KEYBOARD_MASH_PATTERN.test(value),
        TEST_MESSAGE_ONLY_PATTERN.test(value),
        /(.)\1{3,}/.test(value)
    ].filter(Boolean).length;

    return {
        words,
        wordCount: words.length,
        suspiciousWordCount,
        naturalWordCount,
        uniqueRatio: uniqueTokenRatio(words),
        placeholderHits
    };
}

function createAssessment(valid, message) {
    return { valid, message };
}

function assessNameField(value) {
    const trimmed = value.trim();
    if (!trimmed) return createAssessment(false, "Name is required.");

    const letters = extractLetters(trimmed);
    const segments = trimmed
        .split(/[\s'-]+/)
        .map((segment) => extractLetters(segment))
        .filter(Boolean);

    if (letters.length < 2) {
        return createAssessment(false, "Name needs at least two letters.");
    }

    if (!NAME_ALLOWED_PATTERN.test(trimmed)) {
        return createAssessment(false, "Use letters, spaces, apostrophes, or hyphens for the name.");
    }

    if (!segments.some((segment) => segment.length >= 2)) {
        return createAssessment(false, "Use more than initials so I know who I am replying to.");
    }

    if (PLACEHOLDER_PATTERN.test(trimmed) || KEYBOARD_MASH_PATTERN.test(trimmed)) {
        return createAssessment(false, "Name looks like placeholder text. Use your real name.");
    }

    if (segments.some((segment) => segment.length >= 3 && isRepeatedPattern(segment))) {
        return createAssessment(false, "Name looks synthetic. Use your real name.");
    }

    if (segments.some((segment) => segment.length >= 4 && !hasVowel(segment))) {
        return createAssessment(false, "Name looks synthetic. Use your real name.");
    }

    return createAssessment(true, "");
}

function assessSubjectField(value) {
    const trimmed = value.trim();
    const letters = extractLetters(trimmed);
    const signals = getTextSignals(trimmed);

    if (!trimmed) return createAssessment(false, "Subject is required.");
    if (letters.length < 3) return createAssessment(false, "Subject needs a clearer headline.");
    if (!signals.wordCount) return createAssessment(false, "Subject needs a real topic or request.");

    if (signals.placeholderHits >= 2 || (signals.placeholderHits >= 1 && signals.wordCount <= 4)) {
        return createAssessment(false, "Subject looks like test text. Use the real topic or request.");
    }

    if (signals.wordCount === 1 && signals.suspiciousWordCount === 1) {
        return createAssessment(false, "Subject reads like random characters. Use the actual topic.");
    }

    if (signals.suspiciousWordCount >= Math.max(1, Math.ceil(signals.wordCount * 0.6))) {
        return createAssessment(false, "Subject needs a real topic, not placeholder text.");
    }

    if (signals.uniqueRatio < 0.5 && signals.wordCount >= 3) {
        return createAssessment(false, "Subject repeats itself too much. Make it more specific.");
    }

    return createAssessment(true, "");
}

function assessMessageField(value) {
    const trimmed = value.trim();
    const signals = getTextSignals(trimmed);

    if (!trimmed) return createAssessment(false, "Message is required.");

    if (TEST_MESSAGE_ONLY_PATTERN.test(trimmed)) {
        return createAssessment(false, "Message reads like a test ping. Add the real reason you are reaching out.");
    }

    if (signals.placeholderHits >= 2 || (signals.placeholderHits >= 1 && signals.wordCount <= 6)) {
        return createAssessment(false, "Message reads like test content. Add the real goal, context, or question.");
    }

    if (signals.suspiciousWordCount >= Math.max(2, Math.ceil(signals.wordCount * 0.5))) {
        return createAssessment(false, "Message reads like random characters. Add a real goal, question, or project brief.");
    }

    if (trimmed.length < 10 || signals.wordCount < 4) {
        return createAssessment(false, "Message is too short. Add a real question, goal, or context.");
    }

    if (signals.naturalWordCount < Math.max(3, Math.ceil(signals.wordCount * 0.6))) {
        return createAssessment(false, "Message needs clearer wording. Add a real question, goal, or project context.");
    }

    if (signals.uniqueRatio < 0.45 && signals.wordCount >= 5) {
        return createAssessment(false, "Message repeats itself too much. Add more specific context instead of filler.");
    }

    return createAssessment(true, "");
}

function assessContactField(fieldName, value) {
    switch (fieldName) {
        case "name":
            return assessNameField(value);
        case "email":
            return createAssessment(EMAIL_PATTERN.test(value.trim()), !value.trim()
                ? "Email is required."
                : !value.includes("@")
                    ? "Email needs an @ symbol."
                    : !/\.[A-Za-z]{2,}$/.test(value)
                        ? "Email domain looks incomplete."
                        : "Email needs a valid inbox format.");
        case "subject":
            return assessSubjectField(value);
        case "message":
            return assessMessageField(value);
        default:
            return createAssessment(Boolean(value.trim()), "That field needs another pass.");
    }
}

async function loadDisposableModel() {
    if (!disposableModel) {
        if (!window.tf || typeof window.tf.loadLayersModel !== "function") {
            throw new Error("TensorFlow unavailable");
        }
        const modelPath = "https://model.surya-ops.workers.dev/model.json";
        const requestInit = {
            mode: "cors",
            credentials: "omit",
            referrerPolicy: "origin"
        };

        if (window.location && window.location.origin) {
            requestInit.referrer = `${window.location.origin}/`;
        }

        disposableModel = await window.tf.loadLayersModel(modelPath, {
            requestInit
        });
    }
}

function computeEntropy(value) {
    if (!value.length) return 0;
    const freq = {};
    for (const char of value) {
        freq[char] = (freq[char] || 0) + 1;
    }
    let entropy = 0;
    Object.keys(freq).forEach((char) => {
        const probability = freq[char] / value.length;
        entropy -= probability * Math.log2(probability);
    });
    return entropy;
}

function extractDisposableFeatures(email) {
    const normalized = email.trim().toLowerCase();
    let local = "";
    let domain = "";
    if (normalized.includes("@")) {
        [local, domain] = normalized.split("@");
    } else {
        return new Array(15).fill(0);
    }

    const isGmail = domain === "gmail.com" ? 1 : 0;
    const isGooglemail = domain === "googlemail.com" ? 1 : 0;
    const plusPresent = local.includes("+") ? 1 : 0;
    const segments = local.split(".");
    const numSegments = segments.length;
    const avgSegLength = segments.reduce((sum, segment) => sum + segment.length, 0) / numSegments;
    const digitMatches = local.match(/\d/g) || [];
    const letterMatches = local.match(/[a-z]/g) || [];
    const countDigits = digitMatches.length;
    const countLetters = letterMatches.length;
    const digitLetterRatio = countLetters > 0 ? countDigits / countLetters : 0;
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

function scaleDisposableFeatures(features) {
    return features.map((value, index) => (value - DISPOSABLE_SCALER_MEAN[index]) / DISPOSABLE_SCALER_STD[index]);
}

async function verifyEmailDisposable(email) {
    const normalized = email.trim().toLowerCase();

    if (disposableCheckCache.has(normalized)) {
        return disposableCheckCache.get(normalized);
    }

    let result = { disposable: false, reason: "clear" };

    if (normalized.endsWith("@googlemail.com")) {
        result = { disposable: true, reason: "googlemail" };
    } else if (normalized.endsWith("@gmail.com") && normalized.split("@")[0].includes("+")) {
        result = { disposable: true, reason: "gmail_plus" };
    } else {
        try {
            const response = await fetch(`https://disposable.debounce.io/?email=${encodeURIComponent(email)}`);
            if (!response.ok) {
                throw new Error("API response not OK");
            }
            const data = await response.json();
            if (data.disposable === "true") {
                result = { disposable: true, reason: "provider" };
            }
        } catch (error) {
            result = { disposable: true, reason: "verification_unavailable" };
        }

        if (!result.disposable && normalized.endsWith("@gmail.com")) {
            try {
                await loadDisposableModel();
                const features = extractDisposableFeatures(email);
                const scaledFeatures = scaleDisposableFeatures(features);
                const prediction = window.tf.tidy(() => {
                    const inputTensor = window.tf.tensor2d([scaledFeatures]);
                    return disposableModel.predict(inputTensor).dataSync()[0];
                });
                if (prediction >= 0.5) {
                    result = { disposable: true, reason: "model" };
                }
            } catch (error) {
                result = { disposable: true, reason: "verification_unavailable" };
            }
        }
    }

    if (result.reason !== "verification_unavailable") {
        disposableCheckCache.set(normalized, result);
    }
    return result;
}

async function submitContactSignal(payload) {
    const response = await fetch(CONTACT_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    let data = {};
    try {
        data = await response.json();
    } catch (error) {
        data = {};
    }

    if (!response.ok) {
        const error = new Error(data.message || data.error || "Failed to send message");
        error.status = response.status;
        error.payload = data;
        throw error;
    }

    return data;
}

class Robot3D {
    constructor(container) {
        this.container = container;
        this.canvas = document.getElementById("robotCanvas");
        this.speech = document.getElementById("speech");
        this.statusEl = document.getElementById("status");
        this.form = document.getElementById("contactForm");
        this.counter = document.getElementById("counter");
        this.button = document.getElementById("submitBtn");
        this.honeypot = document.getElementById("website");
        this.fields = new Map();
        this.formData = { name: "", email: "", subject: "", message: "" };
        this.analysis = this.defaultAnalysis();
        this.activeField = "";
        this.mood = "";
        this.pointerTarget = { x: 0, y: 0 };
        this.look = { x: 0, y: 0 };
        this.focusTarget = { x: 0, y: 0 };
        this.focusStrength = 0;
        this.antennaPulse = 0;
        this.cheekTarget = 0;
        this.shakeStrength = 0;
        this.celebration = 0;
        this.lastTime = 0;
        this.lastSpeechText = "";
        this.lastSpeechAt = 0;
        this.nextBlinkAt = 1.8;
        this.blinkPhase = 0;
        this.milestones = this.defaultMilestones();
        this.init();
    }

    defaultAnalysis() {
        return {
            intent: "General",
            urgency: "Low",
            readiness: 0,
            validMap: { name: false, email: false, subject: false, message: false },
            allValid: false,
            firstName: "",
            emailDomain: "",
            emailType: "",
            wordCount: 0,
            hasLink: false,
            hasTimeline: false,
            hasBudget: false,
            hasQuestion: false,
            hasCTA: false,
            hasDeliverable: false,
            detail: "empty",
            missingSignals: [],
            qualityIssues: [],
            statusLine: "Awaiting input",
            coachLine: "Full brief channel open. Goal, context, and next step are all useful.",
            coachSignature: "General|empty|Low",
            actionable: false
        };
    }

    defaultMilestones() {
        return {
            named: false,
            emailValidated: false,
            intent: "",
            urgency: "Low",
            linkSeen: false,
            ready: false,
            detail: "empty",
            coachSignature: ""
        };
    }

    init() {
        document.querySelectorAll(".input-field").forEach((field) => {
            this.fields.set(field.dataset.field, {
                field,
                input: field.querySelector("input, textarea")
            });
        });

        this.setupScene();
        this.createRobot();
        this.setupLighting();
        this.setupForm();
        this.syncAnalysis();
        this.setMood("idle");
        this.setStatus("Awaiting input", "active");
        this.animate(0);
    }

    setupScene() {
        const rect = this.container.getBoundingClientRect();
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(35, rect.width / rect.height, 0.1, 100);
        this.camera.position.set(0, 0.04, 8.35);
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: true
        });
        this.renderer.setSize(rect.width, rect.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.1;
        this.camera.lookAt(0, 0.04, 0);

        window.addEventListener("resize", () => this.onResize());
        window.addEventListener("pointermove", (event) => this.onPointerMove(event), { passive: true });
    }

    onResize() {
        const rect = this.container.getBoundingClientRect();
        this.camera.aspect = rect.width / rect.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(rect.width, rect.height);
    }

    onPointerMove(event) {
        const rect = this.container.getBoundingClientRect();
        const localX = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1.2, 1.2);
        const localY = clamp(-(((event.clientY - rect.top) / rect.height) * 2 - 1), -1.2, 1.2);
        const winX = clamp((event.clientX / window.innerWidth) * 2 - 1, -1, 1);
        const winY = clamp(-((event.clientY / window.innerHeight) * 2 - 1), -1, 1);
        this.pointerTarget.x = clamp(localX * 0.52 + winX * 0.1, -0.72, 0.72);
        this.pointerTarget.y = clamp(localY * 0.42 + winY * 0.08, -0.55, 0.55);
    }

    createRobot() {
        this.robotRig = new THREE.Group();
        this.robotGroup = new THREE.Group();
        this.headGroup = new THREE.Group();
        this.robotGroup.add(this.headGroup);
        this.robotRig.add(this.robotGroup);
        this.scene.add(this.robotRig);

        this.materials = {
            shell: new THREE.MeshPhysicalMaterial({
                color: 0x101116,
                metalness: 0.72,
                roughness: 0.14,
                clearcoat: 1,
                clearcoatRoughness: 0.04,
                emissive: 0x050608,
                emissiveIntensity: 0.24,
                reflectivity: 0.9
            }),
            glass: new THREE.MeshPhysicalMaterial({
                color: 0x0a0c16,
                metalness: 0.05,
                roughness: 0.02,
                clearcoat: 1,
                clearcoatRoughness: 0.01,
                transparent: true,
                opacity: 0.16,
                emissive: 0x141824,
                emissiveIntensity: 0.12,
                reflectivity: 1
            }),
            screen: new THREE.MeshStandardMaterial({
                color: 0x080913,
                metalness: 0.15,
                roughness: 0.12,
                emissive: 0x141827,
                emissiveIntensity: 0.48
            }),
            accent: new THREE.MeshStandardMaterial({
                color: 0xffffff,
                emissive: 0xffffff,
                emissiveIntensity: 2.2,
                metalness: 0.05,
                roughness: 0.05
            }),
            eyeHighlight: new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.95
            }),
            dark: new THREE.MeshStandardMaterial({
                color: 0x050505,
                metalness: 0.35,
                roughness: 0.28,
                emissive: 0x020202,
                emissiveIntensity: 0.08
            }),
            glow: new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.1,
                side: THREE.BackSide
            }),
            mouth: new THREE.MeshStandardMaterial({
                color: 0xffffff,
                emissive: 0xffffff,
                emissiveIntensity: 3.4,
                metalness: 0.02,
                roughness: 0.06
            }),
            cheek: new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0
            })
        };

        this.colorTargets = {
            accent: new THREE.Color(0xffffff),
            glow: new THREE.Color(0xc7c7c7),
            mouth: new THREE.Color(0xffffff)
        };

        this.headAura = new THREE.Mesh(new THREE.SphereGeometry(1.34, 48, 48), this.materials.glow.clone());
        this.headAura.scale.set(1.22, 1.3, 1.06);
        this.headAura.position.set(0, 0.04, -0.02);
        this.robotGroup.add(this.headAura);

        const headFrame = new THREE.Mesh(new THREE.SphereGeometry(1.14, 56, 56), this.materials.dark);
        headFrame.scale.set(1.06, 1.12, 1.02);
        headFrame.position.set(0, 0.02, -0.08);
        const headShell = new THREE.Mesh(new THREE.SphereGeometry(1.03, 56, 56), this.materials.shell);
        headShell.scale.set(1.02, 1.06, 1);
        const visorFrame = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.045, 20, 100), this.materials.accent);
        visorFrame.scale.set(1.05, 0.75, 1);
        visorFrame.position.set(0, 0.06, 0.72);
        const visorGlass = new THREE.Mesh(new THREE.SphereGeometry(0.82, 56, 56), this.materials.glass);
        visorGlass.scale.set(1.06, 0.92, 0.52);
        visorGlass.position.set(0, 0.04, 0.48);
        const screen = new THREE.Mesh(new THREE.SphereGeometry(0.74, 48, 48), this.materials.screen);
        screen.scale.set(1.04, 0.82, 0.38);
        screen.position.set(0, 0.04, 0.38);
        this.headGroup.add(headFrame, headShell, visorFrame, visorGlass, screen);

        this.headGroup.add(
            this.flatSphere(0.22, -0.98, 0.02, -0.02, 0.56, 0.86, 0.48, this.materials.shell),
            this.flatSphere(0.22, 0.98, 0.02, -0.02, 0.56, 0.86, 0.48, this.materials.shell)
        );

        const antennaStemMaterial = new THREE.MeshStandardMaterial({
            color: 0xbfc3cf,
            emissive: 0x666a74,
            emissiveIntensity: 0.42,
            metalness: 0.45,
            roughness: 0.16
        });
        this.antennaBase = new THREE.Mesh(new THREE.SphereGeometry(0.055, 20, 20), this.materials.dark);
        this.antennaBase.position.set(0, 0.88, 0.14);
        this.antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.032, 0.26, 18), antennaStemMaterial);
        this.antenna.position.set(0, 1.07, 0.3);
        this.antenna.rotation.x = 0.5;
        this.antennaBall = new THREE.Mesh(new THREE.SphereGeometry(0.12, 24, 24), this.materials.accent);
        this.antennaBall.position.set(0, 1.31, 0.47);
        this.headGroup.add(this.antennaBase, this.antenna, this.antennaBall);

        const leftEye = this.createEye(-0.32);
        const rightEye = this.createEye(0.32);
        this.leftEyeGroup = leftEye.group;
        this.rightEyeGroup = rightEye.group;
        this.leftPupil = leftEye.pupil;
        this.rightPupil = rightEye.pupil;
        this.leftHighlight = leftEye.highlight;
        this.rightHighlight = rightEye.highlight;
        this.headGroup.add(leftEye.group, rightEye.group);

        this.leftCheek = this.flatSphere(0.08, -0.5, -0.1, 0.9, 1.8, 0.6, 0.42, this.materials.cheek.clone());
        this.rightCheek = this.flatSphere(0.08, 0.5, -0.1, 0.9, 1.8, 0.6, 0.42, this.materials.cheek.clone());
        this.headGroup.add(this.leftCheek, this.rightCheek);

        this.mouth = new THREE.Mesh(this.mouthGeometry([0.03, -0.01, -0.03, -0.01, 0.03]), this.materials.mouth);
        this.mouth.position.set(0, -0.28, 1.08);
        this.headGroup.add(this.mouth);

        this.faceScale = 1.32;
        this.headGroup.scale.setScalar(this.faceScale);
        this.headGroup.position.set(0, 0.12, 0.08);
        this.headBaseX = this.headGroup.position.x;
        this.headBaseY = this.headGroup.position.y;
        this.robotGroup.position.set(0, -0.02, 0);
        this.robotRig.position.set(0, 0.04, 0);
    }

    flatSphere(radius, x, y, z, sx, sy, sz, material) {
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32), material);
        mesh.position.set(x, y, z);
        mesh.scale.set(sx, sy, sz);
        return mesh;
    }

    createEye(x) {
        const group = new THREE.Group();
        group.position.set(x, 0.12, 0.96);

        const socketMaterial = this.materials.screen.clone();
        socketMaterial.color = new THREE.Color(0x1e2027);
        socketMaterial.emissive = new THREE.Color(0x0b0d12);
        socketMaterial.emissiveIntensity = 0.24;
        const socket = this.flatSphere(0.19, 0, 0, 0.02, 1.08, 1, 0.42, socketMaterial);

        const pupilMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x020202,
            metalness: 0.08,
            roughness: 0.03,
            clearcoat: 1,
            clearcoatRoughness: 0.02,
            reflectivity: 0.9
        });
        const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.1, 32, 32), pupilMaterial);
        pupil.position.z = 0.105;
        pupil.scale.set(1.04, 1, 0.7);

        const highlight = new THREE.Mesh(
            new THREE.SphereGeometry(0.034, 16, 16),
            this.materials.eyeHighlight
        );
        highlight.position.set(0.045, 0.05, 0.14);
        highlight.scale.set(1.12, 0.78, 0.42);

        const highlight2 = new THREE.Mesh(
            new THREE.SphereGeometry(0.014, 12, 12),
            this.materials.eyeHighlight
        );
        highlight2.position.set(-0.022, -0.022, 0.118);
        highlight2.scale.set(1, 0.76, 0.48);

        group.add(socket, pupil, highlight, highlight2);
        return { group, pupil, highlight };
    }

    mouthGeometry(profile) {
        const xs = [-0.34, -0.17, 0, 0.17, 0.34];
        const points = xs.map((x, i) => new THREE.Vector3(x, profile[i], 0));
        return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 40, 0.026, 14, false);
    }

    setupLighting() {
        // Ambient hemisphere light
        this.scene.add(new THREE.HemisphereLight(0xffffff, 0x080810, 0.9));

        // Key light - main illumination
        const key = new THREE.DirectionalLight(0xffffff, 1.4);
        key.position.set(2.2, 3.5, 5);

        // Fill light - softer, from the left
        const fill = new THREE.PointLight(0xe8e8f0, 1.3, 14, 1.8);
        fill.position.set(-3.2, 2, 3.5);

        // Rim light - creates edge definition
        const rim = new THREE.PointLight(0xc0c0d0, 0.9, 12, 2);
        rim.position.set(3, -0.5, -3);

        // Eye light - subtle front fill for eyes
        const eyeLight = new THREE.PointLight(0xffffff, 0.5, 6, 2);
        eyeLight.position.set(0, 0.5, 4);

        // Bottom accent light
        const bottomLight = new THREE.PointLight(0x606080, 0.4, 8, 2);
        bottomLight.position.set(0, -2.5, 2);

        this.scene.add(key, fill, rim, eyeLight, bottomLight);
    }

    setupForm() {
        this.fields.forEach(({ field, input }, fieldName) => {
            input.addEventListener("focus", () => {
                this.activeField = fieldName;
                this.focusTarget = this.fieldTarget(input);
                this.setMood("listening");
                this.setStatus(`Scanning ${FIELD_LABELS[fieldName]}`, "active");
                this.speak(this.focusSpeech(fieldName));
                this.pulseAntenna(1);
            });

            input.addEventListener("blur", () => this.onBlur(fieldName, field, input));
            input.addEventListener("input", () => this.onInput(fieldName, field, input));
        });

        this.form.addEventListener("submit", (event) => {
            event.preventDefault();
            this.onSubmit();
        });
    }

    fieldTarget(input) {
        const rect = input.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        return {
            x: clamp((cx / window.innerWidth) * 2 - 1, -0.55, 0.55),
            y: clamp(-((cy / window.innerHeight) * 2 - 1), -0.42, 0.42)
        };
    }

    focusSpeech(fieldName) {
        switch (fieldName) {
            case "name": return "Identity scan ready. Tell me what I should call you.";
            case "email": return "Reply route detected. I am looking for a valid inbox.";
            case "subject":
                return this.analysis.intent !== "General"
                    ? `Mission header requested. I am already reading a ${this.analysis.intent.toLowerCase()} signal.`
                    : "Mission header requested. A sharp subject helps classify intent.";
            case "message":
                return this.analysis.wordCount ? this.analysis.coachLine : "Full brief channel open. Goal, context, and next step are all useful.";
            default: return "I am listening.";
        }
    }

    onInput(fieldName, field, input) {
        this.formData[fieldName] = input.value;
        this.markField(fieldName, field, input, false);
        const analysis = this.syncAnalysis();
        this.focusTarget = this.activeField ? this.fieldTarget(this.fields.get(this.activeField).input) : this.focusTarget;
        this.pulseAntenna(0.4);

        if (analysis.urgency === "High") {
            this.setMood("alert");
            this.setStatus(analysis.statusLine, this.statusTone(analysis));
        } else if (analysis.readiness >= 80) {
            this.setMood("excited");
            this.setStatus(analysis.statusLine, this.statusTone(analysis));
        } else if (fieldName === "message" && this.formData.message.trim()) {
            this.setMood("thinking");
            this.setStatus(analysis.statusLine, this.statusTone(analysis));
        } else {
            this.setMood("listening");
            this.setStatus(`Reading ${FIELD_LABELS[fieldName]}`, "active");
        }

        this.milestoneSpeech(fieldName, analysis);
    }

    onBlur(fieldName, field, input) {
        const value = input.value.trim();
        const valid = this.markField(fieldName, field, input, true);
        const analysis = this.syncAnalysis();
        this.activeField = "";

        if (!value) {
            field.classList.remove("valid", "invalid");
            this.setMood(analysis.allValid ? "happy" : "listening");
            this.setStatus("Waiting for more input", "active");
            return;
        }

        if (valid) {
            this.setMood(analysis.readiness >= 80 ? "excited" : "happy");
            this.setStatus(`${FIELD_LABELS[fieldName]} looks good`, "success");
            if (fieldName === "name" && analysis.firstName && !this.milestones.named) {
                this.milestones.named = true;
                this.speak(`Nice to meet you, ${analysis.firstName}.`);
                return;
            }
            this.speak(this.validSpeech(fieldName, analysis));
            return;
        }

        this.setMood("alert");
        this.setStatus(this.validationMessage(fieldName, value), "error");
        this.speak(this.validationMessage(fieldName, value));
        this.shake();
    }

    markField(fieldName, field, input, committed) {
        const value = input.value.trim();
        const assessment = this.fieldAssessment(fieldName, value);
        field.classList.toggle("valid", Boolean(value) && assessment.valid);
        field.classList.toggle("invalid", committed && !assessment.valid);
        input.setAttribute("aria-invalid", String(committed && !assessment.valid));
        input.setCustomValidity(assessment.valid || !committed ? "" : assessment.message);
        return assessment.valid;
    }

    validateField(inputLike, fieldName) {
        return this.fieldAssessment(fieldName, inputLike.value).valid;
    }

    fieldAssessment(fieldName, value) {
        return assessContactField(fieldName, value);
    }

    detectIntent(corpus, message) {
        let intent = "General";
        let best = 0;
        INTENT_PATTERNS.forEach(([label, words]) => {
            const score = words.reduce((total, word) => total + (corpus.includes(word) ? 1 : 0), 0);
            if (score > best) {
                best = score;
                intent = label;
            }
        });
        if (intent === "General" && message.includes("?")) return "Question";
        return intent;
    }

    detectUrgency(corpus) {
        if (HIGH_URGENCY_PATTERN.test(corpus)) return "High";
        if (MEDIUM_URGENCY_PATTERN.test(corpus)) return "Medium";
        return "Low";
    }

    briefDetail(wordCount) {
        if (wordCount >= 32) return "detailed";
        if (wordCount >= 16) return "clear";
        if (wordCount > 0) return "forming";
        return "empty";
    }

    missingSignals({ intent, wordCount, hasTimeline, hasBudget, hasLink, hasCTA, hasDeliverable, hasQuestion }) {
        if (!wordCount) return [];

        const missing = [];
        if (wordCount < 7) missing.push("goal");
        if (intent === "General" && wordCount >= 7) missing.push("clear intent");
        if (TIMELINE_INTENTS.has(intent) && !hasTimeline && wordCount >= 8) missing.push("timeline");
        if (CTA_INTENTS.has(intent) && !hasCTA && wordCount >= 10) missing.push("next step");
        if (DELIVERABLE_INTENTS.has(intent) && !hasDeliverable && wordCount >= 10) {
            missing.push(intent === "Bug report" ? "reproduction detail" : "deliverable");
        }
        if (REFERENCE_INTENTS.has(intent) && !hasLink && wordCount >= 12) {
            missing.push(intent === "Bug report" ? "reference" : "example link");
        }
        if ((intent === "Project request" || intent === "Speaking") && !hasBudget && wordCount >= 14) {
            missing.push("budget");
        }
        if (intent === "Question" && !hasQuestion && wordCount >= 10) {
            missing.push("direct question");
        }
        return [...new Set(missing)];
    }

    statusLine(analysis) {
        if (!analysis.wordCount) return "Awaiting input";
        if (analysis.qualityIssues.length) return analysis.qualityIssues[0].message;
        if (analysis.urgency === "High") return "Urgent signal detected";
        if (analysis.actionable) return "Brief reads actionable";
        if (analysis.missingSignals.length) return `Need ${readableList(analysis.missingSignals)}`;
        if (analysis.intent !== "General") return `${analysis.intent} signal looks clear`;
        if (analysis.detail === "forming") return "Signal still forming";
        return "Analyzing message clarity";
    }

    coachLine(analysis) {
        if (!analysis.wordCount) {
            return "Full brief channel open. Goal, context, and next step are all useful.";
        }

        if (analysis.qualityIssues.length) {
            const primary = analysis.qualityIssues[0];
            if (primary.field === "name") {
                return "Use your real name so the message feels trustworthy and reply-ready.";
            }
            if (primary.field === "subject") {
                return "Replace the subject with the real topic so I can classify the request immediately.";
            }
            if (primary.field === "message") {
                return "This reads like filler or test text. Tell me what you need, why you are reaching out, and what response would help.";
            }
        }

        if (analysis.intent === "Project request") {
            if (analysis.missingSignals.includes("deliverable") && analysis.missingSignals.includes("timeline")) {
                return "I read this as a project request. Name the deliverable and timing so it feels ready to act on.";
            }
            if (analysis.missingSignals.includes("deliverable")) {
                return "This sounds like a project request. A specific deliverable would make the ask concrete.";
            }
            if (analysis.missingSignals.includes("timeline")) {
                return "The ask is clear. Add timing so I can judge urgency and planning.";
            }
            if (analysis.missingSignals.includes("next step")) {
                return "The brief is strong. Add the preferred next step so the conversation can move immediately.";
            }
            return "This already reads like a solid project brief.";
        }

        if (analysis.intent === "Collaboration") {
            if (analysis.missingSignals.includes("next step")) {
                return "This has collaboration energy. Suggest a call, reply window, or next move so the momentum is obvious.";
            }
            return analysis.missingSignals.includes("timeline")
                ? "I can see the collaboration angle. A timeline would make the proposal easier to answer."
                : "This feels like a real collaboration note, not just an introduction.";
        }

        if (analysis.intent === "Bug report") {
            if (analysis.missingSignals.includes("reproduction detail")) {
                return "I understand the issue theme. Add what broke and how to reproduce it so the signal becomes actionable.";
            }
            return analysis.missingSignals.includes("reference")
                ? "This bug report is close. A link, screenshot, or reproduction reference would make triage faster."
                : "This bug report is clear and easy to route.";
        }

        if (analysis.intent === "Question") {
            return analysis.missingSignals.includes("direct question")
                ? "I can tell you are asking something. Make the actual question explicit so the reply can be precise."
                : "The question is clear. A reply can be direct.";
        }

        if (analysis.missingSignals.length) {
            return `I understand the direction. Add ${readableList(analysis.missingSignals)} and it will sound much more actionable.`;
        }

        if (analysis.actionable) {
            return "This message is strong. I can see the intent, the context, and the next move.";
        }

        return analysis.detail === "forming"
            ? "I can see the direction. Add the goal and what you want to happen next."
            : "The signal is readable. One more layer of specificity would sharpen it.";
    }

    statusTone(analysis) {
        if (analysis.urgency === "High") return "alert";
        if (analysis.actionable || analysis.readiness >= 80) return "success";
        return "active";
    }

    analyze() {
        this.fields.forEach(({ input }, key) => {
            this.formData[key] = input.value;
        });

        const name = this.formData.name.trim();
        const email = this.formData.email.trim();
        const subject = this.formData.subject.trim();
        const message = this.formData.message.trim();
        const corpus = `${subject} ${message}`.toLowerCase();
        const wordCount = countWords(message);
        const fieldAssessments = {
            name: this.fieldAssessment("name", name),
            email: this.fieldAssessment("email", email),
            subject: this.fieldAssessment("subject", subject),
            message: this.fieldAssessment("message", message)
        };
        const validMap = {
            name: fieldAssessments.name.valid,
            email: fieldAssessments.email.valid,
            subject: fieldAssessments.subject.valid,
            message: fieldAssessments.message.valid
        };
        const qualityIssues = Object.entries(fieldAssessments)
            .filter(([fieldName, assessment]) => fieldName !== "email" && !assessment.valid && this.formData[fieldName].trim())
            .map(([fieldName, assessment]) => ({ field: fieldName, message: assessment.message }));

        const intent = this.detectIntent(corpus, message);
        const urgency = this.detectUrgency(corpus);
        const hasTimeline = TIMELINE_PATTERN.test(corpus);
        const hasBudget = BUDGET_PATTERN.test(corpus);
        const hasLink = LINK_PATTERN.test(message);
        const hasQuestion = message.includes("?");
        const hasCTA = CTA_PATTERN.test(corpus);
        const hasDeliverable = DELIVERABLE_PATTERN.test(corpus);
        const detail = this.briefDetail(wordCount);
        const missingSignals = this.missingSignals({
            intent,
            wordCount,
            hasTimeline,
            hasBudget,
            hasLink,
            hasCTA,
            hasDeliverable,
            hasQuestion
        });

        let emailDomain = "";
        let emailType = "";
        if (validMap.email) {
            emailDomain = email.split("@")[1].toLowerCase();
            emailType = PERSONAL_EMAIL_DOMAINS.has(emailDomain) ? "Personal" : "Work";
        }

        let readiness = 0;
        if (validMap.name) readiness += 18;
        if (validMap.email) readiness += 22;
        if (validMap.subject) readiness += 16;
        if (validMap.message) readiness += 16;
        if (wordCount >= 16) readiness += 10;
        if (wordCount >= 32) readiness += 6;
        if (intent !== "General") readiness += 6;
        if (hasTimeline) readiness += 3;
        if (hasQuestion) readiness += 2;
        if (hasCTA) readiness += 3;
        if (hasDeliverable) readiness += 3;
        if (hasBudget) readiness += 1;
        if (hasLink) readiness += 2;
        readiness -= Math.min(missingSignals.length * 3, 12);
        readiness -= Math.min(qualityIssues.length * 10, 26);
        readiness = clamp(readiness, 0, 100);
        const nameTag = firstName(name);
        const actionable = qualityIssues.length === 0 && missingSignals.length === 0 && wordCount >= 14 && intent !== "General";
        const analysis = {
            intent,
            urgency,
            readiness,
            validMap,
            allValid: Object.values(validMap).every(Boolean),
            firstName: nameTag,
            emailDomain,
            emailType,
            wordCount,
            hasLink,
            hasTimeline,
            hasBudget,
            hasQuestion,
            hasCTA,
            hasDeliverable,
            detail,
            missingSignals,
            qualityIssues,
            actionable
        };

        analysis.statusLine = this.statusLine(analysis);
        analysis.coachLine = this.coachLine(analysis);
        analysis.coachSignature = `${analysis.intent}|${analysis.detail}|${analysis.urgency}|${analysis.missingSignals.join(",")}`;
        return analysis;
    }

    syncAnalysis() {
        this.analysis = this.analyze();
        this.counter.textContent = `${this.formData.message.length} / 500`;
        return this.analysis;
    }

    milestoneSpeech(fieldName, analysis) {
        if (analysis.validMap.email && !this.milestones.emailValidated) {
            this.milestones.emailValidated = true;
            this.speak(analysis.emailType === "Work" ? `Work inbox format detected through ${analysis.emailDomain}.` : `Reply route format detected through ${analysis.emailDomain}.`);
        }
        if (analysis.intent !== "General" && analysis.intent !== this.milestones.intent) {
            this.milestones.intent = analysis.intent;
            this.speak(`${analysis.intent} intent recognized.`);
        }
        if (analysis.hasLink && !this.milestones.linkSeen) {
            this.milestones.linkSeen = true;
            this.speak("Reference link detected. Good context.");
        }
        if (analysis.urgency === "High" && this.milestones.urgency !== "High") {
            this.milestones.urgency = "High";
            this.speak("Urgent tone detected. The robot is flagging this as time-sensitive.");
        }
        if (fieldName === "message" && analysis.detail !== this.milestones.detail) {
            this.milestones.detail = analysis.detail;
            if (analysis.detail === "forming") this.speak("Signal forming. I can see the direction now.");
            if (analysis.detail === "clear") this.speak("This brief is getting clearer.");
            if (analysis.detail === "detailed") this.speak("Strong detail density detected.");
        }
        if (fieldName === "message" && analysis.wordCount >= 8 && analysis.coachSignature !== this.milestones.coachSignature) {
            this.milestones.coachSignature = analysis.coachSignature;
            this.speak(analysis.coachLine);
        }
        if (analysis.readiness >= 80 && !this.milestones.ready) {
            this.milestones.ready = true;
            this.speak("This message is clear, grounded, and ready.");
        }
    }

    validSpeech(fieldName, analysis) {
        switch (fieldName) {
            case "name": return analysis.firstName ? `Identity locked: ${analysis.firstName}.` : "Identity looks good.";
            case "email": return analysis.emailDomain ? `Reply route format looks clean via ${analysis.emailDomain}.` : "Reply route format looks valid.";
            case "subject": return analysis.intent !== "General" ? `${analysis.intent} signal captured from the subject line.` : "Subject looks focused.";
            case "message": return analysis.actionable ? "Message quality is strong. This feels ready." : analysis.coachLine;
            default: return "Field verified.";
        }
    }

    validationMessage(fieldName, value) {
        return this.fieldAssessment(fieldName, value).message;
    }

    emailVerificationFeedback(result) {
        switch (result.reason) {
            case "googlemail":
                return {
                    status: "Googlemail aliases are blocked",
                    speech: "I cannot accept googlemail aliases here. Use the primary inbox you actually monitor.",
                    toast: "Use a primary inbox instead of @googlemail.com.",
                    tone: "error"
                };
            case "gmail_plus":
                return {
                    status: "Alias-style Gmail detected",
                    speech: "Plus-address Gmail aliases are blocked for this verification pass. Use the base inbox instead.",
                    toast: "Use your base Gmail address without a plus alias.",
                    tone: "error"
                };
            case "provider":
                return {
                    status: "Disposable inbox rejected",
                    speech: "This reply route looks disposable. Use a long-term inbox so the message can be trusted and answered.",
                    toast: "Disposable inbox detected. Please use a real reply address.",
                    tone: "error"
                };
            case "model":
                return {
                    status: "Suspicious Gmail pattern detected",
                    speech: "This Gmail pattern looks high-risk for disposable use. Please use a normal long-term inbox instead.",
                    toast: "This Gmail address looks disposable or alias-based.",
                    tone: "error"
                };
            default:
                return {
                    status: "Inbox verification unavailable",
                    speech: "I could not verify this reply route safely right now, so I am not sending the message yet.",
                    toast: "Email verification is temporarily unavailable. Please try again shortly.",
                    tone: "error"
                };
        }
    }

    submissionErrorFeedback(error) {
        if (window.location.origin !== CONTACT_ALLOWED_ORIGIN) {
            return {
                status: "Send pipeline is production-only",
                speech: "The updated contact endpoint only accepts requests from the live site right now. Open this form on surya.is-a.dev to send a real message.",
                toast: "Live sending is currently restricted to surya.is-a.dev."
            };
        }

        if (error?.status === 429) {
            const retryAfter = error.payload?.retryAfter;
            const minutes = retryAfter ? Math.max(1, Math.ceil(retryAfter / 60)) : 10;
            return {
                status: "Rate limit reached",
                speech: `The contact channel is rate limited right now. Please wait about ${minutes} minute${minutes === 1 ? "" : "s"} before sending again.`,
                toast: error.payload?.message || `Too many messages sent. Try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`
            };
        }

        if (error?.status === 409) {
            return {
                status: "Duplicate message blocked",
                speech: "This looks identical to a message that was sent recently. Wait a few minutes or revise it before trying again.",
                toast: error.payload?.message || "Duplicate submission detected. Please wait a few minutes before sending again."
            };
        }

        if (error?.status === 400) {
            if (Array.isArray(error.payload?.fields) && error.payload.fields.length) {
                return {
                    status: "Required fields missing",
                    speech: `The server still needs ${readableList(error.payload.fields)} before it can accept the message.`,
                    toast: `Missing fields: ${error.payload.fields.join(", ")}`
                };
            }
            return {
                status: "Server rejected the payload",
                speech: error.payload?.error || "The server rejected one of the form fields. Please review the message and try again.",
                toast: error.payload?.message || error.payload?.error || "Server validation failed. Please review your input."
            };
        }

        if (error?.status === 403) {
            return {
                status: "Origin not accepted",
                speech: "This origin is not allowed by the contact API. The endpoint is currently locked to the production domain.",
                toast: "This origin is not allowed by the contact API."
            };
        }

        if (error?.status === 502) {
            return {
                status: "Delivery relay failed",
                speech: "The form was accepted, but the Telegram delivery relay failed. Please try again in a moment.",
                toast: error?.payload?.error || "Delivery relay failed. Please try again."
            };
        }

        return {
            status: "Message delivery failed",
            speech: error?.payload?.error || error?.message || "I verified the brief, but the delivery channel failed. Please try again in a moment.",
            toast: error?.payload?.message || error?.payload?.error || error?.message || "Message delivery failed. Please try again."
        };
    }

    speak(text, duration = 3200) {
        const now = performance.now();
        if (!text) return;
        if (text === this.lastSpeechText && now - this.lastSpeechAt < 1200) return;
        this.lastSpeechText = text;
        this.lastSpeechAt = now;
        this.speech.textContent = text;
        this.speech.classList.add("visible");
        clearTimeout(this.speechTimer);
        this.speechTimer = setTimeout(() => this.speech.classList.remove("visible"), duration);
    }

    setStatus(text, tone = "active") {
        this.statusEl.textContent = text;
        this.statusEl.dataset.tone = tone;
    }

    setMood(mood) {
        if (this.mood === mood) return;
        this.mood = mood;

        const profiles = {
            idle: [0.03, -0.01, -0.03, -0.01, 0.03],
            listening: [0.02, -0.03, -0.06, -0.03, 0.02],
            thinking: [0.02, -0.005, -0.015, -0.005, 0.02],
            happy: [0.12, 0.03, -0.12, 0.03, 0.12],
            alert: [-0.06, 0.03, 0.08, 0.03, -0.06],
            excited: [0.16, -0.01, -0.18, -0.01, 0.16]
        };
        const palette = {
            idle: [0xffffff, 0xa8a8a8, 0xffffff],
            listening: [0xffffff, 0xbcbcbc, 0xffffff],
            thinking: [0xe3e3e3, 0x8f8f8f, 0xeaeaea],
            happy: [0xffffff, 0xd0d0d0, 0xffffff],
            alert: [0xd6d6d6, 0x888888, 0xdcdcdc],
            excited: [0xffffff, 0xffffff, 0xffffff]
        }[mood] || [0xffffff, 0xa8a8a8, 0xffffff];

        if (this.mouth) {
            this.mouth.geometry.dispose();
            this.mouth.geometry = this.mouthGeometry(profiles[mood] || profiles.idle);
        }
        this.cheekTarget = mood === "excited" ? 0.34 : mood === "happy" ? 0.2 : mood === "alert" ? 0.08 : 0;
        this.colorTargets.accent.setHex(palette[0]);
        this.colorTargets.glow.setHex(palette[1]);
        this.colorTargets.mouth.setHex(palette[2]);
    }

    pulseAntenna(amount = 1) {
        this.antennaPulse = clamp(this.antennaPulse + amount, 0, 2.2);
    }

    shake() {
        this.shakeStrength = 1;
    }

    celebrate() {
        this.celebration = 1.4;
    }

    async onSubmit() {
        let valid = true;
        const issues = [];
        this.fields.forEach(({ field, input }, fieldName) => {
            const okay = this.markField(fieldName, field, input, true);
            if (!okay || !input.value.trim()) {
                valid = false;
                issues.push(this.validationMessage(fieldName, input.value.trim()));
            }
        });

        const analysis = this.syncAnalysis();
        if (!valid) {
            this.setMood("alert");
            this.setStatus("The form still needs attention", "error");
            this.speak(issues[0] || "The form needs another pass.");
            this.shake();
            this.toast(issues[0] || "Please correct the highlighted fields before sending.");
            return;
        }

        this.button.classList.add("loading");
        this.setMood("thinking");
        this.setStatus("Verifying reply route", "active");
        this.speak(analysis.firstName ? `${analysis.firstName}, I am verifying the reply route before I send anything.` : "I am verifying the reply route before I send anything.");

        if (window.location.origin !== CONTACT_ALLOWED_ORIGIN) {
            const feedback = this.submissionErrorFeedback({ status: 403 });
            this.button.classList.remove("loading");
            this.setMood("alert");
            this.setStatus(feedback.status, "error");
            this.speak(feedback.speech, 4600);
            this.toast(feedback.toast);
            this.shake();
            return;
        }

        const emailCheck = await verifyEmailDisposable(this.formData.email);
        if (emailCheck.disposable) {
            const { field } = this.fields.get("email");
            const feedback = this.emailVerificationFeedback(emailCheck);
            field.classList.remove("valid");
            field.classList.add("invalid");
            this.button.classList.remove("loading");
            this.setMood("alert");
            this.setStatus(feedback.status, feedback.tone);
            this.speak(feedback.speech, 4200);
            this.toast(feedback.toast);
            this.shake();
            return;
        }

        this.setStatus("Transmitting message", "active");
        this.speak(analysis.firstName ? `Reply route verified for ${analysis.firstName}. Transmitting your message now.` : "Reply route verified. Transmitting your message now.");

        try {
            const response = await submitContactSignal({
                name: this.formData.name.trim(),
                email: this.formData.email.trim(),
                subject: this.formData.subject.trim(),
                message: this.formData.message.trim(),
                website: this.honeypot ? this.honeypot.value.trim() : ""
            });

            this.button.classList.remove("loading");
            this.button.classList.add("success");
            this.button.querySelector(".btn-text").textContent = "Sent";
            this.setMood("excited");
            this.setStatus(response.ref ? `Delivered | REF ${response.ref}` : "Message delivered successfully", "success");
            this.speak(response.ref
                ? `${response.message || "Your message has been sent."} Reference ${response.ref}.`
                : response.message || (analysis.intent !== "General" ? `${analysis.intent} message delivered. Nice work.` : "Message delivered. Nice work."));
            this.celebrate();
            this.confetti();
            this.toast(response.ref ? `${response.message || "Your message has been sent."} Ref: ${response.ref}` : response.message || `Signal captured with ${analysis.readiness}% readiness.`);
        } catch (error) {
            const feedback = this.submissionErrorFeedback(error);
            this.button.classList.remove("loading");
            this.setMood("alert");
            this.setStatus(feedback.status, "error");
            this.speak(feedback.speech, 4600);
            this.toast(feedback.toast);
            this.shake();
            return;
        }

        setTimeout(() => {
            this.form.reset();
            this.counter.textContent = "0 / 500";
            this.fields.forEach(({ field }) => field.classList.remove("valid", "invalid"));
            this.formData = { name: "", email: "", subject: "", message: "" };
            if (this.honeypot) this.honeypot.value = "";
            this.milestones = this.defaultMilestones();
            this.button.classList.remove("success");
            this.button.querySelector(".btn-text").textContent = "Send Message";
            this.setMood("listening");
            this.setStatus("Waiting for a new signal", "active");
            this.syncAnalysis();
        }, 4200);
    }

    toast(message) {
        const toast = document.getElementById("toast");
        toast.textContent = message;
        toast.classList.add("visible");
        clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => toast.classList.remove("visible"), 3200);
    }

    confetti() {
        const container = document.getElementById("confetti");
        const surfaces = [
            {
                background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(206,206,206,0.78))",
                shadow: "0 0 14px rgba(255,255,255,0.18)"
            },
            {
                background: "linear-gradient(180deg, rgba(235,235,235,0.94), rgba(138,138,138,0.74))",
                shadow: "0 0 12px rgba(255,255,255,0.1)"
            },
            {
                background: "linear-gradient(180deg, rgba(38,38,38,0.98), rgba(120,120,120,0.7))",
                border: "1px solid rgba(255,255,255,0.14)",
                shadow: "0 0 10px rgba(255,255,255,0.08)"
            }
        ];

        for (let i = 0; i < 44; i += 1) {
            const piece = document.createElement("div");
            const surface = surfaces[Math.floor(Math.random() * surfaces.length)];
            const ribbon = Math.random() < 0.34;
            const width = ribbon ? 4 + Math.random() * 3 : 6 + Math.random() * 8;
            const height = ribbon ? 18 + Math.random() * 24 : width * (0.62 + Math.random() * 0.24);
            const startRotate = (Math.random() - 0.5) * 70;
            const endRotate = startRotate + (Math.random() - 0.5) * 880;
            const driftX = (Math.random() - 0.5) * 380;

            piece.style.cssText = `position:absolute;width:${width}px;height:${height}px;background:${surface.background};left:${Math.random() * 100}%;top:-26px;opacity:0;border-radius:${ribbon ? "999px" : "2px"};box-shadow:${surface.shadow};border:${surface.border || "0"};transform:translate3d(0,0,0) rotate(${startRotate}deg);will-change:transform,opacity`;
            container.appendChild(piece);

            piece.animate([
                {
                    opacity: 0,
                    transform: `translate3d(0,-18px,0) rotate(${startRotate}deg) scale(0.88)`
                },
                {
                    opacity: 0.96,
                    offset: 0.15,
                    transform: `translate3d(${driftX * 0.22}px, ${window.innerHeight * 0.18}px, 0) rotate(${startRotate + (endRotate - startRotate) * 0.18}deg) scale(1)`
                },
                {
                    opacity: 0.82,
                    offset: 0.68,
                    transform: `translate3d(${driftX * 0.72}px, ${window.innerHeight * 0.7}px, 0) rotate(${startRotate + (endRotate - startRotate) * 0.72}deg) scale(0.98)`
                },
                {
                    opacity: 0,
                    transform: `translate3d(${driftX}px, ${window.innerHeight + 120}px, 0) rotate(${endRotate}deg) scale(0.92)`
                }
            ], {
                duration: 2400 + Math.random() * 1900,
                easing: "cubic-bezier(0.16, 1, 0.3, 1)",
                delay: Math.random() * 220
            }).onfinish = () => piece.remove();
        }
    }

    animate(ms) {
        requestAnimationFrame((next) => this.animate(next));
        const time = ms * 0.001;
        const dt = this.lastTime ? Math.min(0.05, time - this.lastTime) : 0.016;
        this.lastTime = time;

        this.focusStrength += ((this.activeField ? 1 : 0) - this.focusStrength) * 0.05;
        const focusMix = this.activeField ? 0.62 : 0.16;
        const targetX = clamp(this.pointerTarget.x * 0.54 + this.focusTarget.x * focusMix * this.focusStrength, -0.58, 0.58);
        const targetY = clamp(this.pointerTarget.y * 0.58 + this.focusTarget.y * focusMix * this.focusStrength, -0.48, 0.48);
        this.look.x += (targetX - this.look.x) * 0.065;
        this.look.y += (targetY - this.look.y) * 0.065;

        this.antennaPulse = Math.max(0, this.antennaPulse - dt * 1.6);
        this.shakeStrength = Math.max(0, this.shakeStrength - dt * 3.8);
        this.celebration = Math.max(0, this.celebration - dt * 0.65);

        if (time > this.nextBlinkAt && this.blinkPhase === 0) this.blinkPhase = 1;
        let blink = 1;
        if (this.blinkPhase > 0) {
            this.blinkPhase += dt * 9;
            blink = clamp(1 - Math.sin(Math.min(this.blinkPhase, Math.PI)) * 0.97, 0.03, 1);
            if (this.blinkPhase >= Math.PI) {
                this.blinkPhase = 0;
                this.nextBlinkAt = time + 2.2 + Math.random() * 3;
            }
        }

        const breathe = Math.sin(time * 1.2) * 0.008;
        const breatheScale = 1 + Math.sin(time * 1.2) * 0.006;
        const hover = Math.sin(time * 1.4) * 0.028 + Math.sin(time * 0.7) * 0.014 + breathe;
        const bounce = Math.sin((1.4 - this.celebration) * 10) * this.celebration * 0.08;
        const shake = this.shakeStrength > 0 ? Math.sin(time * 48) * this.shakeStrength * 0.1 : 0;

        this.robotGroup.rotation.y = 0;
        this.robotGroup.rotation.x = 0;
        this.robotGroup.rotation.z = 0;

        this.headGroup.position.x = this.headBaseX + this.look.x * 0.12;
        this.headGroup.position.y = this.headBaseY + hover + bounce + this.look.y * 0.045;
        this.headGroup.position.z = 0.08 + Math.abs(this.look.x) * 0.03;
        this.headGroup.rotation.y = this.look.x * 0.52;
        this.headGroup.rotation.x = -this.look.y * 0.35;
        this.headGroup.rotation.z = -this.look.x * 0.07 + shake * 0.18;
        this.headGroup.scale.setScalar(this.faceScale * breatheScale);

        const pupilX = clamp(this.look.x * 0.075, -0.055, 0.055);
        const pupilY = clamp(this.look.y * 0.075, -0.045, 0.045);
        this.leftPupil.position.x = pupilX;
        this.leftPupil.position.y = pupilY;
        this.rightPupil.position.x = pupilX;
        this.rightPupil.position.y = pupilY;

        this.leftEyeGroup.scale.y = blink;
        this.rightEyeGroup.scale.y = blink;

        const highlightPulse = 0.95 + Math.sin(time * 2.5) * 0.05;
        if (this.leftHighlight) {
            this.leftHighlight.scale.setScalar(highlightPulse);
            this.rightHighlight.scale.setScalar(highlightPulse);
        }

        if (this.leftCheek && this.rightCheek) {
            this.leftCheek.material.opacity += (this.cheekTarget - this.leftCheek.material.opacity) * 0.08;
            this.rightCheek.material.opacity += (this.cheekTarget - this.rightCheek.material.opacity) * 0.08;
        }

        const pulse = 0.92 + this.antennaPulse * 0.32 + Math.sin(time * 4.5) * 0.06;
        this.antennaBall.scale.setScalar(pulse);

        this.materials.accent.color.lerp(this.colorTargets.accent, 0.08);
        this.materials.accent.emissive.lerp(this.colorTargets.accent, 0.08);
        this.materials.mouth.color.lerp(this.colorTargets.mouth, 0.08);
        this.materials.mouth.emissive.lerp(this.colorTargets.mouth, 0.08);

        if (this.leftCheek && this.rightCheek) {
            this.leftCheek.material.color.lerp(this.colorTargets.accent, 0.08);
            this.rightCheek.material.color.lerp(this.colorTargets.accent, 0.08);
        }

        this.headAura.material.color.lerp(this.colorTargets.glow, 0.08);
        this.headAura.material.opacity = 0.12 + this.antennaPulse * 0.06 + Math.sin(time * 1.8) * 0.04;
        this.headAura.scale.setScalar(1.18 + Math.sin(time * 1.5) * 0.02);

        this.renderer.render(this.scene, this.camera);
    }

    getParticlePalette() {
        switch (this.mood) {
            case "alert": return { dot: "220, 220, 220", link: "150, 150, 150" };
            case "happy":
            case "excited": return { dot: "255, 255, 255", link: "190, 190, 190" };
            case "thinking": return { dot: "210, 210, 210", link: "135, 135, 135" };
            default: return { dot: "175, 175, 175", link: "95, 95, 95" };
        }
    }
}

class ParticleSystem {
    constructor(getPalette) {
        this.getPalette = getPalette;
        this.canvas = document.getElementById("particleCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.particles = [];
        this.mouse = { x: null, y: null };
        this.resize();
        this.init();
        window.addEventListener("resize", () => {
            this.resize();
            this.init();
        });
        window.addEventListener("pointermove", (event) => {
            this.mouse.x = event.clientX;
            this.mouse.y = event.clientY;
        }, { passive: true });
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    init() {
        this.particles = [];
        const count = Math.min(100, Math.floor((this.canvas.width * this.canvas.height) / 18000));
        for (let i = 0; i < count; i += 1) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.22,
                vy: (Math.random() - 0.5) * 0.22,
                size: Math.random() * 1.8 + 0.6,
                alpha: Math.random() * 0.4 + 0.08,
                depth: Math.random() * 0.8 + 0.2,
                twinkle: Math.random() * Math.PI * 2,
                twinkleSpeed: Math.random() * 1.4 + 0.4
            });
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const time = performance.now() * 0.001;
        const palette = this.getPalette();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles.forEach((p, i) => {
            if (this.mouse.x !== null && this.mouse.y !== null) {
                const dx = p.x - this.mouse.x;
                const dy = p.y - this.mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120 && dist > 0) {
                    const force = (120 - dist) / 120;
                    p.vx += (dx / dist) * force * 0.08 * p.depth;
                    p.vy += (dy / dist) * force * 0.08 * p.depth;
                }
            }

            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.992;
            p.vy *= 0.992;
            if (p.x < 0) p.x = this.canvas.width;
            if (p.x > this.canvas.width) p.x = 0;
            if (p.y < 0) p.y = this.canvas.height;
            if (p.y > this.canvas.height) p.y = 0;

            const twinkle = 0.45 + 0.55 * Math.sin(time * p.twinkleSpeed + p.twinkle);
            const alpha = p.alpha * twinkle;

            if (p.size > 1.5) {
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size * 2.8, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(${palette.dot}, ${alpha * 0.08})`;
                this.ctx.fill();
            }

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(${palette.dot}, ${alpha})`;
            this.ctx.fill();

            for (let j = i + 1; j < this.particles.length; j += 1) {
                const q = this.particles[j];
                const dx = p.x - q.x;
                const dy = p.y - q.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 90) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(p.x, p.y);
                    this.ctx.lineTo(q.x, q.y);
                    this.ctx.strokeStyle = `rgba(${palette.link}, ${(1 - dist / 90) * 0.12 * (0.6 + twinkle * 0.4)})`;
                    this.ctx.lineWidth = 0.7 * ((p.depth + q.depth) * 0.5);
                    this.ctx.stroke();
                }
            }
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const robot = new Robot3D(document.querySelector(".robot-container"));
    new ParticleSystem(() => robot.getParticlePalette());
});
