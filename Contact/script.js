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
const PLACEHOLDER_PATTERN = /\b(?:test(?:ing)?|dummy|sample|placeholder|lorem(?:\s+ipsum)?|foo|bar|baz|qux)\b/i;
const KEYBOARD_MASH_PATTERN = /\b(?:asdf(?:gh)?|qwer(?:ty)?|zxcv(?:bn)?|fdsa|poiuy|lkjhg|mnbvc|qazwsx|wsxedc|edcrfv|sdfgh|dfghj|abc123|12345|54321|sdfsdf|dfsdf)\b/i;
const TEST_MESSAGE_ONLY_PATTERN = /^\s*(?:hi[,.!\s]+)?(?:this\s+is\s+)?(?:just\s+)?(?:a\s+)?(?:test|testing|dummy|sample)(?:\s+message)?[.!?\s]*$/i;
const FAKE_NAME_PATTERN = /^(?:john\s+doe|jane\s+doe|jane\s+smith|john\s+smith|test\s+user|admin|administrator|anonymous|anon|unknown|noname|n\/a|na|null|undefined|user\s*\d*|name\s*\d*|first\s*(?:name)?\s*last\s*(?:name)?|fname\s*lname|example|guest)$/i;
const EMOJI_PATTERN = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{1F000}-\u{1F1FF}]/gu;
const EMOJI_SPAM_PATTERN = /(?:[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}]\s*){5,}/u;
const EXCESSIVE_PUNCT_PATTERN = /[!?.,]{4,}|[!?]{3,}/;
const LINK_ONLY_PATTERN = /^\s*(?:https?:\/\/|www\.)\S+\s*$/i;
const SUSPICIOUS_TLD_PATTERN = /\.(?:xyz|top|club|buzz|cyou|cfd|online|site|icu|live|stream|shop|rest|work|click|loan|loans|gdn|bid|men|date|party|racing|trade|win|download|review)$/i;
const COMMON_PLACEHOLDER_EMAIL_PATTERN = /^(?:test|admin|user|example|noreply|no-reply|info|mail|someone|anyone|example\d*|test\d+)@/i;
const GREETING_ONLY_PATTERN = /^\s*(?:hi|hello|hey|yo|sup|greetings|howdy|hola)[!.,\s]*$/i;
const SHOUTING_THRESHOLD = 0.6;
const QUESTION_WORD_PATTERN = /\b(?:what|why|how|when|where|who|which|whose|whom|can|could|would|should|do|does|did|is|are|was|were|will|may|might)\b/i;
const EMOTIONAL_KEYWORDS = {
    excited: /\b(?:amazing|awesome|incredible|fantastic|brilliant|love|adore|thrilled|excited|cannot wait|can't wait|absolutely|wonderful)\b/i,
    polite: /\b(?:please|thank(?:s|\s+you)|kindly|appreciate|grateful)\b/i,
    apologetic: /\b(?:sorry|apologize|apologies|my bad|excuse me|pardon)\b/i,
    frustrated: /\b(?:frustrated|annoying|annoyed|terrible|awful|hate|worst|broken|useless|garbage)\b/i
};

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

    if (trimmed.length > 80) {
        return createAssessment(false, "Name is unusually long. Use the name you actually go by.");
    }

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

    if (/\d/.test(trimmed)) {
        return createAssessment(false, "Names do not contain digits. Use your real name.");
    }

    if (!segments.some((segment) => segment.length >= 2)) {
        return createAssessment(false, "Use more than initials so I know who I am replying to.");
    }

    if (FAKE_NAME_PATTERN.test(trimmed)) {
        return createAssessment(false, "That looks like a placeholder identity. Use your real name.");
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

    const uniqueSegments = new Set(segments.map((s) => s.toLowerCase()));
    if (segments.length >= 2 && uniqueSegments.size === 1) {
        return createAssessment(false, "First and last name should not be identical.");
    }

    return createAssessment(true, "");
}

function isShouting(value) {
    const letters = value.match(/[A-Za-z]/g) || [];
    if (letters.length < 8) return false;
    const upper = letters.filter((char) => char === char.toUpperCase()).length;
    return upper / letters.length >= SHOUTING_THRESHOLD;
}

function countEmojis(value) {
    return (value.match(EMOJI_PATTERN) || []).length;
}

function assessEmailField(value) {
    const trimmed = value.trim();
    if (!trimmed) return createAssessment(false, "Email is required.");
    if (trimmed.length > 254) return createAssessment(false, "Email address is longer than the RFC allows.");
    if (!trimmed.includes("@")) return createAssessment(false, "Email needs an @ symbol.");
    if ((trimmed.match(/@/g) || []).length !== 1) return createAssessment(false, "Email should contain exactly one @ symbol.");

    const [local, domain] = trimmed.split("@");
    if (!local) return createAssessment(false, "Email is missing the local inbox part before @.");
    if (!domain) return createAssessment(false, "Email is missing a domain after @.");
    if (local.length > 64) return createAssessment(false, "Local part of the email is longer than RFC allows.");
    if (/\.\./.test(trimmed)) return createAssessment(false, "Email contains consecutive dots, which is not allowed.");
    if (local.startsWith(".") || local.endsWith(".")) return createAssessment(false, "Email local part cannot start or end with a dot.");
    if (!/^[A-Za-z0-9._%+\-]+$/.test(local)) return createAssessment(false, "Email contains characters that most providers reject.");
    if (!domain.includes(".")) return createAssessment(false, "Email domain is missing a dot.");
    if (!/\.[A-Za-z]{2,}$/.test(domain)) return createAssessment(false, "Email domain looks incomplete.");
    if (/^[-.]|[-.]$/.test(domain)) return createAssessment(false, "Email domain is malformed.");
    if (!EMAIL_PATTERN.test(trimmed)) return createAssessment(false, "Email needs a valid inbox format.");
    if (COMMON_PLACEHOLDER_EMAIL_PATTERN.test(trimmed)) return createAssessment(false, "That inbox looks like a placeholder. Use an email you actually monitor.");

    return createAssessment(true, "");
}

function assessSubjectField(value) {
    const trimmed = value.trim();
    const letters = extractLetters(trimmed);
    const signals = getTextSignals(trimmed);

    if (!trimmed) return createAssessment(false, "Subject is required.");
    if (trimmed.length > 150) return createAssessment(false, "Subject is too long. Keep it a single clear headline.");
    if (letters.length < 3) return createAssessment(false, "Subject needs a clearer headline.");
    if (!signals.wordCount) return createAssessment(false, "Subject needs a real topic or request.");

    if (GREETING_ONLY_PATTERN.test(trimmed)) {
        return createAssessment(false, "Greetings are nice, but the subject needs the actual topic.");
    }

    if (signals.placeholderHits >= 2 || (signals.placeholderHits >= 1 && signals.wordCount <= 4)) {
        return createAssessment(false, "Subject looks like test text. Use the real topic or request.");
    }

    if (signals.wordCount === 1 && signals.suspiciousWordCount === 1) {
        return createAssessment(false, "Subject reads like random characters. Use the actual topic.");
    }

    if (signals.wordCount === 1 && letters.length < 5) {
        return createAssessment(false, "Subject needs at least a couple of words to describe the topic.");
    }

    if (signals.suspiciousWordCount >= Math.max(1, Math.ceil(signals.wordCount * 0.6))) {
        return createAssessment(false, "Subject needs a real topic, not placeholder text.");
    }

    if (signals.uniqueRatio < 0.5 && signals.wordCount >= 3) {
        return createAssessment(false, "Subject repeats itself too much. Make it more specific.");
    }

    if (isShouting(trimmed)) {
        return createAssessment(false, "Avoid ALL CAPS in the subject line. Regular sentence case reads calmer.");
    }

    if (EMOJI_SPAM_PATTERN.test(trimmed)) {
        return createAssessment(false, "Too many emoji. Keep the subject clean and descriptive.");
    }

    if (EXCESSIVE_PUNCT_PATTERN.test(trimmed)) {
        return createAssessment(false, "Easy on the punctuation. One mark of emphasis is plenty.");
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

    if (GREETING_ONLY_PATTERN.test(trimmed)) {
        return createAssessment(false, "A greeting alone is not a message. Tell me what you want to discuss.");
    }

    if (LINK_ONLY_PATTERN.test(trimmed)) {
        return createAssessment(false, "A lone link is not a message. Add context about why you are sharing it.");
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

    if (isShouting(trimmed)) {
        return createAssessment(false, "Please switch out of ALL CAPS. Regular case makes the message much more readable.");
    }

    if (countEmojis(trimmed) > 8) {
        return createAssessment(false, "That is a lot of emoji. Swap a few for actual words so the meaning is clearer.");
    }

    if (EMOJI_SPAM_PATTERN.test(trimmed)) {
        return createAssessment(false, "Emoji walls drown the point. Use a few where they count.");
    }

    return createAssessment(true, "");
}

function assessContactField(fieldName, value) {
    switch (fieldName) {
        case "name":
            return assessNameField(value);
        case "email":
            return assessEmailField(value);
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
        disposableModel = await window.tf.loadLayersModel(modelPath);
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
        this.nodImpulse = 0;
        this.thinkingStrength = 0;
        this.winkTimer = 0;
        this.winkEye = null;
        this.eyelidTarget = 1;
        this.eyelid = 1;
        this.speechHistory = new Map();
        this.interactionStats = {
            keystrokes: 0,
            lastKeyAt: 0,
            lastInputLengths: {},
            fastTypingStreak: 0,
            pasteCount: 0,
            backspaceCount: 0
        };
        this.memory = {
            greetedAt: 0,
            namedAt: 0,
            lastIntent: "",
            lastUrgency: "Low",
            seenPaste: false,
            seenFastTyping: false,
            complimentedOnce: false,
            winkedOnce: false,
            emotionalMood: null
        };
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
        this.setupGodRays();
        this.spawnDustMotes();
        this.setupForm();
        this.setupIdleCallbacks();
        this.syncAnalysis();
        this.setMood("idle");
        this.setStatus("Awaiting input", "active");
        this.animate(0);
    }

    setupIdleCallbacks() {
        this.idleCallbacks = {
            onIdleHint: () => {
                if (this.activeField) return;
                if (!this.formData.name && !this.formData.email) {
                    this.speak(this.pickLine("idleHint", [
                        "Take your time. I am still listening.",
                        "No rush. Start wherever feels natural.",
                        "I am here when you are ready."
                    ]));
                }
            },
            onBored: () => {
                if (this.activeField) return;
                if (this.mood !== "alert" && this.mood !== "excited") {
                    this.setMood("curious");
                    this.speak(this.pickLine("bored", [
                        "Still curious to hear what you are working on.",
                        "Whenever you start typing, I will pick it up.",
                        "The form is warmed up for you."
                    ]));
                }
            },
            onSleepy: () => {
                if (this.activeField) return;
                this.setMood("sleepy");
                this.setStatus("Standby mode", "active");
                this.speak(this.pickLine("sleepy", [
                    "Dimming a little. Type anything to wake me up.",
                    "Sliding into standby. Any keystroke brings me right back.",
                    "Resting my processors until you are ready."
                ]));
            }
        };
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

        const browMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 2.4,
            metalness: 0.05,
            roughness: 0.08
        });
        this.leftEyebrow = new THREE.Mesh(this.eyebrowGeometry(), browMaterial);
        this.leftEyebrow.position.set(-0.32, 0.36, 1.04);
        this.leftEyebrow.scale.set(1, 1, 1);
        this.leftEyebrow.visible = false;
        this.rightEyebrow = new THREE.Mesh(this.eyebrowGeometry(), browMaterial.clone());
        this.rightEyebrow.position.set(0.32, 0.36, 1.04);
        this.rightEyebrow.scale.set(1, 1, 1);
        this.rightEyebrow.visible = false;
        this.headGroup.add(this.leftEyebrow, this.rightEyebrow);
        this.browState = {
            leftRot: 0, rightRot: 0,
            leftY: 0, rightY: 0,
            leftScale: 1, rightScale: 1,
            visible: 0
        };
        this.browTarget = {
            leftRot: 0, rightRot: 0,
            leftY: 0, rightY: 0,
            leftScale: 1, rightScale: 1,
            visible: 0
        };

        this.mouth = new THREE.Mesh(this.mouthGeometry([0.03, -0.01, -0.03, -0.01, 0.03]), this.materials.mouth);
        this.mouth.position.set(0, -0.28, 1.08);
        this.headGroup.add(this.mouth);

        const openMouthMaterial = new THREE.MeshStandardMaterial({
            color: 0x050508,
            emissive: 0x111122,
            emissiveIntensity: 0.6,
            metalness: 0.1,
            roughness: 0.2
        });
        this.openMouth = new THREE.Mesh(new THREE.CircleGeometry(0.1, 32), openMouthMaterial);
        this.openMouth.position.set(0, -0.28, 1.085);
        this.openMouth.scale.setScalar(0);
        this.openMouth.visible = false;
        this.headGroup.add(this.openMouth);

        const openMouthRim = new THREE.Mesh(
            new THREE.TorusGeometry(0.1, 0.022, 14, 40),
            this.materials.mouth
        );
        openMouthRim.position.set(0, 0, 0);
        this.openMouth.add(openMouthRim);
        this.openMouthRim = openMouthRim;
        this.openMouthTarget = 0;
        this.openMouthStrength = 0;
        this.mouthThickness = 0.026;
        this.currentMouthThickness = 0.026;

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

    mouthGeometry(profile, thickness = 0.026) {
        const xs = [-0.34, -0.17, 0, 0.17, 0.34];
        const points = xs.map((x, i) => new THREE.Vector3(x, profile[i], 0));
        return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 40, thickness, 14, false);
    }

    eyebrowGeometry() {
        const points = [
            new THREE.Vector3(-0.12, 0, 0),
            new THREE.Vector3(-0.04, 0.01, 0),
            new THREE.Vector3(0.04, 0.01, 0),
            new THREE.Vector3(0.12, 0, 0)
        ];
        return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 20, 0.018, 10, false);
    }

    setupLighting() {
        this.renderer.toneMappingExposure = 1.22;

        this.godRayAngle = -22;
        this.godRayIntensity = 2.5;

        this.scene.add(new THREE.HemisphereLight(0xffffff, 0x000000, 0.16));

        const angRad = (this.godRayAngle * Math.PI) / 180;
        this.keyLightSource = new THREE.Vector3(Math.sin(angRad) * 6, Math.cos(Math.abs(angRad)) * 6 + 0.5, 3.5);
        this.keyLightTarget = new THREE.Vector3(0, 0, 0);

        const key = new THREE.DirectionalLight(0xffffff, 3.6);
        key.position.copy(this.keyLightSource);
        key.target.position.copy(this.keyLightTarget);
        this.scene.add(key, key.target);

        const keySecondary = new THREE.DirectionalLight(0xffffff, 0.25);
        keySecondary.position.set(3.8, 4.6, 2.8);
        this.scene.add(keySecondary);

        const fill = new THREE.PointLight(0x9a9a9a, 0.4, 16, 1.6);
        fill.position.set(3.6, 0.2, 5.2);
        this.scene.add(fill);

        const rim = new THREE.PointLight(0xffffff, 0.65, 11, 1.6);
        rim.position.set(-2.2, 1.8, -3.4);
        this.scene.add(rim);

        const eyeLight = new THREE.PointLight(0xffffff, 0.32, 6, 2);
        eyeLight.position.set(0, 0.5, 4);
        this.scene.add(eyeLight);

        const bottomLight = new THREE.PointLight(0x444444, 0.18, 8, 2);
        bottomLight.position.set(0, -2.5, 2);
        this.scene.add(bottomLight);

        if (this.materials && this.materials.shell) {
            this.materials.shell.emissiveIntensity = 0.1;
        }
        if (this.materials && this.materials.dark) {
            this.materials.dark.emissiveIntensity = 0.04;
        }
    }

    setupGodRays() {
        this.godRayCanvas = document.getElementById("godRayCanvas");
        if (!this.godRayCanvas) return;
        this.godRayCtx = this.godRayCanvas.getContext("2d");
        this.godRayOccluder = document.createElement("canvas");
        this.godRayOccluderCtx = this.godRayOccluder.getContext("2d");
        this.godRayAccum = document.createElement("canvas");
        this.godRayAccumCtx = this.godRayAccum.getContext("2d");
        this.resizeGodRayCanvas();
        window.addEventListener("resize", () => this.resizeGodRayCanvas());
    }

    resizeGodRayCanvas() {
        if (!this.godRayCanvas) return;
        const rect = this.godRayCanvas.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        this.godRayCanvas.width = Math.max(1, Math.floor(rect.width * dpr));
        this.godRayCanvas.height = Math.max(1, Math.floor(rect.height * dpr));
        this.godRayDpr = dpr;
    }

    moodRayIntensityBoost() {
        const boost = {
            celebrating: 0.7,
            excited: 0.45,
            proud: 0.3,
            impressed: 0.25,
            greeting: 0.18,
            happy: 0.12,
            alert: -0.25,
            concerned: -0.3,
            frustrated: -0.35,
            sad: -0.45,
            sleepy: -0.6
        };
        return boost[this.mood] || 0;
    }

    drawGodRays(t) {
        if (!this.godRayCtx) return;
        const RAY_RES = 0.5;
        const canvas = this.godRayCanvas;
        const ctx = this.godRayCtx;
        const octx = this.godRayOccluderCtx;
        const rctx = this.godRayAccumCtx;
        const W = canvas.width;
        const H = canvas.height;
        if (!W || !H) return;

        const rw = Math.max(1, Math.floor(W * RAY_RES));
        const rh = Math.max(1, Math.floor(H * RAY_RES));
        if (this.godRayOccluder.width !== rw || this.godRayOccluder.height !== rh) {
            this.godRayOccluder.width = this.godRayAccum.width = rw;
            this.godRayOccluder.height = this.godRayAccum.height = rh;
        }

        this.godRaySmoothIntensity = (this.godRaySmoothIntensity ?? this.godRayIntensity)
            + ((this.godRayIntensity + this.moodRayIntensityBoost()) - (this.godRaySmoothIntensity ?? this.godRayIntensity)) * 0.04;
        const intensity = Math.max(0.2, this.godRaySmoothIntensity);
        const angleBase = (this.godRayAngle * Math.PI) / 180;

        const cx = W * 0.525;
        const cy = H * 0.568;
        const radius = Math.min(W, H) * 0.16;

        const srcX = cx + Math.sin(angleBase) * Math.max(W, H) * 1.05;
        const srcY = cy - Math.cos(Math.abs(angleBase)) * Math.max(W, H) * 1.05 - Math.max(W, H) * 0.18;

        ctx.clearRect(0, 0, W, H);

        octx.globalCompositeOperation = "source-over";
        octx.fillStyle = "#000";
        octx.fillRect(0, 0, rw, rh);

        const srcRX = srcX * RAY_RES;
        const srcRY = srcY * RAY_RES;
        const ballR = radius * RAY_RES;
        const ballX = cx * RAY_RES;
        const ballY = cy * RAY_RES;

        // Bright source flare — concentrated, soft, static
        const flare = octx.createRadialGradient(srcRX, srcRY, 0, srcRX, srcRY, rw * 1.05);
        const sMain = Math.min(1, 0.6 + intensity * 0.2);
        flare.addColorStop(0, `rgba(255,255,255,${sMain})`);
        flare.addColorStop(0.08, `rgba(255,255,255,${sMain * 0.85})`);
        flare.addColorStop(0.28, `rgba(255,255,255,${sMain * 0.42})`);
        flare.addColorStop(0.6, `rgba(240,243,250,${sMain * 0.14})`);
        flare.addColorStop(1, "rgba(0,0,0,0)");
        octx.fillStyle = flare;
        octx.fillRect(0, 0, rw, rh);

        // One broad sunlight cone — wide, soft, static
        const mainA = Math.atan2(ballY - srcRY, ballX - srcRX);
        octx.save();
        octx.globalCompositeOperation = "screen";

        const coneEnd = Math.max(rw, rh) * 2.6;
        const coneHalfAngle = 0.42;
        const conePts = 64;
        octx.beginPath();
        octx.moveTo(srcRX, srcRY);
        for (let i = 0; i <= conePts; i += 1) {
            const a = mainA - coneHalfAngle + (i / conePts) * coneHalfAngle * 2;
            octx.lineTo(srcRX + Math.cos(a) * coneEnd, srcRY + Math.sin(a) * coneEnd);
        }
        octx.closePath();
        const coneGrad = octx.createRadialGradient(srcRX, srcRY, 0, srcRX, srcRY, coneEnd * 0.85);
        const coneAlpha = Math.min(0.55, 0.16 + intensity * 0.14);
        coneGrad.addColorStop(0, `rgba(255,255,255,${coneAlpha})`);
        coneGrad.addColorStop(0.2, `rgba(255,255,255,${coneAlpha * 0.75})`);
        coneGrad.addColorStop(0.55, `rgba(255,255,255,${coneAlpha * 0.32})`);
        coneGrad.addColorStop(1, "rgba(255,255,255,0)");
        octx.fillStyle = coneGrad;
        octx.fill();

        // A few broad, irregular sub-shafts inside the cone for natural variation
        const shafts = [
            { spread: -0.30, width: 0.34, alpha: 0.42 },
            { spread: -0.10, width: 0.46, alpha: 0.55 },
            { spread:  0.08, width: 0.40, alpha: 0.50 },
            { spread:  0.26, width: 0.30, alpha: 0.36 }
        ];
        for (let i = 0; i < shafts.length; i += 1) {
            const s = shafts[i];
            const a = mainA + s.spread;
            const ex = srcRX + Math.cos(a) * coneEnd;
            const ey = srcRY + Math.sin(a) * coneEnd;
            const px = -Math.sin(a);
            const py = Math.cos(a);
            const hw = s.width * Math.max(rw, rh) * 0.22;
            const fade = Math.pow(1 - Math.abs(s.spread) * 1.4, 1.8);
            const alpha = s.alpha * intensity * 0.35 * fade;
            const g = octx.createLinearGradient(srcRX, srcRY, ex, ey);
            g.addColorStop(0, `rgba(255,255,255,${Math.min(0.55, alpha * 1.4)})`);
            g.addColorStop(0.4, `rgba(255,255,255,${alpha * 0.55})`);
            g.addColorStop(1, "rgba(255,255,255,0)");
            octx.beginPath();
            octx.moveTo(srcRX, srcRY);
            octx.lineTo(ex + px * hw, ey + py * hw);
            octx.lineTo(ex - px * hw, ey - py * hw);
            octx.closePath();
            octx.fillStyle = g;
            octx.filter = "blur(2px)";
            octx.fill();
            octx.filter = "none";
        }
        octx.restore();

        // Cut a soft ball silhouette so the radial blur projects a shadow cone behind it
        octx.globalCompositeOperation = "destination-out";
        const cutGrad = octx.createRadialGradient(ballX, ballY, ballR * 0.78, ballX, ballY, ballR * 1.22);
        cutGrad.addColorStop(0, "rgba(0,0,0,1)");
        cutGrad.addColorStop(0.7, "rgba(0,0,0,0.9)");
        cutGrad.addColorStop(1, "rgba(0,0,0,0)");
        octx.fillStyle = cutGrad;
        octx.fillRect(ballX - ballR * 1.4, ballY - ballR * 1.4, ballR * 2.8, ballR * 2.8);
        octx.beginPath();
        octx.arc(ballX, ballY, ballR * 0.92, 0, Math.PI * 2);
        octx.fill();
        octx.globalCompositeOperation = "source-over";

        // Radial-blur scatter — projects rays from source outward
        rctx.clearRect(0, 0, rw, rh);
        rctx.globalCompositeOperation = "lighter";
        const NUM_PASSES = 46;
        const decay = 0.945;
        const density = 0.918;
        const weight = 0.058 * intensity;
        for (let i = 0; i < NUM_PASSES; i += 1) {
            const scale = Math.pow(density, i);
            const w = weight * Math.pow(decay, i);
            rctx.globalAlpha = w;
            rctx.save();
            rctx.translate(srcRX, srcRY);
            rctx.scale(scale, scale);
            rctx.translate(-srcRX, -srcRY);
            rctx.drawImage(this.godRayOccluder, 0, 0);
            rctx.restore();
        }
        rctx.globalAlpha = 1;

        // Composite onto main canvas
        ctx.save();
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(this.godRayAccum, 0, 0, rw, rh, 0, 0, W, H);
        ctx.restore();

        // Subtle atmospheric halo above the ball where the beam approaches it
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        const coronaX = cx + Math.sin(angleBase) * radius * 0.9;
        const coronaY = cy - radius * 1.05;
        const corona = ctx.createRadialGradient(coronaX, coronaY, 0, coronaX, coronaY, radius * 1.5);
        const ci = Math.min(0.32, intensity * 0.16);
        corona.addColorStop(0, `rgba(255,255,255,${ci})`);
        corona.addColorStop(0.4, `rgba(255,255,255,${ci * 0.35})`);
        corona.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = corona;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();

        // Feather mask so canvas edges fade smoothly to transparent
        ctx.save();
        ctx.globalCompositeOperation = "destination-in";
        const featherCX = cx;
        const featherCY = cy - Math.min(W, H) * 0.08;
        const featherR = Math.min(W, H) * 0.5;
        const feather = ctx.createRadialGradient(featherCX, featherCY, 0, featherCX, featherCY, featherR);
        feather.addColorStop(0, "rgba(0,0,0,1)");
        feather.addColorStop(0.55, "rgba(0,0,0,1)");
        feather.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = feather;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
    }

    spawnDustMotes() {
        if (!this.container) return;
        this.container.querySelectorAll(".dust-mote").forEach((d) => d.remove());

        const ang = (this.godRayAngle * Math.PI) / 180;
        const ballCX = 50;
        const ballCY = 50;
        const COUNT = 60;

        for (let i = 0; i < COUNT; i += 1) {
            const along = Math.random() * 1.2 - 0.15;
            const across = (Math.random() - 0.5) * 48;

            const srcX = ballCX - Math.sin(ang) * 90;
            const srcY = ballCY - Math.cos(Math.abs(ang)) * 90;

            const bx = srcX + (ballCX - srcX) * along + Math.cos(ang) * across;
            const by = srcY + (ballCY - srcY) * along + Math.sin(ang) * across;

            const dx = bx - ballCX;
            const dy = by - ballCY;
            if (dx * dx + dy * dy < 520) continue;

            const d = document.createElement("div");
            d.className = "dust-mote";
            const sz = Math.random() * 2.4 + 0.9;
            const beamFade = Math.sin(Math.max(0, Math.min(1, along)) * Math.PI);
            const bright = 0.55 + beamFade * 0.55;

            d.style.cssText = `
                width:${sz}px;height:${sz}px;
                left:${bx}%;top:${by}%;
                --bright:${bright};
            `;
            this.container.appendChild(d);
        }
    }

    setupForm() {
        this.fields.forEach(({ field, input }, fieldName) => {
            input.addEventListener("focus", () => {
                this.markInteraction();
                this.activeField = fieldName;
                this.focusTarget = this.fieldTarget(input);
                const greeted = this.memory?.greetedAt > 0;
                const mood = !greeted ? "greeting" : fieldName === "message" ? "curious" : "listening";
                this.setMood(mood);
                if (!greeted && this.memory) {
                    this.memory.greetedAt = performance.now();
                }
                this.setStatus(`Scanning ${FIELD_LABELS[fieldName]}`, "active");
                this.speak(this.focusSpeech(fieldName));
                this.pulseAntenna(1);
            });

            input.addEventListener("blur", () => this.onBlur(fieldName, field, input));
            input.addEventListener("input", (event) => this.onInput(fieldName, field, input, event));
            input.addEventListener("keydown", (event) => this.onKeyDown(fieldName, event));
            input.addEventListener("paste", () => this.onPaste(fieldName));
        });

        this.form.addEventListener("submit", (event) => {
            event.preventDefault();
            this.onSubmit();
        });
    }

    onKeyDown(fieldName, event) {
        this.markInteraction();
        const stats = this.interactionStats;
        const now = performance.now();
        if (event.key === "Backspace" || event.key === "Delete") {
            stats.backspaceCount += 1;
        }
        if (event.key && event.key.length === 1) {
            const dt = now - stats.lastKeyAt;
            if (dt < 140 && dt > 0) {
                stats.fastTypingStreak += 1;
            } else {
                stats.fastTypingStreak = Math.max(0, stats.fastTypingStreak - 1);
            }
            stats.lastKeyAt = now;
            stats.keystrokes += 1;
            if (stats.fastTypingStreak > 14 && !this.memory.seenFastTyping && fieldName === "message") {
                this.memory.seenFastTyping = true;
                this.setMood("impressed");
                this.speak(this.pickLine("fastType", [
                    "You are on a roll. I love a clear train of thought.",
                    "Momentum detected. Keep going, this is flowing.",
                    "Nice pace. The brief is unspooling cleanly."
                ]));
            }
        }
    }

    onPaste(fieldName) {
        this.markInteraction();
        this.interactionStats.pasteCount += 1;
        if (!this.memory.seenPaste && (fieldName === "message" || fieldName === "subject")) {
            this.memory.seenPaste = true;
            setTimeout(() => {
                this.setMood("curious");
                this.speak(this.pickLine("paste", [
                    "Paste detected. Scanning it now.",
                    "Got the pasted block. Parsing the signal.",
                    "I see the paste. Pulling intent out of it."
                ]));
            }, 120);
        }
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
        const named = this.analysis.firstName;
        switch (fieldName) {
            case "name": return this.pickLine("focusName", [
                "Identity scan ready. Tell me what I should call you.",
                "Let us start with your name.",
                "Who am I replying to? Your name first."
            ]);
            case "email": return named
                ? this.pickLine("focusEmailNamed", [
                    `${named}, drop the inbox you actually check.`,
                    `Reply route time, ${named}. The inbox you monitor is best.`,
                    `Where should the reply land, ${named}?`
                ])
                : this.pickLine("focusEmail", [
                    "Reply route detected. I am looking for a valid inbox.",
                    "Drop in an inbox you actually check.",
                    "Email time. Use the one that reaches you fastest."
                ]);
            case "subject":
                if (this.analysis.intent !== "General") {
                    return `Mission header time. I am already reading a ${this.analysis.intent.toLowerCase()} signal from what you have typed.`;
                }
                return this.pickLine("focusSubject", [
                    "Mission header requested. A sharp subject helps me classify intent.",
                    "One-line topic works best here. What is this actually about?",
                    "Headline this for me. Short and specific."
                ]);
            case "message":
                if (this.analysis.wordCount) return this.analysis.coachLine;
                return this.pickLine("focusMessage", [
                    "Full brief channel open. Goal, context, and next step are all useful.",
                    "Tell me the situation, the ask, and what an ideal reply looks like.",
                    "What is the problem or idea, and what do you want to happen next?"
                ]);
            default: return "I am listening.";
        }
    }

    onInput(fieldName, field, input, event) {
        this.markInteraction();
        const previous = this.interactionStats.lastInputLengths[fieldName] ?? 0;
        const current = input.value.length;
        const delta = current - previous;
        this.interactionStats.lastInputLengths[fieldName] = current;

        this.formData[fieldName] = input.value;
        this.markField(fieldName, field, input, false);
        const analysis = this.syncAnalysis();
        this.focusTarget = this.activeField ? this.fieldTarget(this.fields.get(this.activeField).input) : this.focusTarget;
        this.pulseAntenna(0.4);

        const emotionalTone = this.detectEmotionalTone(`${analysis.statusLine ? "" : ""}${this.formData.subject} ${this.formData.message}`);

        if (analysis.urgency === "High") {
            this.setMood("concerned");
            this.setStatus(analysis.statusLine, this.statusTone(analysis));
        } else if (emotionalTone === "frustrated" && fieldName === "message" && analysis.wordCount >= 5) {
            this.setMood("concerned");
            this.setStatus(analysis.statusLine, this.statusTone(analysis));
        } else if (analysis.readiness >= 90 && analysis.actionable) {
            this.setMood("proud");
            this.setStatus(analysis.statusLine, this.statusTone(analysis));
        } else if (analysis.readiness >= 80) {
            this.setMood("excited");
            this.setStatus(analysis.statusLine, this.statusTone(analysis));
        } else if (fieldName === "message" && analysis.wordCount >= 20 && analysis.intent !== "General") {
            this.setMood("focused");
            this.setStatus(analysis.statusLine, this.statusTone(analysis));
        } else if (fieldName === "message" && this.formData.message.trim()) {
            this.setMood("thinking");
            this.thinkPose();
            this.setStatus(analysis.statusLine, this.statusTone(analysis));
        } else if (analysis.qualityIssues.length && this.formData[fieldName].trim()) {
            this.setMood("suspicious");
            this.setStatus(analysis.statusLine, this.statusTone(analysis));
        } else {
            this.setMood("listening");
            this.setStatus(`Reading ${FIELD_LABELS[fieldName]}`, "active");
        }

        if (delta >= 30 && !this.memory.seenPaste) {
            this.memory.seenPaste = true;
            this.setMood("curious");
            this.speak(this.pickLine("pasteInline", [
                "That arrived in a chunk. Let me parse it.",
                "Sudden burst of text. I am catching up.",
                "Got the block — processing intent now."
            ]));
        }

        this.milestoneSpeech(fieldName, analysis);
    }

    detectEmotionalTone(text) {
        if (!text) return null;
        if (EMOTIONAL_KEYWORDS.frustrated.test(text)) return "frustrated";
        if (EMOTIONAL_KEYWORDS.apologetic.test(text)) return "apologetic";
        if (EMOTIONAL_KEYWORDS.excited.test(text)) return "excited";
        if (EMOTIONAL_KEYWORDS.polite.test(text)) return "polite";
        return null;
    }

    onBlur(fieldName, field, input) {
        this.markInteraction();
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
            if (analysis.readiness >= 90 && analysis.actionable) this.setMood("proud");
            else if (analysis.readiness >= 80) this.setMood("excited");
            else this.setMood("happy");
            this.nod();
            this.setStatus(`${FIELD_LABELS[fieldName]} looks good`, "success");
            if (fieldName === "name" && analysis.firstName && !this.milestones.named) {
                this.milestones.named = true;
                this.setMood("greeting");
                this.speak(this.pickLine("nameGreeting", [
                    `Nice to meet you, ${analysis.firstName}.`,
                    `Good to meet you, ${analysis.firstName}.`,
                    `Hi ${analysis.firstName}. I have got the rest.`,
                    `Hello ${analysis.firstName}. Rest of the brief next.`
                ]));
                return;
            }
            this.speak(this.validSpeech(fieldName, analysis));
            return;
        }

        this.setMood(fieldName === "email" ? "suspicious" : "concerned");
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
            this.setMood("impressed");
            this.speak(analysis.emailType === "Work"
                ? this.pickLine("emailWork", [
                    `Work inbox format detected through ${analysis.emailDomain}.`,
                    `Professional inbox via ${analysis.emailDomain}. Noted.`,
                    `That ${analysis.emailDomain} route looks work-grade.`
                ])
                : this.pickLine("emailPersonal", [
                    `Reply route format looks clean via ${analysis.emailDomain}.`,
                    `${analysis.emailDomain} inbox locked in.`,
                    `Got it. Replies will route through ${analysis.emailDomain}.`
                ]));
        }
        if (analysis.intent !== "General" && analysis.intent !== this.milestones.intent) {
            this.milestones.intent = analysis.intent;
            this.memory.lastIntent = analysis.intent;
            this.setMood("curious");
            this.speak(this.pickLine(`intent-${analysis.intent}`, [
                `${analysis.intent} intent recognized.`,
                `Reading this as a ${analysis.intent.toLowerCase()} signal.`,
                `Filing this under ${analysis.intent.toLowerCase()} for now.`
            ]));
        }
        if (analysis.hasLink && !this.milestones.linkSeen) {
            this.milestones.linkSeen = true;
            this.speak(this.pickLine("link", [
                "Reference link detected. Good context.",
                "Link received. That sharpens the brief.",
                "Attached URL noted."
            ]));
        }
        if (analysis.urgency === "High" && this.milestones.urgency !== "High") {
            this.milestones.urgency = "High";
            this.memory.lastUrgency = "High";
            this.setMood("alert");
            this.speak(this.pickLine("urgent", [
                "Urgent tone detected. Flagging this as time-sensitive.",
                "Time-sensitive signal. I will mark this as high priority.",
                "I can hear the urgency. Logging accordingly."
            ]));
        }
        if (fieldName === "message" && analysis.detail !== this.milestones.detail) {
            this.milestones.detail = analysis.detail;
            if (analysis.detail === "forming") this.speak(this.pickLine("formForming", [
                "Signal forming. I can see the direction now.",
                "Starting to take shape.",
                "Sketch is showing up."
            ]));
            if (analysis.detail === "clear") this.speak(this.pickLine("formClear", [
                "This brief is getting clearer.",
                "Picture sharpening nicely.",
                "That reads cleanly."
            ]));
            if (analysis.detail === "detailed") {
                this.setMood("impressed");
                this.speak(this.pickLine("formDetailed", [
                    "Strong detail density detected.",
                    "Lots of useful texture here.",
                    "This is a rich brief."
                ]));
            }
        }
        if (fieldName === "message" && analysis.wordCount >= 8 && analysis.coachSignature !== this.milestones.coachSignature) {
            this.milestones.coachSignature = analysis.coachSignature;
            this.speak(analysis.coachLine);
        }
        const emotional = this.detectEmotionalTone(`${this.formData.subject} ${this.formData.message}`);
        if (emotional && emotional !== this.memory.emotionalMood) {
            this.memory.emotionalMood = emotional;
            if (emotional === "frustrated") {
                this.setMood("concerned");
                this.speak(this.pickLine("frustrated", [
                    "I am picking up frustration. I will make sure this gets handled carefully.",
                    "That reads tense — noted, and I will treat it with care.",
                    "Logging the friction. Your message will be read closely."
                ]));
            } else if (emotional === "excited") {
                this.setMood("excited");
                this.speak(this.pickLine("excitedTone", [
                    "Love the energy. That enthusiasm comes through.",
                    "Great vibe in this one.",
                    "This message has spark."
                ]));
            } else if (emotional === "polite") {
                this.speak(this.pickLine("politeTone", [
                    "Politeness noted. Much appreciated.",
                    "Nice tone. Thanks for the kindness.",
                    "The courtesy is warmly received."
                ]));
            } else if (emotional === "apologetic") {
                this.speak(this.pickLine("apologeticTone", [
                    "No need to apologize — happy to help.",
                    "Nothing to be sorry about.",
                    "All good, no apology needed."
                ]));
            }
        }
        if (analysis.readiness >= 80 && !this.milestones.ready) {
            this.milestones.ready = true;
            this.setMood("proud");
            this.speak(this.pickLine("ready", [
                "This message is clear, grounded, and ready.",
                "Solid brief. Ready to send whenever you are.",
                "That is a dispatch-grade message."
            ]));
        }
    }

    validSpeech(fieldName, analysis) {
        const named = analysis.firstName;
        switch (fieldName) {
            case "name":
                return named
                    ? this.pickLine("vName", [
                        `Identity locked: ${named}.`,
                        `Got it, ${named}.`,
                        `${named} — locked in.`
                    ])
                    : this.pickLine("vNamePlain", [
                        "Identity looks good.",
                        "Name accepted.",
                        "Name reads well."
                    ]);
            case "email":
                return analysis.emailDomain
                    ? this.pickLine("vEmail", [
                        `Reply route format looks clean via ${analysis.emailDomain}.`,
                        `${analysis.emailDomain} inbox format verified.`,
                        `Email format passes — ${analysis.emailDomain} is routable.`
                    ])
                    : this.pickLine("vEmailPlain", [
                        "Reply route format looks valid.",
                        "Email format is good.",
                        "Inbox format cleared."
                    ]);
            case "subject":
                return analysis.intent !== "General"
                    ? this.pickLine(`vSubject-${analysis.intent}`, [
                        `${analysis.intent} signal captured from the subject line.`,
                        `Subject classifies as ${analysis.intent.toLowerCase()}. Clear.`,
                        `${analysis.intent} — that is what your subject is telling me.`
                    ])
                    : this.pickLine("vSubjectPlain", [
                        "Subject looks focused.",
                        "Clean headline.",
                        "Subject reads direct."
                    ]);
            case "message":
                return analysis.actionable
                    ? this.pickLine("vMsgActionable", [
                        "Message quality is strong. This feels ready.",
                        "Brief is rich and specific — ready to send.",
                        "This message does the work. Good to go."
                    ])
                    : analysis.coachLine;
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

    pickLine(key, options) {
        if (!options || !options.length) return "";
        if (options.length === 1) return options[0];
        const lastIndex = this.speechHistory.get(key);
        let next;
        do {
            next = Math.floor(Math.random() * options.length);
        } while (next === lastIndex && options.length > 1);
        this.speechHistory.set(key, next);
        return options[next];
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
            thinking: [0.02, 0.01, -0.01, -0.02, -0.04],
            happy: [0.12, 0.03, -0.12, 0.03, 0.12],
            alert: [-0.06, 0.03, 0.08, 0.03, -0.06],
            excited: [0.16, -0.01, -0.18, -0.01, 0.16],
            greeting: [0.1, 0.02, -0.08, 0.02, 0.1],
            curious: [0.04, 0.02, -0.02, -0.01, 0.05],
            focused: [0.01, -0.01, -0.03, -0.01, 0.01],
            confused: [0.06, -0.04, 0.02, 0.04, -0.05],
            suspicious: [-0.02, -0.04, -0.08, -0.03, 0.04],
            impressed: [0.08, -0.02, -0.09, -0.02, 0.08],
            proud: [0.1, 0.01, -0.1, 0.01, 0.1],
            concerned: [-0.04, 0.01, 0.05, 0.01, -0.04],
            sad: [-0.1, -0.02, 0.1, -0.02, -0.1],
            sleepy: [0.01, -0.005, -0.015, -0.005, 0.01],
            playful: [0.13, 0.04, -0.14, 0.02, 0.1],
            surprised: [0.02, -0.005, 0, -0.005, 0.02],
            wink: [0.13, 0.02, -0.11, 0.03, 0.11],
            celebrating: [0.18, 0, -0.2, 0, 0.18],
            frustrated: [-0.08, 0.04, 0.1, 0.04, -0.08]
        };
        const palettes = {
            idle: [0xffffff, 0xa8a8a8, 0xffffff],
            listening: [0xffffff, 0xbcbcbc, 0xffffff],
            thinking: [0xe3e3e3, 0x8f8f8f, 0xeaeaea],
            happy: [0xffffff, 0xd0d0d0, 0xffffff],
            alert: [0xd6d6d6, 0x888888, 0xdcdcdc],
            excited: [0xffffff, 0xffffff, 0xffffff],
            greeting: [0xffffff, 0xcfcfcf, 0xffffff],
            curious: [0xf1f1f1, 0xb1b1b1, 0xf5f5f5],
            focused: [0xe6e6e6, 0x959595, 0xeeeeee],
            confused: [0xdedede, 0x9a9a9a, 0xe4e4e4],
            suspicious: [0xbcbcbc, 0x717171, 0xc4c4c4],
            impressed: [0xffffff, 0xe0e0e0, 0xffffff],
            proud: [0xffffff, 0xd8d8d8, 0xffffff],
            concerned: [0xcccccc, 0x7a7a7a, 0xcdcdcd],
            sad: [0xa4a4a4, 0x5c5c5c, 0xb5b5b5],
            sleepy: [0x9e9e9e, 0x555555, 0xa8a8a8],
            playful: [0xffffff, 0xe4e4e4, 0xffffff],
            surprised: [0xffffff, 0xcfcfcf, 0xffffff],
            wink: [0xffffff, 0xd0d0d0, 0xffffff],
            celebrating: [0xffffff, 0xffffff, 0xffffff],
            frustrated: [0xc2c2c2, 0x707070, 0xc8c8c8]
        };
        const palette = palettes[mood] || palettes.idle;

        const thicknesses = {
            surprised: 0.018,
            sleepy: 0.02,
            sad: 0.028,
            excited: 0.03,
            celebrating: 0.032,
            frustrated: 0.03,
            playful: 0.03
        };
        this.mouthThickness = thicknesses[mood] || 0.026;

        if (this.mouth) {
            this.mouth.geometry.dispose();
            this.mouth.geometry = this.mouthGeometry(profiles[mood] || profiles.idle, this.mouthThickness);
        }

        const openMouthStrength = {
            surprised: 1,
            impressed: 0.6,
            celebrating: 0.45,
            confused: 0.25
        };
        this.openMouthTarget = openMouthStrength[mood] || 0;

        const cheekMap = {
            excited: 0.34,
            celebrating: 0.42,
            happy: 0.22,
            playful: 0.28,
            proud: 0.18,
            greeting: 0.16,
            wink: 0.24,
            alert: 0.08,
            frustrated: 0.1,
            impressed: 0.14
        };
        this.cheekTarget = cheekMap[mood] || 0;

        const browConfigs = {
            idle: { visible: 0, leftRot: 0, rightRot: 0, leftY: 0, rightY: 0, leftScale: 1, rightScale: 1 },
            listening: { visible: 0, leftRot: 0, rightRot: 0, leftY: 0, rightY: 0, leftScale: 1, rightScale: 1 },
            thinking: { visible: 1, leftRot: 0.15, rightRot: -0.05, leftY: 0.02, rightY: -0.01, leftScale: 1, rightScale: 1 },
            curious: { visible: 1, leftRot: 0, rightRot: -0.25, leftY: 0.01, rightY: 0.05, leftScale: 1, rightScale: 1 },
            focused: { visible: 1, leftRot: -0.15, rightRot: 0.15, leftY: -0.03, rightY: -0.03, leftScale: 1.05, rightScale: 1.05 },
            confused: { visible: 1, leftRot: -0.3, rightRot: 0.15, leftY: 0.02, rightY: 0.04, leftScale: 1, rightScale: 1 },
            suspicious: { visible: 1, leftRot: 0.2, rightRot: -0.4, leftY: -0.02, rightY: 0.03, leftScale: 1, rightScale: 1 },
            impressed: { visible: 1, leftRot: 0, rightRot: 0, leftY: 0.06, rightY: 0.06, leftScale: 1.08, rightScale: 1.08 },
            proud: { visible: 1, leftRot: 0.08, rightRot: -0.08, leftY: 0.01, rightY: 0.01, leftScale: 1.02, rightScale: 1.02 },
            concerned: { visible: 1, leftRot: 0.25, rightRot: -0.25, leftY: 0.04, rightY: 0.04, leftScale: 1, rightScale: 1 },
            sad: { visible: 1, leftRot: 0.35, rightRot: -0.35, leftY: 0.05, rightY: 0.05, leftScale: 1, rightScale: 1 },
            alert: { visible: 1, leftRot: -0.28, rightRot: 0.28, leftY: -0.02, rightY: -0.02, leftScale: 1.05, rightScale: 1.05 },
            frustrated: { visible: 1, leftRot: -0.4, rightRot: 0.4, leftY: -0.04, rightY: -0.04, leftScale: 1.1, rightScale: 1.1 },
            happy: { visible: 0, leftRot: 0, rightRot: 0, leftY: 0.01, rightY: 0.01, leftScale: 1, rightScale: 1 },
            excited: { visible: 1, leftRot: 0, rightRot: 0, leftY: 0.05, rightY: 0.05, leftScale: 1.06, rightScale: 1.06 },
            celebrating: { visible: 1, leftRot: 0, rightRot: 0, leftY: 0.06, rightY: 0.06, leftScale: 1.1, rightScale: 1.1 },
            greeting: { visible: 1, leftRot: 0, rightRot: 0, leftY: 0.04, rightY: 0.04, leftScale: 1.04, rightScale: 1.04 },
            playful: { visible: 1, leftRot: -0.1, rightRot: 0.25, leftY: 0.02, rightY: 0.05, leftScale: 1, rightScale: 1 },
            surprised: { visible: 1, leftRot: 0, rightRot: 0, leftY: 0.08, rightY: 0.08, leftScale: 1.08, rightScale: 1.08 },
            wink: { visible: 1, leftRot: 0, rightRot: -0.15, leftY: 0.02, rightY: 0.05, leftScale: 1.02, rightScale: 1.02 },
            sleepy: { visible: 1, leftRot: 0.1, rightRot: -0.1, leftY: -0.02, rightY: -0.02, leftScale: 1, rightScale: 1 }
        };
        this.browTarget = browConfigs[mood] || browConfigs.idle;

        this.winkEye = mood === "wink" ? "right" : null;
        this.eyelidTarget = mood === "sleepy" ? 0.35 : mood === "focused" || mood === "suspicious" ? 0.7 : 1;

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
        this.markInteraction();
        this.suppressIdleMoods = true;
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
            this.setMood("frustrated");
            this.setStatus("The form still needs attention", "error");
            this.speak(issues[0] || "The form needs another pass.");
            this.shake();
            this.toast(issues[0] || "Please correct the highlighted fields before sending.");
            this.suppressIdleMoods = false;
            return;
        }

        this.button.classList.add("loading");
        this.setMood("focused");
        this.thinkPose();
        this.setStatus("Verifying reply route", "active");
        this.speak(analysis.firstName
            ? this.pickLine("verifyNamed", [
                `${analysis.firstName}, verifying the reply route before I send anything.`,
                `Hang on, ${analysis.firstName}. Doing a quick inbox check.`,
                `${analysis.firstName}, running the reply route through security first.`
            ])
            : this.pickLine("verify", [
                "Verifying the reply route before I send anything.",
                "Running the inbox through a quick safety check.",
                "Reply route going through verification now."
            ]));

        if (window.location.origin !== CONTACT_ALLOWED_ORIGIN) {
            const feedback = this.submissionErrorFeedback({ status: 403 });
            this.button.classList.remove("loading");
            this.setMood("suspicious");
            this.setStatus(feedback.status, "error");
            this.speak(feedback.speech, 4600);
            this.toast(feedback.toast);
            this.shake();
            this.suppressIdleMoods = false;
            return;
        }

        const emailCheck = await verifyEmailDisposable(this.formData.email);
        if (emailCheck.disposable) {
            const { field } = this.fields.get("email");
            const feedback = this.emailVerificationFeedback(emailCheck);
            field.classList.remove("valid");
            field.classList.add("invalid");
            this.button.classList.remove("loading");
            this.setMood("suspicious");
            this.setStatus(feedback.status, feedback.tone);
            this.speak(feedback.speech, 4200);
            this.toast(feedback.toast);
            this.shake();
            this.suppressIdleMoods = false;
            return;
        }

        this.setStatus("Transmitting message", "active");
        this.setMood("focused");
        this.speak(analysis.firstName
            ? this.pickLine("transmitNamed", [
                `Reply route verified for ${analysis.firstName}. Transmitting now.`,
                `${analysis.firstName}, the route passed. Sending your message.`,
                `All clear, ${analysis.firstName}. Dispatching the brief.`
            ])
            : this.pickLine("transmit", [
                "Reply route verified. Transmitting your message now.",
                "Route cleared. Sending.",
                "All checks green. Dispatching."
            ]));

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
            this.setMood("celebrating");
            this.triggerWink();
            this.nod();
            this.setStatus(response.ref ? `Delivered | REF ${response.ref}` : "Message delivered successfully", "success");
            const sendoff = analysis.firstName
                ? this.pickLine("sendoffNamed", [
                    `Sent, ${analysis.firstName}. I will make sure this gets read.`,
                    `On its way, ${analysis.firstName}. Expect a reply soon.`,
                    `Dispatched, ${analysis.firstName}. Nice brief.`
                ])
                : (analysis.intent !== "General"
                    ? this.pickLine(`sendoff-${analysis.intent}`, [
                        `${analysis.intent} message delivered. Nice work.`,
                        `Your ${analysis.intent.toLowerCase()} signal is on its way.`,
                        `Filed and sent under ${analysis.intent.toLowerCase()}.`
                    ])
                    : this.pickLine("sendoff", [
                        "Message delivered. Nice work.",
                        "Sent. Consider it in the inbox.",
                        "Dispatched. Thanks for the note."
                    ]));
            this.speak(response.ref
                ? `${response.message || sendoff} Reference ${response.ref}.`
                : (response.message || sendoff));
            this.celebrate();
            this.confetti();
            this.toast(response.ref ? `${response.message || "Your message has been sent."} Ref: ${response.ref}` : response.message || `Signal captured with ${analysis.readiness}% readiness.`);
        } catch (error) {
            const feedback = this.submissionErrorFeedback(error);
            this.button.classList.remove("loading");
            this.setMood("sad");
            this.setStatus(feedback.status, "error");
            this.speak(feedback.speech, 4600);
            this.toast(feedback.toast);
            this.shake();
            this.suppressIdleMoods = false;
            return;
        }

        setTimeout(() => {
            this.form.reset();
            this.counter.textContent = "0 / 500";
            this.fields.forEach(({ field }) => field.classList.remove("valid", "invalid"));
            this.formData = { name: "", email: "", subject: "", message: "" };
            if (this.honeypot) this.honeypot.value = "";
            this.milestones = this.defaultMilestones();
            this.memory = {
                greetedAt: 0,
                namedAt: 0,
                lastIntent: "",
                lastUrgency: "Low",
                seenPaste: false,
                seenFastTyping: false,
                complimentedOnce: false,
                winkedOnce: false,
                emotionalMood: null
            };
            this.interactionStats = {
                keystrokes: 0,
                lastKeyAt: 0,
                lastInputLengths: {},
                fastTypingStreak: 0,
                pasteCount: 0,
                backspaceCount: 0
            };
            this.button.classList.remove("success");
            this.button.querySelector(".btn-text").textContent = "Send Message";
            this.setMood("listening");
            this.setStatus("Waiting for a new signal", "active");
            this.markInteraction();
            this.suppressIdleMoods = false;
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

        this.updateIdleBehavior(time, dt);

        const idleGaze = this.idleGaze || { x: 0, y: 0 };
        this.focusStrength += ((this.activeField ? 1 : 0) - this.focusStrength) * 0.05;
        const focusMix = this.activeField ? 0.62 : 0.16;
        const idleMix = this.activeField ? 0 : 1;
        const targetX = clamp(this.pointerTarget.x * 0.54 + this.focusTarget.x * focusMix * this.focusStrength + idleGaze.x * idleMix, -0.72, 0.72);
        const targetY = clamp(this.pointerTarget.y * 0.58 + this.focusTarget.y * focusMix * this.focusStrength + idleGaze.y * idleMix, -0.58, 0.58);
        this.look.x += (targetX - this.look.x) * 0.065;
        this.look.y += (targetY - this.look.y) * 0.065;

        this.antennaPulse = Math.max(0, this.antennaPulse - dt * 1.6);
        this.shakeStrength = Math.max(0, this.shakeStrength - dt * 3.8);
        this.celebration = Math.max(0, this.celebration - dt * 0.65);
        this.nodImpulse = Math.max(0, (this.nodImpulse || 0) - dt * 3);
        this.thinkingStrength = Math.max(0, (this.thinkingStrength || 0) - dt * 0.6);

        if (time > this.nextBlinkAt && this.blinkPhase === 0) this.blinkPhase = 1;
        let blink = 1;
        if (this.blinkPhase > 0) {
            this.blinkPhase += dt * 9;
            blink = clamp(1 - Math.sin(Math.min(this.blinkPhase, Math.PI)) * 0.97, 0.03, 1);
            if (this.blinkPhase >= Math.PI) {
                this.blinkPhase = 0;
                const mult = this.mood === "sleepy" ? 0.4 : this.mood === "focused" ? 1.5 : 1;
                this.nextBlinkAt = time + (2.2 + Math.random() * 3) * mult;
            }
        }

        const eyelidAim = typeof this.eyelidTarget === "number" ? this.eyelidTarget : 1;
        this.eyelid = (this.eyelid ?? 1) + (eyelidAim - (this.eyelid ?? 1)) * 0.08;

        let leftBlink = blink * this.eyelid;
        let rightBlink = blink * this.eyelid;
        if (this.winkTimer > 0) {
            this.winkTimer = Math.max(0, this.winkTimer - dt);
            const winkProgress = clamp(Math.sin((1 - this.winkTimer / 0.55) * Math.PI), 0, 1);
            const winkSide = this.triggeredWinkEye || this.winkEye || "right";
            if (winkSide === "right") rightBlink = Math.max(0.04, rightBlink - winkProgress * 0.96);
            else leftBlink = Math.max(0.04, leftBlink - winkProgress * 0.96);
            if (this.winkTimer === 0) {
                this.triggeredWinkEye = null;
            }
        } else if (this.winkEye && this.mood === "wink") {
            const winkProgress = 0.65;
            if (this.winkEye === "right") rightBlink = Math.max(0.04, rightBlink - winkProgress);
            else leftBlink = Math.max(0.04, leftBlink - winkProgress);
        }

        const breathe = Math.sin(time * 1.2) * 0.008;
        const breatheScale = 1 + Math.sin(time * 1.2) * 0.006;
        const hover = Math.sin(time * 1.4) * 0.028 + Math.sin(time * 0.7) * 0.014 + breathe;
        const bounce = Math.sin((1.4 - this.celebration) * 10) * this.celebration * 0.08;
        const shake = this.shakeStrength > 0 ? Math.sin(time * 48) * this.shakeStrength * 0.1 : 0;
        const nod = this.nodImpulse > 0 ? Math.sin((1 - this.nodImpulse) * Math.PI * 2) * this.nodImpulse * 0.12 : 0;
        const thinkTilt = this.thinkingStrength > 0 ? Math.sin(time * 1.6) * this.thinkingStrength * 0.08 : 0;

        this.robotGroup.rotation.y = 0;
        this.robotGroup.rotation.x = 0;
        this.robotGroup.rotation.z = 0;

        this.headGroup.position.x = this.headBaseX + this.look.x * 0.12;
        this.headGroup.position.y = this.headBaseY + hover + bounce + this.look.y * 0.045 - nod * 0.05;
        this.headGroup.position.z = 0.08 + Math.abs(this.look.x) * 0.03;
        this.headGroup.rotation.y = this.look.x * 0.52 + thinkTilt;
        this.headGroup.rotation.x = -this.look.y * 0.35 + nod * 0.3;
        this.headGroup.rotation.z = -this.look.x * 0.07 + shake * 0.18 + thinkTilt * 0.3;
        this.headGroup.scale.setScalar(this.faceScale * breatheScale);

        const pupilX = clamp(this.look.x * 0.075, -0.055, 0.055);
        const pupilY = clamp(this.look.y * 0.075, -0.045, 0.045);
        this.leftPupil.position.x = pupilX;
        this.leftPupil.position.y = pupilY;
        this.rightPupil.position.x = pupilX;
        this.rightPupil.position.y = pupilY;

        const pupilScale = this.mood === "surprised" || this.mood === "impressed"
            ? 1.2
            : this.mood === "suspicious" || this.mood === "focused"
                ? 0.8
                : this.mood === "sleepy" ? 0.85 : 1;
        const currentPupilScale = this.leftPupil.userData.currentScale ?? 1;
        const nextPupilScale = currentPupilScale + (pupilScale - currentPupilScale) * 0.12;
        this.leftPupil.userData.currentScale = nextPupilScale;
        this.rightPupil.userData.currentScale = nextPupilScale;
        this.leftPupil.scale.set(1.04 * nextPupilScale, 1 * nextPupilScale, 0.7);
        this.rightPupil.scale.set(1.04 * nextPupilScale, 1 * nextPupilScale, 0.7);

        this.leftEyeGroup.scale.y = leftBlink;
        this.rightEyeGroup.scale.y = rightBlink;

        const highlightPulse = 0.95 + Math.sin(time * 2.5) * 0.05;
        if (this.leftHighlight) {
            this.leftHighlight.scale.setScalar(highlightPulse);
            this.rightHighlight.scale.setScalar(highlightPulse);
        }

        if (this.leftCheek && this.rightCheek) {
            this.leftCheek.material.opacity += (this.cheekTarget - this.leftCheek.material.opacity) * 0.08;
            this.rightCheek.material.opacity += (this.cheekTarget - this.rightCheek.material.opacity) * 0.08;
        }

        if (this.leftEyebrow && this.rightEyebrow && this.browState && this.browTarget) {
            const b = this.browState;
            const t = this.browTarget;
            b.visible += (t.visible - b.visible) * 0.14;
            b.leftRot += (t.leftRot - b.leftRot) * 0.15;
            b.rightRot += (t.rightRot - b.rightRot) * 0.15;
            b.leftY += (t.leftY - b.leftY) * 0.15;
            b.rightY += (t.rightY - b.rightY) * 0.15;
            b.leftScale += (t.leftScale - b.leftScale) * 0.15;
            b.rightScale += (t.rightScale - b.rightScale) * 0.15;

            const visible = b.visible > 0.05;
            this.leftEyebrow.visible = visible;
            this.rightEyebrow.visible = visible;
            this.leftEyebrow.rotation.z = b.leftRot;
            this.rightEyebrow.rotation.z = b.rightRot;
            this.leftEyebrow.position.set(-0.32, 0.36 + b.leftY, 1.04);
            this.rightEyebrow.position.set(0.32, 0.36 + b.rightY, 1.04);
            this.leftEyebrow.scale.set(b.leftScale, b.leftScale, 1);
            this.rightEyebrow.scale.set(b.rightScale, b.rightScale, 1);
            this.leftEyebrow.material.opacity = b.visible;
            this.rightEyebrow.material.opacity = b.visible;
            this.leftEyebrow.material.transparent = true;
            this.rightEyebrow.material.transparent = true;
            this.leftEyebrow.material.emissiveIntensity = 2.4 * b.visible;
            this.rightEyebrow.material.emissiveIntensity = 2.4 * b.visible;
        }

        if (this.openMouth) {
            this.openMouthStrength += ((this.openMouthTarget || 0) - this.openMouthStrength) * 0.12;
            if (this.openMouthStrength > 0.02) {
                this.openMouth.visible = true;
                const oscillate = this.mood === "surprised" ? 1 + Math.sin(time * 3) * 0.04 : 1;
                this.openMouth.scale.setScalar(this.openMouthStrength * oscillate);
                this.openMouth.material.opacity = 0.85;
                this.openMouth.material.transparent = true;
            } else {
                this.openMouth.visible = false;
            }
            if (this.mouth) {
                this.mouth.visible = this.openMouthStrength < 0.7;
            }
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

        this.drawGodRays(ms);
    }

    updateIdleBehavior(time, dt) {
        if (!this.idleState) {
            this.idleState = {
                lastInteraction: time,
                nextGlanceAt: time + 4 + Math.random() * 3,
                glanceUntil: 0,
                glanceTarget: { x: 0, y: 0 },
                lastIdleSpeech: 0,
                boredStage: 0
            };
            this.idleGaze = { x: 0, y: 0 };
        }

        const state = this.idleState;
        const sinceInteraction = time - state.lastInteraction;

        if (!this.activeField && time > state.nextGlanceAt) {
            state.glanceTarget = {
                x: (Math.random() - 0.5) * 0.8,
                y: (Math.random() - 0.5) * 0.4
            };
            state.glanceUntil = time + 1.2 + Math.random() * 1.3;
            state.nextGlanceAt = time + 3.5 + Math.random() * 4.5;
        }

        const glanceActive = time < state.glanceUntil;
        const targetGaze = glanceActive ? state.glanceTarget : { x: 0, y: 0 };
        this.idleGaze.x += (targetGaze.x - this.idleGaze.x) * 0.05;
        this.idleGaze.y += (targetGaze.y - this.idleGaze.y) * 0.05;

        if (!this.activeField && this.idleCallbacks && !this.suppressIdleMoods) {
            if (sinceInteraction > 45 && state.boredStage < 3) {
                state.boredStage = 3;
                this.idleCallbacks.onSleepy?.();
            } else if (sinceInteraction > 25 && state.boredStage < 2) {
                state.boredStage = 2;
                this.idleCallbacks.onBored?.();
            } else if (sinceInteraction > 12 && state.boredStage < 1) {
                state.boredStage = 1;
                this.idleCallbacks.onIdleHint?.();
            }
        }
    }

    markInteraction() {
        if (!this.idleState) return;
        const now = performance.now() / 1000;
        this.idleState.lastInteraction = now;
        this.idleState.boredStage = 0;
    }

    nod() {
        this.nodImpulse = 1;
    }

    triggerWink(side = "right") {
        this.triggeredWinkEye = side;
        this.winkTimer = 0.55;
    }

    thinkPose() {
        this.thinkingStrength = 1;
    }

    getParticlePalette() {
        switch (this.mood) {
            case "alert":
            case "frustrated":
            case "concerned":
            case "suspicious":
                return { dot: "220, 220, 220", link: "150, 150, 150" };
            case "sad":
            case "sleepy":
                return { dot: "140, 140, 140", link: "80, 80, 80" };
            case "happy":
            case "excited":
            case "celebrating":
            case "proud":
            case "greeting":
            case "playful":
            case "wink":
            case "impressed":
                return { dot: "255, 255, 255", link: "190, 190, 190" };
            case "thinking":
            case "curious":
            case "focused":
            case "confused":
            case "surprised":
                return { dot: "210, 210, 210", link: "135, 135, 135" };
            default:
                return { dot: "175, 175, 175", link: "95, 95, 95" };
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
