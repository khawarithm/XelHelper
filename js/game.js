/**
 * ============================================================================
 * OPERATION: SURVIVOR APOCALYPS
 * FILE: js/game.js
 * DESC: Core Battle Engine, DOM Object Rendering, Collision & Wave Management
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    if (!window.GameData) {
        console.error("[SYSTEM] GameData Offline. Kembali ke markas.");
        window.location.href = 'index.html';
        return;
    }

    const gd = window.GameData;
    const player = gd.data;

    /* ==========================================================================
       TACTICAL VARIABLES & GAME STATE
       ========================================================================== */
    let isGameOver = false;
    let isPaused = false;
    
    // Session Stats
    let currentWave = 1;
    let sessionCoins = 0;
    let sessionXP = 0;
    let sessionKills = 0;

    // Player Combat Stats
    let armyCount = 3 + player.upgrades.army;
    let baseDamage = 2 + player.upgrades.weapon;
    let maxBaseHp = 500 + (player.upgrades.base * 250);
    let currentBaseHp = maxBaseHp;
    let fireRate = (armyCount % 25 === 0 && armyCount > 0) ? 350 : 500;
    let dropChanceBonus = player.upgrades.dropChance * 1; // +1% per level

    // Skill Modifiers (One-time use applied at start of match)
    if (player.skills.airplane) {
        armyCount *= 2;
        console.log("[TACTICAL] AIRPLANE BACKUP AKTIF: Pasukan x2!");
    }
    if (player.skills.armoredArmy) {
        baseDamage *= 3.5;
        maxBaseHp *= 2;
        currentBaseHp = maxBaseHp;
        console.log("[TACTICAL] ARMORED ARMY AKTIF: HP & DMG Boosted!");
    }

    // Engine Arrays & Timers
    const zombies = [];
    const bullets = [];
    let lastFireTime = 0;
    let zombieSpawnTimer = null;
    let zombiesToSpawn = 0;
    let activeZombies = 0;

    // DOM Elements
    const laneArmy = document.getElementById('army-spawn-lane');
    const laneZombie = document.getElementById('zombie-spawn-lane');
    const hpFill = document.getElementById('hp-bar-fill');
    const hpText = document.getElementById('hp-text');
    const waveDisplay = document.getElementById('current-wave-display');
    const coinDisplay = document.getElementById('match-coin');
    const killDisplay = document.getElementById('match-kills');
    const arena = document.getElementById('battlefield');

    // Arena Dimensions untuk kalkulasi virtual
    const ARENA_WIDTH = arena.clientWidth;
    const BASE_LINE = ARENA_WIDTH * 0.15; // 15% dari kiri adalah zona base

    /* ==========================================================================
       INITIALIZATION & SPAWNING
       ========================================================================== */
    function initBattle() {
        updateHUD();
        spawnArmyDOM();
        startWave(currentWave);
        requestAnimationFrame(gameLoop);
    }

    function spawnArmyDOM() {
        laneArmy.innerHTML = '';
        // Menyebar tentara secara vertikal di Defense Zone
        for (let i = 0; i < armyCount; i++) {
            const soldier = document.createElement('div');
            soldier.className = 'soldier-unit';
            // Variasi posisi Y (Top)
            const posY = 10 + Math.random() * 80; 
            soldier.style.top = `${posY}%`;
            soldier.style.left = `${Math.random() * 20}%`;
            
            // Cek Skin aktif
            if (player.skins.active !== 'unit.png') {
                soldier.style.backgroundImage = `url('assets/${player.skins.active}')`;
            }
            
            laneArmy.appendChild(soldier);
        }
    }

    /* ==========================================================================
       WAVE & ENEMY LOGIC
       ========================================================================== */
    function startWave(wave) {
        currentWave = wave;
        waveDisplay.textContent = currentWave;
        zombiesToSpawn = 5 + Math.floor(wave * 2);
        activeZombies = zombiesToSpawn;
        
        const isBossWave = (wave % 10 === 0);
        
        if (isBossWave) {
            triggerBossWarning();
            // Boss spawn telat sedikit untuk dramatisasi
            setTimeout(() => spawnZombie(true), 2000);
            zombiesToSpawn--; 
        }

        zombieSpawnTimer = setInterval(() => {
            if (isPaused || isGameOver) return;
            if (zombiesToSpawn > 0) {
                spawnZombie(false);
                zombiesToSpawn--;
            } else {
                clearInterval(zombieSpawnTimer);
            }
        }, Math.max(800 - (wave * 10), 300)); // Makin tinggi wave, spawn makin cepat
    }

    function spawnZombie(isBoss) {
        // Formula HP = 10 * (1.15 ^ Wave)
        let hp = 10 * Math.pow(1.15, currentWave);
        if (isBoss) hp *= 3;

        const zObj = {
            el: document.createElement('div'),
            x: ARENA_WIDTH, // Mulai dari ujung kanan
            y: 10 + Math.random() * 80, // % top
            hp: hp,
            maxHp: hp,
            isBoss: isBoss,
            speed: isBoss ? 0.3 : 0.5, // Kecepatan lambat statis
            lastAttackTime: 0,
            markedForDeath: false
        };

        zObj.el.className = 'zombie-unit' + (isBoss ? ' zombie-boss' : '');
        zObj.el.style.top = `${zObj.y}%`;
        zObj.el.style.transform = `translate3d(${zObj.x}px, 0, 0)`;
        
        laneZombie.appendChild(zObj.el);
        zombies.push(zObj);
    }

    function triggerBossWarning() {
        const warning = document.getElementById('boss-warning');
        warning.classList.remove('hidden');
        document.getElementById('game-container').classList.add('screen-shake');
        
        setTimeout(() => {
            warning.classList.add('hidden');
            document.getElementById('game-container').classList.remove('screen-shake');
        }, 3000);
    }

    /* ==========================================================================
       COMBAT MECHANICS (Shooting & Hits)
       ========================================================================== */
    function fireBullets(timestamp) {
        if (timestamp - lastFireTime >= fireRate) {
            // Tembak sejumlah tentara
            for (let i = 0; i < armyCount; i++) {
                const bObj = {
                    el: document.createElement('div'),
                    x: BASE_LINE,
                    y: 10 + Math.random() * 80,
                    speed: 10,
                    damage: baseDamage,
                    marked: false
                };
                
                bObj.el.className = 'bullet';
                bObj.el.style.top = `${bObj.y}%`;
                bObj.el.style.transform = `translate3d(${bObj.x}px, 0, 0)`;
                
                laneZombie.appendChild(bObj.el);
                bullets.push(bObj);
            }
            lastFireTime = timestamp;
        }
    }

    function processZombieDeath(z, index) {
        z.markedForDeath = true;
        z.el.remove();
        
        // Spawn Particle
        const particle = document.createElement('div');
        particle.className = 'particle-death';
        particle.style.left = `${z.x}px`;
        particle.style.top = `${z.y}%`;
        laneZombie.appendChild(particle);
        setTimeout(() => particle.remove(), 1000);

        // Rewards
        let mult = z.isBoss ? 5 : 1;
        sessionCoins += (currentWave * mult);
        sessionXP += (currentWave * mult);
        sessionKills++;
        if (z.isBoss) player.stats.totalBossKill++;
        
        updateHUD();
        rollDrops(mult);

        activeZombies--;
        zombies.splice(index, 1);

        // Check Wave Clear
        if (activeZombies <= 0 && zombiesToSpawn <= 0) {
            console.log(`[TACTICAL] Wave ${currentWave} Cleared!`);
            gd.saveLocal(); // Sesuai instruksi: Save per wave selesai
            setTimeout(() => startWave(currentWave + 1), 2000);
        }
    }

    function rollDrops(multiplier) {
        // Formula Drop + Base Upgrades
        const rolls = [
            { id: 'leather', chance: 50 + (0.5 * currentWave) + dropChanceBonus },
            { id: 'iron', chance: 25 + (0.25 * currentWave) + dropChanceBonus },
            { id: 'crystal', chance: 10 + (0.10 * currentWave) + dropChanceBonus },
            { id: 'nukeCore', chance: 3 + (0.5 * currentWave) + dropChanceBonus }
        ];

        rolls.forEach(item => {
            // Apply rarity multiplier for boss
            let finalChance = item.chance * multiplier;
            // Roll dadu 0-100
            for(let i=0; i<multiplier; i++) { // Boss drop chance x5 means rolling 5 times
                if (Math.random() * 100 <= finalChance) {
                    player.materials[item.id]++;
                }
            }
        });
    }

    function takeBaseDamage(amount) {
        currentBaseHp -= amount;
        if (currentBaseHp <= 0) {
            currentBaseHp = 0;
            triggerGameOver();
        }
        updateHUD();
        
        if (currentBaseHp < maxBaseHp * 0.3) {
            hpFill.classList.add('critical');
        }
    }

    /* ==========================================================================
       CORE ENGINE LOOP (Hardware Accelerated Rendering)
       ========================================================================== */
    function gameLoop(timestamp) {
        if (isGameOver || isPaused) return;

        fireBullets(timestamp);

        // Update Bullets
        for (let i = bullets.length - 1; i >= 0; i--) {
            let b = bullets[i];
            b.x += b.speed;
            b.el.style.transform = `translate3d(${b.x}px, 0, 0)`;

            // Out of bounds
            if (b.x > ARENA_WIDTH) {
                b.marked = true;
                b.el.remove();
                bullets.splice(i, 1);
                continue;
            }

            // Simple Collision AABB (Virtual x-axis overlap)
            for (let j = 0; j < zombies.length; j++) {
                let z = zombies[j];
                // Jika bullet melewati posisi x zombie (toleransi lebar div ~32px)
                if (!z.markedForDeath && b.x >= z.x && b.x <= z.x + 32) {
                    // Y-axis tolerance (Hitbox tinggi)
                    if (Math.abs(b.y - z.y) < 15) {
                        z.hp -= b.damage;
                        b.marked = true;
                        
                        // Hit effect
                        z.el.classList.add('zombie-hit');
                        setTimeout(() => { if(z.el) z.el.classList.remove('zombie-hit'); }, 100);

                        b.el.remove();
                        bullets.splice(i, 1);
                        
                        if (z.hp <= 0) {
                            processZombieDeath(z, j);
                        }
                        break; // Peluru hancur, berhenti cek zombie lain
                    }
                }
            }
        }

        // Update Zombies
        for (let j = zombies.length - 1; j >= 0; j--) {
            let z = zombies[j];
            
            if (z.x > BASE_LINE) {
                z.x -= z.speed;
                z.el.style.transform = `translate3d(${z.x}px, 0, 0)`;
            } else {
                // Reached Base, start attacking
                if (timestamp - z.lastAttackTime >= 1000) {
                    // Formula Dmg: 10 + (Wave * 1.5)
                    let dmg = Math.floor(10 + (currentWave * 1.5));
                    takeBaseDamage(dmg);
                    z.lastAttackTime = timestamp;
                    
                    document.getElementById('player-base').classList.add('zombie-hit');
                    setTimeout(() => document.getElementById('player-base').classList.remove('zombie-hit'), 200);
                }
            }
        }

        requestAnimationFrame(gameLoop);
    }

    /* ==========================================================================
       UI & SYSTEM MANAGEMENT
       ========================================================================== */
    function updateHUD() {
        hpText.textContent = `${Math.floor(currentBaseHp)} / ${maxBaseHp} HP`;
        const hpPercent = Math.max((currentBaseHp / maxBaseHp) * 100, 0);
        hpFill.style.width = `${hpPercent}%`;
        
        coinDisplay.textContent = sessionCoins;
        killDisplay.textContent = sessionKills;
    }

    async function triggerGameOver() {
        isGameOver = true;
        console.log("[SYSTEM] BASE DESTROYED. MISSION FAILED.");
        
        // Update Persistent Stats
        gd.addXP(sessionXP);
        player.coin += sessionCoins;
        player.stats.totalKill += sessionKills;
        if (currentWave > player.stats.highestWave) {
            player.stats.highestWave = currentWave;
        }

        // Sync Data Sesuai Aturan Wajib
        gd.saveLocal();
        
        // Render Game Over Screen
        document.getElementById('go-wave').textContent = currentWave;
        document.getElementById('go-coin').textContent = sessionCoins;
        document.getElementById('go-xp').textContent = sessionXP;
        document.getElementById('game-over-screen').classList.remove('hidden');

        // Cloud Save Asynchronous on Game Over
        await gd.saveCloud();
    }

    // Controls
    document.getElementById('btn-pause').addEventListener('click', () => {
        isPaused = true;
        document.getElementById('pause-menu').classList.remove('hidden');
    });

    document.getElementById('btn-resume').addEventListener('click', () => {
        isPaused = false;
        document.getElementById('pause-menu').classList.add('hidden');
        requestAnimationFrame(gameLoop);
    });

    document.getElementById('btn-quit-to-lobby').addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    document.getElementById('btn-go-lobby').addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    document.getElementById('btn-restart').addEventListener('click', () => {
        window.location.reload(); // Hard reset memori untuk fresh start
    });

    // Mulai Eksekusi
    initBattle();
});
