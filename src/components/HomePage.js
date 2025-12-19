/**
 * HomePage Component
 * Landing page with introduction and chat button
 */

export class HomePage {
  constructor() {
    // No router dependency needed - we'll use custom events
  }

  /**
   * Render the HomePage
   * @returns {HTMLElement} The rendered home page
   */
  render() {
    // Create main container
    const container = document.createElement('div');
    container.className = 'flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100';

    // Create content wrapper
    const content = document.createElement('div');
    content.className = 'max-w-2xl mx-auto text-center';

    // Hero section
    const heroSection = document.createElement('div');
    heroSection.className = 'mb-12 fade-in';

    // Title
    const title = document.createElement('h1');
    title.className = 'text-5xl md:text-6xl font-bold mb-6 text-gray-800 leading-tight';
    title.innerHTML = `
      <span class="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
        Vanessa
      </span>
    `;

    // Subtitle
    const subtitle = document.createElement('p');
    subtitle.className = 'text-2xl md:text-3xl mb-4 text-gray-700 font-light';
    subtitle.textContent = 'AI Meal Planning Concierge';

    // Description
    const description = document.createElement('p');
    description.className = 'text-lg md:text-xl text-gray-600 mb-8 leading-relaxed';
    description.textContent = 'Your personal assistant for meal planning, recipe ideas, and nutrition guidance';

    // Features list
    const features = document.createElement('div');
    features.className = 'grid grid-cols-1 md:grid-cols-3 gap-4 mb-10';
    
    const featuresList = [
      { icon: '🍽️', text: 'Weekly Meal Plans' },
      { icon: '📝', text: 'Shopping Lists' },
      { icon: '💡', text: 'Recipe Ideas' }
    ];

    featuresList.forEach(feature => {
      const featureCard = document.createElement('div');
      featureCard.className = 'bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow';
      featureCard.innerHTML = `
        <div class="text-4xl mb-2">${feature.icon}</div>
        <div class="text-gray-700 font-medium">${feature.text}</div>
      `;
      features.appendChild(featureCard);
    });

    // Chat button
    const chatButton = document.createElement('button');
    chatButton.className = `
      bg-gradient-to-r from-blue-600 to-indigo-600
      hover:from-blue-700 hover:to-indigo-700
      text-white font-bold py-4 px-8 rounded-full
      shadow-xl hover:shadow-2xl
      transition-all duration-300 transform hover:scale-105
      text-lg
    `.trim().replace(/\s+/g, ' ');
    chatButton.textContent = '💬 Chat with Vanessa';
    
    // Add click handler to dispatch custom event
    chatButton.addEventListener('click', () => {
      console.log('Chat button clicked - dispatching toggle-chat event');
      document.dispatchEvent(new CustomEvent('toggle-chat', { 
        detail: { open: true } 
      }));
    });

    // Assemble hero section
    heroSection.appendChild(title);
    heroSection.appendChild(subtitle);
    heroSection.appendChild(description);
    heroSection.appendChild(features);
    heroSection.appendChild(chatButton);

    // Add to content wrapper
    content.appendChild(heroSection);

    // Add to main container
    container.appendChild(content);

    return container;
  }

  /**
   * Cleanup when component is unmounted
   */
  destroy() {
    // Clean up any event listeners if needed
  }
}
