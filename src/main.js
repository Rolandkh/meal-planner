/**
 * Main application entry point
 * Initializes the app and sets up routing
 */

// Import router
import { Router } from './utils/router.js';

// Import components
import { HomePage } from './components/HomePage.js';
import { ChatWidget } from './components/ChatWidget.js';
import { GenerationStatusPage } from './components/GenerationStatusPage.js';

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

// Initialize the app when DOM is ready
function initApp() {
  console.log('Initializing Vanessa app...');
  
  // Create router instance
  const router = new Router();
  
  // Register routes
  router.addRoute('/', new HomePage());
  router.addRoute('/generating', new GenerationStatusPage());
  
  // Future routes will be added here
  // router.addRoute('/chat', new ChatPage());
  
  // Initialize router
  router.init();
  
  // Initialize ChatWidget (always available)
  const chatWidget = new ChatWidget();
  
  // Store globally for access from components
  window.router = router;
  window.chatWidget = chatWidget;
  
  console.log('App initialized successfully');
}

// Start the app
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

