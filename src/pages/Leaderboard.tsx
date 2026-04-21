import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { Trophy } from 'lucide-react';

export default function Leaderboard() {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLeaders = async () => {
       try {
           const q = query(collection(db, "users"), orderBy("highScore", "desc"), limit(10));
           const snapshot = await getDocs(q);
           setLeaders(snapshot.docs.map(doc => doc.data()));
       } catch (err) {
           console.error("Error fetching leaderboards", err);
       } finally {
           setLoading(false);
       }
    };
    fetchLeaders();
  }, []);

  return (
    <div className="w-full flex-1 flex flex-col md:grid md:grid-cols-12 md:gap-0 h-full font-mono bg-[#f0f0f0] dark:bg-[#202124]">
      <main className="md:col-span-8 lg:col-span-9 p-8 flex flex-col items-center justify-center relative border-r border-gray-300 dark:border-gray-700">
         <div className="text-center space-y-4 max-w-sm">
            <h1 className="text-6xl font-bold uppercase tracking-widest text-yellow-500 mb-8">
               <Trophy size={64} className="mx-auto mb-4" />
            </h1>
            <p className="text-gray-500 text-sm uppercase tracking-widest">Global Top 10 Survival Highscores</p>
         </div>
      </main>

      <aside className="md:col-span-4 lg:col-span-3 bg-white dark:bg-[#1c1d21] p-6 flex flex-col h-full">
        <div className="mb-8">
            <button onClick={() => navigate('/menu')} className="w-full py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-bold uppercase transition-colors">
               Back to Menu
            </button>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <h2 className="text-xs uppercase text-gray-500 font-bold mb-4 tracking-widest">Leaderboard Rankings</h2>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {loading ? (
               <div className="text-center opacity-50 py-8 text-xs uppercase animate-pulse">Loading Scores...</div>
            ) : leaders.length === 0 ? (
               <div className="text-center opacity-50 py-8 text-xs uppercase">No Scores Yet</div>
            ) : (
               leaders.map((l, i) => (
                  <div key={i} className={`flex items-center justify-between text-xs p-3 bg-gray-50 dark:bg-[#282a2e] ${i === 0 ? 'border-r-4 border-yellow-500 text-yellow-500' : `opacity-${Math.max(40, 100 - i * 15)}`}`}>
                      <div className="flex items-center gap-2 overflow-hidden w-2/3">
                         <span className="font-bold opacity-70">0{i+1}.</span>
                         <span className="font-bold truncate" title={l.name || 'GUEST'}>{l.name || 'GUEST'}</span>
                      </div>
                      <span className="font-mono text-gray-700 dark:text-gray-300">{l.highScore?.toLocaleString() || 0}</span>
                  </div>
               ))
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
