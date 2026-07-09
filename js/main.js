/**
 * ============================================================================
 * OPERATION: SURVIVOR APOCALYPS
 * FILE: js/main.js
 * DESC: Data Global, Smart Sync, PWA Registry, Landscape Enforcer & Custom Alert
 * ============================================================================
 */

const CURRENT_SAVE_VERSION = 1;

const defaultData = {
    saveVersion: CURRENT_SAVE_VERSION,
    playerId: 'SDR_' + Date.now(),
    playerName: 'Soldier',
    level: 1,
    xp: 0,
    coin: 0,
    materials: { leather: 0, iron: 0, crystal: 0, nukeCore: 0 },
    stats: { highestWave: 0, totalKill: 0, totalBossKill: 0 },
    upgrades: { weapon: 0, army: 0, base: 0, dropChance: 0 },
    skills: { airplane: false, armoredArmy: false },
    skins: { unlocked: ['unit.png'], active: 'unit.png' },
    milestones: [],
    redeemedCodes: [],
    settings: { sfx: true }
};

class DataManager {
    constructor() {
        this.data = JSON.parse(JSON.stringify(defaultData));
        this.init();
    }

    init() {
        this.loadLocal();
        this.checkMigration();
    }

    loadLocal() {
        const saved = localStorage.getItem('survivor_apocalyps_data');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.data = { ...this.data, ...parsed };
                this.data.materials = { ...defaultData.materials, ...parsed.materials };
                this.data.stats = { ...defaultData.stats, ...parsed.stats };
                this.data.upgrades = { ...defaultData.upgrades, ...parsed.upgrades };
                this.data.skills = { ...defaultData.skills, ...parsed.skills };
                this.data.skins = { ...defaultData.skins, ...parsed.skins };
            } catch (e) {
                console.error("[SYSTEM] Gagal memuat Local Storage.", e);
            }
        } else {
            this.saveLocal();
        }
    }

    saveLocal() {
        localStorage.setItem('survivor_apocalyps_data', JSON.stringify(this.data));
        console.log("[SYSTEM] Data Secured to Local Storage.");
    }

    checkMigration() {
        if (this.data.saveVersion < CURRENT_SAVE_VERSION) {
            this.data.saveVersion = CURRENT_SAVE_VERSION;
            this.saveLocal();
        }
    }

    async saveCloud() {
        if (!window.FirebaseDB || !window.FirestoreHelper) {
            console.warn("[WARNING] Firebase offline. Menunggu koneksi...");
            return false;
        }
        try {
            const docRef = window.FirestoreHelper.doc(window.FirebaseDB, "players", this.data.playerId);
            await window.FirestoreHelper.setDoc(docRef, this.data);
            console.log("[SYSTEM] Cloud Save Berhasil!");
            return true;
        } catch (error) {
            console.error("[ERROR] Gagal sinkronisasi Firebase:", error);
            return false;
        }
    }

    getRequiredXP(level) {
        return Math.floor(100 * Math.pow(1.5, level - 1));
    }

    addXP(amount) {
        this.data.xp += amount;
        let reqXP = this.getRequiredXP(this.data.level);
        let levelUp = false;
        while (this.data.xp >= reqXP) {
            this.data.xp -= reqXP;
            this.data.level++;
            reqXP = this.getRequiredXP(this.data.level);
            levelUp = true;
        }
        if (levelUp) {
            this.saveLocal();
            window.customAlert(`LEVEL UP! SEKARANG ANDA LEVEL ${this.data.level}, KOMANDAN!`);
        }
    }

    getUpgradeCost(baseCost, currentLevel) {
        return Math.floor(baseCost * Math.pow(1.5, currentLevel));
    }

    getUpgradeBaseCost(type) {
        const bases = { weapon: 10, army: 100, base: 250, dropChance: 300 };
        return bases[type] || 0;
    }
}

// Inisialisasi Data Global
window.GameData = new DataManager();

/* ==========================================================================
   PWA SERVICE WORKER REGISTRATION
   ========================================================================== */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('[PWA] Service Worker Registered.'))
            .catch(err => console.error('[PWA] Registration Failed:', err));
    });
}

/* ==========================================================================
   LANDSCAPE ENFORCER SYSTEM
   ========================================================================== */
function verifyScreenOrientation() {
    const lockScreen = document.getElementById('landscape-lock-screen');
    if (!lockScreen) return;

    if (window.innerWidth < window.innerHeight) {
        lockScreen.classList.remove('hidden');
        window.isGameStatePausedBySystem = true; // Flag pembantu untuk game.js
    } else {
        lockScreen.classList.add('hidden');
        window.isGameStatePausedBySystem = false;
    }
}
window.addEventListener('resize', verifyScreenOrientation);
window.addEventListener('DOMContentLoaded', verifyScreenOrientation);

/* ==========================================================================
   CUSTOM TACTICAL ALERT SYSTEM
   ========================================================================== */
window.customAlert = function(message) {
    const alertModal = document.getElementById('custom-tactical-alert');
    const alertText = document.getElementById('custom-alert-text');
    const alertBtn = document.getElementById('btn-custom-alert-ok');

    if (!alertModal || !alertText) {
        console.log("[FALLBACK ALERT]: " + message);
        return Promise.resolve();
    }

    alertText.textContent = message;
    alertModal.classList.remove('hidden');

    return new Promise((resolve) => {
        const closeHandler = () => {
            alertModal.classList.add('hidden');
            alertBtn.removeEventListener('click', closeHandler);
            resolve();
        };
        alertBtn.addEventListener('click', closeHandler);
    });
};
