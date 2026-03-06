import {
  auth,
  isConfigValid,
  onAuthStateChanged,
  signInWithEmailAndPassword
} from "/assets/firebase-init.js";

const e = {
  configWarning: document.getElementById("config-warning"),
  loginEmail: document.getElementById("login-email"),
  loginPassword: document.getElementById("login-password"),
  loginBtn: document.getElementById("login-btn"),
  authStatus: document.getElementById("auth-status")
};

function setStatus(message, level = "ok") {
  e.authStatus.textContent = message;
  e.authStatus.className = `status ${level}`;
}

function clearFieldErrors() {
  e.loginEmail.classList.remove("input-error");
  e.loginPassword.classList.remove("input-error");
}

function validateLoginForm() {
  clearFieldErrors();

  const email = e.loginEmail.value.trim();
  const password = e.loginPassword.value;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email) {
    e.loginEmail.classList.add("input-error");
    setStatus("कृपया इमेल लेख्नुहोस्।", "error");
    return false;
  }

  if (!emailRegex.test(email)) {
    e.loginEmail.classList.add("input-error");
    setStatus("इमेल ढाँचा मिलेन। उदाहरण: admin@example.com", "error");
    return false;
  }

  if (!password) {
    e.loginPassword.classList.add("input-error");
    setStatus("कृपया पासवर्ड लेख्नुहोस्।", "error");
    return false;
  }

  return true;
}

function mapAuthError(error) {
  const code = error?.code || "";
  const map = {
    "auth/invalid-email": "इमेल ठेगाना मान्य छैन।",
    "auth/missing-password": "पासवर्ड आवश्यक छ।",
    "auth/invalid-credential": "इमेल वा पासवर्ड मिलेन। फेरि जाँच गर्नुहोस्।",
    "auth/user-disabled": "यो अकाउन्ट निष्क्रिय गरिएको छ।",
    "auth/too-many-requests": "धेरै प्रयास भयो। केही समयपछि पुन: प्रयास गर्नुहोस्।",
    "auth/network-request-failed": "इन्टरनेट जडान समस्या भयो। जडान जाँच गर्नुहोस्।"
  };
  return map[code] || "लगइन असफल भयो। कृपया विवरण जाँचेर पुन: प्रयास गर्नुहोस्।";
}

function goPanel() {
  window.location.href = "/admin/panel.html";
}

function boot() {
  if (!isConfigValid) {
    e.configWarning.classList.remove("hidden");
    e.loginBtn.disabled = true;
    setStatus("Firebase कन्फिग सेट गरेपछि मात्र लगइन गर्न सकिन्छ।", "error");
    return;
  }

  onAuthStateChanged(auth, (user) => {
    if (user) {
      goPanel();
    }
  });

  async function handleLogin() {
    if (!validateLoginForm()) return;

    const email = e.loginEmail.value.trim();
    const password = e.loginPassword.value;

    try {
      e.loginBtn.disabled = true;
      setStatus("लगइन जाँच हुँदैछ...", "info");
      await signInWithEmailAndPassword(auth, email, password);
      setStatus("लगइन सफल भयो, panel खुल्दैछ...", "ok");
      goPanel();
    } catch (error) {
      setStatus(mapAuthError(error), "error");
    } finally {
      e.loginBtn.disabled = false;
    }
  }

  e.loginBtn.addEventListener("click", handleLogin);

  [e.loginEmail, e.loginPassword].forEach((node) => {
    node.addEventListener("input", () => {
      node.classList.remove("input-error");
      if (e.authStatus.textContent) {
        e.authStatus.textContent = "";
        e.authStatus.className = "status";
      }
    });
    node.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleLogin();
      }
    });
  });
}

boot();
