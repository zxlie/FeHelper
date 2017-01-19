/**
 * FeHelper弹出（下拉）页面
 * @author zhaoxianlie
 */
$(function () {
    // 获取后台页面，返回window对象
    var bgPage = chrome.extension.getBackgroundPage();
    // 菜单点击以后执行的动作
    jQuery('ul.fe-function-list li').click(function (e) {
        var msgType = $(this).attr('data-msgtype');
        var isUseFile = $(this).attr('data-usefile');

        if (msgType == 'COLOR_PICKER') {
            bgPage.BgPageInstance.showColorPicker();
        } else {
            bgPage.BgPageInstance.runHelper({
                msgType: MSG_TYPE[msgType],
                useFile: isUseFile
            });
        }

        window.close();
    });

    // ajax debugger开关文案控制
    bgPage.BgPageInstance.tellMeAjaxDbgSwitch(function (dbgSwitchOn) {
        $('li.-x-ajax-debugger span i').html(dbgSwitchOn ? '已开' : '已关');
    });

    // 设置
    jQuery('.fe-feedback .x-settings').click(function (e) {
        chrome.tabs.create({
            url: "template/fehelper_options.html",
            active: true
        });
    });

    // 根据配置，控制功能菜单的显示与隐藏
    baidu.feOption.doGetOptions(baidu.feOption.optionItems, function (opts) {
        opts && Object.keys(opts).forEach(function (item) {
            if (opts[item] == 'false') {
                $('li[data-msgtype="' + item + '"]').hide();
            }
        });
    })
});



