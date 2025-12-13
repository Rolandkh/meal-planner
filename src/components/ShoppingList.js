/**
 * Shopping List Component
 * Displays categorized shopping list with checkboxes and progress tracking
 */

import { MEAL_PLAN_DATA } from '../data/mealPlanData.js';
import { appState } from '../utils/state.js';

/**
 * Render the shopping list page
 * @returns {string} HTML string
 */
export function renderShopping() {
  const state = appState;
  const all = MEAL_PLAN_DATA.shopping.flatMap(c => 
    c.items.map((item, i) => ({
      id: `${c.cat}-${i}`,
      cat: c.cat,
      text: item
    }))
  );
  
  const vis = state.hideChecked 
    ? all.filter(i => !state.isChecked(i.id)) 
    : all;
  
  const grouped = {};
  vis.forEach(i => {
    if (!grouped[i.cat]) grouped[i.cat] = [];
    grouped[i.cat].push(i);
  });
  
  const count = state.getCheckedCount();
  const total = all.length;
  const percent = Math.round((count / total) * 100);
  
  return `
    <div class="container">
      <button class="back-btn" onclick="navigateTo('home')">← Back</button>
      <h1 class="page-title">Shopping List</h1>
      
      <div class="card">
        <div style="display:flex;justify-content:space-between;font-size:0.9rem;margin-bottom:8px">
          <div style="color:#718096">Progress: <span style="font-weight:700;color:#48bb78">${count}</span> / ${total}</div>
          <div style="font-weight:600">${percent}%</div>
        </div>
        <div class="progress">
          <div class="progress-fill" style="width:${percent}%"></div>
        </div>
      </div>
      
      <button class="btn" style="background:${state.hideChecked ? '#2d3748' : '#e5e7eb'};color:${state.hideChecked ? 'white' : '#2d3748'}" onclick="toggleHideChecked()">
        ${state.hideChecked ? '✓ Hiding Bought Items' : 'Show All Items'}
      </button>
      
      ${Object.entries(grouped).map(([cat, items]) => `
        <h3 class="category-title">${cat}</h3>
        ${items.map(item => {
          const checked = state.isChecked(item.id);
          return `
            <div class="checkbox-item ${checked ? 'checked' : ''}" onclick="toggleItem('${item.id}')">
              <div class="checkbox ${checked ? 'checked' : ''}">${checked ? '✓' : ''}</div>
              <span>${item.text}</span>
            </div>
          `;
        }).join('')}
      `).join('')}
    </div>
  `;
}
