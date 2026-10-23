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
 * Whether a starter item already exists, in any status.
 *
 * Not get_posts( 'name' => … ): a query by slug counts as a single-post view,
 * and WordPress empties those of drafts for anyone who cannot edit them — so
 * run without an admin, every draft would look missing and be created again.
 */
function yard_systems_starter_exists( $slug, $post_type ) {
	return null !== get_page_by_path( $slug, OBJECT, $post_type );
}

/**
 * One system from starter/content.php, as written there.
 *
 * @return int|false Its id, or false if it could not be made.
 */
function yard_systems_insert_system( array $system, $menu_order ) {
	$id = wp_insert_post(
		array(
			'post_type'    => 'yard_system',
			'post_status'  => $system['status'],
			'post_name'    => $system['slug'],
			'post_title'   => $system['title'],
			'post_excerpt' => $system['summary'],
			'post_content' => $system['content'],
			'menu_order'   => $menu_order,
		),
		true
	);
	if ( is_wp_error( $id ) ) {
		return false;
	}
	wp_set_object_terms( $id, $system['category'], 'system_category' );
	update_post_meta( $id, 'ys_tier', $system['tier'] );
	update_post_meta( $id, 'ys_sim_id', $system['sim'] );
	foreach ( $system['facts'] as $key => $value ) {
		update_post_meta( $id, $key, $value );
	}
	return $id;
}

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
		if ( ! yard_systems_starter_exists( $system['slug'], 'yard_system' ) && yard_systems_insert_system( $system, ( $order + 1 ) * 10 ) ) {
			++$created;
		}
	}

	// Journal articles go in as drafts: they speak in the owner's voice, so
	// nothing is published under their name until they have read it.
	$journal = require YARD_SYSTEMS_DIR . 'starter/posts.php';
	foreach ( $journal['categories'] as $slug => $name ) {
		if ( ! term_exists( $slug, 'category' ) ) {
			$result = wp_insert_term( $name, 'category', array( 'slug' => $slug ) );
			$created += is_wp_error( $result ) ? 0 : 1;
		}
	}
	foreach ( $journal['posts'] as $post ) {
		if ( yard_systems_starter_exists( $post['slug'], 'post' ) ) {
			continue;
		}
		$term = get_term_by( 'slug', $post['category'], 'category' );
		$id   = wp_insert_post(
			array(
				'post_type'     => 'post',
				'post_status'   => 'draft',
				'post_name'     => $post['slug'],
				'post_title'    => $post['title'],
				'post_excerpt'  => $post['excerpt'],
				'post_content'  => $post['content'],
				'post_category' => $term ? array( $term->term_id ) : array(),
			),
			true
		);
		$created += is_wp_error( $id ) ? 0 : 1;
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
		array( 'shortdesc' => 'Create any missing starter pages, systems, categories and draft articles.' )
	);
}
