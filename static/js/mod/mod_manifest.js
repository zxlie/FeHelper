(function ( /*importstart*/ ) {
	var scripts = document.getElementsByTagName('script'),
		length = scripts.length,
		src = scripts[length - 1].src,
		scriptPath = chrome.extension.getURL('static/js/');
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

importScript("core/core.js");
importScript("core/fe-const.js");
importScript("core/log.js");
			
importScript("fcp/fcp-fl.js");
importScript("fcp/css/fcp-css-analytic.js");
importScript("fcp/css/fcp-css.js");
importScript("fcp/html/fcp-html-analytic.js");
importScript("fcp/html/fcp-html-doctype.js");
importScript("fcp/html/fcp-html.js");
importScript("fcp/js/fcp-js.js");
importScript("fcp/fcp-tabs.js");
importScript("fcp/fcp-main.js");
			
importScript("grid/grid-main.js");
importScript("fdp/fdp-main.js");
importScript("fe-helper.js");
importScript("notification/fe-notification.js");
importScript("wpo/fe-calc-wpo.js");