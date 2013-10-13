/**
 * FE-Helper ContentScripts
 * @author zhaoxianlie@baidu.com
 */
var FeHelperContentScript = (function(){

	/**
	 * 初始化
	 */
	var _init = function(){
        window.onload = function(){
            document.getElementById('btnInstallExtension').style.display = 'none';
        };
	};
	
	return {
		init : _init
	};
})();	

//初始化
FeHelperContentScript.init();
