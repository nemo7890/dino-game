import { OFFLINE_RESOURCES_1X, SPRITE_DEF, TREX_CONFIG, OBSTACLE_TYPES } from './constants';

export class DinoEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width = 800;
  height = 250;
  groundY = 150;
  
  dinoImg: HTMLImageElement;
  gameState: any = null;
  animationId?: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.dinoImg = new Image();
    this.dinoImg.src = OFFLINE_RESOURCES_1X;
  }

  updateState(state: any) {
     this.gameState = state;
  }

  start() {
    this.loop();
  }

  stop() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
  }

  private loop = () => {
    this.draw();
    this.animationId = requestAnimationFrame(this.loop);
  }

  private draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    const isDark = document.documentElement.classList.contains('dark');
    this.ctx.fillStyle = isDark ? '#ffffff' : '#535353';
    
    // Draw ground
    this.ctx.fillRect(0, this.groundY, 1500, 2);

    if (!this.gameState || !this.dinoImg.complete) return;

    // Draw Obstacles
    this.gameState.obstacles.forEach((obs: any) => {
       const type = OBSTACLE_TYPES.find(t => t.type === obs.type);
       if (!type) {
           this.ctx.fillRect(obs.x, obs.y, obs.width * obs.size, obs.height || 50);
           return;
       }
       if (obs.type === 'PTERODACTYL') {
           const frameOffset = Math.floor(Date.now() / type.frameRate) % 2 === 0 ? 0 : 46;
           this.ctx.drawImage(this.dinoImg, SPRITE_DEF.PTERODACTYL.x + frameOffset, SPRITE_DEF.PTERODACTYL.y, 46, 40, obs.x, obs.y, 46, 40);
       } else {
           const sprite = obs.type === 'CACTUS_SMALL' ? SPRITE_DEF.CACTUS_SMALL : SPRITE_DEF.CACTUS_LARGE;
           const sW = obs.type === 'CACTUS_SMALL' ? 17 : 25;
           const sH = obs.type === 'CACTUS_SMALL' ? 35 : 50;
           for (let i=0; i<obs.size; i++) {
               this.ctx.drawImage(this.dinoImg, sprite.x, sprite.y, sW, sH, obs.x + i*sW, obs.y, sW, sH);
           }
       }
    });

    const localUid = typeof window !== 'undefined' ? (window as any)._uid : null;
    const players = Object.values(this.gameState.players) as any[];
    
    // Sort so local is drawn last
    players.sort((a,b) => (a.uid === localUid ? 1 : b.uid === localUid ? -1 : 0));

    players.forEach((p: any) => {
       if (p.isDead) return;
       const isLocal = p.uid === localUid;
       
       this.ctx.globalAlpha = isLocal ? 1.0 : 0.4;

       const w = p.isDucking ? TREX_CONFIG.WIDTH_DUCK : TREX_CONFIG.WIDTH;
       const h = p.isDucking ? TREX_CONFIG.HEIGHT_DUCK : TREX_CONFIG.HEIGHT;
       
       const trexFrames = [SPRITE_DEF.TREX.x + 88, SPRITE_DEF.TREX.x + 132];
       const duckFrames = [SPRITE_DEF.TREX.x + 264, SPRITE_DEF.TREX.x + 323];
       
       let sx = SPRITE_DEF.TREX.x;
       // Run animation
       if (p.y >= this.groundY - h + 5) { 
           const frameOffset = Math.floor(Date.now() / 100) % 2;
           sx = p.isDucking ? duckFrames[frameOffset] : trexFrames[frameOffset];
       }

       this.ctx.drawImage(this.dinoImg, sx, SPRITE_DEF.TREX.y, w, h, isLocal ? 50 : 50 + (parseInt(p.uid, 36)%20 - 10), p.y, w, h);
       
       if (!isLocal) {
           this.ctx.font = '10px "VT323", monospace';
           this.ctx.textAlign = 'center';
           this.ctx.fillText(p.name.substring(0,6), 50 + w/2, p.y - 5);
       }
       
       this.ctx.globalAlpha = 1.0;
    });

    // Score
    this.ctx.font = '24px "VT323", monospace';
    this.ctx.textAlign = 'right';
    const s = Math.floor(this.gameState.distance * 0.025).toString().padStart(5, '0');
    this.ctx.fillText(s, this.width - 20, 30);
  }
}
