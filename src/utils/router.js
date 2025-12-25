/**
 * Simple hash-based router for SPA navigation
 */

export class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = '/';
    this.notFoundHandler = null;
    
    // Bind event listener for hash changes
    window.addEventListener('hashchange', this.handleRouteChange.bind(this));
    
    console.log('Router initialized');
  }

  /**
   * Register a route with its component
   * @param {string} path - Route path (e.g., '/', '/chat')
   * @param {Object} component - Component with a render() method
   */
  addRoute(path, component) {
    this.routes[path] = component;
    console.log(`Route registered: ${path}`);
  }

  /**
   * Set a handler for 404 not found routes
   * @param {Object} handler - Component with a render() method
   */
  setNotFoundHandler(handler) {
    this.notFoundHandler = handler;
  }

  /**
   * Handle hash change events
   */
  handleRouteChange() {
    // Get hash without the # symbol, default to '/'
    const hash = window.location.hash.slice(1) || '/';
    this.navigateTo(hash);
  }

  /**
   * Navigate to a specific route
   * @param {string} path - Path to navigate to
   * @param {Object} state - Optional state to pass to the component
   */
  navigateTo(path, state = {}) {
    // Update current route
    this.currentRoute = path;
    
    // Try to match route (supports parameterized routes)
    const match = this.matchRoute(path);
    
    if (!match.component) {
      console.warn(`No route found for: ${path}`);
      if (this.notFoundHandler) {
        this.renderComponent(this.notFoundHandler, state);
      } else {
        // Fallback to home route if no 404 handler
        const homeComponent = this.routes['/'];
        if (homeComponent) {
          window.location.hash = '#/';
        }
      }
      return;
    }

    // Render the component with params
    this.renderComponent(match.component, { ...state, ...match.params });
  }

  /**
   * Match a path to a route (supports parameterized routes like /recipe/:id)
   * @param {string} path - Path to match
   * @returns {Object} { component, params }
   */
  matchRoute(path) {
    // First try exact match
    if (this.routes[path]) {
      return { component: this.routes[path], params: {} };
    }
    
    // Try parameterized routes
    for (const [route, component] of Object.entries(this.routes)) {
      if (route.includes(':')) {
        const routeParts = route.split('/');
        const pathParts = path.split('/');
        
        if (routeParts.length === pathParts.length) {
          const params = {};
          let match = true;
          
          for (let i = 0; i < routeParts.length; i++) {
            if (routeParts[i].startsWith(':')) {
              // This is a parameter
              const paramName = routeParts[i].substring(1);
              params[paramName] = pathParts[i];
            } else if (routeParts[i] !== pathParts[i]) {
              // Not a match
              match = false;
              break;
            }
          }
          
          if (match) {
            return { component, params };
          }
        }
      }
    }
    
    // No match found
    return { component: null, params: {} };
  }

  /**
   * Render a component to the app container
   * @param {Object} component - Component with render() method or Component class
   * @param {Object} state - State to pass to component
   */
  renderComponent(component, state = {}) {
    const app = document.getElementById('app');
    
    if (!app) {
      console.error('App container not found');
      return;
    }

    // Clear the app container
    app.innerHTML = '';
    
    // Check if component is a class that needs to be instantiated
    let componentInstance = component;
    if (typeof component === 'function') {
      // It's a class, instantiate it with params
      componentInstance = new component(state);
    }
    
    // Call lifecycle hook if it exists
    if (componentInstance.beforeRender) {
      componentInstance.beforeRender(state);
    }

    // Render the component
    try {
      const rendered = componentInstance.render(state);
      
      if (rendered instanceof HTMLElement) {
        app.appendChild(rendered);
      } else if (typeof rendered === 'string') {
        app.innerHTML = rendered;
      } else {
        console.error('Component render() must return HTMLElement or string');
      }

      // Call lifecycle hook if it exists
      if (componentInstance.afterRender) {
        componentInstance.afterRender(state);
      }

      console.log(`Rendered route: ${this.currentRoute}`);
    } catch (error) {
      console.error('Error rendering component:', error);
      app.innerHTML = `
        <div class="min-h-screen flex items-center justify-center bg-gray-50">
          <div class="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
            <h2 class="text-2xl font-bold text-red-600 mb-4">Rendering Error</h2>
            <p class="text-gray-700 mb-4">Failed to render the page. Please try again.</p>
            <button 
              onclick="window.location.hash='#/'" 
              class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      `;
    }
  }

  /**
   * Initialize the router and navigate to current hash
   */
  init() {
    console.log('Initializing router...');
    this.handleRouteChange();
  }

  /**
   * Get current route path
   * @returns {string} Current route path
   */
  getCurrentRoute() {
    return this.currentRoute;
  }
}



