/**
 * Shopping List Component
 * Displays aisle-optimized shopping list with prices, checkboxes and progress tracking
 */

import { BUDGET_TARGET } from '../data/mealPlanData.js';
import { getMealPlanData } from '../data/mealPlanLoader.js';
import { appState } from '../utils/state.js';

/**
 * Render the shopping list page
 * @returns {string} HTML string
 */
export function renderShopping() {
  const MEAL_PLAN_DATA = getMealPlanData();
  const state = appState;
  
  // Flatten all items with their metadata
  const all = MEAL_PLAN_DATA.shopping.flatMap(c => 
    c.items.map((item, i) => ({
      id: `${c.cat}-${i}`,
      cat: c.cat,
      name: typeof item === 'string' ? item : item.name,
      price: typeof item === 'string' ? null : item.price,
      aisle: typeof item === 'string' ? null : item.aisle
    }))
  );
  
  const vis = state.hideChecked 
    ? all.filter(i => !state.isChecked(i.id)) 
    : all;
  
  // Group by aisle number for optimal shopping route
  const byAisle = {};
  vis.forEach(item => {
    const aisleNum = item.aisle || 99;
    if (!byAisle[aisleNum]) {
      byAisle[aisleNum] = { aisle: aisleNum, items: [], category: item.cat };
    }
    byAisle[aisleNum].items.push(item);
  });
  
  // Sort by aisle number
  const sortedAisles = Object.keys(byAisle)
    .map(Number)
    .sort((a, b) => a - b)
    .map(a => byAisle[a]);
  
  const count = state.getCheckedCount();
  const total = all.length;
  const percent = Math.round((count / total) * 100);
  
  // Calculate budget
  const budget = MEAL_PLAN_DATA.budget;
  const budgetStatus = budget.estimated <= budget.target ? 'under' : 'over';
  const budgetDiff = Math.abs(budget.target - budget.estimated);
  
  // Calculate total of unchecked items (for remaining budget)
  const uncheckedTotal = all
    .filter(item => !state.isChecked(item.id) && item.price)
    .reduce((sum, item) => sum + item.price, 0);
  
  return `
    <div class="container">
      <button class="back-btn" onclick="navigateTo('home')" style="margin-bottom:8px">← Back to Home</button>
      <h1 class="page-title">🛒 Shopping List</h1>
      <p style="color:white;margin-bottom:16px;font-size:0.9rem">Coles Caulfield Village</p>
      
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div>
            <div style="font-size:0.85rem;color:#718096;margin-bottom:4px">Budget</div>
            <div style="font-size:1.3rem;font-weight:700;color:${budgetStatus === 'under' ? '#48bb78' : '#e53e3e'}">
              $${budget.estimated.toFixed(2)} / $${budget.target}
            </div>
            <div style="font-size:0.75rem;color:#718096;margin-top:2px">
              ${budgetStatus === 'under' ? `✓ Under by $${budgetDiff.toFixed(2)}` : `Over by $${budgetDiff.toFixed(2)}`}
            </div>
          </div>
          <div style="text-align:right">
            <div style="font-size:0.85rem;color:#718096;margin-bottom:4px">Progress</div>
            <div style="font-size:1.1rem;font-weight:700;color:#48bb78">${count} / ${total}</div>
            <div style="font-size:0.75rem;color:#718096;margin-top:2px">${percent}%</div>
          </div>
        </div>
        <div class="progress">
          <div class="progress-fill" style="width:${percent}%"></div>
        </div>
      </div>
      
      <button class="btn" style="background:${state.hideChecked ? '#2d3748' : '#e5e7eb'};color:${state.hideChecked ? 'white' : '#2d3748'}" onclick="toggleHideChecked()">
        ${state.hideChecked ? '✓ Hiding Bought Items' : 'Show All Items'}
      </button>
      
      ${sortedAisles.map(aisleGroup => `
        <div style="margin-top:24px">
          <h3 class="category-title">
            AISLE ${aisleGroup.aisle} - ${aisleGroup.category.toUpperCase()}
          </h3>
          ${aisleGroup.items.map(item => {
            const checked = state.isChecked(item.id);
            return `
              <div class="checkbox-item ${checked ? 'checked' : ''}" onclick="toggleItem('${item.id}')">
                <div class="checkbox ${checked ? 'checked' : ''}">${checked ? '✓' : ''}</div>
                <span style="flex:1">${item.name}</span>
                ${item.price ? `<span style="font-weight:600;color:#48bb78;margin-left:8px">$${item.price.toFixed(2)}</span>` : ''}
              </div>
            `;
          }).join('')}
        </div>
      `).join('')}
      
      ${uncheckedTotal > 0 ? `
        <div class="card" style="background:#eff6ff;margin-top:24px">
          <div style="font-weight:600;margin-bottom:4px">Remaining to Buy</div>
          <div style="font-size:1.2rem;font-weight:700;color:#1e40af">$${uncheckedTotal.toFixed(2)}</div>
        </div>
      ` : ''}
    </div>
  `;
}
