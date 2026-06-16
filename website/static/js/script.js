document.addEventListener('DOMContentLoaded', function () {
    initNavigation();
    initToolTabs();
    initSmoothScrolling();
    initPreviewImageModal();
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
