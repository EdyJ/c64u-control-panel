/**
 * tab-lifecycle.js
 * Tab Lifecycle Management Library
 * 
 * Provides reusable tab management functionality for tools that implement
 * a tabbed interface with viewer lifecycle management.
 * 
 * Version: 1.0
 * Date: February 6, 2026
 */

// ============================================================================
// GLOBAL STATE
// ============================================================================

let currentActiveTab = null;
let _tabViewerMap = {};

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Get the currently active viewer object.
 * @returns {Object} The active viewer object
 */
function getActiveViewer() {
    if (!currentActiveTab) return null;
    const viewerName = _tabViewerMap[currentActiveTab];
    return window[viewerName];
}

/**
 * Get viewer object for a specific tab.
 * @param {string} tabId - The tab ID
 * @returns {Object} The viewer object for the specified tab
 */
function getViewerByTab(tabId) {
    const viewerName = _tabViewerMap[tabId];
    return window[viewerName];
}

/**
 * Set up tab click handlers and initialize the tab system.
 * @param {Object} tabToViewerMap - Mapping of tab IDs to viewer names
 * @param {string} initialTab - The ID of the initial active tab
 */
function setupTabs(tabToViewerMap, initialTab) {
    // Store the viewer map
    _tabViewerMap = tabToViewerMap;
    currentActiveTab = initialTab;
    
    // Bind click handlers to tab buttons
    $('.tab-button').click(function() {
        const targetTab = $(this).data('tab');
        switchToTab(targetTab);
    });
    
    console.log('Tab lifecycle initialized with tabs:', Object.keys(_tabViewerMap));
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
    
    const currentViewer = getActiveViewer();
    
    // Check if we can leave current tab
    if (currentViewer && !currentViewer.canDeactivate()) {
        console.log('Tab switch cancelled by viewer');
        return; // Cancel switch
    }
    
    // Deactivate current viewer
    if (currentViewer) {
        currentViewer.deactivate();
    }
    
    // Hide all viewer contents
    $('.viewer-content').hide();
    
    // Update tab styling
    $('.tab-button').removeClass('active');
    $(`.tab-button[data-tab="${tabId}"]`).addClass('active');
    
    // Show new viewer content
    $(`#${tabId}-content`).show();
    
    // Activate new viewer
    const newViewer = getViewerByTab(tabId);
    if (newViewer) {
        newViewer.activate();
    }
    
    // Update current tab tracking
    currentActiveTab = tabId;
    
    console.log(`Switched to tab: ${tabId}`);
}

/**
 * Initialize all viewers by calling their initialize() method.
 * @param {Array<string>} viewerNames - Array of viewer object names to initialize
 */
function initializeViewers(viewerNames) {
    viewerNames.forEach(viewerName => {
        const viewer = window[viewerName];
        if (viewer && viewer.initialize) {
            viewer.initialize();
        }
    });
    console.log('All viewers initialized');
}
