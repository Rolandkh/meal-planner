/**
 * Home Page Component
 * Displays the week overview with daily meal cards, budget, and navigation
 */

import { DAY_ORDER, DAY_NAMES, WEEK_INFO } from '../data/mealPlanData.js';
import { getMealPlanData } from '../data/mealPlanLoader.js';

/**
 * Render the home page
 * @returns {string} HTML string
 */
export function renderHome() {
  const MEAL_PLAN_DATA = getMealPlanData();
  const budget = MEAL_PLAN_DATA.budget;
  const budgetStatus = budget.estimated <= budget.target ? 'under' : 'over';
  const budgetDiff = Math.abs(budget.target - budget.estimated);
  
  return `
    <div class="container">
      <div class="header">
        <h1>🍎 Meal Plan</h1>
        <p>Week of ${WEEK_INFO.startDate}-${WEEK_INFO.endDate}, ${WEEK_INFO.year}</p>
      </div>
      
      <div class="card" style="background:${budgetStatus === 'under' ? '#ecfdf5' : '#fef2f2'};border:2px solid ${budgetStatus === 'under' ? '#48bb78' : '#e53e3e'};margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-size:0.85rem;color:#718096;margin-bottom:4px">Budget</div>
            <div style="font-size:1.5rem;font-weight:700;color:${budgetStatus === 'under' ? '#059669' : '#dc2626'}">
              $${budget.estimated.toFixed(2)} / $${budget.target}
            </div>
            <div style="font-size:0.75rem;color:#718096;margin-top:2px">
              ${budgetStatus === 'under' ? `✓ Under by $${budgetDiff.toFixed(2)}` : `Over by $${budgetDiff.toFixed(2)}`}
            </div>
          </div>
          <div style="font-size:2.5rem">${budgetStatus === 'under' ? '✓' : '⚠️'}</div>
        </div>
      </div>
      
      <button class="btn btn-shopping" onclick="navigateTo('shopping')">
        <span>🛒 Shopping List</span>
        <span>→</span>
      </button>
      
      <button class="btn" style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);color:white" onclick="navigateTo('weekly')">
        <span>📅 Weekly Overview</span>
        <span>→</span>
      </button>
      
      <button class="btn" style="background:#fef3c7;color:#92400e;border:2px solid #fbbf24" onclick="downloadMealPlan()">
        <span>📄 Export & Print</span>
        <span>↓</span>
      </button>
      
      <h2 class="section-title">Daily Plans</h2>
      
      ${DAY_ORDER.map((dayKey, index) => {
        const day = MEAL_PLAN_DATA.days[dayKey];
        const special = day.isFast || day.isPost;
        const rolandMeals = day.roland?.meals;
        const maiaMeals = day.maia?.meals;
        const hasMaya = maiaMeals && (maiaMeals.b || maiaMeals.l || maiaMeals.d);
        
        return `
          <button class="btn ${special ? 'special' : ''}" onclick="navigateTo('${dayKey}')">
            <div style="flex:1;text-align:left">
              <div style="font-weight:700">${DAY_NAMES[index]}</div>
              <div style="font-size:0.85rem;color:#718096;margin-top:4px">
                Roland: ${rolandMeals?.b?.name || '—'} • ${rolandMeals?.l?.name || '—'}
              </div>
              ${hasMaya ? `<div style="font-size:0.75rem;color:#db2777;margin-top:2px">Maya: ${maiaMeals.b?.name || maiaMeals.l?.name || maiaMeals.d?.name || '—'}</div>` : ''}
              ${special ? `<div style="font-size:0.75rem;color:#a855f7;font-weight:600;margin-top:4px">${day.isFast ? '⚡ Fast Day' : '🌅 Post-Fast'}</div>` : ''}
            </div>
            <span>→</span>
          </button>
        `;
      }).join('')}
      
      <div style="margin-top:32px;text-align:center">
        <button class="btn" style="background:#f0f4f8;color:#718096;border:2px dashed #cbd5e0" onclick="navigateTo('generate')">
          <span>✨ Generate New Week</span>
          <span>→</span>
        </button>
      </div>
    </div>
  `;
}
