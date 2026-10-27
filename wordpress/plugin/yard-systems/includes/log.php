<?php
/**
 * The yard log: what was tried in the yard, when, and how it went.
 *
 * Written in the simulator, on whichever device is at hand, and kept here so
 * every device reads and adds to the same record. A system's tier is the
 * result of its latest entry. Public entries show on the system's page; a
 * private one is stored here so the other devices get it, sets the tier like
 * any other, and is never shown.
 *
 * Devices edit offline and catch up later, so each entry carries the time it
 * last changed and the newer copy wins, entry by entry. A deleted entry stays
 * as a marker, or a device that missed the deletion would bring it back.
 *
 * The whole log is one option: a yard writes a few entries a week, and one
 * person's devices never contend for it.
 */

defined( 'ABSPATH' ) || exit;

const YARD_SYSTEMS_LOG_RESULTS = array( 'testedSuccess', 'testedPartial', 'testedFailed' );

/**
 * @return array<string, array> Entries keyed by id, deleted ones included.
 */
function yard_systems_log() {
	$log = get_option( 'yard_systems_log', array() );
	return is_array( $log ) ? $log : array();
}

function yard_systems_save_log( array $log ) {
	update_option( 'yard_systems_log', $log, false );
}

/**
 * An entry as sent, checked field by field, or null if it is not one.
 *
 * The note is kept exactly as written and escaped wherever it is shown:
 * tidying it here would hand a device back a different note under the same
 * timestamp, and the two copies would never agree.
 */
function yard_systems_log_clean( $raw ) {
	if ( ! is_array( $raw ) ) {
		return null;
	}
	$id     = isset( $raw['id'] ) ? (string) $raw['id'] : '';
	$system = isset( $raw['system'] ) ? (string) $raw['system'] : '';
	if ( ! preg_match( '/^[A-Za-z0-9_.-]{1,80}$/', $id ) || ! preg_match( '/^[A-Za-z0-9_.-]{1,80}$/', $system ) ) {
		return null;
	}
	$updated = isset( $raw['updated'] ) && is_numeric( $raw['updated'] ) ? (int) $raw['updated'] : 0;
	if ( $updated <= 0 ) {
		return null;
	}

	$date = isset( $raw['date'] ) ? (string) $raw['date'] : '';
	if ( ! preg_match( '/^(\d{4}-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?)?$/', $date ) ) {
		$date = '';
	}
	$result = isset( $raw['result'] ) && in_array( $raw['result'], YARD_SYSTEMS_LOG_RESULTS, true ) ? $raw['result'] : null;
	$note   = isset( $raw['note'] ) && is_string( $raw['note'] ) ? wp_check_invalid_utf8( $raw['note'], true ) : '';
	$photo  = isset( $raw['photo']['id'] ) ? absint( $raw['photo']['id'] ) : 0;

	return array(
		'id'      => $id,
		'system'  => $system,
		'date'    => $date,
		'result'  => $result,
		'note'    => mb_substr( $note, 0, 4000 ),
		'private' => isset( $raw['private'] ) && true === $raw['private'],
		'photo'   => $photo,
		'created' => isset( $raw['created'] ) && is_numeric( $raw['created'] ) ? (int) $raw['created'] : 0,
		'updated' => $updated,
		'deleted' => isset( $raw['deleted'] ) && true === $raw['deleted'],
	);
}

/**
 * Take in a device's copy of the log.
 *
 * @return array{0:int,1:bool} How many entries were newer than ours, and
 *                             whether anything a visitor can see changed.
 */
function yard_systems_merge_log( array $incoming ) {
	$log    = yard_systems_log();
	$saved  = 0;
	$public = false;

	foreach ( $incoming as $raw ) {
		$entry = yard_systems_log_clean( $raw );
		if ( ! $entry ) {
			continue;
		}
		$have = $log[ $entry['id'] ] ?? null;
		if ( ( $have && $have['updated'] >= $entry['updated'] ) || ( ! $have && count( $log ) >= 5000 ) ) {
			continue;
		}

		// Only a photo sent in for this entry, never anything else in the
		// media library.
		if ( $entry['photo'] && get_post_meta( $entry['photo'], '_ys_log_photo', true ) !== $entry['id'] ) {
			$entry['photo'] = 0;
		}
		if ( $entry['deleted'] ) {
			$entry['note']  = '';
			$entry['photo'] = 0;
		}

		$old_photo = $have ? (int) $have['photo'] : 0;
		if ( $old_photo && $old_photo !== $entry['photo'] ) {
			wp_delete_attachment( $old_photo, true );
		}
		if ( $entry['photo'] ) {
			yard_systems_log_photo_visibility( $entry['photo'], ! $entry['private'] );
		}

		$shown_before = $have && empty( $have['deleted'] ) && empty( $have['private'] );
		$shown_now    = ! $entry['deleted'] && ! $entry['private'];
		$public       = $public || $shown_before || $shown_now;

		$log[ $entry['id'] ] = $entry;
		++$saved;
	}

	if ( $saved ) {
		yard_systems_save_log( $log );
	}
	return array( $saved, $public );
}

