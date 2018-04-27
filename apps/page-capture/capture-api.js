/**
 * chrome extension页面截屏API
 *
 * @copyright https://github.com/mrcoles/full-page-screen-capture-chrome-extension
 * @modify zhaoxianlie
 */

module.exports = function (MSG_TYPE) {

    let MAX_PRIMARY_DIMENSION = 15000 * 2,
        MAX_SECONDARY_DIMENSION = 4000 * 2,
        MAX_AREA = MAX_PRIMARY_DIMENSION * MAX_SECONDARY_DIMENSION;

    let matches = ['http://*/*', 'https://*/*', 'ftp://*/*', 'file://*/*'],
        noMatches = [/^https?:\/\/chrome.google.com\/.*$/];

    let listenerFunc;
    let capturedData = {};

    /**
     * URL合法性校验
     * @param url
     * @returns {boolean}
     */
    function isValidUrl(url) {
        // couldn't find a better way to tell if executeScript
        // wouldn't work -- so just testing against known urls
        // for now...
        let r, i;
        for (i = noMatches.length - 1; i >= 0; i--) {
            if (noMatches[i].test(url)) {
                return false;
            }
        }
        for (i = matches.length - 1; i >= 0; i--) {
            r = new RegExp('^' + matches[i].replace(/\*/g, '.*') + '$');
            if (r.test(url)) {
                return true;
            }
        }
        return false;
    }


    /**
     * 执行 capture
     * @param data
     * @param screenshots
     * @param callback
     */
    function capture(data, screenshots, callback) {
        chrome.tabs.captureVisibleTab(
            null, {format: 'png', quality: 100}, function (dataURI) {
                if (dataURI) {
                    let image = new Image();
                    image.onload = function () {
                        data.image = {width: image.width, height: image.height};

                        // given device mode emulation or zooming, we may end up with
                        // a different sized image than expected, so let's adjust to
                        // match it!
                        if (data.windowWidth !== image.width) {
                            let scale = image.width / data.windowWidth;
                            data.x *= scale;
                            data.y *= scale;
                            data.totalWidth *= scale;
                            data.totalHeight *= scale;
                        }

                        // lazy initialization of screenshot canvases (since we need to wait
                        // for actual image size)
                        if (!screenshots.length) {
                            Array.prototype.push.apply(
                                screenshots,
                                _initScreenshots(data.totalWidth, data.totalHeight)
                            );
                        }

                        // draw it on matching screenshot canvases
                        _filterScreenshots(
                            data.x, data.y, image.width, image.height, screenshots
                        ).forEach(function (screenshot) {
                            screenshot.ctx.drawImage(
                                image,
                                data.x - screenshot.left,
                                data.y - screenshot.top
                            );
                        });

                        callback(data);
                    };
                    image.src = dataURI;
                }
            });
    }


    /**
     * 如果页面超级超级长，需要拆分成多张图片来存储
     * @param totalWidth
     * @param totalHeight
     * @returns {Array}
     * @private
     */
    function _initScreenshots(totalWidth, totalHeight) {
        let badSize = (totalHeight > MAX_PRIMARY_DIMENSION ||
            totalWidth > MAX_PRIMARY_DIMENSION ||
            totalHeight * totalWidth > MAX_AREA),
            biggerWidth = totalWidth > totalHeight,
            maxWidth = (!badSize ? totalWidth :
                (biggerWidth ? MAX_PRIMARY_DIMENSION : MAX_SECONDARY_DIMENSION)),
            maxHeight = (!badSize ? totalHeight :
                (biggerWidth ? MAX_SECONDARY_DIMENSION : MAX_PRIMARY_DIMENSION)),
            numCols = Math.ceil(totalWidth / maxWidth),
            numRows = Math.ceil(totalHeight / maxHeight),
            row, col, canvas, left, top;

        let canvasIndex = 0;
        let result = [];

        for (row = 0; row < numRows; row++) {
            for (col = 0; col < numCols; col++) {
                canvas = document.createElement('canvas');
                canvas.width = (col === numCols - 1 ? totalWidth % maxWidth || maxWidth :
                    maxWidth);
                canvas.height = (row === numRows - 1 ? totalHeight % maxHeight || maxHeight :
                    maxHeight);

                left = col * maxWidth;
                top = row * maxHeight;

                result.push({
                    canvas: canvas,
                    ctx: canvas.getContext('2d'),
                    index: canvasIndex,
                    left: left,
                    right: left + canvas.width,
                    top: top,
                    bottom: top + canvas.height
                });

                canvasIndex++;
            }
        }

        return result;
    }


    /**
     * 从截屏中筛选有效数据
     * @param imgLeft
     * @param imgTop
     * @param imgWidth
     * @param imgHeight
     * @param screenshots
     * @private
     */
    function _filterScreenshots(imgLeft, imgTop, imgWidth, imgHeight, screenshots) {
        // Filter down the screenshots to ones that match the location
        // of the given image.
        //
        let imgRight = imgLeft + imgWidth,
            imgBottom = imgTop + imgHeight;
        return screenshots.filter(function (screenshot) {
            return (imgLeft < screenshot.right &&
                imgRight > screenshot.left &&
                imgTop < screenshot.bottom &&
                imgBottom > screenshot.top);
        });
    }


    /**
     * 获取Blobs数据
     * @param screenshots
     */
    function getBlobs(screenshots) {
        return screenshots.map(function (screenshot) {
            let dataURI = screenshot.canvas.toDataURL();

            // convert base64 to raw binary data held in a string
            // doesn't handle URLEncoded DataURIs
            let byteString = atob(dataURI.split(',')[1]);

            // separate out the mime component
            let mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

            // write the bytes of the string to an ArrayBuffer
            let ab = new ArrayBuffer(byteString.length);
            let ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }

            // create a blob for writing to a file
            return new Blob([ab], {type: mimeString});
        });
    }

    /**
     * 将Blob数据存储到本地临时文件
     * @param blob
     * @param filename
     * @param index
     * @param callback
     * @param errback
     */
    function saveBlob(blob, filename, index, callback, errback) {
        filename = ((filename, index) => {
            if (!index) {
                return filename;
            }
            let sp = filename.split('.');
            let ext = sp.pop();
            return sp.join('.') + '-' + (index + 1) + '.' + ext;
        })(filename, index);

        function onwriteend() {
            // open the file that now contains the blob - calling
            // `openPage` again if we had to split up the image
            let urlName = ('filesystem:chrome-extension://' +
                chrome.i18n.getMessage('@@extension_id') +
                '/temporary/' + filename);

            callback(urlName);
        }

        // come up with file-system size with a little buffer
        let size = blob.size + (1024 / 2);

        // create a blob for writing to a file
        let reqFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
        reqFileSystem(window.TEMPORARY, size, function (fs) {
            fs.root.getFile(filename, {create: true}, function (fileEntry) {
                fileEntry.createWriter(function (fileWriter) {
                    fileWriter.onwriteend = onwriteend;
                    fileWriter.write(blob);
                }, errback); // TODO - standardize error callbacks?
            }, errback);
        }, errback);
    }


    /**
     * 截屏输出screenshots对象
     * @param tab
     * @param doneback
     * @param errback
     * @param progress
     */
    function captureToOrigin(tab, doneback, errback, progress) {
        let screenshots = [],
            noop = new Function();

        doneback = doneback || noop;
        errback = errback || noop;
        progress = progress || noop;

        if (!isValidUrl(tab.url)) {
            errback('invalid url');
        }

        if (typeof listenerFunc !== 'undefined') {
            chrome.runtime.onMessage.removeListener(listenerFunc);
        }
        listenerFunc = function (request, sender, sendResponse) {
            if (request.type === MSG_TYPE.PAGE_CAPTURE_CAPTURE) {
                progress(request.complete);
                capture(request, screenshots, (data) => {
                    sendResponse(data);
                    request.complete === 1 && doneback(screenshots);
                });
                return true;
            }
        };
        chrome.runtime.onMessage.addListener(listenerFunc);

        chrome.tabs.sendMessage(tab.id, {type: MSG_TYPE.PAGE_CAPTURE_SCROLL}, () => progress(0));
    }

    /**
     * 通过网页url生成默认的文件名
     * @param contentURL
     * @returns {string}
     */
    function buildFilenameFromUrl(contentURL) {
        let name = contentURL.split('?')[0].split('#')[0];
        if (name) {
            name = name
                .replace(/^https?:\/\//, '')
                .replace(/[^A-z0-9]+/g, '-')
                .replace(/-+/g, '-')
                .replace(/^[_\-]+/, '')
                .replace(/[_\-]+$/, '');
            name = '-' + name;
        } else {
            name = '';
        }
        return 'fehelper' + name + '-' + Date.now() + '.png';
    }

    /**
     * 截屏保存为文件
     * @param tab
     * @param callback
     * @param errback
     * @param progress
     */
    function captureToFiles(tab, callback, errback, progress) {
        let doneback = (screenshots) => {
            let blobs = getBlobs(screenshots);
            let i = 0;
            let len = blobs.length;

            // 生成临时文件名
            let baseName = buildFilenameFromUrl(tab.url);

            // 保存 & 打开
            (function doNext() {
                saveBlob(blobs[i], baseName, i, function (filename) {
                    ++i >= len ? callback(filename) : doNext();
                }, errback);
            })();
        };

        captureToOrigin(tab, doneback, errback, progress);
    }


    /**
     * 截屏入口
     * @param tab
     */
    function fullPageCapture(tab) {

        // 配置项
        let captureConfig = {
            // 保存成功文件时，用这个
            successForFile: filename => {
                chrome.tabs.create({
                    url: filename
                });
            },

            // 获取原始数据，用这个
            successForDataURI: function (screenshots) {
                capturedData = {
                    pageInfo: tab,
                    filename: buildFilenameFromUrl(tab.url),
                    imageURI: screenshots.map(function (screenshot) {
                        return screenshot.canvas.toDataURL();
                    })
                };

                chrome.tabs.create({
                    url: 'page-capture/index.html'
                });
            },

            fail: reason => {
                BgPageInstance.notify({
                    title: '糟糕，转换失败',
                    message: (reason && reason.message || reason || '稍后尝试刷新页面重试!')
                });
            },

            progress: percent => {
                percent = parseInt(percent * 100, 10) + '%';

                chrome.tabs.executeScript(tab.id, {
                    code: 'document.title="进度：' + percent + ' ...";'
                });

                if (percent === '100%') {
                    setTimeout(() => {
                        chrome.tabs.executeScript(tab.id, {
                            code: 'document.title="' + tab.title + '";'
                        });
                    }, 800);
                }
            }
        };

        // 截屏走起
        // captureToFiles(tab, captureConfig.successForFile, captureConfig.fail, captureConfig.progress);
        captureToOrigin(tab, captureConfig.successForDataURI, captureConfig.fail, captureConfig.progress);
    }

    function getCapturedData() {
        return capturedData;
    }

    return {
        full: fullPageCapture,
        getCapturedData: getCapturedData
    };

};