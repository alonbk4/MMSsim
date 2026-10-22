<?php
/**
 * Three server-rendered blocks: the menu, the facts panel on a system, and
 * the inquiry form. They render in PHP so they always reflect the systems as
 * they are now, and need no build step to edit.
 */

defined( 'ABSPATH' ) || exit;

add_action( 'init', function () {
	wp_register_style( 'yard-systems', YARD_SYSTEMS_URL . 'assets/front.css', array(), YARD_SYSTEMS_VERSION );
	wp_register_script( 'yard-systems', YARD_SYSTEMS_URL . 'assets/front.js', array(), YARD_SYSTEMS_VERSION, array( 'in_footer' => true, 'strategy' => 'defer' ) );
	wp_register_script(
		'yard-systems-editor',
		YARD_SYSTEMS_URL . 'assets/editor.js',
		array( 'wp-blocks', 'wp-element', 'wp-server-side-render', 'wp-block-editor' ),
		YARD_SYSTEMS_VERSION,
		true
	);

	foreach ( array( 'system-menu', 'system-facts', 'system-art', 'inquiry-form' ) as $block ) {
		register_block_type( YARD_SYSTEMS_DIR . 'blocks/' . $block );
	}
} );

/**
 * The list a visitor builds on the menu follows them around the site, so the
 * script and the bar that shows it load everywhere, not only where a block is.
 */
add_action( 'wp_enqueue_scripts', function () {
	wp_enqueue_style( 'yard-systems' );
	wp_enqueue_script( 'yard-systems' );
} );

add_action( 'wp_footer', function () {
	printf(
		'<div class="ys-listbar" hidden><a href="%s"><span class="ys-listbar__n"></span><span class="ys-listbar__count"></span><span class="ys-listbar__go">%s</span></a></div>',
		esc_url( yard_systems_inquiry_url() ),
		esc_html__( 'Ask about them →', 'yard-systems' )
	);
} );

/**
 * Where "ask about this" goes: the page the starter content made for the
 * form, else a page at /work-with-me/.
 */
function yard_systems_inquiry_url() {
	$page = (int) get_option( 'yard_systems_inquiry_page' );
	if ( $page && 'publish' === get_post_status( $page ) ) {
		return get_permalink( $page ) . '#inquiry';
	}
	return home_url( '/work-with-me/#inquiry' );
}

function yard_systems_tier_badge( $post_id ) {
	$tier = yard_systems_tier( $post_id );
	return sprintf(
		'<span class="ys-tier ys-tier--%s"><span class="ys-tier__dot" aria-hidden="true"></span>%s</span>',
		esc_attr( $tier ),
		esc_html( yard_systems_tiers()[ $tier ]['label'] )
	);
}

function yard_systems_want_button( $post_id ) {
	if ( ! yard_systems_is_offered( $post_id ) ) {
		return '<span class="ys-not-offered">' . esc_html__( 'Not offered — it didn’t work here', 'yard-systems' ) . '</span>';
	}
	return sprintf(
		'<button type="button" class="ys-want" data-id="%d" data-title="%s" aria-pressed="false"><span class="ys-want__add">%s</span><span class="ys-want__added">%s</span></button>',
		(int) $post_id,
		esc_attr( get_the_title( $post_id ) ),
		esc_html__( 'Add to my list', 'yard-systems' ),
		esc_html__( 'On my list', 'yard-systems' )
	);
}
