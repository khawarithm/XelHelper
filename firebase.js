/*==========================================================
    SURVIVOR APOCALYPS
    firebase.js
    Version 1.0
==========================================================*/

/*==========================================================
    IMPORT FIREBASE
==========================================================*/

import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";

import {

    getFirestore,

    doc,

    setDoc,

    getDoc,

    updateDoc,

    serverTimestamp

}
from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

/*==========================================================
    FIREBASE CONFIG
==========================================================*/

const firebaseConfig = {

    apiKey: "AIzaSyB_fFqjywlvxJtJF_M4VI8OhRgyUE1qVXs",

    authDomain: "sheeeha-67d46.firebaseapp.com",

    databaseURL: "https://sheeeha-67d46-default-rtdb.asia-southeast1.firebasedatabase.app",

    projectId: "sheeeha-67d46",

    storageBucket: "sheeeha-67d46.firebasestorage.app",

    messagingSenderId: "203910243490",

    appId: "1:203910243490:web:d7ed3fe0fd8edaccf0a3fb"

};

/*==========================================================
    INITIALIZE
==========================================================*/

export const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

/*==========================================================
    COLLECTION
==========================================================*/

const COLLECTION = "players";

/*==========================================================
    SAVE PLAYER
==========================================================*/

export async function savePlayer(playerId, data) {

    try {

        await setDoc(

            doc(db, COLLECTION, playerId),

            {

                ...data,

                lastSave: serverTimestamp()

            },

            {

                merge: true

            }

        );

        console.log("[Firebase] Save Success");

        return true;

    }

    catch (err) {

        console.error(err);

        return false;

    }

}

/*==========================================================
    LOAD PLAYER
==========================================================*/

export async function loadPlayer(playerId) {

    try {

        const snap = await getDoc(

            doc(db, COLLECTION, playerId)

        );

        if (snap.exists()) {

            console.log("[Firebase] Load Success");

            return snap.data();

        }

        return null;

    }

    catch (err) {

        console.error(err);

        return null;

    }

}

/*==========================================================
    UPDATE PLAYER
==========================================================*/

export async function updatePlayer(playerId, data) {

    try {

        await updateDoc(

            doc(db, COLLECTION, playerId),

            {

                ...data,

                lastSave: serverTimestamp()

            }

        );

        console.log("[Firebase] Update Success");

        return true;

    }

    catch (err) {

        console.error(err);

        return false;

    }

}

/*==========================================================
    CONNECTION TEST
==========================================================*/

export async function testFirebase() {

    try {

        console.log("================================");

        console.log("Firebase Connected");

        console.log("Project :", firebaseConfig.projectId);

        console.log("================================");

        return true;

    }

    catch (err) {

        console.error(err);

        return false;

    }

}

/*==========================================================
    EXPORT DEFAULT
==========================================================*/

export default {

    app,

    db,

    savePlayer,

    loadPlayer,

    updatePlayer,

    testFirebase

};
