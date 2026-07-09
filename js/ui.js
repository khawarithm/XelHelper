/**
 * ============================================================================
 * OPERATION: SURVIVOR APOCALYPS
 * FILE: js/ui.js
 * DESC: Pengendali UI Lobby & Toko Upgrade Menggunakan Custom Alert
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    if (!window.GameData) return;

    const gd = window.GameData;
    const player = gd.data;

    function updateLobbyUI() {
        document.getElementById('player-name-display').textContent = player.playerName;
        document.getElementById('player-level').textContent = player.level;
        
        const reqXP = gd.getRequiredXP(player.level);
        document.getElementById('xp-text').textContent = `${player.xp} / ${reqXP} XP`;
        const xpPercent = Math.min((player.xp / reqXP) * 100, 100);
        document.getElementById('xp-bar-fill').style.width = `${xpPercent}%`;

        document.getElementById('coin-count').textContent = player.coin;
        document.getElementById('mat-leather').textContent = player.materials.leather;
        document.getElementById('mat-iron').textContent = player.materials.iron;
        document.getElementById('mat-crystal').textContent = player.materials.crystal;
        document.getElementById('mat-nuke').textContent = player.materials.nukeCore;

        document.getElementById('stat-high-wave').textContent = player.stats.highestWave;
        document.getElementById('stat-total-kills').textContent = player.stats.totalKill;
        document.getElementById('stat-boss-kills').textContent = player.stats.totalBossKill;
    }

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

    window.uiBuyUpgrade = async function(type, cost) {
        if (player.coin >= cost) {
            player.coin -= cost;
            player.upgrades[type]++;
            gd.saveLocal();
            updateLobbyUI();
            document.getElementById('btn-close-modal').click();
            await window.customAlert(`UPGRADE ${type.toUpperCase()} BERHASIL DIALOKASIKAN!`);
        } else {
            await window.customAlert("DANA TIDAK CUKUP, KOMANDAN!");
        }
    };

    // 2. MENU SHOP
    document.getElementById('btn-menu-shop').addEventListener('click', () => {
        const hasAirplane = player.skills.airplane;
        const hasArmored = player.skills.armoredArmy;

        const html = `
            <div class="shop-list" style="display:flex; flex-direction:column; gap:15px;">
                <div class="stats-box" style="display:flex; flex-direction:column; gap:5px;">
                    <h3 style="color:var(--color-gold)">AIRPLANE BACKUP</h3>
                    <p style="font-size:0.8rem; color:#ccc;">Efek: Jumlah Pasukan x2 di Medan Tempur</p>
                    <p style="font-size:0.7rem; color:var(--color-khaki);">Biaya: 120 Kulit, 75 Besi, 25 Kristal, 3 Nuke, 2000 Koin</p>
                    ${hasAirplane ? `<button class="btn-action" disabled>TERBUKA</button>` : `<button class="btn-secondary" onclick="uiBuyAirplane()">BELI TACTICAL</button>`}
                </div>
                <div class="stats-box" style="display:flex; flex-direction:column; gap:5px;">
                    <h3 style="color:var(--color-gold)">ARMORED ARMY</h3>
                    <p style="font-size:0.8rem; color:#ccc;">Efek: Dmg x3.5 & Base HP x2</p>
                    <p style="font-size:0.7rem; color:var(--color-khaki);">Biaya: 100 Kulit, 100 Besi, 70 Kristal, 1 Nuke</p>
                    ${hasArmored ? `<button class="btn-action" disabled>TERBUKA</button>` : `<button class="btn-secondary" onclick="uiBuyArmored()">BELI TACTICAL</button>`}
                </div>
            </div>
        `;
        openModal('BLACK MARKET', html);
    });

    window.uiBuyAirplane = async function() {
        const cost = { l: 120, i: 75, c: 25, n: 3, coin: 2000 };
        if (player.materials.leather >= cost.l && player.materials.iron >= cost.i && 
            player.materials.crystal >= cost.c && player.materials.nukeCore >= cost.n && player.coin >= cost.coin) {
            
            player.materials.leather -= cost.l; player.materials.iron -= cost.i;
            player.materials.crystal -= cost.c; player.materials.nukeCore -= cost.n; player.coin -= cost.coin;
            player.skills.airplane = true;
            gd.saveLocal(); updateLobbyUI();
            document.getElementById('btn-close-modal').click();
            await window.customAlert("SKILL AIRPLANE BACKUP SIAP DIGUNAKAN!");
        } else {
            await window.customAlert("MATERIAL ATAU KOIN TIDAK MENCUKUPI!");
        }
    };

    window.uiBuyArmored = async function() {
        const cost = { l: 100, i: 100, c: 70, n: 1 };
        if (player.materials.leather >= cost.l && player.materials.iron >= cost.i && 
            player.materials.crystal >= cost.c && player.materials.nukeCore >= cost.n) {
            
            player.materials.leather -= cost.l; player.materials.iron -= cost.i;
            player.materials.crystal -= cost.c; player.materials.nukeCore -= cost.n;
            player.skills.armoredArmy = true;
            gd.saveLocal(); updateLobbyUI();
            document.getElementById('btn-close-modal').click();
            await window.customAlert("DIVISI ARMORED ARMY TELAH DIREGISTRASI!");
        } else {
            await window.customAlert("MATERIAL TIDAK MENCUKUPI!");
        }
    };

    // 3. MENU MILESTONE
    document.getElementById('btn-menu-milestone').addEventListener('click', () => {
        const html = `
            <div style="text-align:center;">
                <p style="margin-bottom:15px;">Sistem akan memverifikasi Level Karir militer Anda untuk hadiah.</p>
                <button class="btn-secondary" onclick="uiClaimMilestone()">PERIKSA REWARD</button>
            </div>
        `;
        openModal('CAREER MILESTONES', html);
    });

    window.uiClaimMilestone = async function() {
        let claimed = false; let lv = 10;
        while (lv <= player.level) {
            if (!player.milestones.includes(lv)) {
                if (lv % 10 === 0) {
                    player.materials.leather += 30; player.materials.iron += 15; player.materials.crystal += 5; player.coin += 500;
                    player.milestones.push(lv); claimed = true;
                }
                if (lv % 25 === 0) {
                    player.materials.nukeCore += 1;
                    if (!player.skins.unlocked.includes('unit1.png')) player.skins.unlocked.push('unit1.png');
                    claimed = true;
                }
            }
            lv++;
        }
        document.getElementById('btn-close-modal').click();
        if (claimed) {
            gd.saveLocal(); updateLobbyUI();
            await window.customAlert("HADIAH MILITER BERHASIL MASUK KE GUDANG!");
        } else {
            await window.customAlert("TIDAK ADA REWARD BARU. TINGKATKAN LEVEL ANDA LAGI!");
        }
    };

    // 4. CLOUD SAVE FIREBASE
    document.getElementById('btn-cloud-save').addEventListener('click', async () => {
        const btn = document.getElementById('btn-cloud-save');
        btn.textContent = "SYNCING..."; btn.disabled = true;
        const success = await gd.saveCloud();
        btn.textContent = success ? "SYNCED!" : "SYNC FAILED";
        setTimeout(() => { btn.textContent = "CLOUD SAVE"; btn.disabled = false; }, 2000);
    });

    document.getElementById('btn-menu-about').addEventListener('click', () => window.location.href = 'about.html');
    document.getElementById('btn-play').addEventListener('click', () => window.location.href = 'game.html');

    updateLobbyUI();
});
