// Dashboard.js - Common dashboard functionality for EcoVators

// Check if user is authenticated
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication state
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            // User is signed in
            loadUserData(user);
            setupDashboard();
        } else {
            // No user is signed in, redirect to login
            window.location.href = '../../auth/login.html';
        }
    });
});

// Load user data from Firestore
function loadUserData(user) {
    const userRef = firebase.firestore().collection('users').doc(user.uid);
    
    userRef.get().then((doc) => {
        if (doc.exists) {
            const userData = doc.data();
            
            // Update user info in sidebar
            document.getElementById('user-name').textContent = `${userData.firstName} ${userData.lastName}`;
            document.getElementById('user-school').textContent = userData.school || '';
            
            // Update welcome message
            document.getElementById('welcome-name').textContent = userData.firstName;
            
            // Update profile avatar if exists
            if (userData.photoURL) {
                document.getElementById('user-avatar').src = userData.photoURL;
                document.getElementById('profile-avatar').src = userData.photoURL;
                document.getElementById('composer-avatar').src = userData.photoURL;
                document.getElementById('comment-avatar').src = userData.photoURL;
            }
            
            // Update gamification stats
            document.getElementById('xp-points').textContent = `${userData.xpPoints || 0} XP`;
            document.getElementById('carbon-credits').textContent = `${userData.carbonCredits || 0} CC`;
            document.getElementById('current-streak').textContent = `${userData.streak || 0} days`;
            document.getElementById('total-xp').textContent = `${userData.xpPoints || 0} points`;
            document.getElementById('total-cc').textContent = `${userData.carbonCredits || 0} credits`;
            document.getElementById('total-badges').textContent = `${userData.badges?.length || 0} earned`;
            
            // Update profile stats
            document.getElementById('profile-xp').textContent = userData.xpPoints || 0;
            document.getElementById('profile-cc').textContent = userData.carbonCredits || 0;
            document.getElementById('profile-badges').textContent = userData.badges?.length || 0;
            document.getElementById('profile-streak').textContent = `${userData.streak || 0} days`;
            
            // Fill profile form
            if (document.getElementById('profile-form')) {
                document.getElementById('profile-first-name').value = userData.firstName || '';
                document.getElementById('profile-last-name').value = userData.lastName || '';
                document.getElementById('profile-email').value = userData.email || user.email;
                document.getElementById('profile-phone').value = userData.phone || '';
                document.getElementById('profile-school').value = userData.school || '';
                document.getElementById('profile-grade').value = userData.grade || '';
                document.getElementById('profile-village').value = userData.village || '';
                document.getElementById('profile-district').value = userData.district || '';
                document.getElementById('profile-state').value = userData.state || '';
            }
            
            // Load badges if they exist
            if (userData.badges && userData.badges.length > 0) {
                loadBadges(userData.badges);
            }
            
            // Setup real-time listeners for dynamic content
            setupRealtimeListeners(user.uid);
        } else {
            console.log("No user data found!");
        }
    }).catch((error) => {
        console.error("Error getting user data:", error);
    });
}

