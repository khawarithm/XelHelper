/**
 * ============================================================================
 * OPERATION: SURVIVOR APOCALYPS
 * FILE: js/firebase.js
 * DESC: Konfigurasi dan Inisialisasi Firebase Cloud Save (Firestore)
 * ============================================================================
 */

// Mengimpor fungsi inisialisasi dari Firebase Core
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
// Mengimpor fungsi Firestore sesuai dengan instruksi penggunaan Firebase Firestore
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc 
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

// Konfigurasi wajib dari Command Center (Master Prompt)
const firebaseConfig = {
    apiKey: "AIzaSyB_fFqjywlvxJtJF_M4VI8OhRgyUE1qVXs",
    authDomain: "sheeeha-67d46.firebaseapp.com",
    databaseURL: "https://sheeeha-67d46-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "sheeeha-67d46",
    storageBucket: "sheeeha-67d46.firebasestorage.app",
    messagingSenderId: "203910243490",
    appId: "1:203910243490:web:d7ed3fe0fd8edaccf0a3fb"
};

try {
    // Inisialisasi Aplikasi Firebase
    const app = initializeApp(firebaseConfig);
    
    // Inisialisasi Cloud Firestore
    const db = getFirestore(app);

    // ============================================================================
    // GLOBAL EXPORT BRIDGE
    // Karena file ini bertipe module, kita harus mengekspos instance dan fungsi 
    // ke objek window agar main.js (non-module) bisa membaca dan menulis data.
    // ============================================================================
    window.FirebaseDB = db;
    window.FirestoreHelper = {
        doc: doc,
        setDoc: setDoc,
        getDoc: getDoc
    };

    console.log("[SYSTEM] Firebase Firestore Module Initialized and Bridged.");
} catch (error) {
    console.error("[ERROR] Firebase Initialization Failed:", error);
}
