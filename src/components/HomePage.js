/**
 * Home Page Component
 * Displays the week overview with daily meal cards
 */

import { MEAL_PLAN_DATA, DAY_ORDER, DAY_NAMES, WEEK_INFO } from '../data/mealPlanData.js';

/**
 * Render the home page
 * @returns {string} HTML string
 */
export function renderHome() {
  return `
    <div class="container">
      <div class="header">
        <h1>🍎 Meal Plan</h1>
        <p>Week of ${WEEK_INFO.startDate}-${WEEK_INFO.endDate}, ${WEEK_INFO.year}</p>
      </div>
      
      <button class="btn btn-shopping" onclick="navigateTo('shopping')">
        <span>🛒 Shopping List</span>
        <span>→</span>
      </button>
      
      <h2 class="section-title">Daily Plans</h2>
      
      ${DAY_ORDER.map((dayKey, index) => {
        const day = MEAL_PLAN_DATA.days[dayKey];
        const special = day.isFast || day.isPost;
        return `
          <button class="btn ${special ? 'special' : ''}" onclick="navigateTo('${dayKey}')">
            <div style="flex:1;text-align:left">
              <div style="font-weight:700">${DAY_NAMES[index]}</div>
              <div style="font-size:0.85rem;color:#718096;margin-top:4px">${day.meals.b} • ${day.meals.l}</div>
              ${special ? `<div style="font-size:0.75rem;color:#a855f7;font-weight:600;margin-top:4px">${day.isFast ? '⚡ Fast Day' : '🌅 Post-Fast'}</div>` : ''}
            </div>
            <span>→</span>
          </button>
        `;
      }).join('')}
    </div>
  `;
}
