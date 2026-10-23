<?php
/**
 * Content updates for a site that is already running.
 *
 * The starter content only ever adds what is missing, so text written into
 * it later never reaches a site installed before. These updates carry it
 * there, carefully: each one swaps a passage only while the original is
 * still there word for word. Anything the owner has edited since is left
 * alone and reported as skipped.
 *
 * Each batch runs once; the last one applied is kept in an option.
 */

defined( 'ABSPATH' ) || exit;

function yard_systems_content_updates() {
	$a = require YARD_SYSTEMS_DIR . 'starter/answers.php';

	return array(
		// The owner's answers to the starter content's open questions.
		1 => array(
			'text'   => array(
				array( 'page', 'the-yard', '[[YOU: Two or three sentences on who you are, how long you’ve been in Ann Arbor, and what got you started on this yard. Plain is better than polished.]]', $a['story'] ),
				array( 'page', 'the-yard', 'An insulated hot composter fed by the kitchen. Biochar, made from woody waste and soaked until it is ready for soil. An aquaponics system built in an IBC tote, whose water ends up feeding half of the others. A nettle patch for fermented plant feed. Hanging peppers on a timed drip. [[YOU: Check this list against the yard and add what’s missing.]]', $a['running'] ),
				array( 'page', 'the-yard', '[[YOU: Anything else that failed or surprised you. This is the paragraph people trust the most.]]', $a['surprise'] ),
				array( 'page', 'work-with-me', '[[YOU: What this visit costs, or that the first one is free. Publishing a price filters out people who aren’t serious and reassures the ones who are.]]', $a['first_visit'] ),
				array( 'page', 'work-with-me', '[[YOU: Say what you build yourself and what you teach the owner to build. If you install for pay, check what Michigan licensing that needs first.]]', $a['build'] ),
				array( 'page', 'visit', '[[YOU: How long a visit runs, how many people at once, whether kids and dogs are welcome, and whether there is a fee.]]', $a['visits'] ),
				array( 'yard_system', 'aquaponics', 'It had a rough start with the fingerlings. By June 2026 it was stable and has run reliably since. [[YOU: Say what went wrong at the start and what fixed it — that’s the part a buyer most needs.]]', $a['aquaponics_start'] ),
				array( 'yard_system', 'aquaponics', '[[YOU: Where yours runs in winter, and how you keep the water warm enough.]]', $a['aquaponics_winter'] ),
				array( 'yard_system', 'biochar', 'I made a batch in August 2026, crushed it, and charged it in a 27-gallon tote with diluted urine and water from the aquaponics tank. Then it went into the hot composter.', $a['biochar_system'] ),
				array( 'post', 'charge-your-biochar', 'The fix is to fill the char before it reaches the soil. In August 2026 I made a batch, crushed it, and soaked it in a 27-gallon tote with diluted urine and water from my aquaponics tank. Then it went into the hot composter, where it keeps soaking up nutrients as the compost breaks down. [[YOU: How you made the char (kiln, cone pit, barrel?) and how long it soaked.]]', $a['biochar_article'] ),
			),
			'meta'   => array(
				array( 'aquaponics', 'ys_season', $a['aquaponics_season'] ),
			),
			'name'   => $a['name'],
		),

		// Which simulator system each starter system follows, for the sync.
		2 => array(
			'text' => array(),
			'meta' => array(
				array( 'hot-composter', 'ys_sim_id', 'aerobin' ),
				array( 'biochar', 'ys_sim_id', 'biochar-kiln' ),
				array( 'aquaponics', 'ys_sim_id', 'aquaponics' ),
				array( 'nettle-feed', 'ys_sim_id', 'nettle-patch' ),
				array( 'banana-peel-tea', 'ys_sim_id', 'banana-peel-tea' ),
				array( 'hanging-peppers', 'ys_sim_id', 'upside-down-planters' ),
				array( 'felt-grow-bags', 'ys_sim_id', 'felt-grow-bags' ),
				array( 'worm-tea', 'ys_sim_id', 'worm-tea-brewer' ),
				array( 'rain-garden', 'ys_sim_id', 'rain-garden' ),
				array( 'rain-tank', 'ys_sim_id', 'first-flush' ),
				array( 'bucket-drip', 'ys_sim_id', 'chapin-bucket' ),
				array( 'trellises', 'ys_sim_id', 'grow-trellis' ),
			),
		),

		// Biochar is two systems in the simulator, the kiln and the tote it
		// is charged in, and the yard log of both belongs on its page.
		3 => array(
			'text' => array(),
			'meta' => array(
				array( 'biochar', 'ys_sim_id', 'biochar-kiln biochar-tote', 'biochar-kiln' ),
			),
		),

		// More website systems that are several in the simulator. The rain
		// tank's status follows the tank, not the diverter on its inlet.
		4 => array(
			'text' => array(),
			'meta' => array(
				array( 'rain-tank', 'ys_sim_id', 'poly-tank first-flush roof-catchment', 'first-flush' ),
				array( 'hanging-peppers', 'ys_sim_id', 'upside-down-planters pump-drip-kit', 'upside-down-planters' ),
				array( 'hot-composter', 'ys_sim_id', 'aerobin food-recycler', 'aerobin' ),
			),
		),
	);
}

