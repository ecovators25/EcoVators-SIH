// Authentication JavaScript for EcoVators

// Import Firebase functions
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail, setPersistence, browserLocalPersistence, browserSessionPersistence, signInWithPhoneNumber, PhoneAuthProvider, signInWithCredential, RecaptchaVerifier, GoogleAuthProvider, FacebookAuthProvider } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { getDoc, setDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', function() {
    // Get the current page
    const currentPage = window.location.pathname.split('/').pop();
    
    // Handle registration form
    if (currentPage === 'register.html') {
        setupRegistrationPage();
    }
    
    // Handle login form
    if (currentPage === 'login.html') {
        setupLoginPage();
    }
    
    // Handle forgot password form
    if (currentPage === 'forgot-password.html') {
        setupForgotPasswordPage();
    }
});

// Setup registration page functionality
function setupRegistrationPage() {
    const registrationForm = document.getElementById('registration-form');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const togglePasswordBtns = document.querySelectorAll('.toggle-password');
    const strengthMeter = document.querySelector('.strength-meter');
    const strengthText = document.querySelector('.strength-text span');
    const googleBtn = document.querySelector('.google-btn');
    const phoneBtn = document.querySelector('.phone-btn');
    
    // Initialize reCAPTCHA for phone authentication
    let recaptchaVerifier;
    if (phoneBtn) {
        recaptchaVerifier = new RecaptchaVerifier(window.firebaseAuth, 'recaptcha-container', {
            'size': 'invisible',
            'callback': (response) => {
                // reCAPTCHA solved, allow signInWithPhoneNumber
            }
        });
    }
    
    // Get role from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const role = urlParams.get('role') || 'student';
    
    // Update page content based on role
    updateRoleContent(role);
    
    // Show appropriate role-specific fields
    showRoleFields(role);
    
    // Populate state dropdown
    populateStates();
    
    // Handle state change to populate districts
    const stateSelect = document.getElementById('state');
    const districtSelect = document.getElementById('district');
    if (stateSelect) {
        // Enforce required selects
        stateSelect.required = true;
        if (districtSelect) districtSelect.required = true;

        // Initialize district select disabled state
        if (!stateSelect.value && districtSelect) {
            districtSelect.disabled = true;
        }

        // Populate districts when state changes
        stateSelect.addEventListener('change', function() {
            populateDistricts(this.value);
        });

        // If state already has a value (e.g., browser autofill), populate districts immediately
        if (stateSelect.value) {
            populateDistricts(stateSelect.value);
        }
    }
    
    // Toggle password visibility
    togglePasswordBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const input = this.previousElementSibling;
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    });
    
    // Check password strength
    passwordInput.addEventListener('input', function() {
        const strength = checkPasswordStrength(this.value);
        updatePasswordStrengthUI(strength);
    });
    // Initialize strength UI on load (handles browser autofill)
    updatePasswordStrengthUI(checkPasswordStrength(passwordInput.value || ''));

    // Validate confirm password in real time for better UX
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', function() {
            if (this.value && passwordInput.value && this.value !== passwordInput.value) {
                this.setCustomValidity('Passwords do not match');
            } else {
                this.setCustomValidity('');
            }
        });
    }
    
    // Handle form submission
    registrationForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validate form
        if (!validateRegistrationForm()) {
            return;
        }
        
        // Get form data
        const formData = getRegistrationFormData(role);
        
        try {
            // Create user with Firebase Auth
            const auth = window.firebaseAuth;
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;
            
            // Save additional user data to Firestore
            const db = window.firebaseDb;
            await setDoc(doc(db, "users", user.uid), {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                role: role,
                phone: formData.phone,
                state: formData.state,
                district: formData.district,
                village: formData.village,
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp(),
                ...formData.roleSpecificData
            }, { merge: true });
            
            // Show success message and redirect
            showSuccess("Registration successful! Redirecting to your dashboard...");
            
            // Redirect to appropriate dashboard after a short delay
            setTimeout(() => {
                redirectToDashboard(role);
            }, 2000);
            
        } catch (error) {
            showError(error.message);
        }
    });
    
    // Handle Google sign-in for registration
    if (googleBtn) {
        googleBtn.addEventListener('click', async function() {
            try {
                const auth = window.firebaseAuth;
                const provider = new GoogleAuthProvider();
                const result = await signInWithPopup(auth, provider);
                
                // Check if user exists in Firestore
                const db = window.firebaseDb;
                const userDoc = await getDoc(doc(db, "users", result.user.uid));
                
                if (userDoc.exists()) {
                    // User exists, redirect to dashboard
                    const userData = userDoc.data();
                    redirectToDashboard(userData.role);
                } else {
                    // New user, create profile with Google data
                    const user = result.user;
                    const userData = {
                        firstName: user.displayName?.split(' ')[0] || '',
                        lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
                        email: user.email,
                        role: role,
                        phone: user.phoneNumber || '',
                        state: '',
                        district: '',
                        village: '',
                        createdAt: serverTimestamp(),
                        lastLogin: serverTimestamp(),
                        profilePicture: user.photoURL || '',
                        ...getRoleSpecificData(role)
                    };
                    
                    await setDoc(doc(db, "users", user.uid), userData, { merge: true });
                    showSuccess("Registration successful! Redirecting to your dashboard...");
                    
                    setTimeout(() => {
                        redirectToDashboard(role);
                    }, 2000);
                }
                
            } catch (error) {
                showError(error.message);
            }
        });
    }
    
    // Handle Phone sign-in for registration
    if (phoneBtn) {
        phoneBtn.addEventListener('click', async function() {
            const phoneNumber = prompt('Enter your phone number (with country code, e.g., +1234567890):');
            if (!phoneNumber) return;
            
            try {
                const auth = window.firebaseAuth;
                const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
                
                // Store the confirmation result for later use
                window.confirmationResult = confirmationResult;
                
                // Prompt for verification code
                const verificationCode = prompt('Enter the verification code sent to your phone:');
                if (!verificationCode) return;
                
                // Verify the code
                const credential = PhoneAuthProvider.credential(confirmationResult.verificationId, verificationCode);
                const result = await signInWithCredential(auth, credential);
                
                // Check if user exists in Firestore
                const db = window.firebaseDb;
                const userDoc = await getDoc(doc(db, "users", result.user.uid));
                
                if (userDoc.exists()) {
                    // User exists, redirect to dashboard
                    const userData = userDoc.data();
                    redirectToDashboard(userData.role);
                } else {
                    // New user, create profile with phone data
                    const user = result.user;
                    const userData = {
                        firstName: '',
                        lastName: '',
                        email: user.email || '',
                        role: role,
                        phone: user.phoneNumber || phoneNumber,
                        state: '',
                        district: '',
                        village: '',
                        createdAt: serverTimestamp(),
                        lastLogin: serverTimestamp(),
                        ...getRoleSpecificData(role)
                    };
                    
                    await setDoc(doc(db, "users", user.uid), userData, { merge: true });
                    showSuccess("Registration successful! Redirecting to your dashboard...");
                    
                    setTimeout(() => {
                        redirectToDashboard(role);
                    }, 2000);
                }
                
            } catch (error) {
                showError(error.message);
            }
        });
    }
}

