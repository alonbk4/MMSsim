<?php
/**
 * Title: Home page
 * Slug: working-yard/home
 * Categories: working-yard
 * Description: The whole front page: what this is, what is running in the yard, how working together goes, and the latest from the journal.
 */
?>
<!-- wp:group {"align":"full","backgroundColor":"panel","style":{"spacing":{"padding":{"top":"var:preset|spacing|60","bottom":"var:preset|spacing|60"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull has-panel-background-color has-background" style="padding-top:var(--wp--preset--spacing--60);padding-bottom:var(--wp--preset--spacing--60)"><!-- wp:paragraph {"className":"wy-eyebrow","textColor":"muted","fontSize":"small"} -->
<p class="wy-eyebrow has-muted-color has-text-color has-small-font-size"><?php esc_html_e( 'Ann Arbor, Michigan', 'working-yard' ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":1} -->
<h1 class="wp-block-heading"><?php esc_html_e( 'Systems for water, food and soil that work with the yard you already have.', 'working-yard' ); ?></h1>
<!-- /wp:heading -->

<!-- wp:paragraph {"fontSize":"large"} -->
<p class="has-large-font-size"><?php esc_html_e( 'I build each one in my own yard first and write down what happened — including what failed. Then I help neighbors put the ones that work into theirs. No regrading, no tearing out, no five-figure quote.', 'working-yard' ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:buttons -->
<div class="wp-block-buttons"><!-- wp:button -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="<?php echo esc_url( home_url( '/systems/' ) ); ?>"><?php esc_html_e( 'See the systems', 'working-yard' ); ?></a></div>
<!-- /wp:button -->

<!-- wp:button {"className":"is-style-outline"} -->
<div class="wp-block-button is-style-outline"><a class="wp-block-button__link wp-element-button" href="<?php echo esc_url( home_url( '/work-with-me/' ) ); ?>"><?php esc_html_e( 'How working together goes', 'working-yard' ); ?></a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></div>
<!-- /wp:group -->

<!-- wp:group {"style":{"spacing":{"padding":{"top":"var:preset|spacing|50"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group" style="padding-top:var(--wp--preset--spacing--50)"><!-- wp:heading -->
<h2 class="wp-block-heading"><?php esc_html_e( 'Most yard projects start by fighting the yard', 'working-yard' ); ?></h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><?php esc_html_e( 'The usual answer to a shady lot, a wet corner or a slope is to change the site: regrade it, take the trees down, bring in the machines. That is where the tens-of-thousands quotes come from, and why so many awkward yards never get touched.', 'working-yard' ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><?php esc_html_e( 'The other way is to pick systems that suit the place as it stands: a composter that is happy in part shade, a rain garden where the water already goes, peppers that hang where there is no ground to dig. Small, cheap, fixable — and running on things the household already throws away.', 'working-yard' ); ?></p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:group {"align":"wide","style":{"spacing":{"padding":{"top":"var:preset|spacing|50"}}},"layout":{"type":"default"}} -->
<div class="wp-block-group alignwide" style="padding-top:var(--wp--preset--spacing--50)"><!-- wp:heading -->
<h2 class="wp-block-heading"><?php esc_html_e( 'Running in my yard', 'working-yard' ); ?></h2>
<!-- /wp:heading -->

<!-- wp:yard-systems/system-menu {"limit":3} /-->

<!-- wp:paragraph -->
<p><a href="<?php echo esc_url( home_url( '/systems/' ) ); ?>"><?php esc_html_e( 'The whole menu, including what didn’t work →', 'working-yard' ); ?></a></p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:group {"align":"wide","style":{"spacing":{"padding":{"top":"var:preset|spacing|50"}}},"layout":{"type":"default"}} -->
<div class="wp-block-group alignwide" style="padding-top:var(--wp--preset--spacing--50)"><!-- wp:heading -->
<h2 class="wp-block-heading"><?php esc_html_e( 'How it works', 'working-yard' ); ?></h2>
<!-- /wp:heading -->

<!-- wp:columns {"className":"wy-steps"} -->
<div class="wp-block-columns wy-steps"><!-- wp:column -->
<div class="wp-block-column"><!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading"><?php esc_html_e( 'Browse the menu', 'working-yard' ); ?></h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><?php esc_html_e( 'Every system shows what it costs, the space and time it takes, and how it actually did here. Add the ones you like to your list.', 'working-yard' ); ?></p>
<!-- /wp:paragraph --></div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column"><!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading"><?php esc_html_e( 'See them running', 'working-yard' ); ?></h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><?php esc_html_e( 'Come and look at the real thing in my yard, by appointment, before you decide on anything.', 'working-yard' ); ?></p>
<!-- /wp:paragraph --></div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column"><!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading"><?php esc_html_e( 'Fit them to your place', 'working-yard' ); ?></h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><?php esc_html_e( 'I walk your yard, we pick what suits it as it is, and I build it with you or for you.', 'working-yard' ); ?></p>
<!-- /wp:paragraph --></div>
<!-- /wp:column --></div>
<!-- /wp:columns --></div>
<!-- /wp:group -->

<!-- wp:group {"style":{"spacing":{"padding":{"top":"var:preset|spacing|50"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group" style="padding-top:var(--wp--preset--spacing--50)"><!-- wp:heading -->
<h2 class="wp-block-heading"><?php esc_html_e( 'Honest by default', 'working-yard' ); ?></h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><?php esc_html_e( 'Every system here is labeled with what happened when I tried it: works here, partly worked, didn’t work, or not yet tried here. The failures stay on the list. My first nettle ferment and my first banana peel tea both grew mold and went on the compost heap; the fix was a weight on top, and that is written up too. You should know what something does on a Michigan lot before you pay for it.', 'working-yard' ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><a href="<?php echo esc_url( home_url( '/principles/' ) ); ?>"><?php esc_html_e( 'The principles behind it →', 'working-yard' ); ?></a></p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:group {"align":"wide","style":{"spacing":{"padding":{"top":"var:preset|spacing|50","bottom":"var:preset|spacing|60"}}},"layout":{"type":"default"}} -->
<div class="wp-block-group alignwide" style="padding-top:var(--wp--preset--spacing--50);padding-bottom:var(--wp--preset--spacing--60)"><!-- wp:heading -->
<h2 class="wp-block-heading"><?php esc_html_e( 'From the journal', 'working-yard' ); ?></h2>
<!-- /wp:heading -->

<!-- wp:query {"queryId":2,"query":{"perPage":3,"pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":false}} -->
<div class="wp-block-query"><!-- wp:post-template {"layout":{"type":"grid","columnCount":3}} -->
<!-- wp:post-date /-->

<!-- wp:post-title {"level":3,"isLink":true,"style":{"spacing":{"margin":{"top":"0.25rem"}}}} /-->

<!-- wp:post-excerpt {"excerptLength":24} /-->
<!-- /wp:post-template -->

<!-- wp:query-no-results -->
<!-- wp:paragraph {"textColor":"muted"} -->
<p class="has-muted-color has-text-color"><?php esc_html_e( 'The first articles are on their way.', 'working-yard' ); ?></p>
<!-- /wp:paragraph -->
<!-- /wp:query-no-results --></div>
<!-- /wp:query --></div>
<!-- /wp:group -->

<!-- wp:pattern {"slug":"working-yard/cta"} /-->
