/**
 * Health Score Bars Component
 * Displays Diet Compass health scores as visual 5-segment bars
 * Used in recipe cards and meal plan views
 */

import { scoreToBarSegments, getBarFillColor } from '../utils/dietCompassScoring.js';

export class HealthScoreBars {
  /**
   * Render health score bars
   * @param {Object} scores - dietCompassScores object
   * @param {Object} options - Display options
   * @returns {HTMLElement}
   */
  static render(scores, options = {}) {
    const {
      compact = true,  // Compact mode for cards
      showLabels = false  // Show metric names
    } = options;

    const container = document.createElement('div');
    container.className = compact 
      ? 'flex flex-wrap gap-2 items-center text-xs'
      : 'grid grid-cols-2 gap-3';

    if (!scores) {
      container.innerHTML = '<span class="text-gray-400 text-xs">No health data</span>';
      return container;
    }

    const metrics = [
      { key: 'nutrientDensity', icon: '🥗', label: 'Nutrient Density', score: scores.nutrientDensity },
      { key: 'antiAging', icon: '⏳', label: 'Anti-Aging', score: scores.antiAging },
      { key: 'weightLoss', icon: '⚖️', label: 'Weight Loss', score: scores.weightLoss },
      { key: 'heartHealth', icon: '❤️', label: 'Heart Health', score: scores.heartHealth }
    ];

    metrics.forEach(metric => {
      const metricDiv = document.createElement('div');
      metricDiv.className = compact ? 'flex items-center gap-1' : 'flex flex-col';

      // Icon
      const icon = document.createElement('span');
      icon.className = 'text-sm';
      icon.textContent = metric.icon;
      icon.setAttribute('aria-label', metric.label);
      metricDiv.appendChild(icon);

      // Label (if not compact)
      if (showLabels) {
        const label = document.createElement('span');
        label.className = 'text-xs text-gray-600 font-medium mb-1';
        label.textContent = metric.label;
        metricDiv.appendChild(label);
      }

      // Bar
      const barContainer = document.createElement('div');
      barContainer.className = 'flex gap-0.5';
      
      const segments = scoreToBarSegments(metric.score);
      
      for (let i = 1; i <= 5; i++) {
        const segment = document.createElement('div');
        segment.className = compact 
          ? 'w-1.5 h-3 rounded-sm'
          : 'w-2 h-4 rounded-sm';
        
        if (i <= segments) {
          segment.className += ' ' + getBarFillColor(metric.score);
        } else {
          segment.className += ' bg-gray-200';
        }
        
        barContainer.appendChild(segment);
      }

      metricDiv.appendChild(barContainer);
      container.appendChild(metricDiv);
    });

    return container;
  }

  /**
   * Render full health score section with numbers
   * @param {Object} scores
   * @returns {HTMLElement}
   */
  static renderFull(scores) {
    const container = document.createElement('div');
    container.className = 'bg-white rounded-lg p-4 border border-gray-200';

    if (!scores) {
      container.innerHTML = `
        <p class="text-gray-400 text-sm">Health scores not available for this recipe</p>
      `;
      return container;
    }

    // Overall score
    const overall = document.createElement('div');
    overall.className = 'mb-4 pb-4 border-b border-gray-200';
    overall.innerHTML = `
      <h3 class="text-lg font-semibold text-gray-700 mb-2">Diet Compass Health Score</h3>
      <div class="flex items-baseline gap-2">
        <span class="text-4xl font-bold ${scores.overall >= 60 ? 'text-green-600' : scores.overall >= 40 ? 'text-yellow-600' : 'text-orange-600'}">${scores.overall}</span>
        <span class="text-gray-500">/100</span>
        <span class="ml-2 text-sm px-2 py-1 rounded ${
          scores.overall >= 80 ? 'bg-green-100 text-green-800' :
          scores.overall >= 60 ? 'bg-green-50 text-green-700' :
          scores.overall >= 40 ? 'bg-yellow-100 text-yellow-800' :
          'bg-orange-100 text-orange-800'
        }">
          ${scores.overall >= 80 ? 'Excellent' : scores.overall >= 60 ? 'Good' : scores.overall >= 40 ? 'Moderate' : 'Fair'}
        </span>
      </div>
    `;
    container.appendChild(overall);

    // Individual metrics
    const metrics = [
      { key: 'nutrientDensity', icon: '🥗', label: 'Nutrient Density', score: scores.nutrientDensity },
      { key: 'antiAging', icon: '⏳', label: 'Anti-Aging', score: scores.antiAging },
      { key: 'weightLoss', icon: '⚖️', label: 'Weight Loss', score: scores.weightLoss },
      { key: 'heartHealth', icon: '❤️', label: 'Heart Health', score: scores.heartHealth }
    ];

    const metricsGrid = document.createElement('div');
    metricsGrid.className = 'grid grid-cols-2 gap-3';

    metrics.forEach(metric => {
      const metricDiv = document.createElement('div');
      metricDiv.className = 'flex items-center justify-between';

      const labelDiv = document.createElement('div');
      labelDiv.className = 'flex items-center gap-2';
      labelDiv.innerHTML = `
        <span class="text-lg">${metric.icon}</span>
        <span class="text-sm text-gray-700">${metric.label}</span>
      `;

      const scoreDiv = document.createElement('div');
      scoreDiv.className = 'text-lg font-semibold';
      scoreDiv.innerHTML = `
        <span class="${metric.score >= 60 ? 'text-green-600' : metric.score >= 40 ? 'text-yellow-600' : 'text-gray-500'}">${metric.score}</span>
      `;

      metricDiv.appendChild(labelDiv);
      metricDiv.appendChild(scoreDiv);
      metricsGrid.appendChild(metricDiv);
    });

    container.appendChild(metricsGrid);

    return container;
  }
}
