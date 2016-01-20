window.Tracker = window.Tracker || {};

Tracker.Decorate = function (window, pageWin) {
    var Element, appendChild, insertBefore, getAttribute, check, checklist, scriptElements, i, l;

    Element = pageWin.Element.prototype;
    appendChild = Element.appendChild;
    insertBefore = Element.insertBefore;
    scriptElements = pageWin.document.scripts;

    var overideInsertingNodeFunction = function (fn) {
        return function (node) {
            var me, args, url, code, content;

            me = this;
            args = [].slice.apply(arguments);

            if (!node || node.nodeName != "SCRIPT")
                return fn.apply(me, args);

            url = node.getAttribute("src");

            if (!url)
                return fn.apply(me, args);

            Tracker.Util.intelligentGet(url).then(function (data) {
                content = data.response;
                code = new Tracker.Code(url, content, Tracker.Util.handle(node));
                code.setType("append");
                code.loadConsum = data.consum;
                Tracker.CodeList.add(code);
                node.removeAttribute("src");
                Tracker.View.ControlPanel.addCode(code);

                code.onReady(function () {
                    node.appendChild(pageWin.document.createTextNode(code.executiveCode));
                    fn.apply(me, args);
                    node.src = url;
                });
            }, function () {
                code = new Tracker.Code(url);
                code.setType("append");
                code.setState("timeout");
                Tracker.CodeList.add(code);
                fn.apply(me, args);
                Tracker.View.ControlPanel.addCode(code);
            });

            return node;
        };
    };


    check = function (item, name) {
        if (item && item.prototype && item.prototype[name])
            if (item.prototype[name] != Element[name])
                item.prototype[name] = Element[name];
    };

    checklist = [window.HTMLElement, window.HTMLHeadElement, window.HTMLBodyElement];

    Element.appendChild = overideInsertingNodeFunction(appendChild);
    Element.insertBefore = overideInsertingNodeFunction(insertBefore);

    Tracker.Util.forEach(checklist, function (object) {
        check(object, "appendChild");
        check(object, "insertBefore");
    });

    window.__tracker__ = function (groupId) {
        [].concat((groupId || '').split(',')).forEach(function (item) {
            Tracker.StatusPool.arrivedSnippetGroupPut(item);
        });
    };

    window.__trackerError__ = function (codeId, msg) {
        Tracker.CodeList.get(codeId).addError(msg);
    };

    window.__trackerMockTop__ = function () {
        return {
            location: {},
            document: {write: Tracker.Util.blank}
        };
    };

    window.__trackerScriptStart__ = function (codeId, scriptTagIndex) {
        var script, code;

        script = scriptTagIndex === "undefined" ?
            scriptElements[scriptElements.length - 1] : Tracker.Util.handle(scriptTagIndex);

        if (script && script.hasAttribute("tracker-src"))
            script.src = script.getAttribute("tracker-src");

        setTimeout(function () {
            if (script.onreadystatechange)
                script.onreadystatechange();
        }, 0);

        code = Tracker.CodeList.get(codeId);
        code._startTime = new Date();
    };

    window.__trackerScriptEnd__ = function (codeId) {
        var code, endTime;

        endTime = new Date();
        code = Tracker.CodeList.get(codeId);
        code.runConsum = endTime.getTime() - code._startTime.getTime();
        // TODO: 此值虚高，因为钩子运行本身也产生耗时，需要扣除钩子时间才准确
        delete code._startTime;
        code.lastModified = Tracker.Util.time();
    };

    window.onbeforeunload = function () {
        var startTime = Tracker.Util.time();
        return function () {
            var now = Tracker.Util.time();
            if (now - startTime < 3e3)
                setTimeout(function () {
                    var h = window.location.hash;
                    window.location.href = ~h.indexOf("#") ? h : "#" + h;
                }, 0);
            while (Tracker.Util.time() - now < 500);
        }
    }();

};