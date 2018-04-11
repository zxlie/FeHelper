/**
 * 代码压缩
 * @author 赵先烈
 */

/**
 * Uglifyjs3压缩
 */
var UglifyJs3 = (function () {
    "use strict";

    function get_options() {
        return {
            parse: {
                bare_returns: false,
                ecma: 8,
                expression: false,
                filename: null,
                html5_comments: true,
                shebang: true,
                strict: false,
                toplevel: null
            },
            compress: {
                arrows: true,
                booleans: true,
                collapse_vars: true,
                comparisons: true,
                computed_props: true,
                conditionals: true,
                dead_code: true,
                drop_console: false,
                drop_debugger: true,
                ecma: 5,
                evaluate: true,
                expression: false,
                global_defs: {},
                hoist_funs: false,
                hoist_props: true,
                hoist_vars: false,
                ie8: false,
                if_return: true,
                inline: true,
                join_vars: true,
                keep_classnames: false,
                keep_fargs: true,
                keep_fnames: false,
                keep_infinity: false,
                loops: true,
                negate_iife: true,
                passes: 1,
                properties: true,
                pure_getters: "strict",
                pure_funcs: null,
                reduce_funcs: true,
                reduce_vars: true,
                sequences: true,
                side_effects: true,
                switches: true,
                top_retain: null,
                toplevel: false,
                typeofs: true,
                unsafe: false,
                unsafe_arrows: false,
                unsafe_comps: false,
                unsafe_Function: false,
                unsafe_math: false,
                unsafe_methods: false,
                unsafe_proto: false,
                unsafe_regexp: false,
                unsafe_undefined: false,
                unused: true,
                warnings: false
            },
            mangle: {
                eval: false,
                ie8: false,
                keep_classnames: false,
                keep_fnames: false,
                properties: false,
                reserved: [],
                safari10: false,
                toplevel: false
            },
            output: {
                ascii_only: false,
                beautify: false,
                bracketize: false,
                comments: /@license|@preserve|^!/,
                ecma: 5,
                ie8: false,
                indent_level: 4,
                indent_start: 0,
                inline_script: true,
                keep_quoted_props: false,
                max_line_len: false,
                preamble: null,
                preserve_line: false,
                quote_keys: false,
                quote_style: 0,
                safari10: false,
                semicolons: true,
                shebang: true,
                source_map: null,
                webkit: false,
                width: 80,
                wrap_iife: false
            },
            wrap: false
        };
    }


    function encodeHTML(str) {
        return (str + '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/"/g, '&quot;');
    }

    function show_error(e, param) {

        var row = 0, column = 0;
        if (e instanceof JS_Parse_Error) {
            var lines = param.split('\n');
            var line = lines[e.line - 1];
            row = e.line;
            column = e.col + 1;
            e = '压缩出错了：\n\n' + e.message + '\n' +
                'Line ' + e.line + ', column ' + (e.col + 1) + '\n\n' +
                (lines[e.line - 2] ? (e.line - 1) + ': ' + lines[e.line - 2] + '\n' : '') + e.line + ': ' +
                line.substr(0, e.col) + (line.substr(e.col, 1) || ' ') +
                line.substr(e.col + 1) + '\n' +
                (lines[e.line] ? (e.line + 1) + ': ' + lines[e.line] : '');
        } else if (e instanceof Error) {
            e = e.name + ': ' + e.message;
        }

        return {
            error: e,
            errPos: {
                row: row,
                col: column
            }
        };
    }

    function compress(input) {

        try {
            return main();
        } catch (e) {
            return show_error(e, input);
        }

        function main() {
            if (!input) {
                return;
            }

            var res = minify(input, get_options());
            if (res.error) {
                throw res.error;
            }

            return {
                out: res.code || '/* 无内容输出！ */'
            };
        }
    }

    return {
        compress: compress
    }

})();

/**
 * 代码压缩
 */
var CodeCompress = (function () {

    var editor;

    var bindEvent = function () {

        $('#jfContent').click(function (e) {
            $(this).select();
        });

        $('#btnFormat').click(function (e) {
            var source = $.trim(editor.getValue());
            var jfContent = $('#jfContent');

            if (!source) {
                alert('请先粘贴您需要压缩的代码');
            } else {
                // 用uglifyjs3进行在线压缩
                var result = UglifyJs3.compress(source);
                jfContent.val(result.out || result.error);
                jfContent.css('color', result.error ? 'red' : 'black');
            }
        });
    };

    var init = function () {
        $(function () {
            editor = CodeMirror.fromTextArea($('#codeSource')[0], {
                mode: "text/javascript",
                lineNumbers: true,
                matchBrackets: true,
                styleActiveLine: true,
                lineWrapping: true
            });

            //输入框聚焦
            editor.focus();
            bindEvent();
        })
    };

    return {
        init: init
    };
})();

CodeCompress.init();