<?php
/**
 * Inquiries: what the inquiry form sends, kept in the dashboard as well as
 * emailed.
 *
 * Every inquiry is stored before any mail is attempted. Host mail is the
 * least reliable thing on a WordPress site, and a lead that only ever existed
 * as an email that never arrived is a lead nobody knows they lost.
 *
 * There is deliberately no nonce on the form. A nonce baked into a cached
 * page expires within a day and then rejects every real visitor, and page
 * caching is on by default on most managed hosts. Spam is handled instead by
 * a honeypot, a check that a person spent a few seconds on the page, and a
 * per-address rate limit.
 */

defined( 'ABSPATH' ) || exit;

function yard_inquiry_wants_options() {
	return array(
		'visit-mine' => __( 'Come and look at my yard', 'yard-systems' ),
		'tour-yours' => __( 'See your yard and the systems in person', 'yard-systems' ),
		'question'   => __( 'I have a question first', 'yard-systems' ),
	);
}

function yard_inquiry_budget_options() {
	return array(
		''           => __( 'Not sure yet', 'yard-systems' ),
		'under-500'  => __( 'Under $500', 'yard-systems' ),
		'500-2000'   => __( '$500 – $2,000', 'yard-systems' ),
		'2000-5000'  => __( '$2,000 – $5,000', 'yard-systems' ),
		'over-5000'  => __( 'More than $5,000', 'yard-systems' ),
	);
}

add_action( 'init', function () {
	register_post_type(
		'yard_inquiry',
		array(
			'labels'          => array(
				'name'          => __( 'Inquiries', 'yard-systems' ),
				'singular_name' => __( 'Inquiry', 'yard-systems' ),
				'edit_item'     => __( 'Inquiry', 'yard-systems' ),
				'all_items'     => __( 'All inquiries', 'yard-systems' ),
			),
			'public'          => false,
			'show_ui'         => true,
			'show_in_rest'    => false,
			'menu_icon'       => 'dashicons-email-alt',
			'menu_position'   => 22,
			'supports'        => array( 'title', 'editor' ),
			'capability_type' => 'post',
			'capabilities'    => array( 'create_posts' => 'do_not_allow' ),
			'map_meta_cap'    => true,
		)
	);
} );

/* ---------- receiving the form ---------- */

add_action( 'admin_post_nopriv_yard_inquiry', 'yard_inquiry_handle' );
add_action( 'admin_post_yard_inquiry', 'yard_inquiry_handle' );

function yard_inquiry_handle() {
	$return = isset( $_POST['ys_return'] ) ? esc_url_raw( wp_unslash( $_POST['ys_return'] ) ) : home_url( '/' );
	$return = wp_validate_redirect( $return, home_url( '/' ) );
	$back   = function ( $state, $reason = '' ) use ( $return ) {
		$args = array( 'inquiry' => $state );
		if ( $reason ) {
			$args['reason'] = $reason;
		}
		wp_safe_redirect( add_query_arg( $args, $return ) . '#inquiry' );
		exit;
	};

	// A filled honeypot is a bot. Tell it everything went fine.
	if ( ! empty( $_POST['ys_website'] ) ) {
		$back( 'sent' );
	}

	$ip_key = 'ys_rate_' . md5( isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : 'unknown' );
	$count  = (int) get_transient( $ip_key );
	if ( $count >= 5 ) {
		$back( 'error', 'busy' );
	}

	$field = function ( $key ) {
		return isset( $_POST[ $key ] ) ? sanitize_text_field( wp_unslash( $_POST[ $key ] ) ) : '';
	};

	$name  = $field( 'ys_name' );
	$email = isset( $_POST['ys_email'] ) ? sanitize_email( wp_unslash( $_POST['ys_email'] ) ) : '';
	if ( '' === $name || ! is_email( $email ) ) {
		$back( 'error', 'missing' );
	}

	$phone  = $field( 'ys_phone' );
	$town   = $field( 'ys_town' );
	$yard   = isset( $_POST['ys_yard'] ) ? sanitize_textarea_field( wp_unslash( $_POST['ys_yard'] ) ) : '';
	$budget = $field( 'ys_budget' );
	$budget = array_key_exists( $budget, yard_inquiry_budget_options() ) ? $budget : '';

	$wants = array();
	foreach ( (array) ( $_POST['ys_wants'] ?? array() ) as $w ) {
		$w = sanitize_key( $w );
		if ( array_key_exists( $w, yard_inquiry_wants_options() ) ) {
			$wants[] = $w;
		}
	}

	$systems = array();
	foreach ( (array) ( $_POST['ys_systems'] ?? array() ) as $id ) {
		$id = absint( $id );
		if ( $id && 'yard_system' === get_post_type( $id ) ) {
			$systems[] = $id;
		}
	}

	// Seconds the visitor spent on the page, set by the page's script. A
	// missing or tiny value is probably a script, but could be a person with
	// JavaScript off, so it is kept for review rather than thrown away.
	$seconds  = (int) $field( 'ys_seconds' );
	$doubtful = $seconds < 3;

	set_transient( $ip_key, $count + 1, HOUR_IN_SECONDS );

	$title = $name . ( $town ? ' — ' . $town : '' );
	$id    = wp_insert_post(
		array(
			'post_type'    => 'yard_inquiry',
			'post_status'  => 'private',
			'post_title'   => ( $doubtful ? '[check] ' : '' ) . $title,
			'post_content' => $yard,
		),
		true
	);
	if ( is_wp_error( $id ) ) {
		$back( 'error', 'save' );
	}

	update_post_meta( $id, 'ys_email', $email );
	update_post_meta( $id, 'ys_phone', $phone );
	update_post_meta( $id, 'ys_town', $town );
	update_post_meta( $id, 'ys_budget', $budget );
	update_post_meta( $id, 'ys_wants', $wants );
	update_post_meta( $id, 'ys_systems', $systems );
	update_post_meta( $id, 'ys_doubtful', $doubtful ? 1 : 0 );

	if ( ! $doubtful ) {
		yard_inquiry_notify( $id );
	}

	$back( 'sent' );
}

