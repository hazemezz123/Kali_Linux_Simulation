import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { firebaseConfig } from "../firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function getDeviceId() {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
}

export function getUserName() {
  return localStorage.getItem('userName') || 'root';
}

export async function isUserRegistered() {
  const deviceId = getDeviceId();
  const q = query(collection(db, "visitors"), where("deviceId", "==", deviceId));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

export async function saveVisitor(name) {
  const deviceId = getDeviceId();
  localStorage.setItem('userName', name);
  await addDoc(collection(db, "visitors"), { 
    name, 
    deviceId,
    timestamp: new Date() 
  });
}

export async function getVisitors() {
  const snapshot = await getDocs(collection(db, "visitors"));
  return snapshot.docs.map(doc => doc.data());
}