/**
 * Apply every batch not yet applied.
 *
 * @return string[] What happened, one line per change, for the CLI.
 */
function yard_systems_run_content_updates() {
	$done = (int) get_option( 'yard_systems_content_version', 0 );
	$log  = array();

	foreach ( yard_systems_content_updates() as $version => $batch ) {
		if ( $version <= $done ) {
			continue;
		}

		foreach ( $batch['text'] as list( $type, $slug, $find, $replace ) ) {
			$post = get_page_by_path( $slug, OBJECT, $type );
			if ( ! $post ) {
				$log[] = "skipped {$type} {$slug}: not on this site";
				continue;
			}
			if ( false === strpos( $post->post_content, $find ) ) {
				$log[] = "skipped {$type} {$slug}: already edited";
				continue;
			}
			wp_update_post(
				array(
					'ID'           => $post->ID,
					'post_content' => str_replace( $find, $replace, $post->post_content ),
				)
			);
			$log[] = "updated {$type} {$slug}";
		}

		// A value is set while the field still holds what it is expected to
		// (nothing, unless a fourth item says what), never over an edit.
		foreach ( $batch['meta'] ?? array() as $item ) {
			list( $slug, $key, $value, $was ) = array_pad( $item, 4, '' );
			$post = get_page_by_path( $slug, OBJECT, 'yard_system' );
			if ( $post && $was === (string) get_post_meta( $post->ID, $key, true ) ) {
				update_post_meta( $post->ID, $key, $value );
				$log[] = "set {$key} on {$slug}";
			}
		}

		// The site's name, only while it is still the address it was
		// installed under (or WordPress's own default).
		if ( ! empty( $batch['name'] ) ) {
			$current = (string) get_option( 'blogname' );
			$host    = (string) wp_parse_url( home_url(), PHP_URL_HOST );
			if ( in_array( $current, array( '', $host, 'My WordPress Website', 'WordPress' ), true ) ) {
				update_option( 'blogname', $batch['name'] );
				$log[] = "named the site {$batch['name']}";
			}
		}

		update_option( 'yard_systems_content_version', $version );
	}

	return $log;
}

add_action( 'admin_init', 'yard_systems_run_content_updates' );

if ( defined( 'WP_CLI' ) && WP_CLI ) {
	WP_CLI::add_command(
		'yard-update',
		function () {
			$log = yard_systems_run_content_updates();
			foreach ( $log as $line ) {
				WP_CLI::log( $line );
			}
			WP_CLI::success( $log ? 'Content updates applied.' : 'Content already up to date.' );
		},
		array( 'shortdesc' => 'Apply content updates that have not run yet, without overwriting edits.' )
	);
}
