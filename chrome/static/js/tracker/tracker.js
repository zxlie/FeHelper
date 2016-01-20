/**
 * Tracker
 */
window.Tracker = function (host) {
    var cmd = function (cmd) {
        var n = arguments[1];
        switch (cmd) {
            case "code":
                return typeof n != "undefined" ?
                    Tracker.CodeList.get(n) : Tracker.CodeList.list();
            default:
                return "no such command";
        }
    };

    var page = function (fn) {
        var win, doc;

        win = Tracker.View.ControlFrame.getWindow("tracker_page");
        doc = win.document;

        return fn(win, doc);
    };

    cmd.toString = page.toString = function () {
        return "undefined";
    };

    host.cmd = cmd;
    host.page = page;

    return host;
}(window.document);