// DOM Content Loaded Event Listener
document.addEventListener('DOMContentLoaded', function() {
    
    // Sticky Navigation
    const header = document.getElementById('header');
    const hero = document.getElementById('hero');
    
    function handleScroll() {
        const heroBottom = hero.offsetTop + hero.offsetHeight;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > 100) {
            header.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
            header.style.backdropFilter = 'blur(10px)';
        } else {
            header.style.backgroundColor = '#ffffff';
            header.style.backdropFilter = 'none';
        }
    }
    
    // Throttle scroll events for better performance
    let ticking = false;
    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(handleScroll);
            ticking = true;
        }
    }
    
    window.addEventListener('scroll', function() {
        requestTick();
        ticking = false;
    });
    
    // Smooth scrolling for anchor links (if any are added)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerHeight = header.offsetHeight;
                const targetPosition = target.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Button click handlers
    const ctaButtons = document.querySelectorAll('.cta-button');
    const loginButton = document.querySelector('.login-btn');
    
    // CTA Button handlers
    ctaButtons.forEach(button => {
        button.addEventListener('click', function() {
            const buttonText = this.textContent.trim();
            
            // Add a subtle animation effect
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
            
            // Handle different button actions
            switch(buttonText) {
                case 'Get Started':
                    console.log('Get Started clicked - would redirect to signup');
                    // window.location.href = '/signup';
                    break;
                case 'Join Now':
                    console.log('Join Now clicked - would redirect to registration');
                    // window.location.href = '/register';
                    break;
                case 'Contact Us':
                    console.log('Contact Us clicked - would redirect to contact form');
                    // window.location.href = '/contact';
                    break;
                default:
                    console.log(`${buttonText} button clicked`);
            }
        });
    });
    
    // Login button handler
    if (loginButton) {
        loginButton.addEventListener('click', function() {
            console.log('Login clicked - would redirect to login page');
            // window.location.href = '/login';
            
            // Add animation effect
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
        });
    }
    
    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animateElements = document.querySelectorAll('.card, .feature-item, .testimonial, .benefit-item');
    animateElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(element);
    });
    
    // Hero illustration animation
    const heroIcons = document.querySelectorAll('.hero-illustration i');
    heroIcons.forEach((icon, index) => {
        icon.style.animationDelay = `${index * 0.2}s`;
        icon.style.animation = 'bounce 2s infinite';
    });
    
    // Add bounce keyframe animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {
                transform: translateY(0);
            }
            40% {
                transform: translateY(-10px);
            }
            60% {
                transform: translateY(-5px);
            }
        }
        
        @keyframes pulse {
            0% {
                box-shadow: 0 0 0 0 rgba(229, 57, 53, 0.4);
            }
            70% {
                box-shadow: 0 0 0 10px rgba(229, 57, 53, 0);
            }
            100% {
                box-shadow: 0 0 0 0 rgba(229, 57, 53, 0);
            }
        }
        
        .cta-button:hover {
            animation: pulse 1.5s infinite;
        }
    `;
    document.head.appendChild(style);
    
    // Mobile menu functionality (if needed for future enhancements)
    function handleResize() {
        // Handle any resize-specific functionality
        if (window.innerWidth <= 768) {
            // Mobile-specific adjustments
            const cards = document.querySelectorAll('.card');
            cards.forEach(card => {
                card.style.margin = '0 auto';
            });
        }
    }
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Call once on load
    
    // Form validation (for future contact forms)
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    // Utility function for future API calls
    async function makeAPICall(endpoint, data) {
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    }
    
    // Add keyboard navigation support
    document.addEventListener('keydown', function(e) {
        // Handle Escape key to close any modals (for future use)
        if (e.key === 'Escape') {
            // Close any open modals or dropdowns
            console.log('Escape key pressed');
        }
        
        // Handle Enter key on buttons
        if (e.key === 'Enter' && e.target.tagName === 'BUTTON') {
            e.target.click();
        }
    });
    
    // Performance monitoring
    if (window.performance && window.performance.mark) {
        window.performance.mark('GuardianNet-interactive');
    }
    
    console.log('GuardianNet landing page loaded successfully!');
});
