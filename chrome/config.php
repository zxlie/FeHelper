<?php
return array(
	'DEBUG'                       	=>	1 ,       //是否是debug模式，debug模式下打印各个功能编译的时间
	'TPL_LEFT_DELIMITER'          	=>	'<&' ,    //smarty左界符
	'TPL_RIGHT_DELIMITER'         	=>	'&>' ,    //smarty右界符
	'TPL_SUFFIX'                  	=>	'html' ,  //模板文件后缀名
	'FILE_ENCODING'               	=>	'utf-8' , //文件编码
	'MOD_DIR_CHECK'               	=>	0 ,       //是否进行模块目录检查,
	'MOD_FILENAME_CHECK'          	=>	0 ,       //是否进行文件命名检查
	'MOD_JS_REGULAR_CHECK'        	=>	0 ,       //是否进行js规范检测
	'MOD_CSS_REGULAR_CHECK'       	=>	0 ,       //是否进行css规范检测
	'MOD_HTML_REGULAR_CHECK'      	=>	0 ,       //是否进行html规范检测
	'MOD_SMARTY_REGULAR_CHECK'    	=>	0 ,       //是否进行smarty模板规范检测
	'MOD_DOS2UNIX'                	=>	0 ,       //是否对原文件进行dos2unix格式转换
	'MOD_JS_BEAUTIFY'             	=>	0 ,       //是否进行js beautify
	'MOD_CSS_BEAUTIFY'            	=>	0 ,       //是否进行css beautify
	'CSS_BEAUTIFY_INDENT'         	=>	'space' , //缩进符号 tab/space
	'MOD_CSS_SPRITES'             	=>	0 ,       //是否进行css sprites
	'CSS_SPRITES_REGULAR'         	=>	'' ,      //a|gif|1,c|png|2，文件夹_后缀_方向, 1是垂直方向，2是水平方向
	'CSS_SPRITES_CONFIG'          	=>	array(    //css sprites的配置项
		'spritetest'	=>	array(    //css文件文件夹或文件名，*表示所有
			'image'   	=>	'png,gif,jpg' ,//指定需要合并的图片类型，可以支持这三种
			'margin'  	=>	5 ,       //配置小图之间的间距，默认是5px
		),
	),
	'MOD_JS_COMBINE'              	=>	1 ,       //JS文件是否启用合并
	'MOD_CSS_COMBINE'             	=>	1 ,       //CSS文件是否启用合并
	'MOD_HTML_COMPRESS'           	=>	1 ,       //HTML文件是否启用压缩
	'MOD_JS_COMPRESS'             	=>	1 ,       //JS文件是否启用压缩
	'JS_COMPRESS_ENGINE'          	=>	'yui' ,   //JS压缩压缩引擎，可选：yui(default)、uglifyjs
	'JS_COMPRESS_IGNORE_LIST'     	=>	array(    //不进行js压缩的文件列表
	),
	'MOD_CSS_COMPRESS'            	=>	1 ,       //CSS文件是否启用压缩
	'MOD_SHA1_FILES'              	=>	0 ,       //给所有静态文件加戳或生成新文件,0：关闭，1：加戳，2：生成新文件
	'MOD_OPTI_IMG'                	=>	0 ,       //是否优化图片
	'MOD_XSS_CHECK'               	=>	0 ,       //是否进行XSS检查
	'MOD_XSS_FIXED_MODE'          	=>	0 ,       //XSS自动修复，0：功能关闭，1：源文件修复，2：output文件修复（安静模式）
	'MOD_REPLACE_DOMAIN'          	=>	0 ,       //是否启用地址替换
	'MOD_OFFLINE_DOMAIN_CHECK'    	=>	0 ,       //是否进行线下地址检测
	'CSS_IMG_DATAURI_SIZE'        	=>	3000 ,    //图片DataUri转换后的最大尺寸限制，单位（字节）,0：关闭
	'MOD_INLINE_JS_CSS'           	=>	0 ,       //在inc文件中，将js或css内容直接引入进来
	'IS_SHOW_WARNING_INFO'        	=>	1 ,       //是否显示警告信息
	'MOD_FORBID_FUNCTION'         	=>	array(    //强制关闭的功能
	),
	'XSS_SAFE_VAR'                	=>	array(    //安全变量列表，必须是正则，不包含$
	),
	'REPLACE_DOMAIN_LIST'         	=>	array(    //线下地址替换成线上地址
	),
	'DOMAIN_MULTIPLE_LIST'        	=>	array(    //'http://img.baidu.com' => 'http://(a,b,c,d,e).img.baidu.com',
	),
);