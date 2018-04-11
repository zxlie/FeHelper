/**
 * 检测浏览器是否支持部分ES6的语法，比如 let、=> 之类
 * FeHelper坚持一个原则：不在低版本的Chrome上运行
 * @returns {boolean}
 * @private
 */
var _browserSupport = function () {
    var support = true;
    try {
        new Function('let a = () => {}');
    } catch (e) {
        support = false;
    }
    return support;
};
if (!_browserSupport()) {
    chrome.browserAction.onClicked.addListener(function () {
        alert('检测到当前浏览器版本较低，FeHelper可能无法正常运行，建议升级到最新版浏览器以正常使用，谢谢！');
    });
    chrome.browserAction.setBadgeText({text: '异常'});
    chrome.browserAction.setPopup({popup: ''});
}