// Setup login page functionality
function setupLoginPage() {
    const loginForm = document.getElementById('login-form');
    const togglePasswordBtn = document.querySelector('.toggle-password');
    const googleBtn = document.querySelector('.google-btn');
    const facebookBtn = document.querySelector('.facebook-btn');
    const phoneBtn = document.querySelector('.phone-btn');
    
    // Initialize reCAPTCHA for phone authentication
    let recaptchaVerifier;
    if (phoneBtn) {
        recaptchaVerifier = new RecaptchaVerifier(window.firebaseAuth, 'recaptcha-container', {
            'size': 'invisible',
            'callback': (response) => {
                // reCAPTCHA solved, allow signInWithPhoneNumber
            }
        });
    }
    
    // Toggle password visibility
    togglePasswordBtn.addEventListener('click', function() {
        const input = this.previousElementSibling;
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });
    
    // Handle form submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('remember').checked;
        
        try {
            // Sign in with Firebase Auth
            const auth = window.firebaseAuth;
            if (rememberMe) {
                await setPersistence(auth, browserLocalPersistence);
            } else {
                await setPersistence(auth, browserSessionPersistence);
            }
            
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Get user data from Firestore to determine role
            const db = window.firebaseDb;
            const userDoc = await getDoc(doc(db, "users", user.uid));
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                redirectToDashboard(userData.role);
            } else {
                showError("User profile not found. Please contact support.");
            }
            
        } catch (error) {
            showError(error.message);
        }
    });
    
    // Handle Google sign-in
    googleBtn.addEventListener('click', async function() {
        try {
            const auth = window.firebaseAuth;
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            
            // Check if user exists in Firestore
            const db = window.firebaseDb;
            const userDoc = await getDoc(doc(db, "users", result.user.uid));
            
            if (userDoc.exists()) {
                // User exists, redirect to dashboard
                const userData = userDoc.data();
                redirectToDashboard(userData.role);
            } else {
                // New user, redirect to complete profile
                window.location.href = `complete-profile.html?uid=${result.user.uid}`;
            }
            
        } catch (error) {
            showError(error.message);
        }
    });
    
    // Handle Facebook sign-in
    facebookBtn.addEventListener('click', async function() {
        try {
            const auth = window.firebaseAuth;
            const provider = new FacebookAuthProvider();
            const result = await signInWithPopup(auth, provider);
            
            // Check if user exists in Firestore
            const db = window.firebaseDb;
            const userDoc = await getDoc(doc(db, "users", result.user.uid));
            
            if (userDoc.exists()) {
                // User exists, redirect to dashboard
                const userData = userDoc.data();
                redirectToDashboard(userData.role);
            } else {
                // New user, redirect to complete profile
                window.location.href = `complete-profile.html?uid=${result.user.uid}`;
            }
            
        } catch (error) {
            showError(error.message);
        }
    });
    
    // Handle Phone sign-in
    if (phoneBtn) {
        phoneBtn.addEventListener('click', async function() {
            const phoneNumber = prompt('Enter your phone number (with country code, e.g., +1234567890):');
            if (!phoneNumber) return;
            
            try {
                const auth = window.firebaseAuth;
                const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
                
                // Store the confirmation result for later use
                window.confirmationResult = confirmationResult;
                
                // Prompt for verification code
                const verificationCode = prompt('Enter the verification code sent to your phone:');
                if (!verificationCode) return;
                
                // Verify the code
                const credential = PhoneAuthProvider.credential(confirmationResult.verificationId, verificationCode);
                const result = await signInWithCredential(auth, credential);
                
                // Check if user exists in Firestore
                const db = window.firebaseDb;
                const userDoc = await getDoc(doc(db, "users", result.user.uid));
                
                if (userDoc.exists()) {
                    // User exists, redirect to dashboard
                    const userData = userDoc.data();
                    redirectToDashboard(userData.role);
                } else {
                    // New user, redirect to complete profile
                    window.location.href = `complete-profile.html?uid=${result.user.uid}`;
                }
                
            } catch (error) {
                showError(error.message);
            }
        });
    }
}

