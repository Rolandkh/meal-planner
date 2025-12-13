/**
 * Router Utility
 * Handles navigation and page rendering
 */

import { appState } from './state.js';
import { renderHome } from '../components/HomePage.js';
import { renderShopping } from '../components/ShoppingList.js';
import { renderDay } from '../components/DailyPlan.js';

/**
 * Initialize the router and render the initial page
 */
export function initRouter() {
  // Subscribe to state changes and re-render
  appState.subscribe(() => {
    render();
  });

  // Initial render
  render();
}

/**
 * Render the current page based on app state
 */
function render() {
  const page = appState.getCurrentPage();
  const appElement = document.getElementById('app');

  if (!appElement) {
    console.error('App element not found');
    return;
  }

  let html = '';

  try {
    switch (page) {
      case 'home':
        html = renderHome();
        break;
      case 'shopping':
        html = renderShopping();
        break;
      default:
        // Assume it's a day key
        html = renderDay(page);
        break;
    }
  } catch (error) {
    console.error('Error rendering page:', error);
    html = `
      <div class="container">
        <div class="error">
          <h2>Error</h2>
          <p>Something went wrong while loading this page. Please try again.</p>
          <button class="btn" onclick="navigateTo('home')" style="margin-top: 12px">
            Go to Home
          </button>
        </div>
      </div>
    `;
  }

  appElement.innerHTML = html;
}

/**
 * Navigate to a page
 * @param {string} page - Page identifier
 */
export function navigateTo(page) {
  appState.navigateTo(page);
}

// Make navigateTo available globally for onclick handlers
window.navigateTo = navigateTo;
window.toggleItem = (id) => appState.toggleItem(id);
window.toggleHideChecked = () => appState.toggleHideChecked();
