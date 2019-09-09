/**
 * 对整个页面增加多种滤镜选择，比如：增强对比度、反色等
 * @example PageGrayTool.init('0/1/2/3/4/5')
 */
let PageGrayTool = (function () {

    let mode;
    let scheme = '4';

    let svgContent = `
	<svg xmlns="http://www.w3.org/2000/svg" version="1.1">
		<defs>
			<filter x="0" y="0" width="99999" height="99999" id="_fh_page_modifier_off">
				<feComponentTransfer>
					<feFuncR type="table" tableValues="0 1"/>
					<feFuncG type="table" tableValues="0 1"/>
					<feFuncB type="table" tableValues="0 1"/>
				</feComponentTransfer>
			</filter>
			<filter x="0" y="0" width="99999" height="99999" id="_fh_page_modifier_highlight">
				<feComponentTransfer>
					<feFuncR type="gamma" exponent="3.0"/>
					<feFuncG type="gamma" exponent="3.0"/>
					<feFuncB type="gamma" exponent="3.0"/>
				</feComponentTransfer>
			</filter>
			<filter x="0" y="0" width="99999" height="99999" id="_fh_page_modifier_highlight_back">
				<feComponentTransfer>
					<feFuncR type="gamma" exponent="0.33"/>
					<feFuncG type="gamma" exponent="0.33"/>
					<feFuncB type="gamma" exponent="0.33"/>
				</feComponentTransfer>
			</filter>
			<filter x="0" y="0" width="99999" height="99999" id="_fh_page_modifier_grayscale">
				<feColorMatrix type="matrix" values="0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0 0 0 1 0"/>
				<feComponentTransfer>
					<feFuncR type="gamma" exponent="3"/>
					<feFuncG type="gamma" exponent="3"/>
					<feFuncB type="gamma" exponent="3"/>
				</feComponentTransfer>
			</filter>
			<filter x="0" y="0" width="99999" height="99999" id="_fh_page_modifier_grayscale_back">
				<feComponentTransfer>
					<feFuncR type="gamma" exponent="0.33"/>
					<feFuncG type="gamma" exponent="0.33"/>
					<feFuncB type="gamma" exponent="0.33"/>
				</feComponentTransfer>
			</filter>
			<filter x="0" y="0" width="99999" height="99999" id="_fh_page_modifier_invert">
				<feComponentTransfer>
					<feFuncR type="gamma" amplitude="-1" exponent="3" offset="1"/>
					<feFuncG type="gamma" amplitude="-1" exponent="3" offset="1"/>
					<feFuncB type="gamma" amplitude="-1" exponent="3" offset="1"/>
				</feComponentTransfer>
			</filter>
			<filter x="0" y="0" width="99999" height="99999" id="_fh_page_modifier_invert_back">
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
			<filter x="0" y="0" width="99999" height="99999" id="_fh_page_modifier_invert_grayscale">
				<feColorMatrix type="matrix" values="0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0 0 0 1 0"/>
				<feComponentTransfer>
					<feFuncR type="gamma" amplitude="-1" exponent="3" offset="1"/>
					<feFuncG type="gamma" amplitude="-1" exponent="3" offset="1"/>
					<feFuncB type="gamma" amplitude="-1" exponent="3" offset="1"/>
				</feComponentTransfer>
			</filter>
			<filter x="0" y="0" width="99999" height="99999" id="_fh_page_modifier_yellow_on_black">
				<feComponentTransfer>
					<feFuncR type="gamma" amplitude="-1" exponent="3" offset="1"/>
					<feFuncG type="gamma" amplitude="-1" exponent="3" offset="1"/>
					<feFuncB type="gamma" amplitude="-1" exponent="3" offset="1"/>
				</feComponentTransfer>
				<feColorMatrix type="matrix" values="0.3 0.5 0.2 0 0 0.3 0.5 0.2 0 0 0 0 0 0 0 0 0 0 1 0"/>
			</filter>
			<filter x="0" y="0" width="99999" height="99999" id="_fh_page_modifier_yellow_on_black_back">
				<feComponentTransfer>
					<feFuncR type="table" tableValues="1 0"/>
					<feFuncG type="table" tableValues="1 0"/>
					<feFuncB type="table" tableValues="1 0"/>
				</feComponentTransfer>
				<feComponentTransfer>
					<feFuncR type="gamma" exponent="0.33"/>
					<feFuncG type="gamma" exponent="0.33"/>
					<feFuncB type="gamma" exponent="0.33"/>
				</feComponentTransfer>
			</filter>
		</defs>
	</svg>`;

    let cssTemplate = `
	html[hc="a0"] {
	    -webkit-filter: url("#_fh_page_modifier_off");
	}
	html[hcx="0"] img[src*="jpg"], 
	html[hcx="0"] img[src*="jpeg"], 
	html[hcx="0"] svg image, 
	html[hcx="0"] img.rg_i, 
	html[hcx="0"] embed, 
	html[hcx="0"] object, 
	html[hcx="0"] video {
	    -webkit-filter: url("#_fh_page_modifier_off");
	}
	html[hc="a1"] {
	    -webkit-filter: url("#_fh_page_modifier_highlight");
	}
	html[hcx="1"] img[src*="jpg"], 
	html[hcx="1"] img[src*="jpeg"], 
	html[hcx="1"] img.rg_i, 
	html[hcx="1"] svg image, 
	html[hcx="1"] embed, 
	html[hcx="1"] object, 
	html[hcx="1"] video {
	    -webkit-filter: url("#_fh_page_modifier_highlight_back");
	}
	html[hc="a2"] {
	    -webkit-filter: url("#_fh_page_modifier_grayscale");
	}
	html[hcx="2"] img[src*="jpg"], 
	html[hcx="2"] img[src*="jpeg"], 
	html[hcx="2"] img.rg_i, 
	html[hcx="2"] svg image, 
	html[hcx="2"] embed, 
	html[hcx="2"] object, 
	html[hcx="2"] video {
	    -webkit-filter: url("#_fh_page_modifier_grayscale_back");
	}
	html[hc="a3"] {
	    -webkit-filter: url("#_fh_page_modifier_invert");
	}
	html[hcx="3"] img[src*="jpg"], 
	html[hcx="3"] img[src*="jpeg"], 
	html[hcx="3"] img.rg_i, 
	html[hcx="3"] svg image, 
	html[hcx="3"] embed, 
	html[hcx="3"] object, 
	html[hcx="3"] video {
	    -webkit-filter: url("#_fh_page_modifier_invert_back");
	}
	html[hc="a4"] {
	    -webkit-filter: url("#_fh_page_modifier_invert_grayscale");
	}
	html[hcx="4"] img[src*="jpg"], 
	html[hcx="4"] img[src*="jpeg"], 
	html[hcx="4"] img.rg_i, 
	html[hcx="4"] svg image, 
	html[hcx="4"] embed, 
	html[hcx="4"] object, 
	html[hcx="4"] video {
	    -webkit-filter: url("#_fh_page_modifier_invert_back");
	}
	html[hc="a5"] {
	    -webkit-filter: url("#_fh_page_modifier_yellow_on_black");
	}
	html[hcx="5"] img[src*="jpg"], 
	html[hcx="5"] img[src*="jpeg"], 
	html[hcx="5"] img.rg_i, 
	html[hcx="5"] svg image, 
	html[hcx="5"] embed, 
	html[hcx="5"] object, 
	html[hcx="5"] video {
	    -webkit-filter: url("#_fh_page_modifier_yellow_on_black_back");
	}`;

    /**
     * Add the elements to the pgae that make high-contrast adjustments possible.
     */
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

        let bg = document.getElementById('_fh_page_modifier_bkgnd');
        if (!bg) {
            bg = document.createElement('div');
            bg.id = '_fh_page_modifier_bkgnd';
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

        let wrap = document.getElementById('_fh_page_modifier_svg_filters');
        if (wrap)
            return;

        wrap = document.createElement('span');
        wrap.id = '_fh_page_modifier_svg_filters';
        wrap.setAttribute('hidden', '');
        wrap.innerHTML = svgContent;
        document.body.appendChild(wrap);
    }


    function init(grayLevel) {

        if (window === window.top) {
            mode = 'a';
        } else {
            mode = 'b';
        }

        scheme = grayLevel || scheme;

        let html = document.documentElement;

        html.setAttribute('hc', mode + scheme);
        html.setAttribute('hcx', scheme);

        if (window === window.top) {
            window.scrollBy(0, 1);
            window.scrollBy(0, -1);
        }

        // Update again after a few seconds and again after load so that
        // the background isn't wrong for long.
        window.setTimeout(addOrUpdateExtraElements, 2000);
        addOrUpdateExtraElements();

        // Also update when the document body attributes change.
        let config = {attributes: true, childList: true, characterData: true};
        let observer = new MutationObserver(function (mutations) {
            addOrUpdateExtraElements();
        });
        observer.observe(document.body, config);

    }

    return {
        init: init
    };
})();

/**
 * 页面修改器
 * @param pageConfig
 * @constructor
 */
let PageModify = function (pageConfig) {
    if (pageConfig && pageConfig.id && pageConfig.mPattern && !pageConfig.mDisabled) {

        let m = pageConfig.mPattern.match(/\/(.*)\/(.*)?/);
        // 如果正则匹配的话才生效
        if ((new RegExp(m[1], m[2] || '')).test(location.href)) {

            let el = document.createElement('script');
            el.type = 'text/javascript';
            el.textContent = pageConfig.mScript;
            document.body.appendChild(el);

            // 如果需要进行页面filter处理的话，直接处理
            pageConfig.mFilter && PageGrayTool.init(pageConfig.mFilter);
            // 自动刷新
            parseInt(pageConfig.mRefresh) && setTimeout(() => {
                location.reload(true);
            }, parseInt(pageConfig.mRefresh) * 1000);
        }

    }
};

/**
 * 获取当前页面modifier配置
 */
let ModifyCurrentPage = function () {

    chrome.runtime.sendMessage({
        type: 'get_page_modifier_config',
        params: {
            url: location.href
        }
    }, function (pageConfig) {
        pageConfig && PageModify(pageConfig);
    });
};

ModifyCurrentPage();