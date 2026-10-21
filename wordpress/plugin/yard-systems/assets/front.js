/*
 * "My list": systems a visitor marks on the menu, carried to the inquiry
 * form so they arrive already ticked.
 *
 * Kept in this browser only. If storage is unavailable (private windows,
 * blocked site data) the buttons still toggle for the current page and the
 * form still works; the list just does not follow them around.
 */
( function () {
	const KEY = 'yardSystemsList';
	const started = Date.now();

	function read() {
		try {
			const v = JSON.parse( window.localStorage.getItem( KEY ) || '[]' );
			return Array.isArray( v ) ? v : [];
		} catch ( e ) {
			return [];
		}
	}

	let list = read();

	function write() {
		try {
			window.localStorage.setItem( KEY, JSON.stringify( list ) );
		} catch ( e ) {}
	}

	function has( id ) {
		return list.some( ( item ) => item.id === id );
	}

	function render() {
		document.querySelectorAll( '.ys-want' ).forEach( ( btn ) => {
			btn.setAttribute( 'aria-pressed', has( btn.dataset.id ) ? 'true' : 'false' );
		} );
		document.querySelectorAll( '.ys-form input[name="ys_systems[]"]' ).forEach( ( box ) => {
			box.checked = has( box.value );
		} );
		const bar = document.querySelector( '.ys-listbar' );
		if ( bar ) {
			const onForm = !! document.querySelector( '.ys-form' );
			bar.hidden = ! list.length || onForm;
			const count = bar.querySelector( '.ys-listbar__count' );
			if ( count ) {
				count.textContent = list.length === 1 ? '1 system on your list' : list.length + ' systems on your list';
			}
		}
	}

	function toggle( id, title, on ) {
		list = list.filter( ( item ) => item.id !== id );
		if ( on ) {
			list.push( { id: id, title: title } );
		}
		write();
		render();
	}

	document.addEventListener( 'click', ( e ) => {
		const btn = e.target.closest( '.ys-want' );
		if ( btn ) {
			toggle( btn.dataset.id, btn.dataset.title, ! has( btn.dataset.id ) );
		}
	} );

	document.addEventListener( 'change', ( e ) => {
		const box = e.target.closest( '.ys-form input[name="ys_systems[]"]' );
		if ( box ) {
			toggle( box.value, box.dataset.title, box.checked );
		}
	} );

	document.addEventListener( 'submit', ( e ) => {
		const form = e.target.closest( '.ys-form' );
		if ( form ) {
			form.elements.ys_seconds.value = String( Math.round( ( Date.now() - started ) / 1000 ) );
		}
	} );

	// A sent inquiry has done its job; start the next visit with a clean list.
	if ( new URLSearchParams( window.location.search ).get( 'inquiry' ) === 'sent' ) {
		list = [];
		write();
	}

	render();
} )();
