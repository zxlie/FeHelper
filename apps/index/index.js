/**
 * FeHelper 首页
 */
new Vue({
    el: '#pageContainer',
    data: {
        allTools: window.FhConfig.toolMap,
        screenshots: window.FhConfig.screenshots,
        installIng: false
    },
    mounted() {
        // 读取url上的参数，针对 ?action=install-chrome 这样的动作进行解析
        let action = new URL(location.href).searchParams.get('action');
        if (action && ['install-chrome', 'install-firefox', 'install-msedge'].includes(action)) {
            this.install();
        }
    },
    methods: {
        install(event) {

            if (/Edg/.test(navigator.userAgent)) {
                window.open("https://microsoftedge.microsoft.com/addons/detail/feolnkbgcbjmamimpfcnklggdcbgakhe?hl=zh-CN");
            } else if (/Firefox/.test(navigator.userAgent)) {
                fetch('/fe/web-files/firefox.updates.json').then(resp => resp.text()).then(json => {
                    try {
                        json = new Function(`return ${json}`)();
                        let xpi = json.addons['fehelper@baidufe.com'].updates[0];
                        let version = xpi.version;
                        let link = xpi.update_link;

                        if (window.InstallTrigger) {
                            InstallTrigger.install({
                                "FeHelper": {
                                    URL: link,
                                    IconURL: '../static/img/fe-48.png',
                                    toString: function () {
                                        return this.URL;
                                    }
                                }
                            });
                        } else {
                            location.href = link;
                        }
                    } catch (e) {
                        console.log(e)
                    }
                });
            } else {
                // 通过这个API可以直接判断当前浏览器是否已经安装了这个chrome extension
                if (chrome.app.isInstalled) {
                    alert("你已经安装过这个chrome扩展了");
                } else {
                    this.installIng = true;

                    // Fehelper在chrome浏览器的官方安装页面
                    let chromeFeHelper = 'https://chrome.google.com/webstore/detail/pkgccpejnmalmdinmhkkfafefagiiiad';

                    chrome.webstore && chrome.webstore.install && chrome.webstore.install(chromeFeHelper,
                        () => {
                            alert("恭喜你，Chrome Extension安装成功");
                            this.installIng = false;
                        },
                        (err) => {
                            alert("抱歉，Chrome Extension安装失败");
                            this.installIng = false;
                        });
                }
            }

            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
        },

        preClick(tool, event) {
            if (this.allTools[tool].extensionOnly) {
                alert(`你好，${this.allTools[tool].name} 工具只能在浏览器插件中使用，如果你还没安装FeHelper插件，就快去安装吧！`);
                event.preventDefault();
                event.stopPropagation();
            }

        }
    }
});
