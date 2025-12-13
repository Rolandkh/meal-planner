/**
 * Daily Plan Component
 * Displays detailed day view with meals for both Roland and Maia, prep tasks, recipes, and reminders
 */

import { MEAL_PLAN_DATA } from '../data/mealPlanData.js';
import { appState } from '../utils/state.js';

/**
 * Render a meal item
 */
function renderMeal(meal, icon, label) {
  if (!meal) return '';
  
  return `
    <div style="display:flex;margin-bottom:14px">
      <div style="font-size:1.6rem;margin-right:12px">${icon}</div>
      <div style="flex:1">
        <div style="font-weight:600">${label}${meal.time ? ` ${meal.time}` : ''}</div>
        <div style="color:#718096;margin-top:2px">${meal.name}</div>
      </div>
    </div>
  `;
}

/**
 * Render prep tasks with checkboxes
 */
function renderPrepTasks(prep, dayKey, person) {
  if (!prep || (!prep.morning?.length && !prep.evening?.length)) return '';
  
  const prepId = (time, index) => `prep-${dayKey}-${person}-${time}-${index}`;
  
  return `
    <div class="prep-card">
      <h2>📋 Prep Tasks</h2>
      ${prep.morning?.length ? `
        <div style="margin-bottom:16px">
          <div style="font-weight:600;color:#1e40af;margin-bottom:8px">🌅 Morning:</div>
          ${prep.morning.map((task, i) => {
            const id = prepId('morning', i);
            const checked = appState.isChecked(id);
            return `
              <div class="checkbox-item ${checked ? 'checked' : ''}" onclick="toggleItem('${id}')" style="margin-bottom:6px">
                <div class="checkbox ${checked ? 'checked' : ''}">${checked ? '✓' : ''}</div>
                <span style="color:#374151">${task}</span>
              </div>
            `;
          }).join('')}
        </div>
      ` : ''}
      ${prep.evening?.length ? `
        <div>
          <div style="font-weight:600;color:#1e40af;margin-bottom:8px">🌙 Evening:</div>
          ${prep.evening.map((task, i) => {
            const id = prepId('evening', i);
            const checked = appState.isChecked(id);
            return `
              <div class="checkbox-item ${checked ? 'checked' : ''}" onclick="toggleItem('${id}')" style="margin-bottom:6px">
                <div class="checkbox ${checked ? 'checked' : ''}">${checked ? '✓' : ''}</div>
                <span style="color:#374151">${task}</span>
              </div>
            `;
          }).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

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
        <button class="back-btn" onclick="navigateTo('home')" style="margin-bottom:8px">← Back to Home</button>
        <div class="error">
          <h2>Day Not Found</h2>
          <p>The requested day could not be found.</p>
        </div>
      </div>
    `;
  }
  
  const roland = day.roland;
  const maia = day.maia;
  
  return `
    <div class="container">
      <button class="back-btn" onclick="navigateTo('home')" style="margin-bottom:8px">← Back to Home</button>
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
        <h2 style="color:#1e40af;border-bottom:2px solid #3b82f6;padding-bottom:8px;margin-bottom:16px">ROLAND</h2>
        ${renderMeal(roland.meals.b, '🌅', 'Breakfast')}
        ${renderMeal(roland.meals.l, '🥗', 'Lunch')}
        ${renderMeal(roland.meals.d, '🍽️', 'Dinner')}
      </div>
      
      ${maia && (maia.meals.b || maia.meals.l || maia.meals.d) ? `
        <div class="card">
          <h2 style="color:#db2777;border-bottom:2px solid #ec4899;padding-bottom:8px;margin-bottom:16px">MAIA</h2>
          ${maia.meals.b ? renderMeal(maia.meals.b, '🌅', 'Breakfast') : ''}
          ${maia.meals.l ? renderMeal(maia.meals.l, '🍱', maia.meals.l.name.includes('Packed') ? 'Packed Lunch' : 'Lunch') : ''}
          ${maia.meals.d ? renderMeal(maia.meals.d, '🍽️', 'Dinner') : maia.meals.d === null && (maia.meals.b || maia.meals.l) ? '<div style="color:#718096;font-style:italic">At mum\'s for dinner</div>' : ''}
        </div>
      ` : ''}
      
      ${renderPrepTasks(roland.prep, dayKey, 'roland')}
      ${maia && renderPrepTasks(maia.prep, dayKey, 'maia')}
      
      ${roland.recipes ? roland.recipes.map(recipe => `
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
