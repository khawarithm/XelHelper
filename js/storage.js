/*==========================================================
    SURVIVOR APOCALYPS
    storage.js
    Version 1.0
==========================================================*/

import {
    savePlayer
} from "./firebase.js";

/*==========================================================
    STORAGE KEY
==========================================================*/

export const SAVE_KEY = "survivor_apocalyps_save";

export const PLAYER_ID_KEY = "survivor_apocalyps_player";

/*==========================================================
    DEFAULT SAVE
==========================================================*/

export const defaultSave = {

    /*==============================
        PLAYER
    ==============================*/

    playerId: "",

    playerName: "Player",

    level: 1,

    xp: 0,

    needXP: 100,

    /*==============================
        PROGRESS
    ==============================*/

    coin: 0,

    wave: 1,

    highestWave: 1,

    /*==============================
        MATERIAL
    ==============================*/

    leather: 0,

    iron: 0,

    crystal: 0,

    nuke: 0,

    /*==============================
        UPGRADE
    ==============================*/

    upgrade: {

        weapon: 1,

        army: 1,

        base: 1,

        chance: 1

    },

    /*==============================
        SKILL
    ==============================*/

    skill: {

        airplane: false,

        armored: false

    },

    /*==============================
        SKIN
    ==============================*/

    skin: {

        current: "unit.png",

        unit1: false

    },

    /*==============================
        MILESTONE
    ==============================*/

    milestone: {

        lv10: [],

        lv25: []

    },

    /*==============================
        STATISTIC
    ==============================*/

    stat: {

        totalKill: 0,

        totalCoin: 0,

        totalPlay: 0,

        totalBossKill: 0

    },

    /*==============================
        SETTING
    ==============================*/

    setting: {

        sfx: true,

        vibration: true

    },

    /*==============================
        TIME
    ==============================*/

    createdAt: Date.now(),

    updatedAt: Date.now()

};

/*==========================================================
    SAVE DATA
==========================================================*/

export let saveData = {};

/*==========================================================
    PLAYER ID
==========================================================*/

export function generatePlayerId() {

    let id = localStorage.getItem(
        PLAYER_ID_KEY
    );

    if (!id) {

        id = crypto.randomUUID();

        localStorage.setItem(
            PLAYER_ID_KEY,
            id
        );

    }

    return id;

}

/*==========================================================
    LOAD LOCAL
==========================================================*/

export function loadLocal() {

    const data = localStorage.getItem(
        SAVE_KEY
    );

    if (!data) {

        saveData = structuredClone(defaultSave);

        saveData.playerId = generatePlayerId();

        saveLocal();

        return;
    }

    saveData = JSON.parse(data);

}

/*==========================================================
    SAVE LOCAL
==========================================================*/

export function saveLocal() {

    saveData.updatedAt = Date.now();

    localStorage.setItem(

        SAVE_KEY,

        JSON.stringify(saveData)

    );

}

/*==========================================================
    RESET SAVE
==========================================================*/

export function resetSave() {

    saveData = structuredClone(defaultSave);

    saveData.playerId = generatePlayerId();

    saveLocal();

}

/*==========================================================
    EXPORT SAVE
==========================================================*/

export function exportSave() {

    return JSON.stringify(
        saveData,
        null,
        2
    );

}

/*==========================================================
    IMPORT SAVE
==========================================================*/

export function importSave(text) {

    try {

        const data = JSON.parse(text);

        saveData = data;

        saveLocal();

        return true;

    }

    catch {

        return false;

    }

}

/*==========================================================
    AUTO SAVE
    Dipanggil setiap Wave selesai
==========================================================*/

export function autoSaveWave() {

    saveLocal();

}

/*==========================================================
    SMART SYNC
==========================================================*/

export async function smartSync() {

    saveLocal();

    return await savePlayer(

        saveData.playerId,

        saveData

    );

}

/*==========================================================
    ADD COIN
==========================================================*/

export function addCoin(value) {

    saveData.coin += value;

    saveData.stat.totalCoin += value;

}

/*==========================================================
    ADD XP
==========================================================*/

export function addXP(value) {

    saveData.xp += value;

    while (

        saveData.xp >= saveData.needXP

    ) {

        saveData.xp -= saveData.needXP;

        saveData.level++;

        saveData.needXP = Math.floor(

            saveData.needXP * 1.5

        );

    }

}

/*==========================================================
    ADD MATERIAL
==========================================================*/

export function addMaterial(

    leather = 0,

    iron = 0,

    crystal = 0,

    nuke = 0

) {

    saveData.leather += leather;

    saveData.iron += iron;

    saveData.crystal += crystal;

    saveData.nuke += nuke;

}

/*==========================================================
    UPDATE HIGHEST WAVE
==========================================================*/

export function updateHighestWave(wave) {

    if (

        wave > saveData.highestWave

    ) {

        saveData.highestWave = wave;

    }

}

/*==========================================================
    INIT
==========================================================*/

loadLocal();
