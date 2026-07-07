// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

 const firebaseConfig = {
    apiKey: "AIzaSyBMXNGfgfl9PCxgjP-gJHGQ55wNQ54eYu4",
    authDomain: "collegebaazar-da968.firebaseapp.com",
    projectId: "collegebaazar-da968",
    storageBucket: "collegebaazar-da968.firebasestorage.app",
    messagingSenderId: "90990801079",
    appId: "1:90990801079:web:c0ebd722e43dda9bbd9d32",
    measurementId: "G-2H8JM393PK"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };