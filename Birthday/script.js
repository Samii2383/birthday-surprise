// Scene Controller
class SceneController {
    constructor() {
        this.currentScene = 1;
        this.scenes = document.querySelectorAll('.scene');
        this.music = document.getElementById('backgroundMusic');
        this.init();
    }

    init() {
        this.showScene(1);
    }

    showScene(num) {
        this.scenes.forEach((scene, index) => {
            if (index + 1 === num) {
                scene.classList.add('active');
            } else {
                scene.classList.remove('active');
            }
        });
        this.currentScene = num;
    }

    nextScene() {
        if (this.currentScene < this.scenes.length) {
            this.showScene(this.currentScene + 1);
        }
    }
}

// Fireworks System - Realistic Rocket Firecrackers
class Fireworks {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.rockets = [];
        this.animationId = null;
        this.startTime = null;
        this.duration = Infinity; // Continue until button is clicked
        this.shouldStop = false;
        this.isActive = false;
        this.explosionHeight = 0;
        this.lastLaunchTime = 0;
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.updateExplosionHeight();
    }

    updateExplosionHeight() {
        const textElement = document.querySelector('.birthday-text');
        if (textElement) {
            const rect = textElement.getBoundingClientRect();
            const canvasRect = this.canvas.getBoundingClientRect();
            // Convert viewport coordinates to canvas coordinates
            // Account for canvas scaling if any
            const scaleX = this.canvas.width / canvasRect.width;
            const scaleY = this.canvas.height / canvasRect.height;
            // Explode slightly above the text (30px above for better visibility)
            const relativeY = (rect.top - canvasRect.top) * scaleY;
            this.explosionHeight = relativeY - 30;
            // Ensure explosion height is within canvas bounds and reasonable
            if (this.explosionHeight < 100 || this.explosionHeight > this.canvas.height - 100) {
                this.explosionHeight = this.canvas.height * 0.35;
            }
        } else {
            // Fallback to center if text not found
            this.explosionHeight = this.canvas.height * 0.35;
        }
    }

    start() {
        this.isActive = true;
        this.shouldStop = false;
        this.startTime = Date.now();
        this.lastLaunchTime = Date.now();
        this.rockets = [];
        this.particles = [];
        this.updateExplosionHeight();
        this.animate();
    }

    stop() {
        this.shouldStop = true;
        // Don't stop immediately - allow existing explosions to finish
    }

    createRocket() {
        const brightColors = [
            '#FFD700', // Gold
            '#FF69B4', // Pink
            '#00BFFF', // Blue
            '#00FF00', // Green
            '#FF4500', // Orange
            '#FF1493', // Deep Pink
            '#1E90FF', // Dodger Blue
            '#32CD32'  // Lime Green
        ];
        
        return {
            x: Math.random() * this.canvas.width,
            y: this.canvas.height + 10, // Start slightly below canvas
            vx: (Math.random() - 0.5) * 1.5, // Slight horizontal drift
            vy: -6 - Math.random() * 2, // Stronger upward velocity (no gravity during launch)
            color: brightColors[Math.floor(Math.random() * brightColors.length)],
            trail: [], // Store trail points for glowing effect
            smokeTrail: [], // Smoke particles for realistic effect
            hasExploded: false,
            phase: 'launch', // Two phases: 'launch' and 'explode'
            state: 'launch', // Explicit state flag: 'launch' | 'explode'
            explosionTime: null // Track when explosion started
        };
    }

    explode(rocket) {
        // Prevent double explosion
        if (rocket.hasExploded) return;
        
        // Set state immediately to prevent double calls
        rocket.hasExploded = true;
        rocket.phase = 'explode';
        rocket.state = 'explode';
        rocket.explosionTime = Date.now(); // Track explosion start time

        const particleCount = 50 + Math.floor(Math.random() * 30); // 50-80 particles per blast
        const brightColors = ['#FFD700', '#FF69B4', '#00BFFF', '#00FF00', '#FF4500', '#FF1493', '#1E90FF', '#32CD32', '#FF00FF', '#00FFFF'];
        
        // Circular radial burst - REALISTIC EXPLOSION
        // Create multiple layers of particles for realistic effect
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.6; // Wider spread
            const speed = 5 + Math.random() * 6; // Faster particles for visible blast
            const color = brightColors[Math.floor(Math.random() * brightColors.length)];
            
            // Calculate life to last 600-900ms (at ~60fps, that's 36-54 frames)
            // But we'll use longer life for smoother fade
            const lifeFrames = 60 + Math.floor(Math.random() * 30); // 60-90 frames = 1000-1500ms at 60fps
            
            this.particles.push({
                x: rocket.x,
                y: rocket.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                life: lifeFrames,
                maxLife: lifeFrames,
                size: 3 + Math.random() * 4, // Varied particle sizes
                decay: 0.97, // Slower decay for longer visibility
                alpha: 1.0,
                gravity: 0.12 // Gravity effect for realistic fall
            });
        }
        
        // Add bright flash at explosion center
        this.particles.push({
            x: rocket.x,
            y: rocket.y,
            vx: 0,
            vy: 0,
            color: '#FFFFFF',
            life: 10,
            maxLife: 10,
            size: 15,
            decay: 0.9,
            alpha: 1.0,
            gravity: 0,
            isFlash: true
        });
    }

    drawRocket(rocket) {
        // Draw smoke trail (realistic effect)
        if (rocket.trail.length > 1) {
            // Draw smoke particles
            for (let i = 0; i < rocket.trail.length; i++) {
                const point = rocket.trail[i];
                const age = i / rocket.trail.length;
                this.ctx.globalAlpha = 0.3 * (1 - age);
                this.ctx.fillStyle = 'rgba(150, 150, 150, 0.5)';
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, 2 + age * 3, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        
        // Draw glowing trail
        if (rocket.trail.length > 1) {
            this.ctx.strokeStyle = rocket.color;
            this.ctx.lineWidth = 2;
            this.ctx.globalAlpha = 0.7;
            this.ctx.beginPath();
            this.ctx.moveTo(rocket.trail[0].x, rocket.trail[0].y);
            for (let i = 1; i < rocket.trail.length; i++) {
                this.ctx.lineTo(rocket.trail[i].x, rocket.trail[i].y);
            }
            this.ctx.stroke();
            
            // Draw brighter trail segments
            this.ctx.globalAlpha = 1;
            this.ctx.lineWidth = 3;
            if (rocket.trail.length >= 2) {
                const last = rocket.trail.length - 1;
                this.ctx.beginPath();
                this.ctx.moveTo(rocket.trail[last - 1].x, rocket.trail[last - 1].y);
                this.ctx.lineTo(rocket.trail[last].x, rocket.trail[last].y);
                this.ctx.stroke();
            }
        }
        
        // Draw rocket body with glow
        this.ctx.globalAlpha = 1;
        const gradient = this.ctx.createRadialGradient(rocket.x, rocket.y, 0, rocket.x, rocket.y, 10);
        gradient.addColorStop(0, rocket.color);
        gradient.addColorStop(0.4, rocket.color + 'DD');
        gradient.addColorStop(0.7, rocket.color + 'AA');
        gradient.addColorStop(1, rocket.color + '00');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(rocket.x, rocket.y, 5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Bright center
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(rocket.x, rocket.y, 2, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawParticle(particle) {
        const alpha = particle.alpha !== undefined ? particle.alpha : (particle.life / particle.maxLife);
        const size = particle.size * alpha;
        
        // Special handling for flash effect
        if (particle.isFlash) {
            this.ctx.globalAlpha = alpha;
            const flashGradient = this.ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, size * 3
            );
            flashGradient.addColorStop(0, '#FFFFFF');
            flashGradient.addColorStop(0.3, '#FFFF00');
            flashGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            this.ctx.fillStyle = flashGradient;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, size * 3, 0, Math.PI * 2);
            this.ctx.fill();
            return;
        }
        
        // Create glow effect for spark particles
        const gradient = this.ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, size * 2.5
        );
        const alphaHex = Math.floor(alpha * 255).toString(16).padStart(2, '0');
        gradient.addColorStop(0, particle.color);
        gradient.addColorStop(0.4, particle.color + alphaHex);
        gradient.addColorStop(0.8, particle.color + Math.floor(alpha * 100).toString(16).padStart(2, '0'));
        gradient.addColorStop(1, particle.color + '00');
        
        this.ctx.globalAlpha = alpha;
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, size * 2.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Bright center
        this.ctx.globalAlpha = alpha * 0.9;
        this.ctx.fillStyle = particle.color;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, size * 0.6, 0, Math.PI * 2);
        this.ctx.fill();
    }

    animate() {
        if (!this.isActive) return;

        // Stop completely only if shouldStop is true AND no rockets/particles remain
        if (this.shouldStop && this.rockets.length === 0 && this.particles.length === 0) {
            this.isActive = false;
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
            }
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            return;
        }

        // Clear canvas with fade effect
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Launch new rockets at random intervals (continue until shouldStop is true)
        // INCREASED VOLUME: Launch more frequently and multiple rockets at once
        if (!this.shouldStop) {
            const timeSinceLastLaunch = Date.now() - this.lastLaunchTime;
            const launchInterval = 150 + Math.random() * 300; // Faster: Random between 150-450ms (was 300-1000ms)
            
            if (timeSinceLastLaunch > launchInterval) {
                // Launch 1-3 rockets at once for more volume
                const numRockets = 1 + Math.floor(Math.random() * 3);
                for (let j = 0; j < numRockets; j++) {
                    this.rockets.push(this.createRocket());
                }
                this.lastLaunchTime = Date.now();
            }
        }

        // Update explosion height continuously to handle text position changes
        // Update every frame to ensure accuracy
        this.updateExplosionHeight();

        // Update and draw rockets
        for (let i = this.rockets.length - 1; i >= 0; i--) {
            const rocket = this.rockets[i];
            
            // Skip rockets that have exploded (they're kept for timing but not drawn/updated)
            if (rocket.hasExploded) {
                continue;
            }
            
            // LAUNCH PHASE: Rocket moves upward
            if (rocket.state === 'launch' && rocket.phase === 'launch') {
                // Add current position to trail
                rocket.trail.push({ x: rocket.x, y: rocket.y });
                if (rocket.trail.length > 8) {
                    rocket.trail.shift(); // Keep trail length limited
                }
                
                // Update position (NO gravity during launch - rockets go UP)
                rocket.x += rocket.vx;
                rocket.y += rocket.vy;
                
                // SAFETY GUARD: Force explode if rocket goes too high
                if (rocket.y <= 50) {
                    // Force explosion
                    if (!rocket.hasExploded) {
                        this.explode(rocket);
                    }
                    // Keep rocket for explosion animation
                    continue;
                }
                
                // BLAST TRIGGER: Check if rocket reached explosion height (position-based)
                // Explode when rocket reaches slightly above the text
                if (rocket.y <= this.explosionHeight + 20) {
                    // EXPLODE - Don't remove rocket yet, let explosion complete
                    if (!rocket.hasExploded) {
                        this.explode(rocket);
                    }
                    // Keep rocket in array until explosion completes (600-900ms)
                    // Don't remove here - let it stay for explosion animation
                    continue;
                }
                
                // FAILSAFE: Force explode if rocket leaves canvas bounds
                if (rocket.x < -50 || rocket.x > this.canvas.width + 50 || rocket.y < -50 || rocket.vy >= 0) {
                    // Force explosion
                    if (!rocket.hasExploded) {
                        this.explode(rocket);
                    }
                    // Keep rocket for explosion animation
                    continue;
                }
                
                // ADDITIONAL FAILSAFE: If rocket has been traveling for too long, force explode
                if (!rocket.startTime) {
                    rocket.startTime = Date.now();
                }
                const travelTime = Date.now() - rocket.startTime;
                if (travelTime > 3000) { // 3 seconds max travel time
                    // Force explosion instead of vanishing
                    if (!rocket.hasExploded) {
                        this.explode(rocket);
                    }
                    continue;
                }
                
                // Draw rocket
                this.drawRocket(rocket);
            }
        }

        // Remove rockets that have completed their explosion (600-900ms after explosion)
        for (let i = this.rockets.length - 1; i >= 0; i--) {
            const rocket = this.rockets[i];
            if (rocket.hasExploded && rocket.explosionTime) {
                const explosionAge = Date.now() - rocket.explosionTime;
                // Remove rocket after explosion completes (750ms average)
                if (explosionAge > 750) {
                    this.rockets.splice(i, 1);
                }
            }
        }

        // Update and draw particles (EXPLOSION PHASE)
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Update position with realistic physics
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Apply gravity (only if not a flash particle)
            if (!particle.isFlash) {
                particle.vy += particle.gravity || 0.12; // Gravity effect
            }
            
            // Apply decay to velocity
            particle.vx *= particle.decay;
            particle.vy *= particle.decay;
            
            // Update life
            particle.life--;
            
            // Calculate alpha for fade-out
            particle.alpha = particle.life / particle.maxLife;
            
            // Cleanup: Remove particles after alpha <= 0 or life <= 0
            if (particle.life > 0 && particle.alpha > 0) {
                this.drawParticle(particle);
            } else {
                this.particles.splice(i, 1);
            }
        }

        this.ctx.globalAlpha = 1; // Reset alpha
        this.animationId = requestAnimationFrame(() => this.animate());
    }
}

