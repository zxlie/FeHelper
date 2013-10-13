/**
 * QR码生成器
 */
baidu.qrcode = (function(){

	"use strict";

	var _bindEvents = function(){
        var current_tab_id = 'tabs-1';
        $(function() {

            $("#tabs").tabs();
            $("#tabs").bind( "tabsselect", function(event, ui) {
                current_tab_id = ui.panel.id;
            });
            $("#tabs").tabs( "select" , 0 );
            $("#confirm_button").button();
            $("#confirm_button").click(function(){
                $("#preview > img").attr("src","");
                var current_tab = $("#tabs").tabs('option', 'selected');
                var qrOpt = {};
                switch(current_tab){
                    case 0 :
                        qrOpt.chl = "URL:" + $.trim($("#tabs-0 #tab0_url").attr("value"));
                        break;

                    case 1 :
                        qrOpt.chl = $.trim($("#tabs-1 #tab1_text").attr("value"));
                        break;

                    case 2 :
                        qrOpt.chl = "tel:"+$.trim($("#tabs-2 #tab2_telno").attr("value"));
                        break;

                    case 3 :
                        qrOpt.chl = $("#tabs-3 [name=tab3_type]:checked").attr("value")+":"+$.trim($("#tabs-3 #tab3_telno").attr("value"))+":"+$.trim($("#tabs-3 #tab3_message").attr("value"));
                        break;

                    case 4 :
                        qrOpt.chl = "mailto:"+$.trim($("#tabs-4 #tab4_email").attr("value"));
                        break;

                    case 5 :
                        qrOpt.chl = "BEGIN:VCARD\nVERSION:3.0\n";
                        var v = $.trim($("#tabs-5 #tab5_FormattedName").attr("value"));
                        qrOpt.chl += v ? ("FN:"+v+"\n") : "";

                        v = $.trim($("#tabs-5 #tab5_Telephone").attr("value"));
                        qrOpt.chl += v ? ("TEL:"+v+"\n") : "";

                        v = $.trim($("#tabs-5 #tab5_Email").attr("value"));
                        qrOpt.chl += v ? ("EMAIL:"+v+"\n") : "";

                        v = $.trim($("#tabs-5 #tab5_X-MSN").attr("value"));
                        qrOpt.chl += v ? ("X-MSN:"+v+"\n") : "";

                        v = $.trim($("#tabs-5 #tab5_Organization").attr("value"));
                        qrOpt.chl += v ? ("ORG:"+v+"\n") : "";

                        v = $.trim($("#tabs-5 #tab5_Title").attr("value"));
                        qrOpt.chl += v ? ("TITLE:"+v+"\n") : "";

                        v = $.trim($("#tabs-5 #tab5_Address").attr("value"));
                        qrOpt.chl += v ? ("ADR:"+v+"\n") : "";

                        v = $.trim($("#tabs-5 #tab5_URL").attr("value"));
                        qrOpt.chl += v ? ("URL:"+v+"\n") : "";
                        qrOpt.chl += "END:VCARD";
                        break;
                }
                qrOpt.chs = $("#options #opt_width").attr("value")+"x"+$("#options #opt_height").attr("value");
                qrOpt.cht = "qr";
                qrOpt.chld = "|1";
                qrOpt.choe = "UTF-8";
                $("#preview").html('<img src="http://chart.googleapis.com/chart?' + $.param(qrOpt) + '">');
                $('#fieldset_qr').show();
            });
        });
	};

	var _init = function(){
		$(function(){
			_bindEvents();
            $('#tab0_url').focus();
		});
	};

	return {
		init : _init
	};
})();

baidu.qrcode.init();