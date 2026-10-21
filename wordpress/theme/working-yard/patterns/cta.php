<?php
/**
 * Title: Get in touch band
 * Slug: working-yard/cta
 * Categories: working-yard, call-to-action
 * Description: The closing band on most pages, pointing at the inquiry form.
 */
?>
<!-- wp:group {"align":"full","backgroundColor":"panel","style":{"spacing":{"padding":{"top":"var:preset|spacing|50","bottom":"var:preset|spacing|50"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull has-panel-background-color has-background" style="padding-top:var(--wp--preset--spacing--50);padding-bottom:var(--wp--preset--spacing--50)"><!-- wp:heading -->
<h2 class="wp-block-heading"><?php esc_html_e( 'Got a yard nobody wants to touch?', 'working-yard' ); ?></h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><?php esc_html_e( 'Shade, a slope, a wet corner, a layout that makes every contractor wince — tell me about it. The awkward ones are the interesting ones, and the answer is rarely to start over.', 'working-yard' ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:buttons -->
<div class="wp-block-buttons"><!-- wp:button -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="<?php echo esc_url( home_url( '/work-with-me/#inquiry' ) ); ?>"><?php esc_html_e( 'Tell me about your yard', 'working-yard' ); ?></a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></div>
<!-- /wp:group -->
