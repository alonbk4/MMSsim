<?php
/**
 * Title: Home page
 * Slug: working-yard/home
 * Categories: working-yard
 * Description: The whole front page: the pitch and the yard as a loop, the numbers, the problem, what is running here, how working together goes, the record of results, the journal, and the call to get in touch.
 */

$url = function ( $path ) {
	return esc_url( home_url( $path ) );
};
?>
<!-- wp:group {"align":"full","className":"wy-hero wy-band wy-band--forest wy-has-contours","layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull wy-hero wy-band wy-band--forest wy-has-contours"><!-- wp:columns {"verticalAlignment":"center","align":"wide","className":"wy-hero__grid"} -->
<div class="wp-block-columns alignwide are-vertically-aligned-center wy-hero__grid"><!-- wp:column {"verticalAlignment":"center","width":"54%","className":"wy-hero__copy"} -->
<div class="wp-block-column is-vertically-aligned-center wy-hero__copy" style="flex-basis:54%"><!-- wp:paragraph {"className":"wy-eyebrow"} -->
<p class="wy-eyebrow"><?php esc_html_e( 'Ann Arbor, Michigan · Field-tested yard systems', 'working-yard' ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":1,"className":"wy-display"} -->
<h1 class="wp-block-heading wy-display"><?php echo wp_kses( __( 'Systems that work <em>with</em> the yard you already&nbsp;have.', 'working-yard' ), array( 'em' => array() ) ); ?></h1>
<!-- /wp:heading -->

<!-- wp:paragraph {"className":"wy-lead"} -->
<p class="wy-lead"><?php esc_html_e( 'Compost, water, food and soil, built in my own yard first and written up honestly — failures included. Then fitted to yours, as it stands. No regrading, no tearing out, no five-figure quote.', 'working-yard' ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:buttons {"className":"wy-actions"} -->
<div class="wp-block-buttons wy-actions"><!-- wp:button -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="<?php echo $url( '/systems/' ); ?>"><?php esc_html_e( 'Browse the systems', 'working-yard' ); ?></a></div>
<!-- /wp:button -->

<!-- wp:button {"className":"is-style-outline"} -->
<div class="wp-block-button is-style-outline"><a class="wp-block-button__link wp-element-button" href="<?php echo $url( '/work-with-me/' ); ?>"><?php esc_html_e( 'How working together goes', 'working-yard' ); ?></a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></div>
<!-- /wp:column -->

<!-- wp:column {"verticalAlignment":"center","width":"46%"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:46%"><!-- wp:html -->
<figure class="wy-loop-figure"><?php echo working_yard_svg( 'yard-loop' ); // phpcs:ignore WordPress.Security.EscapeOutput -- the theme's own drawing ?><figcaption><?php esc_html_e( 'Nothing here works alone: each system runs on what another one throws away.', 'working-yard' ); ?></figcaption></figure>
<!-- /wp:html --></div>
<!-- /wp:column --></div>
<!-- /wp:columns --></div>
<!-- /wp:group -->

<!-- wp:group {"align":"full","className":"wy-stats","layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull wy-stats"><!-- wp:html -->
<dl class="wy-stats__list alignwide">
	<div><dt>130<span>°F</span></dt><dd><?php esc_html_e( 'The hot composter on day five of its first load', 'working-yard' ); ?></dd></div>
	<div><dt>6.3<span>″</span></dt><dd><?php esc_html_e( 'Summer water shortfall in Ann Arbor, June to August', 'working-yard' ); ?></dd></div>
	<div><dt>5</dt><dd><?php esc_html_e( 'Systems built and on the record in this yard', 'working-yard' ); ?></dd></div>
	<div><dt>2</dt><dd><?php esc_html_e( 'First attempts that failed — and are written up', 'working-yard' ); ?></dd></div>
</dl>
<!-- /wp:html --></div>
<!-- /wp:group -->

<!-- wp:group {"align":"full","className":"wy-section","layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull wy-section"><!-- wp:columns {"align":"wide","className":"wy-split"} -->
<div class="wp-block-columns alignwide wy-split"><!-- wp:column {"width":"44%"} -->
<div class="wp-block-column" style="flex-basis:44%"><!-- wp:paragraph {"className":"wy-eyebrow"} -->
<p class="wy-eyebrow"><?php esc_html_e( 'The problem', 'working-yard' ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:heading {"className":"wy-h-big"} -->
<h2 class="wp-block-heading wy-h-big"><?php esc_html_e( 'Most yard projects start by fighting the yard.', 'working-yard' ); ?></h2>
<!-- /wp:heading --></div>
<!-- /wp:column -->

<!-- wp:column {"width":"56%","className":"wy-split__text"} -->
<div class="wp-block-column wy-split__text" style="flex-basis:56%"><!-- wp:paragraph {"className":"wy-lead"} -->
<p class="wy-lead"><?php esc_html_e( 'The usual answer to a shady lot, a wet corner or a slope is to change the site: regrade it, take the trees down, bring in the machines. That is where the tens-of-thousands quotes come from, and why so many awkward yards never get touched.', 'working-yard' ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><?php esc_html_e( 'The other way is to pick systems that suit the place as it stands: a composter that is happy in part shade, a rain garden where the water already goes, peppers that hang where there is no ground to dig. Small, cheap, fixable — and running on things the household already throws away.', 'working-yard' ); ?></p>
<!-- /wp:paragraph --></div>
<!-- /wp:column --></div>
<!-- /wp:columns --></div>
<!-- /wp:group -->

<!-- wp:group {"align":"full","className":"wy-section wy-band wy-band--sand","layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull wy-section wy-band wy-band--sand"><!-- wp:group {"align":"wide","className":"wy-section__head","layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between","verticalAlignment":"bottom"}} -->
<div class="wp-block-group alignwide wy-section__head"><!-- wp:group {"layout":{"type":"default"}} -->
<div class="wp-block-group"><!-- wp:paragraph {"className":"wy-eyebrow"} -->
<p class="wy-eyebrow"><?php esc_html_e( 'The menu', 'working-yard' ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:heading {"className":"wy-h-big"} -->
<h2 class="wp-block-heading wy-h-big"><?php esc_html_e( 'Running in my yard', 'working-yard' ); ?></h2>
<!-- /wp:heading --></div>
<!-- /wp:group -->

<!-- wp:paragraph {"className":"wy-arrow-link"} -->
<p class="wy-arrow-link"><a href="<?php echo $url( '/systems/' ); ?>"><?php esc_html_e( 'The whole menu, including what didn’t work', 'working-yard' ); ?></a></p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:yard-systems/system-menu {"limit":3,"align":"wide"} /--></div>
<!-- /wp:group -->

<!-- wp:group {"align":"full","className":"wy-section","layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull wy-section"><!-- wp:group {"align":"wide","className":"wy-section__head","layout":{"type":"default"}} -->
<div class="wp-block-group alignwide wy-section__head"><!-- wp:paragraph {"className":"wy-eyebrow"} -->
<p class="wy-eyebrow"><?php esc_html_e( 'How it works', 'working-yard' ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:heading {"className":"wy-h-big"} -->
<h2 class="wp-block-heading wy-h-big"><?php esc_html_e( 'From a walk round my yard to a system in yours', 'working-yard' ); ?></h2>
<!-- /wp:heading --></div>
<!-- /wp:group -->

<!-- wp:columns {"align":"wide","className":"wy-steps"} -->
<div class="wp-block-columns alignwide wy-steps"><!-- wp:column {"className":"wy-step"} -->
<div class="wp-block-column wy-step"><!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading"><?php esc_html_e( 'Browse the menu', 'working-yard' ); ?></h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><?php esc_html_e( 'Every system shows what it costs, the space and the time it takes, and how it actually did here. Add the ones you like to your list.', 'working-yard' ); ?></p>
<!-- /wp:paragraph --></div>
<!-- /wp:column -->

<!-- wp:column {"className":"wy-step"} -->
<div class="wp-block-column wy-step"><!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading"><?php esc_html_e( 'See them running', 'working-yard' ); ?></h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><?php esc_html_e( 'Come and look at the real thing in my yard, by appointment, before you decide on anything.', 'working-yard' ); ?></p>
<!-- /wp:paragraph --></div>
<!-- /wp:column -->

<!-- wp:column {"className":"wy-step"} -->
<div class="wp-block-column wy-step"><!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading"><?php esc_html_e( 'Fit them to your place', 'working-yard' ); ?></h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><?php esc_html_e( 'I walk your yard, we pick what suits it as it is, and I build it with you or for you.', 'working-yard' ); ?></p>
<!-- /wp:paragraph --></div>
<!-- /wp:column --></div>
<!-- /wp:columns --></div>
<!-- /wp:group -->

<!-- wp:group {"align":"full","className":"wy-section wy-band wy-band--forest wy-has-contours","layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull wy-section wy-band wy-band--forest wy-has-contours"><!-- wp:columns {"align":"wide","className":"wy-split"} -->
<div class="wp-block-columns alignwide wy-split"><!-- wp:column {"width":"38%"} -->
<div class="wp-block-column" style="flex-basis:38%"><!-- wp:paragraph {"className":"wy-eyebrow"} -->
<p class="wy-eyebrow"><?php esc_html_e( 'The record', 'working-yard' ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:heading {"className":"wy-h-big"} -->
<h2 class="wp-block-heading wy-h-big"><?php echo wp_kses( __( 'Failures <em>included.</em>', 'working-yard' ), array( 'em' => array() ) ); ?></h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><?php esc_html_e( 'Every system carries a label for what happened when I built it. The failures stay on the list, because you should know how something does on a Michigan lot before you pay for it.', 'working-yard' ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"wy-arrow-link"} -->
<p class="wy-arrow-link"><a href="<?php echo $url( '/principles/' ); ?>"><?php esc_html_e( 'The principles behind it', 'working-yard' ); ?></a></p>
<!-- /wp:paragraph --></div>
<!-- /wp:column -->

<!-- wp:column {"width":"62%"} -->
<div class="wp-block-column" style="flex-basis:62%"><!-- wp:html -->
<ol class="wy-ledger">
	<li><span class="wy-ledger__date">Aug 2026</span><span class="wy-ledger__entry"><strong><?php esc_html_e( 'Hot composter', 'working-yard' ); ?></strong><?php esc_html_e( '130°F by day five. Back to 125°F a day after recharging.', 'working-yard' ); ?></span><span class="ys-tier ys-tier--works"><span class="ys-tier__dot" aria-hidden="true"></span><?php esc_html_e( 'Works here', 'working-yard' ); ?></span></li>
	<li><span class="wy-ledger__date">Aug 2026</span><span class="wy-ledger__entry"><strong><?php esc_html_e( 'Biochar', 'working-yard' ); ?></strong><?php esc_html_e( 'Made, crushed, and charged in a tote with urine and fish water.', 'working-yard' ); ?></span><span class="ys-tier ys-tier--works"><span class="ys-tier__dot" aria-hidden="true"></span><?php esc_html_e( 'Works here', 'working-yard' ); ?></span></li>
	<li><span class="wy-ledger__date">Aug 2026</span><span class="wy-ledger__entry"><strong><?php esc_html_e( 'Nettle ferment', 'working-yard' ); ?></strong><?php esc_html_e( 'First batch floated and molded. The second, weighted under, worked.', 'working-yard' ); ?></span><span class="ys-tier ys-tier--partial"><span class="ys-tier__dot" aria-hidden="true"></span><?php esc_html_e( 'Partly worked', 'working-yard' ); ?></span></li>
	<li><span class="wy-ledger__date">Aug 2026</span><span class="wy-ledger__entry"><strong><?php esc_html_e( 'Banana peel tea', 'working-yard' ); ?></strong><?php esc_html_e( 'Same failure, same fix: a weight on top.', 'working-yard' ); ?></span><span class="ys-tier ys-tier--partial"><span class="ys-tier__dot" aria-hidden="true"></span><?php esc_html_e( 'Partly worked', 'working-yard' ); ?></span></li>
	<li><span class="wy-ledger__date">Jun 2026</span><span class="wy-ledger__entry"><strong><?php esc_html_e( 'IBC aquaponics', 'working-yard' ); ?></strong><?php esc_html_e( 'A rough start with the fingerlings. Stable since June.', 'working-yard' ); ?></span><span class="ys-tier ys-tier--works"><span class="ys-tier__dot" aria-hidden="true"></span><?php esc_html_e( 'Works here', 'working-yard' ); ?></span></li>
</ol>
<!-- /wp:html --></div>
<!-- /wp:column --></div>
<!-- /wp:columns --></div>
<!-- /wp:group -->

<!-- wp:group {"align":"full","className":"wy-section","layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull wy-section"><!-- wp:group {"align":"wide","className":"wy-section__head","layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between","verticalAlignment":"bottom"}} -->
<div class="wp-block-group alignwide wy-section__head"><!-- wp:group {"layout":{"type":"default"}} -->
<div class="wp-block-group"><!-- wp:paragraph {"className":"wy-eyebrow"} -->
<p class="wy-eyebrow"><?php esc_html_e( 'Journal', 'working-yard' ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:heading {"className":"wy-h-big"} -->
<h2 class="wp-block-heading wy-h-big"><?php esc_html_e( 'Notes from the yard', 'working-yard' ); ?></h2>
<!-- /wp:heading --></div>
<!-- /wp:group -->

<!-- wp:paragraph {"className":"wy-arrow-link"} -->
<p class="wy-arrow-link"><a href="<?php echo $url( '/journal/' ); ?>"><?php esc_html_e( 'All notes', 'working-yard' ); ?></a></p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:query {"queryId":2,"query":{"perPage":3,"pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":false},"align":"wide","className":"wy-posts"} -->
<div class="wp-block-query alignwide wy-posts"><!-- wp:post-template {"layout":{"type":"grid","columnCount":3}} -->
<!-- wp:group {"className":"wy-post-card","layout":{"type":"default"}} -->
<div class="wp-block-group wy-post-card"><!-- wp:post-terms {"term":"category"} /-->

<!-- wp:post-title {"level":3,"isLink":true} /-->

<!-- wp:post-excerpt {"excerptLength":22} /-->

<!-- wp:post-date /--></div>
<!-- /wp:group -->
<!-- /wp:post-template -->

<!-- wp:query-no-results -->
<!-- wp:paragraph {"className":"wy-empty"} -->
<p class="wy-empty"><?php esc_html_e( 'The first notes are on their way.', 'working-yard' ); ?></p>
<!-- /wp:paragraph -->
<!-- /wp:query-no-results --></div>
<!-- /wp:query --></div>
<!-- /wp:group -->

<!-- wp:pattern {"slug":"working-yard/cta"} /-->
