import React, { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, User } from 'lucide-react';
import { playSound } from '../lib/sound';

export default function Login() {
  const { signInWithGoogle, signInAsGuest } = useAuth();
  const [guestName, setGuestName] = useState('');
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    playSound('/sounds/click.mp3');
    try {
      setLoading(true);
      await signInWithGoogle();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const handleGuestSignIn = async (e: FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    playSound('/sounds/click.mp3');
    try {
      setLoading(true);
      await signInAsGuest(guestName);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col md:grid md:grid-cols-12 md:gap-0 font-mono bg-[#f0f0f0] dark:bg-[#202124]">
      <main className="md:col-span-12 p-8 flex flex-col items-center justify-center relative min-h-[calc(100vh-112px)]">
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-6xl md:text-8xl font-bold text-gray-800 dark:text-[#e8eaed]">
            CRAZY DINOS
          </h1>
          <p className="text-xl md:text-2xl text-gray-500 uppercase tracking-widest text-[#535353] dark:text-[#acacac]">
            when dinos discovered the internet
          </p>
        </div>

        <div className="w-full max-w-sm space-y-4">
          {!isGuestMode ? (
            <>
              <button
                disabled={loading}
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#282a2e] hover:border-blue-500 dark:hover:border-blue-400 transition-all font-bold tracking-widest text-sm uppercase shadow-sm hover:shadow"
              >
                <LogIn size={20} className="text-blue-600 dark:text-blue-400" />
                <span>SIGN IN WITH GOOGLE</span>
              </button>
              
              <div className="text-center opacity-50 relative my-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300 dark:border-gray-700"></div></div>
                <span className="relative z-10 px-4 bg-[#f0f0f0] dark:bg-[#202124] text-xs">OR</span>
              </div>

              <button
                disabled={loading}
                onClick={() => setIsGuestMode(true)}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#1c1d21] hover:bg-gray-100 dark:hover:bg-gray-800 transition-all tracking-widest text-sm uppercase text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <User size={20} />
                <span>GUEST ACCOUNT</span>
              </button>
            </>
          ) : (
            <form onSubmit={handleGuestSignIn} className="space-y-6 bg-white dark:bg-[#1c1d21] p-8 border border-gray-300 dark:border-gray-700 shadow-sm">
              <div>
                <p className="mb-2 text-xs font-bold text-gray-500 uppercase tracking-widest text-center">ENTER YOUR NAME</p>
                <input
                  type="text"
                  maxLength={12}
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="DINO_FAN"
                  className="w-full px-4 py-4 border border-gray-400 outline-none text-center uppercase tracking-widest text-xl bg-transparent focus:border-blue-500 transition-colors"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsGuestMode(false)}
                  className="flex-1 py-4 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-bold transition-colors tracking-widest uppercase"
                >
                  BACK
                </button>
                <button
                  type="submit"
                  disabled={!guestName.trim() || loading}
                  className="flex-1 py-4 bg-green-600 hover:bg-green-500 text-white disabled:opacity-50 disabled:bg-gray-400 text-xs font-bold transition-colors tracking-widest uppercase"
                >
                  {loading ? 'WAIT...' : 'PLAY'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
