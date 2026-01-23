const firebaseConfig = {
  apiKey: "AIzaSyAfb4O7YTBIDbCrzrpD0k2BOo8gTz8jMJY",
  authDomain: "smart-shelf-5a559.firebaseapp.com",
  projectId: "smart-shelf-5a559",
  storageBucket: "smart-shelf-5a559.firebasestorage.app",
  messagingSenderId: "179762318378",
  appId: "1:179762318378:web:2f1d1cc8f8c1f43cfbc753",
  measurementId: "G-M23227CBF8"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firestore reference
const db = firebase.firestore();

// Fake logged-in user
const CURRENT_USER_PHONE = "9999999999";

