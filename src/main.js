/**
 * Main application entry point
 * Initializes the app and sets up routing
 */

// Import router
import { Router } from './utils/router.js';

// Import migration manager and storage utilities
import migrationManager from './migrations/index.js';
import { getStorageQuota } from './utils/storage.js';

// Import components
import { HomePage } from './components/HomePage.js';
import { ChatWidget } from './components/ChatWidget.js';
import { GenerationStatusPage } from './components/GenerationStatusPage.js';
import { MealPlanView } from './components/MealPlanView.js';
import { ShoppingListView } from './components/ShoppingListView.js';

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Application error:', event.error);
  const app = document.getElementById('app');
  if (app && !app.innerHTML) {
    app.innerHTML = `
      <div class="min-h-screen flex items-center justify-center bg-gray-50">
        <div class="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
          <h2 class="text-2xl font-bold text-red-600 mb-4">Application Error</h2>
          <p class="text-gray-700 mb-4">Failed to load the application. Please refresh the page.</p>
          <button 
            onclick="location.reload()" 
            class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    `;
  }
});

/**
 * Show migration error UI with retry option
 * @param {Object} result - Migration result object
 */
function showMigrationError(result) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div class="max-w-md mx-auto p-6 bg-red-50 rounded-lg shadow-lg border border-red-200">
        <h2 class="text-2xl font-bold text-red-700 mb-4">Data Migration Error</h2>
        <p class="text-gray-700 mb-4">
          There was an error updating the app data. Please try refreshing the page.
        </p>
        <p class="text-sm text-gray-600 mb-4">
          <strong>Error:</strong> ${result.error || 'Unknown error'}
        </p>
        ${result.message ? `<p class="text-sm text-gray-600 mb-4">${result.message}</p>` : ''}
        <button 
          id="retry-btn" 
          class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  `;
  
  document.getElementById('retry-btn').addEventListener('click', () => {
    window.location.reload();
  });
}

/**
 * Initialize the app when DOM is ready
 * Runs migration before app initialization
 */
async function initApp() {
  console.log('Initializing Vanessa app...');
  
  // STEP 1: Run all schema migrations
  console.log('Running schema migrations...');
  const migrationResult = await migrationManager.runMigrations();
  
  if (!migrationResult.success) {
    console.error('Migration failed:', migrationResult);
    showMigrationError(migrationResult);
    return; // Stop initialization
  }
  
  console.log('✓ Migrations complete:', migrationResult.message);
  
  // STEP 2: Check storage quota and warn if critical
  const quota = getStorageQuota();
  if (quota.warning === 'critical') {
    console.warn(`⚠️  Storage near capacity: ${quota.percentUsed}% used (${quota.usedMB}MB / ${quota.limitMB}MB)`);
  } else {
    console.log(`Storage: ${quota.percentUsed}% used (${quota.usedMB}MB / ${quota.limitMB}MB)`);
  }
  
  // STEP 3: Initialize app components
  // Create router instance
  const router = new Router();
  
  // Register routes
  router.addRoute('/', new HomePage());
  router.addRoute('/generating', new GenerationStatusPage());
  router.addRoute('/meal-plan', new MealPlanView());
  router.addRoute('/shopping-list', new ShoppingListView());
  
  // Future routes will be added here (Slice 3)
  // router.addRoute('/recipes', new RecipeLibraryPage());
  // router.addRoute('/recipe/:id', new RecipeDetailPage());
  // router.addRoute('/settings', new SettingsPage());
  
  // Initialize router
  router.init();
  
  // Initialize ChatWidget (always available)
  const chatWidget = new ChatWidget();
  
  // Store globally for access from components
  window.router = router;
  window.chatWidget = chatWidget;
  
  console.log('✓ App initialized successfully');
}

// Start the app
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}


