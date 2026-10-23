<?php
/**
 * The simulator talking to the site.
 *
 * The simulator is where results get recorded, in the yard log (log.php),
 * and it has no server of its own. So it pushes, and this receives: its copy
 * of the log, and every system's tier. Each website system names the
 * simulator system it follows (`ys_sim_id`); a push sets its tier, and a
 * system that has now been tested in the yard is published, because "is
 * this in the yard?" is exactly what that answers.
 *
 * Publishing never runs the other way. A system marked untested again keeps
 * whatever status it has here; the tier on it changes, nothing disappears.
 *
 * Authenticated by a site-specific key, shown in Settings → Yard site, that
 * can set tiers, add to the yard log and send its photos, and nothing else.
 * The REST API's own CORS handling lets the simulator call it from its own
 * address.
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

/**
 * Whether a request carries this site's key.
 */
function yard_systems_key_ok( WP_REST_Request $request ) {
	$given = (string) $request->get_param( 'key' );
	return '' !== $given && hash_equals( yard_systems_sync_key(), $given );
}

/**
 * The key has been checked by then. Saving as an administrator keeps
 * WordPress from re-filtering the stored system pages being published;
 * nothing from a request is written into a page but tiers from a fixed list.
 */
function yard_systems_act_as_admin() {
	$admins = get_users( array( 'role' => 'administrator', 'number' => 1, 'fields' => 'ID' ) );
	if ( $admins ) {
		wp_set_current_user( (int) $admins[0] );
	}
}

/**
 * The simulator systems a website system follows. The first sets its tier;
 * the yard log of all of them shows on its page, for a website system that
 * is more than one thing in the simulator (biochar: the kiln, and the tote
 * it is charged in).
 *
 * @return string[]
 */
function yard_systems_sim_ids( $post_id ) {
	return array_values( array_filter( preg_split( '/[\s,]+/', (string) get_post_meta( $post_id, 'ys_sim_id', true ) ) ) );
}

/**
 * What was typed into the Simulator system field, as ids separated by spaces.
 */
function yard_systems_clean_sim_ids( $raw ) {
	return implode( ' ', array_unique( array_filter( array_map( 'sanitize_key', preg_split( '/[\s,]+/', (string) $raw ) ) ) ) );
}

add_action( 'rest_api_init', function () {
	// What the simulator sent before there was a yard log; still answered,
	// for a device that has not loaded the newer simulator yet.
	register_rest_route(
		'yard-systems/v1',
		'/statuses',
		array(
			'methods'             => 'POST',
			'callback'            => 'yard_systems_receive_statuses',
			'permission_callback' => 'yard_systems_key_ok',
			'args'                => array(
				'key'      => array( 'type' => 'string', 'required' => true ),
				'statuses' => array( 'type' => 'object', 'default' => array() ),
			),
		)
	);
	register_rest_route(
		'yard-systems/v1',
		'/sync',
		array(
			'methods'             => 'POST',
			'callback'            => 'yard_systems_sync',
			'permission_callback' => 'yard_systems_key_ok',
			'args'                => array(
				'key'      => array( 'type' => 'string', 'required' => true ),
				'statuses' => array( 'type' => 'object', 'default' => array() ),
				'entries'  => array( 'type' => 'array', 'default' => array() ),
			),
		)
	);
	register_rest_route(
		'yard-systems/v1',
		'/photo',
		array(
			'methods'             => 'POST',
			'callback'            => 'yard_systems_receive_photo',
			'permission_callback' => 'yard_systems_key_ok',
			'args'                => array(
				'key'   => array( 'type' => 'string', 'required' => true ),
				'entry' => array( 'type' => 'string', 'required' => true ),
			),
		)
	);
} );

/**
 * An empty `statuses` changes nothing and reports the current state, which
 * is how the simulator checks a key before trusting it.
 */
function yard_systems_receive_statuses( WP_REST_Request $request ) {
	yard_systems_act_as_admin();
	list( $changed, $systems ) = yard_systems_apply_statuses( (array) $request->get_param( 'statuses' ), true );
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
 * Everything at once: a device's copy of the yard log and its statuses in,
 * the whole log and what changed out.
 */
function yard_systems_sync( WP_REST_Request $request ) {
	yard_systems_act_as_admin();
	list( $saved, $public ) = yard_systems_merge_log( (array) $request->get_param( 'entries' ) );
	list( $changed, $systems ) = yard_systems_apply_statuses( (array) $request->get_param( 'statuses' ), false );
	if ( $changed || $public ) {
		yard_systems_clear_page_caches();
	}
	yard_systems_tidy_log_photos();
	return array(
		'site'    => get_bloginfo( 'name' ),
		'url'     => home_url( '/' ),
		'changed' => $changed,
		'saved'   => $saved,
		'systems' => $systems,
		'entries' => yard_systems_log_for_devices(),
	);
}

/**
 * Set each website system's tier from the simulator system it follows.
 *
 * A tested tier comes from the yard log: it is the same record on every
 * device, where a device's statuses are only what that device last knew. A
 * device that has not yet heard an entry was deleted still says "works",
 * and is not believed. The statuses sent decide the untested tiers
 * (researched, unproven), and the tested ones only for a simulator from
 * before the log, for systems the log has never mentioned.
 *
 * @param bool $legacy Statuses from a simulator from before the log.
 * @return array{0:array,1:array} What changed, and every system as it now is.
 */
function yard_systems_apply_statuses( array $incoming, $legacy ) {
	$map     = yard_systems_sim_tiers();
	$tiers   = yard_systems_tiers();
	$results = yard_systems_log_results();
	$changed = array();
	$systems = array();

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
		$ids     = yard_systems_sim_ids( $post->ID );
		$sim_id  = $ids[0] ?? '';
		$sim_set = null;
		if ( '' !== $sim_id ) {
			$sent = isset( $incoming[ $sim_id ] ) && is_string( $incoming[ $sim_id ] ) && isset( $map[ $incoming[ $sim_id ] ] ) ? $incoming[ $sim_id ] : null;
			if ( ! empty( $results[ $sim_id ] ) ) {
				$sim_set = $results[ $sim_id ];
			} elseif ( $sent && ( ! in_array( $sent, YARD_SYSTEMS_LOG_RESULTS, true ) || ( $legacy && ! array_key_exists( $sim_id, $results ) ) ) ) {
				$sim_set = $sent;
			}
		}
		$before = yard_systems_tier( $post->ID );
		$status = $post->post_status;

		if ( null !== $sim_set ) {
			$after = $map[ $sim_set ];
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
			'sims'   => $ids,
			'tier'   => yard_systems_tier( $post->ID ),
			'status' => $status,
		);
	}

	return array( $changed, $systems );
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
