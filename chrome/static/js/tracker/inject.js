window.Tracker = window.Tracker || {};
/**
 * 此脚本是用于注入被检测的iframe中的，因为page-script无法与content-script交互，所以可以用一个button来作为代理
 * @param window
 * @param document
 * @constructor
 * @author  xianliezhao
 */
Tracker.Inject = function (window, document) {

    var getProxyEl = function () {
        return top.document.getElementById('btnTrackerProxy');
    };

    /**
     * 队列管理器
     * 钩子“tracker”会执行的非常频繁，如果每次执行都去trigger proxy click，性能会极其低下，所以需要用一个队列来批量执行
     */
    var QueueMgr = (function () {
        var _queue = [];
        var _limit = 500;
        var _lastPopTime = 0;

        // 检测队列是否已满
        var full = function () {
            return _queue.length >= _limit;
        };

        // 入队列
        var push = function (item) {
            _queue.push(item);
        };

        // 全部出队列
        var popAll = function () {
            var result = _queue.join(',');
            _queue = [];
            _lastPopTime = new Date().getTime();
            return result;
        };

        // 判断距离上一次出队列是否已经大于200ms
        var timesUp = function () {
            return (new Date().getTime() - _lastPopTime) >= 100;
        };

        return {
            full: full,
            timesUp: timesUp,
            push: push,
            pop: popAll
        };
    })();


    window.__tracker__ = function (groupId) {
        // 先入队列，不丢下任何一条消息
        QueueMgr.push(groupId);

        // 队列已满 or 等待时间到了
        if (QueueMgr.full() || QueueMgr.timesUp()) {
            var allGroupIds = QueueMgr.pop();
            var proxy = getProxyEl();
            proxy.setAttribute('data-type', '__tracker__');
            proxy.setAttribute('data-groupId', allGroupIds);
            proxy.click();
        }
    };

    window.__trackerError__ = function (codeId, msg) {
        var proxy = getProxyEl();
        proxy.setAttribute('data-type', '__trackerError__');
        proxy.setAttribute('data-codeId', codeId);
        proxy.setAttribute('data-msg', msg);
        proxy.click();
    };

    window.__trackerMockTop__ = function () {
        var proxy = getProxyEl();
        proxy.setAttribute('data-type', '__trackerMockTop__');
        proxy.click();
    };

    window.__trackerScriptStart__ = function (codeId, scriptTagIndex) {
        var proxy = getProxyEl();
        proxy.setAttribute('data-type', '__trackerScriptStart__');
        proxy.setAttribute('data-codeId', codeId);
        proxy.setAttribute('data-scriptTagIndex', scriptTagIndex);
        proxy.click();
    };

    window.__trackerScriptEnd__ = function (codeId) {
        var proxy = getProxyEl();
        proxy.setAttribute('data-type', '__trackerScriptEnd__');
        proxy.setAttribute('data-codeId', codeId);
        proxy.click();
    };

    window.onbeforeunload = function () {
        var proxy = getProxyEl();
        proxy.setAttribute('data-type', 'onbeforeunload');
        proxy.click();
    }();

};
Tracker.Inject(window, document);