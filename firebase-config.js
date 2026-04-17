import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, set, onValue, update, push, onDisconnect, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyB-HUsDD4_9Vf46HEVGHYULr9BuwdVDmoU",
  authDomain: "dino-multiplayer-85737.firebaseapp.com",
  databaseURL: "https://dino-multiplayer-85737-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "dino-multiplayer-85737",
  storageBucket: "dino-multiplayer-85737.firebasestorage.app",
  messagingSenderId: "740514985206",
  appId: "1:740514985206:web:5f5714188152c3c06ca8d7"

};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider, signInWithPopup, signInAnonymously, ref, set, onValue, update, push, onDisconnect, remove };
