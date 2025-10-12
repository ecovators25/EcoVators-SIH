// Main JavaScript for EcoVators

document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const getStartedBtn = document.getElementById('get-started');
    const navGetStartedBtn = document.querySelector('.get-started-btn');
    const loginBtn = document.querySelector('.login-btn');
    const roleModal = document.getElementById('role-modal');
    const closeModal = document.querySelector('.close-modal');
    const roleOptions = document.querySelectorAll('.role-option');

    // Event listeners for opening the role selection modal
    getStartedBtn.addEventListener('click', openRoleModal);
    navGetStartedBtn.addEventListener('click', openRoleModal);
    
    // Event listener for logout button
    document.querySelectorAll('.get-started-btn').forEach(btn => {
        if (btn.textContent.trim() === 'Logout') {
            btn.addEventListener('click', () => {
                window.location.href = "index.html";
            });
        }
    });

    // Event listener for closing the modal
    closeModal.addEventListener('click', closeRoleModal);
    window.addEventListener('click', (e) => {
        if (e.target === roleModal) {
            closeRoleModal();
        }
    });

    // Event listeners for role selection
    roleOptions.forEach(option => {
        option.addEventListener('click', () => {
            const role = option.getAttribute('data-role');
            redirectToRegistration(role);
        });
    });

    // Function to open the role selection modal
    function openRoleModal() {
        roleModal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
    }

    // Function to close the role selection modal
    function closeRoleModal() {
        roleModal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Re-enable scrolling
    }

    // Function to redirect to the appropriate registration page based on role
    function redirectToRegistration(role) {
        // Redirect to the appropriate dashboard based on role
        switch(role) {
            case 'student':
                window.location.href = 'htmls/student.html';
                break;
            case 'teacher':
                window.location.href = 'htmls/teacher.html';
                break;
            case 'admin':
                window.location.href = 'htmls/Admin.html';
                break;
            case 'company':
                window.location.href = 'htmls/Company.html';
                break;
            case 'ngo':
                window.location.href = 'htmls/ngo.html';
                break;
            case 'government':
                window.location.href = 'htmls/government.html';
                break;
            default:
                console.error("Unknown role:", role);
                window.location.href = `auth/register.html?role=${role}`;
        }
    }

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 70, // Offset for navbar
                    behavior: 'smooth'
                });
            }
        });
    });

    // Animation for elements when they come into view
    const animateOnScroll = () => {
        const elements = document.querySelectorAll('.feature-card, .stat-card, .role-card');
        
        elements.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            const screenPosition = window.innerHeight / 1.3;
            
            if (elementPosition < screenPosition) {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }
        });
    };

    // Set initial state for animation elements
    document.querySelectorAll('.feature-card, .stat-card, .role-card').forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    });

    // Add scroll event listener for animations
    window.addEventListener('scroll', animateOnScroll);
    // Initial check for elements in view
    animateOnScroll();
});
