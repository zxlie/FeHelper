/**
 * FeHelper 多维度工具组合
 */
new Vue({
    el: '#pageContainer',
    data: {
        tools: {
            radix: '进制转换',
            color: '颜色转换',
            crontab: 'Crontab生成器',
            payback: '还款计算器'
        },
        loadManager: {}
    },

    mounted: function () {

        // 通过Tab的切换，来动态加载小工具
        jQuery('#tabs').tabs({
            show: (event, ui) => {

                window.location.hash = ui.panel.id;
                let widget = ui.panel.id.replace('tab-', '');

                document.title = '多维小工具集 - ' + this.tools[widget];

                if (this.loadManager[widget]) {
                    return;
                }

                fetch(widget + '/index.html').then(resp => {
                    resp.text().then(html => {
                        this.loadManager[widget] = true;
                        // 插入html
                        ui.panel.innerHTML = html;

                        // 插入css
                        let link = document.createElement('link');
                        link.setAttribute('rel', 'stylesheet');
                        link.setAttribute('href', widget + '/index.css');
                        document.head.appendChild(link);

                        // 插入js
                        let script = document.createElement('script');
                        script.src = widget + '/index.js';
                        document.body.appendChild(script);
                    });
                });
            }
        });
    },

    methods: {}
});