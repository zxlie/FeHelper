
window.codebeautifyContentScript = (() => {
    let __importScript = (filename) => {
        let url = filename;

        if (location.protocol === 'chrome-extension:' || chrome.runtime && chrome.runtime.getURL) {
            url = chrome.runtime.getURL('code-beautify/' + filename);
        }
        fetch(url).then(resp => resp.text()).then(jsText => {
            if(window.evalCore && window.evalCore.getEvalInstance){
                return window.evalCore.getEvalInstance(window)(jsText);
            }
            let el = document.createElement('script');
            el.textContent = jsText;
            document.head.appendChild(el);
        });
    };

    __importScript('beautify.js');
    __importScript('beautify-css.js');


    let highlightWebWorker = () => {
        // TODO ...
        // __importScript('../static/vendor/highlight/highlight.js');

        self.onmessage = (event) => {
            // const result = self.hljs.highlightAuto(event.data);
            // postMessage(result.value);
            postMessage(event.data);
        };
    };

    let formattedCodes = '';
    let cssInjected = false;
    // **************************************************************

    /**
     * 代码美化
     */
    let format = (fileType, source, callback) => {

        let beauty = txtResult => {

            let code = document.getElementsByTagName('pre')[0];
            formattedCodes = txtResult;
            code.textContent = txtResult;
            code.classList.add('language-' + fileType.toLowerCase());
            document.querySelector('html').classList.add('jf-cb');

            // 用webwork的方式来进行格式化，效率更高
            let worker = new Worker(URL.createObjectURL(new Blob(["(" + highlightWebWorker.toString() + ")()"], {type: 'text/javascript'})));
            worker.onmessage = (event) => {
                code.innerHTML = "<ol><li><span>" + event.data
                    .replace(/</gm,'&lt;').replace(/>/gm,'&gt;')
                    .replace(/\n/gm, '</span></li><li><span>') + '</span></li></ol>';
                callback && callback();
            };
            worker.postMessage(txtResult);
        };

        switch (fileType) {
            case 'javascript':
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
                beauty(js_beautify(source, opts));
                break;
            case 'css':
                css_beautify(source, {}, resp => beauty(resp));
                break;
        }

    };

    /**
     * 检测
     * @returns {boolean}
     */
    window._codebutifydetect_ = (fileType) => {

        if (!document.getElementsByTagName('pre')[0]) {
            return;
        }
        let source = document.getElementsByTagName('pre')[0].textContent;

        // 提前注入css
        if(!cssInjected) {
            chrome.runtime.sendMessage({
                type: 'fh-dynamic-any-thing',
                thing:'inject-content-css',
                tool: 'code-beautify'
            });
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
            format(fileType, source, () => {
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


    /**
     * chrome 下复制到剪贴板
     * @param text
     */
    let _copyToClipboard = function (text) {
        let input = document.createElement('textarea');
        input.style.position = 'fixed';
        input.style.opacity = 0;
        input.value = text;
        document.body.appendChild(input);
        input.select();
        document.execCommand('Copy');
        document.body.removeChild(input);

        alert('代码复制成功，随处粘贴可用！')
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

        chrome.runtime.sendMessage({
            type: 'fh-dynamic-any-thing',
            thing: 'code-beautify',
            params: { fileType, tabId: window.__FH_TAB_ID__ || null }
        });
    };

})();
