<?php
/**
 * Knowledge List View
 */

if (!defined('ABSPATH')) exit;

if (!current_user_can('bkm_create_knowledge')) {
    wp_die(__('Access Denied', 'bajaringan-knowledge-manager'), 'Access Denied', array('response' => 403));
}

$database = new BKM_Database();

// Handle bulk actions
if (isset($_POST['bulk_action']) && isset($_POST['knowledge_ids']) && check_admin_referer('bkm_bulk_action', 'bkm_bulk_nonce')) {
    $action = sanitize_text_field($_POST['bulk_action']);
    $ids = array_map('intval', $_POST['knowledge_ids']);

    switch ($action) {
        case 'publish':
            foreach ($ids as $id) {
                $database->update_knowledge($id, array('status' => 'published'));
            }
            echo '<div class="notice notice-success"><p>' . sprintf(__('%d knowledge entries published.', 'bajaringan-knowledge-manager'), count($ids)) . '</p></div>';
            break;
        case 'draft':
            foreach ($ids as $id) {
                $database->update_knowledge($id, array('status' => 'draft'));
            }
            echo '<div class="notice notice-success"><p>' . sprintf(__('%d knowledge entries moved to draft.', 'bajaringan-knowledge-manager'), count($ids)) . '</p></div>';
            break;
        case 'delete':
            if (current_user_can('bkm_delete_knowledge')) {
                foreach ($ids as $id) {
                    $database->delete_knowledge($id);
                }
                echo '<div class="notice notice-success"><p>' . sprintf(__('%d knowledge entries deleted.', 'bajaringan-knowledge-manager'), count($ids)) . '</p></div>';
            }
            break;
    }
}

// Get filter parameters
$status = isset($_GET['status']) ? sanitize_text_field($_GET['status']) : 'published';
$category = isset($_GET['category']) ? intval($_GET['category']) : null;
$search = isset($_GET['s']) ? sanitize_text_field($_GET['s']) : '';
$paged = isset($_GET['paged']) ? max(1, intval($_GET['paged'])) : 1;
$per_page = 20;

// Get knowledge
if (!empty($search)) {
    $knowledge_list = $database->search_knowledge($search, 100);
    $total_items = count($knowledge_list);
} else {
    $args = array(
        'status' => $status,
        'category_id' => $category,
        'limit' => $per_page,
        'offset' => ($paged - 1) * $per_page
    );
    $knowledge_list = $database->get_all_knowledge($args);

    global $wpdb;
    $where = array("status = %s");
    $where_values = array($status);
    if ($category) {
        $where[] = "category_id = %d";
        $where_values[] = $category;
    }
    $total_items = $wpdb->get_var($wpdb->prepare(
        "SELECT COUNT(*) FROM {$wpdb->prefix}bari_knowledge WHERE " . implode(' AND ', $where),
        $where_values
    ));
}

$total_pages = ceil($total_items / $per_page);
$categories = $database->get_categories();

// Count by status
global $wpdb;
$status_counts = array(
    'all' => $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}bari_knowledge"),
    'published' => $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}bari_knowledge WHERE status = 'published'"),
    'draft' => $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}bari_knowledge WHERE status = 'draft'"),
    'archived' => $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}bari_knowledge WHERE status = 'archived'")
);

?>

