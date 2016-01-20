window.Tracker = window.Tracker || {};

Tracker.Path = function(){
    var protocolRegx, absoluteRegx, rootRegx, doubleDotRegx, singleDotRegx;

    protocolRegx = /^\w+:\/\//;
    absoluteRegx = /^\//;
    rootRegx = /^(\w*:?\/?\/?)([\w.]+)(\/)/;
    doubleDotRegx = /\/[^\/\.]+\/\.\.\//;
    singleDotRegx = /\/\.\//;

    return {
        getBase: function( document ){
            var base, url;

            base = document.querySelector( "base[href]" );

            if( base )
                url = base.href;
            else
                url = document.URL;

            url = url.split( /[?#]/ )[ 0 ];

            return url.slice( 0, url.lastIndexOf( "/" ) + 1 );
        },

        merge: function( base, url ){
            if( url.indexOf( "//" ) === 0 )
                return pageBaseProtocol + ":" + url;

            if( protocolRegx.test( url ) )
                return url;

            if( absoluteRegx.test( url ) ){
                if( rootRegx.test( base ) )
                    url = RegExp.$1 + RegExp.$2 + url;
                else
                    return url;
            }else{
                url = base + url;
            }

            while( doubleDotRegx.test( url ) )
                url = url.replace( doubleDotRegx, "/" );

            while( singleDotRegx.test( url ) )
                url = url.replace( singleDotRegx, "/" );

            return url;
        }
    }
}();
