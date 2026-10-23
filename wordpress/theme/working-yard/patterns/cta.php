<?php
/**
 * Title: Get in touch band
 * Slug: working-yard/cta
 * Categories: working-yard, call-to-action
 * Description: The closing band on most pages, pointing at the inquiry form.
 */
?>
<!-- wp:group {"align":"full","className":"wy-cta wy-band wy-band--clay wy-has-contours","layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull wy-cta wy-band wy-band--clay wy-has-contours"><!-- wp:columns {"verticalAlignment":"center","align":"wide"} -->
<div class="wp-block-columns alignwide are-vertically-aligned-center"><!-- wp:column {"verticalAlignment":"center","width":"62%"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:62%"><!-- wp:heading {"className":"wy-h-big"} -->
<h2 class="wp-block-heading wy-h-big"><?php esc_html_e( 'Got a yard nobody wants to touch?', 'working-yard' ); ?></h2>
<!-- /wp:heading -->

<!-- wp:paragraph {"className":"wy-lead"} -->
<p class="wy-lead"><?php esc_html_e( 'Shade, a slope, a wet corner, a layout that makes every contractor wince. The awkward ones are the interesting ones — and the answer is rarely to start over.', 'working-yard' ); ?></p>
<!-- /wp:paragraph --></div>
<!-- /wp:column -->

<!-- wp:column {"verticalAlignment":"center","width":"38%","className":"wy-cta__action"} -->
<div class="wp-block-column is-vertically-aligned-center wy-cta__action" style="flex-basis:38%"><!-- wp:buttons -->
<div class="wp-block-buttons"><!-- wp:button {"className":"wy-btn-paper"} -->
<div class="wp-block-button wy-btn-paper"><a class="wp-block-button__link wp-element-button" href="<?php echo esc_url( home_url( '/work-with-me/#inquiry' ) ); ?>"><?php esc_html_e( 'Tell me about your yard', 'working-yard' ); ?></a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></div>
<!-- /wp:column --></div>
<!-- /wp:columns --></div>
<!-- /wp:group -->
