<?php
/**
 * Database operations class
 *
 * @package Bajaringan_Knowledge_Manager
 */

if (!defined('ABSPATH')) {
    exit;
}

class BKM_Database {
    /**
     * WordPress database instance
     */
    private $wpdb;

    /**
     * Table names
     */
    private $table_knowledge;
    private $table_categories;
    private $table_tags;
    private $table_knowledge_tags;
    private $table_versions;
    private $table_conversations;
    private $table_api_keys;

    /**
     * Constructor
     */
    public function __construct() {
        global $wpdb;
        $this->wpdb = $wpdb;

        $this->table_knowledge = $wpdb->prefix . 'bari_knowledge';
        $this->table_categories = $wpdb->prefix . 'bari_categories';
        $this->table_tags = $wpdb->prefix . 'bari_tags';
        $this->table_knowledge_tags = $wpdb->prefix . 'bari_knowledge_tags';
        $this->table_versions = $wpdb->prefix . 'bari_knowledge_versions';
        $this->table_conversations = $wpdb->prefix . 'bari_conversations';
        $this->table_api_keys = $wpdb->prefix . 'bari_api_keys';
    }

    /**
     * Create database tables
     */
    public static function create_tables() {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');

        // Knowledge table
        $sql_knowledge = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}bari_knowledge (
            id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            title VARCHAR(500) NOT NULL,
            content LONGTEXT NOT NULL,
            category_id BIGINT(20) UNSIGNED,
            keywords TEXT,
            status VARCHAR(20) NOT NULL DEFAULT 'draft',
            requires_image TINYINT(1) NOT NULL DEFAULT 0,
            version INT NOT NULL DEFAULT 1,
            usage_count BIGINT NOT NULL DEFAULT 0,
            created_by BIGINT(20) UNSIGNED,
            updated_by BIGINT(20) UNSIGNED,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            PRIMARY KEY (id),
            KEY idx_status (status),
            KEY idx_category (category_id),
            KEY idx_usage (usage_count)
        ) $charset_collate;";

        dbDelta($sql_knowledge);

