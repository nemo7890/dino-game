import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { socket } from '../lib/socket';
import { DinoEngine } from '../lib/DinoEngine';
import { Trophy, Home } from 'lucide-react';
import { playSound } from '../lib/sound';

export default function Game() {
  const { roomId } = useParams<{ roomId?: string }>();
  const navigate = useNavigate();
  const { user, username } = useAuth();
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<DinoEngine | null>(null);
  
  const [gameOver, setGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [roomData, setRoomData] = useState<any>(null);

  useEffect(() => {
     if (!canvasRef.current || !user) return;
     (window as any)._uid = user.uid;

     engineRef.current = new DinoEngine(canvasRef.current!);
     const engine = engineRef.current;
     engine.start();

     const handleJoined = (id: string) => {
         // Replace URL safely so it doesn't remount if needed, or navigate
         if (roomId === 'solo') navigate(`/game/${id}`, { replace: true });
     };

     const handleGameState = (state: any) => {
         setRoomData(state);
         engine.updateState(state);
         
         const players = Object.values(state.players) as any[];
         players.sort((a,b) => b.score - a.score);
         setLeaderboard(players);

         const me = state.players[user.uid];
         if (me && me.isDead && !gameOver) {
            setGameOver(true);
            setFinalScore(me.score);
         }
         if (state.status === 'gameover' && !gameOver) {
            setGameOver(true);
         }
     };

     const handleDeath = ({ uid, score }: {uid:string, score:number}) => {
         if (uid === user.uid) {
             playSound('/sounds/gameover.mp3');
         }
     };

     socket.on('joined', handleJoined);
     socket.on('gameState', handleGameState);
     socket.on('playerDied', handleDeath);

     if (roomId === 'solo') {
        socket.emit('joinSolo', { uid: user.uid, name: username || 'Player' });
     } else if (roomId) {
        socket.emit('reconnectGame', { uid: user.uid, roomId });
     }

     // Listen to keydown
     const handleKeyDown = (e: KeyboardEvent) => {
         if (e.code === 'Space' || e.code === 'ArrowUp') {
             socket.emit('jump');
             e.preventDefault();
         } else if (e.code === 'ArrowDown') {
             socket.emit('duck', true);
             e.preventDefault();
         }
     };
     
     const handleKeyUp = (e: KeyboardEvent) => {
         if (e.code === 'ArrowDown') {
             socket.emit('duck', false);
         }
     };
     
     const handleTouch = () => {
         socket.emit('jump');
     };

     window.addEventListener('keydown', handleKeyDown);
     window.addEventListener('keyup', handleKeyUp);
     window.addEventListener('touchstart', handleTouch);

     return () => {
         socket.off('joined', handleJoined);
         socket.off('gameState', handleGameState);
         socket.off('playerDied', handleDeath);
         window.removeEventListener('keydown', handleKeyDown);
         window.removeEventListener('keyup', handleKeyUp);
         window.removeEventListener('touchstart', handleTouch);
         engine.stop();
     };
  }, [roomId, user, gameOver]);

  return (
    <div className="flex flex-col md:grid md:grid-cols-12 md:gap-0 h-full w-full font-mono bg-[#f0f0f0] dark:bg-[#202124]">
      
      <main className="md:col-span-8 lg:col-span-9 p-4 md:p-8 flex flex-col items-center justify-center relative select-none" onClick={() => socket.emit('jump')}>
         <div className="w-full max-w-4xl space-y-4">
             {roomId && roomData && roomData.type !== 'solo' && (
               <div className="w-full flex justify-between items-center text-xs text-gray-500 uppercase tracking-widest bg-white dark:bg-[#1c1d21] p-3 border border-gray-300 dark:border-gray-700">
                   <div className="font-bold shrink-0">ROOM: {roomId}</div>
                   <div className="flex gap-4 overflow-x-auto scrollbar-hide shrink">
                      {leaderboard.map(p => (
                          <span key={p.uid} className={p.isDead ? 'line-through text-red-500' : 'text-green-600 dark:text-green-400 font-bold'}>
                              {p.name}: {p.score}
                          </span>
                      ))}
                   </div>
               </div>
             )}

             <div className="relative border-4 border-gray-400 dark:border-gray-700 w-full overflow-hidden bg-white dark:bg-[#1a1b1e] rounded shadow-lg">
                <canvas 
                  ref={canvasRef} 
                  className="w-full h-auto block" 
                  style={{ aspectRatio: '800/250' }} 
                />
                
                {gameOver && (
                   <div className="absolute inset-0 bg-white/90 dark:bg-black/90 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
                      <h2 className="text-4xl mb-4 font-bold uppercase tracking-widest text-red-500">GAME OVER</h2>
                      <div className="text-xl mb-6 font-mono text-gray-800 dark:text-gray-200">SCORE: {finalScore}</div>

                      <div className="flex gap-4">
                         <button 
                           onClick={(e) => { 
                             e.stopPropagation(); 
                             playSound('/sounds/click.mp3'); 
                             if (roomData?.type === 'solo') {
                                window.location.reload(); 
                             } else {
                                navigate('/lobby/' + (roomData.type === 'random' ? 'random' : 'room'));
                             }
                           }} 
                           className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-widest text-xs transition-colors"
                         >
                           {roomData?.type === 'solo' ? 'PLAY AGAIN' : 'FIND NEW MATCH'}
                         </button>
                         <button 
                           onClick={(e) => { e.stopPropagation(); playSound('/sounds/click.mp3'); socket.emit('leaveRoom'); navigate('/menu'); }} 
                           className="flex items-center gap-2 px-6 py-3 border border-gray-400 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold uppercase tracking-widest text-xs transition-colors"
                         >
                           <Home size={14} /> MENU
                         </button>
                      </div>
                   </div>
                )}
             </div>
         </div>
      </main>

      <aside className="md:col-span-4 lg:col-span-3 border-l border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1c1d21] p-6 flex flex-col h-full overflow-y-auto">
        <div className="mb-8">
            <h2 className="text-xs uppercase text-gray-500 font-bold mb-4 tracking-widest">Match Details</h2>
            <div className="space-y-4">
                <div className="p-3 bg-gray-50 dark:bg-[#282a2e] border border-gray-200 dark:border-gray-700 text-xs">
                    <span className="text-gray-500 block mb-1">MODE</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{roomData?.type === 'solo' ? 'SOLO SURVIVAL' : 'MULTIPLAYER RUN'}</span>
                </div>
                {roomData?.type !== 'solo' && (
                  <div className="p-3 bg-gray-50 dark:bg-[#282a2e] border border-gray-200 dark:border-gray-700 text-xs">
                    <span className="text-gray-500 block mb-1">YOUR SCORE</span>
                    <span className="font-bold text-green-600 dark:text-green-400 font-mono">{finalScore || leaderboard.find(l => l.uid === user?.uid)?.score || 0}</span>
                  </div>
                )}
            </div>
        </div>

        <div className="mt-auto">
             <button onClick={() => { playSound('/sounds/click.mp3'); socket.emit('leaveRoom'); navigate('/menu'); }} className="w-full py-3 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-bold uppercase tracking-widest transition-colors mb-2">Back to Menu</button>
             <p className="text-[10px] text-gray-500 uppercase text-center mt-4">Space / Up / Click to Jump<br/>Arrow Down to Duck</p>
        </div>
      </aside>
    </div>
  );
}
