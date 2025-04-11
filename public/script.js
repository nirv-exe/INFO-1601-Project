import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, getDocs} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { deleteDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { doc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

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
      document.getElementById('flashcardsView').style.display = 'none';
      
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
      document.getElementById('flashcardsView').style.display = 'none';
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

function showConfirmModal(message, onConfirm) {
    const modal = document.getElementById('confirmModal');
    const modalMessage = document.getElementById('confirmModalMessage');
    const confirmButton = document.getElementById('confirmModalYes');
    const cancelButton = document.getElementById('confirmModalNo');

    // Set the message
    modalMessage.textContent = message;

    // Show the modal
    modal.style.display = 'block';

    // Handle the "Yes" button
    confirmButton.onclick = () => {
        modal.style.display = 'none';
        onConfirm(); // Execute the confirmation action
    };

    // Handle the "No" button
    cancelButton.onclick = () => {
        modal.style.display = 'none';
    };
}

window.addFlashcard = async function() {
  const subject = document.getElementById('subjectInput').value.trim();
  const question = document.getElementById('questionInput').value.trim();
  const answer = document.getElementById('answerInput').value.trim();
  const user = auth.currentUser;

  const addButton = document.getElementById('addFlashcardButton')

  if (!user || !subject || !question || !answer) {
      showErrorPopup("Please fill in all fields.");
      return;
  }

  addButton.disabled = true;

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
      const flashcardsView = document.getElementById('flashcardsView');
        if (flashcardsView.style.display === 'block') {
            // If the gallery is open, refresh it
            viewFlashcards(subject);
        }
  } catch (error) {
      showErrorPopup("Error saving flashcard.");
      console.error(error);
  }finally{
    addButton.disabled = false;
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

function showDeleteConfirmation(subject) {
    showConfirmModal(`Are you sure you want to delete the subject "${subject}" and all its flashcards?`, async () => {
        try {
            await deleteSubject(subject);
            showPopup("Subject deleted successfully");
            loadUserSubjects(auth.currentUser.uid); // Refresh the list
        } catch (error) {
            showErrorPopup("Error deleting subject");
            console.error(error);
        }
    });
}

function displaySubjects(subjects) {
    const container = document.getElementById('subjectsContainer');
    if (!container) {
        console.error("Subjects container not found!");
        return;
    }
    
    container.innerHTML = '';
    
    if (subjects.length === 0) {
        container.innerHTML = '<p>No subjects yet. Create your first flashcard!</p>';
        return;
    }
    
    subjects.forEach(subject => {
        const subjectElement = document.createElement('div');
        subjectElement.className = 'subject-item';
        subjectElement.innerHTML = `
            <span class="subject-name">${subject}</span>
            <div class="menu-dots">⋮</div>
            <div class="delete-option">
                <span class="delete-btn" data-subject="${subject}">Delete</span>
            </div>
        `;
        container.appendChild(subjectElement);
        
        // Add click handlers safely
        const subjectName = subjectElement.querySelector('.subject-name');
        if (subjectName) {
            subjectName.style.cursor = 'pointer';
            subjectName.addEventListener('click', () => viewFlashcards(subject));
        }
        
        const menuBtn = subjectElement.querySelector('.menu-dots');
        const dropdown = subjectElement.querySelector('.delete-option');
        
        if (menuBtn && dropdown) {
            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.delete-option').forEach(d => {
                    if (d !== dropdown) d.classList.remove('show');
                });
                dropdown.classList.toggle('show');
            });
        }
        
        const deleteBtn = subjectElement.querySelector('.delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showDeleteConfirmation(subject);
                if (dropdown) dropdown.classList.remove('show');
            });
        }
    });
}

async function viewFlashcards(subject) {
    try {
        document.getElementById('userDashboard').style.display = 'none';
        document.getElementById('flashcardsView').style.display = 'block';
        
        const q = query(
            collection(db, "flashcards"),
            where("uid", "==", auth.currentUser.uid),
            where("subject", "==", subject)
        );
        
        const snapshot = await getDocs(q);
        const flashcards = [];
        
        snapshot.forEach(function(doc) {
            var flashcardData = doc.data();
            flashcards.push({
                id: doc.id,
                question: flashcardData.question,
                answer: flashcardData.answer,
                subject: flashcardData.subject
            });
        });
        
        displayFlashcards(subject, flashcards);
    } catch (error) {
        console.error("Error loading flashcards:", error);
        showErrorPopup("Error loading flashcards");
    }
}

function displayFlashcards(subject, flashcards) {
    const container = document.getElementById('flashcardsGallery');
    const title = document.getElementById('currentSubjectTitle');
    
    title.textContent = `Subject: ${subject}`;
    container.innerHTML = '';
    
    if (flashcards.length === 0) {
        container.innerHTML = '<p>No flashcards found for this subject.</p>';
    } else {
        flashcards.forEach(flashcard => {
            const card = document.createElement('div');
            card.className = 'flashcard-card';
            card.innerHTML = `
                <div class="flashcard-question">Question: ${flashcard.question}?</div>
                <div class="flashcard-answer">${flashcard.answer}</div>
                <div class="flashcard-menu">⋮</div>
                <div class="flashcard-menu-dropdown">
                    <span class="delete-flashcard" data-id="${flashcard.id}">Delete</span>
                </div>
            `;
            container.appendChild(card);
            
            const menu = card.querySelector('.flashcard-menu');
            const dropdown = card.querySelector('.flashcard-menu-dropdown');
            
            if (menu && dropdown) {
                menu.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // Hide all other dropdowns
                    document.querySelectorAll('.flashcard-menu-dropdown').forEach(d => {
                        if (d !== dropdown) d.classList.remove('show');
                    });
                    dropdown.classList.toggle('show');
                });
            }
            
            // Add delete handler
            const deleteBtn = card.querySelector('.delete-flashcard');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    showConfirmModal('Are you sure you want to delete this flashcard?', async () => {
                        try {
                            await deleteFlashcard(flashcard.id);
                            dropdown.classList.remove('show');
                            showPopup("Flashcard deleted successfully");
                            viewFlashcards(subject); // Refresh the view
                        } catch (error) {
                            showErrorPopup("Error deleting flashcard");
                            console.error(error);
                        }
                    });
                });
            }
        });
    }
    
    // Add back button handler
    document.getElementById('backToSubjects').addEventListener('click', () => {
        document.getElementById('flashcardsView').style.display = 'none';
        document.getElementById('userDashboard').style.display = 'block';
    });
}

async function deleteFlashcard(flashcardId) {
    try {
        await deleteDoc(doc(db, "flashcards", flashcardId));
        return true;
    } catch (error) {
        console.error("Error deleting flashcard:", error);
        throw error;
    }
}