// FeHelper Website JavaScript

// DOM Ready
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initToolTabs();
    initScrollAnimations();
    initParallaxEffects();
    // fetchGitHubStats(); // 已移除，无实际用途
    initSmoothScrolling();
    initPreviewImageModal();
});

// Navigation functionality
function initNavigation() {
    const navbar = document.querySelector('.navbar');
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = 'none';
        }
    });

    // Mobile menu toggle
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });

        // Close menu when clicking on links
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            });
        });
    }
}

// Tool tabs functionality
function initToolTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const toolGrids = document.querySelectorAll('.tools-grid');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const category = button.dataset.category;

            // Remove active class from all buttons and grids
            tabButtons.forEach(btn => btn.classList.remove('active'));
            toolGrids.forEach(grid => grid.classList.remove('active'));

            // Add active class to clicked button and corresponding grid
            button.classList.add('active');
            const targetGrid = document.querySelector(`[data-category="${category}"].tools-grid`);
            if (targetGrid) {
                targetGrid.classList.add('active');
            }

            // Animate the transition
            animateGridSwitch(targetGrid);
        });
    });
}

// Animate grid switch
function animateGridSwitch(grid) {
    if (!grid) return;

    const cards = grid.querySelectorAll('.tool-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// Scroll animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                
                // Special animations for different elements
                if (entry.target.classList.contains('feature-card')) {
                    entry.target.style.animationDelay = '0.2s';
                    entry.target.classList.add('animate-fade-in-up');
                } else if (entry.target.classList.contains('tool-card')) {
                    entry.target.classList.add('animate-scale-in');
                } else if (entry.target.classList.contains('stat-item')) {
                    animateCounter(entry.target);
                }
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animatedElements = document.querySelectorAll('.feature-card, .tool-card, .browser-card, .stat-item');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });
}

// Counter animation
function animateCounter(element) {
    const numberElement = element.querySelector('.stat-number');
    if (!numberElement) return;

    const finalNumber = numberElement.textContent;
    const numericValue = parseInt(finalNumber.replace(/[^\d]/g, ''));
    const suffix = finalNumber.replace(/[\d.]/g, '');
    
    let currentNumber = 0;
    const increment = numericValue / 50;
    const timer = setInterval(() => {
        currentNumber += increment;
        if (currentNumber >= numericValue) {
            numberElement.textContent = finalNumber;
            clearInterval(timer);
        } else {
            numberElement.textContent = Math.floor(currentNumber) + suffix;
        }
    }, 50);
}

// Parallax effects
function initParallaxEffects() {
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const heroPattern = document.querySelector('.hero-pattern');
        const browserMockup = document.querySelector('.browser-mockup');
        
        if (heroPattern) {
            heroPattern.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
        
        if (browserMockup && scrolled < window.innerHeight) {
            browserMockup.style.transform = `perspective(1000px) rotateY(-5deg) rotateX(5deg) translateY(${scrolled * 0.1}px)`;
        }
    });
}

// Smooth scrolling
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 70;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Add some interactive effects
function addInteractiveEffects() {
    // Tool card hover effects
    document.querySelectorAll('.tool-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Browser mockup interaction
    const browserMockup = document.querySelector('.browser-mockup');
    if (browserMockup) {
        let isAnimating = false;
        
        browserMockup.addEventListener('mouseenter', function() {
            if (!isAnimating) {
                isAnimating = true;
                this.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1.05)';
                
                setTimeout(() => {
                    isAnimating = false;
                }, 300);
            }
        });
        
        browserMockup.addEventListener('mouseleave', function() {
            this.style.transform = 'perspective(1000px) rotateY(-5deg) rotateX(5deg) scale(1)';
        });
    }

    // Download button effects
    document.querySelectorAll('.download-btn').forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            const arrow = this.querySelector('.btn-arrow');
            if (arrow) {
                arrow.style.transform = 'translateX(8px)';
            }
        });
        
        btn.addEventListener('mouseleave', function() {
            const arrow = this.querySelector('.btn-arrow');
            if (arrow) {
                arrow.style.transform = 'translateX(0)';
            }
        });
    });
}

// Initialize interactive effects after DOM is loaded
document.addEventListener('DOMContentLoaded', addInteractiveEffects);

