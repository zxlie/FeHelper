/**
 * FeHelper 正则工具
 */

/**
 * 自适应高度的jquery插件
 */
$.fn.extend({
    textareaAutoHeight:function (options) {
        this._options = {
            minHeight:0,
            maxHeight:100000
        };

        this.init = function () {
            for (var p in options) {
                this._options[p] = options[p];
            }
            if (this._options.minHeight === 0) {
                this._options.minHeight = parseFloat($(this).height());
            }
            for (var p in this._options) {
                if ($(this).attr(p) == null) {
                    $(this).attr(p, this._options[p]);
                }
            }
            $(this).keyup(this.resetHeight).change(this.resetHeight)
                .focus(this.resetHeight);
        };
        this.resetHeight = function () {
            var _minHeight = parseFloat($(this).attr("minHeight"));
            var _maxHeight = parseFloat($(this).attr("maxHeight"));

            $(this).height(0);
            var h = parseFloat(this.scrollHeight);
            h = h < _minHeight ? _minHeight :
                h > _maxHeight ? _maxHeight : h;
            $(this).height(h).scrollTop(h);
            if (h >= _maxHeight) {
                $(this).css("overflow-y", "scroll");
            }
            else {
                $(this).css("overflow-y", "hidden");
            }
        };
        this.init();
    }
});

var RegExpTools = (function () {

    "use strict";

    var regElm, srcElm, rstElm, rstCount, srcBackgroundElm, srcWrapperElm, regListElm;
    var ID_PREFIX = 'tmp_id_';
    var TAG_MATCHED = 'b';
    var TAG_NOT_MATCHED = 'i';
    var TR_ID_PREFIX = 'tr_' + ID_PREFIX;

    var _getRegExp = function (regTxt) {
        try {
            return new Function('return ' + regTxt)();
        } catch (e) {
            return null;
        }
    };

    var _buildTable = function (rstArray) {
        var tbl = ["<table class='table table-bordered table-striped table-condensed table-hover'>"];
        tbl.push('<tr class="active"><th class="num">序号</th><th>匹配结果</th><th>在原字符串中的位置</th></tr>')
        $.each(rstArray, function (i, item) {
            tbl.push('<tr id="' + TR_ID_PREFIX + item.index + '" data-index="' + item.index + '">');
            tbl.push('<td class="num">' + (i + 1) + '</td>'
                + '<td class="content">' + item.text + '</td>'
                + '<td class="index">' + item.index + '</td>');
            tbl.push('</tr>');
        });
        tbl.push('</table>');
        return tbl.join('');
    };

    var _createTag = function (type, item) {
        var tags = [];
        for (var i = 0, len = item.text.length; i < len; i++) {
            tags.push('<' + type + ' data-id="' + ID_PREFIX + item.index + '">'
                + item.text.charAt(i) + '</' + type + '>');
        }
        return tags.join('');
    };

    var _blinkHighlight = function () {
        $('tr[id^=' + TR_ID_PREFIX + ']').click(function (e) {
            var index = $(this).attr('data-index');
            var tags = $(TAG_MATCHED + '[data-id=' + ID_PREFIX + index + ']');
            tags.animate({
                opacity:0
            }, 200).delay().animate({
                    opacity:1
                }, 200).delay().animate({
                    opacity:0
                }, 200).delay().animate({
                    opacity:1
                }, 200);
        });
    };

    var _highlight = function (srcText, rstArray) {
        if (!srcText) {
            srcBackgroundElm.html('');
            return;
        }
        var hl = [];
        var preIndex = 0;
        $.each(rstArray, function (i, item) {
            if (i === 0) {
                if (item.index === 0) {
                    hl.push(_createTag(TAG_MATCHED, item));
                } else {
                    hl.push(_createTag(TAG_NOT_MATCHED, {
                        index:0,
                        text:srcText.substring(0, item.index)
                    }));
                    hl.push(_createTag(TAG_MATCHED, item));
                }
            } else {
                preIndex = rstArray[i - 1].index + rstArray[i - 1].text.length;
                hl.push(_createTag(TAG_NOT_MATCHED, {
                    index:preIndex,
                    text:srcText.substring(preIndex, item.index)
                }));
                hl.push(_createTag(TAG_MATCHED, item));
            }
        });
        srcBackgroundElm.html(hl.join(''));
        _blinkHighlight();
    };

    var _emptyTable = function (message) {
        var tbl = ["<table class='table table-bordered table-striped table-condensed table-hover'>"];
        tbl.push('<tr class="active"><th class="num">序号</th><th>匹配结果</th></tr>');
        tbl.push('<tr><td colspan="2">' + message + '</td></tr>');
        tbl.push('</table>');
        return tbl.join('');
    };

    var _dealRegMatch = function (e) {
        srcWrapperElm.height(srcElm.height() + 24);

        var regTxt = regElm.val().trim();
        var srcTxt = srcElm.val().trim();
        if (!regTxt || !srcTxt) {
            rstElm.html(_emptyTable('不能匹配'));
            rstCount.html('0个');
            _highlight();
        } else {
            var reg = _getRegExp(regTxt);
            if (!reg || !reg instanceof RegExp) {
                rstElm.html(_emptyTable('正则表达式错误！'));
                rstCount.html('0个');
                _highlight();
                return;
            }
            var rst = [];
            // 用字符串的replace方法来找到匹配目标在元字符串中的准确位置
            srcTxt.replace(reg, function () {
                var matchedTxt = arguments[0];
                var txtIndex = arguments[arguments.length - 2];
                rst.push({
                    text:matchedTxt,
                    index:txtIndex
                });
            });
            if (!rst || !rst.length) {
                rstElm.html(_emptyTable('不能匹配'));
                rstCount.html('0个');
                _highlight();
            } else {
                rstElm.html(_buildTable(rst));
                rstCount.html(rst.length + '个');
                _highlight(srcElm.val(), rst);
            }
        }
    };

    var _init = function () {
        regElm = $('#regText');
        srcElm = $('#srcCode');
        srcBackgroundElm = $('#srcBackground');
        srcWrapperElm = $('#srcWrapper');
        rstElm = $('#rstCode').html(_emptyTable('暂无输入'));
        rstCount = $('#rstCount');
        regListElm = $('#regList');

        // 输入框自适应高度
        regElm.textareaAutoHeight({minHeight:34});
        srcElm.textareaAutoHeight({minHeight:50});
        srcBackgroundElm.textareaAutoHeight({minHeight:50});

        // 监听两个输入框的按键、paste、change事件
        $('#regText,#srcCode').keyup(_dealRegMatch).change(_dealRegMatch)
            .bind('paste', _dealRegMatch);

        regListElm.change(function (e) {
            var reg = $(this).val();
            var regTipElm = $('#regTip');
            regElm.val(reg);
            if (!reg) {
                regTipElm.hide();
            } else {
                regTipElm.show();
            }
        });
    };

    return {
        init:_init
    };
})();

RegExpTools.init();