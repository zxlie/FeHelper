/** 
 * Watch Plugin
 * @version 1.0
 * @author dron
 * @create 2013-05-07
 */

Tracker.setupWatchPlugin = function(){
    Tracker.Plugins.addOn( "watch", function(){
        var  tmpl, template, window, document, log, time, startBtnId, stopBtnId, clearBtnId,
            stateId, logerId, started, buttonEventBind, stateEvent, start, stop, clear, hooking,
            originalArrivedSnippetGroupFlag, buttonEnable, activeCodeCache, eventBuild,
            original__tracker__, new__tracker__, showState, arrivedSnippetGroupCache,
            buttonStateChange, logHtml;

        tmpl = Tracker.Util.tmpl;
        arrivedSnippetGroupCache = {};

        stateEvent = Tracker.Event.bind( {} );

        time = function( date ){
            var t = [ date.getHours(), date.getMinutes(), date.getSeconds() ].join( ":" );
            t = t.replace( /\b(\d)\b/g, "0$1" );
            return t;
        };

        Tracker.Plugins.addStyle( [
            ".red-dot{ display: inline; margin-left: 2px; background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACvElEQVQ4ja2T30uaYRTHT7W61ULDzFez1BaKYslkF7MfmNaVpLCbqOwNohiyGSuCzLUWBrpCWrTRUiIi2IgVW60NuqiNYbZs/bD8Vc5aqy3a3/Ds1MXcWFdjB76c9z3POZ/n+7w8L8D/jBQUC6VITQVNejqUZ2RAGeYyzKq0NOClpEAGrl0aV1DnTS0MBtzjcOAhRcFjoRCeoNwCATh4POjA+k2UFGt/hRyHb2dmwkBeHli4XJaVyWxz8PnPHBT1vA2f71IUa/TqVRgoKoKuigq4rlYnhykWC2gcduIuDQzGtVmx+MtmeTnZNRpJsKqKrKtU5KVYfNQlld6YVCrBo9PBo56eJEAjkYAdLd9is7NmhMLEtk5HDvv6SMJuJ/tWK4mYzWRNKiXzhYVHXoOB9wIBy6OjSYCxpATcIhF0UFT7mkx2MRCjaRKtqyNhk4ns6PVkQ60mfj6fzNXVPXhbWQlrvwNorRYmi4vBq1K98mVnk6BGQ8J4hMh5xsEgQtcpiviYTLJqNi99qK6G4MREEnDHZIJ5vR5mtNo3/qwsspmTQ8IFBSSWn09iuGsI37fYbPIR19ZpejlgNEJ8ejoJuN/cDO/r6+GdxeL4xOORHXSxl5tLDgQCcojax1qIwyEbXC7ZsdudW42NcLywkAQM9fZCoL0dEh6P2KdUnoaxMYE7f0MX30WiC0gEgSty+elX7Nm1WuFHIJAE9NjtsOfxwG5LC8Td7hq/XH4WR/vHqBOEJDD7ZbKzz4ODNSGahj2XC1YWF5MAAd60w9VViPX3Q6S1FY69Xkmou9u13dCwHESFbDbXiccjiTY1QdRmg9OlJTAYDH/eRIVCAQc+HyTGxiCGjqIWC4TxrGH8NlGExjo7IT40BGfYU19be/n/cO5kwOmE11NTMDsyArPDw780Nz4OT7FWWlp6+fC/xk/27ybygyy2GgAAAABJRU5ErkJggg==) no-repeat center center; }",
            "#code-content .lines .arrive-2{ background-color: #ffba93; color: #000; }",
            "#plugin-watch-page{  }",
            "#plugin-watch-page .header{ height: 126px; background-color: #fafafa; border-bottom: 1px solid #d5d5d5; }",
            "#plugin-watch-page .header .title{ line-height: 42px; padding-left: 30px; }",
            "#plugin-watch-page .header .control{ padding-left: 30px; height: 42px; }",
            "#plugin-watch-page .header .control .btn{ margin-right: 5px; }",
            "#plugin-watch-page .header .state{ padding-left: 30px; line-height: 42px; color: #666; }",
            "#plugin-watch-page .header .state .text{  }",
            "#plugin-watch-page .body{ position: absolute; left: 0; right: 0; top: 127px; bottom: 0; padding: 10px; background-color: #1d1e1a; }",
            "#plugin-watch-page .body .logger{ line-height: 20px; color: #f6f6f6; }",
            "#plugin-watch-page .body .logger .line{  }",
            "#plugin-watch-page .body .logger .line .time{ display: inline-block; width: 80px; }",
            "#plugin-watch-page .body .logger .line .content{  }"
        ].join( "" ) );

        template = {
            page: tmpl( [
                "<div class='header'>",
                    "<div class='title'>点击开始监控，即可发现从监控开始到监控结束之间活动的代码</div>", // TODO: unicode
                    "<div class='control'>",
                        "<button id='<%= startBtnId %>' class='btn'>开始监控</button>",
                        "<button id='<%= stopBtnId %>' class='btn disabled'>停止监控</button>",
                        "<button id='<%= clearBtnId %>' class='btn disabled'>清除结果</button>",
                    "</div>",
                    "<div class='state' id='<%= stateId %>'>",
                        "<%= stateHtml %>",
                    "</div>",
                "</div>",
                "<div class='body scrollable'>",
                    "<div class='logger' id='<%= logerId %>'>",
                    "</div>",
                "</div>"
            ].join( "" ) ),

            state: tmpl( [
                "<span class='text' style='color: <%= color %>;'><%= text %></span>",
            ].join( "" ) ),

            logLine: tmpl( [
                "<span class='time'><%= time %></span>",
                "<span class='content'><%= content %></span>"
            ].join( "" ) )
        };

        activeCodeCache = function(){
            var cache = {};

            return {
                add: function( id ){
                    if( !cache[ id ] )
                        cache[ id ] = 1;
                },

                get: function( id ){
                    return cache[ id ];
                },

                clear: function(){
                    for( var i in cache )
                        delete cache[ i ];
                }
            }
        }();

        showState = function( stateText, color ){
            color = color || "#999";
            document.getElementById( stateId ).innerHTML = template.state( {
                text: stateText,
                color: color
            } );
        };

        log = function( c ){
            var t = time( new Date ), logerEl;
            var line = document.createElement( "div" );
            line.className = "line";
            line.innerHTML = template.logLine( { time: t, content: c } );
            logerEl = document.getElementById( logerId );
            logerEl.appendChild( line );
            logHtml = logerEl.innerHTML;
        };

        buttonEventBind = function( buttonId, buttonHandler ){
            Tracker.Event.add( document.getElementById( buttonId ), "click", function(){
                if( !Tracker.Util.hasClass( this, "disabled" ) )
                    buttonHandler.call( null );
            } );
        };

        buttonEnable = function( buttonId, enable ){
            var button = document.getElementById( buttonId );

            if( enable )
                Tracker.Util.removeClass( button, "disabled" );
            else
                Tracker.Util.addClass( button, "disabled" );
        };

        new__tracker__ = function( groupId ){
            var code;

            Tracker.StatusPool.arrivedSnippetGroupPut( groupId );

            if( !arrivedSnippetGroupCache[ groupId ] )
                arrivedSnippetGroupCache[ groupId ] = 1;

            if( code = Tracker.StatusPool.snippetGroupToCodeGet( groupId ) ){
                if( activeCodeCache.get( code.id ) )
                    return ;

                activeCodeCache.add( code.id );

                // TODO: unicode 编码
                log( "发现新的活动代码在 " + ( code.fullUrl || code.fileName ) +
                    "&nbsp; <a href='#' action='show-code' data-code-id='" + code.id +
                    "' onclick='return false;'>查看</a>" );
            }else{
                log( "发现新的活动代码在 " + groupId );
            }
        };

        start = function(){
            var pageWindow = Tracker.View.ControlFrame.getWindow( "tracker_page" );
            pageWindow.__tracker__ = new__tracker__;
            Tracker.StatusPool.arrivedSnippetGroupFlagSet( 2 );
            showState( "监控进行中...", "#c00" );
            log( "监控开始" );
            hooking = true;
            stateEvent.fire( "stateChange", "start" );
        };

        stop = function(){
            var pageWindow = Tracker.View.ControlFrame.getWindow( "tracker_page" );
            pageWindow.__tracker__ = original__tracker__;
            Tracker.StatusPool.arrivedSnippetGroupFlagSet( 1 );
            showState( "已停止" );
            log( "监控结束" );
            activeCodeCache.clear();
            hooking = false;
            stateEvent.fire( "stateChange", "stop" );
        };

        clear = function(){
            for( var groupId in arrivedSnippetGroupCache ){
                Tracker.StatusPool.arrivedSnippetGroupDelete( groupId, 2 );
                delete arrivedSnippetGroupCache[ groupId ];
            }

            document.getElementById( logerId ).innerHTML = logHtml = "";
            log( "清除完成" );
            buttonEnable( clearBtnId, false );
        };

        eventBuild = function(){
            var topNav, titleEl;

            Tracker.Event.add( document.getElementById( logerId ), "click", function( e ){
                var target, codeId;

                target = e.target;

                if( target.getAttribute( "action" ) == "show-code" ){
                    codeId = target.getAttribute( "data-code-id" );
                    Tracker.View.ControlPanel.activeTab( "code-list" );
                    Tracker.View.ControlPanel.showCodeDetail( codeId, 2 );
                }
            } );

            topNav = document.getElementById( "top-nav" );

            Tracker.Util.forEach( topNav.childNodes , function( li ){
                if( li.getAttribute( "data-name" ) == "watch" ){
                    titleEl = li;
                    titleEl.setAttribute( "data-html-backup", li.innerHTML );
                }
            } );

            topNav.tabEvent.on( "active", function( index, name ){
                if( hooking ){
                    if( name == "watch" ){
                        titleEl.innerHTML = titleEl.getAttribute( "data-html-backup" );
                    }else{
                        titleEl.innerHTML = titleEl.getAttribute( "data-html-backup" )
                            .replace( /<\/a>/i, "<span class='red-dot'>&#12288;</span></a>" );
                    }
                }
            } );
        };

        buttonStateChange = function( state ){
            if( state == "start" ){
                buttonEnable( startBtnId, false );
                buttonEnable( stopBtnId, true );
                buttonEnable( clearBtnId, false );
            }else if( state == "stop" ){
                buttonEnable( startBtnId, true );
                buttonEnable( stopBtnId, false );
                buttonEnable( clearBtnId, true );
            }
        };

        this.onStartUp( function( win, doc ){
            window = win;
            document = doc;

            var pageWindow = Tracker.View.ControlFrame.getWindow( "tracker_page" );
            original__tracker__ = pageWindow.__tracker__;

            this.body.innerHTML = template.page( {
                stateHtml: template.state( { text: "准备就绪", color: null } ),
                startBtnId: startBtnId = Tracker.Util.id(),
                stopBtnId: stopBtnId = Tracker.Util.id(),
                clearBtnId: clearBtnId = Tracker.Util.id(),
                stateId: stateId = Tracker.Util.id(),
                logerId: logerId = Tracker.Util.id()
            } );

            buttonEventBind( startBtnId, start );
            buttonEventBind( stopBtnId, stop );
            buttonEventBind( clearBtnId, clear );

            if( !started ){
                log( "活动监视器初始化完成" );
                log( "准备就绪" );

                stateEvent.on( "stateChange", buttonStateChange );
            }else{
                if( hooking ){
                    buttonStateChange( "start" );
                    showState( "监控进行中...", "#c00" );
                }else{
                    buttonStateChange( "stop" );
                }

                if( logHtml )
                    document.getElementById( logerId ).innerHTML = logHtml;
            }

            eventBuild();

            started = true;
        } );

        this.onActive( function(){

        } );
    } );
};