/**
 * Oldest first: by date (undated first), then by when each was written.
 * The simulator orders them the same way, so both agree on "latest".
 */
function yard_systems_log_order( $a, $b ) {
	return strcmp( $a['date'], $b['date'] )
		?: ( $a['created'] <=> $b['created'] )
		?: strcmp( $a['id'], $b['id'] );
}

/**
 * The latest result for each simulator system the log has mentioned, or
 * null where none of its entries records one any more.
 */
function yard_systems_log_results() {
	$out  = array();
	$live = array();
	foreach ( yard_systems_log() as $entry ) {
		$out[ $entry['system'] ] = $out[ $entry['system'] ] ?? null;
		if ( empty( $entry['deleted'] ) ) {
			$live[] = $entry;
		}
	}
	usort( $live, 'yard_systems_log_order' );
	foreach ( $live as $entry ) {
		if ( $entry['result'] ) {
			$out[ $entry['system'] ] = $entry['result'];
		}
	}
	return $out;
}

/**
 * Public entries about any of these simulator systems, newest first.
 */
function yard_systems_public_log( array $sim_ids ) {
	$out = array();
	foreach ( yard_systems_log() as $entry ) {
		if ( empty( $entry['deleted'] ) && empty( $entry['private'] ) && in_array( $entry['system'], $sim_ids, true ) ) {
			$out[] = $entry;
		}
	}
	usort( $out, 'yard_systems_log_order' );
	return array_reverse( $out );
}

/**
 * The whole log as the simulator reads it, photos as addresses.
 */
function yard_systems_log_for_devices() {
	$out = array();
	foreach ( yard_systems_log() as $entry ) {
		$entry['photo'] = $entry['photo'] ? yard_systems_log_photo( $entry['photo'] ) : null;
		if ( empty( $entry['deleted'] ) ) {
			unset( $entry['deleted'] );
		}
		$out[] = $entry;
	}
	return $out;
}

function yard_systems_log_photo( $attachment_id ) {
	$large = wp_get_attachment_image_src( $attachment_id, 'large' );
	if ( ! $large ) {
		return null;
	}
	$thumb = wp_get_attachment_image_src( $attachment_id, 'medium' );
	return array(
		'id'    => (int) $attachment_id,
		'url'   => $large[0],
		'thumb' => $thumb ? $thumb[0] : $large[0],
		'w'     => (int) $large[1],
		'h'     => (int) $large[2],
	);
}

/**
 * A private entry's photo is a private attachment, so it is in no public
 * listing of the media library: not the REST API's, not an attachment page.
 */
function yard_systems_log_photo_visibility( $attachment_id, $shown ) {
	$status = $shown ? 'inherit' : 'private';
	if ( get_post_status( $attachment_id ) !== $status ) {
		wp_update_post( array( 'ID' => $attachment_id, 'post_status' => $status ) );
	}
}

/**
 * A photo for an entry. It arrives before the entry that uses it, so it is
 * private until an entry says otherwise.
 *
 * The simulator strips the location and everything else from a photo before
 * sending it, and gives it no name worth keeping; the file is named at
 * random here, so a private one's address cannot be guessed.
 */
