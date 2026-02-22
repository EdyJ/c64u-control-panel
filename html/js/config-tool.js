/**
 * config-tool.js
 * Configuration Tool - Page Logic
 *
 * Handles loading, displaying, and modifying C64U configuration.
 */

let configData = {};
let searchTerms = [];

// ============================================================================
// INITIALIZATION
// ============================================================================

window.initializeApp = function() {
    console.log('=== Configuration Tool Initializing ===');

    loadAllConfig();

    $('#refreshBtn').click(function() {
        reloadInterface();
    });

    console.log('=== Initialization Complete ===');
};

// ============================================================================
// MAIN LOAD FUNCTIONS
// ============================================================================

function loadAllConfig() {
    getConfigCategories(
        function(categories) {
            renderCategories(categories);

            for (const category of categories) {
                loadCategoryData(category);
            }
        },
        function(error) {
            showError('Error loading configuration: ' + error);
        }
    );
}

function reloadInterface() {
    configData = {};
    $('#categories-container').html('<div class="loading-indicator">Loading configuration...</div>');
    loadAllConfig();
}

// ============================================================================
// CATEGORY RENDERING
// ============================================================================

function renderCategories(categories) {
    const $container = $('#categories-container');
    $container.empty();

    categories.forEach(category => {
        configData[category] = { loaded: false, items: {} };

        const $section = $(`
            <div class="foldable" data-category="${category}">
                <div class="foldable-header">
                    <span class="category-title">${category}</span>
                    <div>
                        <span class="spinner"></span>
                        <span class="caption"></span>
                        <span class="arrow">▼</span>
                    </div>
                </div>
                <div class="foldable-content"></div>
            </div>
        `);
        $container.append($section);
    });

    $('.foldable-header').click(function() {
        const $header = $(this);
        const $foldable = $header.parent();
        const $content = $header.next('.foldable-content');
        const category = $foldable.data('category');

        if ($header.hasClass('open')) {
            $content.slideUp(300, function() {
                $header.removeClass('open');
                $header.find('.arrow').text('▼');
            });
        } else {
            $header.addClass('open');
            $header.find('.arrow').text('▲');

            if (configData[category].loaded) {
                if ($content.children().length === 0) {
                    renderCategoryItems(category);
                }
                $content.slideDown(300);
            } else {
                $content.removeClass('loading').addClass('loading').text('Loading...').slideDown(300);
            }
        }
    });
}

// ============================================================================
// DATA LOADING
// ============================================================================

function loadCategoryData(category) {
    getConfigItems(
        category,
        function(items) {
            const itemNames = Object.keys(items);

            if (itemNames.length === 0) {
                completeCategoryLoad(category, []);
                return;
            }

            let loadedCount = 0;
            const itemDetailsMap = {};

            for (const itemName of itemNames) {
                getConfigItemDetails(
                    category,
                    itemName,
                    function(itemDetails) {
                        itemDetailsMap[itemName] = itemDetails;
                        loadedCount++;

                        if (loadedCount === itemNames.length) {
                            configData[category].items = itemDetailsMap;
                            completeCategoryLoad(category, itemNames);
                        }
                    },
                    function(error) {
                        itemDetailsMap[itemName] = { error: error };
                        loadedCount++;

                        if (loadedCount === itemNames.length) {
                            configData[category].items = itemDetailsMap;
                            completeCategoryLoad(category, itemNames);
                        }
                    }
                );
            }
        },
        function(error) {
            configData[category].loaded = true;
            configData[category].error = error;
            const $foldable = $(`.foldable[data-category="${category}"]`);
            $foldable.find('.spinner').hide();

            const $header = $foldable.find('.foldable-header');
            if ($header.hasClass('open')) {
                $foldable.find('.foldable-content').removeClass('loading').html('<div class="error-message-inline">Error: ' + error + '</div>');
            }
        }
    );
}

function completeCategoryLoad(category, itemNames) {
    configData[category].loaded = true;

    const $foldable = $(`.foldable[data-category="${category}"]`);
    $foldable.find('.spinner').hide();

    const itemCount = itemNames.length;
    $foldable.find('.category-title').append(`<span class="caption">(${itemCount})</span>`);

    const $content = $foldable.find('.foldable-content');
    $content.removeClass('loading');
    renderCategoryItems(category);

    const $header = $foldable.find('.foldable-header');
    if ($header.hasClass('open')) {
        $content.slideDown(300);
    }

    applySearchFilter();
}

// ============================================================================
// ITEM RENDERING
// ============================================================================

function renderCategoryItems(category) {
    const $content = $(`.foldable[data-category="${category}"] .foldable-content`);

    if ($content.children().length > 0) {
        return;
    }

    $content.empty();

    const items = configData[category].items;
    const itemNames = Object.keys(items);

    if (itemNames.length === 0) {
        $content.html('<div class="info-message">No items found</div>');
        return;
    }

    itemNames.forEach(itemName => {
        const itemData = items[itemName];
        const $item = createItemControl(category, itemName, itemData);
        $content.append($item);
    });
}

