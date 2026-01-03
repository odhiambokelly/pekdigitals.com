// PEKDIGITALS Main JavaScript File
// Handles all interactive functionality across the website

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initMobileMenu();
    initScrollReveal();
    initTypewriter();
    initParticles();
    initTestimonialSlider();
    initStatsCounter();
    initPricingToggle();
    initForms();
    initFAQ();
    initBlogFilters();
    initSmoothScroll();
    initNewsletterForm();
    
    console.log('PEKDIGITALS website initialized successfully');
});

// Mobile Menu Toggle
function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
            
            // Animate menu items
            if (!mobileMenu.classList.contains('hidden')) {
                const menuItems = mobileMenu.querySelectorAll('a');
                anime({
                    targets: menuItems,
                    translateY: [20, 0],
                    opacity: [0, 1],
                    delay: anime.stagger(100),
                    duration: 300,
                    easing: 'easeOutQuad'
                });
            }
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!mobileMenuBtn.contains(event.target) && !mobileMenu.contains(event.target)) {
                mobileMenu.classList.add('hidden');
            }
        });
    }
}

// Scroll Reveal Animation
function initScrollReveal() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                
                // Add stagger delay for multiple elements
                const siblings = Array.from(entry.target.parentNode.children);
                const index = siblings.indexOf(entry.target);
                entry.target.style.transitionDelay = `${index * 100}ms`;
            }
        });
    }, observerOptions);
    
    // Observe all scroll-reveal elements
    document.querySelectorAll('.scroll-reveal').forEach(el => {
        observer.observe(el);
    });
}

// Typewriter Effect for Hero
function initTypewriter() {
    const typedElement = document.getElementById('typed-text');
    if (typedElement) {
        const typed = new Typed('#typed-text', {
            strings: [
                'Transform Your Digital Presence',
                'Boost Your Online Visibility',
                'Drive Real Business Results',
                'Build Your Brand Online'
            ],
            typeSpeed: 50,
            backSpeed: 30,
            backDelay: 2000,
            startDelay: 500,
            loop: true,
            showCursor: true,
            cursorChar: '|'
        });
    }
}

