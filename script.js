import { auth, db, googleProvider, signInWithPopup, signInAnonymously, ref, set, onValue, update, push, onDisconnect, remove } from './firebase-config.js';

// --- Configuration & State ---
let currentUser = null;
let currentRoomId = null;
let gameState = 'LOBBY';
let isSoloMode = false;
let roomListener = null;
let players = {};
let obstacles = [];
let frameCount = 0;
let gameSpeed = 5;
let guestName = "";

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 200;

// --- Auth Handling ---
document.getElementById('google-login-btn').onclick = () => signInWithPopup(auth, googleProvider);
document.getElementById('guest-login-btn').onclick = () => document.getElementById('guest-modal').classList.remove('hidden');

document.getElementById('confirm-guest-btn').onclick = () => {
    const val = document.getElementById('guest-name-input').value.trim();
    if (val) {
        guestName = val;
        document.getElementById('guest-modal').classList.add('hidden');
        signInAnonymously(auth);
    } else {
        alert("Please enter a name");
    }
};

auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        showScreen('menu-screen');
        document.getElementById('user-info').innerText = user.displayName || guestName || "Guest";
        
        // Handle direct links
        const urlParams = new URLSearchParams(window.location.search);
        const rId = urlParams.get('room');
        if (rId) joinRoom(rId);
    }
});

// --- Matchmaking & Room Logic ---
document.getElementById('solo-mode-btn').onclick = () => {
    isSoloMode = true;
    startGame();
};

document.getElementById('random-match-btn').onclick = () => {
    onValue(ref(db, 'rooms'), (snap) => {
        const rooms = snap.val();
        let foundId = null;
        if (rooms) {
            for (let id in rooms) {
                if (rooms[id].status === 'waiting' && Object.keys(rooms[id].players || {}).length < 7) {
                    foundId = id; break;
                }
            }
        }
        if (foundId) joinRoom(foundId);
        else createRoom(Math.random().toString(36).substring(2, 8).toUpperCase());
    }, { onlyOnce: true });
};

document.getElementById('room-system-btn').onclick = () => document.getElementById('room-controls').classList.toggle('hidden');
document.getElementById('create-room-btn').onclick = () => createRoom(Math.random().toString(36).substring(2, 8).toUpperCase());
document.getElementById('join-btn').onclick = () => {
    const code = document.getElementById('join-code-input').value.toUpperCase();
    if (code) joinRoom(code);
};

async function createRoom(roomId) {
    await set(ref(db, `rooms/${roomId}`), { status: 'waiting', createdAt: Date.now() });
    joinRoom(roomId);
}

async function joinRoom(roomId) {
    if (currentRoomId) await leaveRoom();
    currentRoomId = roomId;
    isSoloMode = false;
    
    const playerRef = ref(db, `rooms/${roomId}/players/${auth.currentUser.uid}`);
    await set(playerRef, {
        name: auth.currentUser.displayName || guestName || "Guest",
        y: 0, score: 0, alive: true
    });

    onDisconnect(playerRef).remove();
    showScreen('matchmaking-screen');
    document.getElementById('display-code').innerText = roomId;
    document.getElementById('room-info').classList.remove('hidden');
    listenToRoom(roomId);
}

function listenToRoom(roomId) {
    if (roomListener) roomListener(); // Clear old listener
    roomListener = onValue(ref(db, `rooms/${roomId}`), (snap) => {
        const data = snap.val();
        if (!data) return;

        players = data.players || {};
        const pIds = Object.keys(players);
        document.getElementById('waiting-players').innerText = `Players: ${pIds.length}/7`;

        // Start Logic (Host only)
        if (pIds.length >= 2 && data.status === 'waiting' && pIds[0] === auth.currentUser.uid) {
            update(ref(db, `rooms/${roomId}`), { status: 'playing', startTime: Date.now() });
        }

        if (data.status === 'playing' && gameState !== 'PLAYING') startGame();
    });
}

async function leaveRoom() {
    if (currentRoomId) {
        if (roomListener) roomListener();
        await remove(ref(db, `rooms/${currentRoomId}/players/${auth.currentUser.uid}`));
        currentRoomId = null;
        gameState = 'LOBBY';
        showScreen('menu-screen');
    }
}

