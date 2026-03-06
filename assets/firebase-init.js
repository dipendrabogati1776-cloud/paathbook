import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import {
  collection,
  getFirestore,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCowhhw_DXZU9IQoaTCxMevcg3uZzEX9BA",
  authDomain: "paathbook-web.firebaseapp.com",
  projectId: "paathbook-web",
  storageBucket: "paathbook-web.firebasestorage.app",
  messagingSenderId: "347967222959",
  appId: "1:347967222959:web:488872c263e107e223d05a"
};

const isConfigValid =
  !!firebaseConfig.apiKey &&
  !!firebaseConfig.projectId &&
  !!firebaseConfig.appId;

let app = null;
let db = null;
let auth = null;

if (isConfigValid) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
}

const resultsDocRef = () => {
  if (!db) {
    return null;
  }
  return doc(db, "election_results", "current");
};

export {
  app,
  auth,
  collection,
  db,
  doc,
  getDoc,
  getDocs,
  isConfigValid,
  limit,
  onAuthStateChanged,
  onSnapshot,
  query,
  resultsDocRef,
  serverTimestamp,
  setDoc,
  signInWithEmailAndPassword,
  signOut
};
