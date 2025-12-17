/**
 * Generate Week Component
 * UI for generating a new meal plan with preferences using Claude API
 */

import { handleGenerate } from '../utils/generateHandler.js';

export function renderGenerateWeek() {
  return `
    <div class="container">
      <button class="back-btn" onclick="navigateTo('home')" style="margin-bottom:8px">← Back to Home</button>
      <h1 class="page-title">✨ Generate Week</h1>
      
      <div class="card" style="background:#f0f9ff;border:2px solid #0ea5e9;margin-bottom:24px">
        <div style="font-weight:600;color:#0369a1;margin-bottom:8px">💡 How it works</div>
        <div style="font-size:0.9rem;color:#0c4a6e">
          Enter your preferences for the week, and Claude AI will generate personalized meal plans for both Roland and Maia, 
          create an optimized shopping list, and calculate the budget.
        </div>
      </div>
      
      <div class="card" style="background:#f0fdf4;border:2px solid #86efac;margin-bottom:24px">
        <div style="font-weight:600;color:#166534;margin-bottom:8px">🔒 Secure API Key Storage</div>
        <div style="font-size:0.9rem;color:#166534">
          Your Claude API key is stored securely on the server using Vercel environment variables. 
          It's never exposed to the browser or client-side code.
        </div>
        <div style="font-size:0.85rem;color:#166534;margin-top:8px;font-weight:600">
          To set up: Add ANTHROPIC_API_KEY in your Vercel project settings → Environment Variables
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
          id="generate-btn"
          class="btn" 
          style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);color:white;margin-top:8px"
          onclick="handleGenerate()"
        >
          <span>✨ Generate Meal Plan</span>
          <span>→</span>
        </button>
        
        <div id="loading-indicator" style="display:none;text-align:center;padding:16px;color:#718096">
          <div style="font-size:1.2rem;margin-bottom:8px">⏳</div>
          <div>Generating your meal plan with Claude AI...</div>
          <div style="font-size:0.85rem;margin-top:4px">This may take 30-60 seconds</div>
        </div>
        
        <div id="error-message" style="display:none;background:#fee;border:2px solid #fcc;color:#c33;padding:12px;border-radius:8px;margin-top:12px"></div>
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
    </div>
    
  `;
}
