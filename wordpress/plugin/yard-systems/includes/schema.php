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

/**
 * A meta description and link-preview tags (Open Graph), so a page shared on
 * Facebook, Nextdoor or in a text shows a title, a line of text and a
 * picture rather than a bare URL. Neighbors passing a link along is how a
 * local service gets found.
 *
 * Stands aside when an SEO plugin is active, so the tags are never printed
 * twice.
 */
function yard_systems_seo_plugin_active() {
	$known = array( 'wordpress-seo/', 'seo-by-rank-math/', 'all-in-one-seo-pack/', 'autodescription/', 'smartcrawl-seo/', 'wpmu-dev-seo/' );
	foreach ( (array) get_option( 'active_plugins', array() ) as $plugin ) {
		foreach ( $known as $dir ) {
			if ( 0 === strpos( $plugin, $dir ) ) {
				return true;
			}
		}
	}
	return false;
}

add_action( 'wp_head', function () {
	if ( yard_systems_seo_plugin_active() ) {
		return;
	}

	$title       = is_front_page() ? get_bloginfo( 'name' ) : wp_get_document_title();
	$description = get_bloginfo( 'description' );
	$url         = home_url( '/' );
	$image       = get_site_icon_url( 512 );
	$type        = 'website';

	if ( is_singular() && ! is_front_page() ) {
		$post        = get_queried_object();
		$title       = get_the_title( $post );
		$description = has_excerpt( $post ) ? get_the_excerpt( $post ) : wp_trim_words( wp_strip_all_tags( strip_shortcodes( $post->post_content ) ), 30 );
		$url         = get_permalink( $post );
		$type        = 'post' === $post->post_type ? 'article' : 'website';
		if ( has_post_thumbnail( $post ) ) {
			$image = get_the_post_thumbnail_url( $post, 'large' );
		}
	} elseif ( is_post_type_archive( 'yard_system' ) ) {
		$description = __( 'Every system running or tried in one Ann Arbor yard, with what it costs, the space and time it takes, and how it actually did.', 'yard-systems' );
		$url         = get_post_type_archive_link( 'yard_system' );
	} elseif ( ! is_front_page() ) {
		return;
	}

	// Never let an unfinished placeholder become the line people see.
	if ( false !== strpos( $description, YARD_SYSTEMS_PLACEHOLDER ) ) {
		$description = get_bloginfo( 'description' );
	}

	$tags = array(
		'description'    => $description,
		'og:type'        => $type,
		'og:site_name'   => get_bloginfo( 'name' ),
		'og:title'       => $title,
		'og:description' => $description,
		'og:url'         => $url,
	);
	if ( $image ) {
		$tags['og:image'] = $image;
	}
	$tags['twitter:card'] = $image && is_singular() ? 'summary_large_image' : 'summary';

	foreach ( $tags as $key => $value ) {
		if ( '' === (string) $value ) {
			continue;
		}
		$attr = 0 === strpos( $key, 'og:' ) ? 'property' : 'name';
		printf( '<meta %s="%s" content="%s" />' . "\n", $attr, esc_attr( $key ), esc_attr( wp_strip_all_tags( $value ) ) );
	}
}, 5 );
