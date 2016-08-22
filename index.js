/* global $ */
/* global console */
$( document ).ready( function() {
    var nbAuditeurs = 0,
        // chars_on_stage = [],
        // for offline testing purpose only
        radomize_fake_listeners_count = function() {
            return ( Math.floor( Math.random() * 32 ) + 1 );
        },
        fake_listeners_count = radomize_fake_listeners_count(),
        // show the random test crowd when fetching actual listeners failed
        flag_fun_test = true;

    function createChar() {
        var JQ_character_from_template = $( $( '#char-tpl' ).html() ),
            // this char will appear from left or right ? 50/50 ;)
            comesFrom = ( ( 0.5 <= Math.random() ) ? '-20%' : '120%' ),
            // generates the goal position of this char
            dest = {};
        dest.top = ( ( Math.random() * 100 ) - 20 );
        dest.left = ( ( Math.random() * 60 ) + 20 );
        // custom character
        JQ_character_from_template.addClass( 'skin-' + ( Math.floor( Math.random() * 4 ) + 1 ) );
        JQ_character_from_template.addClass( 'tshirt-' + ( Math.floor( Math.random() * 8 ) + 1 ) );
        JQ_character_from_template.addClass( 'trousers-' + ( Math.floor( Math.random() * 6 ) + 1 ) );
        // set initial position (the char is hidden)
        JQ_character_from_template.css( 'top', ( dest.top + ( Math.floor( Math.random() * 90 ) + 1 ) ) + '%' );
        JQ_character_from_template.css( 'left', comesFrom );
        // put this char in DOM (in the backstage)
        $( '#chars' ).append( JQ_character_from_template );
        // let's make this character reach its goal now
        JQ_character_from_template.animate( {
            top: ( dest.top + '%' ),
            left: ( dest.left + '%' )
        }, 2000 + ( Math.floor( Math.random() * 1200 ) + 1 ), 'linear' );
    }

    function makeAppear( howMany ) {
        for ( var i = Number( howMany ); 0 < i; --i ) {
            // they will not be created at the same time (random timeout)
            // they will be created within a limited timeframe (500 ms)
            window.setTimeout( createChar, Math.floor( Math.random() * 500 ) + 1 );
        }
    }

    function makeDisappear( howMany ) {
        var to_remove_count = Number( howMany );
        // Dead characters... You should be in heaven now, stop bloating the DOM!
        $( '#chars .char[data-tombstone]' ).remove();
        // select characters to be removed explicitely among the living characters
        $( '#chars .char:not([data-tombstone])' ).each( function() {
            if ( 0 < to_remove_count ) {
                var JQ_this_char = $( this );
                to_remove_count -= 1;
                // mark this character as removed in case we have to garbage-collect it next time
                JQ_this_char.data( 'tombstone', 1 );
                // they will leave in various directions not just straight left or right
                JQ_this_char.animate( {
                    left: ( ( ( 0.5 <= Math.random() ) ? -20 : 120 ) + '%' ),
                    top: ( '+=' + ( Math.floor( Math.random() * 90 ) + 1 ) + '%' )
                }, 2000, 'linear', function() {
                    // remove this char from the DOM when anim is done
                    $( this ).remove();
                } );
            }
        } );
    }

    function moveChars( _count ) {
        // _count.from = old
        // _count.to = now
        if ( _count && !isNaN( parseInt( _count.from ) ) && !isNaN( parseInt( _count.to ) ) ) {
            if ( _count.from < _count.to ) {
                if ( flag_fun_test ) {
                    console.log( _count.from + ' -> ' + _count.to + ' : +' + ( _count.to - _count.from ) + ' listeners :D ' );
                }
                makeAppear( _count.to - _count.from );
            } else if ( _count.to < _count.from ) {
                if ( flag_fun_test ) {
                    console.log( _count.from + ' -> ' + _count.to + ' : -' + ( _count.from - _count.to ) + ' listeners :( ' );
                }
                makeDisappear( _count.from - _count.to );
            }
            nbAuditeurs = _count.to;
        }
    }

    function getAuditeurs( _fetch ) {
        // _fetch.then = what to do after fetching the current listeners count
        // _fetch.and_repeat_every = (ms) delay before fetching new listeners count
        if ( _fetch ) {
            $.ajax( {
                url: 'getAuditeurs.php'
            } ).then( function( success ) {
                // PROD main path
                var res = parseInt( success );
                if ( !isNaN( res ) && ( typeof( function() {} ) === typeof( _fetch.then ) ) ) {
                    _fetch.then( {
                        from: nbAuditeurs,
                        to: ( ( res < 0 ) ? 0 : res )
                    } );
                }
                // repeated cool async GET instead of taking risks with setinterval
                if ( !isNaN( parseInt( _fetch.and_repeat_every ) ) ) {
                    window.setTimeout( function() {
                        getAuditeurs( {
                            then: moveChars,
                            and_repeat_every: _fetch.and_repeat_every
                        } );
                    }, _fetch.and_repeat_every );
                }
            }, function() {
                // failure
                if ( flag_fun_test ) {
                    // DEV fallback to offline test with a changing little crowd
                    fake_listeners_count = radomize_fake_listeners_count();
                    // console.log( 'Testing with ' + fake_listeners_count + ' fake listeners now! ' );
                    if ( typeof( function() {} ) === typeof( _fetch.then ) ) {
                        _fetch.then( {
                            from: nbAuditeurs,
                            to: fake_listeners_count
                        } );
                    } else {
                        console.warn( '"_fetch.then" should be a function else this code is useless. ' );
                    }
                    // repeated cool async GET instead of taking risks with setinterval
                    if ( !isNaN( parseInt( _fetch.and_repeat_every ) ) ) {
                        window.setTimeout( function() {
                            getAuditeurs( {
                                then: moveChars,
                                and_repeat_every: _fetch.and_repeat_every
                            } );
                        }, _fetch.and_repeat_every );
                    }
                }
            } );
        }
    }
    // start here
    getAuditeurs( {
        then: moveChars,
        and_repeat_every: 5000
    } );
} );
