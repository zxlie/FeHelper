/**
 * 编码规范检测
 * @author 赵先烈
 */
module.exports = (function () {

    let _loadStaticFiles = function () {
        Tarp.require('../static/js/utils');
        window.MSG_TYPE = Tarp.require('../static/js/msg_type');
        Tarp.require('../code-standards/fcp-fl');
        Tarp.require('../code-standards/css/fcp-css-analytic');
        Tarp.require('../code-standards/css/fcp-css');
        Tarp.require('../code-standards/html/fcp-html-analytic');
        Tarp.require('../code-standards/html/fcp-html-doctype');
        Tarp.require('../code-standards/html/fcp-html');
        Tarp.require('../code-standards/js/fcp-js');
        Tarp.require('../code-standards/fcp-tabs');
        Tarp.require('../code-standards/fcp-main');
        Tarp.require('../static/vendor/jquery/jquery.extend.js');
        Tarp.require('../static/vendor/jquery/jquery-ui.min.js');

        if (!jQuery('#_fehelper_jq_ui_css_')[0]) {
            let jqUiCss = chrome.extension.getURL('static/vendor/jquery/jquery-ui.min.css');
            jQuery('<link id="_fehelper_jq_ui_css_" href="' + jqUiCss + '" rel="stylesheet" type="text/css" />').appendTo('head');

            let fcpCss = chrome.extension.getURL('code-standards/index.css');
            jQuery('<link id="_fehelper_fcp_css_" href="' + fcpCss + '" rel="stylesheet" type="text/css" />').appendTo('head');
        }
    };

    let _helperInit = function () {
        _loadStaticFiles();
        baidu.fcphelper.initStaticFile();
    };

    let _helperDetect = function () {
        baidu.fcphelper.initHtml(function () {
            baidu.fcphelper.detect();
        });
    };

    return {
        init: _helperInit,
        detect: _helperDetect
    };

})();


