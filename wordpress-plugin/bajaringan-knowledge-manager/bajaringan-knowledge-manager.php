<?php
/**
 * Plugin Name: Bajaringan Knowledge Manager
 * Plugin URI: https://bajaringan.com
 * Description: Knowledge Base Management untuk BARI AI Assistant
 * Version: 1.0.4
 * Author: Bajaringan
 * Author URI: https://bajaringan.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: bajaringan-knowledge-manager
 * Domain Path: /languages
 * Requires at least: 6.0
 * Requires PHP: 7.4
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('BKM_VERSION', '1.0.4');
define('BKM_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('BKM_PLUGIN_URL', plugin_dir_url(__FILE__));
define('BKM_PLUGIN_FILE', __FILE__);

/**
 * Plugin activation hook
 */
function bkm_activate() {
    try {
        // Load required classes
        require_once BKM_PLUGIN_DIR . 'includes/class-bkm-database.php';
        require_once BKM_PLUGIN_DIR . 'includes/class-bkm-roles.php';

        // Check if classes loaded successfully
        if (!class_exists('BKM_Database') || !class_exists('BKM_Roles')) {
            throw new Exception('Failed to load required classes');
        }

        // Create tables
        BKM_Database::create_tables();

        // Add capabilities
        BKM_Roles::add_capabilities();

        // Create default categories
        BKM_Database::create_default_categories();

        // Set default options
        add_option('bkm_version', BKM_VERSION);
        add_option('bkm_nextjs_webhook_url', '');
        add_option('bkm_webhook_secret', wp_generate_password(32, false));

        // Flush rewrite rules
        flush_rewrite_rules();

    } catch (Exception $e) {
        // Log error for debugging
        error_log('BKM Activation Error: ' . $e->getMessage());

        // Deactivate plugin
        deactivate_plugins(plugin_basename(__FILE__));

        // Show user-friendly error
        wp_die(
            sprintf(
                __('Plugin activation failed: %s<br><br>Please contact support with this error message.', 'bajaringan-knowledge-manager'),
                esc_html($e->getMessage())
            ),
            __('Bajaringan Knowledge Manager - Activation Error', 'bajaringan-knowledge-manager'),
            array('back_link' => true)
        );
    }
}
register_activation_hook(__FILE__, 'bkm_activate');

/**
 * Plugin deactivation hook
 */
function bkm_deactivate() {
    flush_rewrite_rules();
}
register_deactivation_hook(__FILE__, 'bkm_deactivate');

/**
 * Load plugin textdomain
 */
function bkm_load_textdomain() {
    load_plugin_textdomain(
        'bajaringan-knowledge-manager',
        false,
        dirname(plugin_basename(__FILE__)) . '/languages'
    );
}
add_action('plugins_loaded', 'bkm_load_textdomain');

/**
 * Load plugin classes
 * Load after Elementor to avoid conflicts
 */
function bkm_load_classes() {
    // Check if files exist before requiring
    $class_files = array(
        'includes/class-bkm-core.php',
        'includes/class-bkm-database.php',
        'includes/class-bkm-roles.php',
        'includes/class-bkm-auth.php',
        'includes/class-bkm-jwt-auth.php',
        'includes/class-bkm-rest-api.php',
        'includes/class-bkm-sync.php',
        'includes/class-bkm-admin.php',
        'includes/class-bkm-validator.php'
    );

    foreach ($class_files as $file) {
        $filepath = BKM_PLUGIN_DIR . $file;
        if (file_exists($filepath)) {
            require_once $filepath;
        }
    }
}

/**
 * Check for plugin updates and run upgrade routine
 */
function bkm_check_version() {
    $current_version = get_option('bkm_version', '0.0.0');

    if (version_compare($current_version, BKM_VERSION, '<')) {
        // Run upgrade routine
        bkm_upgrade_routine($current_version);

        // Update version number
        update_option('bkm_version', BKM_VERSION);
    }
}
add_action('plugins_loaded', 'bkm_check_version', 10);

/**
 * Upgrade routine for database schema changes
 */
function bkm_upgrade_routine($old_version) {
    global $wpdb;

    // Upgrade to 1.0.4: Add updated_at column to bari_api_keys table
    if (version_compare($old_version, '1.0.4', '<')) {
        $table_name = $wpdb->prefix . 'bari_api_keys';

        // Check if table exists and column doesn't exist
        $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$table_name'") === $table_name;

        if ($table_exists) {
            $column_exists = $wpdb->get_results("SHOW COLUMNS FROM $table_name LIKE 'updated_at'");

            if (empty($column_exists)) {
                // Add the missing column
                $wpdb->query("ALTER TABLE $table_name ADD COLUMN updated_at DATETIME NOT NULL AFTER created_at");
                error_log('BKM: Added updated_at column to bari_api_keys table (v1.0.4 upgrade)');
            }
        }
    }
}

/**
 * Initialize the plugin
 * Priority 20 to load after Elementor (priority 10)
 */
function bkm_init() {
    // Load classes first
    bkm_load_classes();

    // Check if BKM_Core exists
    if (class_exists('BKM_Core')) {
        // Use Singleton pattern - get_instance() instead of new
        $core = BKM_Core::get_instance();
        $core->run();
    }
}
add_action('plugins_loaded', 'bkm_init', 20);

/**
 * Check plugin requirements
 */
function bkm_check_requirements() {
    $errors = array();

    // Check PHP version
    if (version_compare(PHP_VERSION, '7.4', '<')) {
        $errors[] = sprintf(
            __('Bajaringan Knowledge Manager requires PHP 7.4 or higher. You are running PHP %s.', 'bajaringan-knowledge-manager'),
            PHP_VERSION
        );
    }

    // Check WordPress version
    global $wp_version;
    if (version_compare($wp_version, '6.0', '<')) {
        $errors[] = sprintf(
            __('Bajaringan Knowledge Manager requires WordPress 6.0 or higher. You are running WordPress %s.', 'bajaringan-knowledge-manager'),
            $wp_version
        );
    }

    // Database compatibility check (supports MySQL and PostgreSQL)
    // Plugin works with both MySQL and PostgreSQL
    // No specific database type requirement

    // Display errors and deactivate plugin
    if (!empty($errors)) {
        deactivate_plugins(plugin_basename(__FILE__));
        wp_die(
            implode('<br>', $errors),
            __('Plugin Activation Error', 'bajaringan-knowledge-manager'),
            array('back_link' => true)
        );
    }
}
add_action('admin_init', 'bkm_check_requirements');
