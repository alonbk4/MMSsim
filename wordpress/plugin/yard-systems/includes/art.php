<?php
/**
 * The picture for a system: its photo when it has one, and until then an
 * illustrated tile with the system's own mark, coloured by category.
 *
 * Every card and system page goes through here, so adding a featured image
 * in the dashboard is all it takes to swap the drawing for the real thing.
 */

defined( 'ABSPATH' ) || exit;

require_once __DIR__ . '/glyph-paths.php';

/**
 * Which mark each starter system uses. A system added later can set its own
 * with an `ys_glyph` custom field naming any mark in glyph-paths.php;
 * anything else falls back to its category's mark.
 */
function yard_systems_glyph_name( $post_id ) {
	$own = get_post_meta( $post_id, 'ys_glyph', true );
	if ( $own && isset( yard_systems_glyph_paths()[ $own ] ) ) {
		return $own;
	}
	$by_slug = array(
		'hot-composter'   => 'aerobin',
		'biochar'         => 'kiln',
		'aquaponics'      => 'fish',
		'nettle-feed'     => 'nettle',
		'banana-peel-tea' => 'jar',
		'hanging-peppers' => 'hangbag',
		'felt-grow-bags'  => 'growbag',
		'worm-tea'        => 'brew',
		'rain-garden'     => 'raingarden',
		'rain-tank'       => 'tank',
		'bucket-drip'     => 'bucketdrip',
		'trellises'       => 'trellis',
	);
	$slug = get_post_field( 'post_name', $post_id );
	if ( isset( $by_slug[ $slug ] ) ) {
		return $by_slug[ $slug ];
	}
	$by_category = array( 'water' => 'droplet', 'food' => 'leaf', 'soil' => 'compost' );
	return $by_category[ yard_systems_category_slug( $post_id ) ] ?? 'leaf';
}

function yard_systems_category( $post_id ) {
	$terms = get_the_terms( $post_id, 'system_category' );
	return $terms && ! is_wp_error( $terms ) ? $terms[0] : null;
}

function yard_systems_category_slug( $post_id ) {
	$term = yard_systems_category( $post_id );
	return $term ? $term->slug : '';
}

function yard_systems_glyph_svg( $name, $class = '' ) {
	$paths = yard_systems_glyph_paths()[ $name ] ?? yard_systems_glyph_paths()['leaf'];
	return sprintf(
		'<svg class="%s" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">%s</svg>',
		esc_attr( trim( 'ys-glyph ' . $class ) ),
		$paths // Static markup from glyph-paths.php.
	);
}

/**
 * Specimen number, from the menu order the starter content sets (10, 20…),
 * so the cards read like plates in a field guide.
 */
function yard_systems_specimen_number( $post_id ) {
	$order = (int) get_post_field( 'menu_order', $post_id );
	return $order > 0 ? sprintf( '%02d', (int) ceil( $order / 10 ) ) : '';
}

/**
 * @param string $size 'card' or 'hero'.
 */
function yard_systems_art( $post_id, $size = 'card' ) {
	$category = yard_systems_category_slug( $post_id );
	if ( has_post_thumbnail( $post_id ) ) {
		return sprintf(
			'<div class="ys-art ys-art--photo ys-art--%1$s">%2$s</div>',
			esc_attr( $size ),
			get_the_post_thumbnail( $post_id, 'hero' === $size ? 'large' : 'medium_large', array( 'loading' => 'hero' === $size ? 'eager' : 'lazy' ) )
		);
	}
	$number = yard_systems_specimen_number( $post_id );
	return sprintf(
		'<div class="ys-art ys-art--drawn ys-art--%1$s ys-art--cat-%2$s">%3$s%4$s</div>',
		esc_attr( $size ),
		esc_attr( $category ? $category : 'none' ),
		yard_systems_glyph_svg( yard_systems_glyph_name( $post_id ) ),
		$number ? '<span class="ys-art__no">No. ' . esc_html( $number ) . '</span>' : ''
	);
}
