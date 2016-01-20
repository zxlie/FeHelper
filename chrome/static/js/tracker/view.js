window.Tracker = window.Tracker || {};

Tracker.View = (function( window ){
    var global, host, location, push, join, version;

    version = "1.8.9";
    global = window;
    host = global.document;
    location = global.location;

    var View = function(){
        return {
            templates: {
                url: Tracker.Util.tmpl( "<a href='<%= url %>' target='_blank'><%= url %></a>" ),

                frameset: Tracker.Util.tmpl( [
                    "<!DOCTYPE html>",
                    "<html>",
                    "<head>",
                        "<meta charset='<%= charset %>'>",
                        "<meta name='description' content='fehelper-tracker-frame'>",
                        "<title><%= title %></title>",
                        "<style type='text/css'>",
                            "html, body{ margin: 0; padding: 0; overflow: hidden; width: 100%; height: 100%; position: relative; }",
                            ".fullness{ position: absolute; left: 0; right: 0; top: 0; bottom: 0; }",
                            "#tracker_proxy {display:none;}",
                            "#wrapper{}",
                            "#tracker_controller_ct{ z-index: 10; }",
                            "#tracker_page_ct{ top: 43px; z-index: 20; background-color: #fff; }",
                            "body.control-power-mode #tracker_page_ct{ z-index: 0; }",
                            "body.hidden-page-mode #tracker_page_ct{ display: none; }",
                            "iframe{ border: 0; width: 100%; height: 100%; }",
                        "</style>",
                    "</head>",
                        "<body>",
                            "<div id='wrapper' class='fullness'>",
                                "<div id='tracker_proxy'><input type=\"button\" id=\"btnTrackerProxy\"></div>",
                                "<div id='tracker_controller_ct' class='fullness'><iframe src='about:blank' id='tracker_controller' name='tracker_controller' frameborder='no'></iframe></div>",
                                "<div id='tracker_page_ct' class='fullness'><iframe src='<%= url %>' id='tracker_page' name='tracker_page' frameborder='no'></iframe></div>",
                            "</div>",
                        "</body>",
                    "</html>"
                ].join( "" ) ),

                controllerPage: Tracker.Util.tmpl( [
                    "<!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.0 Frameset//EN' 'http://www.w3.org/TR/xhtml1/DTD/xhtml1-frameset.dtd'>",
                    "<html>",
                    "<head>",
                        "<meta charset='<%= charset %>'>",
                        "<meta name='author' content='dron'>",
                        "<title>Tracker!</title>",
                        "<link href='<%= trackerCss %>' type='text/css' rel='stylesheet' />",
                    "</head>",
                    "<body>",
                        "<%= header %>",
                        "<div class='main' id='main'>",
                            "<ul id='pages' class='unstyled tab-content'>",
                                "<% if( mode == 'embed' ){ %>",
                                    "<li class='tab-content-active target-web-page'></li>",
                                "<% } %>",
                                "<li class='<%= mode == 'embed' ? '' : 'tab-content-active' %>'>",
                                    "<%= codeList %>",
                                    "<%= codeDetail %>",
                                "</li>",
                            "</ul>",
                        "</div>",
                        "<script> window.readyState = 'done'; </script>",
                    "</body>",
                    "</html>"
                ].join( "" ) ),

                controllerTopbar: Tracker.Util.tmpl( [
                    "<div id='loading' class='navbar'>",
                        "<div class='navbar-inner'>",
                            "<span>&#35831;&#31245;&#31561;&#65292;&#25910;&#38598;&#20013;...</span>",
                            "<span id='waitTime'></span>",
                        "</div>",
                    "</div>",
                    "<div id='top-navbar' class='navbar'>",
                        "<div class='navbar-inner'>",
                            '<a href="http://www.baidufe.com/feheler" target="_blank" class="fe-icon pull-left" action="frame#close">',
                                '<img src="' + chrome.runtime.getURL('/static/img/fe-16.png') + '" alt="FeHelper">',
                                "FeHelper：",
                            '</a>',
                            "<span class='fe-title'>Js覆盖面检测</span>",
                            "<ul id='top-nav' class='nav pull-left' data-target='pages'>",
                                "<% if( mode == 'embed' ){ %>",
                                    "<li><a href='' onclick='return false'>当前网页</a></li>",
                                    "<li data-name='code-list' class='active'><a href='' onclick='return false'>代码列表</a></li>",
                                "<% }else{ %>",
                                    "<li class='active' data-name='code-list'><a href='' onclick='return false'>代码列表</a></li>",
                                "<% } %>",
                            "</ul>",
                            "<ul class='nav pull-right'>",
                                "<li class='dropdown'>",
                                    "<a href='' onclick='return false;' class='dropdown-toggle' data-toggle='dropdown'>",
                                        "视图切换",
                                        "<b class='caret'></b>",
                                    "</a>",
                                    "<ul class='dropdown-menu'>",
                                        "<li><a id='window-mode-trigger' action='frame#toggle' href='#' onclick='return false;'>单窗口模式</a></li>",
                                        "<li><a action='frame#close' href='#' onclick='return false;'>关闭控制台</a></li>",
                                    "</ul>",
                                "</li>",
                                "<li><a href='http://www.baidufe.com/fehelper/feedback.html' target='_blank'>意见反馈</a></li>",
                            "</ul>",
                        "</div>",
                    "</div>",
                ].join( "" ) ),

                controllerCodeList: Tracker.Util.tmpl( [
                    "<table class='table compact-width'>",
                        "<thead>",
                            "<tr>",
                                "<th width='<%= widthIndex %>'>#</th>",
                                "<th width='<%= widthName %>'>&#21517;&#31216;</th>",
                                "<th width='<%= widthType %>'>&#31867;&#22411;</th>",
                                "<th width='<%= widthCover %>'>&#25191;&#34892;&#35206;&#30422;</th>",
                                "<th width='<%= widthCoverLine %>'>&#25191;&#34892;&#34892;&#25968;</th>",
                                "<th width='<%= widthLines %>'>&#24635;&#34892;&#25968;</th>",
                                "<th width='<%= widthSize %>'>&#21407;&#22987;&#22823;&#23567;</th>",
                                "<th width='<%= widthBSize %>'>&#35299;&#21387;&#22823;&#23567;</th>",
                                "<th width='<%= widthLoadConsum %>'>&#21152;&#36733;&#32791;&#26102;</th>",
                                "<th width='<%= widthRunConsum %>'>&#36816;&#34892;&#32791;&#26102;</th>",
                                "<th width='<%= widthRError %>'>&#25191;&#34892;&#25253;&#38169;</th>",
                                "<th width='<%= widthSError %>'>&#35821;&#27861;&#38169;&#35823;</th>",
                                "<th width='<%= widthState %>'>&#29366;&#24577;</th>",
                                "<th width='*'>&nbsp;</th>",
                            "</tr>",
                        "</thead>",
                    "</table>",
                    "<div id='list-codes' class='scrollable'>",
                        "<table class='table table-striped table-hover table-condensed'>",
                            "<colgroup>",
                                "<col width='<%= widthIndex %>'>",
                                "<col width='<%= widthName %>'>",
                                "<col width='<%= widthType %>'>",
                                "<col width='<%= widthCover %>'>",
                                "<col width='<%= widthCoverLine %>'>",
                                "<col width='<%= widthLines %>'>",
                                "<col width='<%= widthSize %>'>",
                                "<col width='<%= widthBSize %>'>",
                                "<col width='<%= widthLoadConsum %>'>",
                                "<col width='<%= widthRunConsum %>'>",
                                "<col width='<%= widthRError %>'>",
                                "<col width='<%= widthSError %>'>",
                                "<col width='<%= widthState %>'>",
                            "</colgroup>",
                            "<tbody id='list-codes-tbody'>",
                            "</tbody>",
                        "</table>",
                    "</div>"
                ].join( "" ) ),

                controllerCodeDetail: Tracker.Util.tmpl( [
                    "<div id='code-detail' class='absolute'>",
                        "<div class='code-toolbar clearfix'>",
                            "<ul class='code-toolbar-inner'>",
                                "<li class='close-button-like'><button class='close' action='code#close'>&times;</button></li>",

                                "<li class='tab-like'>",
                                    "<ul id='code-detail-head' class='nav nav-tabs' data-target='code-detail-body'>",
                                        "<li class='active'><a href='' onclick='return false;'>&#20195;&#30721;</a></li>",
                                        "<li><a href='' onclick='return false;'>&#20449;&#24687;</a></li>",
                                    "</ul>",
                                "</li>",

                                "<li class='label-like right tab-desc tab-desc-0'>&#26032;&#27963;&#21160;</li>",
                                "<li class='image-like right tab-desc tab-desc-0'><div class='hooking image'></div></li>",
                                "<li class='label-like right tab-desc tab-desc-0'>&#26410;&#25191;&#34892;</li>",
                                "<li class='image-like right tab-desc tab-desc-0'><div class='unarrive image'></div></li>",
                                "<li class='label-like right tab-desc tab-desc-0'>&#24050;&#25191;&#34892;</li>",
                                "<li class='image-like right tab-desc tab-desc-0'><div class='arrive image'></div></li>",
                                "<li class='label-like right tab-desc tab-desc-0'>&#22270;&#20363;&#65306;</li>",
                            "</ul>",
                        "</div>",
                        "<ul class='unstyled tab-content' id='code-detail-body'>",
                            "<li class='tab-content-active'>",
                                "<div id='code-content' class='relative scrollable'></div>",
                            "</li>",
                            "<li class='scrollable'>",
                                "<div id='code-info'></div>",
                            "</li>",
                        "</ul>",
                    "</div>"
                ].join( "" ) ),

                controllerCodeInfo: Tracker.Util.tmpl( [
                    "<dl class='group'>",
                        "<dt>&#26469;&#28304;</dt>",
                        "<dd><%= fileName %></dd>",
                    "</dl>",
                    "<dl class='group'>",
                        "<dt>&#31867;&#22411;</dt>",
                        "<dd><%= type %></dd>",
                    "</dl>",
                    "<dl class='group'>",
                        "<dt>&#25191;&#34892;&#35206;&#30422;&#29575;</dt>",
                        "<dd><%= rate %></dd>",
                    "</dl>",
                    "<dl class='group'>",
                        "<dt>&#25191;&#34892;&#34892;&#25968;</dt>",
                        "<dd><%= arriveRowsCount %></dd>",
                    "</dl>",
                    "<dl class='group'>",
                        "<dt>&#24635;&#34892;&#25968;</dt>",
                        "<dd><%= rowsCount %></dd>",
                    "</dl>",
                    "<dl class='group'>",
                        "<dt>&#21407;&#22987;&#22823;&#23567;</dt>",
                        "<dd><%= size %></dd>",
                    "</dl>",
                    "<dl class='group'>",
                        "<dt>&#35299;&#21387;&#22823;&#23567;</dt>",
                        "<dd><%= bsize %></dd>",
                    "</dl>",
                    "<dl class='group'>",
                        "<dt>&#21152;&#36733;&#32791;&#26102;</dt>",
                        "<dd><%= loadConsum %></dd>",
                    "</dl>",
                    "<dl class='group'>",
                        "<dt>&#36816;&#34892;&#32791;&#26102;</dt>",
                        "<dd><%= runConsum %></dd>",
                    "</dl>",
                    "<dl class='group'>",
                        "<dt>&#25191;&#34892;&#25253;&#38169;</dt>",
                        "<dd><%= rerror %></dd>",
                    "</dl>",
                    "<dl class='group'>",
                        "<dt>&#35821;&#27861;&#38169;&#35823;</dt>",
                        "<dd><%= serror %></dd>",
                    "</dl>",
                    "<dl class='group'>",
                        "<dt>&#29366;&#24577;</dt>",
                        "<dd><%= state %></dd>",
                    "</dl>",
                ].join( "" ) ),

                codeListLine: Tracker.Util.tmpl( [
                    "<tr data-code-id='<%= id %>'>",
                        "<td><div class='ellipsisable' style='width: <%= widthIndex %>px;'><%= index %></div></td>",
                        "<td><div class='ellipsisable' style='width: <%= widthName %>px;'><%= fileName %></div></td>",
                        "<td><div class='ellipsisable' style='width: <%= widthType %>px;'><%= type %></div></td>",
                        "<td><div id='code-<%= id %>-rate' class='ellipsisable' style='width: <%= widthCover %>px;'><%= rate %></div></td>",
                        "<td><div id='code-<%= id %>-arriveRowsCount' class='ellipsisable' style='width: <%= widthCoverLine %>px;'><%= arriveRowsCount %></div></td>",
                        "<td><div class='ellipsisable' style='width: <%= widthLines %>px;'><%= rowsCount %></div></td>",
                        "<td><div class='ellipsisable' style='width: <%= widthSize %>px;'><%= size %></div></td>",
                        "<td><div class='ellipsisable' style='width: <%= widthBSize %>px;'><%= bsize %></div></td>",
                        "<td><div id='code-<%= id %>-loadConsum' class='ellipsisable' style='width: <%= widthLoadConsum %>px;'><%= loadConsum %></div></td>",
                        "<td><div id='code-<%= id %>-runConsum' class='ellipsisable' style='width: <%= widthRunConsum %>px;'><%= runConsum %></div></td>",
                        "<td><div id='code-<%= id %>-runErrors' class='ellipsisable' style='width: <%= widthRError %>px;'><%= rerror %></div></td>",
                        "<td><div class='ellipsisable' style='width: <%= widthSError %>px;'><%= serror %></div></td>",
                        "<td><div class='ellipsisable' style='width: <%= widthState %>px;'><%= state %></div></td>",
                        "<td></td>",
                    "</tr>"
                ].join( "" ) )
            },

            Loading: function(){
                var layer, span1, span2, animateTimer, count, progress, body;

                count = progress = 0;
                body = host.body;

                var create = function(){
                    var span;

                    layer = Tracker.Util.makeElement( "div", "position: fixed; padding: 30px; border: 1px solid rgba(255, 255, 255, .2); border-radius: 10px; background: #000; font-size: 20px; line-height: 20px; text-align: center; color: #fff; top: 50px; left: 50px; box-shadow: 0 0 5px #fff; z-index: 65535; font-family: 'Courier New', 'Heiti SC', 'Microsoft Yahei';" );
                    layer.innerHTML = "&#27491;&#22312;&#20998;&#26512;&#32593;&#39029; <span>...</span> <span>(0/0)</span>";
                    body.appendChild( layer );
                    host.documentElement.scrollTop = body.scrollTop = 0;
                    span = layer.getElementsByTagName( "span" );
                    span1 = span[0];
                    span2 = span[1];
                };

                var animate = function(){
                    var count, word, n, s, e;

                    count = 0;
                    word = "......";
                    clearInterval( animateTimer );
                    animateTimer = setInterval( function(){
                        n = count % 7;
                        s = word.substr( 0, n );
                        e = word.substr( 0, 6 - n );
                        span1.innerHTML = s + "<span style='color: #000;'>" +
                            e + "</span>";
                        count += 1;
                    }, 100 );
                };

                return {
                    show: function(){
                        if( !layer )
                            create();
                        else
                            layer.style.display = "block";

                        animate();
                    },

                    hide: function(){
                        if( layer )
                            layer.style.display = "none";

                        clearInterval( animateTimer );
                    },

                    text: function( text ){
                        var me, pm;

                        if( layer )
                            layer.innerHTML = text;

                        me = this;
                        pm = new Tracker.Promise();
                        clearInterval( animateTimer );
                        setTimeout( function(){
                            me.hide();
                            pm.resolve();
                        }, 2e3 );

                        return pm;
                    },

                    addCount: function(){
                        count ++;
                        span2.innerHTML = "(" + ( progress / count * 100 ).toFixed( 2 ) + "%)";
                    },

                    addProgress: function(){
                        progress ++;
                        span2.innerHTML = "(" + ( progress / count * 100 ).toFixed( 2 ) + "%)";
                    }
                }
            }(),

            ControlFrame: function(){
                var document = window.document, controlWindow, hasCreateEmbeded = false,
                    currentMode = "embed", pageBuilder, controllerBuilder;

                var config = {
                    windowWidth: 800,
                    windowHeight: 600
                };

                var lookupForWindowReady = function( target ){
                    var pm, timer, timer2, now, timeout, clear;

                    pm = new Tracker.Promise();
                    timeout = 5000;
                    now = Tracker.Util.time();

                    clear = function(){
                        clearInterval( timer );
                        clearTimeout( timer2 );
                    };

                    timer = setInterval( function(){
                        if( target.readyState == "complete" ){
                            clear();
                            pm.resolve();
                        }
                    }, 10 );

                    timer2 = setTimeout( function(){
                        pm.reject();
                    }, timeout );

                    return pm;
                };

                return Tracker.Event.bind( {
                    state: "preshow",

                    pageBuilder: function( fn ){
                        pageBuilder = fn;
                    },

                    controllerBuilder: function( fn ){
                        controllerBuilder = fn;
                    },

                    show: function(){
                        var controller, page, window;

                        if( currentMode === "embed" ){
                            controller = document.getElementById( "tracker_controller_ct" ),
                            page = document.getElementById( "tracker_page_ct" ),
                            controller.style.display = "block",
                            page.style.top = "";
                        }else if( currentMode === "window" ){
                            window = this.getWindow( "tracker_controller" );

                            if( window && !window.closed )
                                window.focus();
                            else
                                this.createWindow();
                        }

                        this.state = "show";
                        this.fire( "show" );
                    },

                    hide: function(){
                        var controller, page;

                        if( currentMode === "embed" )
                            controller = document.getElementById( "tracker_controller_ct" ),
                            page = document.getElementById( "tracker_page_ct" ),
                            controller.style.display = "none",
                            page.style.top = "0";
                        else if( currentMode === "window" )
                            controlWindow.close();

                        this.state = "hide";
                        this.fire( "hide" );
                    },

                    toggleMode: function(){
                        this.removeControllerFrame();

                        if( currentMode === "embed" )
                            currentMode = "window",
                            this.createWindow();
                        else if( currentMode === "window" )
                            currentMode = "embed",
                            this.createEmbed(),
                            this.show();
                    },

                    getMode: function(){
                        return currentMode;
                    },

                    getWindow: function( name ){
                        // name: tracker_main | tracker_page | tracker_controller
                        var w;
                        if( !arguments.length || name === "tracker_main" )
                            return window;

                        if( currentMode === "window" && name === "tracker_controller" )
                            return controlWindow;
                        else if( w = window.frames[ name ] )
                            return window.document.getElementById( name ).contentWindow;
                    },

                    // privates
                    createEmbed: function(){
                        var page, controller;

                        Tracker.Promise.when(
                            hasCreateEmbeded ? [ controllerBuilder( "embed" ) ] :
                            [ pageBuilder(), controllerBuilder( "embed" ) ]
                        ).then( Tracker.Util.bind( function( pageHtml, controllerHtml ){
                            if( !controllerHtml )
                                controllerHtml = pageHtml,
                                pageHtml = null;

                            if( pageHtml ){
                                window.name = "tracker_main";

                                this.write( "tracker_main", View.templates.frameset( {
                                    url: location.href,
                                    title: document.title,
                                    charset: document.characterSet || "utf-8"
                                } ) );

                                this.write( "tracker_page", pageHtml );
                                var pageWin = this.getWindow( "tracker_page" );

                                // 整个页面都加载完成了，可以开始script inject了
                                this.fire('pageLoad',window,pageWin);
                            }

                            this.write( "tracker_controller", controllerHtml );
                            controller = this.getWindow( "tracker_controller" );

                            lookupForWindowReady( controller.document ).then( Tracker.Util.bind( function(){
                                this.fire( "controllerLoad", controller, controller.document );
                            }, this ) );
                        }, this ) );

                        hasCreateEmbeded = true;
                    },

                    createWindow: function( conf ){
                        var width = screen.width - 200, height = screen.height - 200,
                            left = 100, top = 100, controller;

                        controlWindow = window.open( "about:blank", "", "width=" + width +
                            ", height=" + height + ", left=" + left + ", top=" + top +
                            ", toolbar=no, menubar=no, resizable=yes, status=no, " +
                            "location=no, scrollbars=yes" );

                        controllerBuilder( "window" ).then( Tracker.Util.bind( function( html ){
                            this.write( "tracker_controller", html );
                            controller = this.getWindow( "tracker_controller" );

                            lookupForWindowReady( controller.document ).then( Tracker.Util.bind( function(){
                                this.fire( "controllerLoad", controller, controller.document );
                            }, this ) );
                        }, this ) );
                    },

                    removeControllerFrame: function(){
                        this.hide();

                        if( currentMode === "embed" )
                            this.write( "tracker_controller", "about:blank" );
                        else if( currentMode === "window" )
                            controlWindow = null;
                    },

                    write: function( name, content ){
                        var document, i, l, t, timer, write;

                        document = this.getWindow( name ).document;
                        document.open( "text/html", "replace" );

                        if( name == "tracker_page" ){
                            i = 0;
                            t = 10240; // 10k/ms

                            l = content.length;

                            write = function(){
                                c = content.substr( i, t );
                                document.write( c );
                                i += t;

                                if( i > l )
                                    document.close(),
                                    clearInterval( timer );
                            };

                            timer = setInterval( write, 1 );
                        }else{
                            document.write( content );
                            document.close();
                        }
                    }
                } );
            }(),

            ControlPanel: function(){
                var actions, window, document, currentSelectedCode, updateInterval, codeEl,
                    codeIndex;

                actions = {};
                codeIndex = 0;

                var rate = function( code ){
                    var r, c;

                    r = code.arriveRowsCount / code.rowsCount * 100 || 0;
                    c = r == 0 ? "stress" : "";

                    return "<span class='" + c + "'>" + r.toFixed( 1 ) + "%</span>";
                };

                var size = function( number ){
                    return ( number / 1024 ).toFixed( 1 ) + "k";
                };

                var yesno = function( bool ){
                    return ( bool && bool.length ) ?
                    "<span class='stress'>&#26159;<span>" : "&#21542;";
                };

                var state = function( state ){
                    switch( state ){
                        case "normal":
                            return "&#27491;&#24120;";
                        case "timeout":
                            return "<span class='stress'>&#36229;&#26102;</span>";
                        case "empty":
                            return "<span class='stress'>&#26080;&#20869;&#23481;</span>";
                    }
                };

                var type = function( code ){
                    switch( code.type ){
                        case "embed":
                            return "内嵌";
                        case "link":
                            return "文件链接";
                        case "append":
                            return "动态插入";
                    };
                };

                var time = function( time, s ){
                    if( time == -1 )
                        return "-1";
                    if( !s )
                        return time + "ms";
                    else
                        return ( time / 1000 ).toFixed( 2 ) + "s";
                };

                var width = function(){
                    var mapping, offsets;

                    mapping = {
                        index: 30, name: 220, type: 90, cover: 60, "cover-line": 60, lines: 60,
                        size: 60, bsize: 60, rerror: 60, serror: 60, state: 50, loadConsum: 60,
                        runConsum: 60
                    };

                    offsets = {
                    };

                    return function( name, type ){
                        return mapping[ name ] + ( offsets[ type ] || 0 );
                    };
                }();

                var withWidths = function( data ){
                    var widths = {
                        widthIndex: width( "index" ),
                        widthName: width( "name" ),
                        widthType: width( "type" ),
                        widthCover: width( "cover" ),
                        widthCoverLine: width( "cover-line" ),
                        widthLines: width( "lines" ),
                        widthSize: width( "size" ),
                        widthBSize: width( "bsize" ),
                        widthRError: width( "rerror" ),
                        widthSError: width( "serror" ),
                        widthState: width( "state" ),
                        widthLoadConsum: width( "loadConsum" ),
                        widthRunConsum: width( "runConsum" )
                    };

                    if( !data )
                        return widths;

                    for( var i in widths )
                        data[ i ] = widths[ i ];

                    return data;
                };

                var codeTemplate = function( code ){
                    return View.templates.codeListLine( withWidths( {
                        id: code.id,

                        index: ++ codeIndex,
                        fileName: code.fileName,
                        type: type( code ),
                        rate: rate( code ),
                        arriveRowsCount: code.arriveRowsCount,
                        rowsCount: code.rowsCount,
                        size: size( code.size ),
                        bsize: size( code.beautifySize ),
                        rerror: yesno( code.runErrors ),
                        serror: yesno( code.syntaxErrors ),
                        state: state( code.state ),
                        runConsum: time( code.runConsum ),
                        loadConsum: time( code.loadConsum )
                    } ) );
                };

                var codeListTemplate = function( codeList ){
                    var htmls;

                    htmls = [];

                    if( codeList.length ){
                        Tracker.Util.forEach( codeList, function( code, index ){
                            htmls[ index ] = codeTemplate( code );
                        } );

                        return htmls.join( "" );
                    }else{
                        return "<tr><td colspan='20'><div class='none'>该网页没有任何JS代码</div></td></tr>";
                    }
                };

                var makeCodeTr = function( code ){
                    var layer, html;

                    layer = document.createElement( "tbody" );
                    html = codeTemplate( code );
                    layer.innerHTML = html;

                    return layer.firstChild;
                };

                var asnyShowCode = function(){
                    var timer, timeout, interval, prepare, partCount, nowIndex, init,
                        currentDisposeLines, gutterEl, linesEl, regx1, regx2, ckeyIdRegx, result,
                        linesCount, h1, h2, focusOnFlag, focusOnFlagTarget;

                    timeout = 1;
                    partCount = 100;
                    regx1 = /\x00/g;
                    regx2 = /\x01/g;
                    ckeyIdRegx = /id=ckey-(\d+)/g;
                    h1 = [];
                    h2 = [];

                    init = function(){
                        nowIndex = 0;
                        linesCount = 0;
                        window.clearInterval( timer );
                    };

                    prepare = function(){
                        var innerElId = Tracker.Util.id();
                        var gutterId = Tracker.Util.id();
                        var linesId = Tracker.Util.id();

                        codeEl.innerHTML = "<div id='" + innerElId + "' class='block clearfix' " +
                            "style='height: " + ( linesCount * 20 + 10 ) + "px;'>" +
                            "<div id='" + gutterId + "' class='gutter'></div>" +
                            "<div id='" + linesId + "' class='lines'></div></div>";
                        codeEl.scrollTop = 0;

                        gutterEl = document.getElementById( gutterId );
                        linesEl = document.getElementById( linesId );
                    };

                    interval = function(){
                        var t, p1, p2, a;

                        h1.length = h2.length = 0;

                        for( var i = 0; i < partCount; i ++ ){
                            if( nowIndex >= linesCount ){
                                init();
                                break;
                            }

                            t = Tracker.Util.html( currentDisposeLines[ nowIndex ] ).replace( regx1, "<" )
                                .replace( regx2, ">" );

                            t = t.replace( ckeyIdRegx, function( all, id ){
                                a = Tracker.StatusPool.arrivedSnippetGet( id );

                                if( a & 2 )
                                    a = 2;
                                else if( a & 1 )
                                    a = 1;

                                if( focusOnFlag && !focusOnFlagTarget && focusOnFlag == a ){
                                    focusOnFlagTarget = id;
                                    focusOnFlag = 0;
                                }

                                return a ? all + " class='arrive arrive-" + a + "'" : all;
                            } );

                            h1.push( Tracker.Util.tag( nowIndex + 1, "pre" ) );
                            h2.push( Tracker.Util.tag( t || " ", "pre" ) );

                            nowIndex ++;
                        }

                        p1 = document.createElement( "div" );
                        p2 = document.createElement( "div" );

                        p1.innerHTML = h1.join( "" );
                        p2.innerHTML = h2.join( "" );

                        gutterEl.appendChild( p1 );
                        linesEl.appendChild( p2 );

                        if( focusOnFlagTarget ){
                            document.getElementById( "ckey-" + focusOnFlagTarget ).scrollIntoView();
                            focusOnFlagTarget = undefined;
                        }
                    };

                    result = function( code, _focusOnFlag ){
                        init();

                        focusOnFlag = _focusOnFlag;

                        if( code.state == "empty" ){
                            codeEl.innerHTML = "<div class='empty-code'>" +
                                    "&#20869;&#23481;&#20026;&#31354;</div>"; // 内容为空
                        }else if( code.state == "timeout" ){
                            codeEl.innerHTML = "<div class='timeout-code'>" +
                                    "&#35299;&#26512;&#36229;&#26102;</div>"; // 解析超时
                        }else{
                            currentDisposeLines = code.linesViewHtml;
                            linesCount = currentDisposeLines.length;
                            prepare();
                            timer = window.setInterval( interval, timeout );
                        }
                    };

                    result.clear = init;

                    return result;
                }();

                var setupBootstrapPatch = function(){

                    var setupDropdownMenu = function(){
                        var lastOpen;

                        var setup = function( el ){

                            var dropdownMenu = el.querySelector( ".dropdown-menu" );

                            Tracker.Event.add( dropdownMenu, "click", function( e ){
                                Tracker.Util.removeClass( el, "open" );
                                lastOpen = null;
                                e.stopPropagation();
                                Tracker.TrackerGlobalEvent.fire( "bootstrap: dropdown.close" );
                            } );

                            Tracker.Event.add( el, "click", function( e ){
                                Tracker.Util.addClass( el, "open" );
                                if( lastOpen && lastOpen != el )
                                    Tracker.Util.removeClass( lastOpen, "open" );
                                lastOpen = el;
                                Tracker.TrackerGlobalEvent.fire( "bootstrap: dropdown.open" );
                                e.stopPropagation();
                            } );
                        };

                        return function(){
                            var dropdowns = document.querySelectorAll( ".dropdown" );
                            for( var i = 0, l = dropdowns.length; i < l; i ++ )
                                setup( dropdowns[ i ] );
                            Tracker.Event.add( document, "click", function(){
                                var found;

                                for( var i = 0, l = dropdowns.length; i < l; i ++ )
                                    if( Tracker.Util.hasClass( dropdowns[ i ], "open" ) )
                                        found = true,
                                    Tracker.Util.removeClass( dropdowns[ i ], "open" );

                                if( found )
                                    Tracker.TrackerGlobalEvent.fire( "bootstrap: dropdown.close" );
                            } );
                        }
                    }();

                    var setupModalDialog = function(){

                        var open = function( modal ){
                            return function(){
                                modal.style.display = "block";
                                Tracker.TrackerGlobalEvent.fire( "bootstrap: dialog.open" );
                            }
                        };

                        var close = function( modal ){
                            return function(){
                                modal.style.display = "none";
                                Tracker.TrackerGlobalEvent.fire( "bootstrap: dialog.close" );
                            }
                        };

                        var setup = function( modal ){
                            var closeBtns = modal.querySelectorAll( ".modal-header .close, .modal-footer .btn" );
                            var fclose = close( modal );
                            var fopen = open( modal );
                            for( var i = 0, l = closeBtns.length; i < l; i ++ )
                                Tracker.Event.add( closeBtns[ i ], "click", fclose );
                            modal.open = fopen;
                        };

                        return function(){
                            var modals = document.querySelectorAll( ".modal" );
                            for( var i = 0, l = modals.length; i < l; i ++ )
                                setup( modals[ i ] );
                        }
                    }();

                    var setupTab = function(){

                        var setup = function( tab ){
                            var target = tab.getAttribute( "data-target" );

                            if( !target )
                                return ;

                            target = document.getElementById( target );

                            var heads = tab.childNodes;
                            var bodys = target.childNodes;

                            tab.active = function( index ){
                                Tracker.Util.removeClass( heads[ tab.actived ], "active" );
                                Tracker.Util.removeClass( bodys[ tab.actived ], "tab-content-active" );

                                Tracker.Util.addClass( heads[ index ], "active" );
                                Tracker.Util.addClass( bodys[ index ], "tab-content-active" );

                                tab.actived = index;
                                tab.tabEvent.fire( "active",
                                    index, heads[ index ].getAttribute( "data-name" ) );
                            };

                            Tracker.Event.add( tab, "click", function( e ){
                                var li;

                                li = Tracker.Util.findParent( e.target, "li", this );

                                Tracker.Util.forEach( this.childNodes, function( l, index ){
                                    if( li === l ){
                                        if( tab.actived == index )
                                            return ;
                                        tab.active( index );
                                    }
                                } );
                            } );

                            tab.tabEvent = Tracker.Event.bind();
                            tab.actived = 0;
                        };

                        return function(){
                            var tabs = document.querySelectorAll( ".nav" );
                            for( var i = tabs.length - 1; i >= 0; i -- )
                                setup( tabs[ i ] );
                        };
                    }();

                    return function(){
                        setupDropdownMenu();
                        setupModalDialog();
                        setupTab();
                    };
                }();

                var autoUpdateCodeFn = function(){
                    Tracker.CodeList.each( function( code ){
                        if( !code.lastUpdate || code.lastUpdate < code.lastModified )
                            View.ControlPanel.updateCode( code );
                    } );
                };

                return Tracker.Event.bind( {
                    bindWindow: function( win ){
                        window = win;
                        document = window.document;
                        codeEl = document.getElementById( "code-content" );
                    },

                    addCode: function( code ){
                        var tbody, tr, index;

                        if( !document )
                            return ;

                        tbody = document.getElementById( "list-codes-tbody" );
                        index = Tracker.CodeList.count() - 1;

                        if( code instanceof Array ){
                            tbody.innerHTML = codeListTemplate( code );
                        }else if( code instanceof Tracker.Code ){
                            code.onReady( function(){
                                // code.index = index;
                                tr = makeCodeTr( code );
                                tbody.appendChild( tr );
                            } );
                        }
                    },

                    showCodeDetail: function( id, focusOnFlag ){
                        var codeDetailHeadTab, actived;

                        codeDetailHeadTab = document.getElementById( "code-detail-head" );
                        actived = codeDetailHeadTab.actived;

                        currentSelectedCode = id || null;

                        document.getElementById( "code-detail" ).style.display =
                            id ? "block" : "none";

                        if( id ){
                            if( actived === 0 )
                                this.showCode( id, focusOnFlag );
                            else if( actived == 1 )
                                this.showCodeInfo( id, focusOnFlag );

                            var elementListCodes = document.getElementById( "list-codes" );
                            var trs = elementListCodes.querySelectorAll( "tr" );

                            Tracker.Util.forEach( trs, function( tr ){
                                if( tr.getAttribute( "data-code-id" ) == id )
                                    Tracker.Util.addClass( tr, "info" );
                                else
                                    Tracker.Util.removeClass( tr, "info" );
                            } );
                        }
                    },

                    showCode: function( id, focusOnFlag ){
                        if( id ){
                            code = Tracker.CodeList.get( id );
                            asnyShowCode( code, focusOnFlag );
                        }
                    },

                    showCodeInfo: function( id, focusOnFlag ){
                        var elementCodeInfo, code;

                        elementCodeInfo = document.getElementById( "code-info" );
                        code = Tracker.CodeList.get( id );

                        elementCodeInfo.innerHTML = View.templates.controllerCodeInfo( {
                            // id: code.id,
                            // index: ++ codeIndex,
                            fileName: code.fullUrl ?
                                View.templates.url( { url: code.fullUrl } ) :
                                "&#26469;&#33258;&#39029;&#38754;",
                            type: type( code ),
                            rate: rate( code ),
                            arriveRowsCount: code.arriveRowsCount,
                            rowsCount: code.rowsCount,
                            size: size( code.size ),
                            bsize: size( code.beautifySize ),
                            rerror: yesno( code.runErrors ),
                            serror: yesno( code.syntaxErrors ),
                            state: state( code.state ),
                            loadConsum: time( code.loadConsum ),
                            runConsum: time( code.runConsum )
                        } );
                    },

                    updateCode: function( code ){
                        if( currentSelectedCode == code.id )
                            this.showCodeDetail( code.id );

                        var rateEl, arriveRowsCountEl, runErrorsEl, runConsumEl, loadConsumEl;

                        rateEl = document.getElementById( "code-" + code.id + "-rate" );
                        arriveRowsCountEl = document.getElementById( "code-" + code.id +
                            "-arriveRowsCount" );
                        runErrorsEl = document.getElementById( "code-" + code.id + "-runErrors" );
                        runConsumEl = document.getElementById( "code-" + code.id + "-runConsum" );
                        loadConsumEl = document.getElementById( "code-" + code.id + "-loadConsum" );

                        if( !rateEl )
                            return;

                        rateEl.innerHTML = rate( code );
                        arriveRowsCountEl.innerHTML = code.arriveRowsCount;
                        runErrorsEl.innerHTML = yesno( code.runErrors );
                        runConsumEl.innerHTML = time( code.runConsum );
                        loadConsumEl.innerHTML = time( code.loadConsum );

                        code.lastUpdate = Tracker.Util.time();
                    },

                    autoUpdateCodeStart: function(){
                        updateInterval = setInterval( autoUpdateCodeFn, 5e2 );
                    },

                    autoUpdateCodeStop: function(){
                        clearInterval( updateInterval );
                    },

                    activeTab: function( name ){
                        var topNav, baseIndex;

                        topNav = document.getElementById( "top-nav" );
                        baseIndex = 0;

                        if( View.ControlFrame.getMode() == "embed" )
                            baseIndex = 1;

                        if( typeof name != "undefined" ){
                            if( !topNav.active )
                                return ;

                            if( name == "code-list" )
                                name = baseIndex + 0;

                            topNav.active( name );
                        }else{
                            return topNav.actived;
                        }
                    },

                    setControlPower: function( bool, hiddenPage ){
                        var parent, window, b, c1, c2;

                        if( View.ControlFrame.getMode() == "embed" ){
                            parent = View.ControlFrame.getWindow( "tracker_main" );
                            window = View.ControlFrame.getWindow( "tracker_controller" );
                            c1 = bool ? Tracker.Util.addClass : Tracker.Util.removeClass;
                            c2 = hiddenPage ? Tracker.Util.addClass : Tracker.Util.removeClass;
                            b = parent.document.body;
                            c1( b, "control-power-mode" );
                            c2( b, "hidden-page-mode" );
                        }
                    },

                    actions: function( acts ){
                        for( var name in acts )
                            actions[ name ] = acts[ name ];
                    },

                    htmlBuilder: function(){
                        var pm = new Tracker.Promise(), mode;

                        codeIndex = 0;
                        mode = View.ControlFrame.getMode();

                        Tracker.Util.delay( function(){
                            pm.resolve( View.templates.controllerPage( withWidths( {
                                charset: global.document.characterSet || "utf-8",
                                trackerCss: chrome.runtime.getURL('/static/css/js-tracker.css'),

                                header: View.templates.controllerTopbar( {
                                    mode: mode
                                } ),

                                codeList: View.templates.controllerCodeList( withWidths() ),
                                codeDetail: View.templates.controllerCodeDetail(),

                                mode: mode,
                                version: version,
                                uid: host.tracker_uid
                            } ) ) );
                        } );

                        return pm;
                    },

                    eventBuilder: function(){
                        var me = this;

                        var elementListCodes = document.getElementById( "list-codes" );
                        var elementCodeDetail = document.getElementById( "code-detail" );
                        var elementCodeToolbarInner = document.querySelector( ".code-toolbar-inner" );
                        var elementCodeDetailHead = document.getElementById( "code-detail-head" );
                        var elementCodeContent = document.getElementById( "code-content" );

                        var tr, focusInList;
                        var tabDescRegx = /tab-desc-(\d+)/;

                        Tracker.Event.add( elementListCodes, {
                            click: function( e ){
                                var codeId;
                                if( tr = Tracker.Util.findParent( e.target, "tr", elementListCodes ) )
                                    if( codeId = tr.getAttribute( "data-code-id" ) )
                                        focusInList = true,
                                        codeId == currentSelectedCode ||
                                            View.ControlPanel.showCodeDetail( codeId );
                            }
                        } );

                        Tracker.Event.add( elementCodeDetail, {
                            click: function(){
                                focusInList = false;
                            }
                        } );

                        Tracker.Event.add( document, {
                            mouseup: function( e ){
                                var action;
                                if( ( action = e.target.getAttribute( "action" ) ) &&
                                    actions[ action ] )
                                    actions[ action ].call( me, e.target );
                            },

                            keydown: function( e ){

                                var selectId;

                                // command + R, F5
                                if( ( e.metaKey && e.keyCode == 82 ) || e.keyCode == 116 ){
                                    if( View.ControlFrame.getMode() == "window" ){
                                    e.preventDefault && e.preventDefault();
                                    }
                                }

                                if( focusInList && currentSelectedCode ){
                                    var offset = 0;
                                    if( e.keyCode == 38 ){ // up
                                        offset = -1;
                                    }else if( e.keyCode == 40 ){ // down
                                        offset = 1;
                                    }
                                    if( offset ){
                                        var trs = elementListCodes.querySelectorAll( "tr" ),
                                            nowIndex = -1, tr;

                                        for(var i = 0, l = trs.length; i < l; i ++){
                                            if( trs[i].getAttribute( "data-code-id" ) ==
                                                currentSelectedCode ){
                                                nowIndex = i;
                                                break;
                                            }
                                        }

                                        if( nowIndex > -1 ){
                                            nowIndex = ( nowIndex += offset ) < 0 ?
                                                0 : nowIndex == trs.length ?
                                                nowIndex - 1 : nowIndex;
                                            tr = trs[ nowIndex ];

                                            selectId = tr.getAttribute( "data-code-id" );
                                            if( currentSelectedCode != selectId )
                                                View.ControlPanel.showCodeDetail( selectId );

                                            e.preventDefault && e.preventDefault();
                                        }
                                    }
                                }
                            }

                            // mousewheel: function( e ){
                            //     e.preventDefault();
                            // }
                        } );

                        if( !actions[ "code#close" ] ){
                            actions[ "code#close" ] = function( e ){
                                focusInList = true;
                                View.ControlPanel.showCodeDetail( false );
                            };
                        }

                        if( View.ControlFrame.getMode() == "window" )
                            document.getElementById( "window-mode-trigger" ).innerHTML = "内嵌模式";

                        var lastScrollLeft = 0;
                        Tracker.Event.add( elementCodeContent, {
                            scroll: function( e ){

                                if( this.scrollLeft == 0 )
                                    this.scrollLeft = 1;

                                if( this.scrollLeft == this.scrollWidth - this.clientWidth )
                                    this.scrollLeft -= 1;

                            if( lastScrollLeft == this.scrollLeft )
                                return ;

                            var gutter = this.querySelector( ".gutter" );
                            gutter.style.left = this.scrollLeft + "px";
                            lastScrollLeft = this.scrollLeft;
                            }
                        } );

                        setupBootstrapPatch();

                        elementCodeDetailHead.tabEvent.on( "active", function( index ){
                            if( this.currentShown != currentSelectedCode ){
                                this.currentShown = currentSelectedCode;
                                if( index == 0 )
                                    View.ControlPanel.showCode( currentSelectedCode );
                                else if( index == 1 )
                                View.ControlPanel.showCodeInfo( currentSelectedCode );
                            }

                            var tabDescs = elementCodeToolbarInner.querySelectorAll( ".tab-desc" );
                            Tracker.Util.forEach( tabDescs, function( tabDesc ){
                                tabDescRegx.test( tabDesc.className );
                                tabDesc.style.display = RegExp.$1 == index ? "" : "none";
                            } );
                        } );

                        if( currentSelectedCode )
                            this.showCodeDetail( currentSelectedCode );
                    }
                } );
            }()
        }
    }();

    return View;
})(this);