// Confetti System
class Confetti {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.animationId = null;
        this.isActive = false;
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    start(duration = 3000) {
        this.isActive = true;
        this.particles = [];
        this.startTime = Date.now();
        this.duration = duration;
        this.createBurst();
        this.animate();
    }

    stop() {
        this.isActive = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        setTimeout(() => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }, 100);
    }

    createBurst() {
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff8800'];
        const leftX = this.canvas.width * 0.1;
        const rightX = this.canvas.width * 0.9;
        const y = this.canvas.height * 0.3;

        // Left burst - Increased intensity (~2x particles)
        for (let i = 0; i < 100; i++) {
            const angle = Math.PI * 0.5 + (Math.random() - 0.5) * Math.PI * 0.8; // Increased spread radius
            const speed = 4 + Math.random() * 7; // Stronger outward velocity
            this.particles.push({
                x: leftX,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: 4 + Math.random() * 6,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2,
                life: 80 + Math.random() * 50 // Longer lifetime before fade
            });
        }

        // Right burst - Increased intensity (~2x particles)
        for (let i = 0; i < 100; i++) {
            const angle = Math.PI * 0.5 + (Math.random() - 0.5) * Math.PI * 0.8; // Increased spread radius
            const speed = 4 + Math.random() * 7; // Stronger outward velocity
            this.particles.push({
                x: rightX,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: 4 + Math.random() * 6,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2,
                life: 80 + Math.random() * 50 // Longer lifetime before fade
            });
        }
    }

    animate() {
        if (!this.isActive) return;

        const elapsed = Date.now() - this.startTime;
        if (elapsed >= this.duration) {
            this.stop();
            return;
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.2; // gravity
            particle.vx *= 0.98;
            particle.rotation += particle.rotationSpeed;
            particle.life--;

            if (particle.life > 0 && particle.y < this.canvas.height) {
                const alpha = particle.life / 100;
                this.ctx.save();
                this.ctx.globalAlpha = alpha;
                this.ctx.fillStyle = particle.color;
                this.ctx.translate(particle.x, particle.y);
                this.ctx.rotate(particle.rotation);
                this.ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
                this.ctx.restore();
            } else {
                this.particles.splice(i, 1);
            }
        }

        this.animationId = requestAnimationFrame(() => this.animate());
    }
}

