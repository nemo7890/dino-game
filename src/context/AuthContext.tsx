import React, { createContext, useContext, useEffect, useState } from "react";
import { User, signInWithPopup, GoogleAuthProvider, signInAnonymously, onAuthStateChanged, signOut, updateProfile } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

interface AuthContextType {
  user: User | null;
  username: string | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: (name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch or set username
        if (currentUser.isAnonymous) {
             setUsername(currentUser.displayName || "Guest");
        } else {
            setUsername(currentUser.displayName || "Player");
            // Optionally persist to Firestore
            const docRef = doc(db, "users", currentUser.uid);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
                await setDoc(docRef, {
                    uid: currentUser.uid,
                    name: currentUser.displayName,
                    email: currentUser.email,
                    highScore: 0,
                    createdAt: Date.now()
                });
            }
        }
      } else {
        setUsername(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signInAsGuest = async (name: string) => {
    const { user: newGuest } = await signInAnonymously(auth);
    await updateProfile(newGuest, { displayName: name });
    setUsername(name);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, username, loading, signInWithGoogle, signInAsGuest, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
