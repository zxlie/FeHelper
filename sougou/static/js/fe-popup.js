/**
 * FeHelper弹出（下拉）页面
 * @author zhaoxianlie
 */
FeHelperPopup = (function(){

    /**
     * 根据给定参数，运行对应的Helper
     */
    var _runHelper = function(config){
        sogouExplorer.tabs.getAllInWindow({},function(tabs){
            var isOpened = false;
            var tabId ;
            var theUrl = config.url;
            var reg = new RegExp('^' + theUrl + '$',"i");
            for(var i = 0,len = tabs.length;i < len;i++){
                if(reg.test(tabs[i].url)) {
                    isOpened = true;
                    tabId = tabs[i].id;
                    break;
                }
            }
            if(!isOpened) {
                sogouExplorer.tabs.create({
                    url:theUrl,
                    selected:true
                });
            } else {
                sogouExplorer.tabs.update(tabId,{selected : true});
            }
        });
    };


    /**
     * 绑定弹出菜单的点击事件
     * @private
     */
    var _bindPopMenuEvent = function(){
        jQuery('a').click(function(e){
            e.preventDefault();
            e.stopPropagation();
            _runHelper({
                url : $(this).attr('href')
            });
            window.close();
        });
    };

	/**
	 * 初始化页面，包括事件的绑定等
	 */
    var _init = function(){
        _bindPopMenuEvent();
    };
	
	return {
		init : _init
	};
})();

$(function(){
    FeHelperPopup.init();
});