function yard_inquiry_summary_lines( $id ) {
	$wants_labels = yard_inquiry_wants_options();
	$budgets      = yard_inquiry_budget_options();
	$wants        = array_map(
		function ( $w ) use ( $wants_labels ) {
			return $wants_labels[ $w ] ?? $w;
		},
		(array) get_post_meta( $id, 'ys_wants', true )
	);
	$systems = array_filter( array_map( 'get_the_title', (array) get_post_meta( $id, 'ys_systems', true ) ) );
	$budget  = (string) get_post_meta( $id, 'ys_budget', true );

	return array(
		__( 'Email', 'yard-systems' )   => get_post_meta( $id, 'ys_email', true ),
		__( 'Phone', 'yard-systems' )   => get_post_meta( $id, 'ys_phone', true ),
		__( 'Town', 'yard-systems' )    => get_post_meta( $id, 'ys_town', true ),
		__( 'Wants', 'yard-systems' )   => implode( '; ', $wants ),
		__( 'Systems', 'yard-systems' ) => implode( ', ', $systems ),
		__( 'Budget', 'yard-systems' )  => $budgets[ $budget ] ?? '',
	);
}

function yard_inquiry_notify( $id ) {
	$to    = get_option( 'yard_systems_notify_email' ) ?: get_option( 'admin_email' );
	$post  = get_post( $id );
	$email = get_post_meta( $id, 'ys_email', true );

	$body = '';
	foreach ( yard_inquiry_summary_lines( $id ) as $label => $value ) {
		if ( '' !== (string) $value ) {
			$body .= $label . ': ' . $value . "\n";
		}
	}
	$body .= "\n" . $post->post_content . "\n\n";
	$body .= __( 'In the dashboard:', 'yard-systems' ) . ' ' . admin_url( 'post.php?post=' . $id . '&action=edit' ) . "\n";

	wp_mail(
		$to,
		/* translators: %s: inquirer's name and town */
		sprintf( __( 'Yard inquiry: %s', 'yard-systems' ), $post->post_title ),
		$body,
		array( 'Reply-To: ' . $email )
	);
}

/* ---------- reading them in the dashboard ---------- */

add_filter( 'manage_yard_inquiry_posts_columns', function () {
	return array(
		'cb'         => '<input type="checkbox" />',
		'title'      => __( 'From', 'yard-systems' ),
		'ys_email'   => __( 'Email', 'yard-systems' ),
		'ys_wants'   => __( 'Wants', 'yard-systems' ),
		'ys_systems' => __( 'Systems', 'yard-systems' ),
		'date'       => __( 'Received', 'yard-systems' ),
	);
} );

add_action( 'manage_yard_inquiry_posts_custom_column', function ( $column, $id ) {
	$lines = yard_inquiry_summary_lines( $id );
	$map   = array(
		'ys_email'   => __( 'Email', 'yard-systems' ),
		'ys_wants'   => __( 'Wants', 'yard-systems' ),
		'ys_systems' => __( 'Systems', 'yard-systems' ),
	);
	if ( isset( $map[ $column ] ) ) {
		echo esc_html( $lines[ $map[ $column ] ] );
	}
}, 10, 2 );

add_action( 'add_meta_boxes_yard_inquiry', function () {
	add_meta_box(
		'yard-inquiry-details',
		__( 'Details', 'yard-systems' ),
		function ( $post ) {
			echo '<table class="widefat striped"><tbody>';
			foreach ( yard_inquiry_summary_lines( $post->ID ) as $label => $value ) {
				printf( '<tr><th style="width:8em">%s</th><td>%s</td></tr>', esc_html( $label ), esc_html( $value ) );
			}
			echo '</tbody></table>';
			if ( get_post_meta( $post->ID, 'ys_doubtful', true ) ) {
				echo '<p>' . esc_html__( 'Sent faster than a person usually types, or with JavaScript off, so no email went out. Probably spam — but check.', 'yard-systems' ) . '</p>';
			}
		},
		'yard_inquiry',
		'normal',
		'high'
	);
} );

// The message is what they wrote; it should be read, not edited.
add_filter( 'use_block_editor_for_post_type', function ( $use, $post_type ) {
	return 'yard_inquiry' === $post_type ? false : $use;
}, 10, 2 );
