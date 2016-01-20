void function () {
    var currentCodeId, codes, pageComments, host;

    var restorePageEnvironments = function () {

        var i, lastTimerId, tempIframe, fixList, tempArray, sourceArray,
            tempDocument;

        lastTimerId = setTimeout("1", 0);

        for (i = lastTimerId, down = Math.max(0, lastTimerId - 200);
             i >= down; i--)
            clearTimeout(i),
                clearInterval(i);

        // NOTE: 恢复可能被目标页面破坏掉的几个主要的 Array 方法
        tempIframe = host.createElement("iframe");
        tempIframe.style.cssText = "width: 1px; height: 1px; top: -1000px; position: absolute;";
        host.body.appendChild(tempIframe);
        fixList = ( "push, pop, slice, splice, shift, unshift, concat, join, reverse" ).split(", ");
        tempArray = tempIframe.contentWindow.Array.prototype;
        sourceArray = Array.prototype;

        for (i = 0, l = fixList.length; i < l; i++)
            sourceArray[fixList[i]] = tempArray[fixList[i]];

        fixList = ["open", "write", "close"];
        tempDocument = tempIframe.contentDocument;

        for (i = 0, l = fixList.length; i < l; i++)
            host[fixList[i]] = function (fn, host) {
                return function () {
                    return fn.apply(host, arguments);
                }
            }(tempDocument[fixList[i]], host);

        host.body.removeChild(tempIframe);
        tempIframe = null;
        tempDocument = null;
    };

    var AsynStringReplacer = function () {
        var restoreRegx = /\({3}AsynStringReplacer:(\d+)\){3}/g;

        return {
            replace: function (origContent, regx, pmReplaceFn) {
                var cache, tasks = [], content = origContent, index = 0,
                    pm = new Tracker.Promise();

                content = content.replace(regx, function () {
                    tasks.push(pmReplaceFn.apply(null, arguments));
                    return "(((AsynStringReplacer:" + ( index++ ) + ")))";
                });

                Tracker.Promise.when(tasks).then(function () {
                    cache = [].slice.call(arguments, 0);
                    content = content.replace(restoreRegx, function (s, index) {
                        return cache[index - 0];
                    });
                    pm.resolve(content);
                });

                return pm;
            }
        };
    }();

    var initControllerOnLoad = function () {
        Tracker.controllerOnLoad = Tracker.Promise.fuze();
        Tracker.controllerOnLoad(function (window, document) {
            var waitTime, loadingEl;

            window.onbeforeunload = function () {
                var startTime = Tracker.Util.time();
                return function () {
                    if (Tracker.Util.time() - startTime < 3e3)
                        setTimeout(function () {
                            var h = window.location.hash;
                            window.location.href = ~h.indexOf("#") ? h : "#" + h;
                        }, 0);
                }
            }();

            waitTime = document.getElementById("waitTime");
            loadingEl = document.getElementById("loading");
            loadingEl.style.display = "block";

            Tracker.Util.onCpuFree(function () {
                waitTime.innerHTML = "(100.000000 %)";
                loadingEl.style.height = "0";
                Tracker.View.ControlPanel.activeTab("code-list");
                setTimeout(function () {
                    loadingEl.parentNode.removeChild(loadingEl);
                }, 5e2);
            }, function (t) {
                waitTime.innerHTML = "(" + ( 1e2 - 1e2 / Math.max(t, 1e2) ).toFixed(6) + "%)";
            });

            Tracker.TrackerGlobalEvent.on("bootstrap: dropdown.open", function () {
                if (Tracker.View.ControlPanel.activeTab() == 0)
                    Tracker.View.ControlPanel.setControlPower(true);
            });

            Tracker.TrackerGlobalEvent.on("bootstrap: dropdown.close", function () {
                if (Tracker.View.ControlPanel.activeTab() == 0)
                    Tracker.View.ControlPanel.setControlPower(false);
            });

            Tracker.TrackerGlobalEvent.on("bootstrap: dialog.open", function () {
                setTimeout(function () { // trigger by dropdown
                    if (Tracker.View.ControlPanel.activeTab() == 0)
                        Tracker.View.ControlPanel.setControlPower(true);
                }, 1);
            });

            Tracker.TrackerGlobalEvent.on("bootstrap: dialog.close", function () {
                if (Tracker.View.ControlPanel.activeTab() == 0)
                    Tracker.View.ControlPanel.setControlPower(false);
            });

            setTimeout(function () {
                Tracker.Plugins.prepare({
                    name: "general",
                    type: "TopPanel",
                    label: "综合结果",
                    bodyId: "plugin-general-page"
                });
                Tracker.setupGeneralPlugin();

                Tracker.Plugins.prepare({
                    name: "watch",
                    type: "TopPanel",
                    label: "活动监视器",
                    bodyId: "plugin-watch-page"
                });
                Tracker.setupWatchPlugin();
            }, 5e2);
        });

        Tracker.controllerOnLoad(Tracker.Util.bind(Tracker.View.ControlFrame.show, Tracker.View.ControlFrame));
    };

    var initPageBuilder = function () {

        Tracker.View.ControlFrame.pageBuilder(function (html) {
            var pm = new Tracker.Promise(),
                charset = document.characterSet,
                allScriptTagRegx = /(<script\b[^>]*>)([\s\S]*?)(<\/script>)/gi,
                srcPropertyRegx = / src=["']([^"']+)["']/,
                typePropertyRegx = / type=["']([^"']+)["']/,
                scriptRegx = /(<script\b [^>]*src=["']([^"']+)["'][^>]*>)\s*(<\/script>)/gi,
                firstTagRegx = /(<[^>]+>)/,
                lineBreakRegx = /\r\n|[\r\n]/g,
                a, b, i, l, r;
            var proxyScript = '<script type="text/javascript" src="' + chrome.runtime.getURL('/static/js/tracker/inject.js') + '"></script>';

            Tracker.Util.request(location.href, charset).then(function (html) {
                html = html.response;

                for (i = 0, l = pageComments.length; i < l; i++) {
                    r = "<!--" + pageComments[i] + "-->";
                    a = r.replace(lineBreakRegx, "\r\n");
                    b = r.replace(lineBreakRegx, "\n");
                    html = html.replace(a, "").replace(b, "");
                }

                AsynStringReplacer.replace(html, allScriptTagRegx,
                    function (raw, openTag, content, closeTag) {
                        var pm, code;

                        pm = new Tracker.Promise();

                        if (srcPropertyRegx.test(openTag)) { // is outer script
                            Tracker.View.Loading.addCount();
                            pm.resolve(raw);
                            return pm;
                        }

                        if (typePropertyRegx.test(openTag) &&
                            RegExp.$1.toLowerCase() != "text/javascript") { // is not javascript
                            // TODO: 对于非 text/javascript，将来也放到 code list 中，以便于查询
                            pm.resolve(raw);
                            return pm;
                        }

                        // embed script
                        Tracker.View.Loading.addCount();

                        code = new Tracker.Code(null, content);
                        code.loadConsum = 0;
                        code.setType("embed");
                        Tracker.CodeList.add(code);

                        code.onReady(function () {
                            pm.resolve(openTag + code.executiveCode + closeTag);
                            Tracker.View.Loading.addProgress();
                        });

                        return pm;
                    }
                ).then(function (html) {
                        AsynStringReplacer.replace(html, scriptRegx,
                            function (raw, openTag, url, closeTag) {
                                var pm, content;

                                pm = new Tracker.Promise();
                                openTag = openTag.replace(srcPropertyRegx, " tracker-src='$1'");

                                Tracker.Util.intelligentGet(url).then(function (data) {
                                    var code;

                                    content = data.response;
                                    code = new Tracker.Code(url, content);
                                    code.loadConsum = data.consum;
                                    code.setType("link");
                                    Tracker.CodeList.add(code);

                                    code.onReady(function () {
                                        Tracker.View.Loading.addProgress();
                                        pm.resolve(openTag + code.executiveCode + closeTag);
                                    });
                                }, function () {
                                    var code;

                                    code = new Tracker.Code(url);
                                    code.setState("timeout");
                                    Tracker.CodeList.add(code);
                                    Tracker.View.Loading.addProgress();
                                    pm.resolve(raw);
                                });

                                return pm;
                            }
                        ).then(function (html) {
                                Tracker.View.Loading.hide();
                                Tracker.Util.delay(function () {
                                    Tracker.CodeList.sort();
                                    if (!~html.indexOf("<html"))
                                        html = "<html>" + html;
                                    pm.resolve(html.replace(firstTagRegx, "$1" + proxyScript));
                                });
                            });
                    });
            }, function () {
                var message, refresh;

                message = "处理超时"; // 处理超时
                refresh = function () {
                    location.assign(location.href);
                };

                Tracker.View.Loading.text(message).then(refresh);
            });

            return pm;
        });
    };

    var initControlFrame = function () {

        Tracker.View.ControlFrame.controllerBuilder(Tracker.View.ControlPanel.htmlBuilder);
        Tracker.View.ControlFrame.on({
            "controllerLoad": function (window, document) {
                Tracker.View.ControlPanel.bindWindow(window);
                Tracker.View.ControlPanel.addCode(codes = Tracker.CodeList.list());
                Tracker.View.ControlPanel.eventBuilder();
                Tracker.controllerOnLoad.fire(window, document);

                if (currentCodeId)
                    Tracker.View.ControlPanel.showCodeDetail(currentCodeId);

                document.getElementById("top-nav").tabEvent.on("active", function (index, name) {
                    var b;

                    Tracker.View.ControlPanel.setControlPower(b = index > 0, b);

                    if (name == "code-list")
                        Tracker.View.ControlPanel.showCodeDetail(false);
                });
            },

            "hide": function () {
                Tracker.View.ControlPanel.autoUpdateCodeStop();
            },

            "show": function () {
                Tracker.View.ControlPanel.autoUpdateCodeStart();
            },

            pageLoad: function (topWin, pageWin) {
                Tracker.Decorate(topWin, pageWin);
                topWin.document.getElementById('btnTrackerProxy').addEventListener('click', function (e) {
                    var type = this.getAttribute('data-type');
                    switch (type) {
                        case '__tracker__':
                            var groupId = this.getAttribute('data-groupId');
                            topWin[type](groupId);
                            break;
                        case '__trackerError__':
                            var codeId = this.getAttribute('data-codeId');
                            var msg = this.getAttribute('data-msg');
                            topWin[type](codeId, msg);
                            break;
                        case '__trackerMockTop__':
                            topWin[type]();
                            break;
                        case '__trackerScriptStart__':
                            var codeId = this.getAttribute('data-codeId');
                            var scriptTagIndex = this.getAttribute('data-scriptTagIndex');
                            topWin[type](codeId, scriptTagIndex);
                            break;
                        case '__trackerScriptEnd__':
                            var codeId = this.getAttribute('data-codeId');
                            topWin[type](codeId);
                            break;
                        case 'onbeforeunload':
                            topWin[type]();
                            break;
                    }
                }, false);
            }
        });

        Tracker.View.ControlPanel.actions(function (be) {
            be = function (action) {
                return function () {
                    if (Tracker.View.ControlFrame.getMode() == "embed" &&
                        Tracker.View.ControlPanel.activeTab() > 0)
                        Tracker.View.ControlPanel.activeTab(0);
                    Tracker.View.ControlFrame[action]();
                };
            };

            return {
                "frame#close": be("hide"),
                "frame#toggle": be("toggleMode")
            }
        }());
    };

    /**
     * 启动js tracker
     */
    var startTrack = function () {

        initControllerOnLoad();
        host = window.document;
        pageComments = Tracker.Util.getHtmlComments(host.documentElement);
        Tracker.TrackerGlobalEvent = Tracker.Event.bind();
        initPageBuilder();
        initControlFrame();

        restorePageEnvironments();
        Tracker.View.Loading.show();
        Tracker.View.ControlFrame.createEmbed();
    };

    // 在tab创建或者更新时候，监听事件，看看是否有参数传递过来
    chrome.runtime.onMessage.addListener(function (request, sender, callback) {
        if (request.type == MSG_TYPE.JS_TRACKER) {
            startTrack();
        }
    });

}();