// Setup dashboard event listeners and functionality
function setupDashboard() {
    // Navigation menu functionality
    const navItems = document.querySelectorAll('.sidebar-nav li');
    const sections = document.querySelectorAll('.dashboard-section');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section');
            
            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            // Show selected section
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === sectionId) {
                    section.classList.add('active');
                }
            });
        });
    });
    
    // Notification bell functionality
    const notificationBell = document.querySelector('.notification-bell');
    const notificationPanel = document.getElementById('notification-panel');
    
    if (notificationBell && notificationPanel) {
        notificationBell.addEventListener('click', function() {
            notificationPanel.classList.toggle('active');
            loadNotifications();
        });
        
        const closeNotifications = document.querySelector('.close-notifications');
        if (closeNotifications) {
            closeNotifications.addEventListener('click', function() {
                notificationPanel.classList.remove('active');
            });
        }
    }
    
    // Chatbot toggle functionality
    const chatbotToggle = document.getElementById('chatbot-toggle');
    const chatbotContainer = document.getElementById('chatbot-container');
    
    if (chatbotToggle && chatbotContainer) {
        chatbotToggle.addEventListener('click', function() {
            chatbotContainer.classList.toggle('active');
        });
        
        const minimizeChatbot = document.querySelector('.minimize-chatbot');
        const closeChatbot = document.querySelector('.close-chatbot');
        
        if (minimizeChatbot) {
            minimizeChatbot.addEventListener('click', function() {
                chatbotContainer.classList.remove('active');
            });
        }
        
        if (closeChatbot) {
            closeChatbot.addEventListener('click', function() {
                chatbotContainer.classList.remove('active');
            });
        }
        
        // Chatbot send message functionality
        const chatbotInput = document.getElementById('chatbot-input');
        const sendChatbotMsg = document.querySelector('.send-chatbot-msg');
        const chatbotMessages = document.getElementById('chatbot-messages');
        
        if (chatbotInput && sendChatbotMsg && chatbotMessages) {
            sendChatbotMsg.addEventListener('click', function() {
                sendChatbotMessage();
            });
            
            chatbotInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    sendChatbotMessage();
                }
            });
        }
    }
    
    // Profile form submission
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            updateProfile();
        });
    }
    
    // Logout functionality
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            firebase.auth().signOut().then(() => {
                // Sign-out successful, redirect to login
                window.location.href = '../../auth/login.html';
            }).catch((error) => {
                // An error happened
                console.error("Logout error:", error);
            });
        });
    }
    
    // Language selector functionality
    const languageSelect = document.getElementById('language-select');
    if (languageSelect) {
        languageSelect.addEventListener('change', function() {
            changeLanguage(this.value);
        });
        
        // Set initial language from localStorage or default to English
        const currentLang = localStorage.getItem('ecovatorsLanguage') || 'en';
        languageSelect.value = currentLang;
    }
}

// Setup real-time listeners for dynamic content
function setupRealtimeListeners(userId) {
    // Listen for weekly goals updates
    firebase.firestore().collection('users').doc(userId)
        .collection('goals').where('status', '!=', 'completed')
        .onSnapshot((snapshot) => {
            updateWeeklyGoals(snapshot);
        });
    
    // Listen for upcoming events
    firebase.firestore().collection('events')
        .where('date', '>=', new Date())
        .orderBy('date', 'asc')
        .limit(5)
        .onSnapshot((snapshot) => {
            updateUpcomingEvents(snapshot);
        });
    
    // Listen for active challenges
    firebase.firestore().collection('challenges')
        .where('status', '==', 'active')
        .onSnapshot((snapshot) => {
            updateActiveChallenges(snapshot);
        });
    
    // Listen for notifications
    firebase.firestore().collection('users').doc(userId)
        .collection('notifications')
        .orderBy('timestamp', 'desc')
        .limit(10)
        .onSnapshot((snapshot) => {
            updateNotificationCount(snapshot);
        });
}

// Update weekly goals from Firestore data
function updateWeeklyGoals(snapshot) {
    const goalsContainer = document.getElementById('weekly-goals-container');
    if (!goalsContainer) return;
    
    if (snapshot.empty) {
        goalsContainer.innerHTML = '<p>No active goals. Complete challenges to earn more!</p>';
        return;
    }
    
    let goalsHTML = '';
    snapshot.forEach(doc => {
        const goal = doc.data();
        const progress = Math.round((goal.current / goal.target) * 100);
        
        goalsHTML += `
            <div class="goal">
                <div class="goal-info">
                    <h4>${goal.title}</h4>
                    <div class="progress-bar">
                        <div class="progress" style="width: ${progress}%;"></div>
                    </div>
                    <p>${goal.current}/${goal.target} completed</p>
                </div>
            </div>
        `;
    });
    
    goalsContainer.innerHTML = goalsHTML;
}

