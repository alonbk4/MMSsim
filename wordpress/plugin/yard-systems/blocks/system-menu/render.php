<?php
/**
 * The menu: every published system, grouped by category.
 *
 * @var array $attributes
 */

defined( 'ABSPATH' ) || exit;

$category = $attributes['category'] ?? '';
if ( '' === $category && is_tax( 'system_category' ) ) {
	$category = get_queried_object()->slug;
}
$limit = max( 0, (int) ( $attributes['limit'] ?? 0 ) );

$args = array(
	'post_type'      => 'yard_system',
	'post_status'    => 'publish',
	'posts_per_page' => $limit ? $limit : 100,
	'orderby'        => array( 'menu_order' => 'ASC', 'title' => 'ASC' ),
	'no_found_rows'  => true,
);
if ( $category ) {
	$args['tax_query'] = array(
		array( 'taxonomy' => 'system_category', 'field' => 'slug', 'terms' => $category ),
	);
}
$systems = get_posts( $args );

if ( ! $systems ) {
	echo '<p ' . get_block_wrapper_attributes() . '>' . esc_html__( 'No systems published yet.', 'yard-systems' ) . '</p>';
	return;
}

// Group under each system's first category; a short list (a teaser on the
// home page) stays as one row.
$groups = array();
foreach ( $systems as $system ) {
	$terms = $limit ? array() : get_the_terms( $system, 'system_category' );
	$term  = $terms && ! is_wp_error( $terms ) ? $terms[0] : null;
	$key   = $term ? $term->slug : '';
	if ( ! isset( $groups[ $key ] ) ) {
		$groups[ $key ] = array( 'term' => $term, 'systems' => array() );
	}
	$groups[ $key ]['systems'][] = $system;
}
ksort( $groups );
?>
<div <?php echo get_block_wrapper_attributes( array( 'class' => 'ys-menu' ) ); ?>>
	<?php foreach ( $groups as $group ) : ?>
		<section class="ys-menu__group">
			<?php if ( $group['term'] && count( $groups ) > 1 ) : ?>
				<h2 class="ys-menu__heading"><?php echo esc_html( $group['term']->name ); ?></h2>
				<?php if ( $group['term']->description ) : ?>
					<p class="ys-menu__intro"><?php echo esc_html( $group['term']->description ); ?></p>
				<?php endif; ?>
			<?php endif; ?>
			<ul class="ys-menu__grid">
				<?php foreach ( $group['systems'] as $system ) : ?>
					<?php
					$tier = yard_systems_tier( $system->ID );
					$cost = get_post_meta( $system->ID, 'ys_cost', true );
					?>
					<li class="ys-card ys-card--<?php echo esc_attr( $tier ); ?>">
						<?php if ( has_post_thumbnail( $system ) ) : ?>
							<a class="ys-card__image" href="<?php echo esc_url( get_permalink( $system ) ); ?>" tabindex="-1" aria-hidden="true">
								<?php echo get_the_post_thumbnail( $system, 'medium_large', array( 'loading' => 'lazy' ) ); ?>
							</a>
						<?php endif; ?>
						<div class="ys-card__body">
							<?php echo yard_systems_tier_badge( $system->ID ); // phpcs:ignore WordPress.Security.EscapeOutput -- escaped inside ?>
							<h3 class="ys-card__title"><a href="<?php echo esc_url( get_permalink( $system ) ); ?>"><?php echo esc_html( get_the_title( $system ) ); ?></a></h3>
							<p class="ys-card__summary"><?php echo esc_html( get_the_excerpt( $system ) ); ?></p>
							<?php if ( $cost ) : ?>
								<p class="ys-card__cost"><?php echo esc_html( $cost ); ?></p>
							<?php endif; ?>
						</div>
						<div class="ys-card__actions">
							<?php echo yard_systems_want_button( $system->ID ); // phpcs:ignore WordPress.Security.EscapeOutput -- escaped inside ?>
						</div>
					</li>
				<?php endforeach; ?>
			</ul>
		</section>
	<?php endforeach; ?>
</div>
