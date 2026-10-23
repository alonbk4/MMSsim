<?php
/**
 * Title: Site header
 * Slug: working-yard/header
 * Categories: working-yard, header
 * Block Types: core/template-part/header
 * Inserter: no
 * Description: Brand mark and name, the menu, and the button that starts an inquiry.
 */
?>
<!-- wp:group {"className":"wy-header","layout":{"type":"constrained"}} -->
<div class="wp-block-group wy-header"><!-- wp:group {"align":"wide","className":"wy-header__bar","layout":{"type":"flex","flexWrap":"nowrap","justifyContent":"space-between"}} -->
<div class="wp-block-group alignwide wy-header__bar"><!-- wp:group {"className":"wy-brand","layout":{"type":"flex","flexWrap":"nowrap"}} -->
<div class="wp-block-group wy-brand"><!-- wp:html -->
<a class="wy-brand__mark" href="<?php echo esc_url( home_url( '/' ) ); ?>" aria-hidden="true" tabindex="-1"><?php echo working_yard_mark(); // phpcs:ignore WordPress.Security.EscapeOutput ?></a>
<!-- /wp:html -->

<!-- wp:site-title /--></div>
<!-- /wp:group -->

<!-- wp:group {"className":"wy-header__nav","layout":{"type":"flex","flexWrap":"nowrap"}} -->
<div class="wp-block-group wy-header__nav"><!-- wp:navigation {"overlayMenu":"mobile","className":"wy-nav","layout":{"type":"flex","justifyContent":"right"}} -->
<!-- wp:navigation-link {"label":"The yard","url":"/the-yard/","kind":"custom","isTopLevelLink":true} /-->
<!-- wp:navigation-link {"label":"Systems","url":"/systems/","kind":"custom","isTopLevelLink":true} /-->
<!-- wp:navigation-link {"label":"Principles","url":"/principles/","kind":"custom","isTopLevelLink":true} /-->
<!-- wp:navigation-link {"label":"Journal","url":"/journal/","kind":"custom","isTopLevelLink":true} /-->
<!-- wp:navigation-link {"label":"Visit","url":"/visit/","kind":"custom","isTopLevelLink":true} /-->
<!-- /wp:navigation -->

<!-- wp:buttons {"className":"wy-header__cta"} -->
<div class="wp-block-buttons wy-header__cta"><!-- wp:button {"className":"wy-btn-small"} -->
<div class="wp-block-button wy-btn-small"><a class="wp-block-button__link wp-element-button" href="<?php echo esc_url( home_url( '/work-with-me/' ) ); ?>"><?php esc_html_e( 'Work with me', 'working-yard' ); ?></a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></div>
<!-- /wp:group --></div>
<!-- /wp:group --></div>
<!-- /wp:group -->
