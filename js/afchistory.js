$( () => {
	const API_ROOT = 'https://en.wikipedia.org/w/api.php',
		API_SUFFIX = '&format=json&callback=?&continue=',
		ACTION_FLAGS = { Accepted: 1, Declined: 2, Rejected: 3, Commented: 4, Edited: 8 };

	addListeners();
	processUrl();

	function addListeners() {
		const filterCheckboxes = document.getElementsByName( 'filter' );
		for ( let i = 0; i < filterCheckboxes.length; i++ ) {
			filterCheckboxes[ i ].addEventListener( 'click', updateFiltered );
		}

		$( '#submit' ).on( 'click', () => {
			const username = $( '#username' ).val();
			window.location.href = getPermalink( username );
			processUrl();
		} );

		$( '#username' ).on( 'keyup', ( e ) => {
			const pressedEnter = e.keyCode === 13;
			if ( pressedEnter ) {
				const username = $( '#username' ).val();
				window.location.href = getPermalink( username );
				processUrl();
			}
		} );
	}

	function processUrl() {
		// In the past, we let the hash specify the user, like #user=Example
		if ( window.location.hash && window.location.hash.includes( '#user=' ) ) {
			const username = decodeURIComponent( window.location.hash.replace( /^#user=/, '' ) );
			$( '#username' ).val( username );
			showHistory();
		// Allow the user to be specified in the query string, like ?user=Example
		} else if ( window.location.search.slice( 1 ).includes( 'user=' ) ) {
			const userArgMatch = /&?user=([^&#]*)/.exec( window.location.search.slice( 1 ) );
			if ( userArgMatch && userArgMatch[ 1 ] ) {
				const username = decodeURIComponent( userArgMatch[ 1 ].replace( /\+/g, ' ' ).replace( /_/g, ' ' ) );
				$( '#username' ).val( username );
				showHistory();
			}
		// If no user in the URL, update the browser history and title (normally updated when submitting, but we didn't submit)
		} else {
			document.title = 'AfC Review History';
			$( '#username' ).val( '' );
		}
	}

	function showHistory() {
		const username = $( '#username' ).val();
		$( '#error' ).hide();
		$( '#result' ).hide();
		if ( username === '' ) {
			$( '#error' ).empty();
			$( '#error' ).show();
			$( '#error' ).append( $( '<div>' )
				.addClass( 'errorbox' )
				.text( 'No username specified.' ) );
			return;
		}

		// Clear all table rows but the first
		// (http://stackoverflow.com/a/370031/1757964)
		$( '#result table tr' ).slice( 1 ).remove();

		// Prepare the UI for showing the history
		$( '#statistics' ).empty();
		$( '#submit' )
			.prop( 'disabled', true )
			.text( 'Loading...' );
		$( '#username' )
			.prop( 'disabled', true );
		$( '#result' ).show();

		// Change window title to include the username searched for. Useful in browser history.
		let newTitle = 'AfC Review History';
		if ( username ) {
			newTitle += ' - ' + username;
		}
		document.title = newTitle;

		// Display "start over" link
		$( '#start-over' )
			.empty()
			.append( '(or ' )
			.append( $( '<a>' )
				.attr( 'href', 'index.html' )
				.text( 'start over' ) )
			.append( ')' );

		const baseUrl = API_ROOT + '?action=query&list=usercontribs&ucuser=' + username + '&uclimit=500&ucprop=title|timestamp|comment|tags&ucnamespace=0|5|118&ucshow=!new' + API_SUFFIX;
		const statistics = { afch: 0, accept: 0, decline: 0, reject: 0, comment: 0 };
		query( '&continue=', statistics, baseUrl );
	}

	function query( continueData, statistics, baseUrl ) {
		const queryUrl = baseUrl + continueData;
		$.getJSON( queryUrl, ( data ) => {
			if ( Object.prototype.hasOwnProperty.call( data, 'continue' ) ) {
				display( data, false, statistics );

				// There's some more - recurse
				const newContinueData = '&uccontinue=' + data.continue.uccontinue +
					'&continue=' + data.continue.continue;
				query( newContinueData, statistics, baseUrl );
			} else {
				// Nothing else, so we're done
				display( data, true, statistics );
			}
		} );
	}

	function display( data, done, statistics ) {
		data = data.query.usercontribs;
		$( '#statistics' )
			.text( 'Loaded ' + data.length + ' edits.' + ( done ? ' Almost done!' : '' ) );
		data.forEach( ( edit ) => {
			// pre-June 2025
			const hasAfchEditSummary = /afch|AFCH/.test( edit.comment );
			// post-June 2025
			const hasAfchTag = edit.tags.includes( 'AFCH' );
			if ( !hasAfchEditSummary && !hasAfchTag ) {
				return;
			}
			statistics.afch++;
			const link = 'https://en.wikipedia.org/wiki/' + encodeURIComponent( edit.title );

			// Determine the action
			let action = 'Edited';
			let color = 'none'; // background color
			let noRow = false;
			if ( edit.comment.includes( 'Declining' ) ) {
				action = 'Declined';
				color = 'rgba(255, 200, 200, 0.75)';
				statistics.decline++;
			} else if ( edit.comment.includes( 'Rejecting' ) ) {
				action = 'Rejected';
				color = 'rgba(255, 200, 200, 0.75)';
				statistics.reject++;
			} else if ( /Publishing|Created/.test( edit.comment ) ) {
				action = 'Accepted';
				color = 'rgba(200, 255, 200, 0.75)';
				statistics.accept++;
			} else if ( edit.comment.includes( 'Commenting' ) ) {
				action = 'Commented';
				statistics.comment++;
			} else if ( edit.comment.includes( 'moved' ) ) {
				action = 'Moved';
				noRow = true;
			} else if ( edit.comment.includes( 'Cleaning' ) ) {
				action = 'Cleaned';
				noRow = true;
			}

			if ( !noRow ) {
				$( '#result table' )
					.append( $( '<tr>' )
						.attr( 'data-action', ACTION_FLAGS[ action ] )
						.append( $( '<td>' )
							.append( $( '<a>' )
								.attr( 'href', link )
								.text( edit.title ) ) )
						.append( $( '<td>' )
							.text( edit.timestamp ) )
						.append( $( '<td>' )
							.text( action )
							.css( 'background-color', color ) ) );
			}

			if ( ( statistics.afch % 500 ) === 0 ) {
				$( '#statistics' )
					.text( 'Loaded ' + data.length + ' edits. Examined ' + statistics.afch + ' of them.' );
			}
		} );

		$( '#statistics' ).empty();
		const totalReviews = statistics.accept + statistics.decline + statistics.reject + statistics.comment;
		$( '#statistics' )
			.append( 'Examined ' + numberWithCommas( statistics.afch ) + ' reviews' + ( done ? '' : ' so far' ) + ':' )
			.append( $( '<ul>' )
				.append( $( '<li>' )
					.text( 'Accepts: ' + formatType( statistics.accept, totalReviews ) ) )
				.append( $( '<li>' )
					.text( 'Declines: ' + formatType( statistics.decline, totalReviews ) ) )
				.append( $( '<li>' )
					.text( 'Rejects: ' + formatType( statistics.reject, totalReviews ) ) )
				.append( $( '<li>' )
					.text( 'Comments: ' + formatType( statistics.comment, totalReviews ) ) ) );

		if ( done ) {
			$( '#submit' )
				.prop( 'disabled', false )
				.text( 'Submit' );
			$( '#username' )
				.prop( 'disabled', false );
			updateFiltered();
		}
	}

	function formatType( reviews, totalReviews ) {
		return numberWithCommas( reviews ) + ' (' + ( 100 * reviews / totalReviews ).toFixed( 2 ) + '%)';
	}

	/**
	 * Based on checkboxes, update visibility of rows
	 */
	function updateFiltered() {
		// Get which checkboxes are checked
		const enabledFiltersElements = document.querySelectorAll( 'input[name=filter]:checked' );
		const enabledActions = Array.from( enabledFiltersElements ).map( ( el ) => el.value );

		const rows = document.querySelectorAll( '#draft-list tr' );
		// i = 1 to skip hiding the header row
		for ( let i = 1, n = rows.length; i < n; i++ ) {
			const rowAction = rows[ i ].dataset.action;
			// Show the row if its action is in the enabledActions array
			rows[ i ].style.display = enabledActions.includes( rowAction ) ? '' : 'none';
		}
	}

	/**
	 * Add commas to a number. For example, 1234567 becomes 1,234,567
	 *
	 * @param {number} x The number to format
	 * @return {string} The formatted number with commas
	 * @copyright Elias Zamaria, CC BY-SA 4.0, http://stackoverflow.com/a/2901298/1757964
	 */
	function numberWithCommas( x ) {
		const parts = x.toString().split( '.' );
		parts[ 0 ] = parts[ 0 ].replace( /\B(?=(\d{3})+(?!\d))/g, ',' );
		return parts.join( '.' );
	}

	function getPermalink( username ) {
		// We want what's in the address bar without the ?=___ or #___ stuff
		const permalinkSubstringMatch = /[#?]/.exec( window.location.href );
		let baseLink = window.location.href;
		if ( permalinkSubstringMatch ) {
			baseLink = window.location.href.slice( 0, permalinkSubstringMatch.index );
		}
		const permalink = baseLink + '?user=' + encodeURIComponent( username );
		return permalink;
	}
} );
