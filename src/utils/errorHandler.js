/**
 * Centralized Error Handling Utility
 * Provides consistent error handling and display across the app
 */

export class ErrorHandler {
  /**
   * Display a generic error message
   * @param {string} message - Error message to display
   * @param {HTMLElement} container - Container to append error to
   * @param {number} duration - How long to show the error (ms)
   * @returns {HTMLElement} The error element
   */
  static displayError(message, container, duration = 5000) {
    const errorEl = document.createElement('div');
    errorEl.className = `
      bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-4 
      rounded shadow-sm fade-in
    `.trim().replace(/\s+/g, ' ');

    const errorContent = document.createElement('div');
    errorContent.className = 'flex items-start';

    const icon = document.createElement('div');
    icon.className = 'flex-shrink-0';
    icon.innerHTML = '<span class="text-xl">⚠️</span>';

    const textContent = document.createElement('div');
    textContent.className = 'ml-3';

    const title = document.createElement('p');
    title.className = 'text-sm font-medium';
    title.textContent = 'Error';

    const messageText = document.createElement('p');
    messageText.className = 'text-sm mt-1';
    messageText.textContent = message;

    textContent.appendChild(title);
    textContent.appendChild(messageText);

    errorContent.appendChild(icon);
    errorContent.appendChild(textContent);
    errorEl.appendChild(errorContent);

    // Append to container
    container.appendChild(errorEl);

    // Auto-scroll to show error
    if (container.scrollHeight > container.clientHeight) {
      container.scrollTop = container.scrollHeight;
    }

    // Auto-remove after duration
    setTimeout(() => {
      errorEl.classList.add('opacity-0', 'transition-opacity', 'duration-500');
      setTimeout(() => {
        if (errorEl.parentNode) {
          errorEl.remove();
        }
      }, 500);
    }, duration);

    return errorEl;
  }

  /**
   * Handle API-specific errors
   * @param {Error} error - The error object
   * @param {HTMLElement} container - Container to append error to
   * @returns {HTMLElement} The error element
   */
  static handleApiError(error, container) {
    console.error('API Error:', error);

    let message = 'Failed to communicate with Vanessa. Please try again.';

    // Network errors
    if (error.message === 'Failed to fetch' || error.message.includes('fetch')) {
      message = 'Network error. Please check your internet connection.';
    }
    // HTTP errors
    else if (error.message.includes('HTTP')) {
      const status = parseInt(error.message.match(/\d+/)?.[0]);
      if (status === 429) {
        message = 'Too many requests. Please wait a moment and try again.';
      } else if (status === 401 || status === 403) {
        message = 'Authentication error. Please refresh the page.';
      } else if (status === 500) {
        message = 'Server error. Our team has been notified. Please try again later.';
      } else if (status >= 400 && status < 500) {
        message = 'Invalid request. Please try rephrasing your message.';
      }
    }
    // Timeout errors
    else if (error.message.includes('timeout') || error.message.includes('timed out')) {
      message = 'Request timed out. Please try again.';
    }
    // Streaming errors
    else if (error.message.includes('stream')) {
      message = 'Streaming error. Please try sending your message again.';
    }

    return this.displayError(message, container);
  }

  /**
   * Handle localStorage errors
   * @param {Error} error - The error object
   * @param {HTMLElement} container - Container to append error to
   * @returns {HTMLElement} The error element
   */
  static handleStorageError(error, container) {
    console.error('Storage Error:', error);

    let message = 'Failed to save your conversation. Your data may not persist when you close the app.';

    if (error.name === 'QuotaExceededError') {
      message = 'Storage is full. Please clear some browser data to continue saving conversations.';
    } else if (error.name === 'SecurityError') {
      message = 'Storage access denied. Please check your browser privacy settings.';
    }

    return this.displayError(message, container, 7000); // Show longer for storage errors
  }

  /**
   * Handle general errors with logging
   * @param {Error} error - The error object
   * @param {string} context - Context where error occurred
   */
  static logError(error, context = 'Unknown') {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] Error in ${context}:`, error);

    // Could be extended to send to error tracking service
    // e.g., Sentry, LogRocket, etc.
  }

  /**
   * Display a success message
   * @param {string} message - Success message to display
   * @param {HTMLElement} container - Container to append message to
   * @param {number} duration - How long to show the message (ms)
   * @returns {HTMLElement} The message element
   */
  static displaySuccess(message, container, duration = 3000) {
    const successEl = document.createElement('div');
    successEl.className = `
      bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-4 
      rounded shadow-sm fade-in
    `.trim().replace(/\s+/g, ' ');

    const successContent = document.createElement('div');
    successContent.className = 'flex items-start';

    const icon = document.createElement('div');
    icon.className = 'flex-shrink-0';
    icon.innerHTML = '<span class="text-xl">✅</span>';

    const textContent = document.createElement('div');
    textContent.className = 'ml-3';

    const messageText = document.createElement('p');
    messageText.className = 'text-sm font-medium';
    messageText.textContent = message;

    textContent.appendChild(messageText);
    successContent.appendChild(icon);
    successContent.appendChild(textContent);
    successEl.appendChild(successContent);

    container.appendChild(successEl);

    // Auto-remove after duration
    setTimeout(() => {
      successEl.classList.add('opacity-0', 'transition-opacity', 'duration-500');
      setTimeout(() => {
        if (successEl.parentNode) {
          successEl.remove();
        }
      }, 500);
    }, duration);

    return successEl;
  }

  /**
   * Wrap an async function with error handling
   * @param {Function} fn - Async function to wrap
   * @param {string} context - Context for error logging
   * @returns {Function} Wrapped function
   */
  static async wrapAsync(fn, context = 'Unknown') {
    try {
      return await fn();
    } catch (error) {
      this.logError(error, context);
      throw error;
    }
  }
}

