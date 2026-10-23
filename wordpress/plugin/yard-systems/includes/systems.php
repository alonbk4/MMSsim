<?php
/**
 * The systems menu: one post per system, with the facts a visitor needs to
 * decide whether they want it.
 *
 * Every system carries the same evidence tier the simulator uses. The site's
 * whole pitch is that it tells you what actually happened here, so a system
 * that failed stays on the menu marked as failed rather than quietly
 * disappearing — and it is never offered for hire.
 */

defined( 'ABSPATH' ) || exit;

/**
 * Least certain first, the same order as the simulator.
 */
function yard_systems_tiers() {
	return array(
		'unproven'   => array(
			'label' => __( 'Unproven', 'yard-systems' ),
			'long'  => __( 'Promising on paper, contested in practice. Not tried here yet.', 'yard-systems' ),
		),
		'researched' => array(
			'label' => __( 'Researched', 'yard-systems' ),
			'long'  => __( 'Well documented elsewhere. Not yet built in this yard.', 'yard-systems' ),
		),
		'failed'     => array(
			'label' => __( 'Didn’t work here', 'yard-systems' ),
			'long'  => __( 'Built in this yard and it failed. Kept on the list so nobody repeats it.', 'yard-systems' ),
		),
		'partial'    => array(
			'label' => __( 'Partly worked here', 'yard-systems' ),
			'long'  => __( 'Built in this yard. It worked some of the time, and the difference is written up below.', 'yard-systems' ),
		),
		'works'      => array(
			'label' => __( 'Works here', 'yard-systems' ),
			'long'  => __( 'Built in this yard and doing what it should. You can come and see it.', 'yard-systems' ),
		),
	);
}

function yard_systems_tier( $post_id ) {
	$tier = get_post_meta( $post_id, 'ys_tier', true );
	return array_key_exists( $tier, yard_systems_tiers() ) ? $tier : 'researched';
}

/**
 * A failed system is a record, not a product.
 */
function yard_systems_is_offered( $post_id ) {
	return 'failed' !== yard_systems_tier( $post_id );
}

/**
 * The facts shown on every system, in display order. Empty ones are skipped.
 */
function yard_systems_fact_fields() {
	return array(
		'ys_cost'   => array(
			'label' => __( 'Materials, roughly', 'yard-systems' ),
			'help'  => __( 'What the parts cost, not the labor. A range is fine.', 'yard-systems' ),
		),
		'ys_space'  => array(
			'label' => __( 'Space it needs', 'yard-systems' ),
			'help'  => __( 'Footprint and any siting needs (sun, slope, near the house).', 'yard-systems' ),
		),
		'ys_upkeep' => array(
			'label' => __( 'Upkeep', 'yard-systems' ),
			'help'  => __( 'Honest time per week or per season.', 'yard-systems' ),
		),
		'ys_season' => array(
			'label' => __( 'When it works', 'yard-systems' ),
			'help'  => __( 'Its season in Southeast Michigan.', 'yard-systems' ),
		),
		'ys_fits'   => array(
			'label' => __( 'Good fit for', 'yard-systems' ),
			'help'  => __( 'The kind of yard or household it suits.', 'yard-systems' ),
		),
	);
}

function yard_systems_register_types() {
	// The taxonomy goes first: rewrite rules match in registration order, and
	// the post type's own rules would otherwise read /systems/category/soil/
	// as an attachment called "soil".
	register_taxonomy(
		'system_category',
		'yard_system',
		array(
			'labels'            => array(
				'name'          => __( 'System categories', 'yard-systems' ),
				'singular_name' => __( 'System category', 'yard-systems' ),
			),
			'hierarchical'      => true,
			'show_admin_column' => true,
			'show_in_rest'      => true,
			'rewrite'           => array( 'slug' => 'systems/category', 'with_front' => false ),
		)
	);

	register_post_type(
		'yard_system',
		array(
			'labels'       => array(
				'name'          => __( 'Systems', 'yard-systems' ),
				'singular_name' => __( 'System', 'yard-systems' ),
				'add_new_item'  => __( 'Add system', 'yard-systems' ),
				'edit_item'     => __( 'Edit system', 'yard-systems' ),
				'all_items'     => __( 'All systems', 'yard-systems' ),
				'menu_name'     => __( 'Systems', 'yard-systems' ),
			),
			'public'       => true,
			'has_archive'  => 'systems',
			'rewrite'      => array( 'slug' => 'systems', 'with_front' => false ),
			'menu_icon'    => 'dashicons-carrot',
			'menu_position' => 21,
			'show_in_rest' => true,
			'supports'     => array( 'title', 'editor', 'excerpt', 'thumbnail', 'page-attributes', 'custom-fields', 'revisions' ),
		)
	);

	$string_meta = array_merge( array( 'ys_tier', 'ys_sim_id' ), array_keys( yard_systems_fact_fields() ) );
	foreach ( $string_meta as $key ) {
		register_post_meta(
			'yard_system',
			$key,
			array(
				'type'              => 'string',
				'single'            => true,
				'show_in_rest'      => true,
				'sanitize_callback' => 'sanitize_text_field',
				'auth_callback'     => function () {
					return current_user_can( 'edit_posts' );
				},
			)
		);
	}
}
add_action( 'init', 'yard_systems_register_types' );