// Update upcoming events from Firestore data
function updateUpcomingEvents(snapshot) {
    const eventsContainer = document.getElementById('upcoming-events-container');
    if (!eventsContainer) return;
    
    if (snapshot.empty) {
        eventsContainer.innerHTML = '<p>No upcoming events. Check back later!</p>';
        return;
    }
    
    let eventsHTML = '';
    snapshot.forEach(doc => {
        const event = doc.data();
        const eventDate = event.date.toDate();
        const day = eventDate.getDate();
        const month = eventDate.toLocaleString('default', { month: 'short' });
        
        eventsHTML += `
            <div class="event">
                <div class="event-date">
                    <span class="day">${day}</span>
                    <span class="month">${month}</span>
                </div>
                <div class="event-info">
                    <h4>${event.title}</h4>
                    <p><i class="fas fa-map-marker-alt"></i> ${event.venue}</p>
                    <p><i class="fas fa-clock"></i> ${event.time}</p>
                </div>
                <button class="btn-register" data-event-id="${doc.id}">Register</button>
            </div>
        `;
    });
    
    eventsContainer.innerHTML = eventsHTML;
    
    // Add event listeners to register buttons
    const registerButtons = eventsContainer.querySelectorAll('.btn-register');
    registerButtons.forEach(button => {
        button.addEventListener('click', function() {
            const eventId = this.getAttribute('data-event-id');
            registerForEvent(eventId);
        });
    });
}

// Update active challenges from Firestore data
function updateActiveChallenges(snapshot) {
    const challengesContainer = document.getElementById('active-challenges-container');
    if (!challengesContainer) return;
    
    if (snapshot.empty) {
        challengesContainer.innerHTML = '<p>No active challenges. Check back later!</p>';
        return;
    }
    
    let challengesHTML = '';
    snapshot.forEach(doc => {
        const challenge = doc.data();
        const progress = challenge.userProgress ? Math.round(challenge.userProgress * 100) : 0;
        
        challengesHTML += `
            <div class="challenge">
                <div class="challenge-icon">
                    <i class="fas ${challenge.icon || 'fa-leaf'}"></i>
                </div>
                <div class="challenge-info">
                    <h4>${challenge.title}</h4>
                    <p>${challenge.description}</p>
                    <div class="progress-bar">
                        <div class="progress" style="width: ${progress}%;"></div>
                    </div>
                </div>
                <button class="btn-view" data-challenge-id="${doc.id}">${progress > 0 ? 'Continue' : 'Start'}</button>
            </div>
        `;
    });
    
    challengesContainer.innerHTML = challengesHTML;
    
    // Add event listeners to view buttons
    const viewButtons = challengesContainer.querySelectorAll('.btn-view');
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const challengeId = this.getAttribute('data-challenge-id');
            viewChallenge(challengeId);
        });
    });
}

// Update notification count
function updateNotificationCount(snapshot) {
    const notificationCount = document.querySelector('.notification-count');
    if (!notificationCount) return;
    
    const unreadCount = snapshot.docs.filter(doc => !doc.data().read).length;
    notificationCount.textContent = unreadCount;
    
    if (unreadCount > 0) {
        notificationCount.style.display = 'flex';
    } else {
        notificationCount.style.display = 'none';
    }
}

// Load notifications when notification panel is opened
function loadNotifications() {
    const notificationList = document.getElementById('notification-list');
    if (!notificationList) return;
    
    const userId = firebase.auth().currentUser.uid;
    
    firebase.firestore().collection('users').doc(userId)
        .collection('notifications')
        .orderBy('timestamp', 'desc')
        .limit(20)
        .get()
        .then((snapshot) => {
            if (snapshot.empty) {
                notificationList.innerHTML = '<p class="no-notifications">No notifications yet!</p>';
                return;
            }
            
            let notificationsHTML = '';
            snapshot.forEach(doc => {
                const notification = doc.data();
                const timestamp = notification.timestamp.toDate();
                const timeString = formatTimestamp(timestamp);
                const readClass = notification.read ? 'read' : 'unread';
                
                notificationsHTML += `
                    <div class="notification ${readClass}" data-notification-id="${doc.id}">
                        <div class="notification-icon">
                            <i class="fas ${notification.icon || 'fa-bell'}"></i>
                        </div>
                        <div class="notification-content">
                            <p>${notification.message}</p>
                            <span class="notification-time">${timeString}</span>
                        </div>
                    </div>
                `;
                
                // Mark as read in Firestore
                if (!notification.read) {
                    firebase.firestore().collection('users').doc(userId)
                        .collection('notifications').doc(doc.id)
                        .update({ read: true });
                }
            });
            
            notificationList.innerHTML = notificationsHTML;
            
            // Update notification count
            document.querySelector('.notification-count').textContent = '0';
            document.querySelector('.notification-count').style.display = 'none';
        })
        .catch((error) => {
            console.error("Error loading notifications:", error);
            notificationList.innerHTML = '<p class="error-message">Failed to load notifications. Please try again.</p>';
        });
}