document.getElementById('cancel-match-btn').onclick = leaveRoom;
document.getElementById('leave-game-btn').onclick = () => location.reload();

// --- Game Logic ---
class Dino {
    constructor(id, isLocal) {
        this.id = id; this.isLocal = isLocal;
        this.y = 0; this.vy = 0; this.gravity = 0.6; this.jumpForce = -12; this.isGrounded = true;
    }
    update() {
        if (this.isLocal) {
            this.vy += this.gravity; this.y += this.vy;
            if (this.y > 0) { this.y = 0; this.vy = 0; this.isGrounded = true; }
            if (!isSoloMode && currentRoomId && frameCount % 5 === 0) {
                update(ref(db, `rooms/${currentRoomId}/players/${auth.currentUser.uid}`), { 
                    y: this.y, 
                    score: Math.floor(frameCount/10) 
                });
            }
        } else {
            const targetY = players[this.id]?.y || 0;
            this.y += (targetY - this.y) * 0.2; // Interpolation
        }
    }
    jump() { if (this.isGrounded) { this.vy = this.jumpForce; this.isGrounded = false; } }
    draw() {
        ctx.globalAlpha = this.isLocal ? 1 : 0.4;
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--accent');
        ctx.fillRect(50, 150 + this.y, 40, 40);
        ctx.globalAlpha = 1;
    }
}

let localDino;
function startGame() {
    gameState = 'PLAYING';
    showScreen('game-screen');
    localDino = new Dino(auth.currentUser.uid, true);
    obstacles = []; frameCount = 0; gameSpeed = 5;
    requestAnimationFrame(gameLoop);
}

function gameLoop() {
    if (gameState !== 'PLAYING') return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    frameCount++; gameSpeed += 0.001;

    // Draw others
    if (!isSoloMode) {
        Object.keys(players).forEach(id => {
            if (id !== auth.currentUser.uid) {
                ctx.fillStyle = "#888";
                ctx.globalAlpha = 0.4;
                ctx.fillRect(50, 150 + (players[id].y || 0), 40, 40);
            }
        });
    }

    localDino.update(); localDino.draw();

    // Obstacles
    if (frameCount % 100 === 0) obstacles.push({ x: 800, w: 20, h: 40 });
    obstacles.forEach((obs, i) => {
        obs.x -= gameSpeed;
        ctx.fillStyle = '#ff4757';
        ctx.fillRect(obs.x, 160, obs.w, obs.h);
        if (obs.x < 90 && obs.x > 50 && localDino.y > -20) endGame();
        if (obs.x < -20) obstacles.splice(i, 1);
    });

    updateLeaderboard();
    requestAnimationFrame(gameLoop);
}

function updateLeaderboard() {
    const lb = document.getElementById('leaderboard');
    if (isSoloMode) {
        lb.innerText = `Score: ${Math.floor(frameCount/10)}`;
    } else {
        const sorted = Object.values(players).sort((a,b) => (b.score || 0) - (a.score || 0));
        lb.innerHTML = sorted.map(p => `<div>${p.name}: ${p.score || 0}</div>`).join('');
    }
}

function endGame() {
    gameState = 'GAMEOVER';
    alert("Game Over! Score: " + Math.floor(frameCount/10));
    location.reload();
}

// --- Interaction ---
window.addEventListener('keydown', e => { if(e.code==='Space' || e.code==='ArrowUp') localDino.jump() });
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); localDino.jump(); });

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

document.getElementById('theme-toggle').onclick = () => document.body.classList.toggle('dark-mode');
document.getElementById('copy-code').onclick = () => {
    navigator.clipboard.writeText(currentRoomId); alert("Code Copied!");
};
document.getElementById('copy-link').onclick = () => {
    const link = `${window.location.origin}${window.location.pathname}?room=${currentRoomId}`;
    navigator.clipboard.writeText(link); alert("Link Copied!");
};

// Modals
document.getElementById('dev-btn').onclick = () => document.getElementById('dev-modal').classList.remove('hidden');
document.getElementById('donate-btn').onclick = () => document.getElementById('donate-modal').classList.remove('hidden');
document.querySelectorAll('.close-modal').forEach(b => b.onclick = () => {
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
});
