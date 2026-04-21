import { useNavigate } from 'react-router-dom';
import { playSound } from '../lib/sound';

export default function Menu() {
  const navigate = useNavigate();

  return (
    <div className="w-full flex-1 flex flex-col md:grid md:grid-cols-12 md:gap-0 h-full font-mono">
      <aside className="md:col-span-4 lg:col-span-3 border-r border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1c1d21] p-6 flex flex-col space-y-4">
        <h2 className="text-xs uppercase text-gray-500 font-bold tracking-tighter">Solo Mode</h2>
        <button 
            onClick={() => { playSound('/sounds/click.mp3'); navigate('/game/solo'); }}
            className="w-full py-4 px-4 bg-gray-50 dark:bg-[#282a2e] border-l-4 border-transparent hover:border-blue-400 text-left transition-all group"
        >
            <span className="block font-bold">SOLO RUN</span>
            <span className="text-[10px] text-gray-500 uppercase group-hover:text-blue-500">Classic highscore chase</span>
        </button>

        <h2 className="text-xs uppercase text-gray-500 font-bold tracking-tighter pt-4">Multiplayer Mode</h2>
        <button 
            onClick={() => { playSound('/sounds/click.mp3'); navigate('/lobby/random'); }}
            className="w-full py-4 px-4 bg-gray-50 dark:bg-[#282a2e] border-l-4 border-transparent hover:border-green-400 text-left transition-all group"
        >
            <span className="block font-bold text-green-600 dark:text-green-400">RANDOM MATCH</span>
            <span className="text-[10px] text-gray-500 uppercase group-hover:text-green-500">Auto match 2-7 players</span>
        </button>
        <button 
            onClick={() => { playSound('/sounds/click.mp3'); navigate('/lobby/room'); }}
            className="w-full py-4 px-4 bg-gray-50 dark:bg-[#282a2e] border-l-4 border-transparent hover:border-yellow-400 text-left transition-all group"
        >
            <span className="block font-bold text-yellow-600 dark:text-yellow-400">CUSTOM ROOM</span>
            <span className="text-[10px] text-gray-500 uppercase group-hover:text-yellow-500">Play with friends</span>
        </button>

        <div className="pt-8 space-y-4">
          <h2 className="text-xs uppercase text-gray-500 font-bold tracking-tighter">Tools</h2>
          <button 
              onClick={() => { playSound('/sounds/click.mp3'); navigate('/leaderboards'); }}
              className="w-full py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-bold uppercase transition-colors"
          >
              Leaderboards
          </button>
        </div>
      </aside>

      <main className="md:col-span-8 lg:col-span-9 bg-[#f0f0f0] dark:bg-[#202124] p-8 flex flex-col items-center justify-center relative overflow-y-auto">
          <div className="text-center space-y-8 max-w-lg">
             <div className="space-y-4">
                <h1 className="text-5xl md:text-7xl font-bold uppercase text-gray-800 dark:text-white">CRAZY DINOS</h1>
                <p className="text-xl text-gray-500">Pick a game mode on the left to start running.</p>
             </div>
             
             <div className="w-full max-w-[200px] mx-auto opacity-50 block">
                 <img src="/images/dino.png" alt="Dino" className="w-full h-auto drop-shadow-xl animate-bounce" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
             </div>
          </div>
      </main>
    </div>
  );
}
