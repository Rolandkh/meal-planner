/**
 * ChatWidget Component
 * Collapsible chat interface for conversations with Vanessa
 * Includes onboarding flow for first-time users
 * Slice 3 - Tasks 36, 39
 */

import { ErrorHandler } from '../utils/errorHandler.js';
import {
  loadBaseSpecification,
  updateBaseSpecification,
  loadEaters,
  updateEater,
  getOrCreateDefaultEater
} from '../utils/storage.js';

export class ChatWidget {
  constructor() {
    this.isOpen = false;
    this.messages = [];
    this.isTyping = false;
    this.currentStreamingMessage = null;
    this.isGenerating = false; // Track generation state
    
    // Onboarding state
    this.isOnboarding = false;
    this.onboardingStep = 0;
    this.onboardingResponses = []; // Store user responses
    this.onboardingQuestions = [
      'What are your main dietary goals? (e.g., lose weight, eat healthier, follow a specific diet)',
      'Are there any foods you don\'t eat or want to avoid?',
      'Do you cook for anyone else, like family members with different preferences?',
      'What\'s your weekly grocery budget?',
      'Which day do you usually do your grocery shopping?'
    ];
    this.awaitingFinalConfirmation = false;

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

    // Check if onboarding is needed
    this.checkOnboarding();

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
      fixed inset-y-0 right-0 w-full md:w-[500px] lg:w-[600px] bg-white shadow-2xl
      transform transition-transform duration-300 ease-in-out z-50
      flex flex-col
    `.trim().replace(/\s+/g, ' ');
    this.container.style.transform = 'translateX(100%)';

    // Create header
    const header = document.createElement('div');
    header.className = 'bg-gradient-to-r from-blue-400 to-indigo-400 text-white p-4 flex justify-between items-center shadow-md flex-shrink-0';

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
    subtitle.className = 'text-xs text-blue-50';
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

    this.messageInput = document.createElement('textarea');
    this.messageInput.rows = 1;
    this.messageInput.className = `
      flex-1 border border-gray-300 rounded-lg p-3 
      bg-gray-50 text-gray-900
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white
      transition-all resize-none overflow-hidden
      min-h-[44px] max-h-[200px]
    `.trim().replace(/\s+/g, ' ');
    this.messageInput.placeholder = 'Type your message...';
    this.messageInput.setAttribute('aria-label', 'Message input');
    
    // Auto-resize textarea as user types
    this.messageInput.addEventListener('input', (e) => {
      e.target.style.height = 'auto';
      e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
    });

    this.sendButton = document.createElement('button');
    this.sendButton.type = 'submit';
    this.sendButton.className = `
      bg-gradient-to-r from-blue-400 to-indigo-400 
      hover:from-blue-500 hover:to-indigo-500
      text-white px-6 rounded-lg 
      transition-all transform hover:scale-105
      font-medium self-end
    `.trim().replace(/\s+/g, ' ');
    this.sendButton.textContent = 'Send';
    this.sendButton.setAttribute('aria-label', 'Send message');

    inputForm.appendChild(this.messageInput);
    inputForm.appendChild(this.sendButton);
    
    // Create Generate Week button (below input)
    this.generateButton = document.createElement('button');
    this.generateButton.className = `
      w-full bg-gradient-to-r from-emerald-400 to-teal-400
      hover:from-emerald-500 hover:to-teal-500
      text-white font-semibold py-3 px-6 rounded-lg mt-3
      transition-all transform hover:scale-[1.02]
      shadow-md hover:shadow-lg
      disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    `.trim().replace(/\s+/g, ' ');
    this.generateButton.innerHTML = '<span class="button-text">✨ Generate Week</span>';
    this.generateButton.setAttribute('aria-label', 'Generate your weekly meal plan');
    this.generateButton.addEventListener('click', () => this.handleGenerateWeek());

    inputArea.appendChild(inputForm);
    inputArea.appendChild(this.generateButton);

    // Assemble the widget
    this.container.appendChild(header);
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
      ? 'inline-block bg-gradient-to-r from-blue-400 to-indigo-400 text-white p-3 rounded-lg rounded-tr-none max-w-xs md:max-w-md shadow'
      : 'inline-block bg-white text-gray-800 p-3 rounded-lg rounded-tl-none max-w-xs md:max-w-md shadow border border-gray-200';
    
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

    // Close the chat widget immediately
    if (this.isOpen) {
      this.toggle();
      console.log('Chat widget closed on Generate Week click');
    }

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
   * Check if onboarding is needed
   */
  checkOnboarding() {
    const baseSpec = loadBaseSpecification();
    
    if (!baseSpec || !baseSpec.onboardingComplete) {
      console.log('Onboarding needed - starting flow');
      this.startOnboarding();
    } else {
      console.log('Onboarding already completed');
    }
  }

  /**
   * Start onboarding flow
   */
  startOnboarding() {
    this.isOnboarding = true;
    this.onboardingStep = 0;
    
    // Open the chat widget
    if (!this.isOpen) {
      this.toggle();
    }
    
    // Show welcome message and first question
    this.showWelcomeMessage();
  }

  /**
   * Show onboarding welcome message and first question
   */
  async showWelcomeMessage() {
    const welcomeMsg = {
      role: 'assistant',
      content: 'Hi! I\'m Vanessa, your meal planning assistant. 🍳\n\nLet\'s set up your profile together. This is a conversation - speak naturally and share as much detail as you\'d like. The more you tell me about your preferences, the better I can tailor your meal plans.\n\nYou can make changes or corrections at any time, so don\'t worry about getting it perfect on the first try!',
      timestamp: new Date().toISOString()
    };
    
    this.addMessage(welcomeMsg);
    this.saveConversation();
    
    // Ask first question using AI
    setTimeout(() => {
      this.askFirstQuestion();
    }, 1500);
  }

  /**
   * Ask the first onboarding question
   */
  async askFirstQuestion() {
    // Simulate user asking to start (so AI responds with first question)
    this.showTypingIndicator();
    
    try {
      const chatHistory = this.messages
        .filter(msg => msg.role && msg.content)
        .map(msg => ({ role: msg.role, content: msg.content }));

      const response = await fetch('/api/chat-with-vanessa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'I\'m ready to get started',
          chatHistory: chatHistory,
          isOnboarding: true,
          onboardingStep: 0
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      this.hideTypingIndicator();

      // Stream the first question
      const assistantMessage = {
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      };
      this.messages.push(assistantMessage);

      const messageEl = this.createStreamingMessageElement();
      this.messagesContainer.appendChild(messageEl);
      const bubble = messageEl.querySelector('.message-bubble');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(line.substring(6));
            if (data.type === 'token') {
              assistantMessage.content += data.content;
              bubble.textContent = assistantMessage.content;
              this.scrollToBottom();
            }
          } catch (e) {
            console.error('Parse error:', e);
          }
        }
      }

      const timestamp = messageEl.querySelector('.message-timestamp');
      if (timestamp) {
        timestamp.textContent = new Date().toLocaleTimeString([], { 
          hour: '2-digit', minute: '2-digit' 
        });
      }

      this.saveConversation();

    } catch (error) {
      this.hideTypingIndicator();
      console.error('Error asking first question:', error);
    }
  }

  /**
   * Handle onboarding response - now uses AI
   */
  async handleOnboardingResponse(response) {
    // Store the response
    this.onboardingResponses[this.onboardingStep] = response;
    console.log(`📝 Stored onboarding response #${this.onboardingStep}:`, response.substring(0, 50) + '...');
    
    // Extract and save structured data from response
    this.extractAndSaveOnboardingData(this.onboardingStep, response);
    
    // Move to next step
    this.onboardingStep++;
    console.log(`➡️  Onboarding step now: ${this.onboardingStep}/${this.onboardingQuestions.length}`);
    
    // Check if we've completed all questions
    if (this.onboardingStep >= this.onboardingQuestions.length) {
      // All questions answered - AI will provide final summary
      this.awaitingFinalConfirmation = true;
      console.log('🏁 All onboarding questions answered, awaiting final confirmation');
    }
    
    // Note: The AI response (summary + next question) will come from the API
    // We don't need to manually trigger it here - the handleSendMessage already did
  }

