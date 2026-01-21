<?php
/**
 * Knowledge Edit/Create Form
 */

if (!defined('ABSPATH')) exit;

if (!current_user_can('bkm_create_knowledge')) {
    wp_die(__('Access Denied', 'bajaringan-knowledge-manager'), 'Access Denied', array('response' => 403));
}

$database = new BKM_Database();
$validator = new BKM_Validator();

// Check if editing existing knowledge
$knowledge_id = isset($_GET['id']) ? intval($_GET['id']) : 0;
$knowledge = $knowledge_id ? $database->get_knowledge($knowledge_id) : null;
$is_edit = !empty($knowledge);

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST' && check_admin_referer('bkm_save_knowledge', 'bkm_knowledge_nonce')) {
    $data = array(
        'title' => sanitize_text_field($_POST['title']),
        'content' => wp_kses_post($_POST['content']),
        'category_id' => isset($_POST['category_id']) && $_POST['category_id'] !== '' ? intval($_POST['category_id']) : null,
        'keywords' => isset($_POST['keywords']) ? array_map('trim', explode(',', $_POST['keywords'])) : array(),
        'requires_image' => isset($_POST['requires_image']) ? 1 : 0,
        'status' => sanitize_text_field($_POST['status']),
        'tags' => isset($_POST['tags']) ? array_map('trim', explode(',', $_POST['tags'])) : array()
    );

    // Validate
    $errors = $validator->validate_knowledge_input($data);

    if (empty($errors)) {
        if ($is_edit) {
            $result = $database->update_knowledge($knowledge_id, $data);
            if (!is_wp_error($result)) {
                echo '<div class="notice notice-success is-dismissible"><p>' . __('Knowledge updated successfully!', 'bajaringan-knowledge-manager') . '</p></div>';
                $knowledge = $database->get_knowledge($knowledge_id);
            } else {
                echo '<div class="notice notice-error"><p>' . $result->get_error_message() . '</p></div>';
            }
        } else {
            $result = $database->create_knowledge($data);
            if (!is_wp_error($result)) {
                $knowledge_id = $result;
                echo '<div class="notice notice-success is-dismissible"><p>' . __('Knowledge created successfully!', 'bajaringan-knowledge-manager') . ' <a href="' . admin_url('admin.php?page=bari-knowledge-add&id=' . $knowledge_id) . '">' . __('Edit', 'bajaringan-knowledge-manager') . '</a></p></div>';
                $knowledge = $database->get_knowledge($knowledge_id);
                $is_edit = true;
            } else {
                echo '<div class="notice notice-error"><p>' . $result->get_error_message() . '</p></div>';
            }
        }
    } else {
        echo '<div class="notice notice-error"><p>' . implode('<br>', $errors) . '</p></div>';
    }
}

$categories = $database->get_categories();

?>

