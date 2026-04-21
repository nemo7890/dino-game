import { useEffect, useState, FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { socket } from '../lib/socket';
import { playSound } from '../lib/sound';

export default function Lobby() {
  const { type } = useParams<{ type: 'random' | 'room' }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, username } = useAuth();
  
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomData, setRoomData] = useState<any>(null);
  const [inputCode, setInputCode] = useState(searchParams.get('join') || '');
  const [loading, setLoading] = useState(type === 'random' || !!searchParams.get('join'));
  const [error, setError] = useState('');
  const [tick, setTick] = useState<number | null>(null);

  // Connection & Matchmaking
  useEffect(() => {
    if (!user) return;

    const handleJoined = (id: string) => {
        setRoomId(id);
        setLoading(false);
    };

    const handleRoomUpdate = (data: any) => {
        setRoomData(data);
        if (data.status === 'playing') {
            navigate(`/game/${data.roomId}`);
        }
    };

    const handleTick = (ms: number) => {
       setTick(Math.ceil(ms / 1000));
    };

    const handleError = (msg: string) => {
        setError(msg);
        setLoading(false);
    };

    const handleKicked = (uid: string) => {
        if (uid === user.uid) navigate('/menu');
    };

    socket.on('joined', handleJoined);
    socket.on('roomUpdate', handleRoomUpdate);
    socket.on('tick', handleTick);
    socket.on('errorMsg', handleError);
    socket.on('kicked', handleKicked);

    if (type === 'random' && !roomId) {
        socket.emit('findRandom', { uid: user.uid, name: username });
    } else if (type === 'room' && searchParams.get('join') && !roomId) {
        socket.emit('joinCustom', { uid: user.uid, name: username, code: searchParams.get('join')?.toUpperCase() });
        window.history.replaceState({}, '', '/lobby/room');
    }

    return () => {
        socket.off('joined', handleJoined);
        socket.off('roomUpdate', handleRoomUpdate);
        socket.off('tick', handleTick);
        socket.off('errorMsg', handleError);
        socket.off('kicked', handleKicked);
    };
  }, [type, user, username, navigate, roomId, searchParams]);

  useEffect(() => {
      // If leaving component before playing, leave room
      return () => {
         if (roomData && roomData.status === 'waiting') {
             socket.emit('leaveRoom');
         }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const createCustomRoom = () => {
     playSound('/sounds/click.mp3');
     socket.emit('createCustom', { uid: user?.uid, name: username });
  };

  const joinCustomRoom = (e: FormEvent) => {
      e.preventDefault();
      playSound('/sounds/click.mp3');
      setError('');
      if (!inputCode.trim()) return;
      socket.emit('joinCustom', { uid: user?.uid, name: username, code: inputCode.trim().toUpperCase() });
  };

  const startGame = () => {
     playSound('/sounds/click.mp3');
     if (roomId && roomData?.host === user?.uid) {
         socket.emit('startGame', roomId);
     }
  };

  const kickPlayer = (uid: string) => {
     playSound('/sounds/click.mp3');
     if (roomId && roomData?.host === user?.uid) {
         socket.emit('kick', uid);
     }
  };

  const handleCopyLink = () => {
     playSound('/sounds/click.mp3');
     const link = `${window.location.origin}/lobby/room?join=${roomId}`;
     navigator.clipboard.writeText(link);
     alert('Join link copied!');
  };

  if (loading) {
     return (
       <div className="w-full h-full flex items-center justify-center bg-[#f0f0f0] dark:bg-[#202124] font-mono">
         <main className="flex flex-col items-center justify-center relative w-full h-full p-8">
           <div className="text-center space-y-8">
             <div className="relative inline-block">
                <div className="w-32 h-32 border-4 border-t-green-400 border-gray-300 dark:border-gray-700 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center font-bold text-2xl animate-pulse">
                  ...
                </div>
             </div>
             
             <div className="space-y-2">
               <h1 className="text-4xl font-bold uppercase text-green-500">Matchmaking</h1>
               <p className="text-xl text-gray-500">Searching for worthy opponents...</p>
             </div>
           </div>
         </main>
       </div>
     );
  }

  if (type === 'room' && !roomId) {
     return (
        <div className="flex flex-col items-center justify-center h-full gap-8 py-8 w-full">
           <main className="w-full max-w-sm space-y-8 font-mono">
               <h2 className="text-3xl font-bold uppercase tracking-[0.2em] text-center mb-8">CUSTOM ROOM</h2>
               <button onClick={createCustomRoom} className="w-full py-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none transition-colors font-bold uppercase tracking-widest text-sm">
                   CREATE NEW ROOM
               </button>
               
               <div className="text-center opacity-50 relative my-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-400 dark:border-gray-600"></div></div>
                  <span className="relative z-10 px-4 bg-[#f0f0f0] dark:bg-[#202124]">OR</span>
               </div>

               <form onSubmit={joinCustomRoom} className="space-y-4">
                  <input 
                     value={inputCode} 
                     onChange={(e) => setInputCode(e.target.value)}
                     maxLength={6}
                     placeholder="ROOM CODE" 
                     className="w-full p-4 border border-gray-300 dark:border-gray-600 outline-none text-center uppercase tracking-widest text-xl bg-transparent focus:border-blue-500"
                  />
                  {error && <p className="text-red-500 text-xs text-center font-bold">{error}</p>}
                  <button className="w-full py-4 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors uppercase font-bold text-sm tracking-widest">
                     JOIN ROOM 
                  </button>
               </form>

               <button onClick={() => { playSound('/sounds/click.mp3'); navigate('/menu'); }} className="w-full py-4 opacity-50 hover:opacity-100 uppercase text-xs font-bold tracking-widest">BACK TO MENU</button>
           </main>
        </div>
     );
  }

  if (roomId && roomData) {
      const players = Object.entries(roomData.players || {});
      const isHost = roomData.host === user?.uid;
      
      let waitingText = 'WAITING FOR PLAYERS...';
      if (roomData.type === 'random') {
          if (roomData.locked) {
             const matchTime = tick || 0;
             waitingText = `LOCKED. MATCH STARTING IN ${matchTime}S`;
          } else if (roomData.targetStartTime) {
             waitingText = `COUNTDOWN: ${tick || 0}S`;
          } else {
             waitingText = 'SEARCHING FOR PLAYERS (MIN 2)...';
          }
      } else {
         waitingText = isHost ? 'READY TO START' : 'WAITING FOR HOST TO START...';
      }

      return (
         <div className="flex flex-col md:grid md:grid-cols-12 md:gap-0 h-full w-full font-mono bg-[#f0f0f0] dark:bg-[#202124]">
             <main className="md:col-span-8 lg:col-span-9 p-4 md:p-8 flex flex-col items-center justify-center relative">
               <div className="text-center space-y-8 w-full max-w-lg">
                 <div className="relative inline-block">
                    <div className={`w-32 h-32 border-4 ${roomData.locked ? 'border-t-red-500' : 'border-t-green-400'} border-gray-300 dark:border-gray-700 rounded-full animate-spin`}></div>
                    <div className={`absolute inset-0 flex items-center justify-center font-bold text-2xl ${roomData.locked ? 'animate-bounce text-red-500' : 'animate-pulse'}`}>
                      {tick !== null ? tick + 'S' : '...'}
                    </div>
                 </div>
                 
                 <div className="space-y-4">
                   <h1 className="text-3xl font-bold uppercase tracking-[0.2em]">{roomData.type === 'random' ? 'Random Match' : 'Custom Room'}</h1>
                   <p className={roomData.locked ? 'text-red-500 font-bold' : 'text-gray-500'}>{waitingText}</p>
                 </div>

                 <div className="flex space-x-2 justify-center">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <div key={i} className={`w-8 h-2 ${i < players.length ? (roomData.locked ? 'bg-red-500' : 'bg-green-500') : 'bg-gray-300 dark:bg-gray-700'}`}></div>
                    ))}
                 </div>
                 <p className="text-xs text-gray-500 italic uppercase tracking-wider">{players.length}/7 Players Joined</p>
                 
               </div>
             </main>

             <aside className="md:col-span-4 lg:col-span-3 border-l border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1c1d21] p-6 flex flex-col h-full">
               <div className="mb-4 flex flex-col items-end">
                 <h2 className="text-xs uppercase text-gray-500 font-bold tracking-widest shrink-0 self-start mb-2">ROOM: {roomId}</h2>
                 
                 <button onClick={() => {
                     playSound('/sounds/click.mp3');
                     socket.emit('leaveRoom');
                     navigate('/menu');
                 }} className="flex items-center gap-2 hover:text-red-500 text-[10px] font-bold uppercase text-red-400 transition-colors">
                    Leave Room
                 </button>
                 
               </div>
               
               {roomData.type === 'custom' && (
                  <button onClick={handleCopyLink} className="w-full mb-6 py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-800 dark:text-blue-100 uppercase text-xs font-bold transition-colors">
                     Copy Join Link
                  </button>
               )}

               <div className="flex-1 flex flex-col min-h-0">
                 <h2 className="text-[10px] uppercase text-gray-500 font-bold mb-4 tracking-widest">Players Roster</h2>
                 <div className="flex-1 overflow-y-auto space-y-2">
                     {players.map(([uid, p]: [string, any], idx) => (
                         <div key={uid} className="flex items-center justify-between text-xs p-3 bg-gray-50 dark:bg-[#282a2e]">
                             <div className="flex items-center gap-2 overflow-hidden">
                               <span className="opacity-50">0{idx+1}.</span>
                               <span className="font-bold truncate" title={p.name}>{p.name || 'Player'} {uid === user?.uid ? '(YOU)' : ''}</span>
                               {roomData.type === 'custom' && roomData.host === uid && <span className="text-[9px] bg-yellow-500 text-black px-1 font-bold">HOST</span>}
                             </div>
                             {roomData.type === 'custom' && isHost && uid !== user?.uid && !roomData.locked && (
                                 <button onClick={() => kickPlayer(uid)} className="text-[10px] text-red-500 hover:text-red-400 uppercase font-bold shrink-0 ml-2">Kick</button>
                             )}
                         </div>
                     ))}
                 </div>
               </div>

               {isHost && roomData.type === 'custom' && (
                   <div className="mt-6 pt-6 border-t border-gray-300 dark:border-gray-700">
                     <button onClick={startGame} disabled={players.length < 2 || roomData.locked} className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:opacity-50 text-white transition-colors font-bold uppercase text-xs tracking-widest">
                         START GAME
                     </button>
                     {players.length < 2 && <p className="text-center mt-2 text-[10px] text-gray-500 uppercase">Need min 2 players</p>}
                   </div>
               )}
             </aside>
         </div>
      );
  }

  return null;
}
