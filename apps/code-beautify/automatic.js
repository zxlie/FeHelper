module.exports = (() => {

    let formattedCodes = '';

    /**
     * 代码美化
     */
    let format = (fileType, source, callback) => {

        let beauty = txtResult => {

            formattedCodes = txtResult;
            txtResult = txtResult.replace(/>/g, '&gt;').replace(/</g, '&lt;');
            txtResult = '<pre class="language-' + fileType.toLowerCase() + ' line-numbers"><code>' + txtResult + '</code></pre>';
            $('#fehelper_tips').siblings().remove().end().after(txtResult);

            Tarp.require('../static/vendor/prism/prism.js', true).then(Prism => {
                Prism.highlightAll();
                callback && callback();
            });

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
                Tarp.require('../code-beautify/beautify.js');
                js_beautify(source, opts, resp => beauty(resp));
                break;
            case 'css':
                Tarp.require('../code-beautify/beautify-css.js');
                css_beautify(source, {}, resp => beauty(resp));
                break;
        }

    };

    /**
     * 检测
     * @returns {boolean}
     */
    let detect = (fileType) => {

        let source = document.body.textContent;

        let cssUrl = chrome.extension.getURL('code-beautify/automatic.css');
        $('<link href="' + cssUrl + '" rel="stylesheet" type="text/css" />').appendTo(document.head);
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
            let elAsk = tipsBar.find('span.ask').text('正在努力美化，请稍后...');
            format(fileType, source, () => {
                elAsk.text('已为您美化完毕！');
                $(document.body).removeClass('show-tipsbar').addClass('show-beautified');
            });
        });

        tipsBar.find('a.forbid').click((evt) => {
            evt.preventDefault();
            chrome.runtime.sendMessage({
                type: MSG_TYPE.OPEN_OPTIONS_PAGE
            });
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

    return {
        detect: detect
    }

})();