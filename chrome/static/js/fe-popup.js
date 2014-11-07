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

        bgPage.BgPageInstance.runHelper({
            msgType:MSG_TYPE[msgType],
            useFile:isUseFile
        });
        window.close();
    });
});



