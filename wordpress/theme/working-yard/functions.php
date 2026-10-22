<?php
/**
 * Working Yard theme. The look lives in theme.json and style.css; this loads
 * the stylesheet, preloads the two faces every page uses, and gives patterns
 * a way to inline the theme's drawings.
 */

defined( 'ABSPATH' ) || exit;

add_action( 'wp_enqueue_scripts', function () {
	wp_enqueue_style( 'working-yard', get_stylesheet_uri(), array(), wp_get_theme()->get( 'Version' ) );
} );

// Without these the first paint uses fallback fonts and reflows when the real
// ones land, which is most visible in the large display headings.
add_action( 'wp_head', function () {
	foreach ( array( 'fraunces-latin-full-normal', 'instrument-sans-latin-wght-normal' ) as $font ) {
		printf(
			'<link rel="preload" href="%s" as="font" type="font/woff2" crossorigin />' . "\n",
			esc_url( get_theme_file_uri( "assets/fonts/{$font}.woff2" ) )
		);
	}
}, 1 );

add_action( 'init', function () {
	register_block_pattern_category( 'working-yard', array( 'label' => __( 'Working Yard', 'working-yard' ) ) );
	// Page headers show the page's summary under its title.
	add_post_type_support( 'page', 'excerpt' );
} );

// A class per page slug, so a page can be styled on its own (the numbered
// sections on Principles) without a template of its own.
add_filter( 'body_class', function ( $classes ) {
	if ( is_page() ) {
		$classes[] = 'wy-page-' . sanitize_html_class( get_post_field( 'post_name', get_queried_object_id() ) );
	}
	return $classes;
} );

add_action( 'after_setup_theme', function () {
	add_editor_style( 'style.css' );
} );

/**
 * One of the theme's SVG drawings, for inlining in a pattern so its colours
 * follow the stylesheet.
 */
function working_yard_svg( $name ) {
	$file = get_theme_file_path( "assets/{$name}.svg" );
	return is_readable( $file ) ? file_get_contents( $file ) : ''; // phpcs:ignore WordPress.WP.AlternativeFunctions
}

/**
 * The brand mark: a loop with a leaf in it, the yard in one drawing.
 */
function working_yard_mark() {
	return '<svg class="wy-mark" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M33.5 20A13.5 13.5 0 0 1 11 30.1"/><path d="M6.5 20A13.5 13.5 0 0 1 29 9.9"/><path d="M29.4 4.6l-.4 5.3-5.2-.6"/><path d="M10.6 35.4l.4-5.3 5.2.6"/><path class="wy-mark__leaf" d="M26 13.6c0 7.4-4.6 11.6-10.8 11.6 0-6.6 4.2-11.6 10.8-11.6z"/><path d="M13.4 27.4c3.2-3.4 6.4-6 9.6-7.6"/></svg>';
}