// Cake Cutting Interaction
class CakeCutting {
    constructor() {
        this.cutCakeBtn = document.getElementById('cutCakeBtn');
        this.cakeImg = document.getElementById('cakeImg');
        this.cakeCutImg = document.getElementById('cakeCutImg');
        this.cutTitle = document.getElementById('cutTitle');
        this.postCutText = document.getElementById('postCutText');
        this.nextBtn = document.getElementById('nextBtn1');
        this.confettiCanvas = document.getElementById('confettiCanvas1');
        
        this.hasCut = false;
        this.confetti = null;
        
        this.init();
    }

    init() {
        // Setup button click handler
        this.cutCakeBtn.addEventListener('click', () => {
            this.performCut();
        });
    }

    performCut() {
        if (this.hasCut) return;
        this.hasCut = true;

        // Hide elements
        this.cakeImg.classList.add('hide');
        this.cutCakeBtn.style.display = 'none';
        this.cutTitle.style.display = 'none';

        // Show cut cake
        this.cakeCutImg.classList.add('show');

        // Show post-cut text
        setTimeout(() => {
            this.postCutText.classList.add('show');
            
            // Start confetti
            this.confetti = new Confetti(this.confettiCanvas);
            this.confetti.start(3000);
            
            // Show next button after confetti
            setTimeout(() => {
                this.nextBtn.classList.add('visible');
            }, 3000);
        }, 100);
    }
}