<div class="wrap bkm-knowledge-list">
    <h1 class="wp-heading-inline">
        <?php _e('Knowledge Base', 'bajaringan-knowledge-manager'); ?>
    </h1>

    <a href="<?php echo admin_url('admin.php?page=bari-knowledge-add'); ?>" class="page-title-action">
        <?php _e('Add Knowledge', 'bajaringan-knowledge-manager'); ?>
    </a>

    <hr class="wp-header-end">

    <!-- Status Filter -->
    <ul class="subsubsub">
        <li>
            <a href="<?php echo admin_url('admin.php?page=bari-knowledge-list'); ?>" <?php echo empty($_GET['status']) || $_GET['status'] === 'published' ? 'class="current"' : ''; ?>>
                <?php _e('Published', 'bajaringan-knowledge-manager'); ?>
                <span class="count">(<?php echo $status_counts['published']; ?>)</span>
            </a> |
        </li>
        <li>
            <a href="<?php echo add_query_arg('status', 'draft'); ?>" <?php echo isset($_GET['status']) && $_GET['status'] === 'draft' ? 'class="current"' : ''; ?>>
                <?php _e('Draft', 'bajaringan-knowledge-manager'); ?>
                <span class="count">(<?php echo $status_counts['draft']; ?>)</span>
            </a> |
        </li>
        <li>
            <a href="<?php echo add_query_arg('status', 'archived'); ?>" <?php echo isset($_GET['status']) && $_GET['status'] === 'archived' ? 'class="current"' : ''; ?>>
                <?php _e('Archived', 'bajaringan-knowledge-manager'); ?>
                <span class="count">(<?php echo $status_counts['archived']; ?>)</span>
            </a>
        </li>
    </ul>

    <!-- Search and Filters -->
    <form method="get" class="bkm-filters">
        <input type="hidden" name="page" value="bari-knowledge-list">
        <input type="hidden" name="status" value="<?php echo esc_attr($status); ?>">

        <p class="search-box">
            <label class="screen-reader-text" for="knowledge-search"><?php _e('Search Knowledge', 'bajaringan-knowledge-manager'); ?></label>
            <input type="search" id="knowledge-search" name="s" value="<?php echo esc_attr($search); ?>" placeholder="<?php _e('Search knowledge...', 'bajaringan-knowledge-manager'); ?>">
            <input type="submit" class="button" value="<?php _e('Search', 'bajaringan-knowledge-manager'); ?>">
        </p>

        <div class="alignleft actions">
            <select name="category" id="filter-by-category">
                <option value=""><?php _e('All Categories', 'bajaringan-knowledge-manager'); ?></option>
                <?php foreach ($categories as $cat): ?>
                    <option value="<?php echo $cat->id; ?>" <?php selected($category, $cat->id); ?>>
                        <?php echo esc_html($cat->name); ?>
                    </option>
                <?php endforeach; ?>
            </select>
            <input type="submit" class="button" value="<?php _e('Filter', 'bajaringan-knowledge-manager'); ?>">
        </div>
    </form>

    <!-- Bulk Actions Form -->
    <form method="post" id="bkm-knowledge-form">
        <?php wp_nonce_field('bkm_bulk_action', 'bkm_bulk_nonce'); ?>

        <div class="tablenav top">
            <div class="alignleft actions bulkactions">
                <select name="bulk_action" id="bulk-action-selector-top">
                    <option value="-1"><?php _e('Bulk Actions', 'bajaringan-knowledge-manager'); ?></option>
                    <option value="publish"><?php _e('Publish', 'bajaringan-knowledge-manager'); ?></option>
                    <option value="draft"><?php _e('Move to Draft', 'bajaringan-knowledge-manager'); ?></option>
                    <?php if (current_user_can('bkm_delete_knowledge')): ?>
                        <option value="delete"><?php _e('Delete', 'bajaringan-knowledge-manager'); ?></option>
                    <?php endif; ?>
                </select>
                <input type="submit" class="button action" value="<?php _e('Apply', 'bajaringan-knowledge-manager'); ?>">
            </div>

            <div class="tablenav-pages">
                <span class="displaying-num">
                    <?php printf(__('%s items', 'bajaringan-knowledge-manager'), number_format($total_items)); ?>
                </span>
                <?php if ($total_pages > 1): ?>
                    <?php
                    echo paginate_links(array(
                        'base' => add_query_arg('paged', '%#%'),
                        'format' => '',
                        'prev_text' => __('&laquo;'),
                        'next_text' => __('&raquo;'),
                        'total' => $total_pages,
                        'current' => $paged
                    ));
                    ?>
                <?php endif; ?>
            </div>
        </div>

        <!-- Knowledge Table -->
        <table class="wp-list-table widefat fixed striped">
            <thead>
                <tr>
                    <td class="manage-column column-cb check-column">
                        <input type="checkbox" id="cb-select-all">
                    </td>
                    <th class="manage-column column-primary"><?php _e('Title', 'bajaringan-knowledge-manager'); ?></th>
                    <th class="manage-column"><?php _e('Category', 'bajaringan-knowledge-manager'); ?></th>
                    <th class="manage-column"><?php _e('Status', 'bajaringan-knowledge-manager'); ?></th>
                    <th class="manage-column"><?php _e('Views', 'bajaringan-knowledge-manager'); ?></th>
                    <th class="manage-column"><?php _e('Updated', 'bajaringan-knowledge-manager'); ?></th>
                </tr>
            </thead>
            <tbody>
                <?php if (!empty($knowledge_list)): ?>
                    <?php foreach ($knowledge_list as $item): ?>
                        <tr>
                            <th scope="row" class="check-column">
                                <input type="checkbox" name="knowledge_ids[]" value="<?php echo $item->id; ?>">
                            </th>
                            <td class="column-primary">
                                <strong>
                                    <a href="<?php echo admin_url('admin.php?page=bari-knowledge-add&id=' . $item->id); ?>">
                                        <?php echo esc_html($item->title); ?>
                                    </a>
                                </strong>
                                <div class="row-actions">
                                    <span class="edit">
                                        <a href="<?php echo admin_url('admin.php?page=bari-knowledge-add&id=' . $item->id); ?>">
                                            <?php _e('Edit', 'bajaringan-knowledge-manager'); ?>
                                        </a> |
                                    </span>
                                    <?php if (current_user_can('bkm_delete_knowledge')): ?>
                                        <span class="trash">
                                            <a href="<?php echo wp_nonce_url(admin_url('admin.php?page=bari-knowledge-list&action=delete&id=' . $item->id), 'delete-knowledge-' . $item->id); ?>" class="bkm-delete-link">
                                                <?php _e('Delete', 'bajaringan-knowledge-manager'); ?>
                                            </a>
                                        </span>
                                    <?php endif; ?>
                                </div>
                            </td>
                            <td>
                                <?php if (!empty($item->category_name)): ?>
                                    <span class="bkm-badge bkm-badge-secondary">
                                        <?php echo esc_html($item->category_name); ?>
                                    </span>
                                <?php else: ?>
                                    <span class="bkm-text-muted">—</span>
                                <?php endif; ?>
                            </td>
                            <td>
                                <?php
                                $status_class = 'bkm-badge-';
                                switch ($item->status) {
                                    case 'published':
                                        $status_class .= 'success';
                                        $status_label = __('Published', 'bajaringan-knowledge-manager');
                                        break;
                                    case 'draft':
                                        $status_class .= 'warning';
                                        $status_label = __('Draft', 'bajaringan-knowledge-manager');
                                        break;
                                    default:
                                        $status_class .= 'secondary';
                                        $status_label = __('Archived', 'bajaringan-knowledge-manager');
                                }
                                ?>
                                <span class="bkm-badge <?php echo $status_class; ?>">
                                    <?php echo $status_label; ?>
                                </span>
                            </td>
                            <td>
                                <?php echo number_format($item->usage_count); ?>
                            </td>
                            <td>
                                <?php echo human_time_diff(strtotime($item->updated_at), current_time('timestamp')); ?>
                                <?php _e('ago', 'bajaringan-knowledge-manager'); ?>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                <?php else: ?>
                    <tr>
                        <td colspan="6" class="bkm-no-data">
                            <?php if (!empty($search)): ?>
                                <?php _e('No knowledge found matching your search.', 'bajaringan-knowledge-manager'); ?>
                            <?php else: ?>
                                <?php _e('No knowledge entries yet.', 'bajaringan-knowledge-manager'); ?>
                                <a href="<?php echo admin_url('admin.php?page=bari-knowledge-add'); ?>">
                                    <?php _e('Create your first one!', 'bajaringan-knowledge-manager'); ?>
                                </a>
                            <?php endif; ?>
                        </td>
                    </tr>
                <?php endif; ?>
            </tbody>
        </table>

        <div class="tablenav bottom">
            <div class="tablenav-pages">
                <?php if ($total_pages > 1): ?>
                    <?php
                    echo paginate_links(array(
                        'base' => add_query_arg('paged', '%#%'),
                        'format' => '',
                        'prev_text' => __('&laquo;'),
                        'next_text' => __('&raquo;'),
                        'total' => $total_pages,
                        'current' => $paged
                    ));
                    ?>
                <?php endif; ?>
            </div>
        </div>
    </form>
</div>

<script>
jQuery(document).ready(function($) {
    // Select all checkbox
    $('#cb-select-all').on('change', function() {
        $('input[name="knowledge_ids[]"]').prop('checked', this.checked);
    });

    // Confirm delete
    $('.bkm-delete-link').on('click', function(e) {
        if (!confirm('<?php _e('Are you sure you want to delete this knowledge entry?', 'bajaringan-knowledge-manager'); ?>')) {
            e.preventDefault();
        }
    });

    // Confirm bulk delete
    $('#bkm-knowledge-form').on('submit', function(e) {
        var action = $('#bulk-action-selector-top').val();
        if (action === 'delete') {
            if (!confirm('<?php _e('Are you sure you want to delete the selected knowledge entries?', 'bajaringan-knowledge-manager'); ?>')) {
                e.preventDefault();
            }
        }
    });
});
</script>
