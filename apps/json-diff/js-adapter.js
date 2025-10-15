/**
 * JSON工具适配器
 * 用于桥接json-source-map库和主应用
 */
(function() {
    // 确保json-source-map.js中的parse函数在全局可用
    window.jsonSourceMap = {
        parse: parse
    };
})(); 