// Main Application
class BirthdayApp {
    constructor() {
        this.sceneController = new SceneController();
        this.fireworks = null;
        this.confetti1 = null;
        this.confetti2 = null;
        this.cakeCutting = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Scene 1: Open button
        document.getElementById('openBtn').addEventListener('click', () => {
            this.music = document.getElementById('backgroundMusic');
            this.music.play().catch(e => console.log('Audio play failed:', e));
            this.sceneController.nextScene();
            this.initScene2();
        });

        // Scene 2: Celebrate button
        document.getElementById('celebrateBtn').addEventListener('click', () => {
            if (this.fireworks) {
                this.fireworks.stop();
            }
            this.sceneController.nextScene();
            // Small delay to ensure scene transition completes
            setTimeout(() => {
                this.initScene3();
            }, 100);
        });

        // Scene 3: Next button
        document.getElementById('nextBtn1').addEventListener('click', () => {
            this.sceneController.nextScene();
            this.initScene4();
        });

        // Scene 4: Open gift button
        document.getElementById('openGiftBtn').addEventListener('click', () => {
            this.openGift();
        });

        // Scene 4: Accept button
        document.getElementById('acceptBtn').addEventListener('click', () => {
            this.sceneController.nextScene();
            this.initScene5();
        });

        // Scene 5: Thank you button
        document.getElementById('thankYouBtn').addEventListener('click', () => {
            // Stop background music
            if (this.music) {
                this.music.pause();
                this.music.currentTime = 0;
            }
            this.showEndMessage();
        });
    }

