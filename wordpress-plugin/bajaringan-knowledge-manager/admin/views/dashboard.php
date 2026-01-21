<?php
/**
 * Dashboard View
 */

if (!defined('ABSPATH')) exit;

// Check authentication
if (!is_user_logged_in()) {
    wp_redirect(wp_login_url(admin_url('admin.php?page=bari-knowledge')));
    exit;
}

if (!current_user_can('bkm_create_knowledge')) {
    wp_die(__('Access Denied', 'bajaringan-knowledge-manager'), 'Access Denied', array('response' => 403));
}

$database = new BKM_Database();

// Get statistics
global $wpdb;
$stats = array(
    'total_knowledge' => (int) $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}bari_knowledge WHERE status = 'published'"),
    'total_views' => (int) $wpdb->get_var("SELECT COALESCE(SUM(usage_count), 0) FROM {$wpdb->prefix}bari_knowledge"),
    'total_questions' => (int) $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}bari_conversations"),
    'new_this_month' => (int) $wpdb->get_var($wpdb->prepare(
        "SELECT COUNT(*) FROM {$wpdb->prefix}bari_knowledge WHERE DATE(created_at) >= %s",
        date('Y-m-01')
    ))
);

// Get popular knowledge (last 7 days)
$popular = $wpdb->get_results("
    SELECT id, title, category_id, usage_count
    FROM {$wpdb->prefix}bari_knowledge
    WHERE status = 'published'
    ORDER BY usage_count DESC
    LIMIT 5
");

// Get recent activity
$recent_activity = $wpdb->get_results($wpdb->prepare("
    SELECT k.id, k.title, k.status, k.updated_at, u.display_name
    FROM {$wpdb->prefix}bari_knowledge k
    LEFT JOIN {$wpdb->users} u ON k.updated_by = u.ID
    ORDER BY k.updated_at DESC
    LIMIT %d
", 5));

?>

<div class="wrap bkm-dashboard">
    <h1 class="wp-heading-inline">
        <?php _e('BARI Knowledge Management', 'bajaringan-knowledge-manager'); ?>
    </h1>

    <hr class="wp-header-end">

    <!-- Statistics Cards -->
    <div class="bkm-stats-grid">
        <div class="bkm-stat-card">
            <div class="bkm-stat-icon">
                <span class="dashicons dashicons-book-alt"></span>
            </div>
            <div class="bkm-stat-content">
                <div class="bkm-stat-label"><?php _e('Total Knowledge', 'bajaringan-knowledge-manager'); ?></div>
                <div class="bkm-stat-value"><?php echo number_format($stats['total_knowledge']); ?></div>
                <div class="bkm-stat-change">
                    +<?php echo $stats['new_this_month']; ?> <?php _e('new', 'bajaringan-knowledge-manager'); ?>
                </div>
            </div>
        </div>

        <div class="bkm-stat-card">
            <div class="bkm-stat-icon">
                <span class="dashicons dashicons-visibility"></span>
            </div>
            <div class="bkm-stat-content">
                <div class="bkm-stat-label"><?php _e('Views This Month', 'bajaringan-knowledge-manager'); ?></div>
                <div class="bkm-stat-value"><?php echo number_format($stats['total_views']); ?></div>
                <div class="bkm-stat-change">
                    <?php _e('All time', 'bajaringan-knowledge-manager'); ?>
                </div>
            </div>
        </div>

        <div class="bkm-stat-card">
            <div class="bkm-stat-icon">
                <span class="dashicons dashicons-format-chat"></span>
            </div>
            <div class="bkm-stat-content">
                <div class="bkm-stat-label"><?php _e('Questions Answered', 'bajaringan-knowledge-manager'); ?></div>
                <div class="bkm-stat-value"><?php echo number_format($stats['total_questions']); ?></div>
                <div class="bkm-stat-change">
                    <?php _e('Total', 'bajaringan-knowledge-manager'); ?>
                </div>
            </div>
        </div>
    </div>

    <div class="bkm-dashboard-grid">
        <!-- Popular Knowledge -->
        <div class="bkm-card">
            <div class="bkm-card-header">
                <h2>
                    <span class="dashicons dashicons-chart-line"></span>
                    <?php _e('Popular Knowledge (Last 7 Days)', 'bajaringan-knowledge-manager'); ?>
                </h2>
            </div>
            <div class="bkm-card-body">
                <?php if (!empty($popular)): ?>
                    <table class="bkm-table">
                        <tbody>
                            <?php foreach ($popular as $item): ?>
                                <tr>
                                    <td>
                                        <strong>
                                            <a href="<?php echo admin_url('admin.php?page=bari-knowledge-add&id=' . $item->id); ?>">
                                                <?php echo esc_html($item->title); ?>
                                            </a>
                                        </strong>
                                    </td>
                                    <td class="bkm-text-right">
                                        <span class="bkm-badge bkm-badge-info">
                                            <?php echo number_format($item->usage_count); ?> <?php _e('views', 'bajaringan-knowledge-manager'); ?>
                                        </span>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                <?php else: ?>
                    <p class="bkm-no-data">
                        <?php _e('No data available yet.', 'bajaringan-knowledge-manager'); ?>
                    </p>
                <?php endif; ?>
            </div>
        </div>

        <!-- Recent Activity -->
        <div class="bkm-card">
            <div class="bkm-card-header">
                <h2>
                    <span class="dashicons dashicons-clock"></span>
                    <?php _e('Recent Activity', 'bajaringan-knowledge-manager'); ?>
                </h2>
            </div>
            <div class="bkm-card-body">
                <?php if (!empty($recent_activity)): ?>
                    <div class="bkm-activity-list">
                        <?php foreach ($recent_activity as $activity): ?>
                            <div class="bkm-activity-item">
                                <div class="bkm-activity-icon">
                                    <?php
                                    switch ($activity->status) {
                                        case 'published':
                                            echo '<span class="dashicons dashicons-yes-alt bkm-status-published"></span>';
                                            break;
                                        case 'draft':
                                            echo '<span class="dashicons dashicons-edit bkm-status-draft"></span>';
                                            break;
                                        default:
                                            echo '<span class="dashicons dashicons-archive bkm-status-archived"></span>';
                                    }
                                    ?>
                                </div>
                                <div class="bkm-activity-content">
                                    <div class="bkm-activity-title">
                                        <strong><?php echo esc_html($activity->display_name); ?></strong>
                                        <?php
                                        if ($activity->status === 'published') {
                                            _e('published', 'bajaringan-knowledge-manager');
                                        } else {
                                            _e('updated', 'bajaringan-knowledge-manager');
                                        }
                                        ?>
                                        <a href="<?php echo admin_url('admin.php?page=bari-knowledge-add&id=' . $activity->id); ?>">
                                            "<?php echo esc_html($activity->title); ?>"
                                        </a>
                                    </div>
                                    <div class="bkm-activity-time">
                                        <?php echo human_time_diff(strtotime($activity->updated_at), current_time('timestamp')); ?>
                                        <?php _e('ago', 'bajaringan-knowledge-manager'); ?>
                                    </div>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                <?php else: ?>
                    <p class="bkm-no-data">
                        <?php _e('No recent activity.', 'bajaringan-knowledge-manager'); ?>
                    </p>
                <?php endif; ?>
            </div>
        </div>
    </div>

    <!-- Quick Actions -->
    <div class="bkm-card">
        <div class="bkm-card-header">
            <h2>
                <span class="dashicons dashicons-performance"></span>
                <?php _e('Quick Actions', 'bajaringan-knowledge-manager'); ?>
            </h2>
        </div>
        <div class="bkm-card-body">
            <div class="bkm-quick-actions">
                <a href="<?php echo admin_url('admin.php?page=bari-knowledge-add'); ?>" class="button button-primary button-hero">
                    <span class="dashicons dashicons-plus-alt"></span>
                    <?php _e('Add Knowledge', 'bajaringan-knowledge-manager'); ?>
                </a>

                <a href="<?php echo admin_url('admin.php?page=bari-knowledge-list'); ?>" class="button button-secondary button-hero">
                    <span class="dashicons dashicons-list-view"></span>
                    <?php _e('View All Knowledge', 'bajaringan-knowledge-manager'); ?>
                </a>

                <?php if (current_user_can('bkm_manage_settings')): ?>
                    <a href="<?php echo admin_url('admin.php?page=bari-knowledge-settings'); ?>" class="button button-secondary button-hero">
                        <span class="dashicons dashicons-admin-settings"></span>
                        <?php _e('Settings', 'bajaringan-knowledge-manager'); ?>
                    </a>
                <?php endif; ?>
            </div>
        </div>
    </div>

    <!-- Help Section -->
    <div class="bkm-card bkm-help-card">
        <div class="bkm-card-header">
            <h2>
                <span class="dashicons dashicons-info"></span>
                <?php _e('Need Help?', 'bajaringan-knowledge-manager'); ?>
            </h2>
        </div>
        <div class="bkm-card-body">
            <p><?php _e('Get started with BARI Knowledge Management:', 'bajaringan-knowledge-manager'); ?></p>
            <ul class="bkm-help-list">
                <li>
                    <strong><?php _e('Create Knowledge:', 'bajaringan-knowledge-manager'); ?></strong>
                    <?php _e('Click "Add Knowledge" to create new Q&A entries for the AI assistant.', 'bajaringan-knowledge-manager'); ?>
                </li>
                <li>
                    <strong><?php _e('Organize with Categories:', 'bajaringan-knowledge-manager'); ?></strong>
                    <?php _e('Use categories and tags to organize your knowledge base.', 'bajaringan-knowledge-manager'); ?>
                </li>
                <li>
                    <strong><?php _e('Test with AI Preview:', 'bajaringan-knowledge-manager'); ?></strong>
                    <?php _e('Before publishing, use the AI Preview feature to test how the assistant will respond.', 'bajaringan-knowledge-manager'); ?>
                </li>
                <li>
                    <strong><?php _e('Monitor Performance:', 'bajaringan-knowledge-manager'); ?></strong>
                    <?php _e('Track which knowledge entries are most popular and optimize accordingly.', 'bajaringan-knowledge-manager'); ?>
                </li>
            </ul>
        </div>
    </div>
</div>
