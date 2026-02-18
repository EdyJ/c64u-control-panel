/**
 * tab-lifecycle.js
 * Tab Lifecycle Management Library
 * 
 * Provides reusable tab management functionality for tools that implement
 * a tabbed interface with tab lifecycle management.
 * 
 * Version: 1.0
 * Date: February 6, 2026
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
 * Set up tab click handlers and initialize the tab system.
 * @param {Object} tabMap - Mapping of tab IDs to tab object names
 * @param {string} initialTab - The ID of the initial active tab
 */
function setupTabs(tabMap, initialTab) {
    // Store the tab map
    _tabMap = tabMap;
    currentActiveTab = initialTab;
    
    // Bind click handlers to tab buttons
    $('.tab-button').click(function() {
        const targetTab = $(this).data('tab');
        switchToTab(targetTab);
    });
    
    console.log('Tab lifecycle initialized with tabs:', Object.keys(_tabMap));
}

/**
 * Switch to a different tab with lifecycle management.
 * @param {string} tabId - The ID of the tab to switch to
 */
function switchToTab(tabId) {
    if (tabId === currentActiveTab) {
        console.log(`Already on tab: ${tabId}`);
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

/**
 * Initialize all tabs by calling their initialize() method.
 * @param {Array<string>} tabNames - Array of tab object names to initialize
 */
function initializeTabs(tabNames) {
    tabNames.forEach(tabName => {
        const tab = window[tabName];
        if (tab && tab.initialize) {
            tab.initialize();
        }
    });
    console.log('All tabs initialized');
}
