import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: '*' }
  });

  const PORT = 3000;

  // Keep track of rooms and game states
  interface Player {
    uid: string;
    name: string;
    y: number;
    vy: number;
    isJumping: boolean;
    isDucking: boolean;
    isDead: boolean;
    score: number;
  }

  interface Obstacle {
    id: number;
    type: string;
    x: number;
    y: number;
    width: number;
    size: number;
    speedOffset: number;
    passed: boolean;
  }

  interface GameState {
    roomId: string;
    type: 'random' | 'custom' | 'solo';
    status: 'waiting' | 'playing' | 'gameover';
    locked: boolean;
    host?: string;
    targetStartTime?: number;
    speed: number;
    players: Record<string, Player>;
    obstacles: Obstacle[];
    distance: number;
    frameCount: number;
  }

  const rooms: Record<string, GameState> = {};
  const DEFAULT_SPEED = 6;
  const GRAVITY = 0.6;
  const INITIAL_JUMP_VELOCITY = -10;
  const SPEED_DROP_COEFFICIENT = 3; 
  const GROUND_Y = 150 - 47 - 10; 

  const obstacleTypes = [
    { type: 'CACTUS_SMALL', width: 17, height: 35, yPos: 105, minGap: 120, minSpeed: 0, maxMultiple: 3 },
    { type: 'CACTUS_LARGE', width: 25, height: 50, yPos: 90, minGap: 120, minSpeed: 0, maxMultiple: 3 },
    { type: 'PTERODACTYL', width: 46, height: 40, yPos: [100, 75, 50], minGap: 150, minSpeed: 8.5, maxMultiple: 1 }
  ];

  let nextObstacleId = 1;

  // Game Loop interval
  setInterval(() => {
    const now = Date.now();
    for (const roomId in rooms) {
      const state = rooms[roomId];

      // Matchmaking timer logic for random rooms
      if (state.type === 'random' && state.status === 'waiting') {
         const pCount = Object.keys(state.players).length;
         if (pCount >= 7) {
            state.status = 'playing';
            state.locked = true;
            io.to(roomId).emit('roomUpdate', state);
         } else if (pCount >= 2 && !state.targetStartTime) {
            state.targetStartTime = now + 10000;
            io.to(roomId).emit('roomUpdate', state);
         } else if (state.targetStartTime) {
            const rem = state.targetStartTime - now;
            if (rem <= 0) {
              state.status = 'playing';
              state.locked = true;
              io.to(roomId).emit('roomUpdate', state);
            } else if (rem <= 5000 && !state.locked) {
              state.locked = true;
              io.to(roomId).emit('roomUpdate', state);
            } else {
              io.to(roomId).emit('tick', rem);
            }
         }
      }

      if (state.status !== 'playing') continue;

      state.frameCount++;
      const speed = state.speed;
      state.distance += speed * (60 / 1000) * 16; 

      if (state.speed < 13) {
        state.speed += 0.001;
      }

      // Update Obstacles
      for (let i = state.obstacles.length - 1; i >= 0; i--) {
        const obs = state.obstacles[i];
        obs.x -= Math.floor((speed + obs.speedOffset) * (60 / 1000) * 16 * 1.5);
        if (obs.x + obs.width * obs.size < -50) {
          state.obstacles.splice(i, 1);
        }
      }

      // Spawn Obstacles
      if (state.obstacles.length === 0 || (state.obstacles.length > 0 && 
          600 - (state.obstacles[state.obstacles.length - 1].x + state.obstacles[state.obstacles.length - 1].width * state.obstacles[state.obstacles.length - 1].size) > 150 + (13 - Math.min(speed, 12)) * 30 + Math.random() * 200)) {
        
        const available = obstacleTypes.filter(o => speed >= o.minSpeed);
        if (available.length > 0) {
          const t = available[Math.floor(Math.random() * available.length)];
          const size = t.type === 'PTERODACTYL' ? 1 : Math.floor(Math.random() * t.maxMultiple) + 1;
          const y = Array.isArray(t.yPos) ? t.yPos[Math.floor(Math.random() * t.yPos.length)] : t.yPos;
          
          state.obstacles.push({
            id: nextObstacleId++,
            type: t.type,
            x: 600 + Math.random() * 50,
            y,
            width: t.width,
            size,
            speedOffset: t.type === 'PTERODACTYL' ? 0.8 : 0,
            passed: false
          });
        }
      }

      let allDead = true;
      for (const uid in state.players) {
        const p = state.players[uid];
        if (p.isDead) continue;
        allDead = false;

        p.score = Math.floor(state.distance * 0.025);

        if (p.isJumping) {
          if (p.isDucking) {
             p.vy += GRAVITY * SPEED_DROP_COEFFICIENT;
          } else {
             p.vy += GRAVITY;
          }
          p.y += p.vy;

          if (p.y >= GROUND_Y) {
            p.y = GROUND_Y;
            p.isJumping = false;
            p.vy = 0;
          }
        } else if (p.y < GROUND_Y && !p.isJumping) {
            // fallback gravity
            p.vy += GRAVITY;
            p.y += p.vy;
            if (p.y >= GROUND_Y) {
               p.y = GROUND_Y;
               p.vy = 0;
            }
        } else {
            p.y = p.isDucking ? 150 - 25 - 10 : GROUND_Y;
        }

        const pWidth = p.isDucking ? 59 : 44;
        const pHeight = p.isDucking ? 25 : 47;
        const hitboxShrink = 8;
        
        for (const obs of state.obstacles) {
           const oWidth = obs.width * obs.size;
           const oHeight = obs.type === 'PTERODACTYL' ? 40 : (obs.type === 'CACTUS_SMALL' ? 35 : 50);
           
           if (50 + pWidth - hitboxShrink > obs.x && 
               50 + hitboxShrink < obs.x + oWidth &&
               p.y + pHeight - hitboxShrink > obs.y && 
               p.y + hitboxShrink < obs.y + oHeight) {
                 p.isDead = true;
                 io.to(roomId).emit('playerDied', { uid, score: p.score });
           }
        }
      }

      if (allDead && Object.keys(state.players).length > 0) {
        state.status = 'gameover';
      }

      io.to(roomId).emit('gameState', state);
    }
  }, 16);

  io.on('connection', (socket) => {
    let currentRoom: string | null = null;
    let userId: string | null = null;

    socket.on('findRandom', ({ uid, name }) => {
      userId = uid;
      let found = null;
      for (const rid in rooms) {
         if (rooms[rid].type === 'random' && rooms[rid].status === 'waiting' && !rooms[rid].locked && Object.keys(rooms[rid].players).length < 7) {
             found = rid; break;
         }
      }
      if (!found) {
         found = Math.random().toString(36).substring(2, 8).toUpperCase();
         rooms[found] = { roomId: found, type: 'random', status: 'waiting', locked: false, speed: DEFAULT_SPEED, players: {}, obstacles: [], distance: 0, frameCount: 0 };
      }
      currentRoom = found;
      socket.join(found);
      rooms[found].players[uid] = { uid, name, y: GROUND_Y, vy: 0, isJumping: false, isDucking: false, isDead: false, score: 0 };
      io.to(found).emit('roomUpdate', rooms[found]);
      socket.emit('joined', found);
    });

    socket.on('createCustom', ({ uid, name }) => {
       userId = uid;
       const found = Math.random().toString(36).substring(2, 8).toUpperCase();
       rooms[found] = { roomId: found, type: 'custom', status: 'waiting', locked: false, host: uid, speed: DEFAULT_SPEED, players: {}, obstacles: [], distance: 0, frameCount: 0 };
       currentRoom = found;
       socket.join(found);
       rooms[found].players[uid] = { uid, name, y: GROUND_Y, vy: 0, isJumping: false, isDucking: false, isDead: false, score: 0 };
       io.to(found).emit('roomUpdate', rooms[found]);
       socket.emit('joined', found);
    });

    socket.on('joinCustom', ({ uid, name, code }) => {
       userId = uid;
       const room = rooms[code];
       if (!room) {
          socket.emit('errorMsg', 'Room not found'); return;
       }
       if (room.status !== 'waiting' || room.locked) {
          socket.emit('errorMsg', 'Game started or matched locked!'); return;
       }
       currentRoom = code;
       socket.join(code);
       room.players[uid] = { uid, name, y: GROUND_Y, vy: 0, isJumping: false, isDucking: false, isDead: false, score: 0 };
       io.to(code).emit('roomUpdate', room);
       socket.emit('joined', code);
    });
    
    socket.on('joinSolo', ({ uid, name }) => {
       userId = uid;
       const found = Math.random().toString(36).substring(2, 8).toUpperCase();
       rooms[found] = { roomId: found, type: 'solo', status: 'playing', locked: true, speed: DEFAULT_SPEED, players: {}, obstacles: [], distance: 0, frameCount: 0 };
       currentRoom = found;
       socket.join(found);
       rooms[found].players[uid] = { uid, name, y: GROUND_Y, vy: 0, isJumping: false, isDucking: false, isDead: false, score: 0 };
       socket.emit('joined', found);
    });

    socket.on('reconnectGame', ({ uid, roomId }) => {
        userId = uid;
        currentRoom = roomId;
        socket.join(roomId);
    });

    socket.on('startGame', (roomId) => {
      const room = rooms[roomId];
      if (room && room.type === 'custom' && room.host === userId) {
        room.status = 'playing';
        room.locked = true;
        room.speed = DEFAULT_SPEED;
        room.distance = 0;
        room.obstacles = [];
        for (const uid in room.players) {
          room.players[uid].isDead = false;
          room.players[uid].y = GROUND_Y;
          room.players[uid].vy = 0;
          room.players[uid].isJumping = false;
          room.players[uid].score = 0;
        }
        io.to(roomId).emit('roomUpdate', room);
      }
    });

    socket.on('leaveRoom', () => {
        if (currentRoom && userId && rooms[currentRoom]) {
            delete rooms[currentRoom].players[userId];
            if (Object.keys(rooms[currentRoom].players).length === 0) {
               delete rooms[currentRoom];
            } else {
               io.to(currentRoom).emit('roomUpdate', rooms[currentRoom]);
            }
        }
        currentRoom = null;
    });

    socket.on('kick', (uidToKick) => {
        if (currentRoom && userId && rooms[currentRoom] && rooms[currentRoom].host === userId) {
            delete rooms[currentRoom].players[uidToKick];
            io.to(currentRoom).emit('kicked', uidToKick);
            io.to(currentRoom).emit('roomUpdate', rooms[currentRoom]);
        }
    });

    socket.on('jump', () => {
      const room = rooms[currentRoom!];
      if (room && room.status === 'playing') {
        const p = room.players[userId!];
        // Allow jumping slightly after grounded if we want to be lenient, but here strictly check if not jumping
        if (p && !p.isDead && !p.isJumping && !p.isDucking) {
          p.isJumping = true;
          p.vy = INITIAL_JUMP_VELOCITY;
        }
      }
    });

    socket.on('duck', (isDucking) => {
      const room = rooms[currentRoom!];
      if (room && room.status === 'playing') {
        const p = room.players[userId!];
        if (p && !p.isDead) {
          p.isDucking = isDucking;
        }
      }
    });

    socket.on('disconnect', () => {
       if (currentRoom && userId && rooms[currentRoom]) {
            delete rooms[currentRoom].players[userId];
            if (Object.keys(rooms[currentRoom].players).length === 0) {
               delete rooms[currentRoom];
            } else {
               io.to(currentRoom).emit('roomUpdate', rooms[currentRoom]);
            }
        }
    });
  });

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