function createItemControl(category, itemName, itemData) {
    if (itemData.error) {
        showError('Error loading item ' + itemName + ': ' + itemData.error);
        return $(`<div class="config-item" data-item="${itemName}">
            <div class="config-item-name">${itemName}</div>
            <div class="error-message-inline">Error: ${itemData.error}</div>
        </div>`);
    }

    const $item = $('<div class="config-item"></div>').attr('data-item', itemName);
    const $name = $(`<div class="config-item-name">${itemName}</div>`);
    const $controls = $('<div class="config-item-controls"></div>');

    let $input;

    if (itemData.values && Array.isArray(itemData.values)) {
        $input = $('<select></select>');
        itemData.values.forEach(value => {
            const $option = $(`<option value="${value}">${value}</option>`);
            if (value === itemData.current) {
                $option.prop('selected', true);
            }
            $input.append($option);
        });
    } else if (typeof itemData.min !== 'undefined' && typeof itemData.max !== 'undefined') {
        $input = $('<input type="number">');
        $input.attr('min', itemData.min);
        $input.attr('max', itemData.max);
        $input.val(itemData.current);
        if (itemData.format) {
            $input.attr('placeholder', itemData.format);
        }
    } else {
        $input = $('<input type="text">');
        $input.val(itemData.current);
    }

    if (typeof itemData.default !== 'undefined') {
        $input.attr('title', `Default: ${itemData.default}`);
    }

    const $modifyBtn = $('<button class="btn-primary modify-btn">Modify</button>');
    const $revertBtn = $('<button class="btn-warning revert-btn">Revert</button>');
    const $successCheck = $('<span class="success-check">✓</span>');

    $input.on('change input', function() {
        const newValue = $(this).val();
        const currentValue = String(itemData.current);
        if (newValue !== currentValue) {
            $modifyBtn.addClass('visible');
            $revertBtn.addClass('visible');
        } else {
            $modifyBtn.removeClass('visible');
            $revertBtn.removeClass('visible');
        }
        $successCheck.removeClass('visible');
    });

    $modifyBtn.click(function() {
        const newValue = $input.val();
        modifyConfigItem(category, itemName, newValue, $modifyBtn, $revertBtn, $successCheck, itemData);
    });

    $revertBtn.click(function() {
        $revertBtn.prop('disabled', true).text('Reverting...');
        $modifyBtn.prop('disabled', true);

        getConfigItemDetails(
            category,
            itemName,
            function(itemDetails) {
                const currentValueFromAPI = itemDetails.current;
                $input.val(currentValueFromAPI);
                itemData.current = currentValueFromAPI;
                $modifyBtn.removeClass('visible').prop('disabled', false);
                $revertBtn.removeClass('visible').prop('disabled', false).text('Revert');
                $successCheck.removeClass('visible');
            },
            function(error) {
                showError('Error reverting ' + itemName + ': ' + error);
                $revertBtn.prop('disabled', false).text('Revert');
                $modifyBtn.prop('disabled', false);
            }
        );
    });

    $controls.append($modifyBtn);
    $controls.append($revertBtn);
    $controls.append($input);
    $controls.append($successCheck);

    $item.append($name);
    $item.append($controls);

    const $wrapper = $('<div class="item"></div>');
    $wrapper.append($item);

    return $wrapper;
}

function modifyConfigItem(category, itemName, newValue, $modifyBtn, $revertBtn, $successCheck, itemData) {
    $modifyBtn.prop('disabled', true).text('Saving...');
    $revertBtn.prop('disabled', true);
    $successCheck.removeClass('visible');

    setConfigItem(
        category,
        itemName,
        newValue,
        function() {
            itemData.current = newValue;
            $successCheck.addClass('visible');
            $modifyBtn.removeClass('visible').prop('disabled', false).text('Modify');
            $revertBtn.removeClass('visible').prop('disabled', false);
        },
        function(error) {
            showError('Error modifying ' + itemName + ': ' + error);
            $modifyBtn.prop('disabled', false).text('Modify');
            $revertBtn.prop('disabled', false);
        }
    );
}

// ============================================================================
// SEARCH FUNCTIONALITY
// ============================================================================

