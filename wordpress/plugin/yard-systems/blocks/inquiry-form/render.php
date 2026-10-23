<?php
/**
 * The inquiry form. Posts to admin-post.php; see includes/inquiries.php.
 *
 * @var array $attributes
 */

defined( 'ABSPATH' ) || exit;

$state  = isset( $_GET['inquiry'] ) ? sanitize_key( $_GET['inquiry'] ) : ''; // phpcs:ignore WordPress.Security.NonceVerification
$reason = isset( $_GET['reason'] ) ? sanitize_key( $_GET['reason'] ) : ''; // phpcs:ignore WordPress.Security.NonceVerification

$errors = array(
	'missing' => __( 'Your name and a working email address are the two things I need. Please check those and send it again.', 'yard-systems' ),
	'busy'    => __( 'That’s a lot of messages from one place in an hour. Please try again later.', 'yard-systems' ),
	'save'    => __( 'Something went wrong saving that. Please try again in a minute.', 'yard-systems' ),
);

$systems = get_posts(
	array(
		'post_type'      => 'yard_system',
		'post_status'    => 'publish',
		'posts_per_page' => 100,
		'orderby'        => array( 'menu_order' => 'ASC', 'title' => 'ASC' ),
		'no_found_rows'  => true,
	)
);
$systems = array_filter( $systems, function ( $s ) {
	return yard_systems_is_offered( $s->ID );
} );

$towns  = yard_systems_service_area();
$return = get_permalink();
?>
<div <?php echo get_block_wrapper_attributes( array( 'class' => 'ys-inquiry', 'id' => 'inquiry' ) ); ?>>
	<?php if ( 'sent' === $state ) : ?>
		<div class="ys-notice ys-notice--ok" role="status">
			<p><strong><?php esc_html_e( 'Got it — thank you.', 'yard-systems' ); ?></strong> <?php esc_html_e( 'I read every one of these myself and will get back to you within a few days.', 'yard-systems' ); ?></p>
		</div>
	<?php elseif ( 'error' === $state ) : ?>
		<div class="ys-notice ys-notice--error" role="alert">
			<p><?php echo esc_html( $errors[ $reason ] ?? $errors['save'] ); ?></p>
		</div>
	<?php endif; ?>

	<form class="ys-form" method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
		<input type="hidden" name="action" value="yard_inquiry" />
		<input type="hidden" name="ys_return" value="<?php echo esc_url( $return ); ?>" />
		<input type="hidden" name="ys_seconds" value="" />
		<p class="ys-form__trap" aria-hidden="true">
			<label>Leave this empty <input type="text" name="ys_website" tabindex="-1" autocomplete="off" /></label>
		</p>

		<div class="ys-form__row">
			<p>
				<label for="ys_name"><?php esc_html_e( 'Your name', 'yard-systems' ); ?></label>
				<input id="ys_name" name="ys_name" type="text" required autocomplete="name" />
			</p>
			<p>
				<label for="ys_email"><?php esc_html_e( 'Email', 'yard-systems' ); ?></label>
				<input id="ys_email" name="ys_email" type="email" required autocomplete="email" />
			</p>
		</div>
		<div class="ys-form__row">
			<p>
				<label for="ys_phone"><?php esc_html_e( 'Phone', 'yard-systems' ); ?> <span class="ys-form__optional"><?php esc_html_e( '(optional)', 'yard-systems' ); ?></span></label>
				<input id="ys_phone" name="ys_phone" type="tel" autocomplete="tel" />
			</p>
			<p>
				<label for="ys_town"><?php esc_html_e( 'Where is your yard?', 'yard-systems' ); ?></label>
				<select id="ys_town" name="ys_town">
					<?php foreach ( $towns as $town ) : ?>
						<option><?php echo esc_html( $town ); ?></option>
					<?php endforeach; ?>
					<option><?php esc_html_e( 'Somewhere else', 'yard-systems' ); ?></option>
				</select>
			</p>
		</div>

		<fieldset>
			<legend><?php esc_html_e( 'What would you like?', 'yard-systems' ); ?></legend>
			<?php foreach ( yard_inquiry_wants_options() as $value => $label ) : ?>
				<label class="ys-check"><input type="checkbox" name="ys_wants[]" value="<?php echo esc_attr( $value ); ?>" /> <?php echo esc_html( $label ); ?></label>
			<?php endforeach; ?>
		</fieldset>

		<?php if ( $systems ) : ?>
			<fieldset class="ys-form__systems">
				<legend><?php esc_html_e( 'Systems you’re curious about', 'yard-systems' ); ?></legend>
				<p class="ys-form__hint"><?php esc_html_e( 'Anything you added to your list on the systems page is already ticked.', 'yard-systems' ); ?></p>
				<?php foreach ( $systems as $system ) : ?>
					<label class="ys-check"><input type="checkbox" name="ys_systems[]" value="<?php echo (int) $system->ID; ?>" data-title="<?php echo esc_attr( get_the_title( $system ) ); ?>" /> <?php echo esc_html( get_the_title( $system ) ); ?></label>
				<?php endforeach; ?>
			</fieldset>
		<?php endif; ?>

		<p>
			<label for="ys_yard"><?php esc_html_e( 'Tell me about your place', 'yard-systems' ); ?></label>
			<span class="ys-form__hint" id="ys_yard_hint"><?php esc_html_e( 'Rough size, sun and shade, slope, what’s there now, what’s been a headache. Whatever you know — “a shady corner lot with a wet patch nobody will touch” is a fine answer.', 'yard-systems' ); ?></span>
			<textarea id="ys_yard" name="ys_yard" rows="6" aria-describedby="ys_yard_hint"></textarea>
		</p>

		<p>
			<label for="ys_budget"><?php esc_html_e( 'Rough budget', 'yard-systems' ); ?></label>
			<select id="ys_budget" name="ys_budget">
				<?php foreach ( yard_inquiry_budget_options() as $value => $label ) : ?>
					<option value="<?php echo esc_attr( $value ); ?>"><?php echo esc_html( $label ); ?></option>
				<?php endforeach; ?>
			</select>
		</p>

		<p><button type="submit" class="ys-form__submit"><?php esc_html_e( 'Send', 'yard-systems' ); ?></button></p>
	</form>
</div>
