/**
 * Feedback Component
 * End of week feedback form for rating meals and providing notes
 */

import { WEEK_INFO } from '../data/mealPlanData.js';

export function renderFeedback() {
  return `
    <div class="container">
      <button class="back-btn" onclick="navigateTo('home')">← Back</button>
      <h1 class="page-title">📝 Week Feedback</h1>
      <p style="color:white;margin-bottom:24px">${WEEK_INFO.startDate} - ${WEEK_INFO.endDate}, ${WEEK_INFO.year}</p>
      
      <div class="card">
        <h2>Overall Rating</h2>
        <div style="display:flex;gap:8px;margin-top:12px;margin-bottom:16px">
          ${[1, 2, 3, 4, 5].map(star => `
            <button 
              onclick="setRating(${star})"
              id="star-${star}"
              style="font-size:2rem;background:none;border:none;cursor:pointer;color:#e5e7eb;transition:color 0.2s"
            >⭐</button>
          `).join('')}
        </div>
        <input type="hidden" id="rating-value" value="0" />
      </div>
      
      <div class="card">
        <h2>👍 Loved</h2>
        <textarea 
          id="loved-input" 
          placeholder="Which meals did you love? (e.g., Salmon dinner, Buddha bowl, Maia's pasta night)"
          style="width:100%;min-height:80px;padding:12px;border:2px solid #e5e7eb;border-radius:8px;font-family:inherit;font-size:0.95rem;resize:vertical"
        ></textarea>
      </div>
      
      <div class="card">
        <h2>👎 Didn't Work</h2>
        <textarea 
          id="didnt-work-input" 
          placeholder="Which meals didn't work? (e.g., Mackerel - too fishy for Maia, Lentil soup was bland)"
          style="width:100%;min-height:80px;padding:12px;border:2px solid #e5e7eb;border-radius:8px;font-family:inherit;font-size:0.95rem;resize:vertical"
        ></textarea>
      </div>
      
      <div class="card">
        <h2>Shopping List</h2>
        <div style="margin-bottom:12px">
          <label style="display:flex;align-items:center;cursor:pointer;margin-bottom:8px">
            <input type="checkbox" id="unnecessary-items" style="margin-right:8px;width:20px;height:20px" />
            <span>Bought unnecessary items</span>
          </label>
          <label style="display:flex;align-items:center;cursor:pointer;margin-bottom:8px">
            <input type="checkbox" id="missing-items" style="margin-right:8px;width:20px;height:20px" />
            <span>Missing items</span>
          </label>
          <label style="display:flex;align-items:center;cursor:pointer">
            <input type="checkbox" id="budget-good" checked style="margin-right:8px;width:20px;height:20px" />
            <span>Budget was good</span>
          </label>
        </div>
      </div>
      
      <div class="card">
        <h2>Notes for Next Week</h2>
        <textarea 
          id="notes-input" 
          placeholder="Any specific requests or preferences for next week? (e.g., Less mackerel. Maia loved the pasta night - keep that. Need more variety in lunches.)"
          style="width:100%;min-height:120px;padding:12px;border:2px solid #e5e7eb;border-radius:8px;font-family:inherit;font-size:0.95rem;resize:vertical"
        ></textarea>
      </div>
      
      <button 
        class="btn" 
        style="background:#48bb78;color:white;margin-top:16px"
        onclick="saveFeedback()"
      >
        <span>💾 Save Feedback</span>
        <span>→</span>
      </button>
    </div>
    
    <script>
      let currentRating = 0;
      
      function setRating(rating) {
        currentRating = rating;
        document.getElementById('rating-value').value = rating;
        
        // Update star display
        for (let i = 1; i <= 5; i++) {
          const star = document.getElementById('star-' + i);
          star.style.color = i <= rating ? '#fbbf24' : '#e5e7eb';
        }
      }
      
      function saveFeedback() {
        const feedback = {
          rating: currentRating,
          loved: document.getElementById('loved-input').value,
          didntWork: document.getElementById('didnt-work-input').value,
          shopping: {
            unnecessary: document.getElementById('unnecessary-items').checked,
            missing: document.getElementById('missing-items').checked,
            budgetGood: document.getElementById('budget-good').checked
          },
          notes: document.getElementById('notes-input').value,
          week: '${WEEK_INFO.startDate}-${WEEK_INFO.endDate}',
          date: new Date().toISOString()
        };
        
        // Save to localStorage
        try {
          const existing = JSON.parse(localStorage.getItem('mealPlannerFeedback') || '[]');
          existing.push(feedback);
          // Keep only last 8 weeks
          const recent = existing.slice(-8);
          localStorage.setItem('mealPlannerFeedback', JSON.stringify(recent));
          
          alert('Feedback saved! Thank you for your input.');
          navigateTo('home');
        } catch (e) {
          alert('Error saving feedback. Please try again.');
          console.error(e);
        }
      }
      
      window.setRating = setRating;
      window.saveFeedback = saveFeedback;
    </script>
  `;
}
