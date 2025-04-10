import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

// Firebase config from your firebaseConfig.js
const firebaseConfig = {
  apiKey: "AIzaSyBQnclcqQXfnqZekRmc5kmY6ZgUlfj3zQI",
  authDomain: "cramio.firebaseapp.com",
  projectId: "cramio",
  storageBucket: "cramio.firebasestorage.app",
  messagingSenderId: "282798341002",
  appId: "1:282798341002:web:6434b8fb9c1163dca0a673"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

window.showModal = function(id) {
    document.getElementById(id).style.display = 'block';
};

window.closeModal = function(id) {
    document.getElementById(id).style.display = 'none';
};

function showPopup(message) {
    const popup = document.getElementById('popup');
    popup.textContent = message;
    popup.classList.add('show');

    setTimeout(() => {
        popup.classList.remove('show');
    }, 3000); // Hide after 3 seconds
}

function showErrorPopup(message) {
    const popup = document.getElementById('popup-error');
    popup.textContent = message;
    popup.classList.add('show');

    setTimeout(() => {
        popup.classList.remove('show');
    }, 3000); // Hide after 3 seconds
}

window.signup = function() {
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        showPopup("Signup successful!");
        closeModal('signupModal');
      })
      .catch((error) => {
        showErrorPopup("Signup Error!");
      });
};

window.login = function() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        showPopup("Login successful!");
        closeModal('loginModal');
      })
      .catch((error) => {
        showErrorPopup("Invalid Login Information!");
      });
};
