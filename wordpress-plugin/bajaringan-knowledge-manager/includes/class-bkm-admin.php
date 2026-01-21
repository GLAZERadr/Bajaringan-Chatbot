<?php
/**
 * Admin interface
 */

if (!defined('ABSPATH')) exit;

class BKM_Admin {
    private $database;

    public function __construct() {
        $this->database = new BKM_Database();
    }

    public function add_admin_menu() {
        add_menu_page(
            __('BARI Knowledge', 'bajaringan-knowledge-manager'),
            __('BARI Knowledge', 'bajaringan-knowledge-manager'),
            'bkm_create_knowledge',
            'bari-knowledge',
            array($this, 'render_dashboard'),
            'dashicons-book-alt',
            30
        );

        add_submenu_page(
            'bari-knowledge',
            __('All Knowledge', 'bajaringan-knowledge-manager'),
            __('All Knowledge', 'bajaringan-knowledge-manager'),
            'bkm_create_knowledge',
            'bari-knowledge-list',
            array($this, 'render_knowledge_list')
        );

        add_submenu_page(
            'bari-knowledge',
            __('Add Knowledge', 'bajaringan-knowledge-manager'),
            __('Add Knowledge', 'bajaringan-knowledge-manager'),
            'bkm_create_knowledge',
            'bari-knowledge-add',
            array($this, 'render_knowledge_edit')
        );

        add_submenu_page(
            'bari-knowledge',
            __('Settings', 'bajaringan-knowledge-manager'),
            __('Settings', 'bajaringan-knowledge-manager'),
            'bkm_manage_settings',
            'bari-knowledge-settings',
            array($this, 'render_settings')
        );
    }

    public function enqueue_admin_assets($hook) {
        if (strpos($hook, 'bari-knowledge') === false) {
            return;
        }

        wp_enqueue_style('bkm-admin', BKM_PLUGIN_URL . 'admin/css/bkm-admin.css', array(), BKM_VERSION);
        wp_enqueue_script('bkm-admin', BKM_PLUGIN_URL . 'admin/js/bkm-admin.js', array('jquery', 'wp-editor'), BKM_VERSION, true);

        wp_localize_script('bkm-admin', 'bkmConfig', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('bkm_admin'),
            'strings' => array(
                'save_draft' => __('Save Draft', 'bajaringan-knowledge-manager'),
                'publish' => __('Publish', 'bajaringan-knowledge-manager'),
                'saving' => __('Saving...', 'bajaringan-knowledge-manager')
            )
        ));

        // Also expose for old variable name (backward compatibility)
        wp_localize_script('bkm-admin', 'bkmAdmin', array(
            'nonce' => wp_create_nonce('bkm_admin')
        ));
    }

    /**
     * AJAX handler for generating API key
     */
    public function ajax_generate_api_key() {
        try {
            // Check nonce
            if (!check_ajax_referer('bkm_admin', 'nonce', false)) {
                wp_send_json_error(array('message' => 'Security check failed. Please refresh the page and try again.'), 403);
                return;
            }

            // Check capabilities
            if (!current_user_can('bkm_manage_settings')) {
                wp_send_json_error(array('message' => 'Access denied. You do not have permission to manage API keys.'), 403);
                return;
            }

            // Get and sanitize key name
            $key_name = isset($_POST['key_name']) ? sanitize_text_field($_POST['key_name']) : '';

            if (empty($key_name)) {
                wp_send_json_error(array('message' => 'Key name is required. Please enter a name for the API key.'));
                return;
            }

            // Generate API key
            $api_key = 'bari_sk_' . bin2hex(random_bytes(32));
            $key_prefix = substr($api_key, 0, 15);
            $key_hash = password_hash($api_key, PASSWORD_DEFAULT);

            // Insert to database
            global $wpdb;
            $result = $wpdb->insert(
                $wpdb->prefix . 'bari_api_keys',
                array(
                    'name' => $key_name,
                    'key_prefix' => $key_prefix,
                    'key_hash' => $key_hash,
                    'permissions' => json_encode(array('read', 'write')),
                    'is_active' => 1,
                    'created_by' => get_current_user_id(),
                    'created_at' => current_time('mysql'),
                    'updated_at' => current_time('mysql')
                ),
                array('%s', '%s', '%s', '%s', '%d', '%d', '%s', '%s')
            );

            if ($result === false) {
                error_log('BKM API Key Generation Error: ' . $wpdb->last_error);
                wp_send_json_error(array('message' => 'Database error: ' . $wpdb->last_error));
                return;
            }

            // Return success with API key
            wp_send_json_success(array(
                'api_key' => $api_key,
                'key_info' => array(
                    'name' => $key_name,
                    'key_prefix' => $key_prefix,
                    'created_at' => date('Y-m-d')
                ),
                'message' => 'API key generated successfully'
            ));

        } catch (Exception $e) {
            error_log('BKM API Key Generation Exception: ' . $e->getMessage());
            wp_send_json_error(array('message' => 'Error: ' . $e->getMessage()));
        }
    }

    public function render_dashboard() {
        if (!current_user_can('bkm_create_knowledge')) {
            wp_die(__('Access denied', 'bajaringan-knowledge-manager'), 403);
        }

        require_once BKM_PLUGIN_DIR . 'admin/views/dashboard.php';
    }

    public function render_knowledge_list() {
        if (!current_user_can('bkm_create_knowledge')) {
            wp_die(__('Access denied', 'bajaringan-knowledge-manager'), 403);
        }

        require_once BKM_PLUGIN_DIR . 'admin/views/knowledge-list.php';
    }

    public function render_knowledge_edit() {
        if (!current_user_can('bkm_create_knowledge')) {
            wp_die(__('Access denied', 'bajaringan-knowledge-manager'), 403);
        }

        require_once BKM_PLUGIN_DIR . 'admin/views/knowledge-edit.php';
    }

    public function render_settings() {
        if (!current_user_can('bkm_manage_settings')) {
            wp_die(__('Access denied', 'bajaringan-knowledge-manager'), 403);
        }

        require_once BKM_PLUGIN_DIR . 'admin/views/settings.php';
    }
}