// Setup forgot password page functionality
function setupForgotPasswordPage() {
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    
    forgotPasswordForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        
        try {
            const auth = window.firebaseAuth;
            await sendPasswordResetEmail(auth, email);
            showSuccess("Password reset email sent. Please check your inbox.");
        } catch (error) {
            showError(error.message);
        }
    });
}

// Helper Functions

// Get role-specific data for new users
function getRoleSpecificData(role) {
    switch (role) {
        case 'student':
            return {
                school: '',
                grade: ''
            };
        case 'teacher':
            return {
                institution: '',
                subject: ''
            };
        case 'admin':
            return {
                organization: '',
                position: ''
            };
        case 'ngo':
            return {
                ngoName: '',
                ngoType: ''
            };
        case 'company':
            return {
                companyName: '',
                industry: ''
            };
        default:
            return {};
    }
}

// Update page content based on role
function updateRoleContent(role) {
    const roleTitle = document.getElementById('role-title');
    const roleDescription = document.getElementById('role-description');
    
    const roleTitles = {
        student: "Register as Student",
        teacher: "Register as Teacher",
        admin: "Register as Admin",
        ngo: "Register as NGO",
        company: "Register as Company"
    };
    
    const roleDescriptions = {
        student: "Join EcoVators to learn, participate in challenges, and make a real impact on our environment.",
        teacher: "Create challenges, monitor student progress, and facilitate environmental education.",
        admin: "Manage your school's environmental initiatives and track overall impact.",
        ngo: "Organize events, collaborate with schools, and expand your environmental impact.",
        company: "Support environmental education through carbon credits and advertising partnerships."
    };
    
    roleTitle.textContent = roleTitles[role] || roleTitles.student;
    roleDescription.textContent = roleDescriptions[role] || roleDescriptions.student;
}

