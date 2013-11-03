/**
 * content_scripts中如果被检测到当前页面内容为json数据，则自动进行JSON格式化
 */
baidu.csJsonFormat = (function(){

	"use strict";

    var _htmlFragment = [
        '<div class="mod-json mod-contentscript"><div class="rst-item">',
            '<div id="formatTips">本页JSON数据由FeHelper进行自动格式化，若有任何问题，点击这里提交 ',
                '<a href="http://www.baidufe.com/item/889639af23968ee688b9.html#comment" target="_blank">意见反馈</a>',
                '&nbsp;&nbsp;或者&nbsp;&nbsp;<a href="#" id="makeAutoJsonFormatOff">禁用此功能</a>',
            '</div>',
            '<div id="formattingMsg">',
                '<svg id="spinner" width="16" height="16" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg" version="1.1">',
                    '<path d="M 150,0 a 150,150 0 0,1 106.066,256.066 l -35.355,-35.355 a -100,-100 0 0,0 -70.711,-170.711 z" fill="#3d7fe6"></path>',
                '</svg>加载中...',
            '</div>',
            '<div id="jfContent"></div>',
            '<pre id="jfContent_pre"></pre>',
        '</div></div>'
    ].join('');

    var _loadCss = function(){
        var fcpCss = chrome.extension.getURL('static/css/fe-jsonformat.css');
        jQuery('<link id="_fehelper_fcp_css_" href="' + fcpCss + '" rel="stylesheet" type="text/css" />').appendTo('head');
    };

    var _format = function(){

        var source ;
        if($('body').children().length == 1) {
            source = $.trim($('body>pre').html()) ;
        }
        if(!source) {
            source = $.trim($('body').html())
        }
        if(!source) {
            return;
        }

        var jsonObj = null;
        try{
            jsonObj = new Function("return " + source)();

            // 还要防止下面这种情况：  "{\"ret\":\"0\", \"msg\":\"ok\"}"
            if(typeof jsonObj == "string") {
                // 再来一次
                jsonObj = new Function("return " + jsonObj)();
            }

            if(typeof jsonObj == "object") {
                $('body').html(_htmlFragment);
                _loadCss();
                JsonFormatEntrance.clear();
                // 要尽量保证格式化的东西一定是一个json，所以需要把内容进行JSON.stringify处理
                source = JSON.stringify(jsonObj);
                JsonFormatEntrance.format(source);

                // 允许禁用
                $('#makeAutoJsonFormatOff').click(function(e){
                    baidu.feOption.setOptions({
                        "opt_item_autojson" : 'false'
                    });
                    alert("以后可以从FeHelper的选项页面中重新开启");
                    window.location.reload(true);
                });
            }
        }catch(ex){
            return;
        }
    };

	var _init = function(){
		$(function(){
            baidu.feOption.getOptions(["opt_item_autojson"],function(opts){
                if(opts["opt_item_autojson"] != 'false') {
                    _format();
                }
            });
		});
	};

	return {
		init : _init
	};
})();

baidu.csJsonFormat.init();