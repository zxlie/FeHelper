window.Tracker = window.Tracker || {};
Tracker.Util = function(){
    var fileNameSplitWord = /[?#]/;

    var excapeRegx = function(){
        var specials, regx;

        specials = [ "/", ".", "*", "+", "?", "|", "$", "^", "(", ")", "[", "]", "{",
            "}", "\\" ];
        regx = new RegExp( "(\\" + specials.join("|\\") + ")", "g" );

        return function( text ){
            return text.replace( regx, "\\$1" );
        };
    }();

    var RemoteProxy = function(){
        var callbacks, esc, service, timeout;

        callbacks = {};
        timeout = 10e3;

        document.remoteProxyCallback = function( data ){
            var c;
            if( c = callbacks[ data.url ] )
                c( data );
        };

        esc = function(){
            var regx, rep;

            regx = /[\\\/ \+%&=#\?]/g;
            rep = function( s ){
                return escape( s );
            };

            return function( url ){
                return url.replace( regx, rep );
            };
        }();

        service = "http://www.ucren.com/tracker/proxy.php";

        var getProxyUrl = function( url ){
            url = Tracker.Util.param( service, "url", esc( url ) );
            url = Tracker.Util.param( url, "callback", "remoteProxyCallback" );
            return url;
        };

        return {
            get: function( url, charset ){
                var pm, timer, script;

                pm = new Tracker.Promise();

                script = Tracker.Util.makeElement( document, "script" );
                script.src = getProxyUrl( url );
                script.charset = charset || "utf-8";
                document.head.appendChild( script );

                callbacks[ url ] = function( data ){
                    clearTimeout( timer );
                    pm.resolve( {
                        response: data.content,
                        consum: data.consum
                    } );
                    script = null;
                    delete callbacks[ url ];
                };

                timer = setTimeout( function(){
                    script.parentNode.removeChild( script );
                    pm.reject();
                    script = null;
                }, timeout );

                return pm;
            },

            request : function(url) {
                var pm = new Tracker.Promise();
                var timeStart = Tracker.Util.time();

                var timer = setTimeout( function(){
                    pm.reject();
                }, timeout );

                //向background发送一个消息，要求其加载并处理js文件内容
                chrome.extension.sendMessage({
                    type : MSG_TYPE.GET_JS,
                    link : url
                },function(respData){
                    clearTimeout( timer );
                    pm.resolve( {
                        response: respData.content,
                        consum: Tracker.Util.time() - timeStart
                    } );
                });

                return pm;
            }
        };
    }();

    return {
        blank: function(){
        },

        bind: function( fn, scope ){
            return function(){
                return fn.apply( scope, arguments );
            };
        },

        forEach: function( unknow, iterator ){
            var i, l;

            if( unknow instanceof Array ||
                ( unknow && typeof unknow.length == "number" ) )
                for( i = 0, l = unknow.length; i < l; i ++ )
                    iterator( unknow[ i ], i, unknow );
            else if( typeof unknow === "string" )
                for( i = 0, l = unknow.length; i < l; i ++ )
                    iterator( unknow.charAt( i ), i, unknow );
        },

        // map: function( array, fn ){
        //     for( var i = 0, l = array.length; i < l; i ++ )
        //         array[ i ] = fn( array[ i ], i, array );
        // },

        id: function(){
            return "_" + this.nid();
        },

        nid: function( id ){
            return function(){
                return id ++;
            }
        }( 1 ),

        handle: function(){
            var cache, number;

            cache = [];
            number = -1;

            return function( unknown ){
                var type;

                type = typeof unknown;

                if( type == "number" )
                    return cache[ unknown ];
                else if( type == "object" || type == "function" ){
                    cache[ ++ number ] = unknown;
                    return number;
                }
            }
        }(),

        trim: function(){
            var regx = /^\s+|\s+$/g, rep = "";
            return function( string ){
                return string.replace( regx, rep );
            }
        }(),

        random: function(){
            return ( Math.random() * 1e6 ) | 0;
        },

        getByteLength: function( string ){
            return string.replace( /[^\x00-\xff]/g, "  " ).length;
        },

        makeElement: function( doc, tagName, cssText ){
            var el;

            if( typeof doc == "string" )
                cssText = tagName,
                    tagName = doc,
                    doc = null;

            if( !doc )
                doc = document;

            el = doc.createElement( tagName );

            if( cssText )
                el.style.cssText = cssText;

            return el;
        },

        getHtmlComments: function(){
            var cn, push;

            cn = document.COMMENT_NODE;
            push = [].push;

            return function f( node ){
                var result, c, l, i;

                result = [];

                if( node.nodeType == cn )
                    result.push( node.nodeValue );
                else if( ( c = node.childNodes ) && ( l = c.length ) )
                    for( i = 0; i < l; i ++ )
                        push.apply( result, f( c[ i ] ) );

                return result;
            }
        }(),

        findParent: function( el, tag, endOf ){
            do{
                if( el.tagName.toLowerCase() == tag.toLowerCase() )
                    return el;

                if( el == endOf )
                    return null;

                el = el.parentNode;
            }while( 1 );
        },

        tmpl: function( text, data ){
            var settings, render, noMatch, matcher, index, source, escaper, escapes, template;

            settings = { evaluate: /<%([\s\S]+?)%>/g, interpolate: /<%=([\s\S]+?)%>/g };
            noMatch = /(.)^/;

            matcher = new RegExp( [
                ( settings.interpolate || noMatch ).source,
                ( settings.evaluate || noMatch ).source
            ].join('|') + '|$', 'g' );

            index = 0;
            source = "__p+='";
            escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;
            escapes = {
                "'": "'", '\\': '\\', '\r': 'r', '\n': 'n', '\t': 't', '\u2028': 'u2028',
                '\u2029': 'u2029'
            };

            text.replace( matcher, function( match, interpolate, evaluate, offset ){
                source += text.slice( index, offset ).replace( escaper, function( match ){
                    return '\\' + escapes[ match ];
                } );

                if( interpolate )
                    source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";

                if( evaluate )
                    source += "';\n" + evaluate + "\n__p+='";

                index = offset + match.length;
                return match;
            } );

            source += "';\n";
            source = 'with(obj||{}){\n' + source + '}\n';
            source = "var __t,__p='',__j=Array.prototype.join," +
            "print=function(){__p+=__j.call(arguments,'');};\n" + source + "return __p;\n";

            try{
                render = new Function( 'obj', source );
            }catch( e ){
                e.source = source;
                throw e;
            }

            if( data )
                return render( data );

            template = function( data ) {
                return render.call( this, data );
            };

            template.source = 'function(obj){\n' + source + '}';

            return template;
        },

        tag: function( html, tagName, className ){
            var result, t;

            result = html;
            tagName = tagName.split( " " );

            while( t = tagName.pop() )
                result = "<" + t + ">" + result + "</" + t + ">";

            if( className )
                result = result.replace( /<(\w+)>/,
                    "<$1 class='" + className + "'>" );

            return result;
        },

        hasClass: function( el, className ){
            var name;

            name = " " + el.className + " ";

            return ~name.indexOf( " " + className + " " );
        },

        addClass: function( el, className ){
            var name;

            name = " " + el.className + " ";

            if( !~name.indexOf( " " + className + " " ) )
                el.className += " " + className;
        },

        removeClass: function( el, className ){
            var name;

            name = " " + el.className + " ";

            if( ~name.indexOf( " " + className + " " ) ){
                name = name.replace( " " + className + " ", " " );
                name = Tracker.Util.trim( name.replace( / +/g, " " ) );
                el.className = name;
            }
        },

        html: function( string ){
            return string.replace( /&/g, "&amp;" )
                .replace( /</g, "&lt;" )
                .replace( />/g, "&gt;" )
                .replace( /"/g, "&quot;" )
                .replace( /'/g, "&#39;" );
        },

        splitToLines: function(){
            var splitLineRegx = /\r\n|[\r\n]/;
            return function( string ){
                return string.split( splitLineRegx );
            }
        }(),

        param: function( url, name, value ){
            var spliter, suffix;

            spliter = ~url.indexOf( "?" ) ? "&" : "?";
            suffix = name + "=" + value;

            return url + spliter + suffix;
        },

        excapeRegx: excapeRegx,

        fileName: function( url ){
            url = url.split( fileNameSplitWord )[ 0 ];
            return url.slice( url.lastIndexOf( "/" ) + 1 );
        },

        time: function(){
            return new Date().getTime();
        },

        browser: function(){
            var ua, isOpera, ret;

            ua = navigator.userAgent;
            isOpera = Object.prototype.toString.call(window.opera) == '[object Opera]';
            ret = {
                IE:     !!window.attachEvent && !isOpera,
                Opera:  isOpera,
                WebKit: ua.indexOf('AppleWebKit/') > -1,
                Gecko:  ua.indexOf('Gecko') > -1 && ua.indexOf('KHTML') === -1
                // MobileSafari:   /Apple.*Mobile/.test(ua)
            };

            for( var name in ret )
                if( ret.hasOwnProperty( name ) && ret[ name ] ){
                    ret.name = name;
                    break;
                }

            return ret;
        }(),

        isCrossDomain: function( url ){
            return !( url.indexOf( Tracker.Path.getBase(window.document) ) == 0 );
        },


        intelligentGet: function( url ){
            url = Tracker.Path.merge( Tracker.Path.getBase(window.document), url );
            return Tracker.Util.isCrossDomain( url ) ? RemoteProxy.request( url ) : Tracker.Util.request( url );
        },

        request: function( url, charset ){
            var xhr, pm, timeout, timer, timeStart, timeConsum;

            pm = new Tracker.Promise();
            timeout = 10e3;

            if( XMLHttpRequest )
                xhr = new XMLHttpRequest();
            else
                xhr = new ActiveXObject( "Microsoft.XMLHTTP" );

            xhr.open( "GET", url, true );

            if( charset && xhr.overrideMimeType )
                xhr.overrideMimeType( "text/html;charset=" + charset );

            xhr.onreadystatechange = function(){
                if( xhr.readyState == 4 && xhr.status == 200 ){
                    clearTimeout( timer );
                    timeConsum = Tracker.Util.time();
                    pm.resolve( {
                        response: xhr.responseText,
                        consum: timeConsum - timeStart
                    } );
                    xhr = null;
                }
            };

            timer = setTimeout( function(){
                xhr.abort();
                pm.reject();
                xhr = null;
            }, timeout );

            timeStart = Tracker.Util.time();
            xhr.send( null );

            return pm;
        },

        delay: function (){
            // single thread
            var tasks, start, timer, task;

            tasks = [];

            start = function(){
                clearInterval( timer );
                timer = setInterval( function(){
                    if( tasks.length ){
                        task = tasks.shift();
                        task.apply();
                    }else{
                        clearInterval( timer );
                    }
                }, 1e2 );
            };

            return function( fn ){
                tasks.push( fn );
                start();
            }
        }(),

        onCpuFree: function( fn, process ){
            var now, start, last, count, d, timer, limit, times, space;

            start = last = Tracker.Util.time();
            count = 0;

            times = 30;
            space = 20;
            limit = 100;

            process = process || Tracker.Util.blank;

            timer = setInterval( function(){
                now = Tracker.Util.time();

                if( ( d = now - last ) < limit && ++ count == times ){
                    clearInterval( timer );
                    return fn();
                }else if( d > limit ){
                    count = 0;
                }

                process( ( last = now ) - start );
            }, space );
        }
    }
}();