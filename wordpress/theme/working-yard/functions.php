<?php
/**
 * Working Yard theme. Everything about the look is in theme.json; this only
 * loads the small stylesheet and names the pattern category.
 */

defined( 'ABSPATH' ) || exit;

add_action( 'wp_enqueue_scripts', function () {
	wp_enqueue_style( 'working-yard', get_stylesheet_uri(), array(), wp_get_theme()->get( 'Version' ) );
} );

add_action( 'init', function () {
	register_block_pattern_category( 'working-yard', array( 'label' => __( 'Working Yard', 'working-yard' ) ) );
} );

// Editor gets the same small stylesheet so the steps and eyebrows look right.
add_action( 'after_setup_theme', function () {
	add_editor_style( 'style.css' );
} );
