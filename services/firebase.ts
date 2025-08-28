// FIX: Changed to namespace import for firebase/app to resolve issues where initializeApp is not found as a named export.
import * as firebaseApp from "firebase/app";
import { 
    getFirestore, 
    collection, 
    onSnapshot, 
    doc, 
    getDoc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    writeBatch, 
    deleteField, 
    query, 
    where, 
    getDocs, 
    serverTimestamp,
    setDoc
} from "firebase/firestore";
// FIX: Changed to namespace import for firebase/auth to resolve issues where auth functions are not found as named exports.
import * as firebaseAuth from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD0JuaXZ4UtH438ARcX6hKqGI8bx4oDXVo",
  authDomain: "new-app-v2-cf9f2.firebaseapp.com",
  projectId: "new-app-v2-cf9f2",
  storageBucket: "new-app-v2-cf9f2.firebasestorage.app",
  messagingSenderId: "769675832413",
  appId: "1:769675832413:web:cfda9bffcfb7290adfb1b4"
};

const app = firebaseApp.initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = firebaseAuth.getAuth(app);

// FIX: Destructure auth functions from the namespace import to make them available for re-export.
const { signInAnonymously, onAuthStateChanged } = firebaseAuth;

export { 
    db, 
    auth,
    collection,
    onSnapshot,
    doc,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    writeBatch,
    deleteField,
    query,
    where,
    getDocs,
    serverTimestamp,
    signInAnonymously,
    onAuthStateChanged,
    setDoc
};