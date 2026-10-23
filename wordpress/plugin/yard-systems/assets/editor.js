/*
 * The blocks render on the server; the editor shows that same render.
 * Titles, icons and attributes come from each block.json.
 */
( function ( wp ) {
	const el = wp.element.createElement;
	const ServerSideRender = wp.serverSideRender;
	const { useBlockProps } = wp.blockEditor;

	[ 'yard-systems/system-menu', 'yard-systems/system-facts', 'yard-systems/system-art', 'yard-systems/system-log', 'yard-systems/inquiry-form' ].forEach( function ( name ) {
		wp.blocks.registerBlockType( name, {
			edit: function ( props ) {
				return el(
					'div',
					useBlockProps(),
					el( ServerSideRender, { block: name, attributes: props.attributes, urlQueryArgs: props.context && props.context.postId ? { post_id: props.context.postId } : {} } )
				);
			},
			save: function () {
				return null;
			},
		} );
	} );
} )( window.wp );
