<?php
/**
 * Settings → Yard site: where inquiries go, the towns served, and the button
 * that lays down the starter content.
 */

defined( 'ABSPATH' ) || exit;

const YARD_SYSTEMS_PLACEHOLDER = '[[YOU:';

function yard_systems_default_service_area() {
	return array(
		'Ann Arbor', 'Ypsilanti', 'Saline', 'Dexter', 'Chelsea', 'Pittsfield Township',
		'Scio Township', 'Ann Arbor Township', 'Superior Township', 'Whitmore Lake', 'Milan',
	);
}

function yard_systems_service_area() {
	$saved = get_option( 'yard_systems_service_area' );
	if ( ! $saved ) {
		return yard_systems_default_service_area();
	}
	return array_values( array_filter( array_map( 'trim', explode( "\n", $saved ) ) ) );
}

add_action( 'admin_init', function () {
	register_setting( 'yard_systems', 'yard_systems_notify_email', array( 'sanitize_callback' => 'sanitize_email' ) );
	register_setting( 'yard_systems', 'yard_systems_service_area', array( 'sanitize_callback' => 'sanitize_textarea_field' ) );
} );

add_action( 'admin_menu', function () {
	add_options_page( __( 'Yard site', 'yard-systems' ), __( 'Yard site', 'yard-systems' ), 'manage_options', 'yard-systems', 'yard_systems_settings_page' );
} );

function yard_systems_settings_page() {
	?>
	<div class="wrap">
		<h1><?php esc_html_e( 'Yard site', 'yard-systems' ); ?></h1>
		<?php if ( isset( $_GET['starter'] ) ) : // phpcs:ignore WordPress.Security.NonceVerification ?>
			<div class="notice notice-success"><p><?php echo esc_html( sprintf( /* translators: %d: number of items */ __( 'Starter content installed: %d new items. Anything that already existed was left alone.', 'yard-systems' ), (int) $_GET['starter'] ) ); // phpcs:ignore WordPress.Security.NonceVerification ?></p></div>
		<?php endif; ?>

		<form method="post" action="options.php">
			<?php settings_fields( 'yard_systems' ); ?>
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="yard_systems_notify_email"><?php esc_html_e( 'Send inquiries to', 'yard-systems' ); ?></label></th>
					<td>
						<input type="email" class="regular-text" id="yard_systems_notify_email" name="yard_systems_notify_email" value="<?php echo esc_attr( get_option( 'yard_systems_notify_email' ) ); ?>" placeholder="<?php echo esc_attr( get_option( 'admin_email' ) ); ?>" />
						<p class="description"><?php esc_html_e( 'Blank sends them to the site admin address. Every inquiry is also kept under Inquiries, so a lost email never loses a lead — but send yourself a test after setting up mail.', 'yard-systems' ); ?></p>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="yard_systems_service_area"><?php esc_html_e( 'Towns served', 'yard-systems' ); ?></label></th>
					<td>
						<textarea class="large-text" rows="8" id="yard_systems_service_area" name="yard_systems_service_area"><?php echo esc_textarea( implode( "\n", yard_systems_service_area() ) ); ?></textarea>
						<p class="description"><?php esc_html_e( 'One per line. Used in the inquiry form and told to search engines as the area you serve. No street address is published anywhere.', 'yard-systems' ); ?></p>
					</td>
				</tr>
			</table>
			<?php submit_button(); ?>
		</form>

		<hr />
		<h2><?php esc_html_e( 'Starter content', 'yard-systems' ); ?></h2>
		<p><?php esc_html_e( 'Creates the pages, the system categories and the systems with what is known about this yard so far, sets the home page and the menu. Safe to run again: it only adds what is missing and never overwrites an edit.', 'yard-systems' ); ?></p>
		<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
			<input type="hidden" name="action" value="yard_systems_starter" />
			<?php wp_nonce_field( 'yard_systems_starter' ); ?>
			<?php submit_button( __( 'Install starter content', 'yard-systems' ), 'secondary' ); ?>
		</form>
	</div>
	<?php
}

add_action( 'admin_post_yard_systems_starter', function () {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( esc_html__( 'Not allowed.', 'yard-systems' ) );
	}
	check_admin_referer( 'yard_systems_starter' );
	$created = yard_systems_install_starter();
	wp_safe_redirect( admin_url( 'options-general.php?page=yard-systems&starter=' . $created ) );
	exit;
} );

/**
 * Starter text marks what only the owner can write with [[YOU: …]]. This
 * keeps a count of published content still carrying one, so a placeholder
 * cannot go live unnoticed.
 */
add_action( 'admin_notices', function () {
	if ( ! current_user_can( 'edit_pages' ) ) {
		return;
	}
	global $wpdb;
	$like  = '%' . $wpdb->esc_like( YARD_SYSTEMS_PLACEHOLDER ) . '%';
	$posts = $wpdb->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
		$wpdb->prepare(
			"SELECT ID, post_title FROM {$wpdb->posts} WHERE post_status = 'publish' AND post_type IN ('page','post','yard_system') AND post_content LIKE %s ORDER BY post_type, menu_order LIMIT 50",
			$like
		)
	);
	if ( ! $posts ) {
		return;
	}
	$links = array_map(
		function ( $p ) {
			return sprintf( '<a href="%s">%s</a>', esc_url( get_edit_post_link( $p->ID ) ), esc_html( $p->post_title ) );
		},
		$posts
	);
	printf(
		'<div class="notice notice-warning"><p><strong>%s</strong> %s</p></div>',
		esc_html( sprintf( /* translators: %d: count */ _n( '%d published page still has a [[YOU: …]] placeholder only you can fill in:', '%d published pages still have [[YOU: …]] placeholders only you can fill in:', count( $posts ), 'yard-systems' ), count( $posts ) ) ),
		implode( ', ', $links ) // phpcs:ignore WordPress.Security.EscapeOutput -- escaped above
	);
} );
