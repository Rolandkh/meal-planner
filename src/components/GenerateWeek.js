/**
 * Generate Week Component
 * UI for generating a new meal plan with preferences
 */

export function renderGenerateWeek() {
  return `
    <div class="container">
      <button class="back-btn" onclick="navigateTo('home')">← Back</button>
      <h1 class="page-title">✨ Generate Week</h1>
      
      <div class="card" style="background:#f0f9ff;border:2px solid #0ea5e9;margin-bottom:24px">
        <div style="font-weight:600;color:#0369a1;margin-bottom:8px">💡 How it works</div>
        <div style="font-size:0.9rem;color:#0c4a6e">
          Enter your preferences for the week, and we'll generate personalized meal plans for both Roland and Maia, 
          create an optimized shopping list, and calculate the budget.
        </div>
      </div>
      
      <div class="card">
        <h2>Weekly Preferences</h2>
        <textarea 
          id="preferences-input" 
          placeholder="e.g., I have leftover salmon to use up. Maia wants pasta twice this week. Budget is tight this week."
          style="width:100%;min-height:120px;padding:12px;border:2px solid #e5e7eb;border-radius:8px;font-family:inherit;font-size:0.95rem;resize:vertical;margin-bottom:16px"
        ></textarea>
        
        <div style="margin-bottom:16px">
          <label style="display:block;font-weight:600;margin-bottom:8px">Budget Target</label>
          <input 
            type="number" 
            id="budget-input" 
            value="150" 
            min="100" 
            max="200"
            style="width:100%;padding:12px;border:2px solid #e5e7eb;border-radius:8px;font-size:1rem"
          />
        </div>
        
        <div style="margin-bottom:16px">
          <label style="display:block;font-weight:600;margin-bottom:8px">Store</label>
          <select 
            id="store-input"
            style="width:100%;padding:12px;border:2px solid #e5e7eb;border-radius:8px;font-size:1rem"
          >
            <option value="coles-caulfield">Coles Caulfield Village</option>
            <option value="woolworths-carnegie">Woolworths Carnegie North</option>
          </select>
        </div>
        
        <button 
          class="btn" 
          style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);color:white;margin-top:8px"
          onclick="handleGenerate()"
        >
          <span>✨ Generate Meal Plan</span>
          <span>→</span>
        </button>
      </div>
      
      <div class="card" style="background:#fffbeb;border:2px solid #fbbf24">
        <div style="font-weight:600;margin-bottom:8px">📝 Quick Prompts</div>
        <div style="font-size:0.9rem;color:#92400e">
          <div style="margin-bottom:8px">• "Use up: [ingredient]" - Prioritize using specific ingredients</div>
          <div style="margin-bottom:8px">• "Maia wants: [food]" - Include specific foods for Maia</div>
          <div style="margin-bottom:8px">• "More fish/vegetables/pasta" - Increase certain food types</div>
          <div>• "Budget: tight/normal/flexible" - Adjust budget constraints</div>
        </div>
      </div>
      
      <div class="card" style="background:#f0fdf4;border:2px solid #86efac">
        <div style="font-weight:600;margin-bottom:8px">ℹ️ Note</div>
        <div style="font-size:0.9rem;color:#166534">
          AI generation requires Claude API integration. For now, this will use the current meal plan data. 
          Full AI generation will be available in a future update.
        </div>
      </div>
    </div>
    
    <script>
      function handleGenerate() {
        const preferences = document.getElementById('preferences-input').value;
        const budget = document.getElementById('budget-input').value;
        const store = document.getElementById('store-input').value;
        
        // For now, just navigate back to home
        // In full implementation, this would call the AI generation service
        alert('AI generation coming soon! For now, using current meal plan.');
        navigateTo('home');
      }
      
      // Make handleGenerate available globally
      window.handleGenerate = handleGenerate;
    </script>
  `;
}
