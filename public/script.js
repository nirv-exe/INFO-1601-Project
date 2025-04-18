import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, getDocs, orderBy, updateDoc} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
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

const toggleSignupButton = document.getElementById('showSignupPasswordBtn');
const toggleLoginButton = document.getElementById('showLoginPasswordBtn');

window.showModal = function(id) {
    document.getElementById(id).style.display = 'block';
};

window.closeModal = function(id) {
    document.getElementById(id).style.display = 'none';
n 
    if (toggleLoginButton.textContent === "Hide" || toggleSignupButton.textContent === "Hide")
    {    
        togglePasswordVisibility();
    }

    document.getElementById('loginPassword').value = "";
    document.getElementById('signupPassword').value = "";
};

document.getElementById('logolink').addEventListener('click', function(e) {
  e.preventDefault(); // Prevent default anchor behavior
  location.reload(); // Reload the page
});

onAuthStateChanged(auth, (user) => {
  const logoutBtn = document.getElementById('logoutBtn');
  const createBtn = document.getElementById('createBtn');
  const userDashboard = document.getElementById('userDashboard');
  const homepage = document.getElementById('homepage');
  const searchBar = document.getElementById('searchSub');

  if (user) {
      // User is logged in
      logoutBtn.style.display = 'inline-block';
      createBtn.style.display = 'inline-block';
      userDashboard.style.display = 'block';
      homepage.style.display = 'none';
      searchBar.style.display = 'inline-block'; 
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
      searchBar.style.display = 'none'; 
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

window.togglePasswordVisibility = function() {
    const signupPassword = document.getElementById('signupPassword');
    const loginPassword = document.getElementById('loginPassword');
    const toggleSignupButton = document.getElementById('showSignupPasswordBtn');
    const toggleLoginButton = document.getElementById('showLoginPasswordBtn');

    if ((signupPassword  || loginPassword) && (toggleSignupButton || toggleLoginButton)) {
        if (signupPassword.type === "password") {
            signupPassword.type = "text";
            toggleSignupButton.textContent = "Hide";
        } else {
            signupPassword.type = "password";
            toggleSignupButton.textContent = "Show";
        }

        if (loginPassword.type === "password") {
            loginPassword.type = "text";
            toggleLoginButton.textContent = "Hide";
        } else {
            loginPassword.type = "password";
            toggleLoginButton.textContent = "Show";
        }
    } else {
        console.error("Password input or toggle button not found.");
    }
};

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

async function updateSubjectName(oldSubject, newSubject) {
    const q = query(
        collection(db, "flashcards"),
        where("uid", "==", auth.currentUser.uid),
        where("subject", "==", oldSubject)
    );

    const snapshot = await getDocs(q);
    const updatePromises = [];

    snapshot.forEach(doc => {
        updatePromises.push(updateDoc(doc.ref, { subject: newSubject }));
    });

    await Promise.all(updatePromises);
}

window.searchSubject = async function () {
    const keyword = document.getElementById('searchKey').value.toLowerCase().trim();
    const user = auth.currentUser;

    if (!user || !keyword) return;

    const q = query(collection(db, "flashcards"), where("uid", "==", user.uid));
    const snapshot = await getDocs(q);

    const results = [];
    snapshot.forEach(doc => {
        const data = doc.data();
        if (data.subject.toLowerCase().includes(keyword)) {
            results.push({
                id: doc.id,
                question: data.question,
                answer: data.answer,
                subject: data.subject
            });
        }
    });

    if (results.length > 0) {
        showPopup("Flashcards Found!")
        displayFlashcards(results[0].subject, results);
        document.getElementById('userDashboard').style.display = 'none';
        document.getElementById('flashcardsView').style.display = 'block';
    } else {
        showErrorPopup("No matching subjects found.");
    }
};

async function displaySubjects(subjects) {
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

    try {
        const userId = auth.currentUser.uid;
        const q = query(
            collection(db, "flashcards"),
            where("uid", "==", userId),
            orderBy("createdAt", "asc")
        );

        const snapshot = await getDocs(q);
        const orderedSubjects = new Map();

        snapshot.forEach(doc => {
            const subject = doc.data().subject;
            if (!orderedSubjects.has(subject)) {
                orderedSubjects.set(subject, true);
            }
        });

        [...orderedSubjects.keys()].forEach(subject => {
            const subjectElement = document.createElement('div');
            subjectElement.className = 'subject-item';
            subjectElement.innerHTML = `
                <span class="subject-name">${subject}</span>
                <div class="menu-dots">⋮</div>
                <div class="subject-menu-dropdown">
                    <span class="edit-subject-btn" data-subject="${subject}">Edit</span>
                    <span class="delete-subject-btn" data-subject="${subject}">Delete</span>
                </div>
            `;
            container.appendChild(subjectElement);

            const subjectName = subjectElement.querySelector('.subject-name');
            if (subjectName) {
                subjectName.style.cursor = 'pointer';
                subjectName.addEventListener('click', () => viewFlashcards(subject));
            }

            const menuBtn = subjectElement.querySelector('.menu-dots');
            const dropdown = subjectElement.querySelector('.subject-menu-dropdown');
            
            if (menuBtn && dropdown) {
                menuBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    document.querySelectorAll('.subject-menu-dropdown').forEach(d => {
                        if (d !== dropdown) d.classList.remove('show');
                    });
                    dropdown.classList.toggle('show');
                });
            }

            document.addEventListener('click', () => {
                document.querySelectorAll('.subject-menu-dropdown').forEach(d => d.classList.remove('show'));
            });

            const deleteBtn = subjectElement.querySelector('.delete-subject-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showDeleteConfirmation(subject);
                    if (dropdown) dropdown.classList.remove('show');
                });
            }

            const editSubjectBtn = subjectElement.querySelector('.edit-subject-btn');
            if (editSubjectBtn) {
                editSubjectBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    document.getElementById('editSubjectInput').value = subject;
                    document.getElementById('editSubjectModal').style.display = 'block';

                    document.getElementById('saveSubjectBtn').onclick = async () => {
                        const newSubject = document.getElementById('editSubjectInput').value;

                        try {
                            await updateSubjectName(subject, newSubject);
                            showPopup("Subject updated successfully");
                            closeModal('editSubjectModal');
                            loadUserSubjects(auth.currentUser.uid); // Refresh the list
                        } catch (error) {
                            showErrorPopup("Error updating subject");
                            console.error(error);
                        }
                    };
                });
            }
        });
    } catch (error) {
        console.error("Error loading subjects:", error);
        showErrorPopup("Couldn't load your subjects");
    }
}

