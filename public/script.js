import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, getDocs} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { deleteDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

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
const db = getFirestore(app);

window.showModal = function(id) {
    document.getElementById(id).style.display = 'block';
};

window.closeModal = function(id) {
    document.getElementById(id).style.display = 'none';
};

const flashcardSection = document.getElementById('flashcardSection');

document.getElementById('logolink').addEventListener('click', function(e) {
  e.preventDefault(); // Prevent default anchor behavior
  location.reload(); // Reload the page
});

onAuthStateChanged(auth, (user) => {
  const logoutBtn = document.getElementById('logoutBtn');
  const createBtn = document.getElementById('createBtn');
  const userDashboard = document.getElementById('userDashboard');
  const homepage = document.getElementById('homepage');

  if (user) {
      // User is logged in
      logoutBtn.style.display = 'inline-block';
      createBtn.style.display = 'inline-block';
      userDashboard.style.display = 'block';
      homepage.style.display = 'none';
      
      // Show welcome message with email username
      const username = user.email.split('@')[0];
      document.getElementById('welcomeMessage').textContent = `Welcome, ${username}!`;
      
      // Load user's subjects
      loadUserSubjects(user.uid);
  } else {
      // User is logged out
      logoutBtn.style.display = 'none';
      createBtn.style.display = 'none';
      userDashboard.style.display = 'none';
      homepage.style.display = 'flex';
  }
});


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
        showErrorPopup("Signup Error: " + error.message);
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

window.logout = function() {
  signOut(auth).then(() => {
      showPopup("Logged out successfully.");
  }).catch((error) => {
      showPopup("Error: " + error.message);
  });
}

window.addFlashcard = async function() {
  const subject = document.getElementById('subjectInput').value.trim();
  const question = document.getElementById('questionInput').value.trim();
  const answer = document.getElementById('answerInput').value.trim();
  const user = auth.currentUser;

  if (!user || !subject || !question || !answer) {
      showErrorPopup("Please fill in all fields.");
      return;
  }

  try {
      await addDoc(collection(db, "flashcards"), {
          uid: user.uid,
          subject,
          question,
          answer,
          createdAt: new Date()
      });
      showPopup("Flashcard saved!");

      document.getElementById('subjectInput').value = "";
      document.getElementById('questionInput').value = "";
      document.getElementById('answerInput').value = "";
      closeModal('flashcardModal');

      loadUserSubjects(auth.currentUser.uid);
  } catch (error) {
      showErrorPopup("Error saving flashcard.");
      console.error(error);
  }
};

async function loadUserSubjects(userId) {
  try {
      const q = query(collection(db, "flashcards"), where("uid", "==", userId));
      const snapshot = await getDocs(q);
      
      const subjects = new Set();
      snapshot.forEach(doc => {
          subjects.add(doc.data().subject);
      });
      
      displaySubjects([...subjects]);
  } catch (error) {
      console.error("Error loading subjects:", error);
      showErrorPopup("Couldn't load your subjects");

      if (error.code === 'permission-denied') {
        showErrorPopup("Session expired. Please log in again.");
        logout(); // Force logout if permissions are denied
  }
}}

function displaySubjects(subjects) {
  const container = document.getElementById('subjectsContainer');
  container.innerHTML = '';
  
  if (subjects.length === 0) {
      container.innerHTML = '<p>No subjects yet. Create your first flashcard!</p>';
      return;
  }
  
  subjects.forEach(subject => {
      const subjectElement = document.createElement('div');
      subjectElement.className = 'subject-item';
      subjectElement.innerHTML = `
            ${subject}
            <div class="menu-dots">⋮</div>
            <div class="delete-option">
                <span class="delete-btn" data-subject="${subject}">Delete</span>
            </div>
        `;
      container.appendChild(subjectElement);
      
      const dots = subjectElement.querySelector('.menu-dots');
      const deleteOption = subjectElement.querySelector('.delete-option');
      
      dots.addEventListener('click', (e) => {
          e.stopPropagation();
          
          document.querySelectorAll('.delete-option').forEach(opt => {
              if (opt !== deleteOption) opt.classList.remove('show');
          });
          deleteOption.classList.toggle('show');
      });
      
      const deleteBtn = subjectElement.querySelector('.delete-btn');
      deleteBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (confirm(`Delete "${subject}" and all its flashcards?`)) {
              try {
                  await deleteSubject(subject);
                  showPopup("Subject deleted");
                  loadUserSubjects(auth.currentUser.uid);
              } catch (error) {
                  showErrorPopup("Delete failed");
                  console.error(error);
              }
          }
          deleteOption.classList.remove('show');
      });
  });
  
  // Close menus when clicking elsewhere
  document.addEventListener('click', () => {
      document.querySelectorAll('.delete-option').forEach(opt => {
          opt.classList.remove('show');
      });
  });
}

async function deleteSubject(subject) {
  const q = query(
      collection(db, "flashcards"),
      where("uid", "==", auth.currentUser.uid),
      where("subject", "==", subject)
  );
  
  const snapshot = await getDocs(q);
  const deletePromises = [];
  snapshot.forEach(doc => {
      deletePromises.push(deleteDoc(doc.ref));
  });
  
  await Promise.all(deletePromises);
}
