import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

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

export const auth = getAuth(app);
export const rtdb = getDatabase(app);
export const db = getFirestore(app);
