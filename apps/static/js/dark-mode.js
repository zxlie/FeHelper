/**
 * 对整个页面增加多种滤镜选择，比如：增强对比度、反色等
 * @example PageGrayTool.init('0/1/2/3/4/5')
 */
var DarkModeMgr = (function () {

    let svgContent = `
	<svg xmlns="http://www.w3.org/2000/svg" version="1.1">
		<defs>
			<filter x="0" y="0" width="99999" height="99999" id="_fh_filter_invert">
				<feComponentTransfer>
					<feFuncR type="gamma" amplitude="-1" exponent="3" offset="1"/>
					<feFuncG type="gamma" amplitude="-1" exponent="3" offset="1"/>
					<feFuncB type="gamma" amplitude="-1" exponent="3" offset="1"/>
				</feComponentTransfer>
			</filter>
			<filter x="0" y="0" width="99999" height="99999" id="_fh_filter_invert_back">
				<feComponentTransfer>
					<feFuncR type="table" tableValues="1 0"/>
					<feFuncG type="table" tableValues="1 0"/>
					<feFuncB type="table" tableValues="1 0"/>
				</feComponentTransfer>
				<feComponentTransfer>
					<feFuncR type="gamma" exponent="1.7"/>
					<feFuncG type="gamma" exponent="1.7"/>
					<feFuncB type="gamma" exponent="1.7"/>
				</feComponentTransfer>
			</filter>
			<filter x="0" y="0" width="99999" height="99999" id="_fh_filter_invert_grayscale">
				<feColorMatrix type="matrix" values="0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0 0 0 1 0"/>
				<feComponentTransfer>
					<feFuncR type="gamma" amplitude="-1" exponent="3" offset="1"/>
					<feFuncG type="gamma" amplitude="-1" exponent="3" offset="1"/>
					<feFuncB type="gamma" amplitude="-1" exponent="3" offset="1"/>
				</feComponentTransfer>
			</filter>
		</defs>
	</svg>`;

    let cssTemplate = `
	html[dark-mode="on"] {
	    filter: url("#_fh_filter_invert");
	    -ms-filter: url("#_fh_filter_invert");
	    -webkit-filter: url("#_fh_filter_invert");
	}
	html[dark-mode="on"] img[src*="jpg"],
	html[dark-mode="on"] img[src*="jpeg"],
	html[dark-mode="on"] svg image,
	html[dark-mode="on"] embed,
	html[dark-mode="on"] object,
	html[dark-mode="on"] video {
	    filter: url("#_fh_filter_invert_back");
	    -ms-filter: url("#_fh_filter_invert_back");
	    -webkit-filter: url("#_fh_filter_invert_back");
	}
	html[dark-mode="on"] img[src*="donate.jpeg"] {
	    filter: url("#_fh_filter_invert_grayscale");
	    -ms-filter: url("#_fh_filter_invert_grayscale");
	    -webkit-filter: url("#_fh_filter_invert_grayscale");
	}
	`;

    let isFirefox = /Firefox/.test(navigator.userAgent);
    let filterObserver = null;
    let mediaQueryList = null;
    let mediaQueryHandler = null;
    let autoDarkModeCallbacks = [];
    let lastAutoDarkModeState = null;

    function addOrUpdateExtraElements() {

        let style = document.getElementById('hc_style');
        if (!style) {
            let baseUrl = window.location.href.replace(window.location.hash, '');
            let css = cssTemplate.replace(/#/g, baseUrl + '#');
            style = document.createElement('style');
            style.id = 'hc_style';
            style.setAttribute('type', 'text/css');
            style.innerHTML = css;
            document.head.appendChild(style);
        }

        let bg = document.getElementById('_fh_filter_bkgnd');
        if (!bg) {
            bg = document.createElement('div');
            bg.id = '_fh_filter_bkgnd';
            bg.style.position = 'fixed';
            bg.style.left = '0px';
            bg.style.top = '0px';
            bg.style.right = '0px';
            bg.style.bottom = '0px';
            bg.style.zIndex = -1999999999;
            document.body.appendChild(bg);
        }
        bg.style.display = 'block';
        bg.style.background = window.getComputedStyle(document.body).background;

        let c = (bg.style.backgroundColor || '').replace(/\s\s*/g, '');
        let match = /^rgba\(([\d]+),([\d]+),([\d]+),([\d]+|[\d]*.[\d]+)\)/i.exec(c);
        if (match && match[4] === '0') {
            bg.style.backgroundColor = '#fff';
        }

        let wrap = document.getElementById('_fh_filter_svg_filters');
        if (!wrap) {
            wrap = document.createElement('span');
            wrap.id = '_fh_filter_svg_filters';
            if (!/Firefox/.test(navigator.userAgent)) {
                wrap.setAttribute('hidden', 'hidden');
            }
            wrap.innerHTML = svgContent;
            document.body.appendChild(wrap);
        }
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

    function readChromeStorageSettings(callback) {
        if (
            typeof chrome === 'undefined' ||
            !chrome.storage ||
            !chrome.storage.local ||
            !chrome.storage.local.get
        ) {
            return callback(null);
        }

        try {
            chrome.storage.local.get(['AUTO_DARK_MODE', 'ALWAYS_DARK_MODE'], result => {
                callback(result || null);
            });
        } catch (e) {
            callback(null);
        }
    }

    function isNightTime() {
        let hour = new Date().getHours();
        return hour >= 19 || hour < 6;
    }

    function prefersColorSchemeDark() {
        try {
            return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
        } catch (e) {
            return false;
        }
    }

    function getAutoDarkModeState(settings) {
        let auto = readSetting('AUTO_DARK_MODE', settings);
        let always = readSetting('ALWAYS_DARK_MODE', settings);

        if (always) {
            return true;
        }

        if (!auto) {
            return false;
        }

        return prefersColorSchemeDark() || isNightTime();
    }

    function emitAutoDarkModeChange(enabled, force) {
        enabled = !!enabled;
        if (!force && lastAutoDarkModeState === enabled) {
            return;
        }

        lastAutoDarkModeState = enabled;

        autoDarkModeCallbacks.forEach(callback => {
            try {
                callback(enabled);
            } catch (e) {}
        });

        try {
            window.dispatchEvent(new CustomEvent('fh-dark-mode-change', {
                detail: {enabled}
            }));
        } catch (e) {}
    }

    function syncAutoDarkMode(options) {
        options = options || {};
        let enabled = getAutoDarkModeState(options.settings);
        if (options.applyFilter) {
            turnLight(enabled);
        }
        emitAutoDarkModeChange(enabled, options.force);
        return enabled;
    }

    function syncAutoDarkModeFromStorage(options) {
        options = options || {};
        let enabled = syncAutoDarkMode(options);

        readChromeStorageSettings(settings => {
            if (!settings) {
                return;
            }

            syncAutoDarkMode(Object.assign({}, options, {
                settings,
                force: options.force || enabled !== getAutoDarkModeState(settings)
            }));
        });

        return enabled;
    }

    function ensureAutoDarkModeWatcher(options) {
        if (mediaQueryHandler) {
            return;
        }

        mediaQueryHandler = function () {
            syncAutoDarkMode(options);
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
                syncAutoDarkModeFromStorage(options);
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
                    syncAutoDarkModeFromStorage(options);
                }
            });
        }
    }

    function watchAutoDarkMode(callback, options) {
        options = options || {};
        if (typeof callback === 'function') {
            autoDarkModeCallbacks.push(callback);
        }
        ensureAutoDarkModeWatcher(options);
        syncAutoDarkModeFromStorage({applyFilter: !!options.applyFilter, force: true});

        return function () {
            autoDarkModeCallbacks = autoDarkModeCallbacks.filter(item => item !== callback);
        };
    }

    function turnLight(auto) {
        if (isFirefox) return;

        document.documentElement.setAttribute('dark-mode', auto ? 'on' : 'off');

        if (!auto) {
            let bg = document.getElementById('_fh_filter_bkgnd');
            if (bg) {
                bg.style.display = 'none';
            }
            if (filterObserver) {
                filterObserver.disconnect();
                filterObserver = null;
            }
            return;
        }

        let hasChromeRuntime = typeof chrome !== 'undefined' && chrome.runtime;
        if (hasChromeRuntime && !chrome.runtime.lastError) {
            if (window === window.top) {
                window.scrollBy(0, 1);
                window.scrollBy(0, -1);
            }
            window.setTimeout(addOrUpdateExtraElements, 2000);
            addOrUpdateExtraElements();
            if (!filterObserver) {
                filterObserver = new MutationObserver(function (mutations) {
                    addOrUpdateExtraElements();
                });
                filterObserver.observe(document.body, {attributes: true, childList: true, characterData: true});
            }
        }
    }

    // 自动开关等
    function turnLightAuto() {
        if (isFirefox) return;

        ensureAutoDarkModeWatcher({applyFilter: true});
        syncAutoDarkModeFromStorage({applyFilter: true});
    }

    return {
        getAutoDarkModeState,
        watchAutoDarkMode,
        turnLight,
        turnLightAuto
    }
})();
