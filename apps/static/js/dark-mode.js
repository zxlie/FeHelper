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


    function turnLight(auto) {
        if (isFirefox) return;

        document.documentElement.setAttribute('dark-mode', auto && 'on' || 'off');
        if (!chrome.runtime.lastError && auto) {
            if (window === window.top) {
                window.scrollBy(0, 1);
                window.scrollBy(0, -1);
            }
            window.setTimeout(addOrUpdateExtraElements, 2000);
            addOrUpdateExtraElements();
            let observer = new MutationObserver(function (mutations) {
                addOrUpdateExtraElements();
            });
            observer.observe(document.body, {attributes: true, childList: true, characterData: true});
        }
    }

    // 自动开关等
    function turnLightAuto() {
        if (isFirefox) return;

        chrome.runtime.sendMessage({
            type: 'fh-dynamic-any-thing'
        }, (params) => {
            let hour = new Date().getHours();
            let auto = localStorage.getItem('AUTO_DARK_MODE') === 'true';
            // 支持强制开启，优先级高
            let always = localStorage.getItem('ALWAYS_DARK_MODE') === 'true';
            let switchOn = auto && always;
            if (!switchOn) {
                // 不强制开启的情况下，看是否时间条件满足
                switchOn = auto && (hour >= 19 || hour < 6);
            }
            switchOn && turnLight(switchOn);
            return true;
        });
    }

    return {
        turnLight,
        turnLightAuto
    }
})();
