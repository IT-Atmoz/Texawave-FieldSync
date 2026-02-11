import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getDatabase } from "firebase/database"
import { getAuth } from "firebase/auth"
import { getStorage } from "firebase/storage"

// Your Firebase configuration (Hardcoded)
const firebaseConfig = {
  apiKey: "AIzaSyDc1lenYT6FD_GeyOXEMtx1CrNje0PeJag",
  authDomain: "fsync-bb4a4.firebaseapp.com",
  databaseURL: "https://fsync-bb4a4-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "fsync-bb4a4",
  storageBucket: "fsync-bb4a4.firebasestorage.app",
  messagingSenderId: "62152758251",
  appId: "62152758251",
  measurementId: "",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

const db = getFirestore(app)
const database = getDatabase(app) // Realtime Database
const auth = getAuth(app)
const storage = getStorage(app)

export { app, db, database, auth, storage }
