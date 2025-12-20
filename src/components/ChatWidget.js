/**
 * ChatWidget Component
 * Collapsible chat interface for conversations with Vanessa
 */

import { ErrorHandler } from '../utils/errorHandler.js';

export class ChatWidget {
  constructor() {
    this.isOpen = false;
    this.messages = [];
    this.isTyping = false;
    this.currentStreamingMessage = null;
    this.isGenerating = false; // Track generation state

    // Listen for toggle event from HomePage or other components
    document.addEventListener('toggle-chat', (e) => {
      const shouldOpen = e.detail?.open !== undefined ? e.detail.open : !this.isOpen;
      if (shouldOpen !== this.isOpen) {
        this.toggle();
      }
    });

    // Create and attach DOM elements
    this.createElements();
    this.attachToDOM();

    // Load saved conversation
    this.loadConversation();

    // Add resize listener for responsive behavior
    window.addEventListener('resize', () => this.handleResize());
    this.handleResize(); // Initial check

    // Listen for hash changes to re-enable button when returning
    window.addEventListener('hashchange', () => this.handleRouteChange());

    console.log('ChatWidget initialized');
  }

  /**
   * Create all DOM elements for the chat widget
   */
  createElements() {
    // Create main container
    this.container = document.createElement('div');
    this.container.className = `
      fixed inset-y-0 right-0 w-full md:w-96 bg-white shadow-2xl
      transform transition-transform duration-300 ease-in-out z-50
      flex flex-col
    `.trim().replace(/\s+/g, ' ');
    this.container.style.transform = 'translateX(100%)';

    // Create header
    const header = document.createElement('div');
    header.className = 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex justify-between items-center shadow-md flex-shrink-0';

    const titleSection = document.createElement('div');
    titleSection.className = 'flex items-center';

    const avatar = document.createElement('div');
    avatar.className = 'w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3';
    avatar.textContent = '🤖';

    const titleText = document.createElement('div');
    const title = document.createElement('h2');
    title.className = 'text-xl font-bold';
    title.textContent = 'Vanessa';
    const subtitle = document.createElement('p');
    subtitle.className = 'text-xs text-blue-100';
    subtitle.textContent = 'AI Meal Planning Assistant';
    titleText.appendChild(title);
    titleText.appendChild(subtitle);

    titleSection.appendChild(avatar);
    titleSection.appendChild(titleText);

    const closeButton = document.createElement('button');
    closeButton.className = 'text-white hover:text-gray-200 text-3xl leading-none transition-colors';
    closeButton.innerHTML = '&times;';
    closeButton.setAttribute('aria-label', 'Close chat');
    closeButton.addEventListener('click', () => this.toggle());

    header.appendChild(titleSection);
    header.appendChild(closeButton);

    // Create Generate Week button
    this.generateButton = document.createElement('button');
    this.generateButton.className = `
      w-full bg-gradient-to-r from-green-500 to-emerald-600
      hover:from-green-600 hover:to-emerald-700
      text-white font-semibold text-lg py-4 px-6
      transition-all transform hover:scale-105
      shadow-md hover:shadow-lg
      flex items-center justify-center
      flex-shrink-0
      disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    `.trim().replace(/\s+/g, ' ');
    this.generateButton.innerHTML = '<span class="button-text">✨ Generate Week</span>';
    this.generateButton.setAttribute('aria-label', 'Generate your weekly meal plan');
    this.generateButton.setAttribute('role', 'button');
    this.generateButton.style.minHeight = '48px';
    
    // Add click handler for Generate button
    this.generateButton.addEventListener('click', () => this.handleGenerateWeek());

    // Create messages container
    this.messagesContainer = document.createElement('div');
    this.messagesContainer.className = 'flex-1 p-4 overflow-y-auto bg-gray-50 chat-messages';
    this.messagesContainer.id = 'chat-messages';

    // Welcome message
    const welcomeMessage = document.createElement('div');
    welcomeMessage.className = 'text-center text-gray-500 py-8';
    welcomeMessage.innerHTML = `
      <div class="text-4xl mb-4">👋</div>
      <p class="text-lg font-medium text-gray-700 mb-2">Hi! I'm Vanessa</p>
      <p class="text-sm">Ask me anything about meal planning, recipes, or nutrition!</p>
    `;
    this.messagesContainer.appendChild(welcomeMessage);

    // Create typing indicator
    this.typingIndicator = document.createElement('div');
    this.typingIndicator.className = 'p-4 text-gray-500 text-sm hidden bg-gray-50';
    this.typingIndicator.innerHTML = `
      <div class="flex items-center">
        <div class="flex space-x-1 mr-2">
          <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
          <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
          <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
        </div>
        <span>Vanessa is thinking...</span>
      </div>
    `;

    // Create input area
    const inputArea = document.createElement('div');
    inputArea.className = 'border-t bg-white p-4 flex-shrink-0';

    const inputForm = document.createElement('form');
    inputForm.className = 'flex gap-2';
    inputForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSendMessage();
    });

    this.messageInput = document.createElement('input');
    this.messageInput.type = 'text';
    this.messageInput.className = `
      flex-1 border border-gray-300 rounded-lg p-3 
      bg-gray-50 text-gray-900
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white
      transition-all
    `.trim().replace(/\s+/g, ' ');
    this.messageInput.placeholder = 'Type your message...';
    this.messageInput.setAttribute('aria-label', 'Message input');

    this.sendButton = document.createElement('button');
    this.sendButton.type = 'submit';
    this.sendButton.className = `
      bg-gradient-to-r from-blue-600 to-indigo-600 
      hover:from-blue-700 hover:to-indigo-700
      text-white px-6 rounded-lg 
      transition-all transform hover:scale-105
      font-medium
    `.trim().replace(/\s+/g, ' ');
    this.sendButton.textContent = 'Send';
    this.sendButton.setAttribute('aria-label', 'Send message');

    inputForm.appendChild(this.messageInput);
    inputForm.appendChild(this.sendButton);
    inputArea.appendChild(inputForm);

    // Assemble the widget
    this.container.appendChild(header);
    this.container.appendChild(this.generateButton);
    this.container.appendChild(this.messagesContainer);
    this.container.appendChild(this.typingIndicator);
    this.container.appendChild(inputArea);
  }

  /**
   * Attach widget to DOM
   */
  attachToDOM() {
    document.body.appendChild(this.container);
  }

  /**
   * Toggle chat widget open/closed
   */
  toggle() {
    this.isOpen = !this.isOpen;
    this.container.style.transform = this.isOpen ? 'translateX(0)' : 'translateX(100%)';

    if (this.isOpen) {
      // Focus input (delayed slightly to ensure keyboard appears correctly on mobile)
      setTimeout(() => {
        this.messageInput.focus();
      }, 300);
      
      // Handle body scroll based on screen size
      this.handleResize();
      
      console.log('Chat widget opened');
    } else {
      // Always restore body scroll when closed
      document.body.style.overflow = '';
      document.body.classList.remove('overflow-hidden');
      
      console.log('Chat widget closed');
    }
  }

  /**
   * Handle window resize for responsive behavior
   */
  handleResize() {
    if (!this.isOpen) return;

    const isMobile = window.innerWidth < 768; // md breakpoint

    if (isMobile) {
      // On mobile: prevent body scroll when chat is open
      document.body.style.overflow = 'hidden';
      document.body.classList.add('overflow-hidden');
    } else {
      // On desktop: allow body scroll
      document.body.style.overflow = '';
      document.body.classList.remove('overflow-hidden');
    }
  }

  /**
   * Handle send message - calls API and handles streaming response
   */
  async handleSendMessage() {
    const message = this.messageInput.value.trim();
    
    if (!message) {
      return;
    }

    console.log('Sending message to API:', message);

    // Disable send button during processing
    this.sendButton.disabled = true;
    this.messageInput.disabled = true;

    // Add user message to UI
    this.addMessage({ role: 'user', content: message });

    // Clear input
    this.messageInput.value = '';

    // Show typing indicator
    this.showTypingIndicator();

    try {
      // Prepare chat history (exclude welcome message)
      const chatHistory = this.messages
        .filter(msg => msg.role && msg.content)
        .map(msg => ({ role: msg.role, content: msg.content }));

      console.log('Sending request with', chatHistory.length, 'previous messages');

      // Call API
      const response = await fetch('/api/chat-with-vanessa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          chatHistory: chatHistory.slice(0, -1), // Exclude the user message we just added
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Hide typing indicator
      this.hideTypingIndicator();

      // Create assistant message for streaming
      const assistantMessage = {
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      };
      this.messages.push(assistantMessage);

      // Create message element for streaming updates
      const messageEl = this.createStreamingMessageElement();
      this.messagesContainer.appendChild(messageEl);

      const bubble = messageEl.querySelector('.message-bubble');
      
      // Process SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        
        if (done) {
          console.log('Stream completed');
          break;
        }

        // Decode chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) {
            continue;
          }

          try {
            const data = JSON.parse(line.substring(6));

            if (data.type === 'token') {
              // Append token to message
              assistantMessage.content += data.content;
              bubble.textContent = assistantMessage.content;
              
              // Auto-scroll
              this.scrollToBottom();
            } else if (data.type === 'done') {
              console.log('Received completion signal');
            } else if (data.type === 'error') {
              throw new Error(data.error || 'Stream error occurred');
            }
          } catch (parseError) {
            console.error('Error parsing SSE data:', parseError, 'Line:', line);
          }
        }
      }

      // Add timestamp after completion
      const timestamp = messageEl.querySelector('.message-timestamp');
      if (timestamp) {
        timestamp.textContent = new Date().toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }

      // Save conversation to localStorage
      this.saveConversation();

      console.log('Message sent and response received successfully');

    } catch (error) {
      ErrorHandler.logError(error, 'ChatWidget.handleSendMessage');
      
      // Remove failed assistant message if it exists
      if (this.messages[this.messages.length - 1]?.role === 'assistant' && 
          !this.messages[this.messages.length - 1]?.content) {
        this.messages.pop();
      }

      // Show error to user using ErrorHandler
      ErrorHandler.handleApiError(error, this.messagesContainer);
      
    } finally {
      // Re-enable input
      this.sendButton.disabled = false;
      this.messageInput.disabled = false;
      this.hideTypingIndicator();
      this.messageInput.focus();
    }
  }

  /**
   * Create a message element for streaming updates
   * @returns {HTMLElement} Streaming message element
   */
  createStreamingMessageElement() {
    const messageEl = document.createElement('div');
    messageEl.className = 'mb-4 fade-in';

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble inline-block bg-white text-gray-800 p-3 rounded-lg rounded-tl-none max-w-xs md:max-w-sm shadow border border-gray-200 whitespace-pre-wrap';
    bubble.textContent = '';

    const timestamp = document.createElement('div');
    timestamp.className = 'message-timestamp text-xs text-gray-400 mt-1';
    timestamp.textContent = '';

    messageEl.appendChild(bubble);
    messageEl.appendChild(timestamp);

    return messageEl;
  }

  /**
   * Show error message in chat (delegates to ErrorHandler)
   * @param {string} message - Error message to display
   */
  showError(message) {
    ErrorHandler.displayError(message, this.messagesContainer);
  }

  /**
   * Show success message in chat
   * @param {string} message - Success message to display
   */
  showSuccess(message) {
    ErrorHandler.displaySuccess(message, this.messagesContainer);
  }

  /**
   * Save conversation to localStorage with error handling
   */
  saveConversation() {
    try {
      const data = JSON.stringify(this.messages);
      localStorage.setItem('vanessa-chat-history', data);
      console.log('Conversation saved to localStorage');
    } catch (error) {
      ErrorHandler.handleStorageError(error, this.messagesContainer);
    }
  }

  /**
   * Load conversation from localStorage with error handling
   */
  loadConversation() {
    try {
      const saved = localStorage.getItem('vanessa-chat-history');
      if (saved) {
        const parsed = JSON.parse(saved);
        
        // Validate the data structure
        if (Array.isArray(parsed)) {
          this.messages = parsed;
          
          // Remove welcome message if there are saved messages
          if (this.messages.length > 0) {
            const welcome = this.messagesContainer.querySelector('.text-center');
            if (welcome) {
              welcome.remove();
            }
            
            // Render all saved messages
            this.messages.forEach(msg => {
              if (msg.role && msg.content) {
                const messageEl = this.createMessageElement(msg);
                this.messagesContainer.appendChild(messageEl);
              }
            });
            
            console.log(`Loaded ${this.messages.length} messages from localStorage`);
          }
        } else {
          console.warn('Invalid chat history format, starting fresh');
          this.messages = [];
        }
      }
    } catch (error) {
      ErrorHandler.logError(error, 'ChatWidget.loadConversation');
      console.warn('Failed to load conversation, starting fresh');
      this.messages = [];
      // Don't show error to user for loading failures - just start fresh
    }
  }

  /**
   * Add a message to the chat
   * @param {Object} message - Message object with role and content
   */
  addMessage(message) {
    this.messages.push(message);

    // Remove welcome message if this is the first message
    if (this.messages.length === 1) {
      const welcome = this.messagesContainer.querySelector('.text-center');
      if (welcome) {
        welcome.remove();
      }
    }

    const messageEl = this.createMessageElement(message);
    this.messagesContainer.appendChild(messageEl);

    // Scroll to bottom
    this.scrollToBottom();

    console.log('Message added:', message.role);
  }

  /**
   * Create a message DOM element
   * @param {Object} message - Message object with role and content
   * @returns {HTMLElement} Message element
   */
  createMessageElement(message) {
    const messageEl = document.createElement('div');
    messageEl.className = `mb-4 fade-in ${message.role === 'user' ? 'text-right' : ''}`;

    const bubble = document.createElement('div');
    bubble.className = message.role === 'user'
      ? 'inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 rounded-lg rounded-tr-none max-w-xs md:max-w-sm shadow'
      : 'inline-block bg-white text-gray-800 p-3 rounded-lg rounded-tl-none max-w-xs md:max-w-sm shadow border border-gray-200';
    
    bubble.textContent = message.content;

    // Add timestamp
    const timestamp = document.createElement('div');
    timestamp.className = message.role === 'user'
      ? 'text-xs text-gray-400 mt-1'
      : 'text-xs text-gray-400 mt-1';
    timestamp.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    messageEl.appendChild(bubble);
    messageEl.appendChild(timestamp);

    return messageEl;
  }

  /**
   * Show typing indicator
   */
  showTypingIndicator() {
    this.isTyping = true;
    this.typingIndicator.classList.remove('hidden');
    this.scrollToBottom();
  }

  /**
   * Hide typing indicator
   */
  hideTypingIndicator() {
    this.isTyping = false;
    this.typingIndicator.classList.add('hidden');
  }

  /**
   * Scroll messages to bottom
   */
  scrollToBottom() {
    setTimeout(() => {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }, 100);
  }

  /**
   * Clear all messages
   */
  clearMessages() {
    this.messages = [];
    this.messagesContainer.innerHTML = `
      <div class="text-center text-gray-500 py-8">
        <div class="text-4xl mb-4">👋</div>
        <p class="text-lg font-medium text-gray-700 mb-2">Hi! I'm Vanessa</p>
        <p class="text-sm">Ask me anything about meal planning, recipes, or nutrition!</p>
      </div>
    `;
  }

  /**
   * Get all messages
   * @returns {Array} Messages array
   */
  getMessages() {
    return this.messages;
  }

  /**
   * Handle route changes to reset button state
   */
  handleRouteChange() {
    const currentHash = window.location.hash.slice(1) || '/';
    
    // If we're not on /generating, reset button state
    if (currentHash !== '/generating' && this.isGenerating) {
      this.resetGenerateButton();
    }
  }

  /**
   * Reset Generate button to initial state
   */
  resetGenerateButton() {
    this.isGenerating = false;
    this.generateButton.disabled = false;
    const buttonText = this.generateButton.querySelector('.button-text');
    if (buttonText) {
      buttonText.innerHTML = '✨ Generate Week';
    }
    console.log('Generate button reset');
  }

  /**
   * Handle Generate Week button click
   */
  async handleGenerateWeek() {
    if (this.isGenerating) {
      console.log('Generation already in progress');
      return;
    }

    console.log('Generate Week button clicked');

    // Disable button and show loading state
    this.isGenerating = true;
    this.generateButton.disabled = true;
    
    const buttonText = this.generateButton.querySelector('.button-text');
    buttonText.innerHTML = `
      <div class="flex items-center justify-center">
        <svg class="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Generating...
      </div>
    `;

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('generate-week', {
      detail: { source: 'chatwidget' }
    }));

    // Navigate to /generating route using hash-based router
    try {
      window.location.hash = '#/generating';
    } catch (error) {
      console.warn('Navigation error:', error);
      // Re-enable button on navigation failure
      this.resetGenerateButton();
    }
  }

  /**
   * Destroy the widget and clean up event listeners
   */
  destroy() {
    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('toggle-chat', this.toggle);
    document.body.style.overflow = '';
    document.body.classList.remove('overflow-hidden');
    this.container.remove();
  }
}