// Performance optimization: Throttle scroll events
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Apply throttling to scroll events
window.addEventListener('scroll', throttle(function() {
    // Scroll-based animations here
}, 16)); // ~60fps

// Add CSS animations dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes animate-fade-in-up {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes animate-scale-in {
        from {
            opacity: 0;
            transform: scale(0.9);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }
    
    .animate-fade-in-up {
        animation: animate-fade-in-up 0.6s ease forwards;
    }
    
    .animate-scale-in {
        animation: animate-scale-in 0.6s ease forwards;
    }
    
    /* Mobile menu styles */
    @media (max-width: 768px) {
        .nav-menu {
            position: fixed;
            top: 70px;
            left: 0;
            right: 0;
            background: white;
            flex-direction: column;
            padding: 20px;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            transform: translateY(-100%);
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        }
        
        .nav-menu.active {
            transform: translateY(0);
            opacity: 1;
            visibility: visible;
        }
        
        .nav-toggle.active span:nth-child(1) {
            transform: rotate(45deg) translate(5px, 5px);
        }
        
        .nav-toggle.active span:nth-child(2) {
            opacity: 0;
        }
        
        .nav-toggle.active span:nth-child(3) {
            transform: rotate(-45deg) translate(7px, -6px);
        }
    }
`;
document.head.appendChild(style);

// Add loading states for GitHub data
function showLoadingState() {
    const starsElement = document.getElementById('github-stars');
    const forksElement = document.getElementById('github-forks');
    
    if (starsElement) {
        starsElement.innerHTML = '<span class="loading"></span>';
    }
    
    if (forksElement) {
        forksElement.innerHTML = '<span class="loading"></span>';
    }
}

// Enhanced error handling
window.addEventListener('error', function(e) {
    console.log('Error caught:', e.error);
    // Graceful degradation - keep functionality working
});

// Service Worker registration for PWA features (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        // Uncomment if you want to add PWA features
        // navigator.serviceWorker.register('/sw.js');
    });
}

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatNumber,
        throttle
    };
}

// Fetch all platform users via shields.io
async function fetchAllPlatformUsers() {
    // Shields.io JSON API
    const sources = [
        {
            name: 'Chrome',
            url: 'https://img.shields.io/chrome-web-store/users/pkgccpejnmalmdinmhkkfafefagiiiad.json',
        },
        {
            name: 'Edge',
            url: 'https://img.shields.io/microsoftedge/addons/users/feolnkbgcbjmamimpfcnklggdcbgakhe.json',
        }
    ];

    let total = 0;
    let details = [];

    for (const src of sources) {
        try {
            const res = await fetch(src.url);
            const data = await res.json();
            // data.value 例："200k"
            let value = data.value.replace(/[^0-9kK+]/g, '');
            let num = 0;
            if (value.endsWith('k') || value.endsWith('K')) {
                num = parseFloat(value) * 1000;
            } else {
                num = parseInt(value, 10);
            }
            total += num;
            details.push(`${src.name}: ${data.value}`);
        } catch (e) {
            details.push(`${src.name}: --`);
        }
    }

    // 格式化总数
    let totalStr = total >= 1000 ? (total / 1000).toFixed(1) + 'K+' : total + '+';
    const numEl = document.getElementById('all-users-number');
    if(numEl) numEl.textContent = totalStr;
    const statEl = document.getElementById('all-users-stat');
    if(statEl) statEl.title = details.join('，');
}

// 工具界面预览区图片放大查看
function initPreviewImageModal() {
    const imgs = document.querySelectorAll('.tool-preview .preview-item img');
    imgs.forEach(img => {
        img.addEventListener('click', function() {
            // 创建弹窗元素
            const modal = document.createElement('div');
            modal.className = 'img-modal';
            modal.innerHTML = `
                <span class="img-modal-close" title="关闭">&times;</span>
                <img src="${img.src}" alt="${img.alt}" />
            `;
            document.body.appendChild(modal);
            // 关闭事件
            modal.querySelector('.img-modal-close').onclick = () => document.body.removeChild(modal);
            modal.onclick = (e) => {
                if (e.target === modal) document.body.removeChild(modal);
            };
        });
    });
} 