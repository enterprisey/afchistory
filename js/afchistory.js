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

        // Clear all table rows but the first
        // (http://stackoverflow.com/a/370031/1757964)
        $( "#result table" ).find( "tr:gt(0)" ).remove();
        $( "#statistics" ).empty();
        $( "#submit" )
            .prop( "disabled", true )
            .text( "Loading..." )
        $( "#result" ).show();

        var dataSoFar = [],
            baseUrl = API_ROOT + "?action=query&list=usercontribs&ucuser=" + username + "&uclimit=500&ucprop=title|ids|timestamp|comment&ucnamespace=0|5|118&ucshow=!new" + API_SUFFIX;
        var query = function ( continueData ) {
            var queryUrl = baseUrl + continueData;
            $.getJSON( queryUrl, function ( data ) {
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
                    display( dataSoFar, true );
                }
            } );
        }; // end query()

        query( "&continue=" );

        var display = function ( data, done ) {
            $( "#statistics" ).text( "Examined " + data.length +
                                     " edits." );
            var statistics = { afch: 0, accept: 0, decline: 0, comment: 0 };
            $.each( data, function ( index, edit ) {
                if ( !( /afch|AFCH/.test( edit.comment ) ) ) return;
                statistics.afch++;
                var link = "https://en.wikipedia.org/wiki/" +
                    encodeURIComponent( edit.title );

                // Determine the action
                var action = "Edited";
                var color = "none"; // background color
                var noRow = false;
                if ( edit.comment.indexOf( "Declining" ) > -1 ) {
                    action = "Declined";
                    color = "rgba(255, 200, 200, 0.75)";
                    statistics.decline++;
                } else if ( /Publishing|Created/.test( edit.comment ) ) {
                    action = "Accepted";
                    color = "rgba(200, 255, 200, 0.75)";
                    statistics.accept++;
                } else if ( edit.comment.indexOf( "Commenting" ) > -1 ) {
                    action = "Commented";
                    statistics.comment++;
                } else if ( edit.comment.indexOf( "moved" ) > -1 ) {
                    action = "Moved";
                    noRow = true;
                } else if ( edit.comment.indexOf( "Cleaning" ) > -1 ) {
                    action = "Cleaned";
                    noRow = true;
                }

                if ( !noRow ) {
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
                                          .text( action )
                                          .css( "background-color", color ) ) );
                }
            } ); // end each()

            $( "#statistics" ).empty();
            var totalReviews = statistics.accept + statistics.decline +
                statistics.comment,
                reviewPercent = totalReviews * 100 / data.length;
            $( "#statistics" )
                .append( "Examined " + numberWithCommas( data.length ) +
                         " edits, of which " + statistics.afch + " (" +
                         ( statistics.afch * 100 / data.length ).toFixed( 2 ) +
                         "%) were reviews:" )
                .append( $( "<ul>" )
                         .append( $( "<li>" )
                                  .text( "Accepts: " + statistics.accept +
                                         " (" + ( 100 * statistics.accept /
                                                  totalReviews ).toFixed( 2 ) +
                                         "%)" ) )
                         .append( $( "<li>" )
                                  .text( "Declines: " +
                                         statistics.decline  +
                                         " (" + ( 100 * statistics.decline /
                                                  totalReviews ).toFixed( 2 )
                                         + "%)" ) )
                         .append( $( "<li>" )
                                  .text( "Comments: " +
                                         statistics.comment +
                                         " (" + ( 100 * statistics.comment /
                                                  totalReviews ).toFixed( 2 )
                                         + "%)" ) ) );

            if ( done ) {
                $( "#submit" )
                    .prop( "disabled", false )
                    .text( "Submit" )
            }
        } // end display()
    }; // end form submission handler

    // Bind form submission handler to submission button & username field
    $( "#submit" ).click( function () {
        setTimeout( showHistory, 5 );
    } );
    $( "#username" ).keyup( function ( e ) {
        // Update hash
        window.location.hash = '#user=' + encodeURIComponent($(this).val());

        if ( e.keyCode == 13 ) {

            // Enter was pressed in the username field
            setTimeout( showHistory, 5 );
        }
    } );

    // Allow user to be specified in hash in the form `#user=Example`
    if (window.location.hash) {
      $( "#username" ).val(decodeURIComponent(window.location.hash.replace(/^#user=/, "")));
      $( "#submit" ).trigger("click");
    }

    // Utility function; from http://stackoverflow.com/a/2901298/1757964
    function numberWithCommas( x ) {
        var parts = x.toString().split( "." );
        parts[ 0 ] = parts[ 0 ].replace( /\B(?=(\d{3})+(?!\d))/g, "," );
        return parts.join( "." );
    }
} );
