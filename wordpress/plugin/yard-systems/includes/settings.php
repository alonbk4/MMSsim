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
		<p><?php esc_html_e( 'Creates the pages, the systems with what is known about this yard so far, and the first journal articles as drafts, and sets the home page. Safe to run again: it only adds what is missing and never overwrites an edit.', 'yard-systems' ); ?></p>
		<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
			<input type="hidden" name="action" value="yard_systems_starter" />
			<?php wp_nonce_field( 'yard_systems_starter' ); ?>
			<?php submit_button( __( 'Install starter content', 'yard-systems' ), 'secondary' ); ?>
		</form>

		<hr />
		<h2 id="sync"><?php esc_html_e( 'Simulator sync', 'yard-systems' ); ?></h2>
		<?php if ( isset( $_GET['newkey'] ) ) : // phpcs:ignore WordPress.Security.NonceVerification ?>
			<div class="notice notice-success inline"><p><?php esc_html_e( 'New key made. The old one no longer works; paste this one into the simulator.', 'yard-systems' ); ?></p></div>
		<?php endif; ?>
		<p><?php esc_html_e( 'The simulator sends each system’s status here whenever you change it. A system marked as tested in your yard is published; its badge follows the simulator from then on.', 'yard-systems' ); ?></p>
		<table class="form-table" role="presentation">
			<tr>
				<th scope="row"><?php esc_html_e( 'Website address', 'yard-systems' ); ?></th>
				<td><input type="text" readonly class="regular-text code" value="<?php echo esc_attr( home_url( '/' ) ); ?>" onfocus="this.select()" /></td>
			</tr>
			<tr>
				<th scope="row"><?php esc_html_e( 'Sync key', 'yard-systems' ); ?></th>
				<td>
					<input type="text" readonly class="regular-text code" value="<?php echo esc_attr( yard_systems_sync_key() ); ?>" onfocus="this.select()" />
					<p class="description"><?php esc_html_e( 'Paste both into the simulator: Site tab → Website. The key can set the statuses shown here, add to the yard log and send its photos, and nothing else.', 'yard-systems' ); ?></p>
				</td>
			</tr>
		</table>
		<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
			<input type="hidden" name="action" value="yard_systems_new_key" />
			<?php wp_nonce_field( 'yard_systems_new_key' ); ?>
			<?php submit_button( __( 'Make a new key', 'yard-systems' ), 'secondary', 'submit', false ); ?>
		</form>

		<?php
		$log     = array_filter( yard_systems_log(), function ( $entry ) {
			return empty( $entry['deleted'] );
		} );
		$private = count( array_filter( $log, function ( $entry ) {
			return ! empty( $entry['private'] );
		} ) );
		?>
		<p>
			<?php
			echo esc_html(
				$log
					/* translators: 1: entries in the yard log, 2: how many of them are private */
					? sprintf( _n( 'The yard log has %1$d entry, %2$d of them private.', 'The yard log has %1$d entries, %2$d of them private.', count( $log ), 'yard-systems' ), count( $log ), $private )
					: __( 'The yard log is empty: nothing has been sent from the simulator yet.', 'yard-systems' )
			);
			?>
			<?php esc_html_e( 'It is written in the simulator; public entries show on each system’s page.', 'yard-systems' ); ?>
		</p>
		<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
			<input type="hidden" name="action" value="yard_systems_download_log" />
			<?php wp_nonce_field( 'yard_systems_download_log' ); ?>
			<?php submit_button( __( 'Download the yard log', 'yard-systems' ), 'secondary', 'submit', false ); ?>
			<p class="description"><?php esc_html_e( 'Every entry as a file to keep, private ones included, so keep the file private too. Photos are listed by their address; the photos themselves are in a full backup of the site.', 'yard-systems' ); ?></p>
		</form>

		<?php
		// phpcs:disable WordPress.Security.NonceVerification -- reading the result of a checked request
		if ( isset( $_GET['restored'] ) ) {
			$saved   = absint( $_GET['restored'] );
			$total   = isset( $_GET['of'] ) ? absint( $_GET['of'] ) : 0;
			$changed = isset( $_GET['changed'] ) ? absint( $_GET['changed'] ) : 0;
			$message = $saved
				/* translators: 1: entries restored, 2: entries in the file, 3: systems whose status or publishing changed */
				? sprintf( __( 'Restored %1$d of the file’s %2$d entries: the site was missing them or had an older copy. %3$d systems changed as a result.', 'yard-systems' ), $saved, $total, $changed )
				: __( 'Nothing to restore: the site already has every entry in that file, or a newer copy of it.', 'yard-systems' );
			printf( '<div class="notice notice-success inline"><p>%s</p></div>', esc_html( $message ) );
		} elseif ( isset( $_GET['restore'] ) ) {
			$problems = array(
				'none' => __( 'No file arrived. Choose the file and try again.', 'yard-systems' ),
				'big'  => __( 'That file is too big to be a yard log.', 'yard-systems' ),
				'bad'  => __( 'That isn’t a yard log file. Use one saved with Download the yard log.', 'yard-systems' ),
			);
			$code = sanitize_key( wp_unslash( $_GET['restore'] ) );
			printf( '<div class="notice notice-error inline"><p>%s</p></div>', esc_html( $problems[ $code ] ?? $problems['bad'] ) );
		}
		// phpcs:enable
		?>
		<form method="post" enctype="multipart/form-data" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
			<input type="hidden" name="action" value="yard_systems_restore_log" />
			<?php wp_nonce_field( 'yard_systems_restore_log' ); ?>
			<p>
				<input type="file" name="yard_log" accept=".json,application/json" required />
				<?php submit_button( __( 'Restore from the file', 'yard-systems' ), 'secondary', 'submit', false ); ?>
			</p>
			<p class="description"><?php esc_html_e( 'Puts back any entry the site is missing, or has an older copy of. An entry the site has changed since the file was saved is left alone, so this is safe to run on a site that is already up to date. Photos come back only if they are still in the media library.', 'yard-systems' ); ?></p>
		</form>

		<h3><?php esc_html_e( 'Which simulator system each one follows', 'yard-systems' ); ?></h3>
		<table class="widefat striped" style="max-width:52rem">
			<thead><tr><th><?php esc_html_e( 'System', 'yard-systems' ); ?></th><th><?php esc_html_e( 'Simulator id', 'yard-systems' ); ?></th><th><?php esc_html_e( 'In this yard', 'yard-systems' ); ?></th><th><?php esc_html_e( 'Status', 'yard-systems' ); ?></th></tr></thead>
			<tbody>
			<?php
			$systems = get_posts( array( 'post_type' => 'yard_system', 'post_status' => array( 'publish', 'draft', 'pending', 'private' ), 'posts_per_page' => 200, 'orderby' => 'menu_order', 'order' => 'ASC' ) );
			foreach ( $systems as $system ) :
				?>
				<tr>
					<td><a href="<?php echo esc_url( get_edit_post_link( $system->ID ) ); ?>"><?php echo esc_html( get_the_title( $system ) ); ?></a></td>
					<td><code><?php echo esc_html( get_post_meta( $system->ID, 'ys_sim_id', true ) ?: '—' ); ?></code></td>
					<td><?php echo esc_html( yard_systems_tiers()[ yard_systems_tier( $system->ID ) ]['label'] ); ?></td>
					<td><?php echo esc_html( get_post_status_object( $system->post_status )->label ); ?></td>
				</tr>
			<?php endforeach; ?>
			</tbody>
		</table>
	</div>
	<?php
}

