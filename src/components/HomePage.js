/**
 * HomePage Component
 * Landing page with introduction and chat button
 * Shows meal plan summary if one exists
 */

import { loadCurrentMealPlan, loadMeals, loadRecipes } from '../utils/storage.js';
import { importDevPreset } from '../utils/devPresets.js';

export class HomePage {
  constructor() {
    this.mealPlan = null;
    this.meals = [];
    this.recipes = [];
  }

  /**
   * Load meal plan data from storage
   */
  loadMealPlanData() {
    this.mealPlan = loadCurrentMealPlan();
    this.meals = loadMeals();
    this.recipes = loadRecipes();
    
    console.log('Loaded meal plan data:', {
      hasPlan: !!this.mealPlan,
      mealsCount: this.meals.length,
      recipesCount: this.recipes.length
    });
  }

  /**
   * Render the HomePage
   * @returns {HTMLElement} The rendered home page
   */
  render() {
    // Load meal plan data
    this.loadMealPlanData();

    // Create main container
    const container = document.createElement('div');
    container.className = 'flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100';

    // Create content wrapper
    const content = document.createElement('div');
    content.className = 'max-w-2xl mx-auto';

    // Render appropriate view based on whether meal plan exists
    if (this.mealPlan) {
      content.appendChild(this.renderMealPlanView());
    } else {
      content.appendChild(this.renderHeroView());
    }

    // Add debug section (always visible for dev preset import)
    const debugSection = this.createDebugSection();
    content.appendChild(debugSection);

    // Add to main container
    container.appendChild(content);

    return container;
  }

  /**
   * Create debug export section
   */
  createDebugSection() {
    const section = document.createElement('div');
    section.className = 'mt-8 flex justify-center gap-4 flex-wrap';

    // Import dev preset button (always enabled)
    const importButton = document.createElement('button');
    importButton.className = `
      bg-purple-300 hover:bg-purple-400 text-purple-900 font-medium
      py-2 px-6 rounded-lg transition-colors text-sm
    `.trim().replace(/\s+/g, ' ');
    importButton.innerHTML = '🔧 Import Dev Preset';
    importButton.addEventListener('click', (e) => this.importDevPreset(e.target));
    section.appendChild(importButton);

    // Export button (only if meal plan exists)
    if (this.mealPlan) {
      const exportButton = document.createElement('button');
      exportButton.className = `
        bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium
        py-2 px-6 rounded-lg transition-colors text-sm
      `.trim().replace(/\s+/g, ' ');
      exportButton.innerHTML = '📥 Export Raw AI Output';
      exportButton.addEventListener('click', (e) => this.exportRawOutput(e.target));
      section.appendChild(exportButton);
    }

    return section;
  }

  /**
   * Import development preset (base spec + sample meal plan)
   */
  importDevPreset(buttonElement) {
    try {
      // Show loading state
      if (buttonElement) {
        const originalText = buttonElement.innerHTML;
        buttonElement.innerHTML = '⏳ Loading...';
        buttonElement.disabled = true;
        
        // Small delay to show loading state
        setTimeout(() => {
          const result = importDevPreset();
          
          if (result.success) {
            console.log('✅ Dev preset imported:', result.message);
            buttonElement.innerHTML = '✅ Loaded!';
            
            // Reload the page to show imported data
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          } else {
            console.error('❌ Import failed:', result.error);
            alert('Failed to import dev preset: ' + result.error);
            buttonElement.innerHTML = originalText;
            buttonElement.disabled = false;
          }
        }, 100);
      }
    } catch (error) {
      console.error('Error importing dev preset:', error);
      alert('Error importing dev preset. Check console for details.');
      if (buttonElement) {
        buttonElement.innerHTML = '🔧 Import Dev Preset';
        buttonElement.disabled = false;
      }
    }
  }