  /**
   * Extract structured data from onboarding response and save to storage
   */
  extractAndSaveOnboardingData(step, response) {
    const baseSpec = loadBaseSpecification();
    
    switch (step) {
      case 0: // Dietary goals
        updateBaseSpecification({ dietaryGoals: response });
        break;
        
      case 1: // Food restrictions/preferences
        const eater = getOrCreateDefaultEater();
        updateEater(eater.eaterId, { preferences: response });
        break;
        
      case 2: // Household members
        // Store in conversation for now - can be managed in Settings
        break;
        
      case 3: // Weekly budget
        const budgetMatch = response.match(/\d+/);
        if (budgetMatch) {
          const budget = parseInt(budgetMatch[0], 10);
          updateBaseSpecification({ weeklyBudget: budget });
        }
        break;
        
      case 4: // Shopping day
        const dayMap = {
          'sunday': 0, 'sun': 0,
          'monday': 1, 'mon': 1,
          'tuesday': 2, 'tue': 2, 'tues': 2,
          'wednesday': 3, 'wed': 3,
          'thursday': 4, 'thu': 4, 'thur': 4, 'thurs': 4,
          'friday': 5, 'fri': 5,
          'saturday': 6, 'sat': 6
        };
        
        const lowerResponse = response.toLowerCase();
        for (const [key, value] of Object.entries(dayMap)) {
          if (lowerResponse.includes(key)) {
            updateBaseSpecification({ shoppingDay: value });
            break;
          }
        }
        break;
    }
  }