add_action( 'admin_post_yard_systems_new_key', function () {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( esc_html__( 'Not allowed.', 'yard-systems' ) );
	}
	check_admin_referer( 'yard_systems_new_key' );
	yard_systems_sync_key( true );
	wp_safe_redirect( admin_url( 'options-general.php?page=yard-systems&newkey=1#sync' ) );
	exit;
} );

add_action( 'admin_post_yard_systems_download_log', function () {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( esc_html__( 'Not allowed.', 'yard-systems' ) );
	}
	check_admin_referer( 'yard_systems_download_log' );
	nocache_headers();
	header( 'Content-Type: application/json; charset=utf-8' );
	header( 'Content-Disposition: attachment; filename="yard-log-' . wp_date( 'Y-m-d' ) . '.json"' );
	header( 'X-Content-Type-Options: nosniff' );
	echo wp_json_encode( yard_systems_log_export(), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ); // phpcs:ignore WordPress.Security.EscapeOutput -- JSON for a file, not HTML
	exit;
} );

add_action( 'admin_post_yard_systems_restore_log', function () {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( esc_html__( 'Not allowed.', 'yard-systems' ) );
	}
	check_admin_referer( 'yard_systems_restore_log' );
	$back = admin_url( 'options-general.php?page=yard-systems' );
	$file = $_FILES['yard_log'] ?? null; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput -- checked below, read as JSON only

	if ( ! $file || UPLOAD_ERR_OK !== (int) $file['error'] || ! is_uploaded_file( $file['tmp_name'] ) ) {
		$query = array( 'restore' => 'none' );
	} elseif ( (int) $file['size'] > 10 * MB_IN_BYTES ) {
		$query = array( 'restore' => 'big' );
	} else {
		$result = yard_systems_log_import( json_decode( (string) file_get_contents( $file['tmp_name'] ), true ) ); // phpcs:ignore WordPress.WP.AlternativeFunctions -- an uploaded file
		$query  = is_wp_error( $result )
			? array( 'restore' => 'bad' )
			: array(
				'restored' => $result['saved'],
				'of'       => $result['total'],
				'changed'  => $result['changed'],
			);
	}
	wp_safe_redirect( add_query_arg( $query, $back ) . '#sync' );
	exit;
} );

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
