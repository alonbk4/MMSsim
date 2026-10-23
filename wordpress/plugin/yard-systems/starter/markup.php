<?php
/**
 * Small helpers that write block markup for the starter content, so the copy
 * reads as copy. Returns [paragraph, heading, list, owner placeholder].
 *
 * The markup matches what the editor itself saves, so a starter page opens
 * in the block editor without "this block contains unexpected content".
 */

defined( 'ABSPATH' ) || exit;

$p = function ( $text ) {
	return "<!-- wp:paragraph -->\n<p>{$text}</p>\n<!-- /wp:paragraph -->\n\n";
};
$h = function ( $text, $level = 2 ) {
	$attrs = 2 === $level ? '' : ' {"level":' . $level . '}';
	return "<!-- wp:heading{$attrs} -->\n<h{$level} class=\"wp-block-heading\">{$text}</h{$level}>\n<!-- /wp:heading -->\n\n";
};
$ul = function ( array $items, $ordered = false ) {
	$tag   = $ordered ? 'ol' : 'ul';
	$attrs = $ordered ? ' {"ordered":true}' : '';
	$lis   = '';
	foreach ( $items as $item ) {
		$lis .= "<!-- wp:list-item -->\n<li>{$item}</li>\n<!-- /wp:list-item -->";
	}
	return "<!-- wp:list{$attrs} -->\n<{$tag} class=\"wp-block-list\">{$lis}</{$tag}>\n<!-- /wp:list -->\n\n";
};
$you = function ( $prompt ) {
	return "[[YOU: {$prompt}]]";
};

return array( $p, $h, $ul, $you );
