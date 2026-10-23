<?php
/**
 * Title: Site footer
 * Slug: working-yard/footer
 * Categories: working-yard, footer
 * Block Types: core/template-part/footer
 * Inserter: no
 * Description: The closing statement, where to go next, the towns served, and the small print.
 */
?>
<!-- wp:group {"className":"wy-footer","layout":{"type":"constrained"}} -->
<div class="wp-block-group wy-footer"><!-- wp:columns {"align":"wide","className":"wy-footer__grid"} -->
<div class="wp-block-columns alignwide wy-footer__grid"><!-- wp:column {"width":"40%"} -->
<div class="wp-block-column" style="flex-basis:40%"><!-- wp:html -->
<a class="wy-footer__brand" href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php echo working_yard_mark(); // phpcs:ignore WordPress.Security.EscapeOutput ?><span><?php echo esc_html( get_bloginfo( 'name' ) ); ?></span></a>
<!-- /wp:html -->

<!-- wp:paragraph {"className":"wy-footer__statement"} -->
<p class="wy-footer__statement"><?php esc_html_e( 'Built and tested in one Ann Arbor yard before it goes into yours.', 'working-yard' ); ?></p>
<!-- /wp:paragraph --></div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column"><!-- wp:paragraph {"className":"wy-eyebrow"} -->
<p class="wy-eyebrow"><?php esc_html_e( 'Explore', 'working-yard' ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:list {"className":"wy-plain-list"} -->
<ul class="wp-block-list wy-plain-list"><!-- wp:list-item -->
<li><a href="<?php echo esc_url( home_url( '/the-yard/' ) ); ?>"><?php esc_html_e( 'The yard', 'working-yard' ); ?></a></li>
<!-- /wp:list-item --><!-- wp:list-item -->
<li><a href="<?php echo esc_url( home_url( '/systems/' ) ); ?>"><?php esc_html_e( 'The systems menu', 'working-yard' ); ?></a></li>
<!-- /wp:list-item --><!-- wp:list-item -->
<li><a href="<?php echo esc_url( home_url( '/principles/' ) ); ?>"><?php esc_html_e( 'Principles', 'working-yard' ); ?></a></li>
<!-- /wp:list-item --><!-- wp:list-item -->
<li><a href="<?php echo esc_url( home_url( '/journal/' ) ); ?>"><?php esc_html_e( 'Journal', 'working-yard' ); ?></a></li>
<!-- /wp:list-item --><!-- wp:list-item -->
<li><a href="<?php echo esc_url( home_url( '/visit/' ) ); ?>"><?php esc_html_e( 'Visit the yard', 'working-yard' ); ?></a></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column"><!-- wp:paragraph {"className":"wy-eyebrow"} -->
<p class="wy-eyebrow"><?php esc_html_e( 'Serving', 'working-yard' ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:html -->
<ul class="wy-towns">
<?php
$towns = function_exists( 'yard_systems_service_area' ) ? yard_systems_service_area() : array( 'Ann Arbor', 'Ypsilanti', 'Saline', 'Dexter', 'Chelsea' );
foreach ( $towns as $town ) {
	// Townships are long; the list is about the place names.
	echo '<li>' . esc_html( preg_replace( '/ Township$/', ' Twp.', $town ) ) . '</li>';
}
?>
</ul>
<!-- /wp:html --></div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column"><!-- wp:paragraph {"className":"wy-eyebrow"} -->
<p class="wy-eyebrow"><?php esc_html_e( 'Start here', 'working-yard' ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><?php esc_html_e( 'Tell me about your place, and tick what caught your eye on the menu.', 'working-yard' ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:buttons -->
<div class="wp-block-buttons"><!-- wp:button {"className":"wy-btn-small"} -->
<div class="wp-block-button wy-btn-small"><a class="wp-block-button__link wp-element-button" href="<?php echo esc_url( home_url( '/work-with-me/#inquiry' ) ); ?>"><?php esc_html_e( 'Get in touch', 'working-yard' ); ?></a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></div>
<!-- /wp:column --></div>
<!-- /wp:columns -->

<!-- wp:group {"align":"wide","className":"wy-footer__base","layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between"}} -->
<div class="wp-block-group alignwide wy-footer__base"><!-- wp:paragraph -->
<p>© <?php echo esc_html( gmdate( 'Y' ) . ' ' . get_bloginfo( 'name' ) ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><?php esc_html_e( 'No regrading. No tearing out. Ann Arbor, Michigan.', 'working-yard' ); ?></p>
<!-- /wp:paragraph --></div>
<!-- /wp:group --></div>
<!-- /wp:group -->
