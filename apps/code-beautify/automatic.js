module.exports = (() => {

    /**
     * 代码美化
     */
    let format = (fileType, source, callback) => {

        let beauty = txtResult => {

            txtResult = txtResult.replace(/>/g, '&gt;').replace(/</g, '&lt;');
            txtResult = '<pre class="brush: ' + fileType.toLowerCase() + ';toolbar:false;">' + txtResult + '</pre>';
            document.body.innerHTML = txtResult;

            // 代码高亮
            let map = {
                core: '../static/vendor/syntaxhighlighter/shCore.js',
                Javascript: '../static/vendor/syntaxhighlighter/shBrushJScript.js',
                CSS: '../static/vendor/syntaxhighlighter/shBrushCss.js'
            };

            Tarp.require(map.core, true).then(SH => {
                Tarp.require(map[fileType], true).then(SH => {
                    SH.defaults['toolbar'] = false;
                    SH.highlight();
                });
            });

            callback && callback();
        };

        switch (fileType) {
            case 'Javascript':
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
            case 'CSS':
                Tarp.require('../code-beautify/beautify-css.js');
                css_beautify(source, {}, resp => beauty(resp));
                break;
        }

    };

    /**
     * 检测
     * @returns {boolean}
     */
    let detect = () => {

        let ext = location.pathname.substring(location.pathname.lastIndexOf(".") + 1).toLowerCase();
        let fileType = ({'js': 'Javascript', 'css': 'CSS'})[ext];
        if (!fileType || document.contentType.toLowerCase() === 'text/html') {
            return false;
        }
        let source = document.body.textContent;

        let cssUrl = chrome.extension.getURL('code-beautify/automatic.css');
        $('<link href="' + cssUrl + '" rel="stylesheet" type="text/css" />').appendTo(document.head);
        $(document.body).addClass('show-tipsbar');

        let tipsBar = $('<div id="fehelper_tips">' +
            '<span class="desc">FeHelper检测到这可能是<i>' + fileType + '</i>代码，是否进行美化处理？</span>' +
            '<button class="yes">代码美化</button>' +
            '<button class="no">放弃！</button>' +
            '<button class="close"><span></span></button>' +
            '<a class="forbid">彻底关闭这个功能！&gt;&gt;</a>' +
            '</div>').prependTo('body');

        tipsBar.find('button.yes').click((evt) => {
            tipsBar.find('button.yes,button.no').hide();
            $('<span class="doing">正在努力，请稍后...</span>').insertBefore(tipsBar.find('button.yes'));
            format(fileType, source,()=>{
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
            $(document.body).removeClass('show-tipsbar');
        });
    };

    return {
        detect: detect
    }

})();