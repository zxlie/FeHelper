/* code here... */

var _gaq = _gaq || [];

var widthOffset = 375;
var heightOffset = 90


/**
 * @type {DataConverter}
 * 对数据内容进行转换
 */
var d = new DataConverter('converter');

var sidebar = $('#header');

var win = $(window);
var base = $('#pageContainer');
var w = base.width() - widthOffset;
var h = win.height() - heightOffset;

//重载页面，解决无法显示textarea问题
d.create(w, h);
d.resize(w, h);
sidebar.height(h);

$(".settingsElement").change(updateSettings);


/**
 * win发生窗口变化的时候，验证窗口的高宽
 * 修正sidebar的高宽
 */
$(window).bind('resize', function () {

    w = base.width() - widthOffset;
    h = win.height() - heightOffset;
    d.resize(w, h);
    sidebar.height(h);

});


/**
 * 监听dom树，修改设置内容
 * 定界符
 * 第一行标题
 * 输出格式内容
 * @param evt
 */
function updateSettings(evt) {

    if (evt) {
        _gaq.push(['_trackEvent', 'Settings', evt.currentTarget.id]);
    }

    d.includeWhiteSpace = $('#includeWhiteSpaceCB').prop('checked');

    if (d.includeWhiteSpace) {
        $("input[name=indentType]").removeAttr("disabled");
        var indentType = $('input[name=indentType]:checked').val();
        if (indentType === "tabs") {
            d.indent = "\t";
        } else if (indentType === "spaces") {
            d.indent = "  "
        }
    } else {
        $("input[name=indentType]").attr("disabled", "disabled");
    }

    d.headersProvided = $('#headersProvidedCB').prop('checked');

    if (d.headersProvided) {
        $("input[name=headerModifications]").removeAttr("disabled");

        var hm = $('input[name=headerModifications]:checked').val();
        if (hm === "downcase") {
            d.downcaseHeaders = true;
            d.upcaseHeaders = false;
        } else if (hm === "upcase") {
            d.downcaseHeaders = false;
            d.upcaseHeaders = true;
        } else if (hm === "none") {
            d.downcaseHeaders = false;
            d.upcaseHeaders = false;
        }
    } else {
        $("input[name=headerModifications]").attr("disabled", "disabled");
    }

    d.delimiter = $('input[name=delimiter]:checked').val();
    d.decimal = $('input[name=decimal]:checked').val();

    d.useUnderscores = true;


    d.root = $('#root').val();
    d.child = $('#child').val();

    d.convert();
};

updateSettings();
  