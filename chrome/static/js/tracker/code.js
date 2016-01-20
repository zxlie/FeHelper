window.Tracker = window.Tracker || {};
/**
 * Code
 */
Tracker.Code = function(){
    var klass;

    klass = function( url, content, scriptElementIndex ){
        var comboCode, beautifyCode;

        this.id = Tracker.Util.id();
        this.url = url;
        this.type = "";
        this.state = "normal";
        this.rowsCount = 0;
        this.arriveRowsCount = 0;
        this.size = content ? Tracker.Util.getByteLength( content ) : -1;
        this.fileName = url ? Tracker.Util.fileName( url ) : "-";
        this.fullUrl = url ? Tracker.Path.merge( Tracker.Path.getBase(window.document), url ) : null;
        this.origContent = content || null;
        this.lastModified = Tracker.Util.time();
        this.beautifySize = -1;
        this.runErrors = [];
        this.syntaxErrors = [];
        this.props = {};

        this.executiveCode = "";
        this.linesViewHtml = [];

        this.loadConsum =
            this.runConsum = -1;

        this.onReady = Tracker.Promise.fuze();

        if( content ){
            comboCode = new Tracker.ComboCode( this );
            comboCode.onReady( Tracker.Util.bind( function(){
                if( comboCode.errorMessage ){
                    this.executiveCode = this.origContent;
                    this.syntaxErrors.push( comboCode );
                    this.fire( "error", "syntaxErrors" );
                }else{
                    this.executiveCode = comboCode.getExecutiveCode( scriptElementIndex );
                    beautifyCode = comboCode.getBeautifyCode();
                    this.beautifySize = Tracker.Util.getByteLength( beautifyCode );
                    this.rowsCount = Tracker.Util.splitToLines( beautifyCode ).length;
                }

                this.linesViewHtml = comboCode.getViewHtmlByLines();
                this.onReady.fire();
            }, this ) );
        }else{
            this.executiveCode = ";";
            this.beautifySize = this.size = 0;
            this.rowsCount = 0;
            this.linesViewHtml = [];
            this.setState( "empty" );
            this.onReady.fire();
        }
    };

    klass.prototype = Tracker.Event.bind( {
        setType: function( type ){
            this.type = type; // embed, link, append
        },

        setState: function( state ){ // normal, timeout, empty
            this.state = state;
        },

        addError: function( message ){
            this.runErrors.push( new Error( message ) );
            this.lastModified = Tracker.Util.time();
            this.fire( "error", "runErrors" );
        },

        prop: function( name, value ){
            if( arguments.length == 2 )
                return this.props[ name ] = value;
            else
                return this.props[ name ];
        }
    } );

    return klass;
}();

Tracker.ComboCode = function(){
    var klass, closeTagRegx, viewHtmlRegx, executiveCodeRegx, comboCodeBoundaryRegx,
        lineFirstIdRegx, topLocationToRegx;

    closeTagRegx = /<\/(\w{0,10})>/g;

    viewHtmlRegx = /\{<\}(<!-- TRACKERINJECTHTML -->.*?)\{>\}/g;
    executiveCodeRegx = /\{<\}\/\* TRACKERINJECTJS \*\/.*?\{>\}/g;
    comboCodeBoundaryRegx = /\{(?:<|>)\}/g;
    lineFirstIdRegx = /id=ckey\-(\d+)/;
    topLocationToRegx = /(\s*)(top)(\.location\s*=)(?!=)/g;

    klass = function( CodeInstance ){
        this.CodeInstance = CodeInstance;
        this.code = null;
        this.errorMessage = null;
        this.onReady = Tracker.Promise.fuze();

        try{
            this.code = window.document.combocodegen( CodeInstance );
        }catch(e){
            this.errorMessage = e.message;
        }

        this.onReady.fire();
    };

    klass.prototype = Tracker.Event.bind( {
        getCode: function(){
            return this.code;
        },

        getBeautifyCode: function(){
            var code = this.code;
            code = code.replace( viewHtmlRegx, "" );
            code = code.replace( executiveCodeRegx, "" );
            code = code.replace( comboCodeBoundaryRegx, "" );
            return code;
        },

        getExecutiveCode: function( scriptElementIndex ){
            var code, inst, a;

            code = this.code;
            inst = this.CodeInstance;
            code = code.replace( viewHtmlRegx, "" );
            code = code.replace( comboCodeBoundaryRegx, "" );

            code = code.replace( closeTagRegx, function( s, a ){
                return "<\\/" + a + ">";
            } );

            code = code.replace( topLocationToRegx, function( s, a, b, c ){
                return a + "__trackerMockTop__()" + c;
            } );

            code = "try{" + code +
            "}catch(e){__trackerError__('" + inst.id + "',e.message);throw e;}";

            a = typeof scriptElementIndex == "undefined" ? "" : "," + scriptElementIndex;
            code = "__trackerScriptStart__('" + inst.id + "'" + a + ");" +
            code + "; __trackerScriptEnd__('" + inst.id + "');";

            return code;
        },

        getViewHtmlByLines: function(){
            var code, lines, firstId;

            code = this.code || this.CodeInstance.origContent;

            code = code.replace( viewHtmlRegx, function( s, a ){
                return a.replace( /</g, "\x00" ).replace( />/g, "\x01" );
            } );

            code = code.replace( executiveCodeRegx, "" );
            code = code.replace( comboCodeBoundaryRegx, "" );
            lines = Tracker.Util.splitToLines( code );

            // Tracker.Util.forEach( lines, function( line, index ){
            //     var firstId;

            //     firstId = line.match( lineFirstIdRegx );

            //     if( firstId )
            //         Tracker.StatusPool.beginOfLineSnippetPut( firstId[1] );
            // } );

            Tracker.Util.forEach( lines, function( line ){
                if( firstId = line.match( lineFirstIdRegx ) )
                    Tracker.StatusPool.snippetGroupCoverLineAdd( firstId[ 1 ] );
            } );

            return lines;
        }
    } );

    return klass;
}();

Tracker.CodeList = function(){
    var single, codes;

    codes = [];
    single = Tracker.Event.bind( {
        add: function(){
            var code;

            if( arguments.length == 1 ){
                code = arguments[ 0 ];
            }else if( arguments.length == 2 ){
                code = new Tracker.Code( arguments[ 0 ], arguments[ 1 ] );
            }else{
                return ;
            }

            codes[ code.id ] = code;
            codes.push( code );
        },

        get: function( idOrIndex ){
            return codes[ idOrIndex ];
        },

        list: function(){
            return codes;
        },

        each: function( fn ){
            Tracker.Util.forEach( codes, fn );
        },

        sort: function(){
            for( var i = codes.length - 1, r; i >= 0; i -- ){
                r = codes[ i ];
                if( r.type == "embed" )
                    codes.splice( i, 1 ),
                        codes.push( r );
            }

            Tracker.Util.forEach( codes, function( code, index ){
                code.index = index;
            } );
        },

        count: function(){
            return codes.length;
        } } );

    return single;
}();
