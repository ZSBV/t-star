document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Mobile Nav Toggle
    const navToggle = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-links');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            
            // Toggle hamburger icon animation
            
            const icon = navToggle.querySelector('i');
            if (navMenu.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-xmark');
            } else {
                icon.classList.remove('fa-xmark');
                icon.classList.add('fa-bars');
            }
);
    }

    // Close mobile nav when clicking a link
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                
            const icon = navToggle.querySelector('i');
            if (navMenu.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-xmark');
            } else {
                icon.classList.remove('fa-xmark');
                icon.classList.add('fa-bars');
            }
);
    });

    // 2. Header Shadow on Scroll
    const header = document.querySelector('.site-header');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // 3. Scroll-to-top button
    const scrollTopBtn = document.querySelector('.scroll-top');
    
    if (scrollTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                scrollTopBtn.classList.add('visible');
            } else {
                scrollTopBtn.classList.remove('visible');
            }
        });

        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // 4. Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                
                // Header offset
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
  
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // 5. Intersection Observer for Fade-In Animations
    const fadeElements = document.querySelectorAll('.fade-in-scroll');
    
    const fadeObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        root: null,
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    fadeElements.forEach(element => {
        fadeObserver.observe(element);
    });

    // 6. Form Validation & Submission
    const applyForm = document.querySelector('.apply-form');
    
    if (applyForm) {
        applyForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            let isValid = true;
            
            // Get required inputs
            const requiredInputs = applyForm.querySelectorAll('input[required], textarea[required], select[required]');
            
            requiredInputs.forEach(input => {
                // Clear previous errors
                const errorElement = input.parentElement.querySelector('.form-error');
                if (errorElement) {
                    errorElement.style.display = 'none';
                }
                input.style.borderColor = '#ddd';

                // Check empty
                if (!input.value.trim()) {
                    isValid = false;
                    showError(input, 'Dieses Feld ist erforderlich.');
                } 
                // Check email format
                else if (input.type === 'email' && !validateEmail(input.value)) {
                    isValid = false;
                    showError(input, 'Bitte geben Sie eine gültige E-Mail-Adresse ein.');
                }
            });

            if (isValid) {
                // Here you would normally send the form data via AJAX/fetch
                // For now, simulate success
                alert('Vielen Dank für Ihre Bewerbung! Wir werden uns in Kürze bei Ihnen melden.');
                applyForm.reset();
            }
        });

        function showError(input, message) {
            let errorElement = input.parentElement.querySelector('.form-error');
            
            if (!errorElement) {
                errorElement = document.createElement('div');
                errorElement.className = 'form-error';
                input.parentElement.appendChild(errorElement);
            }
            
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            input.style.borderColor = '#d9534f';
        }

        function validateEmail(email) {
            const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(String(email).toLowerCase());
        }
    }
});
