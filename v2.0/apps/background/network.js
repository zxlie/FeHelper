/**
 * 后端网络处理，ajax等
 * @author zhaoxianlie
 */
module.exports = (() => {
    /**
     * 通过这个方法来读取服务器端的CSS文件内容，要这样做，前提是在manifest.json中配置permissions为：http://
     * @param {String} link 需要读取的css文件
     * @param {Function} callback 回调方法，格式为：function(respData){}
     * @config {Object} respData 输出到客户端的内容，格式为{success:BooleanValue,content:StringValue}
     * @return {Undefined} 无返回值
     */
    let _readFileContent = function (link, callback) {
        //创建XMLHttpRequest对象，用原生的AJAX方式读取内容
        let xhr = new XMLHttpRequest();
        //处理细节
        xhr.onreadystatechange = function () {
            //后端已经处理完成，并已将请求response回来了
            if (xhr.readyState === 4) {
                //输出到客户端的内容，格式为{success:BooleanValue,content:StringValue}
                let respData;
                //判断status是否为OK
                if (xhr.status === 200 && xhr.responseText) {
                    //OK时回送给客户端的内容
                    respData = {
                        success: true,	//成功
                        path: link,	//文件路径
                        content: xhr.responseText	//文件内容
                    };
                } else {	//失败
                    respData = {
                        success: false,	//失败
                        path: link,	//文件路径
                        content: "FcpHelper can't load such file."	//失败信息
                    };
                }
                //触发回调，并将结果回送
                callback(respData);
            }
        };
        //打开读通道
        xhr.open('GET', link, true);
        //设置HTTP-HEADER
        xhr.setRequestHeader("Content-Type", "text/plain;charset=UTF-8");
        xhr.setRequestHeader("Access-Control-Allow-Origin", "*");
        //开始进行数据读取
        xhr.send();
    };

    /**
     * 从cookie中获取url
     * @param {Object} cookie
     */
    let _urlFromCookie = function (cookie) {
        return "http" + (cookie.secure ? "s" : "") + "://" + cookie.domain + cookie.path;
    };

    /**
     * 获取页面上的所有cookie
     * @param {Object} callback
     */
    let _getCookies = function (request, callback) {
        let arrCookies = [];
        chrome.cookies.getAll({}, function (cookies) {
            for (let i = 0, le = cookies.length; i < le; i++) {
                if (request.url.indexOf(cookies[i].domain.substring(1)) > -1) {
                    cookies[i].url = _urlFromCookie(cookies[i]);
                    arrCookies.push(cookies[i]);
                }
            }

            //排序
            cookies.sort(function (a, b) {
                return a.domain.localeCompare(b.domain);
            });

            callback.call(null, {
                cookie: arrCookies
            });
        });
    };

    /**
     * 移除某个cookie
     * @param {Object} request
     * @param {Object} callback
     */
    let _removeCookie = function (request, callback) {
        chrome.cookies.getAll({}, function (cookies) {
            for (let i = 0, le = cookies.length; i < le; i++) {
                let url = _urlFromCookie(cookies[i]);
                let name = cookies[i].name;
                if (url == request.url && name == request.name) {
                    chrome.cookies.remove({"url": url, "name": name});
                    if (callback && typeof callback == "function") {
                        callback.call(null);
                    }
                    return;
                }
            }
        });
    };

    /**
     * 设置某个cookie
     * @param {Object} request
     * @param {Object} callback
     */
    let _setCookie = function (request, callback) {
        chrome.cookies.getAll({}, function (cookies) {
            for (let i = 0, le = cookies.length; i < le; i++) {
                let url = _urlFromCookie(cookies[i]);
                let name = cookies[i].name;
                if (url == request.url && name == request.name) {
                    chrome.cookies.set(request);
                    if (callback && typeof callback == "function") {
                        callback.call(null);
                    }
                    return;
                }
            }
        });
    };

    return {
        readFileContent: _readFileContent,
        getCookies: _getCookies,
        removeCookie: _removeCookie,
        setCookie: _setCookie
    };
})();

