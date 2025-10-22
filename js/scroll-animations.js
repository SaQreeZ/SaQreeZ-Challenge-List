// Scroll animations using Intersection Observer API

// Initialize scroll animations when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initScrollAnimations();
});

function initScrollAnimations() {
    // Create intersection observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: stop observing after animation triggers
                // observer.unobserve(entry.target);
            } else {
                // Optional: remove class when element leaves viewport for repeat animations
                // entry.target.classList.remove('visible');
            }
        });
    }, {
        threshold: 0.1, // Trigger when 10% of element is visible
        rootMargin: '0px 0px -50px 0px' // Trigger slightly before element enters viewport
    });

    // Observe all elements with scroll animation classes
    const animatedElements = document.querySelectorAll(
        '.scroll-fade, .scroll-slide-left, .scroll-slide-right, .scroll-scale, .scroll-stagger'
    );

    animatedElements.forEach(el => {
        observer.observe(el);
    });

    // Auto-add scroll animation classes to common elements
    autoAddScrollClasses();
}

function autoAddScrollClasses() {
    // Add scroll-fade to table rows
    const tableRows = document.querySelectorAll('.list tr, .records tr');
    tableRows.forEach((row, index) => {
        if (index > 0) { // Skip header row
            row.classList.add('scroll-stagger');
        }
    });

    // Add scroll-fade to pack cards
    const packCards = document.querySelectorAll('.pack-card, .level-card');
    packCards.forEach(card => {
        card.classList.add('scroll-fade');
    });

    // Add scroll-slide animations to alternating elements
    const levelDetails = document.querySelectorAll('.level-details > *');
    levelDetails.forEach((detail, index) => {
        if (index % 2 === 0) {
            detail.classList.add('scroll-slide-left');
        } else {
            detail.classList.add('scroll-slide-right');
        }
    });

    // Add scroll-scale to important elements
    const importantElements = document.querySelectorAll('h1, h2, .stats, .video-container');
    importantElements.forEach(el => {
        el.classList.add('scroll-scale');
    });
}

// Parallax effect for scroll
function initParallaxEffect() {
    let ticking = false;

    function updateParallax() {
        const scrolled = window.pageYOffset;
        const parallaxElements = document.querySelectorAll('.parallax');
        
        parallaxElements.forEach(el => {
            const speed = el.dataset.speed || 0.5;
            const yPos = -(scrolled * speed);
            el.style.transform = `translateY(${yPos}px)`;
        });
        
        ticking = false;
    }

    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateParallax);
            ticking = true;
        }
    }

    window.addEventListener('scroll', requestTick);
}

// Initialize parallax effect
document.addEventListener('DOMContentLoaded', function() {
    initParallaxEffect();
});

// Re-initialize animations when Vue router changes pages
if (window.Vue && window.VueRouter) {
    // Listen for route changes
    window.addEventListener('popstate', function() {
        setTimeout(() => {
            initScrollAnimations();
        }, 100);
    });
}

// Export functions for manual use
window.scrollAnimations = {
    init: initScrollAnimations,
    autoAdd: autoAddScrollClasses,
    parallax: initParallaxEffect
};