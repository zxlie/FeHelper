(function ( /*importstart*/ ) {
	var scripts = document.getElementsByTagName('script'),
		length = scripts.length,
		src = scripts[length - 1].src,
		pos = src.indexOf('/js/'),
		scriptPath = src.substr(0, pos) + '/js/';
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
importScript("core/log.js");
importScript("core/fe-const.js");
importScript("endecode/endecode-lib.js");
importScript("endecode/md5.js");
importScript("endecode/endecode.js");
importScript("google_analytics.js");