let currentSubjectView = null;

async function viewFlashcards(subject) {
    currentSubjectView = subject;
    try {
        document.getElementById('userDashboard').style.display = 'none';
        document.getElementById('flashcardsView').style.display = 'block';
        
        const q = query(
            collection(db, "flashcards"),
            where("uid", "==", auth.currentUser.uid),
            where("subject", "==", subject),
            orderBy("createdAt", "asc")
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
        showPopup("Successfully loaded Flashcards!");
    } catch (error) {
        console.error("Error loading flashcards:", error);
        showErrorPopup("Error loading flashcards");
    }
}

window.openFlashcardModal = function () {
    if (currentSubjectView) {
        document.getElementById('subjectInput').value = currentSubjectView;
        document.getElementById('subjectInput').disabled = true;
    } else {
        document.getElementById('subjectInput').value = '';
        document.getElementById('subjectInput').disabled = false;
    }

    showModal('flashcardModal');
};

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
                    <span class="edit-flashcard" data-id="${flashcard.id}">Edit</span>
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

            const editBtn = card.querySelector('.edit-flashcard');
            if (editBtn) {
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    document.getElementById('editQuestionInput').value = flashcard.question;
                    document.getElementById('editAnswerInput').value = flashcard.answer;
                    document.getElementById('editFlashcardModal').style.display = 'block';

                    document.getElementById('saveEditBtn').onclick = async () => {
                        const newQuestion = document.getElementById('editQuestionInput').value;
                        const newAnswer = document.getElementById('editAnswerInput').value;

                        try {
                            const flashcardRef = doc(db, "flashcards", flashcard.id);
                            await updateDoc(flashcardRef, {
                                question: newQuestion,
                                answer: newAnswer
                            });
                            showPopup("Flashcard updated successfully");
                            closeModal('editFlashcardModal');
                            viewFlashcards(subject); // Refresh the view
                        } catch (error) {
                            showErrorPopup("Error updating flashcard");
                            console.error(error);
                        }
                    };
                });
            }
        });
    }
    
    // Add back button handler
    document.getElementById('backToSubjects').addEventListener('click', () => {
        document.getElementById('flashcardsView').style.display = 'none';
        document.getElementById('userDashboard').style.display = 'block';
        document.getElementById('searchKey').value = '';
        document.getElementById('studySummaryWrapper').remove();
        currentSubjectView = null;
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

// Study Mode Variables
let currentStudyDeck = [];
let currentCardIndex = 0;
let correctAnswers = 0;
let wrongAnswers = 0;
let studySessionCards = [];

// Initialize Study Mode
document.getElementById('studyBtn').addEventListener('click', startStudySession);

function startStudySession() {
    const subject = document.getElementById('currentSubjectTitle').textContent.replace('Subject: ', '');
    loadStudyDeck(subject);
    document.getElementById('studySummaryWrapper').remove();
}

async function loadStudyDeck(subject) {
    try {
        const q = query(
            collection(db, "flashcards"),
            where("uid", "==", auth.currentUser.uid),
            where("subject", "==", subject)
        );
        
        const snapshot = await getDocs(q);
        currentStudyDeck = [];
        
        snapshot.forEach(doc => {
            currentStudyDeck.push({
                id: doc.id,
                question: doc.data().question,
                answer: doc.data().answer
            });
        });

        if (currentStudyDeck.length === 0) {
            showErrorPopup("No flashcards found for this subject");
            return;
        }

        // Shuffle the deck for study
        studySessionCards = currentStudyDeck.slice().sort(() => Math.random() - 0.5);
        currentCardIndex = 0;
        correctAnswers = 0;
        wrongAnswers = 0;

        // Show study mode
        document.getElementById('flashcardsView').style.display = 'none';
        document.getElementById('studyMode').style.display = 'block';
        document.getElementById('currentSubject').textContent = subject;

        loadStudyCard();
    } catch (error) {
        console.error("Error loading study deck:", error);
        showErrorPopup("Error loading flashcards");
    }
}

const flashcard = document.getElementById('studyFlashcard');
const studyAnswer = document.getElementById('studyAnswer');

flashcard.addEventListener('click', () => {
    flashcard.classList.toggle('flipped');
    
    // Toggle answer visibility
    if (flashcard.classList.contains('flipped')) {
        studyAnswer.style.display = 'flex';
    } else {
        studyAnswer.style.display = 'none';
    }
});   

function loadStudyCard() {
    if (studySessionCards.length === 0) return;

    const card = studySessionCards[currentCardIndex];
    document.getElementById('studyQuestion').textContent = card.question;
    document.getElementById('studyAnswer').textContent = card.answer;
    document.getElementById('userAnswerInput').value = '';
    document.getElementById('answerFeedback').textContent = '';
    document.getElementById('answerFeedback').className = '';
    document.getElementById('cardPosition').textContent = `${currentCardIndex + 1}/${studySessionCards.length}`;
    document.getElementById('studyStats').textContent = `✅ ${correctAnswers} ❌ ${wrongAnswers}`;
    document.getElementById('studyFlashcard').classList.remove('flipped');

    // Focus input
    document.getElementById('userAnswerInput').focus();

    studyAnswer.style.display = 'none';

    // Prevent clicks within input/buttons from flipping the card
    const answerInput = document.getElementById('userAnswerInput');
    const checkAnswerBtn = document.getElementById('checkAnswerBtn');
    const prevCardBtn = document.getElementById('prevCardBtn');
    const nextCardBtn = document.getElementById('nextCardBtn');
    const endStudyBtn = document.getElementById('endStudyBtn');

    answerInput.addEventListener('click', (event) => event.stopPropagation());
    checkAnswerBtn.addEventListener('click', (event) => event.stopPropagation());
    prevCardBtn.addEventListener('click', (event) => event.stopPropagation());
    nextCardBtn.addEventListener('click', (event) => event.stopPropagation());
    endStudyBtn.addEventListener('click', (event) => event.stopPropagation());
}

// Normalize answer for comparison
function normalizeAnswer(answer) {
    return answer.toLowerCase()
        .replace(/[^\w\s]|_/g, '') // Remove punctuation
        .replace(/\s+/g, ' ')      // Collapse multiple spaces
        .trim();                   // Trim whitespace
}

// Check user's answer
document.getElementById('checkAnswerBtn').addEventListener('click', checkAnswer);
document.getElementById('userAnswerInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkAnswer();
});

const nextButton = document.getElementById('nextCardBtn');
nextButton.disabled = false;

function checkAnswer() {
    const checkAnswerBtn = document.getElementById('checkAnswerBtn');
    const userAnswer = document.getElementById('userAnswerInput').value;
    const correctAnswer = studySessionCards[currentCardIndex].answer;
    const feedback = document.getElementById('answerFeedback');

    if(userAnswer !== ""){  
        checkAnswerBtn.disabled = true;
        flashcard.classList.toggle('flipped');
    }
        
    // Toggle answer visibility
    if (flashcard.classList.contains('flipped')) {
        studyAnswer.style.display = 'flex';
    } else {
        studyAnswer.style.display = 'none';
    }

    if (userAnswer === "")
    {
        feedback.textContent = "⚠️ Cannot submit a blank answer!";
        feedback.className = "feedback-message feedback-incorrect";
        
    }
    else if (normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer)) {
        feedback.textContent = "✅ Correct!";
        feedback.className = "feedback-message feedback-correct";
        if (currentCardIndex <= studySessionCards.length - 1)
        {    
            correctAnswers++;
            nextButton.disabled = true;
            setTimeout(() => {
                if (currentCardIndex < studySessionCards.length - 1) {
                    currentCardIndex++;
                    nextButton.disabled = false;
                    checkAnswerBtn.disabled = false;
                    loadStudyCard();
                } else {
                    showPopup(`Study session complete! Score: ${correctAnswers}/${studySessionCards.length}`);
                    endStudySession();
                }
            }, 1500)
        }
    } else {
        feedback.textContent = `❌ Incorrect! The answer was: ${correctAnswer}`;
        feedback.className = "feedback-message feedback-incorrect";
        wrongAnswers++;
        nextButton.disabled = true;
        setTimeout(() => {
            if (currentCardIndex < studySessionCards.length - 1) {
                currentCardIndex++;
                nextButton.disabled = false;
                checkAnswerBtn.disabled = false;
                loadStudyCard();
            } else {
                showPopup(`Study session complete! Score: ${correctAnswers}/${studySessionCards.length}`);
                endStudySession();
            }
        }, 3000)
    }

    document.getElementById('studyStats').textContent = `✅ ${correctAnswers} ❌ ${wrongAnswers}`;
    //document.getElementById('studyAnswer').style.display = 'none';
}

