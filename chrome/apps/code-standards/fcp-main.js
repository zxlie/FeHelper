/**
 * 注册命名空间
 */

baidu.namespace.register("baidu.fcphelper");

baidu.fcphelper = (function(){
	/**
	 * 创建一个Accordion
	 * @param {Object} data
	 */
	var _creatResultItem = function(data){
		return '\
			<h3 class="rst-title">\
				<a href="#">' + data.title + '：\
					<span class="rst-count">' + data.count + '</span>\
				</a>\
			</h3>\
			<div class="rst-content">' + data.content + '</div>\
			';
	};
	
	/**
	 * 获取message.json中定义的相关问题以及建议
	 * @param {Object} perfix
	 * @param {Object} start
	 * @param {Object} end
	 */
	var _get_issue_suggestion = function(perfix,start,end){
		
		var tempArr = [];
		var tempInt = 0;
		
		tempArr.push('<table>');
		tempArr.push('<thead><tr>'+
				'<td>序号（Num）</td>'+
				'<td class="td-content-title">&nbsp;</td>'+
				'<td class="td-content-content">描述（Description）</td>' +
				'</tr></thead><tbody>');
		var addTr = function(_t_title,_t_content) {
			var _cls = tempInt % 2 == 0 ? 'tr-content-even' : '';
			tempArr.push('<tr class="' + _cls + '"><th class="td-linenum" rowspan="2">' + (++tempInt) + '</th>' +
					'<td class="td-content-title"><span class="-x-issue">问题</span></td>' + 
					'<td class="td-content-content -c-x-issue">' + _t_title + '</td></tr>');
			tempArr.push('<tr class="' + _cls + '">' +
					'<td class="td-content-title"><span class="-x-suggestion">建议</span></td>' + 
					'<td class="td-content-content">' + _t_content + '</td></tr>');
		};
		
		var key;
		for(var i = start;i <= end;i++) {
			key = ('0000' + i);
			key = perfix + '_' + key.substr(key.length - 4);
			addTr(baidu.i18n.getMessage(key),baidu.i18n.getMessage(key + '_suggestion'));
		}
		
		tempArr.push('</tbody></table>');
				
		return tempArr.join('');
	};
	
	/**
	 * 显示页面上有效的cookie
	 * @param {Object} respData
	 * @param {Object} title
	 * @param {Object} allContent
	 */
	var _js_getCookie = function(respData,title,allContent) {
		var tempArr = [];
		var tempInt = 0;
		
		tempArr.push('<div>' + baidu.i18n.getMessage('msg0042',[document.cookie.getBytes()]) + '。如下是和整个站点相关的cookie：</div><br />');
		
		tempArr.push('<table>');
		tempArr.push('<thead><tr>'+
				'<td>序号</td>'+
				'<td class="td-cookie-name">名称（name）</td>' +
				'<td class="td-cookie-value">值（value）</td>' +
				'<td class="td-cookie-domain">所在域（domain）</td>' +
				'<td class="td-cookie-expires">过期时间（expires）</td>' +
				'<td class="td-cookie-op">操作</td>' +
				'</tr></thead><tbody>');
		var d = new Date() - 1;
		jQuery.each(respData.cookies,function(i,cookie){
			tempInt++;
			tempArr.push('<tr>'+
				'<td class="td-cookie-linenum">' + (i+1) + '</td>'+
				'<td class="td-cookie-name">' + cookie.name + '</td>' +
				'<td class="td-cookie-value" id="td-cookie-value-"' + cookie.name + '>' + cookie.value + '</td>' +
				'<td class="td-cookie-domain">' + cookie.domain + '</td>' +
				'<td class="td-cookie-expires">' + ( cookie.expirationDate ? new Date(cookie.expirationDate * 1000).format('yyyy年MM月dd日 HH时mm分ss秒') : '-')  + '</td>' +
				'<td class="td-cookie-op">' +
					'<button class="fe-a-cookie-delete -f-a-c-d-' + d + ' ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only"><span class="ui-button-text">删除</span></button>' +
					'<input type="hidden" id="hid-url-' + cookie.name + '" value="' + cookie.url + '" />' +
					'<input type="hidden" id="hid-domain-' + cookie.name + '" value="' + cookie.domain + '" />' +
					'<input type="hidden" id="hid-storeId-' + cookie.name + '" value="' + cookie.storeId + '" />' +
					'<input type="hidden" id="hid-expires-' + cookie.name + '" value="' + (cookie.expirationDate ? cookie.expirationDate : '') + '" />' +
				'</td>' +
				'</tr>');
		});
		tempArr.push('</tbody></table>');
        
		allContent.push(_creatResultItem({
			title : title,
			count : tempInt,
			content : tempArr.join('')
		}));
		
		//-------------------------------------------
		jQuery('#fe-helper-box .-f-a-c-d-' + d).on('click',function(e){
			var $this = jQuery(this);
			
			var $tr = $this.parent().parent();
			var key = $tr.children('.td-cookie-name').html().trim();
			var storeId = jQuery('#hid-storeId-' + key).val().trim();
			
			//remove cookie
			chrome.runtime.sendMessage({
					"type" : MSG_TYPE.REMOVE_COOKIE,
					"name" : key,
					"url" : jQuery('#hid-url-' + key).val().trim(),
					"storeId" : storeId
				},function(cookie){
					var $table = $this.parent().parent().parent();
					var idx = $table.index($tr) - 1;
					var x = 0;
					$tr.remove();
					//更改序号
					$table.find('td.td-cookie-linenum').each(function(i,td){
						jQuery(td).html((i + 1));
						x++;
					});
					//总数
					$table.parent().parent().prev().find('.rst-count').html(x);
				});
		});
	};
	
	/**
	 * 显示页面上的script标签
	 * @param {Object} respData
	 * @param {Object} title
	 * @param {Object} allContent
	 */
	var _js_getScriptTag = function(respData,title,allContent) {
		
		var tempArr = [];
		var tempInt = 0;
		
		tempArr.push('<table>');
		tempArr.push('<thead><tr>'+
				'<td>序号（Num）</td>'+
				'<td class="td-content">描述（Description）</td>' +
				'</tr></thead><tbody>');
		var addTr = function(_content){
			tempArr.push('<tr>'+
				'<th class="td-linenum">' + ++tempInt + '</th>'+
				'<td class="td-content">' + _content + '</td></tr>');
			
		};
		//script block
		if(respData.scriptTag.scriptBlock) {
			addTr(baidu.i18n.getMessage('msg0033',[respData.scriptTag.scriptBlock]));
		}
		
		//script src
		if(respData.scriptTag.scriptSrc) {
			addTr(baidu.i18n.getMessage('msg0034',[respData.scriptTag.scriptSrc]));
		}
		
		//JS文件被压缩？
		if(respData.jsMinified.count > 0) {
			var t = [];
			jQuery.each(respData.jsMinified.files,function(k,item){
				if(item.href == '#') {
					t.push(baidu.i18n.getMessage('msg0047',[item.fileName]));
				} else {
					t.push(baidu.i18n.getMessage('msg0062',[item.href,item.fileName]));
				}
			});
			addTr(baidu.i18n.getMessage('msg0045',[t.join('、')]));
		}

		//tangram
		if(respData.tangram.length > 0) {
			var t = [];
			jQuery.each(respData.tangram,function(i,item){
				t.push(item);
			});
			if(t.length == 1) {
				addTr(baidu.i18n.getMessage('msg0054',[t.join('')]));
			} else {
				addTr(baidu.i18n.getMessage('msg0055',[t.join('、')]));
			}
		}
		
		//重复引入的文件
		if(respData.duplicatedFiles.length) {
			var dupFile = [];
			var dupHref = [];
			var txt = [];
			jQuery.each(respData.duplicatedFiles,function(i,item){
				if(item.dupFiles) {	//不同地址的文件，但内容重复
					var t = [];
					jQuery.each(item.dupFiles,function(j,f){
						t.push(baidu.i18n.getMessage('msg0069',[f,f]));
					});
					dupFile.push(baidu.i18n.getMessage('msg0070',[t.join('、')]));
				} else {	//同一个地址的文件，被多次引入
					dupHref.push(baidu.i18n.getMessage('msg0068',[item.href,item.href,item.count]));
				}
			});
			if(dupHref.length) {
				txt.push(baidu.i18n.getMessage('msg0066',['<div style="margin-left:30px;">' + dupHref.join('') + '</div>']));
			}
			if(dupFile.length) {
				txt.push(baidu.i18n.getMessage('msg0067',['<div style="margin-left:30px;">' + dupFile.join('') + '</div>']));
			}
			addTr(txt.join(''));
		}

		tempArr.push('</tbody></table>');
		allContent.push(_creatResultItem({
			title : title,
			count : tempInt,
			content : tempArr.join('')
		}));
	};
	
	/**
	 * 显示过期标签的检测结果
	 * @param {Object} respData
	 * @param {Object} title
	 * @param {Object} allContent
	 */
	var _html_getHTMLDeprecatedTag = function(respData,title,allContent) {
		var isEmpty = true;
		for(var k in respData.HTMLBase.HTMLDeprecatedTag) {
			isEmpty = false;
			break;
		}
		if(isEmpty) {
			return;
		}
		
		var tempArr = [];
		var tempInt = 0;
		
		tempArr.push('<table>');
		tempArr.push('<thead><tr>'+
				'<td>标签（Tag）</td>'+
				'<td class="td-content">描述（Description）</td>' +
				'</tr></thead><tbody>');
		jQuery.each(respData.HTMLBase.HTMLDeprecatedTag,function(key,item){
			tempInt++;
			tempArr.push('<tr>'+
				'<th class="td-linenum">' + key + '</th>'+
				'<td class="td-content">' + 
					baidu.i18n.getMessage('msg0004',[item]) +
					baidu.i18n.getMessage('msg0005') + '</td></tr>');
		});
		tempArr.push('</tbody></table>');
		allContent.push(_creatResultItem({
			title : title,
			count : tempInt,
			content : tempArr.join('')
		}));
	};
	
	/**
	 * 显示过期的属性
	 * @param {Object} HTMLDeprecatedAttributes
	 * @param {Object} title
	 * @param {Object} allContent
	 */
	var _html_getHTMLDeprecatedAttribute = function(respData,title,allContent){
		var isEmpty = true;
		for(var k in respData.HTMLBase.HTMLDeprecatedAttribute) {
			isEmpty = false;
			break;
		}
		if(isEmpty) {
			return;
		}
		
		var tempArr = [];
		var tempInt = 0; 
		
		tempArr.push('<table>');
		tempArr.push('<thead><tr>'+
				'<td>属性（Attr）</td>'+
				'<td class="td-content">描述（Description）</td>' +
				'</tr></thead><tbody>');
		jQuery.each(respData.HTMLBase.HTMLDeprecatedAttribute,function(key,item){
			tempInt++;
			tempArr.push('<tr>' +
				'<th class="td-linenum">' + key + '</th>' +
				'<td class="td-content"><span class="x-detail">' +
				(function(){
					var arr = [];
					jQuery.each(item,function(k,v){
						arr.push(baidu.i18n.getMessage('msg0007',[ v,k ]));
					});
					return arr.join('');
				})() + baidu.i18n.getMessage('msg0005') + '</span></td></tr>');
		});
		tempArr.push('</tbody></table>');
		allContent.push(_creatResultItem({
			title : title,
			count : tempInt,
			content : tempArr.join('')
		}));
	};
	
	/**
	 * 获取Link标签的解析结果
	 * @param {Object} respData
	 * @param {Object} title
	 * @param {Object} allContent
	 */
	var _html_getLink = function(respData,title,allContent){
		var notInHead = respData.LINK.notInHead;
		
		if(notInHead.length == 0) return;
		
		var ct = '';
		ct = '<div>' + baidu.i18n.getMessage('msg0021',[notInHead.length,
				'head']) + '</div>';
		ct += (function(d){
			var arr = ['<table>'];
			arr.push('<thead><tr>'+
					'<td>序号（Num）</td>'+
					'<td class="td-content">描述（Description）</td>' +
					'</tr></thead><tbody>');
			if(notInHead.length) {
				jQuery.each(d,function(i,link){
					arr.push('<tr>\
						<th class="td-linenum">' + (i + 1) + '</th>\
						<td class="td-content">' + link.outerHTML.replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</td>\
					</tr>');
				});
			}
			arr.push('</tbody></table>');
			return arr.join('');
		})(notInHead);
		allContent.push(_creatResultItem({
			title : title,
			count : notInHead.length,
			content : ct
		}));
	};
		
	/**
	 * 获取标签包含关系
	 * @param {Object} respData
	 * @param {Object} title
	 * @param {Object} allContent
	 */
	var _html_getTagIncludeCase = function(respData,title,allContent){
		
		if(respData.tagInclude.length == 0) return;
		
		var ct = '';
		ct += (function(d){
			var arr = ['<table>'];
			arr.push('<thead><tr>'+
					'<td>序号（Num）</td>'+
					'<td class="td-content">描述（Description）</td>' +
					'</tr></thead><tbody>');
			if(respData.tagInclude.length > 0) {
				jQuery.each(d,function(id,v){
					arr.push('<tr>\
						<th class="td-linenum">' + (id + 1) + '</th>\
						<td class="td-content">' + baidu.i18n.getMessage('msg0035',[v.inline,v.block]) + '</td>\
					</tr>');
				});
			}
			arr.push('</tbody></table>');
			return arr.join('');
		})(respData.tagInclude);
		allContent.push(_creatResultItem({
			title : title,
			count : respData.tagInclude.length,
			content : ct
		}));
	};
	
	/**
	 * DocumentMode
	 * @param {Object} respData
	 */
	var _html_getDocMode = function(respData){
		var tempArr = [];
	    var quirksMode = '<strong>混杂模式</strong>';
	    var standardsMode = '<em>标准模式</em>';
	    var mode = (respData.documentMode.WebKit == 'S') ? standardsMode : quirksMode;
	
	    if (respData.documentMode.hasDocType) {
			tempArr.push(baidu.i18n.getMessage('msg0009'));
	        if (respData.documentMode.isUnusualDocType) {
	            tempArr.push(baidu.i18n.getMessage('msg0010',[mode,quirksMode]));
	        }
	        if (respData.documentMode.hasConditionalCommentBeforeDTD || 
					respData.documentMode.hasCommentBeforeDTD) {
	            tempArr.push(baidu.i18n.getMessage('msg0011',[mode,quirksMode]));
	        }
	        
	        if (respData.documentMode.IE == respData.documentMode.WebKit) {
	            tempArr.push(baidu.i18n.getMessage('msg0012',[mode]));
	            if (respData.documentMode.WebKit == 'Q') {
	            	tempArr.push(baidu.i18n.getMessage('msg0013'));
	            }
	        } else {
	            if (!respData.documentMode.isUnusualDocType) {
	                if (respData.documentMode.IE) {
						var $1 = (respData.documentMode.IE == 'Q') ? quirksMode : standardsMode;
						var $2 = (respData.documentMode.WebKit == 'Q') ? quirksMode : standardsMode;
	            		tempArr.push(baidu.i18n.getMessage('msg0014',[$1,$2]));
	            		tempArr.push(baidu.i18n.getMessage('msg0013'));
	                } else {
	                    tempArr.push(baidu.i18n.getMessage('msg0015'));
	                }
	            } else {
	            	tempArr.push(baidu.i18n.getMessage('msg0013'));
	            }
	        }
	    } else {
	        // 没有设置DTD
	        tempArr.push(baidu.i18n.getMessage('msg0016',[mode]));
	        tempArr.push(baidu.i18n.getMessage('msg0013'));
	    }
		
		return tempArr.join('');
	};
	
	/**
	 * 获取DOM解析的结果
	 * @param {Object} respData
	 * @param {Object} title
	 * @param {Object} allContent
	 */
	var _html_getDom = function(respData,title,allContent) {
		var tempArr = [];
		var tempInt = 0;
		
		tempArr.push('<table>');
		tempArr.push('<thead><tr>'+
				'<td>序号（Num）</td>'+
				'<td class="td-content">描述（Description）</td>' +
				'</tr></thead><tbody>');
		var addTr = function(text) {
			tempArr.push('<tr><th class="td-linenum">' + (++tempInt) + '</th>' +
					'<td class="td-content">' + text + '</td></tr>');
		};
		
		//doctype
		addTr(_html_getDocMode(respData));
		
		//总数量
		addTr(baidu.i18n.getMessage('msg0028',[respData.DOM.count]));
		
		//dom节点的最大嵌套深度
		addTr(baidu.i18n.getMessage('msg0063',[respData.DOM.maxDepth.depth,respData.DOM.maxDepth.xpath]));
		
		//title标签检测
		if(respData.title.length == 0) {
			addTr(baidu.i18n.getMessage('msg0049') + baidu.i18n.getMessage('msg0052'));
		} else if(respData.title.length > 1) {
			addTr(baidu.i18n.getMessage('msg0051') + baidu.i18n.getMessage('msg0052'));
		} else if(!respData.title[0].isInHead){
			addTr(baidu.i18n.getMessage('msg0050') + baidu.i18n.getMessage('msg0052'));
		}
		
		//img标签的src=''
		if(respData.imgTag.length > 0) {
			var t = '';
			jQuery.each(respData.imgTag,function(i,k){
				t = '';
				t += k.id ? '#' + k.id : '';
				t += t.className ? '.' + t.className.replace(/\s+/g,'.') : '';
				t = t ? t : k.outerHTML.replace(/</g,'&lt;').replace(/>/g,'&gt;');
				addTr(baidu.i18n.getMessage('msg0053',[t]));
			});
		}
		
		//所有注释数量
		if(respData.DOM.allComm.length) {
			//IE条件注释
		    if (respData.DOM.IECondComm.length) {
				addTr(baidu.i18n.getMessage('msg0018',[respData.DOM.IECondComm.length]));
			}
			//Firefox中不支持的注释：不能出现‘--’
		    if (respData.DOM.FFNotSptComm.length) {
				addTr(baidu.i18n.getMessage('msg0060',[respData.DOM.FFNotSptComm.length]));
			}
			
			//所有注释
			addTr(baidu.i18n.getMessage('msg0030',[respData.DOM.allComm.length,respData.DOM.allComm.join('').getBytes()]) + baidu.i18n.getMessage('msg0019'));
		}
		
		//重复性的ID
		if(respData.ID.count) {
			var id_arr = [];
			jQuery.each(respData.ID.ids,function(id,v){
				id_arr.push(baidu.i18n.getMessage('msg0064',[id,v]));
			});
			addTr(baidu.i18n.getMessage('msg0026',[respData.ID.count,id_arr.join('，')]));
		}
		
		//问题Input
		if(respData.DOM.invalidInput.count) {
			addTr(baidu.i18n.getMessage('msg0029',[respData.DOM.invalidInput.count]));
		}
		
		//HTML是否压缩
		if(!respData.htmlMinified) {
			addTr(baidu.i18n.getMessage('msg0043'));
		}
		
		//未闭合的标签
		if(respData.unClosedTags.length > 0) {
			var t = [];
			jQuery.each(respData.unClosedTags,function(k,item){
				t.push(baidu.i18n.getMessage('msg0046',[item]));
			});
			addTr(baidu.i18n.getMessage('msg0038',[t.join('、')]));
		}
		
		tempArr.push('</tbody></table>');
		
		allContent.push(_creatResultItem({
			title : title,
			count : tempInt,
			content : tempArr.join('')
		}));
	};
	
	/**
	 * 检测CSS的使用情况
	 * @param {Object} respData
	 * @param {Object} title
	 * @param {Object} allContent
	 */
	var _css_getCssUsage = function(respData){
		
		var _cssTitles = [
			baidu.i18n.getMessage('msg0039'),
			baidu.i18n.getMessage('msg0040'),
			baidu.i18n.getMessage('msg0041')
		];
		
		var _getCssTable = function(d){
			var arr = ['<table>'];
			arr.push('<thead><tr>'+
					'<td>序号（Num）</td>'+
					'<td class="td-content">选择器（CSS Selector）</td>' +
					'</tr></thead><tbody>');
			jQuery.each(d,function(i,item){
				arr.push('<tr>' +
					'<th class="td-linenum">' + (i + 1) + '</th>' +
					'<td class="td-content">' +
						'<span class="x-selector">' + item.selector + '</span>' +
						'<span class="x-css-text">' + item.cssText + '</span>' +
					'</td>' +
				'</tr>');
			});
			arr.push('</tbody></table>');
			return arr.join('');
		};
		
		//style标签内的css检测、link引入的css检测
		jQuery.each(respData.styles,function(i,style){
			var allContent = [];
			jQuery.each(style.content,function(j,v){
				allContent.push(_creatResultItem({
					title : _cssTitles[j],
					count : v.count,
					content : _getCssTable(v.content)
				}));
			});
			//创建tab
			baidu.fcptabs.addCssTab( style.path, allContent.join('') );
		});
	};
	
	/**
	 * 汇总css文件中用到的所有背景图片
	 * @param {Object} respData
	 */
	var _css_getBackgroundImages = function(respData,allContent){
		var tempArr = [];
		var lineNum = 0;
		var tempInt = 0;
		tempArr.push('<table>');
		tempArr.push('<thead><tr>'+
				'<td>序号（Num）</td>'+
				'<td class="td-content">描述（Description）</td>' +
				'</tr></thead><tbody>');
		var addTr = function(text) {
			tempArr.push('<tr><th class="td-linenum">' + (++lineNum) + '</th>' +
					'<td class="td-content">' + text + '</td></tr>');
		};
		//CSS背景图片的使用情况
		if(respData.backgroundImages.length) {
			var a = [];
			var d = new Date() - 1;
			jQuery.each(respData.backgroundImages,function(i,item){
				a = ['<div class="table-css-bg -t-c-b-' + d + '" style="display:none;">'];
				jQuery.each(item.bgImages,function(j,b){
					a.push('<div>' + b + '</div>');
				});
				a.push('</div>');
				addTr(baidu.i18n.getMessage('msg0057',[item.fileName,item.bgImages.length,d]) + a.join(''));
				tempInt += item.bgImages.length;
			});
		
			jQuery('#fe-helper-box .-x-expand-' + d).on('click',function(){
				var _this = jQuery(this);
				var _table = _this.parent().next();
				
				if(_table.css('display') == 'none') {
					_table.slideDown(300);
					_this.html('收起');
				} else {
					_table.slideUp(300);
					_this.html('展开');
				}
			});

			jQuery('#fe-helper-box .-t-c-b-' + d + ' div').on('mouseover',function(e){
				var imgTooltip = jQuery('#fe-img-tootip');
				if(!imgTooltip[0]) {
					imgTooltip = jQuery('<img id="fe-img-tootip" src="' + jQuery(this).html().trim() + '" alt="load image failed" />').appendTo('body');
				} else {
					imgTooltip.attr('src',jQuery(this).html().trim());
				}
				imgTooltip.css({
					top : e.pageY + 20,
					left : e.pageX + 20,
					'max-width' : 500,
					'max-height' : 500
				}).show();
			}).on('mouseout',function(e){
				var imgTooltip = jQuery('#fe-img-tootip');
				imgTooltip.hide();
			})
		}
		
		tempArr.push('</tbody></table>');
		
		allContent.push(_creatResultItem({
			title : baidu.i18n.getMessage('msg0065'),
			count : tempInt,
			content : tempArr.join('')
		}));
	};
	
	
	/**
	 * css检测结果汇总
	 * @param {Object} respData
	 */
	var _css_totalDetectResult = function(respData){
		var tempArr = [];
		var tempInt = 0;
		var allContent = [];
		tempArr.push('<table>');
		tempArr.push('<thead><tr>'+
				'<td>序号（Num）</td>'+
				'<td class="td-content">描述（Description）</td>' +
				'</tr></thead><tbody>');
		var addTr = function(text) {
			tempArr.push('<tr><th class="td-linenum">' + (++tempInt) + '</th>' +
					'<td class="td-content">' + text + '</td></tr>');
		};
		
		//重复引入的文件
		if(respData.duplicatedFiles.length) {
			var dupFile = [];
			var dupHref = [];
			var txt = [];
			jQuery.each(respData.duplicatedFiles,function(i,item){
				if(item.dupFiles) {	//不同地址的文件，但内容重复
					var t = [];
					jQuery.each(item.dupFiles,function(j,f){
						t.push(baidu.i18n.getMessage('msg0069',[f,f]));
					});
					dupFile.push(baidu.i18n.getMessage('msg0070',[t.join('、')]));
				} else {	//同一个地址的文件，被多次引入
					dupHref.push(baidu.i18n.getMessage('msg0068',[item.href,item.href,item.count]));
				}
			});
			if(dupHref.length) {
				txt.push(baidu.i18n.getMessage('msg0066',['<div style="margin-left:30px;">' + dupHref.join('') + '</div>']));
			}
			if(dupFile.length) {
				txt.push(baidu.i18n.getMessage('msg0067',['<div style="margin-left:30px;">' + dupFile.join('') + '</div>']));
			}
			addTr(txt.join(''));
		}
		
		//CSS文件压缩
		if(respData.cssMinified.count > 0) {
			var t = [];
			jQuery.each(respData.cssMinified.files,function(k,item){
				if(item.href == '#') {
					t.push(baidu.i18n.getMessage('msg0047',[item.fileName]));
				} else {
					t.push(baidu.i18n.getMessage('msg0062',[item.href,item.fileName]));
				}
			});
			addTr(baidu.i18n.getMessage('msg0044',[t.join('、')]));
		}
		
		//css expression
		if(respData.expressions.length) {
			var a = [],t = 0;
			jQuery.each(respData.expressions,function(i,item){
				a.push(baidu.i18n.getMessage('msg0059',[item.fileName,item.count]));
				t += item.count;
			});
			addTr(baidu.i18n.getMessage('msg0058',[t,a.join('、')]));
		}
		
		tempArr.push('</tbody></table>');
		
		allContent.push(_creatResultItem({
			title : baidu.i18n.getMessage('msg0048'),
			count : tempInt,
			content : tempArr.join('')
		}));
		
		//背景图片
		_css_getBackgroundImages(respData,allContent);
		
		//创建tab
		baidu.fcptabs.addCssTab( baidu.i18n.getMessage('msg0048'), allContent.join('') );
	};

	
	/**
	 * HTML侦测，通过调用baidu.html.detect方法进行
	 */
	var _detectHTML = function(){
		baidu.html.detect(function(respData){
			var content = [];
			
			//html.HTMLDeprecatedTag
			_html_getHTMLDeprecatedTag(respData,baidu.i18n.getMessage('msg0006'),content);
	
			//html.HTMLDeprecatedAttribute
			_html_getHTMLDeprecatedAttribute(respData,baidu.i18n.getMessage('msg0008'),content);
	
			//LINK
			_html_getLink(respData,baidu.i18n.getMessage('msg0022'),content);
	        
			//获取标签包含关系
			_html_getTagIncludeCase(respData,baidu.i18n.getMessage('msg0036'),content);
			
	        //其他DOM相关处理
			_html_getDom(respData,baidu.i18n.getMessage('msg0020'),content);
			
			//创建tab 
			baidu.fcptabs.addHtmlTab(content.join(''));
		});
	};
	
	/**
	 * CSS侦测，通过调用baidu.css.detect方法进行
	 */
	var _detectCSS = function(){
		baidu.css.detect(function(respData){
			
			//执行检测并查创建tab
			_css_getCssUsage(respData);
			
			//所有检测结果
			_css_totalDetectResult(respData);
			
		});
	};
	
	
	/**
	 * Javascript侦测，通过调用baidu.js.detect方法进行
	 */
	var _detectJavascript = function(){
		baidu.js.detect(function(respData){
			var allContent = [];
			
			//cookies
			_js_getCookie(respData,baidu.i18n.getMessage('msg0031'),allContent);
			
			//script相关检测
			_js_getScriptTag(respData,baidu.i18n.getMessage('msg0032'),allContent);
			
			//创建tab
			baidu.fcptabs.addJavascriptTab(allContent.join(''));
		});
	};
	
	/**
	 * 增加HTML、CSS、Javascript的问题及建议tab
	 */
	var _addIssueSuggestionTab = function(){
		
		var _getBtnString = function(_text){
			return '<a class="-f-h-get-more-" href="#" onclick="return false;">' + _text + '&gt;&gt;</a>';
		};
		
		//HTML问题及建议
		jQuery(_getBtnString('查看更多HTML帮助')).appendTo('#fe-helper-tab-html').click(function(e){

			if(!jQuery('#fe-helper-tab-HTML-issue-sug')[0]){
				baidu.fcptabs.addIssueSuggestionTab('HTML',_get_issue_suggestion('html',1,42));
			} 
			
			var $allTabs = jQuery( "#fe-helper-main-tab>div");
			var index = $allTabs.index( jQuery( '#fe-helper-tab-HTML-issue-sug' ) );
			jQuery('#fe-helper-main-tab').tabs( "select" , index );
		});
		
		//CSS问题及建议
		jQuery(_getBtnString('查看更多CSS帮助')).appendTo('#fe-helper-tab-css').click(function(e){

			if(!jQuery('#fe-helper-tab-CSS-issue-sug')[0]){
				baidu.fcptabs.addIssueSuggestionTab('CSS',_get_issue_suggestion('css',1,119));
			} 

			var $allTabs = jQuery( "#fe-helper-main-tab>div");
			var index = $allTabs.index( jQuery( '#fe-helper-tab-CSS-issue-sug' ) );
			jQuery('#fe-helper-main-tab').tabs( "select" , index );
		});
		
		//Javascript问题及建议
		jQuery(_getBtnString('查看更多Javascript帮助')).appendTo('#fe-helper-tab-js').click(function(e){

			if(!jQuery('#fe-helper-tab-Javascript-issue-sug')[0]){
				baidu.fcptabs.addIssueSuggestionTab('Javascript',_get_issue_suggestion('javascript',1,114));
			}

			var $allTabs = jQuery( "#fe-helper-main-tab>div");
			var index = $allTabs.index( jQuery( '#fe-helper-tab-Javascript-issue-sug' ) );
			jQuery('#fe-helper-main-tab').tabs( "select" , index );
		});
	};
	
	
	/**
	 * 初始化静态文件
	 */
	var _initStaticFile = function(){
		//////////先做一些准备工作/////////////////////
		//css初始化
		baidu.css.init();
		//js初始化
		baidu.js.init();
	};

	/**
	 * 初始化页面
	 * @return {[type]}
	 */
	var _initHtml = function(callback){
		//html初始化
		baidu.html.init(callback);
	};
	
	/**
	 * 执行FCPHelper检测
	 */
	var _detect = function(){
		//显示进度条
		baidu.fcptabs.createProgressBar();
		
		window.setTimeout(function(){
			//HTML侦测
			_detectHTML();
			
			//CSS侦测
			_detectCSS();
			
			//Javascript侦测
			_detectJavascript();
			
			//增加问题及建议Tab
			_addIssueSuggestionTab();
			
			//检测完毕更新进度条
			baidu.fcptabs.updateProgressBar(100);
		},100);
	};
	
	return {
		initStaticFile : _initStaticFile,
		initHtml : _initHtml,
		detect : _detect
	};
	
})();