function applySearchFilter() {
    $('#no-results-message').remove();

    if (searchTerms.length === 0) {
        $('.foldable').removeClass('hidden');
        $('.item').removeClass('hidden');
        return;
    }

    $('.foldable').each(function() {
        const $foldable = $(this);
        const category = $foldable.data('category');
        const $header = $foldable.find('.foldable-header');

        if (!configData[category].loaded) {
            return;
        }

        const categoryLower = category.toLowerCase();
        const sectionMatches = searchTerms.every(term => categoryLower.includes(term));

        let hasVisibleItems = false;

        $foldable.find('.item').each(function() {
            const $wrapper = $(this);
            const $itemWrapper = $wrapper.find('.config-item');
            const itemName = $itemWrapper.data('item');

            if (!itemName) return;

            const itemNameLower = itemName.toLowerCase();
            const itemMatches = searchTerms.every(term => itemNameLower.includes(term));

            if (itemMatches) {
                $wrapper.removeClass('hidden');
                hasVisibleItems = true;
            } else {
                $wrapper.addClass('hidden');
            }
        });

        if (hasVisibleItems) {
            $foldable.removeClass('hidden');
            if (!$header.hasClass('open')) {
                $header.click();
            }
        } else if (sectionMatches) {
            $foldable.removeClass('hidden');
            $foldable.find('.item').removeClass('hidden');
            if ($header.hasClass('open')) {
                $header.click();
            }
        } else {
            $foldable.addClass('hidden');
        }
    });

    const visibleSections = $('.foldable:not(.hidden)').length;
    if (visibleSections === 0) {
        const $noResults = $('<div id="no-results-message" class="info-message">No results found for "' + searchTerms.join(' ') + '"</div>');
        $('#categories-container').append($noResults);
    }
}

$('#searchInput').on('input', function() {
    const searchText = $(this).val().trim().toLowerCase();

    if (searchText.length < 2) {
        searchTerms = [];
        applySearchFilter();
        return;
    }

    searchTerms = searchText.split(/\s+/).filter(t => t.length >= 2);
    applySearchFilter();
});

$('#clearSearch').click(function() {
    $('#searchInput').val('');
    searchTerms = [];
    applySearchFilter();
});

$('#expandAll').click(function() {
    $('.foldable').each(function() {
        const $foldable = $(this);
        const $header = $foldable.find('.foldable-header');
        if (!$header.hasClass('open')) {
            $header.click();
        }
    });
});

$('#collapseAll').click(function() {
    $('.foldable').each(function() {
        const $foldable = $(this);
        const $header = $foldable.find('.foldable-header');
        if ($header.hasClass('open')) {
            $header.click();
        }
    });
});

// ============================================================================
// CONFIGURATION MANAGEMENT
// ============================================================================

function showConfigMgmtResult(msg, isError = false) {
    const $box = $('#configMgmtResult');
    $box.show().text(msg).css('color', isError ? 'var(--danger)' : '#7fdbff');
}

function reloadAllConfig() {
    configData = {};
    $('#categories-container').html('<div class="loading-indicator">Loading configuration...</div>');
    loadAllConfig();
    showConfigMgmtResult('Configuration reloaded successfully.');
}

$('#saveToFlash').click(function() {
    if (!confirm('Save current configuration to flash memory?\n\nThis will write the current settings to non-volatile memory.')) {
        return;
    }

    const $btn = $(this);
    $btn.prop('disabled', true);
    showConfigMgmtResult('Saving to flash...');

    saveConfigToFlash(
        function() {
            showConfigMgmtResult('✓ Configuration saved to flash successfully.');
            $btn.prop('disabled', false);
        },
        function(error) {
            showConfigMgmtResult(`Error: ${error}`, true);
            $btn.prop('disabled', false);
        }
    );
});

$('#loadFromFlash').click(function() {
    if (!confirm('Load configuration from flash memory?\n\nThis will restore settings from non-volatile memory and reload the interface.')) {
        return;
    }

    const $btn = $(this);
    $btn.prop('disabled', true);
    showConfigMgmtResult('Loading from flash...');

    loadConfigFromFlash(
        function() {
            showConfigMgmtResult('Configuration loaded from flash. Reloading interface...');
            $btn.prop('disabled', false);
            setTimeout(() => reloadAllConfig(), 500);
        },
        function(error) {
            if (error.indexOf('HTTP 502') !== -1) {
                showConfigMgmtResult('Configuration loaded from flash. Reloading interface...');
                $btn.prop('disabled', false);
                setTimeout(() => reloadAllConfig(), 1000);
            } else {
                showConfigMgmtResult(`Error: ${error}`, true);
                $btn.prop('disabled', false);
            }
        }
    );
});

$('#resetToDefault').click(function() {
    if (!confirm('Reset all settings to factory defaults?\n\nThis will reset all configuration values to their defaults and reload the interface.\n\nNote: This does NOT clear values stored in flash memory.')) {
        return;
    }

    const $btn = $(this);
    $btn.prop('disabled', true);
    showConfigMgmtResult('Resetting to defaults...');

    resetConfigToDefault(
        function() {
            showConfigMgmtResult('Configuration reset to defaults. Reloading interface...');
            $btn.prop('disabled', false);
            setTimeout(() => reloadAllConfig(), 500);
        },
        function(error) {
            if (error.indexOf('HTTP 502') !== -1) {
                showConfigMgmtResult('Configuration reset to defaults. Reloading interface...');
                $btn.prop('disabled', false);
                setTimeout(() => reloadAllConfig(), 1000);
            } else {
                showConfigMgmtResult(`Error: ${error}`, true);
                $btn.prop('disabled', false);
            }
        }
    );
});
