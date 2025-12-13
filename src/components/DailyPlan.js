/**
 * Daily Plan Component
 * Displays detailed day view with meals, prep tasks, recipes, and reminders
 */

import { MEAL_PLAN_DATA } from '../data/mealPlanData.js';

/**
 * Render a daily plan page
 * @param {string} dayKey - Day identifier (sunday, monday, etc.)
 * @returns {string} HTML string
 */
export function renderDay(dayKey) {
  const day = MEAL_PLAN_DATA.days[dayKey];
  
  if (!day) {
    return `
      <div class="container">
        <button class="back-btn" onclick="navigateTo('home')">← Back</button>
        <div class="error">
          <h2>Day Not Found</h2>
          <p>The requested day could not be found.</p>
        </div>
      </div>
    `;
  }
  
  return `
    <div class="container">
      <button class="back-btn" onclick="navigateTo('home')">← Back</button>
      <h1 style="font-size:2.5rem;font-weight:700;margin-bottom:8px;color:white">${day.name}</h1>
      <p style="color:white;margin-bottom:24px">${day.date}</p>
      
      ${day.isFast ? `
        <div class="card" style="background:#faf5ff;border:2px solid #a855f7">
          <div style="font-size:1.2rem;font-weight:700;color:#7c3aed;margin-bottom:8px">⚡ Fast Day</div>
          <div style="font-size:0.9rem;color:#6b21a8">Last meal at 12PM. No dinner. Fast until Friday 1PM.</div>
        </div>
      ` : ''}
      
      ${day.isPost ? `
        <div class="card" style="background:#ecfdf5;border:2px solid #48bb78">
          <div style="font-size:1.2rem;font-weight:700;color:#059669;margin-bottom:8px">🌅 Post-Fast Day</div>
          <div style="font-size:0.9rem;color:#047857">Break fast at 1PM. Eat slowly and gently.</div>
        </div>
      ` : ''}
      
      <div class="card">
        <h2>Today's Meals</h2>
        ${[
          ['🌅', 'Breakfast', day.meals.b],
          ['🥗', 'Lunch', day.meals.l],
          ['🍽️', 'Dinner', day.meals.d]
        ].map(([icon, label, meal]) => `
          <div style="display:flex;margin-bottom:14px">
            <div style="font-size:1.6rem;margin-right:12px">${icon}</div>
            <div>
              <div style="font-weight:600">${label}</div>
              <div style="color:#718096;margin-top:2px">${meal}</div>
            </div>
          </div>
        `).join('')}
      </div>
      
      ${day.prep ? `
        <div class="prep-card">
          <h2>Prep Tasks</h2>
          <ul style="list-style:none;padding:0">
            ${day.prep.map(task => `
              <li style="display:flex;align-items:flex-start;margin-bottom:8px">
                <span style="color:#3b82f6;margin-right:8px;font-weight:bold">✓</span>
                <span style="color:#374151">${task}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      ` : ''}
      
      ${day.recipes ? day.recipes.map(recipe => `
        <div class="card">
          <h2>${recipe.name}</h2>
          <div style="margin-bottom:20px">
            <h3>Ingredients:</h3>
            <ul style="font-size:0.9rem;margin-left:20px">
              ${recipe.ing.map(ing => `<li style="margin-bottom:4px">${ing}</li>`).join('')}
            </ul>
          </div>
          <div>
            <h3>Steps:</h3>
            <ol style="font-size:0.9rem;margin-left:20px">
              ${recipe.steps.map(step => `<li style="margin-bottom:8px">${step}</li>`).join('')}
            </ol>
          </div>
        </div>
      `).join('') : ''}
      
      <div class="card" style="background:#fffbeb;border:2px solid #fbbf24">
        <div style="font-weight:700;margin-bottom:8px">⏰ Reminders</div>
        <ul style="font-size:0.9rem;margin-left:20px">
          <li>10-minute walk after lunch (mandatory)</li>
          <li>Walk after dinner if possible</li>
          <li>No snacking between meals</li>
          <li>Nothing after 6 PM (water/tea only)</li>
        </ul>
      </div>
    </div>
  `;
}
