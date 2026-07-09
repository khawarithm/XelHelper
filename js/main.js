/**
 * ============================================================================
 * OPERATION: SURVIVOR APOCALYPS
 * FILE: js/main.js
 * DESC: Manajemen Data Global, Smart Sync (Local & Cloud), & Core Rules
 * ============================================================================
 */

// Fondasi Migrasi Data (Sesuai dengan saran Master Prompt)
const CURRENT_SAVE_VERSION = 1;

// Struktur Data Utama (Seluruh elemen wajib ada di sini)
const defaultData = {
    saveVersion: CURRENT_SAVE_VERSION,
    playerId: 'SDR_' + Date.now(), // Generate ID lokal unik pertama kali main
    playerName: 'Soldier',
    level: 1,
    xp: 0,
    coin: 0,
    materials: {
        leather: 0,
        iron: 0,
        crystal: 0,
        nukeCore: 0
    },
    stats: {
        highestWave: 0,
        totalKill: 0,
        totalBossKill: 0
    },
    upgrades: {
        weapon: 0,
        army: 0,
        base: 0,
        dropChance: 0
    },
    skills: {
        airplane: false,
        armoredArmy: false
    },
    skins: {
        unlocked: ['unit.png'],
        active: 'unit.png'
    },
    milestones: [],
    redeemedCodes: [],
    settings: {
        sfx: true
    }
};

class DataManager {
    constructor() {
        // Deep copy dari defaultData
        this.data = JSON.parse(JSON.stringify(defaultData));
        this.init();
    }

    init() {
        this.loadLocal();
        this.checkMigration();
    }

    /* ==========================================================================
       SMART SYNC: LOCAL STORAGE
       ========================================================================== */
    loadLocal() {
        const saved = localStorage.getItem('survivor_apocalyps_data');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Menggabungkan data lama dengan skema baru, mencegah data undefined
                this.data = { ...this.data, ...parsed };
                
                // Khusus untuk nested object (mencegah properti objek yang terhapus)
                this.data.materials = { ...defaultData.materials, ...parsed.materials };
                this.data.stats = { ...defaultData.stats, ...parsed.stats };
                this.data.upgrades = { ...defaultData.upgrades, ...parsed.upgrades };
                this.data.skills = { ...defaultData.skills, ...parsed.skills };
                this.data.skins = { ...defaultData.skins, ...parsed.skins };
            } catch (e) {
                console.error("[SYSTEM] Gagal memuat Local Storage. File corrupt.", e);
            }
        } else {
            this.saveLocal(); // Simpan fondasi pertama kali
        }
    }

    // Dipanggil saat Wave selesai, Upgrade, Shop, Milestone
    saveLocal() {
        localStorage.setItem('survivor_apocalyps_data', JSON.stringify(this.data));
        console.log("[SYSTEM] Data Secured to Local Storage.");
    }

    /* ==========================================================================
       SYSTEM MIGRATION (Fondasi Masa Depan)
       ========================================================================== */
    checkMigration() {
        if (this.data.saveVersion < CURRENT_SAVE_VERSION) {
            console.log(`[SYSTEM] Menginisiasi Migrasi dari v${this.data.saveVersion} ke v${CURRENT_SAVE_VERSION}...`);
            // Area untuk logika migrasi jika versi 2 dirilis nanti (misal tambah field baru)
            this.data.saveVersion = CURRENT_SAVE_VERSION;
            this.saveLocal();
            console.log("[SYSTEM] Migrasi Selesai. Data Aman.");
        }
    }

    /* ==========================================================================
       SMART SYNC: FIREBASE FIRESTORE CLOUD SAVE
       ========================================================================== */
    // Dipanggil saat Game Over, Tombol Save, atau Redeem Code
    async saveCloud() {
        if (!window.FirebaseDB || !window.FirestoreHelper) {
            console.warn("[WARNING] Firebase module belum termuat. Menunggu koneksi...");
            return false;
        }

        try {
            console.log("[SYSTEM] Menyinkronkan ke Firebase Firestore...");
            // Struktur document di Firestore: Collection 'players' > ID Pemain
            const docRef = window.FirestoreHelper.doc(window.FirebaseDB, "players", this.data.playerId);
            await window.FirestoreHelper.setDoc(docRef, this.data);
            console.log("[SYSTEM] Cloud Save Berhasil!");
            return true;
        } catch (error) {
            console.error("[ERROR] Gagal sinkronisasi Firebase:", error);
            return false;
        }
    }

    /* ==========================================================================
       GAME RULES & MATHEMATICAL FORMULAS
       ========================================================================== */
    
    // XP Formula: NeedXP = floor(100 * 1.5^(Level-1))
    getRequiredXP(level) {
        return Math.floor(100 * Math.pow(1.5, level - 1));
    }

    addXP(amount) {
        this.data.xp += amount;
        let reqXP = this.getRequiredXP(this.data.level);
        
        let levelUp = false;
        // Loop ini memastikan jika pemain dapat XP besar, level bisa naik berkali-kali
        while (this.data.xp >= reqXP) {
            this.data.xp -= reqXP;
            this.data.level++;
            reqXP = this.getRequiredXP(this.data.level);
            levelUp = true;
        }
        
        if (levelUp) {
            console.log(`[SYSTEM] LEVEL UP ACHIEVED! Current Level: ${this.data.level}`);
            this.saveLocal();
        }
    }

    // Upgrade Formula: Harga = Base * (1.5 ^ LevelUpgrade)
    getUpgradeCost(baseCost, currentLevel) {
        return Math.floor(baseCost * Math.pow(1.5, currentLevel));
    }

    getUpgradeBaseCost(type) {
        const bases = {
            weapon: 10,
            army: 100,
            base: 250,
            dropChance: 300
        };
        return bases[type] || 0;
    }
}

// Mengekspos class ini secara global agar ui.js dan game.js bisa memanipulasi data
window.GameData = new DataManager();
