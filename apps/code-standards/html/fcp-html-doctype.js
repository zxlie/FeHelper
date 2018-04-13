/**
 * 注册命名空间
 */
baidu.namespace.register("baidu.doctype");

/**
 * 计算documentMode
 * @author zhaoxianlie 
 */
baidu.doctype = (function(){
	var documentMode = {
	    //在未定义DTD的时候，浏览器默认将以混杂模式进行渲染
	    IE: 'Q',
	    WebKit: 'Q',
	    // 在DTD前是否存在注释（在我们的所有模板前面，都有一段注释：STATUS OK）
	    hasCommentBeforeDTD: false,
	    // 在DTD钱是否存在IE条件注释
	    hasConditionalCommentBeforeDTD: false,
	    // 是否为一个奇怪的DTD
	    isUnusualDocType: false,
	    // 是否有DTD
	    hasDocType: false
	};

	/**
	 * <!DOCTYPE "xmlns:xsl='http://www.w3.org/1999/XSL/Transform'">
	 * 这个DTD将使页面在IE下以标准模式渲染，在Webkit下以混杂模式渲染
	 * 比如这个站点: http://www.nasa.gov/
	 * @param {string} name 值为：document.doctype.name.toLowerCase()
	 * @param {string} publicId 值为：document.doctype.publicId
	 * @param {string} systemId 值为：document.doctype.systemId
	 */
	function fixDocTypeOfNASA(name, publicId, systemId){
	    if (name.toLowerCase() == "\"xmlns:xsl='http://www.w3.org/1999/xsl/transform'\"" &&
	    publicId == '' &&
	    systemId == '') {
	        documentMode.IE = 'S';
	        documentMode.WebKit = 'Q';
	        documentMode.isUnusualDocType = false;
	    }
	}
	
	/**
	 * 判断一个Comment是否为IE的条件注释
	 * @param {string} Comment内容
	 */
	function isConditionalComment(nodeValue){
	    return baidu.FlConst.CONDITIONAL_COMMENT_REGEXP.test(nodeValue);
	}
	
	/**
	 * 判断一个Comment内容是否为非IE的注释
	 * @param {string} Comment内容
	 */
	function isNotIEHiddenConditionalComment(nodeValue){
	    return baidu.FlConst.NOT_IE_HIDDEN_CONDITIONAL_COMMENT_REGEXP.test(nodeValue);
	}
	
	/**
	 * 判断一个Comment是否为注释的结束部分
	 * @param {string} Comment内容
	 */
	function isRevealedClosingConditionalComment(nodeValue){
	    return baidu.FlConst.REVEALED_CLOSING_CONDITIONAL_COMMENT_REGEXP.test(nodeValue);
	}
	
	/**
	 * 判断一个Comment是否为非IE注释的开始
	 * @param {string} Comment内容
	 */
	function isNotIERevealedOpeningConditionalComment(nodeValue){
	    return baidu.FlConst.NOT_IE_REVEALED_OPENING_CONDITIONAL_COMMENT_REGEXP.test(nodeValue);
	}
	
	/**
	 * 试图在某个Comment前面找到一个非IE注释的开始
	 */
	function getPreviousRevealedOpeningConditionalComment(node){
	    var prev = node.previousSibling;
	    for (; prev; prev = prev.previousSibling) {
	        if (isNotIERevealedOpeningConditionalComment(prev.nodeValue)) {
	            return prev;
	        }
	    }
	    return null;
	}
	
	/**
	 * 检测文档头DTD前面是否有注释
	 */
	function checkForCommentBeforeDTD(){
	    var result = {
	        hasCommentBeforeDTD: false,
	        hasConditionalCommentBeforeDTD: false
	    };
	    var doctype = document.doctype;
	    if (!doctype) {
	        return result;
		}
	    
		//从<html>向上搜索，进行检测
	    var prev = doctype.previousSibling;
	    for (; prev; prev = prev.previousSibling) {
	        if (prev.nodeType == Node.COMMENT_NODE) {
	            var nodeValue = prev.nodeValue;
	            //向上搜索的过程中，如果碰到某个Comment是注释的结束部分，再继续搜索其上是否存在注释的开始部分
	            if (isRevealedClosingConditionalComment(nodeValue)) {
	                prev = getPreviousRevealedOpeningConditionalComment(prev);
	                // 向上发现了注释的开始部分，则说明DTD前存在条件注释
	                if (prev) {
	                    result.hasConditionalCommentBeforeDTD = true;
	                    return result;
	                }
	                continue;
	            }
	            // 判断某个Comment是否为一个条件注释
	            var isConditionalComm = isConditionalComment(nodeValue);
	            if (!isConditionalComm) {
	                result.hasCommentBeforeDTD = true;
	                continue;
	            }
	            // 存在非IE的条件注释：如<!--[if !IE]> some text <![endif]-->
	            if (isNotIEHiddenConditionalComment(nodeValue)) {
	                result.hasConditionalCommentBeforeDTD = true;
	            }
	        }
	    }
	    return result;
	}
	
	/**
	 * 开始进行文档类型的侦测
	 */
	function processDoctypeDetectionResult(){
		//获取doctype
	    var doctype = document.doctype;
		
	    var compatMode = document.compatMode.toLowerCase();
	    documentMode.hasDocType = (doctype) ? true : false;
	    
		// 如果页面是以混杂模式渲染的，则compatMode为BackCompat
	    documentMode.WebKit = (compatMode == 'backcompat') ? 'Q' : 'S';
	    documentMode.IE = documentMode.WebKit;
		
	    // 如果文档压根儿就没有写doctype，则不需要继续侦测了
	    if (!doctype) {
	        return;
	    }

		//下面三个是doctype中最重要的组成部分
	    var name = doctype ? doctype.name.toLowerCase() : '';
	    var publicId = doctype ? doctype.publicId : '';
	    var systemId = doctype ? doctype.systemId : '';

	    // 非正常工作模式
	    if (name != 'html') {
	        documentMode.IE = undefined;
	        documentMode.isUnusualDocType = true;
	    } else {
			//在白名单中进一步检测publicId和systemId
	        if (publicId in baidu.FlConst.PUBLIC_ID_WHITE_LIST) {
	            if (!(systemId in baidu.FlConst.PUBLIC_ID_WHITE_LIST[publicId].systemIds)) {
	                documentMode.IE = undefined;
	                documentMode.isUnusualDocType = true;
	            }
	        } else {
	            documentMode.IE = undefined;
	            documentMode.isUnusualDocType = true;
	        }
	    }
	    
		// 对documentMode进行修正判断
	    if ((publicId in baidu.FlConst.COMPAT_MODE_DIFF_PUBLIC_ID_MAP) &&
	    (systemId in baidu.FlConst.COMPAT_MODE_DIFF_PUBLIC_ID_MAP[publicId].systemIds)) {
	        documentMode.IE = baidu.FlConst.COMPAT_MODE_DIFF_PUBLIC_ID_MAP[publicId].systemIds[systemId].IE;
	        documentMode.isUnusualDocType = false;
	    }
	    
	    // 进一步修正
	    fixDocTypeOfNASA(name, publicId, systemId);
		
	    // 判断文档头前面是否存在注释
	    if (documentMode.IE != 'Q') {
	        var result = checkForCommentBeforeDTD();
	        if (result.hasConditionalCommentBeforeDTD) {
	            documentMode.IE = undefined;
	            documentMode.hasConditionalCommentBeforeDTD = true;
	        }
	        else 
	            if (result.hasCommentBeforeDTD) {
	                // IE6					DTD 前的任何非空白符都将使浏览器忽略 DTD，包括注释和 XML 声明。
					//IE7 IE8				DTD 前的任何非空白符都将使浏览器忽略 DTD，包括注释，但不包括 XML 声明。
					//Firefox				DTD 前的任何包含“<”的字符都将使浏览器忽略 DTD，但不包括 XML 声明。
					//Chrome Safari Opera	DTD 前的任何非空白符都将使浏览器忽略 DTD，但不包括 XML 声明。
	                documentMode.IE = 'Q';
	                documentMode.hasCommentBeforeDTD = true;
	            }
	    }
	}
	
	/**
	 * 对外公开调用接口
	 */
	return {
		getDocMode : function(){
			//检测documentMode
			processDoctypeDetectionResult();
			return documentMode;
		}
	} 
})();