/* ---------- the editing box ---------- */

add_action( 'add_meta_boxes_yard_system', function () {
	add_meta_box( 'yard-system-facts', __( 'Facts shown on the menu', 'yard-systems' ), 'yard_systems_render_meta_box', 'yard_system', 'side', 'high' );
} );

function yard_systems_render_meta_box( $post ) {
	wp_nonce_field( 'yard_system_facts', 'yard_system_facts_nonce' );
	$tier = yard_systems_tier( $post->ID );
	echo '<p><label for="ys_tier"><strong>' . esc_html__( 'In this yard', 'yard-systems' ) . '</strong></label><br />';
	echo '<select id="ys_tier" name="ys_tier" style="width:100%">';
	foreach ( yard_systems_tiers() as $value => $t ) {
		printf( '<option value="%s"%s>%s</option>', esc_attr( $value ), selected( $tier, $value, false ), esc_html( $t['label'] ) );
	}
	echo '</select></p>';
	echo '<p class="description">' . esc_html__( '“Didn’t work here” keeps the system on the menu as a record but removes the option to ask for it.', 'yard-systems' ) . '</p>';

	foreach ( yard_systems_fact_fields() as $key => $field ) {
		printf(
			'<p><label for="%1$s"><strong>%2$s</strong></label><br /><input type="text" id="%1$s" name="%1$s" value="%3$s" style="width:100%%" /><span class="description">%4$s</span></p>',
			esc_attr( $key ),
			esc_html( $field['label'] ),
			esc_attr( get_post_meta( $post->ID, $key, true ) ),
			esc_html( $field['help'] )
		);
	}
	printf(
		'<p><label for="ys_sim_id"><strong>%1$s</strong></label><br /><input type="text" id="ys_sim_id" name="ys_sim_id" value="%2$s" style="width:100%%" /><span class="description">%3$s</span></p>',
		esc_html__( 'Simulator system', 'yard-systems' ),
		esc_attr( get_post_meta( $post->ID, 'ys_sim_id', true ) ),
		esc_html__( 'The id of the system in the simulator this one follows, such as aerobin. Its status there sets the status here, and its yard log shows on this page. For a system that is more than one in the simulator, list them with spaces: the first sets the status, and the log of all of them shows.', 'yard-systems' )
	);
	echo '<p class="description">' . esc_html__( 'The excerpt is the one-line summary on the menu card. Menu order (under Page Attributes) sets the order.', 'yard-systems' ) . '</p>';
}

add_action( 'save_post_yard_system', function ( $post_id ) {
	if ( ! isset( $_POST['yard_system_facts_nonce'] ) || ! wp_verify_nonce( sanitize_key( $_POST['yard_system_facts_nonce'] ), 'yard_system_facts' ) ) {
		return;
	}
	if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}
	$tier = isset( $_POST['ys_tier'] ) ? sanitize_key( $_POST['ys_tier'] ) : '';
	if ( array_key_exists( $tier, yard_systems_tiers() ) ) {
		update_post_meta( $post_id, 'ys_tier', $tier );
	}
	foreach ( array_keys( yard_systems_fact_fields() ) as $key ) {
		if ( isset( $_POST[ $key ] ) ) {
			update_post_meta( $post_id, $key, sanitize_text_field( wp_unslash( $_POST[ $key ] ) ) );
		}
	}
	if ( isset( $_POST['ys_sim_id'] ) ) {
		update_post_meta( $post_id, 'ys_sim_id', yard_systems_clean_sim_ids( wp_unslash( $_POST['ys_sim_id'] ) ) );
	}
} );

/* ---------- the archive is the menu, so show all of it, in menu order ---------- */

add_action( 'pre_get_posts', function ( $query ) {
	if ( is_admin() || ! $query->is_main_query() ) {
		return;
	}
	if ( $query->is_post_type_archive( 'yard_system' ) || $query->is_tax( 'system_category' ) ) {
		$query->set( 'posts_per_page', 100 );
		$query->set( 'orderby', array( 'menu_order' => 'ASC', 'title' => 'ASC' ) );
	}
} );

add_filter( 'manage_yard_system_posts_columns', function ( $columns ) {
	$columns['ys_tier'] = __( 'In this yard', 'yard-systems' );
	return $columns;
} );

add_action( 'manage_yard_system_posts_custom_column', function ( $column, $post_id ) {
	if ( 'ys_tier' === $column ) {
		echo esc_html( yard_systems_tiers()[ yard_systems_tier( $post_id ) ]['label'] );
	}
}, 10, 2 );