    initScene2() {
        const canvas = document.getElementById('fireworksCanvas');
        this.fireworks = new Fireworks(canvas);
        this.fireworks.start();

        // Show button immediately (fireworks continue until clicked)
        setTimeout(() => {
            document.getElementById('celebrateBtn').classList.add('visible');
        }, 1000);
    }

    initScene3() {
        // Initialize cake cutting
        try {
            this.cakeCutting = new CakeCutting();
        } catch (error) {
            console.error('Error initializing cake cutting:', error);
        }
    }

    initScene4() {
        // Show open button after 5 seconds
        setTimeout(() => {
            document.getElementById('openGiftBtn').classList.add('visible');
        }, 5000);
    }

    openGift() {
        // Hide elements
        document.getElementById('giftTitle').classList.add('hide');
        document.getElementById('giftImg').classList.add('hide');
        document.getElementById('openGiftBtn').classList.remove('visible');

        // Show opened gift
        document.getElementById('giftOpenImg').classList.add('show');

        // Show accept text
        setTimeout(() => {
            document.getElementById('giftAcceptText').classList.add('show');
            
            // Start confetti
            const canvas = document.getElementById('confettiCanvas2');
            this.confetti2 = new Confetti(canvas);
            this.confetti2.start(2000);
            
            // Show accept button after confetti
            setTimeout(() => {
                document.getElementById('acceptBtn').classList.add('visible');
            }, 2000);
        }, 100);
    }

    initScene5() {
        // Show thank you button after text is visible (short delay for smooth appearance)
        setTimeout(() => {
            document.getElementById('thankYouBtn').classList.add('visible');
        }, 500);
    }

    showEndMessage() {
        // Fade out scene
        const scene5 = document.querySelector('.scene-5');
        scene5.style.opacity = '0';
        
        setTimeout(() => {
            // Show end message
            document.getElementById('endMessage').classList.add('show');
        }, 800);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new BirthdayApp();
});

