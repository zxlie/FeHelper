(function () {
    let mediaQueryList = null;
    let mediaQueryHandler = null;

    function isElement(node) {
        return node && node.nodeType === 1;
    }

    function isEnabledSetting(value) {
        return value === true || value === 'true';
    }

    function readLocalSetting(key) {
        try {
            return isEnabledSetting(localStorage.getItem(key));
        } catch (e) {
            return false;
        }
    }

    function readSetting(key, settings) {
        if (settings && Object.prototype.hasOwnProperty.call(settings, key)) {
            return isEnabledSetting(settings[key]);
        }
        return readLocalSetting(key);
    }

    function prefersColorSchemeDark() {
        try {
            return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
        } catch (e) {
            return false;
        }
    }

    function getToolDarkModeState(settings) {
        let auto = readSetting('AUTO_DARK_MODE', settings);
        let always = readSetting('ALWAYS_DARK_MODE', settings);

        if (always) {
            return true;
        }
        if (!auto) {
            return false;
        }
        return prefersColorSchemeDark();
    }

    function applyToolDarkMode(enabled) {
        if (!document.body || !document.body.classList.contains('fh-modern')) {
            return;
        }

        enabled = !!enabled;
        document.body.classList.toggle('theme-dark', enabled);
        document.body.classList.toggle('theme-default', !enabled);
        document.documentElement.setAttribute('data-theme', enabled ? 'dark' : 'light');
        document.documentElement.setAttribute('dark-mode', enabled ? 'on' : 'off');
    }

    function readChromeStorageSettings(callback) {
        if (
            typeof chrome === 'undefined' ||
            !chrome.storage ||
            !chrome.storage.local ||
            !chrome.storage.local.get
        ) {
            callback(null);
            return;
        }

        try {
            chrome.storage.local.get(['AUTO_DARK_MODE', 'ALWAYS_DARK_MODE'], result => {
                callback(result || null);
            });
        } catch (e) {
            callback(null);
        }
    }

    function syncToolDarkMode(settings) {
        applyToolDarkMode(getToolDarkModeState(settings));
    }

    function syncToolDarkModeFromStorage() {
        syncToolDarkMode(null);
        readChromeStorageSettings(settings => {
            if (settings) {
                syncToolDarkMode(settings);
            }
        });
    }

    function ensureToolDarkModeWatcher() {
        if (mediaQueryHandler) {
            return;
        }

        mediaQueryHandler = function () {
            syncToolDarkModeFromStorage();
        };

        try {
            mediaQueryList = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
            if (mediaQueryList) {
                if (mediaQueryList.addEventListener) {
                    mediaQueryList.addEventListener('change', mediaQueryHandler);
                } else if (mediaQueryList.addListener) {
                    mediaQueryList.addListener(mediaQueryHandler);
                }
            }
        } catch (e) {}

        window.addEventListener('storage', function (event) {
            if (event.key === 'AUTO_DARK_MODE' || event.key === 'ALWAYS_DARK_MODE') {
                syncToolDarkModeFromStorage();
            }
        });

        if (
            typeof chrome !== 'undefined' &&
            chrome.storage &&
            chrome.storage.onChanged &&
            chrome.storage.onChanged.addListener
        ) {
            chrome.storage.onChanged.addListener((changes, areaName) => {
                if (
                    areaName === 'local' &&
                    (changes.AUTO_DARK_MODE || changes.ALWAYS_DARK_MODE)
                ) {
                    syncToolDarkModeFromStorage();
                }
            });
        }
    }

    function cleanTextNode(node) {
        if (!node || node.nodeType !== 3) {
            return;
        }
        node.nodeValue = node.nodeValue
            .replace(/^[\s:：|｜\-–—]+/, '')
            .replace(/\s+/g, ' ');
    }

    function cleanTitleNode(node) {
        if (!node) {
            return;
        }
        if (node.nodeType === 3) {
            cleanTextNode(node);
            return;
        }
        if (!isElement(node)) {
            return;
        }
        Array.from(node.childNodes).forEach(cleanTitleNode);
    }

    function cleanBrandLink(brandLink) {
        if (!brandLink) {
            return;
        }
        Array.from(brandLink.childNodes).forEach(node => {
            if (node.nodeType === 3) {
                node.nodeValue = node.nodeValue.replace(/[：:|｜]\s*$/, '');
            }
        });
    }

    function isBlankNode(node) {
        return node && node.nodeType === 3 && !node.nodeValue.trim();
    }

    function isActionNode(node, brandLink) {
        if (!isElement(node)) {
            return false;
        }
        if (node === brandLink || node.contains(brandLink)) {
            return false;
        }
        if (node.matches('.x-donate-link, .x-other-tools, .x-switch, .fh-nav-btn, .example-links, .x-xdemo, .x-toolbox, .x-gmt-setting, .fh-tool-actions, .qr-header-actions, .navbar-actions, .mod-head-actions')) {
            return true;
        }
        if (node.matches('button')) {
            return true;
        }
        if (node.matches('a') && !node.matches('.x-a-high, .brand-link, .header-link')) {
            return true;
        }
        return false;
    }

    function collectTitleFromBrandContainer(container, brandLink, titleNodes) {
        Array.from(container.childNodes).forEach(node => {
            if (node === brandLink || (isElement(node) && node.contains(brandLink))) {
                if (node !== brandLink && isElement(node)) {
                    collectTitleFromBrandContainer(node, brandLink, titleNodes);
                }
                return;
            }
            if (!isBlankNode(node)) {
                titleNodes.push(node);
            }
        });
    }

    function collectNestedActions(container, brandLink, titleNode, actionNodes) {
        Array.from(container.childNodes).forEach(node => {
            if (node === brandLink || node === titleNode) {
                return;
            }
            if (isElement(node) && (node.contains(brandLink) || (titleNode && node.contains(titleNode)))) {
                collectNestedActions(node, brandLink, titleNode, actionNodes);
                return;
            }
            if (isActionNode(node, brandLink)) {
                actionNodes.push(node);
            }
        });
    }

    function getFallbackTitle() {
        let title = (document.title || '').trim();
        return title
            .replace(/^FeHelper\s*[-|｜:：]\s*/i, '')
            .replace(/\s*[-|｜:：]\s*FeHelper$/i, '')
            .replace(/^FeHelper/i, '')
            .trim();
    }

    function isDonateAction(node) {
        return isElement(node) && node.matches('.x-donate-link');
    }

    function moveDonateActionsLast(container) {
        if (!container || !isElement(container)) {
            return;
        }
        Array.from(container.children)
            .filter(isDonateAction)
            .forEach(node => container.appendChild(node));
    }

    function appendActions(actionsWrap, actionNodes) {
        let regularNodes = [];
        let donateNodes = [];

        actionNodes.forEach(node => {
            if (!node || isBlankNode(node)) {
                return;
            }
            (isDonateAction(node) ? donateNodes : regularNodes).push(node);
        });

        regularNodes.concat(donateNodes).forEach(node => {
            if (isElement(node)) {
                node.classList.add('fh-header-action-item');
                moveDonateActionsLast(node);
            }
            actionsWrap.appendChild(node);
        });
        moveDonateActionsLast(actionsWrap);
    }

    function rebuildHeader(container, brandLink, titleNodes, actionNodes) {
        if (!container || !brandLink || container.classList.contains('fh-tool-layout-ready')) {
            return;
        }

        cleanBrandLink(brandLink);
        brandLink.classList.add('fh-tool-brand-link');
        brandLink.setAttribute('aria-label', 'FeHelper');

        let brandLine = document.createElement('span');
        brandLine.className = 'fh-tool-brand-line';

        let divider = document.createElement('span');
        divider.className = 'fh-tool-title-divider';
        divider.setAttribute('aria-hidden', 'true');
        divider.textContent = '｜';

        let title = document.createElement('span');
        title.className = 'fh-tool-title';

        titleNodes.forEach(node => {
            cleanTitleNode(node);
            if (isBlankNode(node)) {
                return;
            }
            title.appendChild(node);
        });

        if (!title.textContent.trim()) {
            let fallbackTitle = getFallbackTitle();
            if (fallbackTitle) {
                title.textContent = fallbackTitle;
            }
        }

        let actions = document.createElement('span');
        actions.className = 'fh-tool-header-actions';
        appendActions(actions, actionNodes);

        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        brandLine.appendChild(brandLink);
        if (title.textContent.trim()) {
            brandLine.appendChild(divider);
            brandLine.appendChild(title);
        }
        container.appendChild(brandLine);
        if (actions.childNodes.length) {
            container.appendChild(actions);
        }
        container.classList.add('fh-tool-layout-ready');
    }

    function normalizeFlatContainer(container, brandSelector, titleSelector) {
        let brandLink = container.querySelector(brandSelector);
        if (!brandLink) {
            return false;
        }

        let titleNodes = [];
        let actionNodes = [];
        let titleNode = titleSelector && container.querySelector(titleSelector);

        if (titleNode && brandLink.contains(titleNode)) {
            titleNodes.push(titleNode);
        }

        Array.from(container.childNodes).forEach(node => {
            if (node === brandLink || (isElement(node) && node.contains(brandLink))) {
                if (node !== brandLink && isElement(node)) {
                    collectNestedActions(node, brandLink, titleNode, actionNodes);
                }
                if (!titleNode && node !== brandLink && isElement(node)) {
                    collectTitleFromBrandContainer(node, brandLink, titleNodes);
                }
                return;
            }
            if (titleNode && (node === titleNode || (isElement(node) && node.contains(titleNode)))) {
                if (node !== titleNode && isElement(node)) {
                    titleNodes.push(titleNode);
                } else {
                    titleNodes.push(node);
                }
                return;
            }
            if (isActionNode(node, brandLink)) {
                actionNodes.push(node);
                return;
            }
            if (!isBlankNode(node)) {
                titleNodes.push(node);
            }
        });

        rebuildHeader(container, brandLink, titleNodes, actionNodes);
        return true;
    }

    function normalizePanelHeading(header) {
        let container = header.querySelector('.panel-title') || header;
        let brandLink = container.querySelector('.x-a-high, .brand-link, .header-link');
        if (!brandLink) {
            return false;
        }

        let titleNodes = [];
        let actionNodes = [];

        Array.from(container.childNodes).forEach(node => {
            if (node === brandLink || (isElement(node) && node.contains(brandLink))) {
                if (node !== brandLink && isElement(node)) {
                    collectTitleFromBrandContainer(node, brandLink, titleNodes);
                }
                return;
            }
            if (isActionNode(node, brandLink)) {
                actionNodes.push(node);
                return;
            }
            if (!isBlankNode(node)) {
                titleNodes.push(node);
            }
        });

        header.classList.add('fh-unified-header');
        rebuildHeader(container, brandLink, titleNodes, actionNodes);
        return true;
    }

    function normalizeMainNavbar(header) {
        header.classList.add('fh-unified-header');
        return normalizeFlatContainer(header, '.brand-link', '.brand-subtitle');
    }

    function normalizePageHeader(header) {
        header.classList.add('fh-unified-header');
        return normalizeFlatContainer(header, '.header-link', '.page-title-suffix');
    }

    function normalizeToolHeader() {
        if (!document.body || !document.body.classList.contains('fh-modern')) {
            return;
        }

        let header = document.querySelector('.main-navbar, .page-header, .panel-heading');
        if (!header || header.classList.contains('fh-unified-header')) {
            return;
        }

        document.body.classList.add('fh-tool-layout');

        let wrapper = header.closest('.wrapper');
        if (wrapper && wrapper.nextElementSibling && wrapper.nextElementSibling.matches('main.container')) {
            wrapper.classList.add('fh-header-only-wrapper');
        }

        if (header.classList.contains('main-navbar')) {
            normalizeMainNavbar(header);
            return;
        }
        if (header.classList.contains('page-header')) {
            normalizePageHeader(header);
            return;
        }
        normalizePanelHeading(header);
    }

    function normalizeToolDarkMode() {
        if (!document.body || !document.body.classList.contains('fh-modern')) {
            return;
        }

        syncToolDarkModeFromStorage();
        ensureToolDarkModeWatcher();
        window.setTimeout(syncToolDarkModeFromStorage, 0);
        window.setTimeout(syncToolDarkModeFromStorage, 100);
        window.setTimeout(syncToolDarkModeFromStorage, 500);
    }

    normalizeToolDarkMode();
    normalizeToolHeader();
})();