  /**
   * Export raw AI output as JSON file
   */
  exportRawOutput(buttonElement) {
    try {
      const debugData = localStorage.getItem('debug_raw_ai_output');
      
      if (!debugData) {
        alert('No debug data found. Generate a meal plan first.');
        return;
      }

      const parsed = JSON.parse(debugData);
      const timestamp = parsed.timestamp || new Date().toISOString();
      
      // Create filename with timestamp
      const dateStr = timestamp.split('T')[0]; // YYYY-MM-DD
      const timeStr = timestamp.split('T')[1].split('.')[0].replace(/:/g, '-'); // HH-MM-SS
      const filename = `meal-plan-raw-${dateStr}_${timeStr}.json`;

      // Create and download blob
      const blob = new Blob([JSON.stringify(parsed, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      console.log('✅ Raw AI output downloaded:', filename);
      
      // Show success message briefly if button provided
      if (buttonElement) {
        const originalText = buttonElement.innerHTML;
        buttonElement.innerHTML = '✅ Downloaded!';
        buttonElement.disabled = true;
        setTimeout(() => {
          buttonElement.innerHTML = originalText;
          buttonElement.disabled = false;
        }, 2000);
      }

    } catch (error) {
      console.error('Error exporting raw output:', error);
      alert('Error exporting data. Check console for details.');
    }
  }

  /**
   * Render hero view (no meal plan)
   * @returns {HTMLElement} Hero view element
   */
  renderHeroView() {
    const heroSection = document.createElement('div');
    heroSection.className = 'text-center mb-12 fade-in';

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
      bg-gradient-to-r from-blue-400 to-indigo-400
      hover:from-blue-500 hover:to-indigo-500
      text-white font-bold py-4 px-8 rounded-full
      shadow-xl hover:shadow-2xl
      transition-all duration-300 transform hover:scale-105
      text-lg
    `.trim().replace(/\s+/g, ' ');
    chatButton.textContent = '💬 Chat with Vanessa';
    
    // Add click handler
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

    return heroSection;
  }

  /**
   * Render meal plan view (has meal plan)
   * @returns {HTMLElement} Meal plan view element
   */
  renderMealPlanView() {
    const planSection = document.createElement('div');
    planSection.className = 'fade-in';

    // Header
    const header = document.createElement('div');
    header.className = 'text-center mb-8';

    const title = document.createElement('h1');
    title.className = 'text-4xl md:text-5xl font-bold mb-4 text-gray-800';
    
    const weekOf = new Date(this.mealPlan.weekOf);
    const weekEnd = new Date(this.mealPlan.weekEnd);
    const formattedWeek = `${weekOf.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    
    title.textContent = `Your Meal Plan`;

    const subtitle = document.createElement('p');
    subtitle.className = 'text-xl text-gray-600';
    subtitle.textContent = `Week of ${formattedWeek}`;

    header.appendChild(title);
    header.appendChild(subtitle);

    // Stats card
    const statsCard = document.createElement('div');
    statsCard.className = 'bg-white rounded-2xl shadow-xl p-8 mb-6';

    const statsGrid = document.createElement('div');
    statsGrid.className = 'grid grid-cols-1 md:grid-cols-3 gap-6';

    const stats = [
      { label: 'Total Meals', value: this.meals.length, icon: '🍽️' },
      { label: 'Unique Recipes', value: this.recipes.length, icon: '📖' },
      { label: 'Est. Budget', value: `$${this.mealPlan.budget.estimated}`, icon: '💰' }
    ];

    stats.forEach(stat => {
      const statDiv = document.createElement('div');
      statDiv.className = 'text-center';
      statDiv.innerHTML = `
        <div class="text-4xl mb-2">${stat.icon}</div>
        <div class="text-3xl font-bold text-gray-800 mb-1">${stat.value}</div>
        <div class="text-sm text-gray-600">${stat.label}</div>
      `;
      statsGrid.appendChild(statDiv);
    });

    statsCard.appendChild(statsGrid);

    // Action buttons
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'grid grid-cols-1 md:grid-cols-2 gap-4';

    // View plan button (prominent)
    const viewPlanBtn = this.createButton('📋 View Your Meal Plan', 'view', () => {
      window.location.hash = '#/meal-plan';
    });

    // Shopping list button (prominent)
    const shoppingBtn = this.createButton('🛒 View Shopping List', 'view', () => {
      window.location.hash = '#/shopping-list';
    });

    // Chat button
    const chatBtn = this.createButton('💬 Chat with Vanessa', 'secondary', () => {
      document.dispatchEvent(new CustomEvent('toggle-chat', { detail: { open: true } }));
    });

    // Generate new button
    const generateBtn = this.createButton('✨ Generate New Week', 'primary', () => {
      window.location.hash = '#/generating';
    });

    // Add view buttons side by side
    buttonsContainer.appendChild(viewPlanBtn);
    buttonsContainer.appendChild(shoppingBtn);
    buttonsContainer.appendChild(chatBtn);
    buttonsContainer.appendChild(generateBtn);

    // Day navigation section
    const dayNavSection = this.renderDayNavigation();

    // Assemble
    planSection.appendChild(header);
    planSection.appendChild(statsCard);
    planSection.appendChild(buttonsContainer);
    planSection.appendChild(dayNavSection);

    return planSection;
  }

  /**
   * Render day-of-week navigation buttons
   * @returns {HTMLElement} Day navigation section
   */
  renderDayNavigation() {
    const section = document.createElement('div');
    section.className = 'mt-10';

    // Section header
    const sectionHeader = document.createElement('h2');
    sectionHeader.className = 'text-2xl font-bold text-gray-800 text-center mb-6';
    sectionHeader.textContent = 'View by Day';

    // Days container
    const daysContainer = document.createElement('div');
    daysContainer.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4';

    // Get unique dates from meals to determine which days exist
    const dates = [...new Set(this.meals.map(m => m.date))].sort();
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    // Create a map of day names to dates
    const dayDateMap = {};
    dates.forEach(date => {
      const dateObj = new Date(date + 'T00:00:00');
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
      dayDateMap[dayName] = date;
    });

    // Create buttons for each day
    daysOfWeek.forEach(day => {
      const dayButton = document.createElement('button');
      const hasDate = dayDateMap[day];
      
      if (hasDate) {
        dayButton.className = `
          bg-gradient-to-r from-blue-400 to-indigo-400
          hover:from-blue-500 hover:to-indigo-500
          text-white font-bold py-5 px-8 rounded-lg
          shadow-lg hover:shadow-xl
          transition-all transform hover:scale-105
          text-center text-xl
        `.trim().replace(/\s+/g, ' ');
        
        dayButton.textContent = day;
        dayButton.addEventListener('click', () => {
          window.location.hash = `#/day/${day.toLowerCase()}`;
        });
      } else {
        // Disabled style for days not in meal plan
        dayButton.className = `
          bg-gray-200 text-gray-400
          font-bold py-5 px-8 rounded-lg
          shadow-sm cursor-not-allowed
          text-center text-xl
        `.trim().replace(/\s+/g, ' ');
        
        dayButton.textContent = day;
        dayButton.disabled = true;
      }
      
      daysContainer.appendChild(dayButton);
    });

    section.appendChild(sectionHeader);
    section.appendChild(daysContainer);

    return section;
  }

  /**
   * Create a button element
   * @param {string} text - Button text
   * @param {string} style - 'primary', 'secondary', or 'view'
   * @param {Function} onClick - Click handler
   * @returns {HTMLElement} Button element
   */
  createButton(text, style, onClick) {
    const button = document.createElement('button');
    
    if (style === 'primary') {
      button.className = `
        bg-gradient-to-r from-emerald-400 to-teal-400
        hover:from-emerald-500 hover:to-teal-500
        text-white font-semibold py-4 px-6 rounded-lg
        shadow-lg hover:shadow-xl
        transition-all transform hover:scale-105
        text-lg
      `.trim().replace(/\s+/g, ' ');
    } else if (style === 'view') {
      button.className = `
        bg-gradient-to-r from-purple-400 to-pink-400
        hover:from-purple-500 hover:to-pink-500
        text-white font-bold py-5 px-8 rounded-lg
        shadow-lg hover:shadow-xl
        transition-all transform hover:scale-105
        text-xl
      `.trim().replace(/\s+/g, ' ');
    } else {
      button.className = `
        bg-gradient-to-r from-blue-400 to-indigo-400
        hover:from-blue-500 hover:to-indigo-500
        text-white font-semibold py-4 px-6 rounded-lg
        shadow-lg hover:shadow-xl
        transition-all transform hover:scale-105
        text-lg
      `.trim().replace(/\s+/g, ' ');
    }

    button.textContent = text;
    button.addEventListener('click', onClick);

    return button;
  }

  /**
   * Cleanup when component is unmounted
   */
  destroy() {
    // Clean up any event listeners if needed
  }
}
