import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';


const firebaseConfig = {
  apiKey: "AIzaSyDTVeqoAeQWj-_rn2bn6I3Pxz6VGescDW4",
  authDomain: "govimithuru-88543.firebaseapp.com",
  projectId: "govimithuru-88543",
  storageBucket: "govimithuru-88543.firebasestorage.app",
  messagingSenderId: "391281033022",
  appId: "1:391281033022:web:fe0bcfd6cb53b58c2ef66f"
};

// Initialize Firebase
let firebaseApp;
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}else {
  firebaseApp = firebase.app();
}
//avilakmal21@gmail.com-govimithuru

export const auth = firebase.auth();
export const db = firebase.firestore();
export const storage = firebase.storage();

export default firebase; 