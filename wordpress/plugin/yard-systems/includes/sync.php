<?php
/**
 * Statuses from the simulator.
 *
 * The simulator is where results get recorded: a system is marked as having
 * worked, partly worked or failed there, in the browser, with no server. So
 * the simulator pushes, and this receives. Each website system names the
 * simulator system it follows (`ys_sim_id`); a push sets its tier, and a
 * system that the simulator says has been tested in the yard is published,
 * because "is this in the yard?" is exactly what that answers.
 *
 * Publishing never runs the other way. A system marked untested again keeps
 * whatever status it has here; the tier on it changes, nothing disappears.
 *
 * Authenticated by a site-specific key, shown in Settings → Yard site, that
 * can do nothing but this. The REST API's own CORS handling lets the
 * simulator call it from its own address.
 */

defined( 'ABSPATH' ) || exit;

/**
 * Simulator tier → website tier.
 */
function yard_systems_sim_tiers() {
	return array(
		'experimental'  => 'unproven',
		'researched'    => 'researched',
		'testedFailed'  => 'failed',
		'testedPartial' => 'partial',
		'testedSuccess' => 'works',
	);
}

function yard_systems_sync_key( $regenerate = false ) {
	$key = (string) get_option( 'yard_systems_sync_key' );
	if ( '' === $key || $regenerate ) {
		$key = wp_generate_password( 32, false, false );
		update_option( 'yard_systems_sync_key', $key, false );
	}
	return $key;
}

add_action( 'rest_api_init', function () {
	register_rest_route(
		'yard-systems/v1',
		'/statuses',
		array(
			'methods'             => 'POST',
			'callback'            => 'yard_systems_receive_statuses',
			'permission_callback' => function ( WP_REST_Request $request ) {
				$given = (string) $request->get_param( 'key' );
				return '' !== $given && hash_equals( yard_systems_sync_key(), $given );
			},
			'args'                => array(
				'key'      => array( 'type' => 'string', 'required' => true ),
				'statuses' => array( 'type' => 'object', 'default' => array() ),
			),
		)
	);
} );

/**
 * An empty `statuses` changes nothing and reports the current state, which
 * is how the simulator checks a key before trusting it.
 */
function yard_systems_receive_statuses( WP_REST_Request $request ) {
	// The key has been checked. Saving as an administrator keeps WordPress
	// from re-filtering the stored system pages being published; nothing
	// from the request is written but tiers from a fixed list.
	$admins = get_users( array( 'role' => 'administrator', 'number' => 1, 'fields' => 'ID' ) );
	if ( $admins ) {
		wp_set_current_user( (int) $admins[0] );
	}

	$incoming = (array) $request->get_param( 'statuses' );
	$map      = yard_systems_sim_tiers();
	$tiers    = yard_systems_tiers();
	$changed  = array();
	$systems  = array();

	$posts = get_posts(
		array(
			'post_type'      => 'yard_system',
			'post_status'    => array( 'publish', 'draft', 'pending', 'private' ),
			'posts_per_page' => 200,
			'orderby'        => 'menu_order',
			'order'          => 'ASC',
		)
	);

	foreach ( $posts as $post ) {
		$sim_id = (string) get_post_meta( $post->ID, 'ys_sim_id', true );
		$before = yard_systems_tier( $post->ID );
		$status = $post->post_status;

		if ( '' !== $sim_id && isset( $incoming[ $sim_id ], $map[ $incoming[ $sim_id ] ] ) ) {
			$after = $map[ $incoming[ $sim_id ] ];
			$notes = array();

			if ( $after !== $before ) {
				update_post_meta( $post->ID, 'ys_tier', $after );
				$notes[] = sprintf( '%s → %s', $tiers[ $before ]['label'], $tiers[ $after ]['label'] );
			}

			$tested = in_array( $after, array( 'works', 'partial', 'failed' ), true );
			if ( $tested && 'publish' !== $status ) {
				wp_update_post(
					array(
						'ID'           => $post->ID,
						'post_status'  => 'publish',
						'post_content' => yard_systems_strip_placeholders( $post->post_content ),
					)
				);
				$status  = 'publish';
				$notes[] = __( 'published', 'yard-systems' );
			} elseif ( $notes ) {
				// Touch the post so anything that caches pages on save sees it.
				wp_update_post( array( 'ID' => $post->ID ) );
			}

			if ( $notes ) {
				$changed[] = array(
					'title'  => yard_systems_plain_title( $post ),
					'change' => implode( ', ', $notes ),
				);
			}
		}

		$systems[] = array(
			'title'  => yard_systems_plain_title( $post ),
			'sim'    => $sim_id,
			'tier'   => yard_systems_tier( $post->ID ),
			'status' => $status,
		);
	}

	if ( $changed ) {
		yard_systems_clear_page_caches();
	}

	return array(
		'site'    => get_bloginfo( 'name' ),
		'url'     => home_url( '/' ),
		'changed' => $changed,
		'systems' => $systems,
	);
}

/**
 * Titles go out as JSON for the simulator to show as text, not HTML.
 */
function yard_systems_plain_title( $post ) {
	return html_entity_decode( get_the_title( $post ), ENT_QUOTES, 'UTF-8' );
}

/**
 * The prompts left in a system for its owner ("Is this in your yard? Set the
 * tier, then publish.") are answered by the push that publishes it, so they
 * go rather than appear on the page.
 */
function yard_systems_strip_placeholders( $content ) {
	return preg_replace(
		'#<!-- wp:paragraph -->\s*<p>\[\[YOU:[^\]]*\]\]</p>\s*<!-- /wp:paragraph -->\s*#u',
		'',
		$content
	);
}

/**
 * Status changes show on the menu, the home page and the system's own page,
 * so the whole page cache goes, not one URL.
 */
function yard_systems_clear_page_caches() {
	do_action( 'wphb_clear_page_cache' );
	if ( function_exists( 'wp_cache_flush' ) ) {
		wp_cache_flush();
	}
	/**
	 * For a host whose static cache needs its own call.
	 */
	do_action( 'yard_systems_clear_page_caches' );
}
