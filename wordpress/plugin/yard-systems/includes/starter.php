<?php
/**
 * Lays down the starter content: categories, pages, systems, and the
 * settings that make the home page and the journal work.
 *
 * Additive and idempotent. It looks everything up by slug and creates only
 * what is missing, so running it again after editing never overwrites a
 * word. The content itself is in starter/content.php.
 */

defined( 'ABSPATH' ) || exit;

/**
 * @return int Number of items created.
 */
function yard_systems_install_starter() {
	$content = require YARD_SYSTEMS_DIR . 'starter/content.php';
	$created = 0;

	foreach ( $content['categories'] as $slug => $cat ) {
		if ( ! term_exists( $slug, 'system_category' ) ) {
			$result = wp_insert_term( $cat['name'], 'system_category', array( 'slug' => $slug, 'description' => $cat['description'] ) );
			$created += is_wp_error( $result ) ? 0 : 1;
		}
	}

	$page_ids = array();
	foreach ( $content['pages'] as $slug => $page ) {
		$existing = get_page_by_path( $slug, OBJECT, 'page' );
		if ( $existing ) {
			$page_ids[ $slug ] = $existing->ID;
			continue;
		}
		$id = wp_insert_post(
			array(
				'post_type'    => 'page',
				'post_status'  => 'publish',
				'post_name'    => $slug,
				'post_title'   => $page['title'],
				'post_content' => $page['content'],
				'post_excerpt' => $page['excerpt'] ?? '',
				'menu_order'   => $page['order'] ?? 0,
			),
			true
		);
		if ( ! is_wp_error( $id ) ) {
			$page_ids[ $slug ] = $id;
			++$created;
		}
	}

	foreach ( $content['systems'] as $order => $system ) {
		$found = get_posts(
			array(
				'post_type'      => 'yard_system',
				'name'           => $system['slug'],
				'post_status'    => 'any',
				'posts_per_page' => 1,
				'fields'         => 'ids',
			)
		);
		if ( $found ) {
			continue;
		}
		$id = wp_insert_post(
			array(
				'post_type'    => 'yard_system',
				'post_status'  => $system['status'],
				'post_name'    => $system['slug'],
				'post_title'   => $system['title'],
				'post_excerpt' => $system['summary'],
				'post_content' => $system['content'],
				'menu_order'   => ( $order + 1 ) * 10,
			),
			true
		);
		if ( is_wp_error( $id ) ) {
			continue;
		}
		++$created;
		wp_set_object_terms( $id, $system['category'], 'system_category' );
		update_post_meta( $id, 'ys_tier', $system['tier'] );
		foreach ( $system['facts'] as $key => $value ) {
			update_post_meta( $id, $key, $value );
		}
	}

	// Site settings, each only when still at WordPress's own default.
	if ( isset( $page_ids['home'], $page_ids['journal'] ) && ! (int) get_option( 'page_on_front' ) ) {
		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $page_ids['home'] );
		update_option( 'page_for_posts', $page_ids['journal'] );
	}
	if ( isset( $page_ids['work-with-me'] ) && ! get_option( 'yard_systems_inquiry_page' ) ) {
		update_option( 'yard_systems_inquiry_page', $page_ids['work-with-me'] );
	}
	if ( '' === get_option( 'blogdescription' ) || 'Just another WordPress site' === get_option( 'blogdescription' ) ) {
		update_option( 'blogdescription', $content['tagline'] );
	}
	if ( '' === (string) get_option( 'permalink_structure' ) ) {
		update_option( 'permalink_structure', '/%postname%/' );
	}
	flush_rewrite_rules();

	return $created;
}

if ( defined( 'WP_CLI' ) && WP_CLI ) {
	WP_CLI::add_command(
		'yard-starter',
		function () {
			$created = yard_systems_install_starter();
			WP_CLI::success( sprintf( 'Starter content: %d new items; existing ones left alone.', $created ) );
		},
		array( 'shortdesc' => 'Create any missing starter pages, categories and systems.' )
	);
}
