(function ( /*importstart*/ ) {
	var scripts = document.getElementsByTagName('script'),
		length = scripts.length,
		src = scripts[length - 1].src,
		pos = src.indexOf('/static/'),
		scriptPath = src.substr(0, pos) + '/static/';
	if (!window.importScriptList) window.importScriptList = {};
	window.importScript = function (filename) {
		if (!filename) return;
		if (filename.indexOf("http://") == -1 && filename.indexOf("https://") == -1) {
			if (filename.substr(0, 1) == '/') filename = filename.substr(1);
			filename = scriptPath + filename;
		}
		if (filename in importScriptList) return;
		importScriptList[filename] = true;
		document.write('<script src="' + filename + '" type="text/javascript" charset="utf-8"><\/' + 'script>');
	}
})( /*importend*/ )

importScript("js/codebeautify/beautify.js");
importScript("js/codebeautify/vkbeautify.js");
importScript("js/codebeautify/beautify-css.js");
importScript("js/codebeautify/beautify-html.js");
importScript("js/core/fe-const.js");
importScript("js/core/core.js");
importScript("vendor/syntaxhighlighter/shCore.js");
importScript("vendor/syntaxhighlighter/shBrushCss.js");
importScript("vendor/syntaxhighlighter/shBrushJScript.js");
importScript("vendor/syntaxhighlighter/shBrushXml.js");
importScript("vendor/syntaxhighlighter/shBrushSql.js");
importScript("js/codebeautify/codebeautify.js");