<div class="wrap bkm-knowledge-edit">
    <h1>
        <?php echo $is_edit ? __('Edit Knowledge', 'bajaringan-knowledge-manager') : __('Add Knowledge', 'bajaringan-knowledge-manager'); ?>
    </h1>

    <form method="post" id="bkm-knowledge-form" class="bkm-form">
        <?php wp_nonce_field('bkm_save_knowledge', 'bkm_knowledge_nonce'); ?>
        <input type="hidden" name="knowledge_id" value="<?php echo $knowledge_id; ?>">

        <div class="bkm-form-grid">
            <!-- Main Content Area -->
            <div class="bkm-form-main">
                <!-- Title -->
                <div class="bkm-form-group">
                    <label for="title" class="bkm-label-required">
                        <?php _e('Title', 'bajaringan-knowledge-manager'); ?>
                    </label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        class="bkm-input-lg"
                        value="<?php echo $is_edit ? esc_attr($knowledge->title) : ''; ?>"
                        placeholder="<?php _e('e.g., Cara menghitung kebutuhan baja ringan', 'bajaringan-knowledge-manager'); ?>"
                        required
                        maxlength="500"
                    >
                    <p class="bkm-help-text">
                        <?php _e('Enter a clear, descriptive title for this knowledge entry.', 'bajaringan-knowledge-manager'); ?>
                    </p>
                </div>

                <!-- Content -->
                <div class="bkm-form-group">
                    <label for="content" class="bkm-label-required">
                        <?php _e('Content', 'bajaringan-knowledge-manager'); ?>
                    </label>
                    <?php
                    $content = $is_edit ? $knowledge->content : '';
                    $editor_settings = array(
                        'textarea_name' => 'content',
                        'textarea_rows' => 15,
                        'media_buttons' => true,
                        'teeny' => false,
                        'tinymce' => array(
                            'toolbar1' => 'formatselect,bold,italic,bullist,numlist,blockquote,alignleft,aligncenter,alignright,link,unlink',
                            'toolbar2' => 'undo,redo,removeformat,code'
                        )
                    );
                    wp_editor($content, 'content', $editor_settings);
                    ?>
                    <p class="bkm-help-text">
                        <?php _e('Provide the detailed answer or information for this knowledge entry.', 'bajaringan-knowledge-manager'); ?>
                    </p>
                </div>

                <!-- Keywords -->
                <div class="bkm-form-group">
                    <label for="keywords">
                        <?php _e('Keywords (comma-separated)', 'bajaringan-knowledge-manager'); ?>
                    </label>
                    <input
                        type="text"
                        id="keywords"
                        name="keywords"
                        class="bkm-input"
                        value="<?php echo $is_edit ? esc_attr(implode(', ', $knowledge->keywords)) : ''; ?>"
                        placeholder="<?php _e('kalkulator, hitung, estimasi, material, baja ringan', 'bajaringan-knowledge-manager'); ?>"
                    >
                    <p class="bkm-help-text">
                        <?php _e('Add keywords to improve search matching. Separate with commas.', 'bajaringan-knowledge-manager'); ?>
                    </p>
                </div>

                <!-- AI Preview Section -->
                <div class="bkm-card bkm-ai-preview-card">
                    <div class="bkm-card-header">
                        <h3><?php _e('💡 AI Preview', 'bajaringan-knowledge-manager'); ?></h3>
                    </div>
                    <div class="bkm-card-body">
                        <p><?php _e('Test how the AI will respond using this knowledge:', 'bajaringan-knowledge-manager'); ?></p>

                        <div class="bkm-form-group">
                            <label for="test_query">
                                <?php _e('Test Query', 'bajaringan-knowledge-manager'); ?>
                            </label>
                            <input
                                type="text"
                                id="test_query"
                                class="bkm-input"
                                placeholder="<?php _e('e.g., gimana cara hitung kebutuhan baja ringan?', 'bajaringan-knowledge-manager'); ?>"
                            >
                        </div>

                        <button type="button" id="bkm-preview-ai" class="button button-secondary">
                            <span class="dashicons dashicons-search"></span>
                            <?php _e('Test AI Response', 'bajaringan-knowledge-manager'); ?>
                        </button>

                        <div id="bkm-ai-preview-result" class="bkm-ai-preview-result" style="display: none;">
                            <h4><?php _e('AI Response:', 'bajaringan-knowledge-manager'); ?></h4>
                            <div id="bkm-ai-preview-content" class="bkm-preview-content"></div>
                            <div id="bkm-ai-preview-meta" class="bkm-preview-meta"></div>
                        </div>

                        <div id="bkm-ai-preview-loading" class="bkm-loading" style="display: none;">
                            <span class="spinner is-active"></span>
                            <?php _e('Testing...', 'bajaringan-knowledge-manager'); ?>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Sidebar -->
            <div class="bkm-form-sidebar">
                <!-- Publish Box -->
                <div class="bkm-card">
                    <div class="bkm-card-header">
                        <h3><?php _e('Publish', 'bajaringan-knowledge-manager'); ?></h3>
                    </div>
                    <div class="bkm-card-body">
                        <?php if ($is_edit): ?>
                            <p class="bkm-meta-info">
                                <strong><?php _e('Status:', 'bajaringan-knowledge-manager'); ?></strong>
                                <span class="bkm-badge bkm-badge-<?php echo $knowledge->status === 'published' ? 'success' : 'warning'; ?>">
                                    <?php echo ucfirst($knowledge->status); ?>
                                </span>
                            </p>
                            <p class="bkm-meta-info">
                                <strong><?php _e('Version:', 'bajaringan-knowledge-manager'); ?></strong>
                                <?php echo $knowledge->version; ?>
                            </p>
                            <p class="bkm-meta-info">
                                <strong><?php _e('Views:', 'bajaringan-knowledge-manager'); ?></strong>
                                <?php echo number_format($knowledge->usage_count); ?>
                            </p>
                            <p class="bkm-meta-info">
                                <strong><?php _e('Last Updated:', 'bajaringan-knowledge-manager'); ?></strong><br>
                                <?php echo human_time_diff(strtotime($knowledge->updated_at), current_time('timestamp')); ?> <?php _e('ago', 'bajaringan-knowledge-manager'); ?>
                            </p>
                            <hr>
                        <?php endif; ?>

                        <div class="bkm-form-group">
                            <label for="status">
                                <?php _e('Status', 'bajaringan-knowledge-manager'); ?>
                            </label>
                            <select id="status" name="status" class="bkm-select">
                                <option value="draft" <?php echo $is_edit && $knowledge->status === 'draft' ? 'selected' : ''; ?>>
                                    <?php _e('Draft', 'bajaringan-knowledge-manager'); ?>
                                </option>
                                <?php if (current_user_can('bkm_publish_knowledge')): ?>
                                    <option value="published" <?php echo $is_edit && $knowledge->status === 'published' ? 'selected' : ''; ?>>
                                        <?php _e('Published', 'bajaringan-knowledge-manager'); ?>
                                    </option>
                                <?php endif; ?>
                                <option value="archived" <?php echo $is_edit && $knowledge->status === 'archived' ? 'selected' : ''; ?>>
                                    <?php _e('Archived', 'bajaringan-knowledge-manager'); ?>
                                </option>
                            </select>
                        </div>

                        <div class="bkm-form-actions">
                            <button type="submit" class="button button-primary button-large" style="width: 100%;">
                                <span class="dashicons dashicons-saved"></span>
                                <?php echo $is_edit ? __('Update', 'bajaringan-knowledge-manager') : __('Create', 'bajaringan-knowledge-manager'); ?>
                            </button>

                            <?php if (!$is_edit || $knowledge->status !== 'published'): ?>
                                <button type="button" id="bkm-save-draft" class="button button-secondary" style="width: 100%; margin-top: 10px;">
                                    <span class="dashicons dashicons-backup"></span>
                                    <?php _e('Save as Draft', 'bajaringan-knowledge-manager'); ?>
                                </button>
                            <?php endif; ?>
                        </div>

                        <div id="bkm-autosave-status" class="bkm-autosave-status"></div>
                    </div>
                </div>

                <!-- Category -->
                <div class="bkm-card">
                    <div class="bkm-card-header">
                        <h3><?php _e('Category', 'bajaringan-knowledge-manager'); ?></h3>
                    </div>
                    <div class="bkm-card-body">
                        <select id="category_id" name="category_id" class="bkm-select">
                            <option value=""><?php _e('— Select Category —', 'bajaringan-knowledge-manager'); ?></option>
                            <?php foreach ($categories as $cat): ?>
                                <option value="<?php echo $cat->id; ?>" <?php echo $is_edit && $knowledge->category_id == $cat->id ? 'selected' : ''; ?>>
                                    <?php echo esc_html($cat->name); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                </div>

                <!-- Tags -->
                <div class="bkm-card">
                    <div class="bkm-card-header">
                        <h3><?php _e('Tags', 'bajaringan-knowledge-manager'); ?></h3>
                    </div>
                    <div class="bkm-card-body">
                        <input
                            type="text"
                            id="tags"
                            name="tags"
                            class="bkm-input"
                            value="<?php echo $is_edit ? esc_attr(implode(', ', array_column($knowledge->tags, 'name'))) : ''; ?>"
                            placeholder="<?php _e('kalkulator, baja ringan', 'bajaringan-knowledge-manager'); ?>"
                        >
                        <p class="bkm-help-text">
                            <?php _e('Separate tags with commas', 'bajaringan-knowledge-manager'); ?>
                        </p>
                    </div>
                </div>

                <!-- Options -->
                <div class="bkm-card">
                    <div class="bkm-card-header">
                        <h3><?php _e('Options', 'bajaringan-knowledge-manager'); ?></h3>
                    </div>
                    <div class="bkm-card-body">
                        <label class="bkm-checkbox-label">
                            <input
                                type="checkbox"
                                name="requires_image"
                                value="1"
                                <?php echo $is_edit && $knowledge->requires_image ? 'checked' : ''; ?>
                            >
                            <?php _e('Requires Image', 'bajaringan-knowledge-manager'); ?>
                        </label>
                        <p class="bkm-help-text">
                            <?php _e('Check if the AI should expect user to upload an image for this query.', 'bajaringan-knowledge-manager'); ?>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </form>
