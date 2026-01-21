<?php
/**
 * Plugin Name: Bajaringan Knowledge Base Connector
 * Plugin URI: https://bajaringan.com
 * Description: SSO connector untuk Knowledge Base Management System dengan role-based access
 * Version: 1.0.0
 * Author: Bajaringan
 * Author URI: https://bajaringan.com
 * License: GPL-2.0+
 * License URI: http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain: bajaringan-kb
 * Domain Path: /languages
 * Requires at least: 5.8
 * Requires PHP: 7.4
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Plugin constants
define('BKB_VERSION', '1.0.0');
define('BKB_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('BKB_PLUGIN_URL', plugin_dir_url(__FILE__));
define('BKB_PLUGIN_BASENAME', plugin_basename(__FILE__));

// Autoload Composer dependencies
if (file_exists(BKB_PLUGIN_DIR . 'vendor/autoload.php')) {
    require_once BKB_PLUGIN_DIR . 'vendor/autoload.php';
} else {
    add_action('admin_notices', function() {
        ?>
        <div class="notice notice-error">
            <p><strong>Bajaringan KB Connector:</strong> Composer dependencies not found. Please run <code>composer install</code> in the plugin directory.</p>
        </div>
        <?php
    });
    return;
}

// Include required files
require_once BKB_PLUGIN_DIR . 'includes/class-kb-roles.php';
require_once BKB_PLUGIN_DIR . 'includes/class-kb-auth.php';
require_once BKB_PLUGIN_DIR . 'includes/class-kb-api.php';
require_once BKB_PLUGIN_DIR . 'admin/class-kb-admin.php';

/**
 * Main Plugin Class
 */
class Bajaringan_KB_Connector {

    /**
     * Plugin instance
     */
    private static $instance = null;

    /**
     * Get plugin instance (Singleton)
     */
    public static function instance() {
        if (is_null(self::$instance)) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor
     */
    private function __construct() {
        $this->init_hooks();
    }

    /**
     * Initialize hooks
     */
    private function init_hooks() {
        // Activation hook
        register_activation_hook(__FILE__, [$this, 'activate']);

        // Deactivation hook
        register_deactivation_hook(__FILE__, [$this, 'deactivate']);

        // Uninstall hook
        register_uninstall_hook(__FILE__, [__CLASS__, 'uninstall']);

        // Initialize plugin
        add_action('plugins_loaded', [$this, 'init'], 0);

        // Load text domain
        add_action('plugins_loaded', [$this, 'load_textdomain']);

        // Add settings link
        add_filter('plugin_action_links_' . BKB_PLUGIN_BASENAME, [$this, 'add_settings_link']);

        // Add custom user profile fields
        add_action('show_user_profile', [$this, 'add_user_profile_fields']);
        add_action('edit_user_profile', [$this, 'add_user_profile_fields']);
        add_action('personal_options_update', [$this, 'save_user_profile_fields']);
        add_action('edit_user_profile_update', [$this, 'save_user_profile_fields']);
    }

    /**
     * Plugin activation
     */
    public function activate() {
        // Create custom roles
        BKB_Roles::create_roles();

        // Set default options
        $defaults = [
            'bkb_kb_app_url' => 'https://kb.bajaringan.com',
            'bkb_jwt_secret' => wp_generate_password(64, true, true),
            'bkb_jwt_expiration' => 7, // days
            'bkb_enabled' => true,
        ];

        foreach ($defaults as $key => $value) {
            if (get_option($key) === false) {
                add_option($key, $value);
            }
        }

        // Flush rewrite rules
        flush_rewrite_rules();

        // Log activation
        error_log('Bajaringan KB Connector activated');
    }

    /**
     * Plugin deactivation
     */
    public function deactivate() {
        // Flush rewrite rules
        flush_rewrite_rules();

        // Log deactivation
        error_log('Bajaringan KB Connector deactivated');
    }

    /**
     * Plugin uninstall
     */
    public static function uninstall() {
        // Remove roles (optional - commented to preserve user assignments)
        // BKB_Roles::remove_roles();

        // Remove options (optional)
        // delete_option('bkb_kb_app_url');
        // delete_option('bkb_jwt_secret');
        // delete_option('bkb_jwt_expiration');
        // delete_option('bkb_enabled');
    }

    /**
     * Initialize plugin components
     */
    public function init() {
        // Initialize authentication
        BKB_Auth::instance();

        // Initialize API
        BKB_API::instance();

        // Initialize admin
        if (is_admin()) {
            BKB_Admin::instance();
        }
    }

    /**
     * Load text domain for translations
     */
    public function load_textdomain() {
        load_plugin_textdomain(
            'bajaringan-kb',
            false,
            dirname(BKB_PLUGIN_BASENAME) . '/languages'
        );
    }

    /**
     * Add settings link on plugins page
     */
    public function add_settings_link($links) {
        $settings_link = sprintf(
            '<a href="%s">%s</a>',
            admin_url('admin.php?page=bajaringan-kb-settings'),
            __('Settings', 'bajaringan-kb')
        );
        array_unshift($links, $settings_link);
        return $links;
    }

    /**
     * Add custom fields to user profile (Company & Position for PRD requirement)
     */
    public function add_user_profile_fields($user) {
        ?>
        <h2><?php _e('Bajaringan Knowledge Base', 'bajaringan-kb'); ?></h2>
        <table class="form-table">
            <tr>
                <th><label for="company"><?php _e('Company', 'bajaringan-kb'); ?></label></th>
                <td>
                    <input type="text" name="company" id="company" value="<?php echo esc_attr(get_user_meta($user->ID, 'company', true)); ?>" class="regular-text" />
                    <p class="description"><?php _e('Nama perusahaan untuk AI personalization', 'bajaringan-kb'); ?></p>
                </td>
            </tr>
            <tr>
                <th><label for="position"><?php _e('Position/Jabatan', 'bajaringan-kb'); ?></label></th>
                <td>
                    <input type="text" name="position" id="position" value="<?php echo esc_attr(get_user_meta($user->ID, 'position', true)); ?>" class="regular-text" />
                    <p class="description"><?php _e('Jabatan untuk procurement whisper feature (e.g., Procurement Manager)', 'bajaringan-kb'); ?></p>
                </td>
            </tr>
        </table>
        <?php
    }

    /**
     * Save custom user profile fields
     */
    public function save_user_profile_fields($user_id) {
        if (!current_user_can('edit_user', $user_id)) {
            return false;
        }

        if (isset($_POST['company'])) {
            update_user_meta($user_id, 'company', sanitize_text_field($_POST['company']));
        }

        if (isset($_POST['position'])) {
            update_user_meta($user_id, 'position', sanitize_text_field($_POST['position']));
        }
    }
}

/**
 * Initialize plugin
 */
function bkb_connector() {
    return Bajaringan_KB_Connector::instance();
}

// Kick off the plugin
bkb_connector();
