<?php
/**
 * Tells search engines this is a local service business and which towns it
 * serves, which is most of what "near me" searches are matched on.
 *
 * It is a service-area business: no street address is published, because the
 * yard is also a home. Visits are arranged after someone gets in touch.
 */

defined( 'ABSPATH' ) || exit;

add_action( 'wp_head', function () {
	if ( ! is_front_page() ) {
		return;
	}
	$data = array(
		'@context'    => 'https://schema.org',
		'@type'       => 'HomeAndConstructionBusiness',
		'name'        => get_bloginfo( 'name' ),
		'description' => get_bloginfo( 'description' ),
		'url'         => home_url( '/' ),
		'areaServed'  => array_map(
			function ( $town ) {
				return array( '@type' => 'City', 'name' => $town . ', MI' );
			},
			yard_systems_service_area()
		),
	);
	$logo = get_site_icon_url( 512 );
	if ( $logo ) {
		$data['image'] = $logo;
	}
	echo '<script type="application/ld+json">' . wp_json_encode( $data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . "</script>\n";
} );
