// ==ClosureCompiler==
// @compilation_level ADVANCED_OPTIMIZATIONS
// @output_file_name content.js
// @externs_url http://closure-compiler.googlecode.com/svn/trunk/contrib/externs/chrome_extensions.js
// @js_externs var console = {assert: function(){}};
// @formatting pretty_print
// ==/ClosureCompiler==

/** @license
 JSON Formatter | MIT License
 Copyright 2012 Callum Locke

 Permission is hereby granted, free of charge, to any person obtaining a copy of
 this software and associated documentation files (the "Software"), to deal in
 the Software without restriction, including without limitation the rights to
 use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 of the Software, and to permit persons to whom the Software is furnished to do
 so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.

 */

/*jshint eqeqeq:true, forin:true, strict:true */
/*global chrome, console */

var JsonFormatEntrance = (function () {

    "use strict";

    var jfContent,
        pre,
        jfStyleEl,
        formattingMsg,
        slowAnalysisTimeout,
        port = JsonFormatDealer,
        startTime = +(new Date()),
        domReadyTime,
        isJsonTime,
        exitedNotJsonTime,
        displayedFormattedJsonTime
        ;

    // Add listener to receive response from BG when ready
    var dealTheMsg = function (msg) {
        // console.log('Port msg received', msg[0], (""+msg[1]).substring(0,30)) ;

        switch (msg[0]) {
            case 'NOT JSON' :
                pre.style.display = "";
                // console.log('Unhidden the PRE') ;
                jfContent.innerHTML = '<span class="x-json-tips">JSON不合法，请检查：</span>';
                exitedNotJsonTime = +(new Date());
                break;

            case 'FORMATTING' :
                isJsonTime = +(new Date());

                // It is JSON, and it's now being formatted in the background worker.

                // Clear the slowAnalysisTimeout (if the BG worker had taken longer than 1s to respond with an answer to whether or not this is JSON, then it would have fired, unhiding the PRE... But now that we know it's JSON, we can clear this timeout, ensuring the PRE stays hidden.)
                clearTimeout(slowAnalysisTimeout);

                // Create option bar
                var optionBar = document.getElementById('optionBar');
                if (optionBar) {
                    optionBar.parentNode.removeChild(optionBar);
                }
                optionBar = document.createElement('div');
                optionBar.id = 'optionBar';

                // Create toggleFormat button
                var buttonFormatted = document.createElement('button'),
                    buttonCollapseAll = document.createElement('button');
                buttonFormatted.id = 'buttonFormatted';
                buttonFormatted.innerText = '格式化';
                buttonFormatted.classList.add('selected');
                buttonCollapseAll.id = 'buttonCollapseAll';
                buttonCollapseAll.innerText = '折叠所有';

                var plainOn = false;
                buttonFormatted.addEventListener('click', function () {
                    // When formatted button clicked...
                    if (plainOn) {
                        plainOn = false;
                        pre.style.display = "none";
                        jfContent.style.display = "";
                        $(this).text('元数据');
                    }else{
                        plainOn = true;
                        pre.style.display = "";
                        jfContent.style.display = "none";
                        $(this).text('格式化');
                    }

                    $(this).parent().find('button').removeClass('selected');
                    $(this).addClass('selected');
                }, false);

                buttonCollapseAll.addEventListener('click', function () {
                    // 如果内容还没有格式化过，需要再格式化一下
                    if(plainOn) {
                        buttonFormatted.click();
                    }
                    // When collapaseAll button clicked...
                    if (!plainOn) {
                        if(buttonCollapseAll.innerText == '折叠所有'){
                            buttonCollapseAll.innerText = '展开所有';
                            collapse(document.getElementsByClassName('objProp'));
                        }else{
                            buttonCollapseAll.innerText = '折叠所有';
                            expand(document.getElementsByClassName('objProp'));
                        }

                        $(this).parent().find('button').removeClass('selected');
                        $(this).addClass('selected');
                    }
                }, false);

                // Put it in optionBar
                optionBar.appendChild(buttonFormatted);
                optionBar.appendChild(buttonCollapseAll);

                // Attach event handlers
                document.addEventListener('click', generalClick, false);


                // Put option bar in DOM
                jfContent.parentNode.appendChild(optionBar);
                break;

            case 'FORMATTED' :
                // Insert HTML content
                formattingMsg.style.display = "";
                jfContent.innerHTML = msg[1];

                displayedFormattedJsonTime = +(new Date());

                // console.markTimeline('JSON formatted and displayed') ;
                break;

            default :
                throw new Error('Message not understood: ' + msg[0]);
        }
    };

    // console.timeEnd('established port') ;

    var lastKvovIdGiven = 0;

    function collapse(elements) {
        var el, i, blockInner, count;

        for (i = elements.length - 1; i >= 0; i--) {
            el = elements[i];
            el.classList.add('collapsed');

            // (CSS hides the contents and shows an ellipsis.)

            // Add a count of the number of child properties/items (if not already done for this item)
            if (!el.id) {
                el.id = 'kvov' + (++lastKvovIdGiven);

                // Find the blockInner
                blockInner = el.firstElementChild;
                while (blockInner && !blockInner.classList.contains('blockInner')) {
                    blockInner = blockInner.nextElementSibling;
                }
                if (!blockInner)
                    continue;

                // See how many children in the blockInner
                count = blockInner.children.length;

                // Generate comment text eg "4 items"
                var comment = count + (count === 1 ? ' item' : ' items');
                // Add CSS that targets it
                jfStyleEl.insertAdjacentHTML(
                    'beforeend',
                    '\n#kvov' + lastKvovIdGiven + '.collapsed:after{color: #aaa; content:" // ' + comment + '"}'
                );
            }
        }
    }

    function expand(elements) {
        for (var i = elements.length - 1; i >= 0; i--)
            elements[i].classList.remove('collapsed');
    }

    var mac = navigator.platform.indexOf('Mac') !== -1,
        modKey;
    if (mac)
        modKey = function (ev) {
            return ev.metaKey;
        };
    else
        modKey = function (ev) {
            return ev.ctrlKey;
        };

    function generalClick(ev) {
        // console.log('click', ev) ;

        if (ev.which === 1) {
            var elem = ev.target;

            if (elem.className === 'e') {
                // It's a click on an expander.

                ev.preventDefault();

                var parent = elem.parentNode,
                    div = jfContent,
                    prevBodyHeight = document.body.offsetHeight,
                    scrollTop = document.body.scrollTop,
                    parentSiblings
                    ;

                // Expand or collapse
                if (parent.classList.contains('collapsed')) {
                    // EXPAND
                    if (modKey(ev))
                        expand(parent.parentNode.children);
                    else
                        expand([parent]);
                }
                else {
                    // COLLAPSE
                    if (modKey(ev))
                        collapse(parent.parentNode.children);
                    else
                        collapse([parent]);
                }

                // Restore scrollTop somehow
                // Clear current extra margin, if any
                div.style.marginBottom = 0;

                // No need to worry if all content fits in viewport
                if (document.body.offsetHeight < window.innerHeight) {
                    // console.log('document.body.offsetHeight < window.innerHeight; no need to adjust height') ;
                    return;
                }

                // And no need to worry if scrollTop still the same
                if (document.body.scrollTop === scrollTop) {
                    // console.log('document.body.scrollTop === scrollTop; no need to adjust height') ;
                    return;
                }

                // console.log('Scrolltop HAS changed. document.body.scrollTop is now '+document.body.scrollTop+'; was '+scrollTop) ;

                // The body has got a bit shorter.
                // We need to increase the body height by a bit (by increasing the bottom margin on the jfContent div). The amount to increase it is whatever is the difference between our previous scrollTop and our new one.

                // Work out how much more our target scrollTop is than this.
                var difference = scrollTop - document.body.scrollTop + 8; // it always loses 8px; don't know why

                // Add this difference to the bottom margin
                //var currentMarginBottom = parseInt(div.style.marginBottom) || 0 ;
                div.style.marginBottom = difference + 'px';

                // Now change the scrollTop back to what it was
                document.body.scrollTop = scrollTop;

                return;
            }
        }
    }

    var postMessage = function (msg) {
        dealTheMsg(msg);
    };

    var disconnect = function () {
    };

    /**
     * 执行代码格式化
     * @param  {[type]} jsonStr [description]
     * @return {[type]}
     */
    var format = function (jsonStr) {

        // Send the contents of the PRE to the BG script
        // Add jfContent DIV, ready to display stuff
        jfContent = document.getElementById('jfContent');
        if (!jfContent) {
            jfContent = document.createElement('div');
            jfContent.id = 'jfContent';
            document.body.appendChild(jfContent);
        }
        jfContent.style.display = '';

        pre = document.getElementById('jfContent_pre');
        if (!pre) {
            pre = document.createElement('pre');
            pre.id = 'jfContent_pre';
            document.body.appendChild(pre);
        }
        pre.innerHTML = JSON.stringify(JSON.parse(jsonStr),null,4);
        pre.style.display = "none";

        jfStyleEl = document.getElementById('jfStyleEl');
        if (!jfStyleEl) {
            jfStyleEl = document.createElement('style');
            document.head.appendChild(jfStyleEl);
        }

        formattingMsg = document.getElementById('formattingMsg');
        if (!formattingMsg) {
            formattingMsg = document.createElement('pre');
            formattingMsg.id = 'formattingMsg';
            formattingMsg.innerHTML = '<svg id="spinner" width="16" height="16" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg" version="1.1">' +
                '<path d="M 150,0 a 150,150 0 0,1 106.066,256.066 l -35.355,-35.355 a -100,-100 0 0,0 -70.711,-170.711 z" fill="#3d7fe6"></path></svg> 格式化中...';
            document.body.appendChild(formattingMsg);
        }

        // Post the contents of the PRE
        port.postMessage({
            type:"SENDING TEXT",
            text:jsonStr,
            length:jsonStr.length
        });

        // 支持文件下载
        _downloadJsonFile(JSON.parse(jsonStr));
    };


    /**
     * 直接下载，能解决中文乱码
     * @param json
     * @private
     */
    var _downloadJsonFile = function(json){

        // 下载链接
        var localUrl = location.href ;
        var dt = (new Date()).format('yyyyMMddHHmmss');
        var content = JSON.stringify(json, null, 4);
        content = [ '/* ',localUrl,' */','\n',content].join('');
        var blob = new Blob([ content ], {type:'application/octet-stream'});

        var aLink = $('<a id="btnDownload" target="_blank" title="保存到本地">下载JSON数据</a>').prependTo('#optionBar');
        aLink.attr('download', 'FeHelper-' + dt + '.json');
        aLink.attr('href',URL.createObjectURL(blob));
    };

    /**
     * 下载数据:在新版本Chrome下会导致中文乱码
     * @param json
     * @private
     */
    var _downloadJsonFile2 = function (json) {
        try {

            window.webkitRequestFileSystem(window.TEMPORARY, 10 * 1024 * 1024, function (fs) {
                var dir = (+new Date).toString(36);
                var name = +new Date() + '.json';
                fs.root.getDirectory(dir, {create:true}, function (dirEntry) {
                    var file = dir + '/' + name;
                    fs.root.getFile(file, {create:true}, function (fileEntry) {
                        fileEntry.createWriter(function (fileWriter) {
                            // 数据写入完成后显示下载链接
                            fileWriter.onwriteend = function () {
                                $('#optionBar').prepend('<a href="' + fileEntry.toURL() + '" id="btnDownload" target="_blank" ' +
                                    'title="在新页面Ctrl+S保存到本地">下载JSON数据</a>');
                            };

                            // 下载链接
                            var localUrl = location.href ;
                            var content = JSON.stringify(json, null, 4);
                            content = [ '/* ',localUrl,' */','\n',content].join('');
                            var blob = new Blob([ content ], {type:'application/octet-stream'});

                            fileWriter.write(blob);
                        });
                    });
                });
            });
        } catch (e) {
        }
    };

    /**
     * 清空
     * @return {[type]}
     */
    var clear = function () {
        try {
            jfContent.innerHTML = '';
            pre.innerHTML = '';
        } catch (e) {

        }
    };

    return {
        format:format,
        clear:clear,
        postMessage:postMessage,
        disconnect:disconnect
    }
})();