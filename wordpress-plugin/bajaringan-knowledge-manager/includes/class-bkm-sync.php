<?php
/**
 * Sync with Next.js
 */

if (!defined('ABSPATH')) exit;

class BKM_Sync {
    public function trigger_sync_webhook($knowledge_id, $data = array()) {
        $webhook_url = get_option('bkm_nextjs_webhook_url');

        if (empty($webhook_url)) {
            error_log('BKM: Webhook URL not configured');
            return;
        }

        $database = new BKM_Database();
        $knowledge = $database->get_knowledge($knowledge_id);

        $payload = array(
            'event' => 'knowledge.updated',
            'timestamp' => current_time('c'),
            'data' => array(
                'id' => $knowledge->id,
                'title' => $knowledge->title,
                'status' => $knowledge->status
            )
        );

        $response = wp_remote_post($webhook_url . '/api/webhooks/knowledge-updated', array(
            'headers' => array(
                'Content-Type' => 'application/json',
                'X-Webhook-Secret' => get_option('bkm_webhook_secret')
            ),
            'body' => json_encode($payload),
            'timeout' => 10
        ));

        if (is_wp_error($response)) {
            error_log('BKM: Webhook failed - ' . $response->get_error_message());
        } else {
            error_log('BKM: Webhook sent successfully for knowledge #' . $knowledge_id);
        }
    }
}
