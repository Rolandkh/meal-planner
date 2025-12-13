/**
 * Weekly Overview Component
 * Shows both Roland's and Maia's meal plans for the entire week
 */

import { DAY_ORDER, DAY_NAMES, WEEK_INFO, BUDGET_TARGET } from '../data/mealPlanData.js';
import { getMealPlanData } from '../data/mealPlanLoader.js';

export function renderWeeklyOverview() {
  const MEAL_PLAN_DATA = getMealPlanData();
  const budget = MEAL_PLAN_DATA.budget;
  const budgetStatus = budget.estimated <= budget.target ? 'under' : 'over';
  const budgetDiff = Math.abs(budget.target - budget.estimated);
  
  return `
    <div class="container">
      <button class="back-btn" onclick="navigateTo('home')" style="margin-bottom:8px">← Back to Home</button>
      <h1 class="page-title">Weekly Overview</h1>
      <p style="color:white;margin-bottom:24px">${WEEK_INFO.startDate} - ${WEEK_INFO.endDate}, ${WEEK_INFO.year}</p>
      
      <div class="card" style="background:${budgetStatus === 'under' ? '#ecfdf5' : '#fef2f2'};border:2px solid ${budgetStatus === 'under' ? '#48bb78' : '#e53e3e'};margin-bottom:24px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-size:0.85rem;color:#718096;margin-bottom:4px">Budget Summary</div>
            <div style="font-size:1.8rem;font-weight:700;color:${budgetStatus === 'under' ? '#059669' : '#dc2626'}">
              $${budget.estimated.toFixed(2)} / $${budget.target}
            </div>
            <div style="font-size:0.85rem;color:#718096;margin-top:4px">
              ${budgetStatus === 'under' ? `✓ Under budget by $${budgetDiff.toFixed(2)}` : `⚠️ Over budget by $${budgetDiff.toFixed(2)}`}
            </div>
          </div>
        </div>
      </div>
      
      ${DAY_ORDER.map((dayKey, index) => {
        const day = MEAL_PLAN_DATA.days[dayKey];
        const roland = day.roland;
        const maia = day.maia;
        const special = day.isFast || day.isPost;
        
        return `
          <div class="card" style="margin-bottom:16px;${special ? 'border:2px solid #a855f7;' : ''}">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
              <h2 style="margin:0">${DAY_NAMES[index]} ${day.date}</h2>
              ${special ? `<span style="font-size:0.75rem;color:#a855f7;font-weight:600">${day.isFast ? '⚡ Fast' : '🌅 Post-Fast'}</span>` : ''}
            </div>
            
            <div style="margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #e5e7eb">
              <div style="font-weight:600;color:#1e40af;margin-bottom:6px">ROLAND</div>
              <div style="font-size:0.9rem;color:#374151">
                <div>🌅 ${roland.meals.b?.name || '—'}</div>
                <div>🥗 ${roland.meals.l?.name || '—'}</div>
                <div>🍽️ ${roland.meals.d?.name || '—'}</div>
              </div>
            </div>
            
            ${maia && (maia.meals.b || maia.meals.l || maia.meals.d) ? `
              <div>
                <div style="font-weight:600;color:#db2777;margin-bottom:6px">MAIA</div>
                <div style="font-size:0.9rem;color:#374151">
                  ${maia.meals.b ? `<div>🌅 ${maia.meals.b.name}</div>` : ''}
                  ${maia.meals.l ? `<div>🍱 ${maia.meals.l.name}</div>` : ''}
                  ${maia.meals.d ? `<div>🍽️ ${maia.meals.d.name}</div>` : maia.meals.d === null && (maia.meals.b || maia.meals.l) ? '<div style="font-style:italic;color:#718096">At mum\'s for dinner</div>' : ''}
                </div>
              </div>
            ` : ''}
            
            <div style="margin-top:12px;text-align:right">
              <button class="back-btn" onclick="navigateTo('${dayKey}')" style="padding:4px 12px;background:#eff6ff;border-radius:6px;color:#1e40af">
                View Details →
              </button>
            </div>
          </div>
        `;
      }).join('')}
      
      <div style="margin-top:32px;text-align:center">
        <button class="btn" style="background:#fef2f2;border:2px solid #fca5a5;color:#dc2626" onclick="navigateTo('feedback')">
          <span>📝 End of Week Feedback</span>
          <span>→</span>
        </button>
      </div>
    </div>
  `;
}