// Particle Background Animation
function initParticles() {
    const canvas = document.getElementById('particles');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let particles = [];
    
    function resizeCanvas() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }
    
    function createParticles() {
        particles = [];
        const particleCount = Math.floor((canvas.width * canvas.height) / 15000);
        
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 2 + 1,
                opacity: Math.random() * 0.5 + 0.2
            });
        }
    }
    
    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Wrap around edges
            if (particle.x < 0) particle.x = canvas.width;
            if (particle.x > canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = canvas.height;
            if (particle.y > canvas.height) particle.y = 0;
            
            // Draw particle
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(59, 130, 246, ${particle.opacity})`;
            ctx.fill();
        });
        
        requestAnimationFrame(animateParticles);
    }
    
    resizeCanvas();
    createParticles();
    animateParticles();
    
    window.addEventListener('resize', () => {
        resizeCanvas();
        createParticles();
    });
}

// Testimonial Slider
function initTestimonialSlider() {
    const slider = document.getElementById('testimonial-slider');
    if (slider) {
        new Splide('#testimonial-slider', {
            type: 'loop',
            perPage: 1,
            autoplay: true,
            interval: 5000,
            pauseOnHover: true,
            arrows: false,
            pagination: true,
            gap: '2rem'
        }).mount();
    }
}

// Stats Counter Animation
function initStatsCounter() {
    const counters = document.querySelectorAll('.stats-counter');
    
    const animateCounter = (counter) => {
        const target = parseInt(counter.getAttribute('data-target'));
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                counter.textContent = target;
                clearInterval(timer);
            } else {
                counter.textContent = Math.floor(current);
            }
        }, 16);
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    });
    
    counters.forEach(counter => observer.observe(counter));
}

// Pricing Toggle (Monthly/Annual)
function initPricingToggle() {
    const toggle = document.getElementById('pricing-toggle');
    if (!toggle) return;
    
    const monthlyElements = document.querySelectorAll('.pricing-monthly');
    const onetimeElements = document.querySelectorAll('.pricing-onetime');
    
    toggle.addEventListener('change', function() {
        if (this.checked) {
            // Show one-time pricing
            monthlyElements.forEach(el => el.classList.add('hidden'));
            onetimeElements.forEach(el => el.classList.remove('hidden'));
        } else {
            // Show monthly pricing
            monthlyElements.forEach(el => el.classList.remove('hidden'));
            onetimeElements.forEach(el => el.classList.add('hidden'));
        }
    });
}

// Form Handling
function initForms() {
    // Contact Form
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Support Form
    const supportForm = document.getElementById('support-ticket-form');
    if (supportForm) {
        supportForm.addEventListener('submit', handleFormSubmit);
    }
    
    // CTA Form
    const ctaForm = document.getElementById('cta-form');
    if (ctaForm) {
        ctaForm.addEventListener('submit', handleFormSubmit);
    }
}

function handleFormSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    
    // Show loading state
    submitButton.textContent = 'Sending...';
    submitButton.disabled = true;
    
    // Simulate form submission (replace with actual API call)
    setTimeout(() => {
        showFormMessage(form, 'success');
        form.reset();
        
        // Reset button
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }, 2000);
}

function showFormMessage(form, type) {
    const messagesContainer = form.parentNode.querySelector('#form-messages');
    if (!messagesContainer) return;
    
    const successMessage = messagesContainer.querySelector('#success-message');
    const errorMessage = messagesContainer.querySelector('#error-message');
    
    messagesContainer.classList.remove('hidden');
    
    if (type === 'success') {
        successMessage.classList.remove('hidden');
        errorMessage.classList.add('hidden');
        
        // Generate ticket ID for support form
        if (form.id === 'support-ticket-form') {
            const ticketId = 'TKT-' + Math.random().toString(36).substr(2, 9).toUpperCase();
            const ticketIdElement = successMessage.querySelector('#ticket-id');
            if (ticketIdElement) {
                ticketIdElement.textContent = ticketId;
            }
        }
    } else {
        errorMessage.classList.remove('hidden');
        successMessage.classList.add('hidden');
    }
    
    // Hide message after 5 seconds
    setTimeout(() => {
        messagesContainer.classList.add('hidden');
    }, 5000);
}

// FAQ Toggle
function initFAQ() {
    document.querySelectorAll('.faq-toggle').forEach(button => {
        button.addEventListener('click', function() {
            const content = this.nextElementSibling;
            const icon = this.querySelector('span');
            
            if (content.classList.contains('hidden')) {
                content.classList.remove('hidden');
                icon.textContent = '−';
                
                anime({
                    targets: content,
                    height: [0, 'auto'],
                    opacity: [0, 1],
                    duration: 300,
                    easing: 'easeOutQuad'
                });
            } else {
                content.classList.add('hidden');
                icon.textContent = '+';
            }
        });
    });
}

// Blog Filters and Search
function initBlogFilters() {
    const searchInput = document.getElementById('blog-search');
    const categoryButtons = document.querySelectorAll('.category-filter');
    const blogPosts = document.querySelectorAll('.blog-card');
    const loadMoreBtn = document.getElementById('load-more');
    
    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            filterBlogPosts(searchTerm, getActiveCategory());
        });
    }
    
    // Category filtering
    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active state
            categoryButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.classList.add('border', 'border-medium-gray');
            });
            this.classList.add('active');
            this.classList.remove('border', 'border-medium-gray');
            
            const category = this.getAttribute('data-category');
            const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
            filterBlogPosts(searchTerm, category);
        });
    });
    
    // Load more functionality
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
            // Simulate loading more posts
            this.textContent = 'Loading...';
            setTimeout(() => {
                this.textContent = 'Load More Articles';
                // In a real implementation, you would load more posts here
                alert('More articles would be loaded here in a real implementation.');
            }, 1000);
        });
    }
}

function filterBlogPosts(searchTerm, category) {
    const blogPosts = document.querySelectorAll('.blog-card');
    
    blogPosts.forEach(post => {
        const title = post.querySelector('h3').textContent.toLowerCase();
        const content = post.querySelector('p').textContent.toLowerCase();
        const postCategory = post.getAttribute('data-category');
        
        const matchesSearch = !searchTerm || title.includes(searchTerm) || content.includes(searchTerm);
        const matchesCategory = category === 'all' || postCategory === category;
        
        if (matchesSearch && matchesCategory) {
            post.style.display = 'block';
            anime({
                targets: post,
                opacity: [0, 1],
                translateY: [20, 0],
                duration: 300,
                easing: 'easeOutQuad'
            });
        } else {
            post.style.display = 'none';
        }
    });
}

function getActiveCategory() {
    const activeButton = document.querySelector('.category-filter.active');
    return activeButton ? activeButton.getAttribute('data-category') : 'all';
}

// Smooth Scroll for Anchor Links
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offsetTop = target.offsetTop - 100; // Account for fixed header
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Newsletter Form
function initNewsletterForm() {
    const newsletterForms = document.querySelectorAll('#newsletter-form, #newsletter-signup');
    
    newsletterForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = this.querySelector('input[type="email"]').value;
            const button = this.querySelector('button[type="submit"]');
            const originalText = button.textContent;
            
            button.textContent = 'Subscribing...';
            button.disabled = true;
            
            // Simulate subscription
            setTimeout(() => {
                alert(`Thank you for subscribing with ${email}! You'll receive our latest insights soon.`);
                this.reset();
                button.textContent = originalText;
                button.disabled = false;
            }, 1500);
        });
    });
}

// Utility Functions
function scrollToForm() {
    const form = document.getElementById('support-form');
    if (form) {
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function startLiveChat() {
    alert('Live chat would be initiated here. In a real implementation, this would connect to your chat service.');
}

function selectPackage(packageName) {
    // Redirect to contact form with package pre-selected
    const contactUrl = `contact.html?package=${packageName}`;
    window.location.href = contactUrl;
}

// Handle URL parameters for pre-selected packages
function handleURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const packageParam = urlParams.get('package');
    
    if (packageParam) {
        const serviceSelect = document.getElementById('service-interest');
        if (serviceSelect) {
            serviceSelect.value = packageParam;
        }
    }
}

// Initialize URL parameter handling
document.addEventListener('DOMContentLoaded', handleURLParams);

// Add loading states and error handling
function showLoading(element) {
    element.classList.add('loading');
    element.disabled = true;
}

function hideLoading(element, originalText) {
    element.classList.remove('loading');
    element.disabled = false;
    element.textContent = originalText;
}

// Global error handler
window.addEventListener('error', function(e) {
    console.error('JavaScript error:', e.error);
    // In production, you might want to send this to an error tracking service
});

// Performance monitoring
if ('performance' in window) {
    window.addEventListener('load', function() {
        setTimeout(function() {
            const perfData = performance.getEntriesByType('navigation')[0];
            console.log('Page load time:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
        }, 0);
    });
}

// Export functions for external use
window.PEKDIGITALS = {
    scrollToForm,
    startLiveChat,
    selectPackage,
    showFormMessage,
    handleURLParams
};