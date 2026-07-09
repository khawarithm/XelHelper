/**
 * ============================================================================
 * OPERATION: SURVIVOR APOCALYPS
 * FILE: js/game.js
 * DESC: Battle Engine, Animasi DOM 60 FPS, System Pause Intercept & Custom Alert
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    if (!window.GameData) {
        window.location.href = 'index.html';
        return;
    }

    const gd = window.GameData;
    const player = gd.data;

    let isGameOver = false;
    let isPaused = false;
    
    let currentWave = 1;
    let sessionCoins = 0;
    let sessionXP = 0;
    let sessionKills = 0;

    let armyCount = 3 + player.upgrades.army;
    let baseDamage = 2 + player.upgrades.weapon;
    let maxBaseHp = 500 + (player.upgrades.base * 250);
    let currentBaseHp = maxBaseHp;
    let fireRate = (armyCount % 25 === 0 && armyCount > 0) ? 350 : 500;
    let dropChanceBonus = player.upgrades.dropChance * 1;

    if (player.skills.airplane) armyCount *= 2;
    if (player.skills.armoredArmy) {
        baseDamage *= 3.5;
        maxBaseHp *= 2;
        currentBaseHp = maxBaseHp;
    }

    const zombies = [];
    const bullets = [];
    let lastFireTime = 0;
    let zombieSpawnTimer = null;
    let zombiesToSpawn = 0;
    let activeZombies = 0;

    const laneArmy = document.getElementById('army-spawn-lane');
    const laneZombie = document.getElementById('zombie-spawn-lane');
    const hpFill = document.getElementById('hp-bar-fill');
    const hpText = document.getElementById('hp-text');
    const waveDisplay = document.getElementById('current-wave-display');
    const coinDisplay = document.getElementById('match-coin');
    const killDisplay = document.getElementById('match-kills');
    const arena = document.getElementById('battlefield');

    const ARENA_WIDTH = arena.clientWidth;
    const BASE_LINE = ARENA_WIDTH * 0.15;

    function initBattle() {
        updateHUD();
        spawnArmyDOM();
        startWave(currentWave);
        requestAnimationFrame(gameLoop);
    }

    function spawnArmyDOM() {
        laneArmy.innerHTML = '';
        for (let i = 0; i < armyCount; i++) {
            const soldier = document.createElement('div');
            soldier.className = 'soldier-unit';
            soldier.style.top = `${10 + Math.random() * 80}%`;
            soldier.style.left = `${Math.random() * 20}%`;
            if (player.skins.active !== 'unit.png') {
                soldier.style.backgroundImage = `url('assets/${player.skins.active}')`;
            }
            laneArmy.appendChild(soldier);
        }
    }

    function startWave(wave) {
        currentWave = wave;
        waveDisplay.textContent = currentWave;
        zombiesToSpawn = 5 + Math.floor(wave * 2);
        activeZombies = zombiesToSpawn;
        
        if (wave % 10 === 0) {
            triggerBossWarning();
            setTimeout(() => spawnZombie(true), 2000);
            zombiesToSpawn--; 
        }

        zombieSpawnTimer = setInterval(() => {
            if (isPaused || isGameOver || window.isGameStatePausedBySystem) return;
            if (zombiesToSpawn > 0) {
                spawnZombie(false);
                zombiesToSpawn--;
            } else {
                clearInterval(zombieSpawnTimer);
            }
        }, Math.max(800 - (wave * 10), 300));
    }

    function spawnZombie(isBoss) {
        let hp = 10 * Math.pow(1.15, currentWave);
        if (isBoss) hp *= 3;

        const zObj = {
            el: document.createElement('div'),
            x: ARENA_WIDTH,
            y: 10 + Math.random() * 80,
            hp: hp,
            maxHp: hp,
            isBoss: isBoss,
            speed: isBoss ? 0.3 : 0.5,
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

    function fireBullets(timestamp) {
        if (timestamp - lastFireTime >= fireRate) {
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
        z.markedForDeath = true; z.el.remove();
        
        const particle = document.createElement('div');
        particle.className = 'particle-death';
        particle.style.left = `${z.x}px`; particle.style.top = `${z.y}%`;
        laneZombie.appendChild(particle);
        setTimeout(() => particle.remove(), 1000);

        let mult = z.isBoss ? 5 : 1;
        sessionCoins += (currentWave * mult);
        sessionXP += (currentWave * mult);
        sessionKills++;
        if (z.isBoss) player.stats.totalBossKill++;
        
        updateHUD();
        rollDrops(mult);
        zombies.splice(index, 1);
        activeZombies--;

        if (activeZombies <= 0 && zombiesToSpawn <= 0) {
            gd.saveLocal();
            setTimeout(() => startWave(currentWave + 1), 2000);
        }
    }

    function rollDrops(multiplier) {
        const rolls = [
            { id: 'leather', chance: 50 + (0.5 * currentWave) + dropChanceBonus },
            { id: 'iron', chance: 25 + (0.25 * currentWave) + dropChanceBonus },
            { id: 'crystal', chance: 10 + (0.10 * currentWave) + dropChanceBonus },
            { id: 'nukeCore', chance: 3 + (0.5 * currentWave) + dropChanceBonus }
        ];
        rolls.forEach(item => {
            let finalChance = item.chance * multiplier;
            for(let i=0; i<multiplier; i++) {
                if (Math.random() * 100 <= finalChance) player.materials[item.id]++;
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
        if (currentBaseHp < maxBaseHp * 0.3) hpFill.classList.add('critical');
    }

    /* LOOP UTAMA ENGINE */
    function gameLoop(timestamp) {
        // JEDA GAME JIKA DI-PAUSE USER ATAU DIPAKSA PORTRAIT OLEH SISTEM
        if (isGameOver || isPaused || window.isGameStatePausedBySystem) {
            requestAnimationFrame(gameLoop);
            return;
        }

        fireBullets(timestamp);

        for (let i = bullets.length - 1; i >= 0; i--) {
            let b = bullets[i]; b.x += b.speed;
            b.el.style.transform = `translate3d(${b.x}px, 0, 0)`;

            if (b.x > ARENA_WIDTH) {
                b.el.remove(); bullets.splice(i, 1);
                continue;
            }

            for (let j = 0; j < zombies.length; j++) {
                let z = zombies[j];
                if (!z.markedForDeath && b.x >= z.x && b.x <= z.x + 32) {
                    if (Math.abs(b.y - z.y) < 15) {
                        z.hp -= b.damage;
                        z.el.classList.add('zombie-hit');
                        setTimeout(() => { if(z.el) z.el.classList.remove('zombie-hit'); }, 100);
                        b.el.remove(); bullets.splice(i, 1);
                        if (z.hp <= 0) processZombieDeath(z, j);
                        break;
                    }
                }
            }
        }

        for (let j = zombies.length - 1; j >= 0; j--) {
            let z = zombies[j];
            if (z.x > BASE_LINE) {
                z.x -= z.speed; z.el.style.transform = `translate3d(${z.x}px, 0, 0)`;
            } else {
                if (timestamp - z.lastAttackTime >= 1000) {
                    takeBaseDamage(Math.floor(10 + (currentWave * 1.5)));
                    z.lastAttackTime = timestamp;
                    document.getElementById('player-base').classList.add('zombie-hit');
                    setTimeout(() => document.getElementById('player-base').classList.remove('zombie-hit'), 200);
                }
            }
        }

        requestAnimationFrame(gameLoop);
    }

    function updateHUD() {
        hpText.textContent = `${Math.floor(currentBaseHp)} / ${maxBaseHp} HP`;
        hpFill.style.width = `${Math.max((currentBaseHp / maxBaseHp) * 100, 0)}%`;
        coinDisplay.textContent = sessionCoins;
        killDisplay.textContent = sessionKills;
    }

    async function triggerGameOver() {
        isGameOver = true;
        gd.addXP(sessionXP);
        player.coin += sessionCoins;
        player.stats.totalKill += sessionKills;
        if (currentWave > player.stats.highestWave) player.stats.highestWave = currentWave;

        gd.saveLocal();
        
        document.getElementById('go-wave').textContent = currentWave;
        document.getElementById('go-coin').textContent = sessionCoins;
        document.getElementById('go-xp').textContent = sessionXP;
        document.getElementById('game-over-screen').classList.remove('hidden');

        // Gunakan Custom Alert Sebelum Sinkronisasi Cloud Akhir
        await window.customAlert("PANGKALAN JEBOL. KAU KAKAL DI WAVE INI, KOMANDAN!");
        await gd.saveCloud();
    }

    document.getElementById('btn-pause').addEventListener('click', () => { isPaused = true; document.getElementById('pause-menu').classList.remove('hidden'); });
    document.getElementById('btn-resume').addEventListener('click', () => { isPaused = false; document.getElementById('pause-menu').classList.add('hidden'); });
    document.getElementById('btn-quit-to-lobby').addEventListener('click', () => window.location.href = 'index.html');
    document.getElementById('btn-go-lobby').addEventListener('click', () => window.location.href = 'index.html');
    document.getElementById('btn-restart').addEventListener('click', () => window.location.reload());

    initBattle();
});
