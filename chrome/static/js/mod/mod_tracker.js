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

importScript("js/tracker/tracker.js");
importScript("js/tracker/util.js");
importScript("js/tracker/path.js");
importScript("js/tracker/promise.js");
importScript("js/tracker/event.js");
importScript("js/tracker/status-pool.js");
importScript("js/tracker/plugin.js");
importScript("js/tracker/code.js");
importScript("js/tracker/combocodegen.js");
importScript("js/tracker/decorate.js");
importScript("js/tracker/token.js");
importScript("js/tracker/view.js");
importScript("js/tracker/general.js");
importScript("js/tracker/watch.js");
importScript("js/tracker/main.js");