</div>

<script>
jQuery(document).ready(function($) {
    // Autosave functionality
    var autosaveTimer;
    var lastSavedData = '';

    function autosave() {
        var formData = {
            action: 'bkm_autosave',
            nonce: '<?php echo wp_create_nonce('bkm_autosave'); ?>',
            knowledge_id: <?php echo $knowledge_id ? $knowledge_id : 0; ?>,
            title: $('#title').val(),
            content: tinyMCE.get('content') ? tinyMCE.get('content').getContent() : $('#content').val(),
            category_id: $('#category_id').val(),
            keywords: $('#keywords').val()
        };

        var currentData = JSON.stringify(formData);
        if (currentData === lastSavedData) {
            return;
        }

        $.post(ajaxurl, formData, function(response) {
            if (response.success) {
                $('#bkm-autosave-status').html('<span class="bkm-text-success">✓ ' + response.data.message + '</span>');
                lastSavedData = currentData;
                setTimeout(function() {
                    $('#bkm-autosave-status').html('');
                }, 3000);
            }
        });
    }

    // Trigger autosave on content change
    $('#title, #keywords').on('input', function() {
        clearTimeout(autosaveTimer);
        autosaveTimer = setTimeout(autosave, 3000);
    });

    if (tinyMCE.get('content')) {
        tinyMCE.get('content').on('change keyup', function() {
            clearTimeout(autosaveTimer);
            autosaveTimer = setTimeout(autosave, 3000);
        });
    }

    // Save as draft button
    $('#bkm-save-draft').on('click', function() {
        $('#status').val('draft');
        $('#bkm-knowledge-form').submit();
    });

    // AI Preview
    $('#bkm-preview-ai').on('click', function() {
        var testQuery = $('#test_query').val();
        var content = tinyMCE.get('content') ? tinyMCE.get('content').getContent() : $('#content').val();

        if (!testQuery) {
            alert('<?php _e('Please enter a test query', 'bajaringan-knowledge-manager'); ?>');
            return;
        }

        $('#bkm-ai-preview-loading').show();
        $('#bkm-ai-preview-result').hide();

        $.post(ajaxurl, {
            action: 'bkm_preview_ai',
            nonce: '<?php echo wp_create_nonce('bkm_preview_ai'); ?>',
            test_query: testQuery,
            content: content
        }, function(response) {
            $('#bkm-ai-preview-loading').hide();

            if (response.success) {
                $('#bkm-ai-preview-content').html(response.data.ai_response);
                $('#bkm-ai-preview-meta').html(
                    '<small><strong>Confidence:</strong> ' + (response.data.confidence * 100).toFixed(0) + '% | ' +
                    '<strong>Latency:</strong> ' + response.data.latency_ms + 'ms</small>'
                );
                $('#bkm-ai-preview-result').show();
            } else {
                alert('Error: ' + response.data.message);
            }
        });
    });
});
</script>