function yard_systems_receive_photo( WP_REST_Request $request ) {
	$entry = (string) $request->get_param( 'entry' );
	if ( ! preg_match( '/^[A-Za-z0-9_.-]{1,80}$/', $entry ) ) {
		return new WP_Error( 'ys_bad_entry', __( 'That photo isn’t for a log entry.', 'yard-systems' ), array( 'status' => 400 ) );
	}
	$files = $request->get_file_params();
	$file  = $files['photo'] ?? null;
	if ( ! $file || UPLOAD_ERR_OK !== (int) $file['error'] || ! is_uploaded_file( $file['tmp_name'] ) ) {
		return new WP_Error( 'ys_no_photo', __( 'No photo arrived.', 'yard-systems' ), array( 'status' => 400 ) );
	}
	if ( (int) $file['size'] > 15 * MB_IN_BYTES ) {
		return new WP_Error( 'ys_too_big', __( 'That photo is too big.', 'yard-systems' ), array( 'status' => 413 ) );
	}
	$types = array(
		IMAGETYPE_JPEG => 'jpg',
		IMAGETYPE_PNG  => 'png',
		IMAGETYPE_WEBP => 'webp',
	);
	$info  = @getimagesize( $file['tmp_name'] ); // phpcs:ignore WordPress.PHP.NoSilencedErrors
	if ( ! $info || ! isset( $types[ $info[2] ] ) ) {
		return new WP_Error( 'ys_not_photo', __( 'That isn’t a photo the site can use.', 'yard-systems' ), array( 'status' => 415 ) );
	}

	// A send that arrived but whose answer was lost comes again: hand back
	// the copy already here rather than keep two.
	$hash  = sha1_file( $file['tmp_name'] );
	$again = get_posts(
		array(
			'post_type'      => 'attachment',
			'post_status'    => array( 'inherit', 'private' ),
			'posts_per_page' => 1,
			'fields'         => 'ids',
			'meta_query'     => array(
				array( 'key' => '_ys_log_photo', 'value' => $entry ),
				array( 'key' => '_ys_log_hash', 'value' => $hash ),
			),
		)
	);
	if ( $again ) {
		return yard_systems_log_photo( $again[0] );
	}

	yard_systems_act_as_admin();
	require_once ABSPATH . 'wp-admin/includes/file.php';
	require_once ABSPATH . 'wp-admin/includes/media.php';
	require_once ABSPATH . 'wp-admin/includes/image.php';

	$id = media_handle_sideload(
		array(
			'name'     => 'yard-log-' . strtolower( wp_generate_password( 12, false, false ) ) . '.' . $types[ $info[2] ],
			'tmp_name' => $file['tmp_name'],
		),
		0,
		__( 'Yard log photo', 'yard-systems' ),
		array( 'post_status' => 'private' )
	);
	if ( is_wp_error( $id ) ) {
		return new WP_Error( 'ys_photo_failed', $id->get_error_message(), array( 'status' => 500 ) );
	}
	update_post_meta( $id, '_ys_log_photo', $entry );
	update_post_meta( $id, '_ys_log_hash', $hash );

	return yard_systems_log_photo( $id );
}

/**
 * Photos that never made it into an entry (the device was closed between
 * sending the photo and the entry, then the entry was dropped) go after a
 * day. Checked at most once a day.
 */
function yard_systems_tidy_log_photos() {
	if ( get_transient( 'yard_systems_log_tidied' ) ) {
		return;
	}
	set_transient( 'yard_systems_log_tidied', 1, DAY_IN_SECONDS );

	$used = array();
	foreach ( yard_systems_log() as $entry ) {
		if ( $entry['photo'] ) {
			$used[] = (int) $entry['photo'];
		}
	}
	$photos = get_posts(
		array(
			'post_type'      => 'attachment',
			'post_status'    => array( 'inherit', 'private' ),
			'posts_per_page' => 200,
			'fields'         => 'ids',
			'meta_key'       => '_ys_log_photo', // phpcs:ignore WordPress.DB.SlowDBQuery
			'date_query'     => array( array( 'before' => '1 day ago' ) ),
		)
	);
	foreach ( array_diff( $photos, $used ) as $id ) {
		wp_delete_attachment( $id, true );
	}
}

/**
 * "August 14, 2026", "August 2026", or "Undated", as the simulator says it.
 */
function yard_systems_log_date( $date ) {
	if ( ! preg_match( '/^(\d{4})-(\d{2})(?:-(\d{2}))?$/', (string) $date, $m ) ) {
		return __( 'Undated', 'yard-systems' );
	}
	$day = isset( $m[3] ) ? (int) $m[3] : 0;
	$at  = gmmktime( 12, 0, 0, (int) $m[2], $day ? $day : 1, (int) $m[1] );
	return date_i18n( $day ? __( 'F j, Y', 'yard-systems' ) : __( 'F Y', 'yard-systems' ), $at, true );
}

/**
 * What an entry found, in the past tense: it is a record of one try.
 */
function yard_systems_log_result_label( $result ) {
	$labels = array(
		'testedSuccess' => __( 'Worked', 'yard-systems' ),
		'testedPartial' => __( 'Partly worked', 'yard-systems' ),
		'testedFailed'  => __( 'Didn’t work', 'yard-systems' ),
	);
	return $labels[ $result ] ?? '';
}

/**
 * The newest photo in a system's public yard log, or 0: the picture for a
 * system without a featured image.
 */
function yard_systems_log_cover( $post_id ) {
	foreach ( yard_systems_public_log( yard_systems_sim_ids( $post_id ) ) as $entry ) {
		if ( $entry['photo'] && wp_attachment_is_image( $entry['photo'] ) ) {
			return (int) $entry['photo'];
		}
	}
	return 0;
}

/**
 * The whole log as a file to keep: every entry, private and deleted ones
 * included, in the shape the simulator reads, with photos as their
 * addresses. The photos themselves are in the media library, and in a full
 * backup of the site.
 */
function yard_systems_log_export() {
	return array(
		'format'   => 'yard-systems-log',
		'version'  => 1,
		'site'     => get_bloginfo( 'name' ),
		'url'      => home_url( '/' ),
		'exported' => gmdate( 'c' ),
		'entries'  => yard_systems_log_for_devices(),
	);
}
