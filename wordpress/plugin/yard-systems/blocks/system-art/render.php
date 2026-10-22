<?php
/**
 * The large picture on a system's page.
 *
 * @var array    $attributes
 * @var WP_Block $block
 */

defined( 'ABSPATH' ) || exit;

$post_id = $block->context['postId'] ?? get_the_ID();
if ( ! $post_id || 'yard_system' !== get_post_type( $post_id ) ) {
	return;
}
echo '<div ' . get_block_wrapper_attributes( array( 'class' => 'ys-art-block' ) ) . '>' . yard_systems_art( $post_id, 'hero' ) . '</div>'; // phpcs:ignore WordPress.Security.EscapeOutput -- escaped inside
