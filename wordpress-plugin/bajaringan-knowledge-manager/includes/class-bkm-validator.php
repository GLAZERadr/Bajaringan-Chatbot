<?php
/**
 * Input validation and sanitization
 */

if (!defined('ABSPATH')) exit;

class BKM_Validator {
    public function validate_knowledge_input($data) {
        $errors = array();

        if (empty($data['title']) || strlen($data['title']) > 500) {
            $errors[] = __('Title must be between 1 and 500 characters', 'bajaringan-knowledge-manager');
        }

        if (empty($data['content'])) {
            $errors[] = __('Content is required', 'bajaringan-knowledge-manager');
        }

        if (!empty($data['category_id']) && !$this->category_exists($data['category_id'])) {
            $errors[] = __('Invalid category', 'bajaringan-knowledge-manager');
        }

        return $errors;
    }

    public function sanitize_knowledge_input($data) {
        return array(
            'title' => sanitize_text_field($data['title']),
            'content' => wp_kses_post($data['content']),
            'category_id' => isset($data['category_id']) ? absint($data['category_id']) : null,
            'keywords' => isset($data['keywords']) ? array_map('sanitize_text_field', (array)$data['keywords']) : array(),
            'requires_image' => isset($data['requires_image']) ? (bool)$data['requires_image'] : false,
            'status' => in_array($data['status'] ?? '', array('draft', 'published', 'archived')) ? $data['status'] : 'draft'
        );
    }

    private function category_exists($category_id) {
        global $wpdb;
        $count = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->prefix}bari_categories WHERE id = %d",
            $category_id
        ));
        return $count > 0;
    }
}