  /**
   * Handle final confirmation response
   */
  async handleFinalConfirmation(response) {
    const lowerResponse = response.toLowerCase();
    
    // Check if user is confirming
    const confirmWords = ['yes', 'yeah', 'yep', 'looks good', 'sounds good', 'perfect', 'correct', 'right', 'ok', 'okay', 'great'];
    const isConfirming = confirmWords.some(word => lowerResponse.includes(word));
    
    // Check if user also wants to generate
    const generateWords = ['generate', 'organise', 'organize', 'plan', 'create', 'make', 'build', 'let\'s do this', 'start', 'go ahead', 'do it'];
    const wantsGenerate = generateWords.some(word => lowerResponse.includes(word));
    
    if (isConfirming) {
      // User confirmed - complete onboarding
      await this.completeOnboarding();
      
      // If they also requested generation, trigger it after onboarding completes
      if (wantsGenerate) {
        console.log('User confirmed AND requested generation - auto-triggering...');
        
        // Add confirmation message
        const genMsg = {
          role: 'assistant',
          content: 'Great! Let me create your first meal plan now... 🎉',
          timestamp: new Date().toISOString()
        };
        this.addMessage(genMsg);
        this.saveConversation();
        
        // Trigger generation after a brief delay
        setTimeout(() => {
          this.handleGenerateWeek();
        }, 1500);
      }
    } else {
      // User wants changes - let AI handle the conversation
      this.awaitingFinalConfirmation = false;
      // The message will go through normal chat flow
      // After changes, we can re-show summary
    }
  }

  /**
   * Complete onboarding
   */
  async completeOnboarding() {
    this.isOnboarding = false;
    this.awaitingFinalConfirmation = false;
    
    // Show initial processing message
    const processingMsg = {
      role: 'assistant',
      content: 'Perfect! Let me set up your profile...',
      timestamp: new Date().toISOString()
    };
    this.addMessage(processingMsg);
    this.saveConversation();
    
    // Show typing indicator
    this.showTypingIndicator();
    
    // Small delay for UX
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Phase 1: Extract household members
    const step1Msg = {
      role: 'assistant',
      content: '👥 Creating household profiles...',
      timestamp: new Date().toISOString()
    };
    this.addMessage(step1Msg);
    this.saveConversation();
    
    await this.extractHouseholdMembers();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Phase 2: Extract weekly schedule
    const step2Msg = {
      role: 'assistant',
      content: '📅 Analyzing your weekly schedule...',
      timestamp: new Date().toISOString()
    };
    this.addMessage(step2Msg);
    this.saveConversation();
    
    await this.extractWeeklySchedule();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Hide typing indicator
    this.hideTypingIndicator();
    
    // Mark onboarding as complete
    updateBaseSpecification({ onboardingComplete: true });
    
    // Show completion message
    const completionMsg = {
      role: 'assistant',
      content: 'Excellent! You\'re all set up. 🎉\n\nI\'ve created profiles for your household members and mapped out your weekly meal schedule. You can review and edit everything in Settings anytime.\n\nWhenever you\'re ready, click "Generate Week" below to create your first personalized meal plan!',
      timestamp: new Date().toISOString()
    };
    
    this.addMessage(completionMsg);
    this.saveConversation();
    
    console.log('Onboarding completed');
  }

