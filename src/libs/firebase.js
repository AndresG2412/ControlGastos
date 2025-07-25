// libs/firebase.js
import { initializeApp } from "firebase/app";
// Importa FieldPath junto con las demás funciones de firestore
import { getFirestore, collection, setDoc, getDoc, doc, getDocs, query, orderBy, FieldPath } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Exportamos todo lo necesario, incluyendo FieldPath
export { 
    db, 
    auth,
    collection,
    getDocs,
    query, 
    orderBy,
    doc, 
    setDoc,
    getDoc,
    FieldPath // <-- ¡Esta es la adición clave!
};