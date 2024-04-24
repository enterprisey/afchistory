$( document ).ready( function () {
	const API_ROOT = "https://en.wikipedia.org/w/api.php",
		API_SUFFIX = "&format=json&callback=?&continue=",
		ACTION_FLAGS = { "Accepted": 1, "Declined": 2, "Commented": 4, "Edited": 8 };

	function execute() {
		var filterCheckboxes = document.getElementsByName( "filter" );
		for( var i = 0; i < filterCheckboxes.length; i++ ) {
			filterCheckboxes[i].addEventListener( 'click', updateFiltered );
		}

		$( "#submit" ).click( function () {
			var username = $( '#username' ).val();
			window.location.href = getPermalink( username );
		} );

		$( "#username" ).keyup( function ( e ) {
			var pressedEnter = e.keyCode == 13;
			if ( pressedEnter ) {
				var username = $( '#username' ).val();
				window.location.href = getPermalink( username );
			}
		} );

		// Do this both on initial page load, and when using forward/back browser buttons
		$( window ).on( 'pageshow', function () {
			// In the past, we let the hash specify the user, like #user=Example
			if ( window.location.hash && window.location.hash.indexOf( "#user=" ) >= 0 ) {
				var username = decodeURIComponent( window.location.hash.replace( /^#user=/, "" ) );
				$( "#username" ).val( username );
				showHistory();
			// Allow the user to be specified in the query string, like ?user=Example
			} else if( window.location.search.substring( 1 ).indexOf( "user=" ) >= 0 ) {
				var userArgMatch = /&?user=([^&#]*)/.exec( window.location.search.substring( 1 ) );
				if( userArgMatch && userArgMatch[1] ) {
					var username = decodeURIComponent( userArgMatch[1].replace( /\+/g, " " ).replace( /_/g, " " ) );
					$( "#username" ).val( username );
					showHistory();
				}
			// If no user in the URL, update the browser history and title (normally updated when submitting, but we didn't submit)
			} else {
				document.title = 'AfC Review History';
				$( "#username" ).val( '' );
			}
		} );
	}

	function showHistory() {
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

		// Prepare the UI for showing the history
		$( "#statistics" ).empty();
		$( "#submit" )
			.prop( "disabled", true )
			.text( "Loading..." );
		$( "#username" )
			.prop( "disabled", true );
		$( "#result" ).show();

		// Change window title to include the username searched for. Useful in browser history.
		var newTitle = 'AfC Review History';
		if ( username ) {
			newTitle += ' - ' + username;
		}
		document.title = newTitle;

		// Display "start over" link
		$( "#start-over" )
			.empty()
			.append( "(or " )
			.append( $( "<a>" )
				.attr( "href", 'index.html' )
				.text( "start over" ) )
			.append( ")" );

		var baseUrl = API_ROOT + "?action=query&list=usercontribs&ucuser=" + username + "&uclimit=500&ucprop=title|timestamp|comment&ucnamespace=0|5|118&ucshow=!new" + API_SUFFIX;
		var query = function ( continueData ) {
			var queryUrl = baseUrl + continueData;
			$.getJSON( queryUrl, function ( data ) {
				if ( data.hasOwnProperty( "continue" ) ) {
					display( data );

					// There's some more - recurse
					var newContinueData = "&uccontinue=" +
						data.continue.uccontinue +
						"&continue=" + data.continue.continue;
					query( newContinueData );
				} else {

					// Nothing else, so we're done
					display( data, true );
				}
			} );
		};

		query( "&continue=" );

		var statistics = { afch: 0, accept: 0, decline: 0, comment: 0 };
		var display = function ( data, done ) {
			data = data.query.usercontribs;
			$( "#statistics" ).text( "Loaded " + data.length +
									 " edits." + ( done ? " Almost done!" : "" ) );
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
								 .attr( "data-action", ACTION_FLAGS[ action ] )
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

				if ( ( statistics.afch % 500 ) == 0 ) {
					$( "#statistics" )
						.text( "Loaded " + data.length + " edits. Examined " +
							   statistics.afch + " of them." );
				}
			} );

			$( "#statistics" ).empty();
			var totalReviews = statistics.accept + statistics.decline +
				statistics.comment,
				reviewPercent = totalReviews * 100 / data.length,
				formatType = function ( reviews ) {
					return numberWithCommas( reviews ) +
						" (" + ( 100 * reviews / totalReviews ).toFixed( 2 ) +
						"%)";
				};
			$( "#statistics" )
				.append( "Examined " + numberWithCommas( statistics.afch ) +
						 " reviews" + ( done ? "" : " so far" ) + ":" )
				.append( $( "<ul>" )
						 .append( $( "<li>" )
								  .text( "Accepts: " +
										 formatType( statistics.accept ) ) )
						 .append( $( "<li>" )
								  .text( "Declines: " +
										 formatType( statistics.decline ) ) )
						 .append( $( "<li>" )
								  .text( "Comments: " +
										 formatType( statistics.comment ) ) ) );

			if ( done ) {
				$( "#submit" )
					.prop( "disabled", false )
					.text( "Submit" );
				$( "#username" )
					.prop( "disabled", false );
				updateFiltered();
			}
		}
	};

	// Based on checkboxes, update visibility of rows
	function updateFiltered() {
		// Get which checkboxes are checked
		var enabledFiltersElements = document.querySelectorAll('input[name=filter]:checked');
		var enabledFilters = 0;
		for( var i = 0; i < enabledFiltersElements.length; i++ ) {
			enabledFilters |= parseInt( enabledFiltersElements[ i ].value );
		}

		var rows = document.querySelectorAll( "#result tr" );
		for( var i = 0, n = rows.length; i < n; i++ ) {
			rows[i].style.display = ( enabledFilters & parseInt( rows[i].dataset.action ) )
				? "" : "none";
		}
	}

	// Utility function; from http://stackoverflow.com/a/2901298/1757964
	function numberWithCommas( x ) {
		var parts = x.toString().split( "." );
		parts[ 0 ] = parts[ 0 ].replace( /\B(?=(\d{3})+(?!\d))/g, "," );
		return parts.join( "." );
	}

	function getPermalink( username ) {
		// Generate permalink
		// We want what's in the address bar without the ?=___ or #___ stuff
		var permalinkSubstringMatch = /[\#\?]/.exec( window.location.href );
		var baseLink = window.location.href;
		if( permalinkSubstringMatch ) {
			baseLink = window.location.href.substring( 0, permalinkSubstringMatch.index );
		}
		var permalink = baseLink + "?user=" + encodeURIComponent( username );
		return permalink;
	}

	execute();
} );
