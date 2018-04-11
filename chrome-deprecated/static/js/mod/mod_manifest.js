(function ( /*importstart*/ ) {
	var scripts = document.getElementsByTagName('script'),
		length = scripts.length,
		src = scripts[length - 1].src,
		scriptPath = chrome.extension.getURL('static/');
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

importScript("js/core/core.js");
importScript("js/core/fe-const.js");
importScript("js/fe-option.js");

importScript("js/fcp/fcp-fl.js");
importScript("js/fcp/css/fcp-css-analytic.js");
importScript("js/fcp/css/fcp-css.js");
importScript("js/fcp/html/fcp-html-analytic.js");
importScript("js/fcp/html/fcp-html-doctype.js");
importScript("js/fcp/html/fcp-html.js");
importScript("js/fcp/js/fcp-js.js");
importScript("js/fcp/fcp-tabs.js");
importScript("js/fcp/fcp-main.js");

importScript("js/fe-helper.js");
importScript("js/wpo/fe-calc-wpo.js");

importScript("js/colorpicker/elem-tool.js");
importScript("js/colorpicker/colorpicker.js");

importScript("js/jsonformat/json-format-dealer.js");
importScript("js/jsonformat/json-format-ent.js");
importScript("js/jsonformat/contentscript-jsonformat.js");