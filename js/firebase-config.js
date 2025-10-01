// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDFbL4UDeP6zCGcTilhwoLOQp8s9nohE74",
  authDomain: "ecovators-e6a31.firebaseapp.com",
  projectId: "ecovators-e6a31",
  storageBucket: "ecovators-e6a31.firebasestorage.app",
  messagingSenderId: "12942354487",
  appId: "1:12942354487:web:134b348dca3d033198f7b2",
  measurementId: "G-XB6FFRPLJG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Export Firebase services
export { auth, db, storage };