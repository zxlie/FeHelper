window.Tracker = window.Tracker || {};
Tracker.Plugins = function(){
    var klass, instCache;

    klass = function( name ){
        instCache[ name ] = this;
        this.activeFuze = Tracker.Promise.fuze();
        this.startUpFuze = Tracker.Promise.fuze();
    };

    klass.prototype = Tracker.Event.bind( {
        onStartUp: function( fn ){
            // this.startUpFuze( Tracker.Util.bind( fn, this ) );
            Tracker.Plugins.onControllerLoad( Tracker.Util.bind( fn, this ) );
        },

        onActive: function( fn ){
            if( this.activeFuze.fired )
                this.activeFuze( fn );
            this.on( "active", fn );
        }
    } );

    instCache = {};

    return {
        // prepare for a plugin, use in this script.
        prepare: function( config ){
            var name, type, define, inst, label, bodyId, setuped, started;

            name = config.name;
            type = config.type;
            define = config.define; // plugin define source
            inst = new klass( name );

            if( type == "TopPanel" ){
                label = config.label;
                bodyId = config.bodyId;

                this.addPanel( name, label, function(){
                    this.innerHTML = "<div id='" + bodyId + "'></div>";
                    inst.body = this.firstChild;
                }, Tracker.Util.bind( function(){
                    if( !setuped )
                        setuped = true,
                            define && this.setup( define );

                    // if( !started )
                    //     started = true,
                    //     inst.startUpFuze.fire();

                    if( !inst.actived )
                        inst.activeFuze.fire(),
                            inst.fire( "active" );
                }, this ) );
            }
        },

        // define a plugin, use in a separate script.
        addOn: function( name, fn ){
            var inst, window, document;

            window = Tracker.View.ControlFrame.getWindow( "tracker_controller" );
            document = window.document;

            if( inst = instCache[ name ] )
                fn.call( inst, window, document );
            else
                throw new Error( "illegal plugin name." );
        },

        // for appending a style tag to 'ControlPanel' view.
        addStyle: function( text ){
            this.onControllerLoad( function( window, document ){
                var style;

                style = document.createElement( "style" );
                style.type = "text/css";
                style.appendChild( document.createTextNode( text ) );

                document.head.appendChild( style );
            } );
        },

        // for appending a top bar item to 'ControlPanel' view.
        addPanel: function( name, title, panelDefine, activeHandler ){

            if( typeof title == "function" ){ // missing argument 'name'
                activeHandler = panelDefine;
                panelDefine = title;
                title = name;
                name = null;
            }

            this.onControllerLoad( function( window, document ){
                var topNav, panels, titleEl, panelEl, meIndex;

                topNav = document.getElementById( "top-nav" );
                panels = document.getElementById( topNav.getAttribute( "data-target" ) );
                titleEl = document.createElement( "li" );
                titleEl.className = "relative";

                if( name )
                    titleEl.setAttribute( "data-name", name );

                titleEl.innerHTML = "<a href='' onclick='return false'>" + title + "</a>";
                topNav.appendChild( titleEl );

                panelEl = document.createElement( "li" );
                panels.appendChild( panelEl );

                meIndex = topNav.childNodes.length - 1;

                if( activeHandler )
                    topNav.tabEvent.on( "active", function( index ){
                        if( index === meIndex )
                            activeHandler();
                    } );

                panelDefine.call( panelEl, window, document );
            } );
        },

        // for setup a plugin.
        setup: function( pluginSrc ){
            var script;

            script = document.createElement( "script" );
            script.charset = "utf-8";
            script.type = "text/javascript";
            script.src = pluginSrc;

            document.head.appendChild( script );
        },

        // ::: privates :::
        onControllerLoad: function( fn ){
            var f = function(){
                var window, document;
                window = Tracker.View.ControlFrame.getWindow( "tracker_controller" );
                document = window.document;
                fn.call( this, window, document );
            };

            if( Tracker.controllerOnLoad.fired )
                Tracker.controllerOnLoad( f );

            Tracker.View.ControlFrame.on( "controllerLoad", f );
        }
    }
}();