// Format timestamp for notifications
function formatTimestamp(timestamp) {
    const now = new Date();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) {
        return 'Just now';
    } else if (minutes < 60) {
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (hours < 24) {
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (days < 7) {
        return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
        return timestamp.toLocaleDateString();
    }
}

// Load badges for profile
function loadBadges(badges) {
    const badgesGrid = document.getElementById('profile-badges-grid');
    if (!badgesGrid) return;
    
    let badgesHTML = '';
    badges.forEach(badge => {
        badgesHTML += `
            <div class="badge">
                <img src="../../assets/badges/${badge.icon}" alt="${badge.name} Badge">
                <h4>${badge.name}</h4>
                <p>${badge.description}</p>
            </div>
        `;
    });
    
    badgesGrid.innerHTML = badgesHTML;
}

// Update user profile
function updateProfile() {
    const userId = firebase.auth().currentUser.uid;
    const profileData = {
        firstName: document.getElementById('profile-first-name').value,
        lastName: document.getElementById('profile-last-name').value,
        phone: document.getElementById('profile-phone').value,
        school: document.getElementById('profile-school').value,
        grade: document.getElementById('profile-grade').value,
        village: document.getElementById('profile-village').value,
        district: document.getElementById('profile-district').value,
        state: document.getElementById('profile-state').value,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    firebase.firestore().collection('users').doc(userId)
        .update(profileData)
        .then(() => {
            // Show success message
            alert('Profile updated successfully!');
            
            // Update sidebar display
            document.getElementById('user-name').textContent = `${profileData.firstName} ${profileData.lastName}`;
            document.getElementById('user-school').textContent = profileData.school;
            document.getElementById('welcome-name').textContent = profileData.firstName;
        })
        .catch((error) => {
            console.error("Error updating profile:", error);
            alert('Failed to update profile. Please try again.');
        });
}

// Register for an event
function registerForEvent(eventId) {
    const userId = firebase.auth().currentUser.uid;
    
    firebase.firestore().collection('events').doc(eventId)
        .get()
        .then((doc) => {
            if (doc.exists) {
                const eventData = doc.data();
                
                // Add user to event participants
                firebase.firestore().collection('events').doc(eventId)
                    .collection('participants').doc(userId)
                    .set({
                        userId: userId,
                        registeredAt: firebase.firestore.FieldValue.serverTimestamp()
                    })
                    .then(() => {
                        // Add event to user's registered events
                        return firebase.firestore().collection('users').doc(userId)
                            .collection('registeredEvents').doc(eventId)
                            .set({
                                eventId: eventId,
                                title: eventData.title,
                                date: eventData.date,
                                venue: eventData.venue,
                                registeredAt: firebase.firestore.FieldValue.serverTimestamp()
                            });
                    })
                    .then(() => {
                        alert(`Successfully registered for ${eventData.title}!`);
                        
                        // Update button to show registered
                        const registerBtn = document.querySelector(`.btn-register[data-event-id="${eventId}"]`);
                        if (registerBtn) {
                            registerBtn.textContent = 'Registered';
                            registerBtn.disabled = true;
                            registerBtn.classList.add('registered');
                        }
                    })
                    .catch((error) => {
                        console.error("Error registering for event:", error);
                        alert('Failed to register for event. Please try again.');
                    });
            } else {
                console.error("Event not found");
                alert('Event not found. Please try again.');
            }
        })
        .catch((error) => {
            console.error("Error getting event:", error);
            alert('Failed to register for event. Please try again.');
        });
}

// View challenge details
function viewChallenge(challengeId) {
    // Redirect to challenge detail page
    window.location.href = `../challenges/detail.html?id=${challengeId}`;
}

// Send chatbot message
function sendChatbotMessage() {
    const chatbotInput = document.getElementById('chatbot-input');
    const chatbotMessages = document.getElementById('chatbot-messages');
    
    if (!chatbotInput || !chatbotMessages) return;
    
    const message = chatbotInput.value.trim();
    if (!message) return;
    
    // Add user message to chat
    chatbotMessages.innerHTML += `
        <div class="user-message">
            <div class="message-content">
                <p>${message}</p>
            </div>
        </div>
    `;
    
    // Clear input
    chatbotInput.value = '';
    
    // Scroll to bottom
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    
    // Show typing indicator
    chatbotMessages.innerHTML += `
        <div class="bot-message typing-indicator" id="typing-indicator">
            <div class="message-content">
                <p><i>EcoBot is typing...</i></p>
            </div>
        </div>
    `;
    
    // Process message and get response
    processChatbotMessage(message);
}

// Process chatbot message and generate response
function processChatbotMessage(message) {
    // Simulate AI processing delay
    setTimeout(() => {
        const chatbotMessages = document.getElementById('chatbot-messages');
        const typingIndicator = document.getElementById('typing-indicator');
        
        if (!chatbotMessages || !typingIndicator) return;
        
        // Remove typing indicator
        typingIndicator.remove();
        
        // Generate response based on keywords
        let response = '';
        
        if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
            response = "Hello! How can I help you with your environmental journey today?";
        } else if (message.toLowerCase().includes('challenge')) {
            response = "We have various environmental challenges available! Check out the Challenges section to participate in quizzes, activities, and more.";
        } else if (message.toLowerCase().includes('badge') || message.toLowerCase().includes('reward')) {
            response = "You can earn badges by completing challenges and environmental activities. Each badge represents your achievement in different environmental areas!";
        } else if (message.toLowerCase().includes('point') || message.toLowerCase().includes('xp')) {
            response = "XP points are earned through active participation. Complete challenges, attend events, and engage with the community to earn more points!";
        } else if (message.toLowerCase().includes('carbon') || message.toLowerCase().includes('credit')) {
            response = "Carbon credits represent your positive environmental impact. Earn them by reducing your carbon footprint through various activities and challenges.";
        } else if (message.toLowerCase().includes('event')) {
            response = "Check the Events section to see upcoming environmental activities in your area. You can register and participate to make a real-world impact!";
        } else if (message.toLowerCase().includes('tree') || message.toLowerCase().includes('plant')) {
            response = "Tree planting is one of our core activities! Join upcoming planting events or use the Space Allocation tool to plan your own planting initiative.";
        } else {
            response = "I'm here to help with any questions about environmental activities, challenges, or how to use the EcoVators platform. Could you please provide more details about what you're looking for?";
        }
        
        // Add bot response to chat
        chatbotMessages.innerHTML += `
            <div class="bot-message">
                <div class="message-content">
                    <p>${response}</p>
                </div>
            </div>
        `;
        
        // Scroll to bottom
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }, 1500);
}

// Change application language
function changeLanguage(lang) {
    // Save selected language to localStorage
    localStorage.setItem('ecovatorsLanguage', lang);
    
    // In a real application, this would load language files and update UI text
    console.log(`Language changed to: ${lang}`);
    
    // For demonstration purposes, show a message
    alert(`Language changed to ${getLanguageName(lang)}. In a production environment, all UI text would be updated.`);
}

// Get language name from code
function getLanguageName(code) {
    const languages = {
        'en': 'English',
        'hi': 'Hindi',
        'ta': 'Tamil',
        'te': 'Telugu',
        'mr': 'Marathi',
        'bn': 'Bengali',
        'gu': 'Gujarati',
        'kn': 'Kannada',
        'ml': 'Malayalam',
        'pa': 'Punjabi'
    };
    
    return languages[code] || code;
}