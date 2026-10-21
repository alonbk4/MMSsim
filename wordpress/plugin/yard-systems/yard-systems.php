<?php
/**
 * Plugin Name:       Yard Systems
 * Description:       The systems menu, the inquiry form and the starter content for the yard site. Content lives here rather than in the theme, so changing the look never loses a system or an inquiry.
 * Version:           0.1.0
 * Requires at least: 6.6
 * Requires PHP:      7.4
 * Text Domain:       yard-systems
 * License:           GPL-2.0-or-later
 */

defined( 'ABSPATH' ) || exit;

define( 'YARD_SYSTEMS_VERSION', '0.1.0' );
define( 'YARD_SYSTEMS_DIR', plugin_dir_path( __FILE__ ) );
define( 'YARD_SYSTEMS_URL', plugin_dir_url( __FILE__ ) );

require_once YARD_SYSTEMS_DIR . 'includes/systems.php';
require_once YARD_SYSTEMS_DIR . 'includes/inquiries.php';
require_once YARD_SYSTEMS_DIR . 'includes/blocks.php';
require_once YARD_SYSTEMS_DIR . 'includes/settings.php';
require_once YARD_SYSTEMS_DIR . 'includes/schema.php';
require_once YARD_SYSTEMS_DIR . 'includes/starter.php';

register_activation_hook( __FILE__, function () {
	yard_systems_register_types();
	flush_rewrite_rules();
} );

register_deactivation_hook( __FILE__, 'flush_rewrite_rules' );
