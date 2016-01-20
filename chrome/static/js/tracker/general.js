/** 
 * General Plugin
 * @version 1.0
 * @author dron
 * @create 2013-04-21
 */

Tracker.setupGeneralPlugin = function(){
    Tracker.Plugins.addOn( "general", function(){
        var template, data, calculate, render, update, eventDelegate,
            i, l, r, q, tmpl, now, window, document, mainBody, mainBodyId;

        tmpl = Tracker.Util.tmpl;

        now = function( time ){
            time = new Date();
            time = [ time.getFullYear(), time.getMonth() + 1, time.getDate() ].join( "-" ) + " " +
                [ time.getHours(), time.getMinutes(), time.getSeconds() ].join( ":" );
            time = time.replace( /\b(\d)\b/g, "0$1" );
            return time;
        };

        Tracker.Plugins.addStyle( [
            "#plugin-general-page .toolbar{ height: 42px; background-color: #fafafa; border-bottom: 1px solid #d5d5d5; }",
            "#plugin-general-page .toolbar li{ display: block; float: left; }",
            "#plugin-general-page .toolbar li.button-like{ padding: 5px 0 0 5px; }",
            "#plugin-general-page .toolbar li.text-like{ padding: 12px 0 0 20px; line-height: 20px; }",
            "#plugin-general-page .toolbar li.first{ padding-left: 30px; }",
            "#plugin-general-page .body{ position: absolute; top: 43px; bottom: 0; left: 0; right: 0; padding: 10px 30px; }",
            "#plugin-general-page .body .table{ margin-bottom: 30px; width: 900px; table-layout:fixed; }",
            "#plugin-general-page .body .table td{  }",
            "#plugin-general-page .body .table td .ellipsisable{ width: 100%; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }",
            "#plugin-general-page .body .unit{ font-style: italic; font-weight: 400; }",
            "#plugin-general-page .body .close-up{ position: relative; top: -4px; }",
            "#plugin-general-page .body .low{ color: #ff814e; }",
            "#plugin-general-page .body .high{ color: #2bb027; }",
            "#plugin-general-page .body .close-up b{ font-family: Constantia, Georgia; font-size: 24px; font-weight: 400; position: absolute; }"
        ].join( "" ) );

        template = {
            page: tmpl( [
                "<ul class='toolbar unstyled clearfix'>",
                    "<li class='first button-like'>",
                        "<button class='btn' action='update'>&#21047;&#26032;</button>",
                    "</li>",
                    "<li class='text-like muted'>&#26368;&#21518;&#26356;&#26032;&#26102;&#38388;&#65306;<%= now() %></li>",
                "</ul>",
                "<div id='<%= mainBodyId %>' class='body scrollable'>",
                    "<% if( count > 0 ){ %>",
                        "<h5>&#24403;&#21069;&#32593;&#39029;&#20849;&#21253;&#21547; <%= count %> &#20010;&#33050;&#26412;&#36164;&#28304;&#65306;<%= embedCount %> &#20010;&#20869;&#23884;&#65292;<%= linkCount %> &#20010;&#22806;&#38142;&#25991;&#20214;&#65292;<%= appendCount %> &#20010;&#21160;&#24577;&#21152;&#36733;&#12290;</h5>",
                        "<table class='table table-bordered table-striped'>",
                            "<thead>",
                                "<tr>",
                                    "<th width='*'>&#20351;&#29992;&#37327; <span class='unit'>(%)</span></th>",
                                    "<th width='90'>&#20887;&#20313;&#37327; <span class='unit'>(%)</span></th>",
                                    "<th width='120'>&#20351;&#29992;&#34892;&#25968;</th>",
                                    "<th width='90'>&#24635;&#34892;&#25968;</th>",
                                    "<th width='90'>&#24635;&#22823;&#23567; <span class='unit'>(k)</span></th>",
                                    "<th width='120'>&#24635;&#21152;&#36733;&#32791;&#26102; <span class='unit'>(ms)</span></th>",
                                    "<th width='120'>&#24635;&#36816;&#34892;&#32791;&#26102; <span class='unit'>(ms)</span></th>",
                                "</tr>",
                            "</thead>",
                            "<tbody>",
                                "<tr>",
                                    "<td><span class='close-up <%= usefulRate < 50 ? 'low' : 'high' %>'><b><%= usefulRate %><b></span></td>",
                                    "<td><%= redundancyRate %></td>",
                                    "<td><%= usefulLines %></td>",
                                    "<td><%= totalLines %></td>",
                                    "<td><%= totalSize %></td>",
                                    "<td><%= totalLoadConsum %></td>",
                                    "<td><%= totalRunConsum %></td>",
                                "</tr>",
                            "</tbody>",
                        "</table>",

                        "<h5>&#20887;&#20313;&#37327;&#26368;&#39640; top <%= showCodeCount %> &#33050;&#26412;&#65306;</h5>",
                        "<table class='table table-bordered table-striped table-condensed'>",
                            "<thead>",
                                "<tr>",
                                    "<th width='*'>&#25991;&#20214;&#21517;</th>",
                                    "<th width='70'>&#31867;&#22411;</th>",
                                    "<th width='90'>&#20887;&#20313;&#37327; <span class='unit'>(%)</span></th>",
                                    "<th width='40'></th>",
                                "</tr>",
                            "</thead>",
                            "<tbody>",
                                "<% for( var i = 0, r; i < redundancyRateTableData.length; i ++ ){ %>",
                                    "<% r = redundancyRateTableData[ i ]; %>",
                                    "<tr>",
                                        "<td><div class='ellipsisable'><%= r.fullUrl || '-' %></div></td>",
                                        "<td>",
                                            "<% switch( r.type ){ ",
                                                "case 'embed':",
                                                    "print( '&#20869;&#23884;' );",
                                                    "break;",
                                                "case 'link':",
                                                    "print( '&#25991;&#20214;&#38142;&#25509;' );",
                                                    "break;",
                                                "case 'append':",
                                                    "print( '&#21160;&#24577;&#25554;&#20837;' );",
                                                    "break;",
                                            "} %>",
                                        "</td>",
                                        "<td><%= Math.round( ( 1 - r.prop( 'usefulRate' ) ) * 1e4 ) / 1e2 %></td>",
                                        "<td><button class='btn btn-mini' action='show-code' data-code-id='<%= r.id %>'>&#26597;&#30475;</button></td>",
                                    "</tr>",
                                "<% } %>",
                            "</tbody>",
                        "</table>",

                        "<h5>&#20307;&#31215;&#26368;&#22823; top <%= showCodeCount %> &#33050;&#26412;&#65306;</h5>",
                        "<table class='table table-bordered table-striped table-condensed'>",
                            "<thead>",
                                "<tr>",
                                    "<th width='*'>&#25991;&#20214;&#21517;</th>",
                                    "<th width='70'>&#31867;&#22411;</th>",
                                    "<th width='90'>&#22823;&#23567; <span class='unit'>(k)</span></th>",
                                    "<th width='40'></th>",
                                "</tr>",
                            "</thead>",
                            "<tbody>",
                                "<% for( var i = 0, r; i < sizeTableData.length; i ++ ){ %>",
                                    "<% r = sizeTableData[ i ]; %>",
                                    "<tr>",
                                        "<td><div class='ellipsisable'><%= r.fullUrl || '-' %></div></td>",
                                        "<td>",
                                            "<% switch( r.type ){ ",
                                                "case 'embed':",
                                                    "print( '&#20869;&#23884;' );",
                                                    "break;",
                                                "case 'link':",
                                                    "print( '&#25991;&#20214;&#38142;&#25509;' );",
                                                    "break;",
                                                "case 'append':",
                                                    "print( '&#21160;&#24577;&#25554;&#20837;' );",
                                                    "break;",
                                            "} %>",
                                        "</td>",
                                        "<td><%= ( r.size / 1024 ).toFixed( 2 ) %></td>",
                                        "<td><button class='btn btn-mini' action='show-code' data-code-id='<%= r.id %>'>&#26597;&#30475;</button></td>",
                                    "</tr>",
                                "<% } %>",
                            "</tbody>",
                        "</table>",

                        "<h5>&#36816;&#26102;&#32791;&#26102;&#26368;&#39640; top <%= showCodeCount %> &#33050;&#26412;&#65306;</h5>",
                        "<table class='table table-bordered table-striped table-condensed'>",
                            "<thead>",
                                "<tr>",
                                    "<th width='*'>&#25991;&#20214;&#21517;</th>",
                                    "<th width='70'>&#31867;&#22411;</th>",
                                    "<th width='90'>&#32791;&#26102; <span class='unit'>(ms)</span></th>",
                                    "<th width='40'></th>",
                                "</tr>",
                            "</thead>",
                            "<tbody>",
                                "<% for( var i = 0, r; i < runConsumTableData.length; i ++ ){ %>",
                                    "<% r = runConsumTableData[ i ]; %>",
                                    "<tr>",
                                        "<td><div class='ellipsisable'><%= r.fullUrl || '-' %></div></td>",
                                        "<td>",
                                            "<% switch( r.type ){ ",
                                                "case 'embed':",
                                                    "print( '&#20869;&#23884;' );",
                                                    "break;",
                                                "case 'link':",
                                                    "print( '&#25991;&#20214;&#38142;&#25509;' );",
                                                    "break;",
                                                "case 'append':",
                                                    "print( '&#21160;&#24577;&#25554;&#20837;' );",
                                                    "break;",
                                            "} %>",
                                        "</td>",
                                        "<td><%= r.runConsum %></td>",
                                        "<td><button class='btn btn-mini' action='show-code' data-code-id='<%= r.id %>'>&#26597;&#30475;</button></td>",
                                    "</tr>",
                                "<% } %>",
                            "</tbody>",
                        "</table>",
                    "<% } else { %>",
                        "&#35813;&#32593;&#39029;&#27809;&#26377;&#20219;&#20309; JS &#20195;&#30721;&#12290;",
                    "<% } %>",
                "</div>"
            ].join( "" ) )
        };

        data = function(){};

        data.prototype = {
            count: 0,
            embedCount: 0,
            linkCount: 0,
            appendCount: 0,

            usefulRate: 0,
            redundancyRate: 100,

            usefulLines: 0,
            totalLines: 0,

            totalSize: 0,

            totalLoadConsum: 0,
            totalRunConsum: 0,

            now: now
        };

        data = new data;

        calculate = function(){
            var redundancyRate = function( code1, code2 ){
                return code1.prop( "usefulRate" ) - code2.prop( "usefulRate" );
            };

            var size = function( code1, code2 ){
                return code2.size - code1.size;
            };

            var runConsum = function( code1, code2 ){
                return code2.runConsum - code1.runConsum;
            };

            return function (){
                for( i in data )
                    delete data[ i ];
                l = data.count = Tracker.CodeList.count();

                data.showCodeCount = l > 2 ? 3 : l;

                for( i = 0; i < l; i ++ ){
                    r = Tracker.CodeList.get( i );

                    if( r.type == "embed" ){
                        data.embedCount ++;
                    }else if( r.type == "link" ){
                        data.linkCount ++;
                    }else if( r.type == "append" ){
                        data.appendCount ++;
                    }

                    data.usefulLines += r.arriveRowsCount;
                    data.totalLines += r.rowsCount;
                    data.totalSize += r.size;
                    data.totalLoadConsum += r.loadConsum;
                    data.totalRunConsum += r.runConsum;

                    r.prop( "usefulRate", r.arriveRowsCount / r.rowsCount );
                }

                r = data.usefulLines / data.totalLines;

                data.usefulRate = Math.round( ( r ) * 1e4 ) / 1e2;
                data.redundancyRate = Math.round( ( 1 - r ) * 1e4 ) / 1e2;
                data.totalSize = ( data.totalSize / 1000 ).toFixed( 2 );

                q = Tracker.CodeList.list().slice( 0 );
                q.sort( redundancyRate );
                data.redundancyRateTableData = q.slice( 0, data.showCodeCount );

                q = Tracker.CodeList.list().slice( 0 );
                q.sort( size );
                data.sizeTableData = q.slice( 0, data.showCodeCount );

                q = Tracker.CodeList.list().slice( 0 );
                q.sort( runConsum );
                data.runConsumTableData = q.slice( 0, data.showCodeCount );

                mainBodyId = data.mainBodyId = Tracker.Util.id();
            }
        }();

        render = Tracker.Util.bind( function( text ){
            this.body.innerHTML = text || template.page( data );
        }, this );

        update = function(){
            calculate();
            render();
        };

        eventDelegate = function( el ){
            Tracker.Event.add( el, "click", function( e ){
                var target, action, codeId;

                target = e.target;
                action = target.getAttribute( "action" );
                codeId = target.getAttribute( "data-code-id" );

                if( action == "show-code" ){
                    Tracker.View.ControlPanel.activeTab( "code-list" );
                    Tracker.View.ControlPanel.showCodeDetail( codeId );
                }else if( action == "update" ){
                    document.getElementById( mainBodyId ).innerHTML = "loading...";
                    window.setTimeout( update, 1e2 );
                }
            } );
        };

        this.onStartUp( function( win, doc ){
            window = win;
            document = doc;
            eventDelegate( this.body );
        } );

        this.onActive( update );
    } );
};