// Navigation buttons
document.getElementById('prevCardBtn').addEventListener('click', () => {
    if (currentCardIndex > 0) {
        currentCardIndex--;
        loadStudyCard();
    }
});


document.getElementById('nextCardBtn').addEventListener('click', () => { 
    if (currentCardIndex < studySessionCards.length - 1) {
        currentCardIndex++;
        loadStudyCard();
    } else {
        showPopup(`Study session complete! Score: ${correctAnswers}/${studySessionCards.length}`);
        endStudySession();
    }
});



// End study session
document.getElementById('endStudyBtn').addEventListener('click', endStudySession);

function endStudySession() {
    document.getElementById('studyMode').style.display = 'none';
    document.getElementById('flashcardsView').style.display = 'block';

    setTimeout( () => {
        displayStudySummary();
    }, 150);

    const score = (correctAnswers / studySessionCards.length) * 100;

    if (score < 50) {
        showErrorPopup(`Study session complete! Score: ${correctAnswers}/${studySessionCards.length} (${score.toFixed(2)}%). Try again!`, false);
    } else {
        showPopup(`Study session complete! Score: ${correctAnswers}/${studySessionCards.length} (${score.toFixed(2)}%).`);
    }
}

function displayStudySummary() {
    const summaryContainer = document.createElement('div');
    
    summaryContainer.innerHTML = `
        <div>
            <h2>Study Session Summary</h2>
            <p>Total Cards: ${studySessionCards.length}</p>
            <p>Correct: ${correctAnswers}</p>
            <p>Wrong: ${wrongAnswers}</p>
            <button id="closeSummaryBtn" class="closeBtn">Close</button>
        </div>
    `;

    const summaryWrapper = document.createElement('div');
    summaryWrapper.id = 'studySummaryWrapper';
    summaryWrapper.appendChild(summaryContainer);
    document.querySelector('.main').appendChild(summaryWrapper);
    closeBtn();
}

async function closeBtn() {
    const summaryWrapper = document.getElementById('studySummaryWrapper');
    const closeSummaryBtn = document.getElementById('closeSummaryBtn');

    if (!summaryWrapper || !closeSummaryBtn) return;

    closeSummaryBtn.addEventListener('click', () => {
        summaryWrapper.remove();
    });

    // Automatically close the summary screen after 10 seconds
    setTimeout(() => {
        if (summaryWrapper) {
            summaryWrapper.remove();
        }
    }, 5000); 
}