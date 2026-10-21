<?php
/**
 * The facts panel on a single system.
 *
 * @var array    $attributes
 * @var WP_Block $block
 */

defined( 'ABSPATH' ) || exit;

$post_id = $block->context['postId'] ?? get_the_ID();
if ( ! $post_id || 'yard_system' !== get_post_type( $post_id ) ) {
	// In the template editor there is no system yet; say what will go here.
	echo '<div ' . get_block_wrapper_attributes( array( 'class' => 'ys-facts' ) ) . '><p>' . esc_html__( 'The system’s result in this yard, cost, space and upkeep appear here.', 'yard-systems' ) . '</p></div>';
	return;
}

$tier  = yard_systems_tier( $post_id );
$tiers = yard_systems_tiers();
?>
<aside <?php echo get_block_wrapper_attributes( array( 'class' => 'ys-facts ys-facts--' . $tier ) ); ?>>
	<p class="ys-facts__tier">
		<?php echo yard_systems_tier_badge( $post_id ); // phpcs:ignore WordPress.Security.EscapeOutput -- escaped inside ?>
		<span><?php echo esc_html( $tiers[ $tier ]['long'] ); ?></span>
	</p>
	<dl class="ys-facts__list">
		<?php foreach ( yard_systems_fact_fields() as $key => $field ) : ?>
			<?php $value = get_post_meta( $post_id, $key, true ); ?>
			<?php if ( '' !== (string) $value ) : ?>
				<div>
					<dt><?php echo esc_html( $field['label'] ); ?></dt>
					<dd><?php echo esc_html( $value ); ?></dd>
				</div>
			<?php endif; ?>
		<?php endforeach; ?>
	</dl>
	<div class="ys-facts__actions">
		<?php echo yard_systems_want_button( $post_id ); // phpcs:ignore WordPress.Security.EscapeOutput -- escaped inside ?>
		<?php if ( yard_systems_is_offered( $post_id ) ) : ?>
			<a class="ys-facts__ask" href="<?php echo esc_url( yard_systems_inquiry_url() ); ?>"><?php esc_html_e( 'Ask about it', 'yard-systems' ); ?></a>
		<?php endif; ?>
	</div>
</aside>
