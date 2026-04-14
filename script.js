import { auth, db, googleProvider, signInWithPopup, signInAnonymously, ref, set, onValue, update, push, onDisconnect, remove } from './firebase-config.js';

// --- Global Variables ---
let currentUser = null;
let currentRoomId = null;
let gameState = 'LOBBY';
let players = {};
let obstacles = [];
let frameCount = 0;
let gameSpeed = 5;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 200;

// --- Authentication ---
document.getElementById('google-login-btn').onclick = () => signInWithPopup(auth, googleProvider);
document.getElementById('guest-login-btn').onclick = () => signInAnonymously(auth);

auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('menu-screen').classList.remove('hidden');
        document.getElementById('user-info').innerText = user.displayName || "Guest";
    }
});

// --- Matchmaking & Room Logic ---
document.getElementById('random-match-btn').onclick = findRandomMatch;
document.getElementById('invite-friends-btn').onclick = createPrivateRoom;

async function findRandomMatch() {
    showScreen('matchmaking-screen');
    const roomsRef = ref(db, 'rooms');
    onValue(roomsRef, (snapshot) => {
        const data = snapshot.val();
        let joined = false;
        if (data) {
            for (let id in data) {
                if (data[id].status === 'waiting' && Object.keys(data[id].players).length < 7) {
                    joinRoom(id);
                    joined = true;
                    break;
                }
            }
        }
        if (!joined && gameState === 'LOBBY') createPrivateRoom();
    }, { onlyOnce: true });
}

function createPrivateRoom() {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    joinRoom(roomId);
}

function joinRoom(roomId) {
    currentRoomId = roomId;
    const playerRef = ref(db, `rooms/${roomId}/players/${auth.currentUser.uid}`);
    
    set(playerRef, {
        name: auth.currentUser.displayName || "Guest " + auth.currentUser.uid.slice(0,4),
        y: 0,
        score: 0,
        alive: true
    });

    onDisconnect(playerRef).remove();
    showScreen('matchmaking-screen');
    listenToRoom(roomId);
}

function listenToRoom(roomId) {
    const roomRef = ref(db, `rooms/${roomId}`);
    onValue(roomRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        players = data.players || {};
        const playerIds = Object.keys(players);

        // Update Matchmaking UI
        document.getElementById('waiting-players').innerText = `Players: ${playerIds.length}/7`;

        if (data.status === 'playing' && gameState !== 'PLAYING') {
            startGame();
        }

        // Start game if min 2 players
        if (playerIds.length >= 2 && data.status === 'waiting') {
            update(ref(db, `rooms/${roomId}`), { status: 'playing', startTime: Date.now() });
        }
    });
}

// --- Game Logic ---
class Dino {
    constructor(id, isLocal) {
        this.id = id;
        this.isLocal = isLocal;
        this.y = 0;
        this.vy = 0;
        this.gravity = 0.6;
        this.jumpForce = -12;
        this.isGrounded = true;
    }

    update() {
        if (this.isLocal) {
            this.vy += this.gravity;
            this.y += this.vy;
            if (this.y > 0) {
                this.y = 0;
                this.vy = 0;
                this.isGrounded = true;
            }
            // Sync position to Firebase every few frames (Throttle)
            if (frameCount % 5 === 0) {
                update(ref(db, `rooms/${currentRoomId}/players/${auth.currentUser.uid}`), { y: this.y });
            }
        } else {
            // Interpolate remote dinos
            const targetY = players[this.id]?.y || 0;
            this.y += (targetY - this.y) * 0.2;
        }
    }

    jump() {
        if (this.isGrounded) {
            this.vy = this.jumpForce;
            this.isGrounded = false;
        }
    }

    draw() {
        ctx.globalAlpha = this.isLocal ? 1.0 : 0.5;
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--accent');
        ctx.fillRect(50, 150 + this.y, 40, 40); // Simple Dino Rect
        ctx.globalAlpha = 1.0;
    }
}

let localDino;

function startGame() {
    gameState = 'PLAYING';
    showScreen('game-screen');
    localDino = new Dino(auth.currentUser.uid, true);
    requestAnimationFrame(gameLoop);
}

function gameLoop() {
    if (gameState !== 'PLAYING') return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    frameCount++;
    gameSpeed += 0.001;

    // Local Logic
    localDino.update();
    localDino.draw();

    // Draw Remote Players
    Object.keys(players).forEach(id => {
        if (id !== auth.currentUser.uid) {
            const ghost = new Dino(id, false);
            ghost.draw();
        }
    });

    // Obstacle Logic (Deterministic based on frameCount)
    if (frameCount % 100 === 0) {
        obstacles.push({ x: 800, w: 20, h: 40 });
    }

    obstacles.forEach((obs, index) => {
        obs.x -= gameSpeed;
        ctx.fillStyle = '#ff4757';
        ctx.fillRect(obs.x, 160, obs.w, obs.h);

        // Collision detection
        if (obs.x < 90 && obs.x > 50 && localDino.y > -20) {
            endGame();
        }

        if (obs.x < -20) obstacles.splice(index, 1);
    });

    // UI Updates
    updateLeaderboard();
    
    requestAnimationFrame(gameLoop);
}

function updateLeaderboard() {
    const sorted = Object.values(players).sort((a, b) => b.score - a.score);
    const lb = document.getElementById('leaderboard');
    lb.innerHTML = sorted.map(p => `<div>${p.name}: ${Math.floor(frameCount/10)}</div>`).join('');
}

function endGame() {
    gameState = 'LOBBY';
    alert("Game Over! Score: " + Math.floor(frameCount/10));
    location.reload(); // Simple reset
}

// --- Inputs ---
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') localDino.jump();
});
canvas.addEventListener('touchstart', () => localDino.jump());

// --- UI Helpers ---
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

document.getElementById('theme-toggle').onclick = () => {
    document.body.classList.toggle('dark-mode');
};

document.getElementById('leave-game-btn').onclick = () => location.reload();

// Modals
document.getElementById('dev-btn').onclick = () => document.getElementById('dev-modal').classList.remove('hidden');
document.getElementById('donate-btn').onclick = () => document.getElementById('donate-modal').classList.remove('hidden');
document.querySelectorAll('.close-modal').forEach(b => b.onclick = () => {
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
});