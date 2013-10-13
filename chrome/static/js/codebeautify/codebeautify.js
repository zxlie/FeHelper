/**
 * 代码格式化
 * @author 赵先烈
 */
var CodeBeautify = (function(){

    var opts = {
        brace_style: "collapse",
        break_chained_methods: false,
        indent_char: " ",
        indent_scripts: "keep",
        indent_size: "4",
        keep_array_indentation: true,
        preserve_newlines: true,
        space_after_anon_function: true,
        space_before_conditional: true,
        unescape_strings: false,
        wrap_line_length: "120"
    };

    var codeType = 'Javascript';

    var bindEvent = function(){
        $('input[name="codeType"]').click(function(e){
            codeType = this.value;
            $('#codeTitle').html(this.value);
        });

        $('#btnFormat').click(function(e){
            if(codeType == 'Javascript') {
                var js = js_beautify($('#codeSource').val(),opts);
                js =  js.replace(/>/g,'&gt;').replace(/</g,'&lt;');
                js = '<pre class="brush: js;toolbar:false;">' + js + '</pre>';
                $('#jfContent').html(js);
            }else if(codeType == 'CSS') {
                var css = css_beautify($('#codeSource').val());
                css = '<pre class="brush: css;toolbar:false;">' + css + '</pre>';
                $('#jfContent').html(css);
            }else if(codeType == 'HTML') {
                var html = html_beautify($('#codeSource').val());
                html = '<pre class="brush: html;toolbar:false;">' + html + '</pre>';
                $('#jfContent').html(html);
            }
            SyntaxHighlighter.highlight();
        });
    };

    var init = function(){
        $(function(){
            //输入框聚焦
            jQuery("#codeSource").focus();
            bindEvent();
        })
    };

    return {
        init : init
    };
})();

CodeBeautify.init();