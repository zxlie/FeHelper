/**
 * 栅格相关处理
 * @author zhaoxianlie
 */
let GridRuler = (function () {

    // 加载CSS
    let _loadCss = function () {
        if (!jQuery('#_fehelper_grid_css_')[0]) {
            let cssUrl = chrome.extension.getURL('ruler/index.css');
            jQuery('<link id="_fehelper_grid_css_" href="' + cssUrl + '" rel="stylesheet" type="text/css" />').appendTo('head');
        }
    };

    // 创建栅格
    let _createGrid = function () {

        let box = jQuery('#fe-helper-box');
        if (box[0]) {	//已经有栅格，则移除
            box.remove();
        }
        //没有栅格，则创建
        let $win = jQuery(window);
        let $body = jQuery('body');
        jQuery('<div id="fe-helper-box"></div>').appendTo('body').css({
            position: 'static'
        });
        jQuery('<div id="fe-helper-grid"></div>').appendTo('#fe-helper-box').css({
            width: $body.width(),
            height: Math.max($win.height(), $body.height())
        }).mousemove(function (e) {
            let pos = {};
            try {
                pos = document.getElementsByTagName('body')[0].getBoundingClientRect();
            } catch (err) {
                pos = {left: 0, top: 0};
            }
            //虚线框
            jQuery('#fe-helper-g-pos').show().css({
                width: e.pageX - pos.left,
                height: e.pageY
            });

            let _t = Math.min(e.pageY, jQuery(window).height() + $body.scrollTop() - 40);
            let _l = Math.min(e.pageX, jQuery(window).width() + $body.scrollLeft() - 200) + 5 - pos.left;

            //坐标tooltip
            jQuery('#fe-helper-gp-info').show().css({
                top: _t,
                left: _l
            }).html('top = ' + e.pageY + ' px ,left = ' + e.pageX + ' px');
        }).mouseout(function (e) {
            jQuery('#fe-helper-g-pos,#fe-helper-gp-info').hide();
        });

        jQuery('<div id="fe-helper-g-pos"></div><div id="fe-helper-gp-info"></div>').appendTo('#fe-helper-box');
        jQuery('<span id="fe-helper-btn-close-grid">关闭栅格层</span>')
            .appendTo('#fe-helper-box').click(function () {
            jQuery('#fe-helper-box').remove();
        });
    };

    // 绘制Ruler
    let _drawRuler = function () {

        let _t = 0, _h = 30, _w = 30;
        let $win = jQuery(window);
        let $page = jQuery('html');
        let elScroll = jQuery(document.scrollingElement || 'html');
        let $width = Math.max($win.width(), $page.width(), elScroll[0].scrollWidth);
        let $height = Math.max($win.height(), $page.height(), elScroll[0].scrollHeight);
        let rulerTop = jQuery('#fe-helper-ruler-top').width($width);
        let rulerLeft = jQuery('#fe-helper-ruler-left').height($height);

        if (!rulerTop.children().length || rulerTop.children().last().position().left < $width - 50) {
            rulerTop.html('');
            for (let i = 30; i <= $width; i += 10) {
                _t = (i % 50) ? 10 : 0;
                jQuery('<div class="h-line"></div>').appendTo('#fe-helper-ruler-top').css({
                    left: i - 1,
                    top: _t + 15,
                    height: _h - _t - 5
                });
                if (_t === 0 && i !== 0) {
                    jQuery('<div class="h-text">' + i + '</div>').appendTo('#fe-helper-ruler-top').css({
                        left: i - (String(i).length * 4)
                    });
                }
            }
        }

        if (!rulerLeft.children().length || rulerLeft.children().last().position().top < $height - 50) {
            rulerLeft.html('');
            for (let i = 0; i <= $height; i += 10) {
                _l = (i % 50) ? 10 : 0;
                jQuery('<div class="v-line"></div>').appendTo('#fe-helper-ruler-left').css({
                    left: _l + 15,
                    top: i - 1,
                    width: _w - _l - 5
                });
                if (_l === 0) {
                    jQuery('<div class="v-text">' + i + '</div>').appendTo('#fe-helper-ruler-left').css({
                        top: i - (String(i).length * 4),
                        left: i === 0 ? 5 : 0
                    });
                }
            }
        }
    };

    // 创建页面标尺
    let _createPageRuler = function () {
        if (!jQuery('#fe-helper-box')[0]) {
            jQuery('<div id="fe-helper-box"></div>').appendTo('body');
        }
        jQuery('<div id="fe-helper-ruler-top"></div><div id="fe-helper-ruler-left"></div>').appendTo('#fe-helper-box');
        _drawRuler();

    };

    // 全局事件绑定
    let _bindEvent = function () {

        //为页面注册按键监听
        jQuery('body').keydown(function (e) {
            if (jQuery('#fe-helper-box')[0]) {
                if (e.which === 27) { //ESC
                    jQuery('#fe-helper-box').remove();
                }
            }
        });

        //window.onresize
        jQuery(window).resize(function () {
            if (jQuery('#fe-helper-box')[0]) {
                let $win = jQuery(window);
                let $body = jQuery('body');
                jQuery('#fe-helper-grid').css({
                    width: Math.max($win.width(), $body.width()),
                    height: Math.max($win.height(), $body.height())
                });

                _drawRuler();
            }
        });

        //处理scroll的时候，标尺跟着移动
        jQuery(window).scroll(function (e) {
            if (jQuery('#fe-helper-box')[0]) {
                let elScroll = jQuery(document.scrollingElement || 'html');
                //水平标尺定位
                jQuery('#fe-helper-ruler-top').css('left', 0 - elScroll.scrollLeft());
                //垂直标尺
                jQuery('#fe-helper-ruler-left').css('top', 0 - elScroll.scrollTop());
            }
        });
    };

    /**
     * 执行栅格系统检测
     */
    let _detect = function (callback) {

        // 加载CSS
        _loadCss();

        //创建栅格
        _createGrid();

        //创建页面标尺
        _createPageRuler();

        // 事件绑定
        _bindEvent();


        //执行回调
        if (callback && typeof callback === "function") {
            callback.call(null);
        }
    };

    return {
        detect: _detect
    };
})();

module.exports = GridRuler;