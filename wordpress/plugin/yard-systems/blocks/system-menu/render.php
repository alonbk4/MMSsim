<?php
/**
 * The menu: every published system, grouped by category, as cards.
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
// home page) or a single category stays as one row.
$grouped = ! $limit && ! $category;
$groups  = array();
foreach ( $systems as $system ) {
	$term = $grouped ? yard_systems_category( $system->ID ) : null;
	$key  = $term ? $term->slug : '';
	if ( ! isset( $groups[ $key ] ) ) {
		$groups[ $key ] = array( 'term' => $term, 'systems' => array() );
	}
	$groups[ $key ]['systems'][] = $system;
}
ksort( $groups );

$card = function ( $system ) {
	$tier = yard_systems_tier( $system->ID );
	$cost = get_post_meta( $system->ID, 'ys_cost', true );
	$term = yard_systems_category( $system->ID );
	$link = get_permalink( $system );
	ob_start();
	?>
	<li class="ys-card ys-card--<?php echo esc_attr( $tier ); ?>">
		<a class="ys-card__media" href="<?php echo esc_url( $link ); ?>" tabindex="-1" aria-hidden="true">
			<?php echo yard_systems_art( $system->ID ); // phpcs:ignore WordPress.Security.EscapeOutput -- escaped inside ?>
			<?php echo yard_systems_tier_badge( $system->ID ); // phpcs:ignore WordPress.Security.EscapeOutput -- escaped inside ?>
		</a>
		<div class="ys-card__body">
			<?php if ( $term ) : ?>
				<p class="ys-card__meta"><?php echo esc_html( $term->name ); ?></p>
			<?php endif; ?>
			<h3 class="ys-card__title"><a href="<?php echo esc_url( $link ); ?>"><?php echo esc_html( get_the_title( $system ) ); ?></a></h3>
			<p class="ys-card__summary"><?php echo esc_html( get_the_excerpt( $system ) ); ?></p>
			<?php if ( $cost ) : ?>
				<p class="ys-card__cost"><?php echo esc_html( $cost ); ?></p>
			<?php endif; ?>
		</div>
		<div class="ys-card__foot">
			<?php echo yard_systems_want_button( $system->ID ); // phpcs:ignore WordPress.Security.EscapeOutput -- escaped inside ?>
			<a class="ys-card__more" href="<?php echo esc_url( $link ); ?>"><?php esc_html_e( 'Details', 'yard-systems' ); ?><span aria-hidden="true"> →</span></a>
		</div>
	</li>
	<?php
	return ob_get_clean();
};
?>
<div <?php echo get_block_wrapper_attributes( array( 'class' => 'ys-menu' ) ); ?>>
	<?php if ( $grouped && count( $groups ) > 1 ) : ?>
		<nav class="ys-menu__nav" aria-label="<?php esc_attr_e( 'System categories', 'yard-systems' ); ?>">
			<?php foreach ( $groups as $group ) : ?>
				<?php if ( $group['term'] ) : ?>
					<a href="#<?php echo esc_attr( 'systems-' . $group['term']->slug ); ?>"><?php echo esc_html( $group['term']->name ); ?> <span><?php echo count( $group['systems'] ); ?></span></a>
				<?php endif; ?>
			<?php endforeach; ?>
		</nav>
	<?php endif; ?>
	<?php foreach ( $groups as $group ) : ?>
		<section class="ys-menu__group"<?php echo $group['term'] ? ' id="' . esc_attr( 'systems-' . $group['term']->slug ) . '"' : ''; ?>>
			<?php if ( $group['term'] && count( $groups ) > 1 ) : ?>
				<header class="ys-menu__head">
					<h2 class="ys-menu__heading"><?php echo esc_html( $group['term']->name ); ?></h2>
					<?php if ( $group['term']->description ) : ?>
						<p class="ys-menu__intro"><?php echo esc_html( $group['term']->description ); ?></p>
					<?php endif; ?>
				</header>
			<?php endif; ?>
			<ul class="ys-menu__grid">
				<?php
				foreach ( $group['systems'] as $system ) {
					echo $card( $system ); // phpcs:ignore WordPress.Security.EscapeOutput -- escaped inside
				}
				?>
			</ul>
		</section>
	<?php endforeach; ?>
</div>
