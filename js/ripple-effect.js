// Ripple effect for buttons

// Initialize ripple effects when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initRippleEffects();
});

function initRippleEffects() {
    // Add ripple effect to all buttons and clickable elements
    const rippleElements = document.querySelectorAll('.btn, .nav__cta, .nav__tab, .nav__icon, button');
    
    rippleElements.forEach(element => {
        addRippleEffect(element);
    });
}

function addRippleEffect(element) {
    element.addEventListener('click', function(e) {
        // Remove existing ripples
        const existingRipples = element.querySelectorAll('.ripple');
        existingRipples.forEach(ripple => ripple.remove());
        
        // Create ripple element
        const ripple = document.createElement('span');
        ripple.classList.add('ripple');
        
        // Get element dimensions and position
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        // Set ripple styles
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        // Add ripple to element
        element.appendChild(ripple);
        
        // Remove ripple after animation
        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
}

// Enhanced button press animations
function initButtonPressAnimations() {
    const buttons = document.querySelectorAll('.btn, .nav__cta, button');
    
    buttons.forEach(button => {
        // Mouse down effect
        button.addEventListener('mousedown', function() {
            this.classList.add('pressed');
        });
        
        // Mouse up effect
        button.addEventListener('mouseup', function() {
            this.classList.remove('pressed');
        });
        
        // Mouse leave effect (in case mouse leaves while pressed)
        button.addEventListener('mouseleave', function() {
            this.classList.remove('pressed');
        });
        
        // Touch events for mobile
        button.addEventListener('touchstart', function() {
            this.classList.add('pressed');
        });
        
        button.addEventListener('touchend', function() {
            this.classList.remove('pressed');
        });
    });
}

// Initialize button press animations
document.addEventListener('DOMContentLoaded', function() {
    initButtonPressAnimations();
});

// Re-initialize when new elements are added (for Vue.js)
function reinitializeRipples() {
    setTimeout(() => {
        initRippleEffects();
        initButtonPressAnimations();
    }, 100);
}

// Export functions for manual use
window.rippleEffects = {
    init: initRippleEffects,
    add: addRippleEffect,
    reinit: reinitializeRipples
};