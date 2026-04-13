
window.codebeautifyContentScript = (() => {

    let formattedCodes = '';
    let cssInjected = false;

    /**
     * 内联 CSS 美化器（从 beautify-worker.js 移入，避免 Worker 在内容脚本中因相对路径失败）
     */
    let cssBeautify = (source_text, options) => {
        options = options || {};
        let indentSize = options.indent_size || 4;
        let indentCharacter = options.indent_char || ' ';
        if (typeof indentSize === "string") indentSize = parseInt(indentSize, 10);

        let whiteRe = /^\s+$/;
        let pos = -1, ch;
        let next = () => { ch = source_text.charAt(++pos); return ch; };
        let peek = () => source_text.charAt(pos + 1);

        let eatString = (comma) => {
            let start = pos;
            while (next()) {
                if (ch === "\\") { next(); next(); }
                else if (ch === comma) { break; }
                else if (ch === "\n") { break; }
            }
            return source_text.substring(start, pos + 1);
        };

        let eatWhitespace = () => { let start = pos; while (whiteRe.test(peek())) pos++; return pos !== start; };
        let skipWhitespace = () => { let start = pos; do {} while (whiteRe.test(next())); return pos !== start + 1; };

        let eatComment = () => {
            let start = pos; next();
            while (next()) { if (ch === "*" && peek() === "/") { pos++; break; } }
            return source_text.substring(start, pos + 1);
        };

        let lookBack = (str) => source_text.substring(pos - str.length, pos).toLowerCase() === str;

        let indentString = source_text.match(/^[\r\n]*[\t ]*/)[0];
        let singleIndent = Array(indentSize + 1).join(indentCharacter);
        let indentLevel = 0;
        let indent = () => { indentLevel++; indentString += singleIndent; };
        let outdent = () => { indentLevel--; indentString = indentString.slice(0, -indentSize); };

        let output = [];
        let print = {};
        print["{"] = (c) => { print.singleSpace(); output.push(c); print.newLine(); };
        print["}"] = (c) => { print.newLine(); output.push(c); print.newLine(); };
        print.newLine = (keepWhitespace) => {
            if (!keepWhitespace) { while (whiteRe.test(output[output.length - 1])) output.pop(); }
            if (output.length) output.push('\n');
            if (indentString) output.push(indentString);
        };
        print.singleSpace = () => { if (output.length && !whiteRe.test(output[output.length - 1])) output.push(' '); };

        if (indentString) output.push(indentString);

        while (true) {
            let isAfterSpace = skipWhitespace();
            if (!ch) break;
            if (ch === '{') { indent(); print["{"](ch); }
            else if (ch === '}') { outdent(); print["}"](ch); }
            else if (ch === '"' || ch === '\'') { output.push(eatString(ch)); }
            else if (ch === ';') { output.push(ch, '\n', indentString); }
            else if (ch === '/' && peek() === '*') { print.newLine(); output.push(eatComment(), "\n", indentString); }
            else if (ch === '(') {
                if (lookBack("url")) {
                    output.push(ch); eatWhitespace();
                    if (next()) { if (ch !== ')' && ch !== '"' && ch !== '\'') output.push(eatString(')')); else pos--; }
                } else { if (isAfterSpace) print.singleSpace(); output.push(ch); eatWhitespace(); }
            }
            else if (ch === ')') { output.push(ch); }
            else if (ch === ',') { eatWhitespace(); output.push(ch); print.singleSpace(); }
            else if (ch === ']') { output.push(ch); }
            else if (ch === '[' || ch === '=') { eatWhitespace(); output.push(ch); }
            else { if (isAfterSpace) print.singleSpace(); output.push(ch); }
        }

        return output.join('').replace(/[\n ]+$/, '');
    };

    let esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    let span = (cls, text) => '<span class="hl-' + cls + '">' + esc(text) + '</span>';

    let JS_KW = new Set('break,case,catch,continue,debugger,default,delete,do,else,finally,for,function,if,in,instanceof,new,return,switch,this,throw,try,typeof,var,void,while,with,class,const,enum,export,extends,import,super,implements,interface,let,package,private,protected,public,static,yield,of,async,await,from'.split(','));
    let CSS_KW = new Set('important,media,keyframes,import,charset,font-face,supports,page,namespace'.split(','));
    let CSS_PROPS = new Set('color,background,background-color,background-image,background-size,background-position,background-repeat,border,border-radius,border-color,border-width,border-style,border-top,border-right,border-bottom,border-left,margin,margin-top,margin-right,margin-bottom,margin-left,padding,padding-top,padding-right,padding-bottom,padding-left,width,height,min-width,max-width,min-height,max-height,display,position,top,right,bottom,left,float,clear,overflow,overflow-x,overflow-y,z-index,font,font-size,font-weight,font-family,font-style,line-height,text-align,text-decoration,text-transform,text-indent,text-shadow,letter-spacing,word-spacing,white-space,vertical-align,cursor,opacity,visibility,box-shadow,box-sizing,transition,transform,animation,flex,flex-direction,flex-wrap,flex-grow,flex-shrink,flex-basis,justify-content,align-items,align-content,align-self,gap,grid,grid-template,grid-template-columns,grid-template-rows,content,list-style,outline,pointer-events,resize,user-select,fill,stroke'.split(','));

    let highlightJS = (code) => {
        let out = '';
        let i = 0;
        let len = code.length;
        while (i < len) {
            let c = code[i];
            if (c === '/' && code[i + 1] === '/') {
                let end = code.indexOf('\n', i);
                if (end === -1) end = len;
                out += span('comment', code.substring(i, end));
                i = end;
            } else if (c === '/' && code[i + 1] === '*') {
                let end = code.indexOf('*/', i + 2);
                end = end === -1 ? len : end + 2;
                out += span('comment', code.substring(i, end));
                i = end;
            } else if (c === '"' || c === "'" || c === '`') {
                let q = c, j = i + 1;
                while (j < len) {
                    if (code[j] === '\\') { j += 2; continue; }
                    if (code[j] === q) { j++; break; }
                    if (q !== '`' && code[j] === '\n') break;
                    j++;
                }
                out += span('string', code.substring(i, j));
                i = j;
            } else if (c === '/' && /[=(,;:!&|?{}\[\n+\-~^%]/.test(code[i - 1] || '(')) {
                let j = i + 1;
                while (j < len && code[j] !== '/' && code[j] !== '\n') {
                    if (code[j] === '\\') j++;
                    j++;
                }
                if (j < len && code[j] === '/') {
                    j++;
                    while (j < len && /[gimsuy]/.test(code[j])) j++;
                    out += span('regex', code.substring(i, j));
                    i = j;
                } else { out += esc(c); i++; }
            } else if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(code[i + 1]))) {
                let j = i;
                if (code[j] === '0' && (code[j + 1] === 'x' || code[j + 1] === 'X')) {
                    j += 2; while (j < len && /[0-9a-fA-F_]/.test(code[j])) j++;
                } else if (code[j] === '0' && (code[j + 1] === 'b' || code[j + 1] === 'B')) {
                    j += 2; while (j < len && /[01_]/.test(code[j])) j++;
                } else {
                    while (j < len && /[0-9_]/.test(code[j])) j++;
                    if (j < len && code[j] === '.') { j++; while (j < len && /[0-9_]/.test(code[j])) j++; }
                    if (j < len && (code[j] === 'e' || code[j] === 'E')) { j++; if (code[j] === '+' || code[j] === '-') j++; while (j < len && /[0-9]/.test(code[j])) j++; }
                }
                if (j < len && code[j] === 'n') j++;
                out += span('number', code.substring(i, j));
                i = j;
            } else if (/[a-zA-Z_$]/.test(c)) {
                let j = i;
                while (j < len && /[a-zA-Z0-9_$]/.test(code[j])) j++;
                let word = code.substring(i, j);
                if (JS_KW.has(word)) out += span('keyword', word);
                else if (word === 'true' || word === 'false' || word === 'null' || word === 'undefined' || word === 'NaN' || word === 'Infinity') out += span('literal', word);
                else out += esc(word);
                i = j;
            } else if (c === '\n') { out += '\n'; i++; }
            else { out += esc(c); i++; }
        }
        return out;
    };

    let highlightCSS = (code) => {
        let out = '';
        let i = 0;
        let len = code.length;
        let inBlock = false;
        while (i < len) {
            let c = code[i];
            if (c === '/' && code[i + 1] === '*') {
                let end = code.indexOf('*/', i + 2);
                end = end === -1 ? len : end + 2;
                out += span('comment', code.substring(i, end));
                i = end;
            } else if (c === '"' || c === "'") {
                let q = c, j = i + 1;
                while (j < len && code[j] !== q) { if (code[j] === '\\') j++; j++; }
                if (j < len) j++;
                out += span('string', code.substring(i, j));
                i = j;
            } else if (c === '{') { inBlock = true; out += esc(c); i++; }
            else if (c === '}') { inBlock = false; out += esc(c); i++; }
            else if (c === '@') {
                let j = i + 1;
                while (j < len && /[a-zA-Z-]/.test(code[j])) j++;
                out += span('keyword', code.substring(i, j));
                i = j;
            } else if (c === '#' && !inBlock) {
                let j = i;
                while (j < len && /[a-zA-Z0-9_#-]/.test(code[j])) j++;
                out += span('selector-id', code.substring(i, j));
                i = j;
            } else if (c === '.' && !inBlock && /[a-zA-Z_-]/.test(code[i + 1] || '')) {
                let j = i;
                while (j < len && /[a-zA-Z0-9_.-]/.test(code[j])) j++;
                out += span('selector-class', code.substring(i, j));
                i = j;
            } else if (c === ':' && !inBlock) {
                let j = i + 1;
                while (j < len && /[a-zA-Z0-9_(-]/.test(code[j])) j++;
                out += span('selector-pseudo', code.substring(i, j));
                i = j;
            } else if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(code[i + 1]))) {
                let j = i;
                while (j < len && /[0-9.]/.test(code[j])) j++;
                while (j < len && /[a-zA-Z%]/.test(code[j])) j++;
                out += span('number', code.substring(i, j));
                i = j;
            } else if (c === '#' && inBlock) {
                let j = i + 1;
                while (j < len && /[0-9a-fA-F]/.test(code[j])) j++;
                out += span('number', code.substring(i, j));
                i = j;
            } else if (inBlock && /[a-zA-Z-]/.test(c)) {
                let j = i;
                while (j < len && /[a-zA-Z0-9-]/.test(code[j])) j++;
                let word = code.substring(i, j);
                if (CSS_PROPS.has(word)) out += span('attribute', word);
                else out += esc(word);
                i = j;
            } else if (!inBlock && /[a-zA-Z]/.test(c)) {
                let j = i;
                while (j < len && /[a-zA-Z0-9_-]/.test(code[j])) j++;
                out += span('selector-tag', code.substring(i, j));
                i = j;
            } else if (c === '\n') { out += '\n'; i++; }
            else { out += esc(c); i++; }
        }
        return out;
    };

    /**
     * 代码美化
     */
    let format = (fileType, source, callback) => {

        let beauty = txtResult => {
            let code = document.getElementsByTagName('pre')[0];
            formattedCodes = txtResult;
            document.querySelector('html').classList.add('jf-cb');

            let highlightedHtml;
            try {
                highlightedHtml = fileType === 'javascript' ? highlightJS(txtResult) : highlightCSS(txtResult);
            } catch (e) {
                highlightedHtml = esc(txtResult);
            }

            let lines = highlightedHtml.split('\n');
            code.innerHTML = '<ol>' + lines.map(l => '<li><span>' + l + '</span></li>').join('') + '</ol>';
            callback && callback('ok');
        };

        try {
            if (fileType === 'javascript') {
                if (typeof window.js_beautify !== 'function') {
                    callback && callback('error', 'js_beautify 未加载，请刷新页面重试');
                    return;
                }
                let opts = {
                    brace_style: "collapse",
                    break_chained_methods: false,
                    indent_char: " ",
                    indent_scripts: "keep",
                    indent_size: "4",
                    keep_array_indentation: true,
                    preserve_newlines: true,
                    space_after_anon_function: true,
                    space_before_conditional: true,
                    unescape_strings: false,
                    wrap_line_length: "120"
                };
                beauty(window.js_beautify(source, opts));
            } else if (fileType === 'css') {
                beauty(cssBeautify(source));
            }
        } catch (e) {
            console.error('[FeHelper] code-beautify error:', e);
            callback && callback('error', e.message || String(e));
        }
    };

    /**
     * 检测
     */
    window._codebutifydetect_ = (fileType) => {

        if (!document.getElementsByTagName('pre')[0]) {
            return;
        }
        let source = document.getElementsByTagName('pre')[0].textContent;

        if (!cssInjected) {
            chrome.runtime.sendMessage({
                type: 'fh-dynamic-any-thing',
                thing: 'inject-content-css',
                tool: 'code-beautify'
            });
            cssInjected = true;
        }

        $(document.body).addClass('show-tipsbar');

        let tipsBar = $('<div id="fehelper_tips">' +
            '<span class="desc">FeHelper检测到这可能是<i>' + fileType + '</i>代码，<span class="ask">是否进行美化处理？</span></span>' +
            '<a class="encoding">有乱码？点击修正！</a>' +
            '<button class="yes">代码美化</button>' +
            '<button class="no">放弃！</button>' +
            '<button class="copy hide">复制美化过的代码</button>' +
            '<button class="close"><span></span></button>' +
            '<a class="forbid">彻底关闭这个功能！&gt;&gt;</a>' +
            '</div>').prependTo('body');

        tipsBar.find('button.yes').click((evt) => {
            tipsBar.find('button.yes,button.no').hide();
            let elAsk = tipsBar.find('span.ask').text('正在努力美化，请稍候...');
            format(fileType, source, (status, errMsg) => {
                if (status === 'error') {
                    elAsk.text('美化失败: ' + (errMsg || '未知错误'));
                    tipsBar.find('button.yes,button.no').show();
                    return;
                }
                elAsk.text('已为您美化完毕！');
                $(document.body).removeClass('show-tipsbar').addClass('show-beautified');
            });
        });

        tipsBar.find('a.forbid').click((evt) => {
            evt.preventDefault();
            if (confirm('一旦彻底关闭，不可恢复，请确认？')) {
                chrome.runtime.sendMessage({
                    type: 'fh-dynamic-any-thing',
                    thing: 'close-beautify'
                }, () => {
                    alert('已关闭，如果要恢复，请在FeHelper「设置页」重新安装「代码美化工具」！');
                });
            }
        });

        tipsBar.find('button.no,button.close').click((evt) => {
            $(document.body).removeClass('show-tipsbar').removeClass('show-beautified');
            tipsBar.remove();
        });

        tipsBar.find('button.copy').click((evt) => {
            _copyToClipboard(formattedCodes);
        });

        tipsBar.find('a.encoding').click((evt) => {
            evt.preventDefault();
            fetch(location.href).then(res => res.text()).then(text => {
                source = text;
                if ($(document.body).hasClass('show-beautified')) {
                    tipsBar.find('button.yes').trigger('click');
                } else {
                    $('#fehelper_tips+pre').text(text);
                }
            });
        });
    };

    let _copyToClipboard = function (text) {
        let input = document.createElement('textarea');
        input.style.position = 'fixed';
        input.style.opacity = 0;
        input.value = text;
        document.body.appendChild(input);
        input.select();
        document.execCommand('Copy');
        document.body.removeChild(input);
        alert('代码复制成功，随处粘贴可用！');
    };

    return function () {
        let ext = location.pathname.substring(location.pathname.lastIndexOf(".") + 1).toLowerCase();
        let fileType = ({'js': 'javascript', 'css': 'css'})[ext];
        let contentType = document.contentType.toLowerCase();

        if (!fileType) {
            if (/\/javascript$/.test(contentType)) {
                fileType = 'javascript';
            } else if (/\/css$/.test(contentType)) {
                fileType = 'css';
            }
        } else if (contentType === 'text/html') {
            fileType = undefined;
        }

        if (['javascript', 'css'].includes(fileType)) {
            chrome.runtime.sendMessage({
                type: 'fh-dynamic-any-thing',
                thing: 'code-beautify',
                params: { fileType, tabId: window.__FH_TAB_ID__ || null }
            });
        }
    };

})();