// Show role-specific fields
function showRoleFields(role) {
    const roleFields = document.querySelectorAll('.role-fields');
    roleFields.forEach(field => {
        field.classList.add('hidden');
    });
    
    const targetField = document.getElementById(`${role}-fields`);
    if (targetField) {
        targetField.classList.remove('hidden');
    }
}

// Populate states dropdown
function populateStates() {
    const stateSelect = document.getElementById('state');
    
    // List of Indian states
    const states = [
        "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
        "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", 
        "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", 
        "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
        "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
        "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", 
        "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
    ];
    
    // Clear existing options
    stateSelect.innerHTML = '<option value="">Select State</option>';
    
    // Add states to dropdown
    states.forEach(state => {
        const option = document.createElement('option');
        option.value = state;
        option.textContent = state;
        stateSelect.appendChild(option);
    });
}

// Populate districts dropdown based on selected state
function populateDistricts(state) {
    const districtSelect = document.getElementById('district');
    
    // Clear existing options
    districtSelect.innerHTML = '<option value="">Select District</option>';
    
    if (!state) {
        districtSelect.disabled = true;
        return;
    }
    
    // Enable district dropdown
    districtSelect.disabled = false;
    
    // Comprehensive districts data for Indian states
    const districtsByState = {
        "Andhra Pradesh": ["Anantapur", "Chittoor", "East Godavari", "Guntur", "Krishna", "Kurnool", "Nellore", "Prakasam", "Srikakulam", "Visakhapatnam", "Vizianagaram", "West Godavari", "YSR Kadapa"],
        "Arunachal Pradesh": ["Anjaw", "Changlang", "Dibang Valley", "East Kameng", "East Siang", "Kamle", "Kra Daadi", "Kurung Kumey", "Lepa Rada", "Lohit", "Longding", "Lower Dibang Valley", "Lower Siang", "Lower Subansiri", "Namsai", "Pakke Kessang", "Papum Pare", "Shi Yomi", "Siang", "Tawang", "Tirap", "Upper Siang", "Upper Subansiri", "West Kameng", "West Siang"],
        "Assam": ["Baksa", "Barpeta", "Biswanath", "Bongaigaon", "Cachar", "Charaideo", "Chirang", "Darrang", "Dhemaji", "Dhubri", "Dibrugarh", "Dima Hasao", "Goalpara", "Golaghat", "Hailakandi", "Hojai", "Jorhat", "Kamrup", "Kamrup Metropolitan", "Karbi Anglong", "Karimganj", "Kokrajhar", "Lakhimpur", "Majuli", "Morigaon", "Nagaon", "Nalbari", "Sivasagar", "Sonitpur", "South Salmara-Mankachar", "Tinsukia", "Udalguri", "West Karbi Anglong"],
        "Bihar": ["Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", "Bhojpur", "Buxar", "Darbhanga", "East Champaran", "Gaya", "Gopalganj", "Jamui", "Jehanabad", "Kaimur", "Katihar", "Khagaria", "Kishanganj", "Lakhisarai", "Madhepura", "Madhubani", "Munger", "Muzaffarpur", "Nalanda", "Nawada", "Patna", "Purnia", "Rohtas", "Saharsa", "Samastipur", "Saran", "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan", "Supaul", "Vaishali", "West Champaran"],
        "Chhattisgarh": ["Balod", "Baloda Bazar", "Balrampur", "Bastar", "Bemetara", "Bijapur", "Bilaspur", "Dantewada", "Dhamtari", "Durg", "Gariaband", "Janjgir-Champa", "Jashpur", "Kabirdham", "Kanker", "Kondagaon", "Korba", "Koriya", "Mahasamund", "Mungeli", "Narayanpur", "Raigarh", "Raipur", "Rajnandgaon", "Sukma", "Surajpur", "Surguja"],
        "Goa": ["North Goa", "South Goa"],
        "Gujarat": ["Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha", "Bharuch", "Bhavnagar", "Botad", "Chhota Udaipur", "Dahod", "Dang", "Devbhoomi Dwarka", "Gandhinagar", "Gir Somnath", "Jamnagar", "Junagadh", "Kheda", "Kutch", "Mahisagar", "Mehsana", "Morbi", "Narmada", "Navsari", "Panchmahal", "Patan", "Porbandar", "Rajkot", "Sabarkantha", "Surat", "Surendranagar", "Tapi", "Vadodara", "Valsad"],
        "Haryana": ["Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad", "Gurugram", "Hisar", "Jhajjar", "Jind", "Kaithal", "Karnal", "Kurukshetra", "Mahendragarh", "Nuh", "Palwal", "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa", "Sonipat", "Yamunanagar"],
        "Himachal Pradesh": ["Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur", "Kullu", "Lahaul and Spiti", "Mandi", "Shimla", "Sirmaur", "Solan", "Una"],
        "Jharkhand": ["Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka", "East Singhbhum", "Garhwa", "Giridih", "Godda", "Gumla", "Hazaribagh", "Jamtara", "Khunti", "Koderma", "Latehar", "Lohardaga", "Pakur", "Palamu", "Ramgarh", "Ranchi", "Sahibganj", "Seraikela Kharsawan", "Simdega", "West Singhbhum"],
        "Karnataka": ["Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban", "Bidar", "Chamarajanagar", "Chikballapur", "Chikkamagaluru", "Chitradurga", "Dakshina Kannada", "Davangere", "Dharwad", "Gadag", "Hassan", "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal", "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga", "Tumakuru", "Udupi", "Uttara Kannada", "Vijayapura", "Yadgir"],
        "Kerala": ["Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam", "Kottayam", "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad"],
        "Madhya Pradesh": ["Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat", "Barwani", "Betul", "Bhind", "Bhopal", "Burhanpur", "Chhatarpur", "Chhindwara", "Damoh", "Datia", "Dewas", "Dhar", "Dindori", "Guna", "Gwalior", "Harda", "Hoshangabad", "Indore", "Jabalpur", "Jhabua", "Katni", "Khandwa", "Khargone", "Mandla", "Mandsaur", "Morena", "Narsinghpur", "Neemuch", "Panna", "Raisen", "Rajgarh", "Ratlam", "Rewa", "Sagar", "Satna", "Sehore", "Seoni", "Shahdol", "Shajapur", "Sheopur", "Shivpuri", "Sidhi", "Singrauli", "Tikamgarh", "Ujjain", "Umaria", "Vidisha"],
        "Maharashtra": ["Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed", "Bhandara", "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded", "Nandurbar", "Nashik", "Osmanabad", "Palghar", "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"],
        "Manipur": ["Bishnupur", "Chandel", "Churachandpur", "Imphal East", "Imphal West", "Jiribam", "Kakching", "Kamjong", "Kangpokpi", "Noney", "Pherzawl", "Senapati", "Tamenglong", "Tengnoupal", "Thoubal", "Ukhrul"],
        "Meghalaya": ["East Garo Hills", "East Jaintia Hills", "East Khasi Hills", "North Garo Hills", "Ri Bhoi", "South Garo Hills", "South West Garo Hills", "South West Khasi Hills", "West Garo Hills", "West Jaintia Hills", "West Khasi Hills"],
        "Mizoram": ["Aizawl", "Champhai", "Hnahthial", "Khawzawl", "Lawngtlai", "Lunglei", "Mamit", "Saiha", "Saitual", "Serchhip"],
        "Nagaland": ["Dimapur", "Kiphire", "Kohima", "Longleng", "Mokokchung", "Mon", "Peren", "Phek", "Tuensang", "Wokha", "Zunheboto"],
        "Odisha": ["Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak", "Boudh", "Cuttack", "Deogarh", "Dhenkanal", "Gajapati", "Ganjam", "Jagatsinghpur", "Jajpur", "Jharsuguda", "Kalahandi", "Kandhamal", "Kendrapara", "Kendujhar", "Khordha", "Koraput", "Malkangiri", "Mayurbhanj", "Nabarangpur", "Nayagarh", "Nuapada", "Puri", "Rayagada", "Sambalpur", "Subarnapur", "Sundargarh"],
        "Punjab": ["Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka", "Ferozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana", "Mansa", "Moga", "Muktsar", "Pathankot", "Patiala", "Rupnagar", "Sahibzada Ajit Singh Nagar", "Sangrur", "Shahid Bhagat Singh Nagar", "Tarn Taran"],
        "Rajasthan": ["Ajmer", "Alwar", "Banswara", "Baran", "Barmer", "Bharatpur", "Bhilwara", "Bikaner", "Bundi", "Chittorgarh", "Churu", "Dausa", "Dholpur", "Dungarpur", "Hanumangarh", "Jaipur", "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu", "Jodhpur", "Karauli", "Kota", "Nagaur", "Pali", "Pratapgarh", "Rajsamand", "Sawai Madhopur", "Sikar", "Sirohi", "Sri Ganganagar", "Tonk", "Udaipur"],
        "Sikkim": ["East Sikkim", "North Sikkim", "South Sikkim", "West Sikkim"],
        "Tamil Nadu": ["Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kanchipuram", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar"],
        "Telangana": ["Adilabad", "Bhadradri Kothagudem", "Hyderabad", "Jagtial", "Jangaon", "Jayashankar Bhupalpally", "Jogulamba Gadwal", "Kamareddy", "Karimnagar", "Khammam", "Komaram Bheem Asifabad", "Mahabubabad", "Mahabubnagar", "Mancherial", "Medak", "Medchal-Malkajgiri", "Mulugu", "Nagarkurnool", "Nalgonda", "Narayanpet", "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla", "Rangareddy", "Sangareddy", "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy", "Warangal Rural", "Warangal Urban", "Yadadri Bhuvanagiri"],
        "Tripura": ["Dhalai", "Gomati", "Khowai", "North Tripura", "Sepahijala", "South Tripura", "Unakoti", "West Tripura"],
        "Uttar Pradesh": ["Agra", "Aligarh", "Allahabad", "Ambedkar Nagar", "Amethi", "Amroha", "Auraiya", "Azamgarh", "Baghpat", "Bahraich", "Ballia", "Balrampur", "Banda", "Barabanki", "Bareilly", "Basti", "Bhadohi", "Bijnor", "Budaun", "Bulandshahr", "Chandauli", "Chitrakoot", "Deoria", "Etah", "Etawah", "Faizabad", "Farrukhabad", "Fatehpur", "Firozabad", "Gautam Buddha Nagar", "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur", "Hapur", "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi", "Kannauj", "Kanpur Dehat", "Kanpur Nagar", "Kanshiram Nagar", "Kaushambi", "Kushinagar", "Lakhimpur Kheri", "Lalitpur", "Lucknow", "Maharajganj", "Mahoba", "Mainpuri", "Mathura", "Mau", "Meerut", "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh", "Prayagraj", "Raebareli", "Rampur", "Saharanpur", "Sambhal", "Sant Kabir Nagar", "Shahjahanpur", "Shamli", "Shravasti", "Siddharthnagar", "Sitapur", "Sonbhadra", "Sultanpur", "Unnao", "Varanasi"],
        "Uttarakhand": ["Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun", "Haridwar", "Nainital", "Pauri Garhwal", "Pithoragarh", "Rudraprayag", "Tehri Garhwal", "Udham Singh Nagar", "Uttarkashi"],
        "West Bengal": ["Alipurduar", "Bankura", "Birbhum", "Cooch Behar", "Dakshin Dinajpur", "Darjeeling", "Hooghly", "Howrah", "Jalpaiguri", "Jhargram", "Kalimpong", "Kolkata", "Malda", "Murshidabad", "Nadia", "North 24 Parganas", "Paschim Bardhaman", "Paschim Medinipur", "Purba Bardhaman", "Purba Medinipur", "Purulia", "South 24 Parganas", "Uttar Dinajpur"],
        "Andaman and Nicobar Islands": ["Nicobar", "North and Middle Andaman", "South Andaman"],
        "Chandigarh": ["Chandigarh"],
        "Dadra and Nagar Haveli and Daman and Diu": ["Dadra and Nagar Haveli", "Daman", "Diu"],
        "Delhi": ["Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi", "North West Delhi", "Shahdara", "South Delhi", "South East Delhi", "South West Delhi", "West Delhi"],
        "Jammu and Kashmir": ["Anantnag", "Bandipora", "Baramulla", "Budgam", "Doda", "Ganderbal", "Jammu", "Kathua", "Kishtwar", "Kulgam", "Kupwara", "Poonch", "Pulwama", "Rajouri", "Ramban", "Reasi", "Samba", "Shopian", "Srinagar", "Udhampur"],
        "Ladakh": ["Kargil", "Leh"],
        "Lakshadweep": ["Lakshadweep"],
        "Puducherry": ["Karaikal", "Mahe", "Puducherry", "Yanam"]
    };
    
    // Add districts to dropdown
    const districts = districtsByState[state] || [];
    districts.forEach(district => {
        const option = document.createElement('option');
        option.value = district;
        option.textContent = district;
        districtSelect.appendChild(option);
    });
}

// Check password strength
function checkPasswordStrength(password) {
    if (!password) return 'weak';
    
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;
    
    const criteria = [hasLowerCase, hasUpperCase, hasNumbers, hasSpecialChars, isLongEnough];
    const metCriteria = criteria.filter(Boolean).length;
    
    if (metCriteria <= 2) return 'weak';
    if (metCriteria <= 4) return 'medium';
    return 'strong';
}

// Update password strength UI
function updatePasswordStrengthUI(strength) {
    const strengthMeter = document.querySelector('.strength-meter');
    const strengthText = document.querySelector('.strength-text span');
    
    // Remove all classes
    strengthMeter.classList.remove('weak', 'medium', 'strong');
    strengthText.classList.remove('weak', 'medium', 'strong');
    
    // Add appropriate class
    strengthMeter.classList.add(strength);
    strengthText.classList.add(strength);
    
    // Update text
    strengthText.textContent = strength.charAt(0).toUpperCase() + strength.slice(1);
}

// Validate registration form
function validateRegistrationForm() {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Check if passwords match
    if (password !== confirmPassword) {
        showError("Passwords do not match");
        return false;
    }
    
    // Check password strength
    const strength = checkPasswordStrength(password);
    if (strength === 'weak') {
        showError("Password is too weak. Please use a stronger password.");
        return false;
    }
    
    return true;
}

// Get registration form data
function getRegistrationFormData(role) {
    const formData = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        phone: document.getElementById('phone').value,
        state: document.getElementById('state').value,
        district: document.getElementById('district').value,
        village: document.getElementById('village').value,
        roleSpecificData: {}
    };
    
    // Add role-specific data
    switch (role) {
        case 'student':
            formData.roleSpecificData = {
                school: document.getElementById('school').value,
                grade: document.getElementById('grade').value
            };
            break;
        case 'teacher':
            formData.roleSpecificData = {
                institution: document.getElementById('institution').value,
                subject: document.getElementById('subject').value
            };
            break;
        case 'admin':
            formData.roleSpecificData = {
                organization: document.getElementById('organization').value,
                position: document.getElementById('position').value
            };
            break;
        case 'ngo':
            formData.roleSpecificData = {
                ngoName: document.getElementById('ngoName').value,
                ngoType: document.getElementById('ngoType').value
            };
            break;
        case 'company':
            formData.roleSpecificData = {
                companyName: document.getElementById('companyName').value,
                industry: document.getElementById('industry').value
            };
            break;
    }
    
    return formData;
}

// Redirect to appropriate dashboard
function redirectToDashboard(role) {
    const dashboards = {
        student: '../student.html',
        teacher: '../teacher.html',
        admin: '../teacher.html', // Redirect admin to teacher dashboard for now
        ngo: '../teacher.html', // Redirect NGO to teacher dashboard for now
        company: '../teacher.html' // Redirect company to teacher dashboard for now
    };
    
    window.location.href = dashboards[role] || dashboards.student;
}

// Show error message
function showError(message) {
    // Remove any existing error messages
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Create error message element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    // Insert after form
    const form = document.querySelector('form');
    form.parentNode.insertBefore(errorDiv, form.nextSibling);
    
    // Scroll to error message
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Remove error after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Show success message
function showSuccess(message) {
    // Remove any existing messages
    const existingMessage = document.querySelector('.success-message, .error-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create success message element
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    // Insert after form
    const form = document.querySelector('form');
    form.parentNode.insertBefore(successDiv, form.nextSibling);
    
    // Scroll to success message
    successDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Remove success message after 5 seconds
    setTimeout(() => {
        successDiv.remove();
    }, 5000);
}