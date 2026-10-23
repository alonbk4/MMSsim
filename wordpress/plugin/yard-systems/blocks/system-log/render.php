<?php
/**
 * The yard log on a system's page: its public entries, newest first.
 * Nothing at all when it has none, so a system not yet tried shows no
 * empty heading.
 *
 * @var array    $attributes
 * @var WP_Block $block
 */

defined( 'ABSPATH' ) || exit;

$post_id = $block->context['postId'] ?? get_the_ID();
if ( ! $post_id || 'yard_system' !== get_post_type( $post_id ) ) {
	echo '<div ' . get_block_wrapper_attributes( array( 'class' => 'ys-log' ) ) . '><p>' . esc_html__( 'The system’s public yard log entries appear here, once the simulator has sent some.', 'yard-systems' ) . '</p></div>';
	return;
}

$entries = yard_systems_public_log( yard_systems_sim_ids( $post_id ) );
if ( ! $entries ) {
	return;
}

$title = get_the_title( $post_id );
?>
<section <?php echo get_block_wrapper_attributes( array( 'class' => 'ys-log' ) ); ?> aria-labelledby="ys-log-title">
	<h2 class="ys-log__title" id="ys-log-title"><?php esc_html_e( 'From the yard log', 'yard-systems' ); ?></h2>
	<ol class="ys-log__list">
		<?php foreach ( $entries as $entry ) : ?>
			<?php
			$date = yard_systems_log_date( $entry['date'] );
			$tier = $entry['result'] ? yard_systems_sim_tiers()[ $entry['result'] ] : '';
			?>
			<li class="ys-log__entry">
				<p class="ys-log__meta">
					<?php if ( $entry['date'] ) : ?>
						<time datetime="<?php echo esc_attr( $entry['date'] ); ?>"><?php echo esc_html( $date ); ?></time>
					<?php else : ?>
						<span><?php echo esc_html( $date ); ?></span>
					<?php endif; ?>
					<?php if ( $tier ) : ?>
						<span class="ys-tier ys-tier--<?php echo esc_attr( $tier ); ?>"><span class="ys-tier__dot" aria-hidden="true"></span><?php echo esc_html( yard_systems_log_result_label( $entry['result'] ) ); ?></span>
					<?php endif; ?>
				</p>
				<?php if ( '' !== trim( $entry['note'] ) ) : ?>
					<div class="ys-log__note"><?php echo wpautop( esc_html( $entry['note'] ) ); // phpcs:ignore WordPress.Security.EscapeOutput -- escaped, then paragraphs added ?></div>
				<?php endif; ?>
				<?php if ( $entry['photo'] && wp_attachment_is_image( $entry['photo'] ) ) : ?>
					<figure class="ys-log__photo">
						<?php
						echo wp_get_attachment_image(
							$entry['photo'],
							'large',
							false,
							array(
								'loading' => 'lazy',
								'sizes'   => '(min-width: 782px) 38rem, 100vw',
								/* translators: 1: system name, 2: date of the entry */
								'alt'     => sprintf( __( '%1$s, %2$s', 'yard-systems' ), $title, $date ),
							)
						);
						?>
					</figure>
				<?php endif; ?>
			</li>
		<?php endforeach; ?>
	</ol>
</section>
