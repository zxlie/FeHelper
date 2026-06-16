document.addEventListener('DOMContentLoaded', function () {
    initNavigation();
    initToolTabs();
    initSmoothScrolling();
    initPreviewImageModal();
    initGitHubStats();
    initRevealObserver();
});

function initNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (!navToggle || !navMenu) return;

    function setOpen(open) {
        navMenu.classList.toggle('active', open);
        navToggle.classList.toggle('active', open);
        navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        document.body.classList.toggle('menu-open', open);
    }

    navToggle.addEventListener('click', function () {
        setOpen(!navMenu.classList.contains('active'));
    });

    navMenu.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
            setOpen(false);
        });
    });

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            setOpen(false);
        }
    });
}

function initToolTabs() {
    const tabButtons = Array.from(document.querySelectorAll('.tab-btn'));
    const toolGrids = Array.from(document.querySelectorAll('.tools-grid'));

    if (!tabButtons.length || !toolGrids.length) return;

    tabButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            const category = button.dataset.category;
            tabButtons.forEach(function (btn) {
                btn.classList.toggle('active', btn === button);
            });
            toolGrids.forEach(function (grid) {
                grid.classList.toggle('active', grid.dataset.category === category);
            });
        });
    });
}

function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (event) {
            const href = anchor.getAttribute('href');
            if (!href || href === '#') return;
            const target = document.querySelector(href);
            if (!target) return;
            event.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
}

function initPreviewImageModal() {
    document.querySelectorAll('.tool-preview .preview-item img').forEach(function (img) {
        img.addEventListener('click', function () {
            const modal = document.createElement('div');
            modal.className = 'img-modal';

            const close = document.createElement('button');
            close.type = 'button';
            close.className = 'img-modal-close';
            close.setAttribute('aria-label', '关闭预览');
            close.textContent = '×';

            const image = document.createElement('img');
            image.src = img.src;
            image.alt = img.alt || 'FeHelper 截图预览';

            modal.appendChild(close);
            modal.appendChild(image);
            document.body.appendChild(modal);

            function closeModal() {
                modal.remove();
                document.removeEventListener('keydown', onKeydown);
            }

            function onKeydown(event) {
                if (event.key === 'Escape') closeModal();
            }

            close.addEventListener('click', closeModal);
            modal.addEventListener('click', function (event) {
                if (event.target === modal) closeModal();
            });
            document.addEventListener('keydown', onKeydown);
        });
    });
}

function initGitHubStats() {
    const badges = Array.from(document.querySelectorAll('[data-github-stat]'));
    if (!badges.length || !window.fetch) return;

    function formatCompactNumber(value) {
        const number = Number(value);
        if (!Number.isFinite(number)) return '';
        if (number >= 1000000) return trimCompact(number / 1000000) + 'M';
        if (number >= 1000) return trimCompact(number / 1000) + 'K';
        return String(number);
    }

    function trimCompact(value) {
        return value.toFixed(value >= 10 ? 0 : 1).replace(/\.0$/, '');
    }

    function setFallbacks() {
        badges.forEach(function (badge) {
            const value = badge.querySelector('.metric-value');
            if (value && value.dataset.fallback) {
                value.textContent = value.dataset.fallback;
            }
        });
    }

    fetch('https://api.github.com/repos/zxlie/FeHelper', {
        headers: {
            Accept: 'application/vnd.github+json'
        }
    })
        .then(function (response) {
            if (!response.ok) throw new Error('GitHub API request failed');
            return response.json();
        })
        .then(function (repo) {
            const stats = {
                stars: repo.stargazers_count,
                forks: repo.forks_count
            };

            badges.forEach(function (badge) {
                const statName = badge.dataset.githubStat;
                const value = badge.querySelector('.metric-value');
                const statValue = stats[statName];
                if (!value || typeof statValue !== 'number') return;
                value.textContent = formatCompactNumber(statValue);
                value.title = statValue.toLocaleString('en-US');
            });
        })
        .catch(setFallbacks);
}

function initRevealObserver() {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const elements = document.querySelectorAll('.value-card, .tool-card, .ai-provider, .preview-item, .download-btn');
    if (reduceMotion || !('IntersectionObserver' in window)) return;

    elements.forEach(function (element) {
        element.classList.add('reveal-on-scroll');
    });

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
    });

    elements.forEach(function (element) {
        observer.observe(element);
    });
}
