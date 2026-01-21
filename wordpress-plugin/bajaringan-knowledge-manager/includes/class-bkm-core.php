<?php
/**
 * Core plugin class
 *
 * @package Bajaringan_Knowledge_Manager
 */

if (!defined('ABSPATH')) {
    exit;
}

class BKM_Core {
    /**
     * Plugin instance
     */
    private static $instance = null;

    /**
     * Database instance
     */
    private $database;

    /**
     * Admin instance
     */
    private $admin;

    /**
     * REST API instance
     */
    private $rest_api;

    /**
     * Get plugin instance
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor
     */
    private function __construct() {
        $this->database = new BKM_Database();
        $this->rest_api = new BKM_REST_API();

        if (is_admin()) {
            $this->admin = new BKM_Admin();
        }
    }

    /**
     * Run the plugin
     */
    public function run() {
        // Initialize REST API
        add_action('rest_api_init', array($this->rest_api, 'register_routes'));

        // Initialize admin
        if (is_admin()) {
            add_action('admin_menu', array($this->admin, 'add_admin_menu'));
            add_action('admin_enqueue_scripts', array($this->admin, 'enqueue_admin_assets'));

            // AJAX actions (only in admin)
            add_action('wp_ajax_bkm_autosave', array($this, 'handle_autosave'));
            add_action('wp_ajax_bkm_preview_ai', array($this, 'handle_preview_ai'));
            add_action('wp_ajax_bkm_search_knowledge', array($this, 'handle_search_knowledge'));
            add_action('wp_ajax_bkm_generate_api_key', array($this->admin, 'ajax_generate_api_key'));
        }

        // Initialize authentication
        $auth = new BKM_Auth();
        add_filter('login_redirect', array($auth, 'custom_login_redirect'), 10, 3);
        add_action('login_enqueue_scripts', array($auth, 'custom_login_styles'));

        // Initialize JWT authentication
        $jwt_auth = new BKM_JWT_Auth();
        add_filter('determine_current_user', array($jwt_auth, 'determine_current_user'), 20);
        add_filter('rest_authentication_errors', array($jwt_auth, 'rest_authentication_errors'));

        // Initialize sync
        $sync = new BKM_Sync();
        add_action('bkm_knowledge_published', array($sync, 'trigger_sync_webhook'), 10, 2);
        add_action('bkm_knowledge_updated', array($sync, 'trigger_sync_webhook'), 10, 2);
    }

    /**
     * Handle autosave AJAX request
     */
    public function handle_autosave() {
        check_ajax_referer('bkm_autosave', 'nonce');

        if (!current_user_can('bkm_create_knowledge')) {
            wp_send_json_error(array('message' => __('Permission denied', 'bajaringan-knowledge-manager')));
        }

        $knowledge_id = isset($_POST['knowledge_id']) ? intval($_POST['knowledge_id']) : 0;
        $data = array(
            'title' => sanitize_text_field($_POST['title']),
            'content' => wp_kses_post($_POST['content']),
            'category_id' => isset($_POST['category_id']) ? intval($_POST['category_id']) : null,
            'status' => 'draft'
        );

        // Validate
        $validator = new BKM_Validator();
        $errors = $validator->validate_knowledge_input($data);

        if (!empty($errors)) {
            wp_send_json_error(array('message' => implode(', ', $errors)));
        }

        // Save
        if ($knowledge_id > 0) {
            $result = $this->database->update_knowledge($knowledge_id, $data);
        } else {
            $result = $this->database->create_knowledge($data);
            $knowledge_id = $result;
        }

        if (is_wp_error($result)) {
            wp_send_json_error(array('message' => $result->get_error_message()));
        }

        wp_send_json_success(array(
            'message' => __('Draft saved', 'bajaringan-knowledge-manager'),
            'knowledge_id' => $knowledge_id,
            'timestamp' => current_time('mysql')
        ));
    }

    /**
     * Handle AI preview AJAX request
     */
    public function handle_preview_ai() {
        check_ajax_referer('bkm_preview_ai', 'nonce');

        if (!current_user_can('bkm_create_knowledge')) {
            wp_send_json_error(array('message' => __('Permission denied', 'bajaringan-knowledge-manager')));
        }

        $test_query = sanitize_text_field($_POST['test_query']);
        $knowledge_content = wp_kses_post($_POST['content']);

        // Call Next.js API to preview response
        $nextjs_url = get_option('bkm_nextjs_webhook_url');
        if (empty($nextjs_url)) {
            wp_send_json_error(array('message' => __('Next.js URL not configured', 'bajaringan-knowledge-manager')));
        }

        $response = wp_remote_post($nextjs_url . '/api/query', array(
            'headers' => array('Content-Type' => 'application/json'),
            'body' => json_encode(array(
                'query' => $test_query,
                'preview_content' => $knowledge_content,
                'stream' => false
            )),
            'timeout' => 30
        ));

        if (is_wp_error($response)) {
            wp_send_json_error(array('message' => $response->get_error_message()));
        }

        $body = json_decode(wp_remote_retrieve_body($response), true);

        wp_send_json_success(array(
            'ai_response' => $body['answer'] ?? '',
            'confidence' => $body['metadata']['confidence'] ?? 0,
            'latency_ms' => $body['metadata']['latency_ms'] ?? 0
        ));
    }

    /**
     * Handle search knowledge AJAX request
     */
    public function handle_search_knowledge() {
        check_ajax_referer('bkm_search', 'nonce');

        if (!current_user_can('bkm_create_knowledge')) {
            wp_send_json_error(array('message' => __('Permission denied', 'bajaringan-knowledge-manager')));
        }

        $query = sanitize_text_field($_POST['query']);
        $limit = isset($_POST['limit']) ? intval($_POST['limit']) : 10;

        $results = $this->database->search_knowledge($query, $limit);

        wp_send_json_success(array('results' => $results));
    }
}
