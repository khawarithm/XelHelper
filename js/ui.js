/**
 * ============================================================================
 * OPERATION: SURVIVOR APOCALYPS
 * FILE: js/ui.js
 * DESC: Pengendali Antarmuka Menu Utama (Lobby), Modal Pop-up, & Sistem Belanja
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    // Memastikan GameData sudah dimuat oleh main.js
    if (!window.GameData) {
        console.error("[UI ERROR] GameData System Offline!");
        return;
    }

    const gd = window.GameData;
    const player = gd.data; // Shortcut ke struktur data

    /* ==========================================================================
       UI UPDATER (Memperbarui teks/angka di layar)
       ========================================================================== */
    function updateLobbyUI() {
        // Update Header (Nama, Level, XP)
        document.getElementById('player-name-display').textContent = player.playerName;
        document.getElementById('player-level').textContent = player.level;
        
        const reqXP = gd.getRequiredXP(player.level);
        document.getElementById('xp-text').textContent = `${player.xp} / ${reqXP} XP`;
        const xpPercent = Math.min((player.xp / reqXP) * 100, 100);
        document.getElementById('xp-bar-fill').style.width = `${xpPercent}%`;

        // Update Resources
        document.getElementById('coin-count').textContent = player.coin;
        document.getElementById('mat-leather').textContent = player.materials.leather;
        document.getElementById('mat-iron').textContent = player.materials.iron;
        document.getElementById('mat-crystal').textContent = player.materials.crystal;
        document.getElementById('mat-nuke').textContent = player.materials.nukeCore;

        // Update Stats
        document.getElementById('stat-high-wave').textContent = player.stats.highestWave;
        document.getElementById('stat-total-kills').textContent = player.stats.totalKill;
        document.getElementById('stat-boss-kills').textContent = player.stats.totalBossKill;
    }

    /* ==========================================================================
       MODAL SYSTEM (Pop-up Controller)
       ========================================================================== */
    const modal = document.getElementById('lobby-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');

    function openModal(title, contentHTML) {
        modalTitle.textContent = title;
        modalBody.innerHTML = contentHTML;
        modal.classList.remove('hidden');
    }

    document.getElementById('btn-close-modal').addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    /* ==========================================================================
       MENU ACTIONS (Upgrade, Shop, Milestone, dll)
       ========================================================================== */
    
    // 1. MENU UPGRADE
    document.getElementById('btn-menu-upgrade').addEventListener('click', () => {
        const weaponCost = gd.getUpgradeCost(gd.getUpgradeBaseCost('weapon'), player.upgrades.weapon);
        const armyCost = gd.getUpgradeCost(gd.getUpgradeBaseCost('army'), player.upgrades.army);
        const baseCost = gd.getUpgradeCost(gd.getUpgradeBaseCost('base'), player.upgrades.base);
        const dropCost = gd.getUpgradeCost(gd.getUpgradeBaseCost('dropChance'), player.upgrades.dropChance);

        const html = `
            <div class="upgrade-list" style="display:flex; flex-direction:column; gap:10px;">
                <button class="btn-secondary" onclick="uiBuyUpgrade('weapon', ${weaponCost})">
                    WEAPON (Lv.${player.upgrades.weapon}) - Cost: ${weaponCost} Coins
                </button>
                <button class="btn-secondary" onclick="uiBuyUpgrade('army', ${armyCost})">
                    ARMY (Lv.${player.upgrades.army}) - Cost: ${armyCost} Coins
                </button>
                <button class="btn-secondary" onclick="uiBuyUpgrade('base', ${baseCost})">
                    BASE HP (Lv.${player.upgrades.base}) - Cost: ${baseCost} Coins
                </button>
                <button class="btn-secondary" onclick="uiBuyUpgrade('dropChance', ${dropCost})">
                    DROP CHANCE (Lv.${player.upgrades.dropChance}) - Cost: ${dropCost} Coins
                </button>
            </div>
        `;
        openModal('ARMORY UPGRADES', html);
    });

    // Ekspos fungsi beli ke global agar bisa dipanggil dari inline HTML modal
    window.uiBuyUpgrade = function(type, cost) {
        if (player.coin >= cost) {
            player.coin -= cost;
            player.upgrades[type]++;
            gd.saveLocal();
            updateLobbyUI();
            document.getElementById('btn-close-modal').click(); // Tutup modal untuk refresh
        } else {
            alert("INSUFFICIENT COINS, COMMANDER!");
        }
    };

    // 2. MENU SHOP (SKILLS)
    document.getElementById('btn-menu-shop').addEventListener('click', () => {
        const hasAirplane = player.skills.airplane;
        const hasArmored = player.skills.armoredArmy;

        const html = `
            <div class="shop-list" style="display:flex; flex-direction:column; gap:15px;">
                <div class="stats-box" style="display:flex; flex-direction:column; gap:5px;">
                    <h3 style="color:var(--color-gold)">AIRPLANE BACKUP</h3>
                    <p style="font-size:0.8rem; color:#ccc;">Effect: Army Amount x2 (Once per match)</p>
                    <p style="font-size:0.7rem; color:var(--color-khaki);">Cost: 120 Leather, 75 Iron, 25 Crystal, 3 Nuke, 2000 Coin</p>
                    ${hasAirplane 
                        ? `<button class="btn-action" disabled>UNLOCKED</button>` 
                        : `<button class="btn-secondary" onclick="uiBuyAirplane()">PURCHASE</button>`}
                </div>
                
                <div class="stats-box" style="display:flex; flex-direction:column; gap:5px;">
                    <h3 style="color:var(--color-gold)">ARMORED ARMY</h3>
                    <p style="font-size:0.8rem; color:#ccc;">Effect: Dmg x3.5, Base HP x2 (Once per match)</p>
                    <p style="font-size:0.7rem; color:var(--color-khaki);">Cost: 100 Leather, 100 Iron, 70 Crystal, 1 Nuke</p>
                    ${hasArmored 
                        ? `<button class="btn-action" disabled>UNLOCKED</button>` 
                        : `<button class="btn-secondary" onclick="uiBuyArmored()">PURCHASE</button>`}
                </div>
            </div>
        `;
        openModal('BLACK MARKET', html);
    });

    window.uiBuyAirplane = function() {
        const cost = { l: 120, i: 75, c: 25, n: 3, coin: 2000 };
        if (player.materials.leather >= cost.l && player.materials.iron >= cost.i && 
            player.materials.crystal >= cost.c && player.materials.nukeCore >= cost.n && 
            player.coin >= cost.coin) {
            
            player.materials.leather -= cost.l;
            player.materials.iron -= cost.i;
            player.materials.crystal -= cost.c;
            player.materials.nukeCore -= cost.n;
            player.coin -= cost.coin;
            player.skills.airplane = true;
            
            gd.saveLocal();
            updateLobbyUI();
            document.getElementById('btn-close-modal').click();
            alert("AIRPLANE SKILL ACQUIRED!");
        } else {
            alert("NOT ENOUGH MATERIALS!");
        }
    };

    window.uiBuyArmored = function() {
        const cost = { l: 100, i: 100, c: 70, n: 1 };
        if (player.materials.leather >= cost.l && player.materials.iron >= cost.i && 
            player.materials.crystal >= cost.c && player.materials.nukeCore >= cost.n) {
            
            player.materials.leather -= cost.l;
            player.materials.iron -= cost.i;
            player.materials.crystal -= cost.c;
            player.materials.nukeCore -= cost.n;
            player.skills.armoredArmy = true;
            
            gd.saveLocal();
            updateLobbyUI();
            document.getElementById('btn-close-modal').click();
            alert("ARMORED ARMY SKILL ACQUIRED!");
        } else {
            alert("NOT ENOUGH MATERIALS!");
        }
    };

    // 3. MENU MILESTONE
    document.getElementById('btn-menu-milestone').addEventListener('click', () => {
        // Implementasi sederhana: Cek kelipatan 10 dan 25 dari level pemain
        const html = `
            <div style="text-align:center;">
                <p>Milestone system verifies your player level.</p>
                <button class="btn-secondary" onclick="uiClaimMilestone()">CHECK & CLAIM AWARDS</button>
            </div>
        `;
        openModal('CAREER MILESTONES', html);
    });

    window.uiClaimMilestone = function() {
        // Logika sederhana: Memberi reward untuk setiap 10 level yang belum di-claim
        let claimedSomething = false;
        let lv = 10;
        
        while (lv <= player.level) {
            if (!player.milestones.includes(lv)) {
                if (lv % 10 === 0) {
                    player.materials.leather += 30;
                    player.materials.iron += 15;
                    player.materials.crystal += 5;
                    player.coin += 500;
                    player.milestones.push(lv);
                    claimedSomething = true;
                }
                if (lv % 25 === 0) {
                    player.materials.nukeCore += 1;
                    if (!player.skins.unlocked.includes('unit1.png')) {
                        player.skins.unlocked.push('unit1.png');
                    }
                    if (!player.milestones.includes(lv)) player.milestones.push(lv); // Guarding
                    claimedSomething = true;
                }
            }
            lv++;
        }

        if (claimedSomething) {
            gd.saveLocal();
            updateLobbyUI();
            alert("REWARDS CLAIMED SUCCESSFULLY!");
        } else {
            alert("NO NEW MILESTONES TO CLAIM. LEVEL UP FIRST!");
        }
        document.getElementById('btn-close-modal').click();
    };

    // 4. CLOUD SAVE FIREBASE
    document.getElementById('btn-cloud-save').addEventListener('click', async () => {
        const btn = document.getElementById('btn-cloud-save');
        btn.textContent = "SYNCING...";
        btn.disabled = true;
        
        const success = await gd.saveCloud();
        
        btn.textContent = success ? "SYNCED!" : "SYNC FAILED";
        setTimeout(() => {
            btn.textContent = "CLOUD SAVE";
            btn.disabled = false;
        }, 2000);
    });

    // 5. NAVIGASI LAINNYA
    document.getElementById('btn-menu-about').addEventListener('click', () => {
        window.location.href = 'about.html';
    });

    document.getElementById('btn-play').addEventListener('click', () => {
        window.location.href = 'game.html';
    });

    // Inisialisasi Tampilan Pertama
    updateLobbyUI();
});
