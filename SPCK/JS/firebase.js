import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBpC_RSKp0qCtO2BOS1rUmjv12wyN3OpE0",
  authDomain: "jsi13-c67f2.firebaseapp.com",
  projectId: "jsi13-c67f2",
  storageBucket: "jsi13-c67f2.firebasestorage.app",
  messagingSenderId: "107804399992",
  appId: "1:107804399992:web:8ff1623a53b05a67bcd08d",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
