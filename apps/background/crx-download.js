/**
 * FeHelper：从chrome webstore下载extension文件的工具
 * @author zhaoxianlie
 */

import MSG_TYPE from '../static/js/common.js';

export default (function () {

    let FeJson = {notifyTimeoutId:-1};
    /**
     * 文本格式，可以设置一个图标和标题
     * @param {Object} options
     * @config {string} type notification的类型，可选值：html、text
     * @config {string} icon 图标
     * @config {string} title 标题
     * @config {string} message 内容
     */
    let notifyText = function (options) {
        let notifyId = 'FeJson-notify-id';
        if(typeof options === 'string') {
            options = {message: options};
        }
        clearTimeout(FeJson.notifyTimeoutId);
        if (options.closeImmediately) {
            return chrome.notifications.clear(notifyId);
        }

        if (!options.icon) {
            options.icon = "static/img/fe-48.png";
        }
        if (!options.title) {
            options.title = "温馨提示";
        }
        chrome.notifications.create(notifyId, {
            type: 'basic',
            title: options.title,
            iconUrl: chrome.runtime.getURL(options.icon),
            message: options.message
        });

        FeJson.notifyTimeoutId = setTimeout(() => {
            chrome.notifications.clear(notifyId);
        }, parseInt(options.autoClose || 3000, 10));

    };

    /**
     * 检测Google chrome服务能不能访问，在2s内检测心跳
     * @param success
     * @param failure
     */
    let detectGoogleDotCom = function (success, failure) {
        Promise.race([
            fetch('https://clients2.google.com/service/update2/crx'),
            new Promise(function (resolve, reject) {
                setTimeout(() => reject(new Error('request timeout')), 2000)
            })])
            .then((data) => {
                success && success();
            }).catch(() => {
            failure && failure();
        });
    };

    /**
     * 从google官方渠道下载chrome扩展
     * @param crxId 需要下载的extension id
     * @param crxName 扩展名称
     * @param callback 下载动作结束后的回调
     */
    let downloadCrxFileByCrxId = function (crxId, crxName, callback) {
        detectGoogleDotCom(() => {
            // google可以正常访问，则正常下载
            let url = "https://clients2.google.com/service/update2/crx?response=redirect&acceptformat=crx2,crx3&x=id%3D"
                + crxId + "%26uc&prodversion=" + navigator.userAgent.split("Chrome/")[1].split(" ")[0];
            if (!chrome.downloads) {
                let a = document.createElement('a');
                a.href = url;
                a.download = crxName || (crxId + '.crx');
                (document.body || document.documentElement).appendChild(a);
                a.click();
                a.remove();
            } else {
                chrome.downloads.download({
                    url: url,
                    filename: crxName || crxId,
                    conflictAction: 'overwrite',
                    saveAs: true
                }, function (downloadId) {
                    if (chrome.runtime.lastError) {
                        notifyText('抱歉，下载失败！错误信息：' + chrome.runtime.lastError.message);
                    }
                });
            }
        }, () => {
            // google不能正常访问
            callback ? callback() : notifyText('抱歉，下载失败！');
        });

    };

    /**
     * 从chrome webstore下载crx文件
     * 在chrome extension详情页使用
     */
    let downloadCrxFileFromWebStoreDetailPage = function (callback) {

        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            let tab = tabs[0];
            let crxId = tab.url.split("/")[6].split('?')[0];
            let crxName = tab.title.split(" - Chrome")[0] + ".crx";
            crxName = crxName.replace(/[&\/\\:"*<>|?]/g, '');

            downloadCrxFileByCrxId(crxId, crxName, callback);
        });
    };

    /**
     * 通过右键菜单下载或者分享crx
     * @param tab
     * @private
     */
    let _downloadCrx = function (tab) {
        let isWebStoreDetailPage = tab.url.indexOf('https://chrome.google.com/webstore/detail/') === 0;
        if (isWebStoreDetailPage) {
            // 如果是某个chrome extension的详情页面了，直接下载当前crx文件
            downloadCrxFileFromWebStoreDetailPage(() => {
                notifyText('下载失败，可能是当前网络无法访问Google站点！');
            });
        } else {
            // 否则，下载FeHelper并分享出去
            let crxId = MSG_TYPE.STABLE_EXTENSION_ID;
            let crxName = chrome.runtime.getManifest().name + '-latestVersion.crx';

            downloadCrxFileByCrxId(crxId, crxName, () => {
                chrome.tabs.create({
                    url: MSG_TYPE.DOWNLOAD_FROM_GITHUB
                });
            });
        }
    };

    return {
        downloadCrx: _downloadCrx
    };
})();
