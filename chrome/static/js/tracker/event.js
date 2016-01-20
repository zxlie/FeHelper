window.Tracker = window.Tracker || {};

Tracker.Event = function(){
    return {
        add: function( target, event, fn ){
            if( typeof event == "object" ){
                for(var name in event)
                    this.add( target, name, event[ name ] );
                return ;
            }

            var call = function(){
                var args = [].slice.call( arguments ), e;

                if( ( e = args[ 0 ] ) && typeof e == "object" ){
                    e = e || event;
                    e.target = e.target || e.srcElement;
                    args[ 0 ] = e;
                }

                fn.apply( target, args );
            };

            if( target.addEventListener )
                target.addEventListener( event, call, false );
            else if( target.attachEvent )
                target.attachEvent( "on" + event, call );
        },

        bind: function( object ){
            var events;

            object = object || {};
            events = object.events = {};

            object.on = function( name, fn ){
                if( typeof name == "object" ){
                    for(var n in name)
                        this.on( n, name[ n ] );
                    return ;
                }

                if( events[ name ] )
                    events[ name ].push( fn );
                else
                    events[ name ] = [ fn ];
            };

            object.fire = object.f = function( name ){
                var args = [].slice.call( arguments, 1 ), e;

                if( e = events[ name ] )
                    for( var i = 0, l = e.length; i < l; i ++ )
                        e[ i ].apply( this, args );
            };

            return object;
        }
    }
}();