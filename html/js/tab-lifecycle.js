/**
 * tab-lifecycle.js
 * Tab Lifecycle Management Library
 *
 * Provides reusable tab management functionality for tools that implement
 * a tabbed interface with tab lifecycle management.
 *
 * Version: 1.3
 * Date: February 18, 2026
 */

// ============================================================================
// GLOBAL STATE
// ============================================================================

let currentActiveTab = null;
let _tabMap = {};

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Get the currently active tab object.
 * @returns {Object} The active tab object
 */
function getActiveTab() {
    if (!currentActiveTab) return null;
    const tabName = _tabMap[currentActiveTab];
    return window[tabName];
}

/**
 * Get tab object for a specific tab.
 * @param {string} tabId - The tab ID
 * @returns {Object} The tab object for the specified tab
 */
function getTab(tabId) {
    const tabName = _tabMap[tabId];
    return window[tabName];
}

/**
 * Handle refresh button click - calls refresh() on active tab.
 */
function refreshTab() {
    const activeTab = getActiveTab();
    if (activeTab && activeTab.refresh) {
        activeTab.refresh();
    }
}

/**
 * Handle beforeunload event - checks for unsaved changes.
 * @param {Event} e - The beforeunload event
 */
function checkBeforeUnload(e) {
    const activeTab = getActiveTab();
    if (activeTab && activeTab.canDeactivate && !activeTab.canDeactivate()) {
        e.preventDefault();
        e.returnValue = '';
    }
}

/**
 * Handle keyboard events - routes to active tab's handleKeyDown if it exists.
 * @param {KeyboardEvent} e - The keyboard event
 */
function handleTabKeyDown(e) {
    const activeTab = getActiveTab();
    if (activeTab && typeof activeTab.handleKeyDown === 'function') {
        const handled = activeTab.handleKeyDown(e);
        if (handled) {
            e.preventDefault();
        }
    }
}

/**
 * Initialize the entire tab system.
 * @param {Object} tabMap - Mapping of tab IDs to tab object names
 * @param {string} initialTab - The ID of the initial active tab
 */
function initializeTabs(tabMap, initialTab) {
    // Store the tab map
    _tabMap = tabMap;
    currentActiveTab = initialTab;

    // Initialize all tabs (extract names from map values)
    const tabNames = Object.values(tabMap);
    tabNames.forEach(tabName => {
        const tab = window[tabName];
        if (tab && tab.initialize) {
            tab.initialize();
        }
    });
    console.log('All tabs initialized');

    // Bind click handlers to tab buttons
    $('.tab-button').click(function() {
        const targetTab = $(this).data('tab');
        switchToTab(targetTab);
        $(this).blur();
    });

    // Set up Refresh button (only if it exists)
    const refreshBtn = $('#refreshBtn');
    if (refreshBtn.length) {
        refreshBtn.click(refreshTab);
    }

    // Set up beforeunload handler
    window.addEventListener('beforeunload', checkBeforeUnload);

    // Set up keyboard handler - routes to active tab
    $(document).on('keydown', handleTabKeyDown);

    console.log('Tab lifecycle initialized with tabs:', Object.keys(_tabMap));

    // Activate initial tab
    const initialTabObj = getTab(initialTab);
    if (initialTabObj) {
        initialTabObj.activate();
    }
}

/**
 * Switch to a different tab with lifecycle management.
 * @param {string} tabId - The ID of the tab to switch to
 */
function switchToTab(tabId) {
    if (tabId === currentActiveTab) {
        // console.log(`Already on tab: ${tabId}`);
        return; // Already on this tab
    }

    const currentTab = getActiveTab();

    // Check if we can leave current tab
    if (currentTab && !currentTab.canDeactivate()) {
        console.log('Tab switch cancelled by tab');
        return; // Cancel switch
    }

    // Deactivate current tab
    if (currentTab) {
        currentTab.deactivate();
    }

    // Hide all tab contents
    $('.tab-content').hide();

    // Update tab styling
    $('.tab-button').removeClass('active');
    $(`.tab-button[data-tab="${tabId}"]`).addClass('active');

    // Show new tab content
    $(`#${tabId}-content`).show();

    // Activate new tab
    const newTab = getTab(tabId);
    if (newTab) {
        newTab.activate();
    }

    // Update current tab tracking
    currentActiveTab = tabId;

    console.log(`Switched to tab: ${tabId}`);
}