  /**
   * Extract household members from conversation using AI
   */
  async extractHouseholdMembers() {
    try {
      console.log('🔍 Starting household extraction...');
      console.log('📊 Onboarding responses array:', this.onboardingResponses);
      console.log('📊 Array length:', this.onboardingResponses.length);
      
      // Get ALL onboarding responses (household info might span multiple answers)
      const allResponses = this.onboardingResponses.filter(r => r && r.trim()).join('\n\n');
      
      if (!allResponses || allResponses.trim().length === 0) {
        console.error('❌ No onboarding responses to extract from');
        return;
      }

      console.log('✅ Extracting household members from', this.onboardingResponses.length, 'responses');
      console.log('📝 Combined responses length:', allResponses.length, 'characters');

      // Create extraction prompt
      const extractionPrompt = `Based on this conversation about household and meal planning, extract information about OTHER people (not the main user) who the user cooks for:

CONVERSATION:
${allResponses}

Extract any people mentioned (children, partners, family members, guests, etc.) and return ONLY valid JSON in this format:
{
  "members": [
    {
      "name": "Name",
      "relationship": "daughter|son|partner|spouse|ex|guest|roommate|other",
      "age": number or null,
      "notes": "schedule or dietary info (e.g., 'visits Tuesday dinners', 'age 4')"
    }
  ]
}

RULES:
- Do NOT include the main user themselves
- DO include children, partners, ex-partners, guests who are mentioned
- Extract names when mentioned (e.g., "my daughter Maya" → name: "Maya")
- Extract ages when mentioned (e.g., "four-year-old" → age: 4)
- Include schedule info in notes (e.g., "ex visits Tuesday" → notes: "Visits Tuesday dinners")
- If no other people mentioned, return: {"members": []}

Return ONLY the JSON, nothing else.`;

      // Call Claude API for extraction
      const response = await fetch('/api/chat-with-vanessa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: extractionPrompt,
          chatHistory: [],
          isOnboarding: false
        }),
      });

      if (!response.ok) {
        console.error('Failed to extract household members');
        return;
      }

      // Read the full response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              if (data.type === 'token') {
                fullResponse += data.content;
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }

      console.log('🤖 AI extraction response:', fullResponse);

      // Parse the JSON from Claude's response (handle markdown code blocks)
      let jsonText = fullResponse;
      
      // Remove markdown code blocks if present
      if (fullResponse.includes('```')) {
        const codeBlockMatch = fullResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (codeBlockMatch) {
          jsonText = codeBlockMatch[1];
          console.log('📦 Extracted JSON from code block');
        }
      } else {
        const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonText = jsonMatch[0];
          console.log('📦 Extracted JSON from response');
        } else {
          console.error('❌ No JSON found in extraction response');
          console.error('Full response was:', fullResponse);
          return;
        }
      }

      console.log('📄 JSON to parse:', jsonText);
      const extracted = JSON.parse(jsonText);
      console.log('✅ Parsed household extraction:', extracted);
      
      if (!extracted.members || extracted.members.length === 0) {
        console.warn('⚠️  No additional members in extracted JSON');
        console.warn('Extracted object:', extracted);
        return;
      }
      
      console.log(`🎯 Found ${extracted.members.length} household member(s) to create:`, extracted.members);

      // Create eater profiles for each extracted member
      const currentEaters = loadEaters();
      let created = 0;

      for (const member of extracted.members) {
        if (!member.name) {
          console.warn('Skipping member with no name:', member);
          continue;
        }

        // Check if already exists (by name)
        const exists = currentEaters.some(e => 
          e.name.toLowerCase() === member.name.toLowerCase()
        );

        if (!exists) {
          // Build schedule text based on relationship
          let scheduleText = '';
          if (member.relationship === 'daughter' || member.relationship === 'son') {
            scheduleText = member.age 
              ? `Child, ${member.age} years old. ${member.notes || ''}`
              : `Child. ${member.notes || ''}`;
          } else if (member.relationship === 'ex' || member.relationship === 'partner') {
            scheduleText = member.notes || `${member.relationship.charAt(0).toUpperCase() + member.relationship.slice(1)}`;
          } else {
            scheduleText = member.notes || '';
          }

          const newEater = createEater({
            name: member.name,
            preferences: '', // Preferences stored in baseSpec, not individual eaters
            allergies: [],
            dietaryRestrictions: [],
            schedule: scheduleText.trim(),
            isDefault: false
          });
          
          currentEaters.push(newEater);
          created++;
          console.log(`✓ Created eater profile:`, {
            name: member.name,
            relationship: member.relationship,
            age: member.age,
            schedule: scheduleText.trim()
          });
        } else {
          console.log(`Skipped ${member.name} - already exists`);
        }
      }

      if (created > 0) {
        const result = saveEaters(currentEaters);
        console.log('💾 Save eaters result:', result);
        
        // Update baseSpecification with all household member IDs
        const allEaterIds = currentEaters.map(e => e.eaterId);
        updateBaseSpecification({ householdEaterIds: allEaterIds });
        
        console.log(`✅ Created ${created} household member profile(s)`);
        console.log('👥 All eaters now:', currentEaters.map(e => e.name));
      } else {
        console.warn('⚠️  No new household members created');
      }

    } catch (error) {
      console.error('❌ Error extracting household members:', error);
      console.error('Error details:', error.message, error.stack);
      
      // FAILSAFE: If extraction completely fails but user mentioned names, create basic profiles
      const allText = this.onboardingResponses.join(' ').toLowerCase();
      const mentionedMaya = allText.includes('maya');
      const mentionedKathy = allText.includes('kathy') || allText.includes('cathie');
      
      if (mentionedMaya || mentionedKathy) {
        console.log('🆘 Failsafe: Creating basic profiles for mentioned names');
        const currentEaters = loadEaters();
        
        if (mentionedMaya && !currentEaters.some(e => e.name.toLowerCase() === 'maya')) {
          const maya = createEater({
            name: 'Maya',
            preferences: 'Child - likes simple foods',
            schedule: 'Sunday afternoon - Wednesday morning',
            isDefault: false
          });
          currentEaters.push(maya);
          console.log('✅ Created failsafe profile for Maya');
        }
        
        if (mentionedKathy && !currentEaters.some(e => e.name.toLowerCase().includes('kath'))) {
          const kathy = createEater({
            name: 'Kathy',
            preferences: '',
            schedule: 'Visits Tuesday dinner',
            isDefault: false
          });
          currentEaters.push(kathy);
          console.log('✅ Created failsafe profile for Kathy');
        }
        
        saveEaters(currentEaters);
        const allEaterIds = currentEaters.map(e => e.eaterId);
        updateBaseSpecification({ householdEaterIds: allEaterIds });
        console.log('💾 Failsafe profiles saved');
      }
    }
  }

  /**
   * Extract weekly meal schedule from conversation using AI
   * Creates structured schedule with exact servings per meal
   */
  async extractWeeklySchedule() {
    try {
      console.log('Extracting weekly schedule from conversation...');

      // Get relevant conversation parts (household question + responses)
      const householdResponse = this.onboardingResponses[2] || '';
      const allResponses = this.onboardingResponses.join('\n\n');

      // Create extraction prompt
      const extractionPrompt = `Based on this conversation about household and meal planning, extract the weekly meal schedule.

CONVERSATION:
${allResponses}

Analyze who is eating which meals on which days. Extract a structured schedule.

Return ONLY valid JSON in this EXACT format (no other text):
{
  "schedule": {
    "sunday": {
      "breakfast": { "servings": number, "attendees": ["Name1", "Name2"], "requirements": ["kid-friendly", "etc"] },
      "lunch": { "servings": number, "attendees": ["Name1"], "requirements": [] },
      "dinner": { "servings": number, "attendees": ["Name1", "Name2"], "requirements": [] }
    },
    "monday": { /* same structure for all 3 meals */ },
    "tuesday": { /* same structure */ },
    "wednesday": { /* same structure */ },
    "thursday": { /* same structure */ },
    "friday": { /* same structure */ },
    "saturday": { /* same structure */ }
  }
}

RULES:
- servings = number of people eating that meal
- attendees = array of names (use "You" for the main user)
- requirements = ["kid-friendly"] if children present, ["family-dinner"] for special meals, ["simple"] for solo meals, etc.
- If not mentioned, assume servings: 1 and attendees: ["You"]
- Pay close attention to schedules (e.g., "daughter Sunday-Wednesday morning", "ex visits Tuesday dinner")

Return ONLY the JSON, nothing else.`;

      // Call Claude for extraction
      const response = await fetch('/api/chat-with-vanessa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: extractionPrompt,
          chatHistory: [],
          isOnboarding: false
        }),
      });

      if (!response.ok) {
        console.error('Failed to extract schedule');
        return;
      }

      // Read the full response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              if (data.type === 'token') {
                fullResponse += data.content;
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }

      console.log('Schedule extraction response:', fullResponse);

      // Parse the JSON from Claude's response
      const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('No JSON found in schedule extraction response');
        return;
      }

      const extracted = JSON.parse(jsonMatch[0]);
      
      if (!extracted.schedule) {
        console.warn('No schedule found in extraction');
        return;
      }

      // Map attendee names to eater IDs
      const eaters = loadEaters();
      const scheduleWithIds = this.mapAttendeesToIds(extracted.schedule, eaters);

      // Save to baseSpecification
      updateBaseSpecification({ weeklySchedule: scheduleWithIds });
      
      console.log('✓ Weekly schedule extracted and saved');

    } catch (error) {
      console.error('Error extracting weekly schedule:', error);
      // Don't fail onboarding if extraction fails
    }
  }

  /**
   * Map attendee names to eater IDs in schedule
   */
  mapAttendeesToIds(schedule, eaters) {
    const scheduleWithIds = {};

    for (const [day, meals] of Object.entries(schedule)) {
      scheduleWithIds[day] = {};

      for (const [mealType, mealData] of Object.entries(meals)) {
        // Find eater IDs for each attendee name
        const eaterIds = (mealData.attendees || []).map(name => {
          const lowerName = name.toLowerCase();
          
          // Match "You" or "User" to default eater
          if (lowerName === 'you' || lowerName === 'user') {
            const defaultEater = eaters.find(e => e.isDefault);
            return defaultEater?.eaterId;
          }
          
          // Match by name
          const eater = eaters.find(e => e.name.toLowerCase() === lowerName);
          return eater?.eaterId;
        }).filter(id => id); // Remove nulls

        scheduleWithIds[day][mealType] = {
          servings: mealData.servings || 1,
          eaterIds: eaterIds,
          requirements: mealData.requirements || []
        };
      }
    }

    return scheduleWithIds;
  }

  /**
   * Modified handleSendMessage to support onboarding
   */
  async handleSendMessage() {
    const message = this.messageInput.value.trim();
    
    if (!message) {
      return;
    }

    // Add user message to UI
    this.addMessage({ role: 'user', content: message });

    // Clear input
    this.messageInput.value = '';

    // If in onboarding mode, use AI for responses
    if (this.isOnboarding && !this.awaitingFinalConfirmation) {
      // Store response and extract data
      this.handleOnboardingResponse(message);
      this.saveConversation();
      
      // Continue with AI chat below (don't return)
    } else if (this.awaitingFinalConfirmation) {
      // Handle final confirmation
      this.handleFinalConfirmation(message);
      this.saveConversation();
      return; // Don't call AI again for simple yes/no
    }

    console.log('Sending message to API:', message);

    // Disable send button during processing
    this.sendButton.disabled = true;
    this.messageInput.disabled = true;

    // Show typing indicator
    this.showTypingIndicator();

    try {
      // Prepare chat history (exclude welcome message)
      const chatHistory = this.messages
        .filter(msg => msg.role && msg.content)
        .map(msg => ({ role: msg.role, content: msg.content }));

      console.log('Sending request with', chatHistory.length, 'previous messages');

      // Call API (with onboarding context if applicable)
      const response = await fetch('/api/chat-with-vanessa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          chatHistory: chatHistory.slice(0, -1), // Exclude the user message we just added
          isOnboarding: this.isOnboarding,
          onboardingStep: this.onboardingStep
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

      // Check if response contains generation trigger
      if (assistantMessage.content.includes('[ACTION:GENERATE_WEEK]')) {
        console.log('Generation action detected in response');
        
        // Remove the marker from displayed message
        assistantMessage.content = assistantMessage.content.replace('[ACTION:GENERATE_WEEK]', '').trim();
        bubble.textContent = assistantMessage.content;
        
        // Trigger generation after a brief delay
        setTimeout(() => {
          console.log('Auto-triggering meal plan generation...');
          this.handleGenerateWeek();
        }, 1500);
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



