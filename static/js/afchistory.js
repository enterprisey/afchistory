/* jshint moz: true */
$( document ).ready( function () {
    const API_ROOT = "https://en.wikipedia.org/w/api.php",
          API_SUFFIX = "&format=json&callback=?&continue=";

    var showHistory = function () {
        var username = $( "#username" ).val();
        $( "#error" ).hide();
        $( "#result" ).hide();
        if ( username === "" ) {
            $( "#error" ).empty();
            $( "#error" ).show();
            $( "#error" ).append( $( "<div>" )
                               .addClass( "errorbox" )
                               .text( "No username specified." ) );
            return;
        }
        $( "#result" ).show();

        var dataSoFar = [],
            baseUrl = API_ROOT + "?action=query&list=usercontribs&ucuser=" + username + "&uclimit=500&ucprop=title|ids|timestamp&ucnamespace=118&ucshow=!new" + API_SUFFIX;
        var query = function ( continueData ) {
            var queryUrl = baseUrl + continueData;
            console.log("*** " + queryUrl);
            $.getJSON( queryUrl, function ( data ) {
                console.log(JSON.stringify(data));
                dataSoFar = dataSoFar.concat( data.query.usercontribs );
                if ( data.hasOwnProperty( "continue" ) ) {
                    display( dataSoFar );

                    // There's some more - recurse
                    var newContinueData = "&uccontinue=" +
                        data.continue.uccontinue +
                        "&continue=" + data.continue.continue;
                    query( newContinueData );
                } else {

                    // Nothing else, so we're done
                    display( dataSoFar );
                }
            } );
        }; // end query()

        query( "&continue=" );

        var display = function ( data ) {
            $( "#statistics" ).text( "Found " + data.length +
                           " draft-space edits." );
            $.each( data, function ( index, edit ) {
                var link = "https://en.wikipedia.org/wiki/" +
                    encodeURIComponent( edit.title );
                $( "#result table" )
                    .append( $( "<tr>" )
                             .append( $( "<td>" )
                                      .append( $( "<a>" )
                                               .attr( "href",
                                                      link )
                                               .text( edit.title ) ) )
                             .append( $( "<td>" )
                                      .text( edit.timestamp ) )
                             .append( $( "<td>" )
                                      .text( "Reviewed" ) ) );
            } );
        } // end display()
    }; // end form submission handler

    // Bind form submission handler to submission button & username field
    $( "#submit" ).click( function () {
        setTimeout( showHistory, 5 );
    } );
    $( "#username" ).keyup( function ( e ) {
        if ( e.keyCode == 13 ) {

            // Enter was pressed in the username field
            setTimeout( showHistory, 5 );
        }
    } );

    // Utility function; from http://stackoverflow.com/a/2901298/1757964
    function numberWithCommas( x ) {
        var parts = x.toString().split( "." );
        parts[ 0 ] = parts[ 0 ].replace( /\B(?=(\d{3})+(?!\d))/g, "," );
        return parts.join( "." );
    }
} );
