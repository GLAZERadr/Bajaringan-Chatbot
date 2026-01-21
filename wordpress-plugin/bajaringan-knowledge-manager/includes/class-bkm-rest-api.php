<?php
/**
 * REST API endpoints
 *
 * @package Bajaringan_Knowledge_Manager
 */

if (!defined('ABSPATH')) {
    exit;
}

class BKM_REST_API {
    /**
     * API namespace
     */
    const NAMESPACE = 'bari/v1';

    /**
     * Database instance
     */
    private $database;

    /**
     * Constructor
     */
    public function __construct() {
        $this->database = new BKM_Database();
    }

    /**
     * Register REST API routes
     */
    public function register_routes() {
        // Knowledge endpoints
        register_rest_route(self::NAMESPACE, '/knowledge', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_knowledge_list'),
            'permission_callback' => array($this, 'check_api_key'),
            'args' => array(
                'status' => array('default' => 'published'),
                'category' => array('default' => null),
                'limit' => array('default' => 20, 'validate_callback' => function($param) {
                    return is_numeric($param) && $param <= 100;
                }),
                'offset' => array('default' => 0)
            )
        ));

        register_rest_route(self::NAMESPACE, '/knowledge/search', array(
            'methods' => 'GET',
            'callback' => array($this, 'search_knowledge'),
            'permission_callback' => array($this, 'check_api_key'),
            'args' => array(
                'q' => array('required' => true),
                'limit' => array('default' => 5)
            )
        ));

        register_rest_route(self::NAMESPACE, '/knowledge/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_single_knowledge'),
            'permission_callback' => array($this, 'check_api_key')
        ));

        register_rest_route(self::NAMESPACE, '/knowledge/(?P<id>\d+)/track', array(
            'methods' => 'POST',
            'callback' => array($this, 'track_knowledge_usage'),
            'permission_callback' => array($this, 'check_api_key')
        ));

        // Authentication endpoints
        register_rest_route(self::NAMESPACE, '/auth/login', array(
            'methods' => 'POST',
            'callback' => array($this, 'login'),
            'permission_callback' => '__return_true'
        ));
    }

    /**
     * Check API key permission
     */
    public function check_api_key($request) {
        $api_key = $request->get_header('X-API-Key');

        if (empty($api_key)) {
            return new WP_Error('missing_api_key', __('API key is required', 'bajaringan-knowledge-manager'), array('status' => 401));
        }

        // Verify API key
        global $wpdb;
        $table = $wpdb->prefix . 'bari_api_keys';

        $key_prefix = substr($api_key, 0, 15); // bari_sk_xxxxxx
        $stored = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table WHERE key_prefix = %s AND is_active = 1",
            $key_prefix
        ));

        if (!$stored || !password_verify($api_key, $stored->key_hash)) {
            return new WP_Error('invalid_api_key', __('Invalid API key', 'bajaringan-knowledge-manager'), array('status' => 401));
        }

        // Update last used
        $wpdb->update(
            $table,
            array(
                'last_used_at' => current_time('mysql'),
                'usage_count' => $stored->usage_count + 1
            ),
            array('id' => $stored->id),
            array('%s', '%d'),
            array('%d')
        );

        return true;
    }

    /**
     * Get knowledge list
     */
    public function get_knowledge_list($request) {
        $args = array(
            'status' => $request->get_param('status'),
            'category_id' => $request->get_param('category'),
            'limit' => $request->get_param('limit'),
            'offset' => $request->get_param('offset')
        );

        $knowledge = $this->database->get_all_knowledge($args);

        // Count total
        global $wpdb;
        $total = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->prefix}bari_knowledge WHERE status = %s",
            $args['status']
        ));

        return rest_ensure_response(array(
            'success' => true,
            'data' => $knowledge,
            'pagination' => array(
                'total' => (int) $total,
                'limit' => $args['limit'],
                'offset' => $args['offset'],
                'has_more' => ($args['offset'] + $args['limit']) < $total
            )
        ));
    }

    /**
     * Search knowledge
     */
    public function search_knowledge($request) {
        $query = $request->get_param('q');
        $limit = $request->get_param('limit');

        $results = $this->database->search_knowledge($query, $limit);

        // Calculate relevance score
        foreach ($results as &$result) {
            $result->relevance = $this->calculate_relevance($query, $result);
        }

        return rest_ensure_response(array(
            'success' => true,
            'query' => $query,
            'data' => $results,
            'total_results' => count($results)
        ));
    }

    /**
     * Get single knowledge
     */
    public function get_single_knowledge($request) {
        $id = $request->get_param('id');
        $knowledge = $this->database->get_knowledge($id);

        if (!$knowledge) {
            return new WP_Error('not_found', __('Knowledge not found', 'bajaringan-knowledge-manager'), array('status' => 404));
        }

        return rest_ensure_response(array(
            'success' => true,
            'data' => $knowledge
        ));
    }

    /**
     * Track knowledge usage
     */
    public function track_knowledge_usage($request) {
        $id = $request->get_param('id');
        $body = json_decode($request->get_body(), true);

        $this->database->track_usage($id);

        // Save conversation if provided
        if (!empty($body['query']) && !empty($body['session_id'])) {
            $this->database->save_conversation(
                $body['user_id'] ?? null,
                $body['session_id'],
                $body['query'],
                '', // Response will be generated by AI
                array(
                    'knowledge_id' => $id,
                    'matched' => $body['matched'] ?? false
                )
            );
        }

        $knowledge = $this->database->get_knowledge($id);

        return rest_ensure_response(array(
            'success' => true,
            'message' => __('Usage tracked successfully', 'bajaringan-knowledge-manager'),
            'new_usage_count' => $knowledge->usage_count
        ));
    }

    /**
     * Login endpoint
     */
    public function login($request) {
        $body = json_decode($request->get_body(), true);
        $username = $body['username'] ?? '';
        $password = $body['password'] ?? '';

        $user = wp_authenticate($username, $password);

        if (is_wp_error($user)) {
            return new WP_Error('invalid_credentials', __('Invalid username or password', 'bajaringan-knowledge-manager'), array('status' => 401));
        }

        // Generate JWT token
        $jwt_auth = new BKM_JWT_Auth();
        $token = $jwt_auth->generate_token($user);

        return rest_ensure_response(array(
            'success' => true,
            'token' => $token,
            'user' => array(
                'id' => $user->ID,
                'login' => $user->user_login,
                'email' => $user->user_email,
                'display_name' => $user->display_name,
                'role' => $user->roles[0] ?? 'subscriber',
                'capabilities' => array_keys($user->allcaps)
            ),
            'expires_at' => date('c', time() + (60 * 60 * 24))
        ));
    }

    /**
     * Calculate relevance score
     */
    private function calculate_relevance($query, $knowledge) {
        $query_lower = strtolower($query);
        $title_lower = strtolower($knowledge->title);

        // Exact title match = 1.0
        if ($title_lower === $query_lower) {
            return 1.0;
        }

        // Title contains query = 0.9
        if (strpos($title_lower, $query_lower) !== false) {
            return 0.9;
        }

        // Keywords match = 0.8
        $keywords = json_decode($knowledge->keywords, true) ?: array();
        foreach ($keywords as $keyword) {
            if (strpos(strtolower($keyword), $query_lower) !== false) {
                return 0.8;
            }
        }

        // Content contains query = 0.6
        if (strpos(strtolower($knowledge->content), $query_lower) !== false) {
            return 0.6;
        }

        return 0.5;
    }
}