        // Categories table
        $sql_categories = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}bari_categories (
            id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            name VARCHAR(255) NOT NULL,
            slug VARCHAR(255) NOT NULL,
            description TEXT,
            parent_id BIGINT(20) UNSIGNED DEFAULT NULL,
            display_order INT NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            PRIMARY KEY (id),
            UNIQUE KEY idx_slug (slug),
            KEY idx_parent (parent_id)
        ) $charset_collate;";

        dbDelta($sql_categories);

        // Tags table
        $sql_tags = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}bari_tags (
            id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            name VARCHAR(100) NOT NULL,
            slug VARCHAR(100) NOT NULL,
            created_at DATETIME NOT NULL,
            PRIMARY KEY (id),
            UNIQUE KEY idx_name (name),
            UNIQUE KEY idx_slug (slug)
        ) $charset_collate;";

        dbDelta($sql_tags);

        // Knowledge-Tag relationship table
        $sql_knowledge_tags = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}bari_knowledge_tags (
            knowledge_id BIGINT(20) UNSIGNED NOT NULL,
            tag_id BIGINT(20) UNSIGNED NOT NULL,
            created_at DATETIME NOT NULL,
            PRIMARY KEY (knowledge_id, tag_id),
            KEY idx_tag (tag_id)
        ) $charset_collate;";

        dbDelta($sql_knowledge_tags);

        // Version history table
        $sql_versions = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}bari_knowledge_versions (
            id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            knowledge_id BIGINT(20) UNSIGNED NOT NULL,
            version INT NOT NULL,
            title VARCHAR(500),
            content LONGTEXT,
            category_id BIGINT(20) UNSIGNED,
            keywords TEXT,
            status VARCHAR(20),
            changed_fields TEXT,
            change_summary VARCHAR(500),
            created_by BIGINT(20) UNSIGNED,
            created_at DATETIME NOT NULL,
            PRIMARY KEY (id),
            KEY idx_knowledge (knowledge_id, version)
        ) $charset_collate;";

        dbDelta($sql_versions);

        // Conversations table (for analytics)
        $sql_conversations = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}bari_conversations (
            id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id BIGINT(20) UNSIGNED DEFAULT NULL,
            session_id VARCHAR(100) NOT NULL,
            query TEXT NOT NULL,
            response LONGTEXT NOT NULL,
            metadata TEXT,
            created_at DATETIME NOT NULL,
            PRIMARY KEY (id),
            KEY idx_user (user_id),
            KEY idx_session (session_id),
            KEY idx_created (created_at)
        ) $charset_collate;";

        dbDelta($sql_conversations);

        // API Keys table
        $sql_api_keys = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}bari_api_keys (
            id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            name VARCHAR(255) NOT NULL,
            key_prefix VARCHAR(20) NOT NULL,
            key_hash VARCHAR(255) NOT NULL,
            permissions TEXT,
            is_active TINYINT(1) NOT NULL DEFAULT 1,
            last_used_at DATETIME DEFAULT NULL,
            usage_count BIGINT NOT NULL DEFAULT 0,
            created_by BIGINT(20) UNSIGNED,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            expires_at DATETIME DEFAULT NULL,
            PRIMARY KEY (id),
            UNIQUE KEY idx_key_prefix (key_prefix),
            KEY idx_active (is_active)
        ) $charset_collate;";

        dbDelta($sql_api_keys);
    }

    /**
     * Create default categories
     */
    public static function create_default_categories() {
        global $wpdb;
        $table = $wpdb->prefix . 'bari_categories';

        $categories = array(
            array('name' => 'Kalkulator', 'slug' => 'kalkulator', 'description' => 'Pertanyaan tentang kalkulasi material', 'display_order' => 1),
            array('name' => 'Produk', 'slug' => 'produk', 'description' => 'Informasi produk dan harga', 'display_order' => 2),
            array('name' => 'Teknis', 'slug' => 'teknis', 'description' => 'Pertanyaan teknis pemasangan', 'display_order' => 3),
            array('name' => 'Maintenance', 'slug' => 'maintenance', 'description' => 'Perawatan dan perbaikan', 'display_order' => 4),
            array('name' => 'Garansi', 'slug' => 'garansi', 'description' => 'Informasi garansi produk', 'display_order' => 5),
        );

        foreach ($categories as $category) {
            $exists = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM $table WHERE slug = %s",
                $category['slug']
            ));

            if (!$exists) {
                $category['created_at'] = current_time('mysql');
                $category['updated_at'] = current_time('mysql');
                $wpdb->insert($table, $category, array('%s', '%s', '%s', '%d', '%s', '%s'));
            }
        }
    }

    /**
     * Get knowledge by ID
     */
    public function get_knowledge($id) {
        $query = $this->wpdb->prepare(
            "SELECT k.*, c.name as category_name, c.slug as category_slug,
                    u1.display_name as created_by_name,
                    u2.display_name as updated_by_name
             FROM {$this->table_knowledge} k
             LEFT JOIN {$this->table_categories} c ON k.category_id = c.id
             LEFT JOIN {$this->wpdb->users} u1 ON k.created_by = u1.ID
             LEFT JOIN {$this->wpdb->users} u2 ON k.updated_by = u2.ID
             WHERE k.id = %d",
            $id
        );

        $knowledge = $this->wpdb->get_row($query);

        if ($knowledge) {
            // Get tags
            $knowledge->tags = $this->get_knowledge_tags($id);

            // Parse keywords
            $knowledge->keywords = json_decode($knowledge->keywords, true) ?: array();
        }

        return $knowledge;
    }

    /**
     * Get all knowledge
     */
    public function get_all_knowledge($args = array()) {
        $defaults = array(
            'status' => 'published',
            'category_id' => null,
            'limit' => 20,
            'offset' => 0,
            'orderby' => 'created_at',
            'order' => 'DESC'
        );

        $args = wp_parse_args($args, $defaults);

        $where = array();
        $where_values = array();

        if (!empty($args['status'])) {
            $where[] = "k.status = %s";
            $where_values[] = $args['status'];
        }

        if (!empty($args['category_id'])) {
            $where[] = "k.category_id = %d";
            $where_values[] = $args['category_id'];
        }

        $where_clause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

        $query = "SELECT k.*, c.name as category_name, c.slug as category_slug
                  FROM {$this->table_knowledge} k
                  LEFT JOIN {$this->table_categories} c ON k.category_id = c.id
                  $where_clause
                  ORDER BY k.{$args['orderby']} {$args['order']}
                  LIMIT %d OFFSET %d";

        $where_values[] = $args['limit'];
        $where_values[] = $args['offset'];

        if (!empty($where_values)) {
            $query = $this->wpdb->prepare($query, $where_values);
        }

        return $this->wpdb->get_results($query);
    }

    /**
     * Search knowledge
     */
    public function search_knowledge($query, $limit = 5) {
        $search_query = $this->wpdb->prepare(
            "SELECT k.*, c.name as category_name, c.slug as category_slug
             FROM {$this->table_knowledge} k
             LEFT JOIN {$this->table_categories} c ON k.category_id = c.id
             WHERE k.status = 'published'
               AND (k.title LIKE %s OR k.content LIKE %s OR k.keywords LIKE %s)
             ORDER BY
               CASE
                 WHEN k.title LIKE %s THEN 1
                 WHEN k.keywords LIKE %s THEN 2
                 ELSE 3
               END,
               k.usage_count DESC
             LIMIT %d",
            '%' . $this->wpdb->esc_like($query) . '%',
            '%' . $this->wpdb->esc_like($query) . '%',
            '%' . $this->wpdb->esc_like($query) . '%',
            '%' . $this->wpdb->esc_like($query) . '%',
            '%' . $this->wpdb->esc_like($query) . '%',
            $limit
        );

        return $this->wpdb->get_results($search_query);
    }

    /**
     * Create knowledge
     */
    public function create_knowledge($data) {
        $sanitized_data = array(
            'title' => $data['title'],
            'content' => $data['content'],
            'category_id' => $data['category_id'] ?? null,
            'keywords' => json_encode($data['keywords'] ?? array()),
            'status' => $data['status'] ?? 'draft',
            'requires_image' => $data['requires_image'] ?? 0,
            'created_by' => get_current_user_id(),
            'created_at' => current_time('mysql'),
            'updated_at' => current_time('mysql')
        );

        $result = $this->wpdb->insert(
            $this->table_knowledge,
            $sanitized_data,
            array('%s', '%s', '%d', '%s', '%s', '%d', '%d', '%s', '%s')
        );

        if ($result === false) {
            return new WP_Error('db_error', __('Failed to create knowledge', 'bajaringan-knowledge-manager'));
        }

        $knowledge_id = $this->wpdb->insert_id;

        // Create version snapshot
        $this->create_version_snapshot($knowledge_id, 1);

        // Process tags if provided
        if (!empty($data['tags'])) {
            $this->update_knowledge_tags($knowledge_id, $data['tags']);
        }

        // Fire action hook
        do_action('bkm_knowledge_created', $knowledge_id);

        return $knowledge_id;
    }

    /**
     * Update knowledge
     */
    public function update_knowledge($id, $data) {
        $current = $this->get_knowledge($id);
        if (!$current) {
            return new WP_Error('not_found', __('Knowledge not found', 'bajaringan-knowledge-manager'));
        }

        $sanitized_data = array(
            'title' => $data['title'],
            'content' => $data['content'],
            'category_id' => $data['category_id'] ?? null,
            'keywords' => json_encode($data['keywords'] ?? array()),
            'status' => $data['status'] ?? $current->status,
            'requires_image' => $data['requires_image'] ?? $current->requires_image,
            'version' => $current->version + 1,
            'updated_by' => get_current_user_id(),
            'updated_at' => current_time('mysql')
        );

        $result = $this->wpdb->update(
            $this->table_knowledge,
            $sanitized_data,
            array('id' => $id),
            array('%s', '%s', '%d', '%s', '%s', '%d', '%d', '%d', '%s'),
            array('%d')
        );

        if ($result === false) {
            return new WP_Error('db_error', __('Failed to update knowledge', 'bajaringan-knowledge-manager'));
        }

        // Create version snapshot
        $this->create_version_snapshot($id, $current->version + 1);

        // Process tags if provided
        if (isset($data['tags'])) {
            $this->update_knowledge_tags($id, $data['tags']);
        }

        // Fire action hook
        $action = ($data['status'] === 'published') ? 'bkm_knowledge_published' : 'bkm_knowledge_updated';
        do_action($action, $id, $data);

        return true;
    }

    /**
     * Delete knowledge
     */
    public function delete_knowledge($id) {
        $result = $this->wpdb->delete(
            $this->table_knowledge,
            array('id' => $id),
            array('%d')
        );

        if ($result === false) {
            return new WP_Error('db_error', __('Failed to delete knowledge', 'bajaringan-knowledge-manager'));
        }

        // Delete tags
        $this->wpdb->delete(
            $this->table_knowledge_tags,
            array('knowledge_id' => $id),
            array('%d')
        );

        // Fire action hook
        do_action('bkm_knowledge_deleted', $id);

        return true;
    }

    /**
     * Track knowledge usage
     */
    public function track_usage($knowledge_id) {
        $this->wpdb->query($this->wpdb->prepare(
            "UPDATE {$this->table_knowledge} SET usage_count = usage_count + 1 WHERE id = %d",
            $knowledge_id
        ));
    }

    /**
     * Create version snapshot
     */
    private function create_version_snapshot($knowledge_id, $version) {
        $knowledge = $this->get_knowledge($knowledge_id);

        $this->wpdb->insert(
            $this->table_versions,
            array(
                'knowledge_id' => $knowledge_id,
                'version' => $version,
                'title' => $knowledge->title,
                'content' => $knowledge->content,
                'category_id' => $knowledge->category_id,
                'keywords' => json_encode($knowledge->keywords),
                'status' => $knowledge->status,
                'created_by' => get_current_user_id(),
                'created_at' => current_time('mysql')
            ),
            array('%d', '%d', '%s', '%s', '%d', '%s', '%s', '%d', '%s')
        );
    }

    /**
     * Get knowledge tags
     */
    private function get_knowledge_tags($knowledge_id) {
        $query = $this->wpdb->prepare(
            "SELECT t.* FROM {$this->table_tags} t
             INNER JOIN {$this->table_knowledge_tags} kt ON t.id = kt.tag_id
             WHERE kt.knowledge_id = %d",
            $knowledge_id
        );

        return $this->wpdb->get_results($query);
    }

    /**
     * Update knowledge tags
     */
    private function update_knowledge_tags($knowledge_id, $tags) {
        // Delete existing tags
        $this->wpdb->delete(
            $this->table_knowledge_tags,
            array('knowledge_id' => $knowledge_id),
            array('%d')
        );

        // Add new tags
        foreach ($tags as $tag_name) {
            $tag_slug = sanitize_title($tag_name);

            // Get or create tag
            $tag_id = $this->wpdb->get_var($this->wpdb->prepare(
                "SELECT id FROM {$this->table_tags} WHERE slug = %s",
                $tag_slug
            ));

            if (!$tag_id) {
                $this->wpdb->insert(
                    $this->table_tags,
                    array('name' => $tag_name, 'slug' => $tag_slug, 'created_at' => current_time('mysql')),
                    array('%s', '%s', '%s')
                );
                $tag_id = $this->wpdb->insert_id;
            }

            // Link tag to knowledge
            $this->wpdb->insert(
                $this->table_knowledge_tags,
                array('knowledge_id' => $knowledge_id, 'tag_id' => $tag_id, 'created_at' => current_time('mysql')),
                array('%d', '%d', '%s')
            );
        }
    }

    /**
     * Get categories
     */
    public function get_categories() {
        return $this->wpdb->get_results(
            "SELECT * FROM {$this->table_categories} ORDER BY display_order ASC, name ASC"
        );
    }

    /**
     * Save conversation (for analytics)
     */
    public function save_conversation($user_id, $session_id, $query, $response, $metadata = array()) {
        $this->wpdb->insert(
            $this->table_conversations,
            array(
                'user_id' => $user_id,
                'session_id' => $session_id,
                'query' => $query,
                'response' => $response,
                'metadata' => json_encode($metadata),
                'created_at' => current_time('mysql')
            ),
            array('%d', '%s', '%s', '%s', '%s', '%s')
        );
    }
}
