/**
 * Diet Profiles Library Page
 * View, create, edit, and share diet profiles
 */

import { 
  getAllDietProfiles, 
  getDietProfileById,
  saveDietProfile,
  deleteDietProfile,
  exportDietProfile,
  importDietProfile
} from '../utils/dietProfiles.js';

import { STORAGE_KEYS } from '../types/schemas.js';

export class DietProfilesPage {
  constructor() {
    this.state = {
      profiles: [],
      selectedProfile: null,
      isCreating: false,
      isEditing: false,
      filter: 'all' // 'all', 'builtin', 'custom'
    };
  }

  beforeRender() {
    // Check for profile version and warn if outdated
    this.checkProfileVersion();
    
    this.state.profiles = getAllDietProfiles();
    console.log('📋 Diet Profiles Page loaded:', this.state.profiles.length, 'profiles');
  }
  
  /**
   * Check diet profile version and show warning if outdated
   */
  checkProfileVersion() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DIET_PROFILES);
      if (!stored) {
        console.warn('⚠️ No diet profiles in localStorage!');
        return;
      }
      
      const data = JSON.parse(stored);
      const currentVersion = data._dataVersion || '0.0.0';
      const profileCount = data.profiles?.length || 0;
      
      console.log(`📊 Diet Profiles: v${currentVersion}, ${profileCount} profiles`);
      
      // Check if outdated
      if (currentVersion !== '2.0.0' || profileCount < 15) {
        console.warn(`⚠️ Diet profiles may be outdated!`);
        console.warn(`   Current: v${currentVersion}, ${profileCount} profiles`);
        console.warn(`   Expected: v2.0.0, 17 profiles`);
        console.warn(`   Solution: Clear localStorage and reload page`);
        console.warn(`   Run: localStorage.removeItem('vanessa_diet_profiles'); location.reload();`);
      }
    } catch (error) {
      console.error('Error checking profile version:', error);
    }
  }

  render() {
    const container = document.createElement('div');
    container.className = 'diet-profiles-page min-h-screen bg-gray-50';
    container.id = 'diet-profiles-container';

    // Header
    const header = this.renderHeader();
    container.appendChild(header);

    // Main content
    const main = document.createElement('div');
    main.className = 'container mx-auto px-4 py-8 max-w-7xl';

    // Filter tabs
    const filters = this.renderFilters();
    main.appendChild(filters);

    // Profiles grid
    const grid = this.renderProfilesGrid();
    main.appendChild(grid);

    container.appendChild(main);

    return container;
  }

  renderHeader() {
    const header = document.createElement('div');
    header.className = 'bg-white shadow-sm border-b border-gray-200';

    const inner = document.createElement('div');
    inner.className = 'container mx-auto px-4 py-6 max-w-7xl';

    const row = document.createElement('div');
    row.className = 'flex items-center justify-between flex-wrap gap-4';

    // Left: Title
    const titleDiv = document.createElement('div');
    const title = document.createElement('h1');
    title.className = 'text-3xl font-bold text-gray-900';
    title.textContent = 'Diet Profiles';
    const subtitle = document.createElement('p');
    subtitle.className = 'text-gray-600 mt-1';
    subtitle.textContent = `${this.state.profiles.length} profiles available`;
    titleDiv.appendChild(title);
    titleDiv.appendChild(subtitle);

    // Right: Actions
    const actions = document.createElement('div');
    actions.className = 'flex items-center gap-3';

    // Create button
    const createBtn = document.createElement('button');
    createBtn.className = 'bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2';
    createBtn.innerHTML = '➕ Create Profile';
    createBtn.onclick = () => this.handleCreateProfile();

    // Import button
    const importBtn = document.createElement('button');
    importBtn.className = 'bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2';
    importBtn.innerHTML = '📥 Import';
    importBtn.onclick = () => this.handleImportProfile();

    // Back button
    const backBtn = document.createElement('button');
    backBtn.className = 'text-blue-600 hover:text-blue-700 font-medium';
    backBtn.textContent = '← Back';
    backBtn.onclick = () => window.location.hash = '#/settings';

    actions.appendChild(createBtn);
    actions.appendChild(importBtn);
    actions.appendChild(backBtn);

    row.appendChild(titleDiv);
    row.appendChild(actions);
    inner.appendChild(row);
    header.appendChild(inner);

    return header;
  }

  renderFilters() {
    const container = document.createElement('div');
    container.className = 'mb-6';

    const tabs = document.createElement('div');
    tabs.className = 'flex gap-2 bg-white rounded-lg p-1 shadow-sm border border-gray-200 inline-flex';

    const filters = [
      { id: 'all', label: 'All Profiles', icon: '📋' },
      { id: 'builtin', label: 'Built-in', icon: '🏛️' },
      { id: 'custom', label: 'Custom', icon: '✨' }
    ];

    filters.forEach(filter => {
      const btn = document.createElement('button');
      btn.className = `px-4 py-2 rounded-md font-medium transition-colors ${
        this.state.filter === filter.id
          ? 'bg-blue-500 text-white shadow-sm'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
      }`;
      btn.innerHTML = `${filter.icon} ${filter.label}`;
      btn.onclick = () => this.handleFilterChange(filter.id);
      tabs.appendChild(btn);
    });

    container.appendChild(tabs);
    return container;
  }

  renderProfilesGrid() {
    const container = document.createElement('div');
    container.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';

    // Filter profiles
    let profiles = this.state.profiles;
    if (this.state.filter === 'builtin') {
      profiles = profiles.filter(p => !p.isCustom);
    } else if (this.state.filter === 'custom') {
      profiles = profiles.filter(p => p.isCustom);
    }

    if (profiles.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'col-span-full text-center py-12';
      empty.innerHTML = `
        <div class="text-gray-400 text-6xl mb-4">📋</div>
        <p class="text-gray-600 text-lg">No ${this.state.filter === 'custom' ? 'custom ' : ''}profiles yet</p>
        ${this.state.filter === 'custom' ? '<p class="text-gray-500 text-sm mt-2">Create your first custom diet profile!</p>' : ''}
      `;
      container.appendChild(empty);
      return container;
    }

    profiles.forEach(profile => {
      const card = this.renderProfileCard(profile);
      container.appendChild(card);
    });

    return container;
  }

  renderProfileCard(profile) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden';

    // Header with gradient
    const header = document.createElement('div');
    header.className = `p-4 ${profile.isCustom ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`;
    
    const headerContent = document.createElement('div');
    headerContent.className = 'flex items-start justify-between';
    
    const titleSection = document.createElement('div');
    const title = document.createElement('h3');
    title.className = 'text-xl font-bold text-white';
    title.textContent = profile.name;
    
    const badge = document.createElement('span');
    badge.className = `inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${
      profile.isCustom ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
    }`;
    badge.textContent = profile.isCustom ? 'Custom' : 'Built-in';
    
    titleSection.appendChild(title);
    titleSection.appendChild(badge);
    headerContent.appendChild(titleSection);
    header.appendChild(headerContent);

    // Body
    const body = document.createElement('div');
    body.className = 'p-4';

    // Summary
    const summary = document.createElement('p');
    summary.className = 'text-gray-600 text-sm mb-4 line-clamp-2';
    summary.textContent = profile.summary || 'No description available';
    body.appendChild(summary);

    // Key foods (show first 4)
    if (profile.foodsToEmphasize && profile.foodsToEmphasize.length > 0) {
      const foodsLabel = document.createElement('p');
      foodsLabel.className = 'text-xs font-medium text-gray-500 mb-2';
      foodsLabel.textContent = 'Key Foods:';
      body.appendChild(foodsLabel);

      const foodsContainer = document.createElement('div');
      foodsContainer.className = 'flex flex-wrap gap-1 mb-4';
      
      profile.foodsToEmphasize.slice(0, 4).forEach(food => {
        const tag = document.createElement('span');
        tag.className = 'bg-green-50 text-green-700 text-xs px-2 py-1 rounded border border-green-200';
        tag.textContent = food;
        foodsContainer.appendChild(tag);
      });

      if (profile.foodsToEmphasize.length > 4) {
        const more = document.createElement('span');
        more.className = 'text-xs text-gray-500';
        more.textContent = `+${profile.foodsToEmphasize.length - 4} more`;
        foodsContainer.appendChild(more);
      }

      body.appendChild(foodsContainer);
    }

    // Actions
    const actions = document.createElement('div');
    actions.className = 'flex gap-2 pt-4 border-t border-gray-100';

    const viewBtn = document.createElement('button');
    viewBtn.className = 'flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-2 rounded-lg font-medium text-sm transition-colors';
    viewBtn.textContent = 'View Details';
    viewBtn.onclick = () => this.handleViewProfile(profile);

    actions.appendChild(viewBtn);

    if (profile.isCustom) {
      const editBtn = document.createElement('button');
      editBtn.className = 'flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-lg font-medium text-sm transition-colors';
      editBtn.textContent = 'Edit';
      editBtn.onclick = () => this.handleEditProfile(profile);
      actions.appendChild(editBtn);
    }

    const exportBtn = document.createElement('button');
    exportBtn.className = 'bg-green-50 hover:bg-green-100 text-green-600 px-3 py-2 rounded-lg font-medium text-sm transition-colors';
    exportBtn.textContent = '📤';
    exportBtn.title = 'Export profile';
    exportBtn.onclick = () => this.handleExportProfile(profile);
    actions.appendChild(exportBtn);

    body.appendChild(actions);

    card.appendChild(header);
    card.appendChild(body);

    return card;
  }

  /**
   * Event Handlers
   */

  handleFilterChange(filter) {
    this.state.filter = filter;
    this.rerender();
  }

  handleCreateProfile() {
    this.showProfileModal(null);
  }

  handleViewProfile(profile) {
    this.showDetailModal(profile);
  }

  handleEditProfile(profile) {
    this.showProfileModal(profile);
  }

  handleExportProfile(profile) {
    try {
      exportDietProfile(profile);
      this.showToast(`${profile.name} exported successfully`, 'success');
    } catch (error) {
      this.showToast('Export failed: ' + error.message, 'error');
    }
  }

  handleImportProfile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const result = await importDietProfile(file);
        if (result.success) {
          this.showToast(`Profile "${result.profile.name}" imported successfully`, 'success');
          this.state.profiles = getAllDietProfiles();
          this.rerender();
        } else {
          this.showToast('Import failed: ' + result.error, 'error');
        }
      } catch (error) {
        this.showToast('Import failed: ' + error.message, 'error');
      }
    };
    input.click();
  }

  /**
   * Show detail modal with full profile information
   */
  showDetailModal(profile) {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    overlay.onclick = (e) => {
      if (e.target === overlay) overlay.remove();
    };

    const modal = document.createElement('div');
    modal.className = 'bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto';

    // Header
    const header = document.createElement('div');
    header.className = `p-6 border-b border-gray-200 ${
      profile.isCustom 
        ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
        : 'bg-gradient-to-r from-blue-500 to-indigo-500'
    }`;
    
    const headerContent = document.createElement('div');
    headerContent.className = 'flex items-start justify-between';
    
    const titleSection = document.createElement('div');
    const title = document.createElement('h2');
    title.className = 'text-2xl font-bold text-white';
    title.textContent = profile.name;
    
    const badge = document.createElement('span');
    badge.className = 'inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 bg-white bg-opacity-20 text-white';
    badge.textContent = profile.isCustom ? '✨ Custom Profile' : '🏛️ Built-in Profile';
    
    titleSection.appendChild(title);
    titleSection.appendChild(badge);
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'text-white hover:text-gray-200 text-2xl';
    closeBtn.innerHTML = '×';
    closeBtn.onclick = () => overlay.remove();
    
    headerContent.appendChild(titleSection);
    headerContent.appendChild(closeBtn);
    header.appendChild(headerContent);

    // Body
    const body = document.createElement('div');
    body.className = 'p-6 space-y-6';

    // Summary & Description
    if (profile.summary || profile.description) {
      const summarySection = document.createElement('div');
      const summaryLabel = document.createElement('h3');
      summaryLabel.className = 'text-lg font-semibold text-gray-900 mb-2';
      summaryLabel.textContent = 'Overview';
      
      if (profile.summary) {
        const summaryText = document.createElement('p');
        summaryText.className = 'text-gray-700 font-medium';
        summaryText.textContent = profile.summary;
        summarySection.appendChild(summaryLabel);
        summarySection.appendChild(summaryText);
      }
      
      if (profile.description) {
        const descText = document.createElement('p');
        descText.className = 'text-gray-600 mt-2';
        descText.textContent = profile.description;
        summarySection.appendChild(descText);
      }
      
      body.appendChild(summarySection);
    }
    
    // Special banner for temporary diets
    if (profile.profileType === 'temporary') {
      const tempBanner = document.createElement('div');
      tempBanner.className = 'bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded';
      tempBanner.innerHTML = `
        <p class="font-semibold text-yellow-800">⚠️ Temporary Diet Protocol</p>
        <p class="text-sm text-yellow-700 mt-1">
          ${profile.requiresRetreatDate ? 'Requires retreat date. ' : ''}
          Duration: ${profile.minimumDuration || 'Varies'}
          ${profile.recommendedDuration ? `. Recommended: ${profile.recommendedDuration}` : ''}
        </p>
      `;
      body.appendChild(tempBanner);
    }

    // Principles
    if (profile.principles && profile.principles.length > 0) {
      const principlesSection = document.createElement('div');
      const principlesLabel = document.createElement('h3');
      principlesLabel.className = 'text-lg font-semibold text-gray-900 mb-2';
      principlesLabel.textContent = 'Key Principles';
      const principlesList = document.createElement('ul');
      principlesList.className = 'list-disc list-inside space-y-1 text-gray-700';
      profile.principles.forEach(principle => {
        const li = document.createElement('li');
        li.textContent = principle;
        principlesList.appendChild(li);
      });
      principlesSection.appendChild(principlesLabel);
      principlesSection.appendChild(principlesList);
      body.appendChild(principlesSection);
    }

    // Foods to Emphasize
    if (profile.foodsToEmphasize && profile.foodsToEmphasize.length > 0) {
      const foodsSection = document.createElement('div');
      const foodsLabel = document.createElement('h3');
      foodsLabel.className = 'text-lg font-semibold text-gray-900 mb-2';
      foodsLabel.textContent = '✅ Foods to Emphasize';
      const foodsContainer = document.createElement('div');
      foodsContainer.className = 'flex flex-wrap gap-2';
      profile.foodsToEmphasize.forEach(food => {
        const tag = document.createElement('span');
        tag.className = 'bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm border border-green-200';
        tag.textContent = food;
        foodsContainer.appendChild(tag);
      });
      foodsSection.appendChild(foodsLabel);
      foodsSection.appendChild(foodsContainer);
      body.appendChild(foodsSection);
    }

    // Foods to Avoid
    if (profile.foodsToAvoid && profile.foodsToAvoid.length > 0) {
      const avoidSection = document.createElement('div');
      const avoidLabel = document.createElement('h3');
      avoidLabel.className = 'text-lg font-semibold text-gray-900 mb-2';
      avoidLabel.textContent = '⛔ Foods to Avoid';
      const avoidContainer = document.createElement('div');
      avoidContainer.className = 'flex flex-wrap gap-2';
      profile.foodsToAvoid.forEach(food => {
        const tag = document.createElement('span');
        tag.className = 'bg-red-50 text-red-700 px-3 py-1 rounded-full text-sm border border-red-200';
        tag.textContent = food;
        avoidContainer.appendChild(tag);
      });
      avoidSection.appendChild(avoidLabel);
      avoidSection.appendChild(avoidContainer);
      body.appendChild(avoidSection);
    }

    // Macro Guidance
    if (profile.macroGuidance) {
      const macroSection = document.createElement('div');
      const macroLabel = document.createElement('h3');
      macroLabel.className = 'text-lg font-semibold text-gray-900 mb-2';
      macroLabel.textContent = '📊 Macro Guidance';
      const macroGrid = document.createElement('div');
      macroGrid.className = 'grid grid-cols-3 gap-4';
      
      ['carbs', 'protein', 'fat'].forEach(macro => {
        if (profile.macroGuidance[macro]) {
          const macroCard = document.createElement('div');
          macroCard.className = 'bg-gray-50 p-3 rounded-lg border border-gray-200';
          const macroName = document.createElement('div');
          macroName.className = 'text-xs font-medium text-gray-500 uppercase';
          macroName.textContent = macro;
          const macroValue = document.createElement('div');
          macroValue.className = 'text-sm font-semibold text-gray-900 mt-1';
          macroValue.textContent = profile.macroGuidance[macro];
          macroCard.appendChild(macroName);
          macroCard.appendChild(macroValue);
          macroGrid.appendChild(macroCard);
        }
      });
      
      macroSection.appendChild(macroLabel);
      macroSection.appendChild(macroGrid);
      body.appendChild(macroSection);
    }

    // Special Considerations
    if (profile.specialConsiderations) {
      const specialSection = document.createElement('div');
      const specialLabel = document.createElement('h3');
      specialLabel.className = 'text-lg font-semibold text-gray-900 mb-2';
      specialLabel.textContent = '💡 Special Considerations';
      const specialText = document.createElement('p');
      specialText.className = 'text-gray-700 bg-yellow-50 p-3 rounded-lg border border-yellow-200';
      specialText.textContent = profile.specialConsiderations;
      specialSection.appendChild(specialLabel);
      specialSection.appendChild(specialText);
      body.appendChild(specialSection);
    }

    // Meal Structure (if available)
    if (profile.mealStructure) {
      const mealSection = document.createElement('div');
      const mealLabel = document.createElement('h3');
      mealLabel.className = 'text-lg font-semibold text-gray-900 mb-3';
      mealLabel.textContent = '🍽️ Meal Structure';
      mealSection.appendChild(mealLabel);
      
      const mealGrid = document.createElement('div');
      mealGrid.className = 'grid grid-cols-1 md:grid-cols-2 gap-3';
      
      Object.entries(profile.mealStructure).forEach(([meal, description]) => {
        if (typeof description === 'string') {
          const mealCard = document.createElement('div');
          mealCard.className = 'bg-gray-50 p-3 rounded-lg border border-gray-200';
          mealCard.innerHTML = `
            <div class="font-medium text-gray-700 text-sm capitalize mb-1">${meal}</div>
            <div class="text-xs text-gray-600">${description}</div>
          `;
          mealGrid.appendChild(mealCard);
        }
      });
      
      mealSection.appendChild(mealGrid);
      body.appendChild(mealSection);
    }
    
    // Daily Targets (if available)
    if (profile.dailyTargets) {
      const targetsSection = document.createElement('div');
      const targetsLabel = document.createElement('h3');
      targetsLabel.className = 'text-lg font-semibold text-gray-900 mb-3';
      targetsLabel.textContent = '🎯 Daily Targets';
      targetsSection.appendChild(targetsLabel);
      
      const targetsList = document.createElement('div');
      targetsList.className = 'bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-1';
      
      Object.entries(profile.dailyTargets).forEach(([key, value]) => {
        const item = document.createElement('div');
        item.className = 'text-sm';
        item.innerHTML = `<span class="font-medium text-gray-700 capitalize">${key.replace(/([A-Z])/g, ' $1').trim()}:</span> <span class="text-gray-600">${value}</span>`;
        targetsList.appendChild(item);
      });
      
      targetsSection.appendChild(targetsList);
      body.appendChild(targetsSection);
    }
    
    // Tier System (for Longevity Protocol)
    if (profile.tierSystem) {
      const tierSection = document.createElement('div');
      const tierLabel = document.createElement('h3');
      tierLabel.className = 'text-lg font-semibold text-gray-900 mb-3';
      tierLabel.textContent = '📊 Food Tier System';
      tierSection.appendChild(tierLabel);
      
      const tiersList = document.createElement('div');
      tiersList.className = 'space-y-3';
      
      Object.entries(profile.tierSystem).forEach(([tier, data]) => {
        const tierCard = document.createElement('div');
        tierCard.className = 'bg-gray-50 p-3 rounded-lg border border-gray-200';
        tierCard.innerHTML = `
          <div class="font-semibold text-gray-800 text-sm mb-1">${data.label}</div>
          <div class="text-xs text-gray-600">${data.foods.join(', ')}</div>
        `;
        tiersList.appendChild(tierCard);
      });
      
      tierSection.appendChild(tiersList);
      body.appendChild(tierSection);
    }
    
    // Phases (for La Dieta and other progressive diets)
    if (profile.phases) {
      const phasesSection = document.createElement('div');
      const phasesLabel = document.createElement('h3');
      phasesLabel.className = 'text-lg font-semibold text-gray-900 mb-3';
      phasesLabel.textContent = '📅 Progressive Phases';
      phasesSection.appendChild(phasesLabel);
      
      const phasesList = document.createElement('div');
      phasesList.className = 'space-y-4';
      
      Object.entries(profile.phases).forEach(([phaseKey, phase]) => {
        const phaseCard = document.createElement('div');
        phaseCard.className = 'border-l-4 border-purple-400 bg-purple-50 p-4 rounded-r-lg';
        
        let phaseHTML = `
          <div class="font-semibold text-purple-900 mb-1">${phase.name}</div>
          <div class="text-xs text-purple-700 mb-2">⏰ ${phase.timing}</div>
          <div class="text-sm text-gray-700 mb-2">${phase.description}</div>
        `;
        
        if (phase.foodsToInclude) {
          phaseHTML += `<div class="text-xs text-gray-600 mt-2"><strong>Include:</strong> ${phase.foodsToInclude.slice(0, 3).join('; ')}${phase.foodsToInclude.length > 3 ? '...' : ''}</div>`;
        }
        
        if (phase.additionalRestrictions) {
          phaseHTML += `<div class="text-xs text-red-700 mt-1"><strong>Additional restrictions:</strong> ${phase.additionalRestrictions.slice(0, 3).join(', ')}${phase.additionalRestrictions.length > 3 ? '...' : ''}</div>`;
        }
        
        phaseCard.innerHTML = phaseHTML;
        phasesList.appendChild(phaseCard);
      });
      
      phasesSection.appendChild(phasesList);
      body.appendChild(phasesSection);
    }
    
    // Scientific Score (if available)
    if (profile.dietCompassScore) {
      const scoreSection = document.createElement('div');
      const scoreLabel = document.createElement('h3');
      scoreLabel.className = 'text-lg font-semibold text-gray-900 mb-3';
      scoreLabel.textContent = '📈 Diet Compass Score';
      scoreSection.appendChild(scoreLabel);
      
      const scoreCard = document.createElement('div');
      scoreCard.className = 'bg-green-50 p-4 rounded-lg border border-green-200';
      
      const overall = document.createElement('div');
      overall.className = 'text-center mb-3 pb-3 border-b border-green-300';
      overall.innerHTML = `
        <div class="text-3xl font-bold text-green-700">${profile.dietCompassScore.overall}/100</div>
        <div class="text-sm text-green-600">Overall Score</div>
      `;
      scoreCard.appendChild(overall);
      
      const metrics = document.createElement('div');
      metrics.className = 'grid grid-cols-2 gap-2 text-sm';
      
      const metricLabels = {
        nutrientDensity: 'Nutrient Density',
        longevity: 'Longevity',
        weightLoss: 'Weight Loss',
        heartHealth: 'Heart Health'
      };
      
      Object.entries(metricLabels).forEach(([key, label]) => {
        if (profile.dietCompassScore[key] !== undefined) {
          const metric = document.createElement('div');
          metric.innerHTML = `<span class="text-gray-700">${label}:</span> <span class="font-semibold text-green-700">${profile.dietCompassScore[key]}/10</span>`;
          metrics.appendChild(metric);
        }
      });
      
      scoreCard.appendChild(metrics);
      
      if (profile.dietCompassScore.notes) {
        const notes = document.createElement('div');
        notes.className = 'text-xs text-gray-600 mt-3 pt-3 border-t border-green-300';
        notes.textContent = profile.dietCompassScore.notes;
        scoreCard.appendChild(notes);
      }
      
      scoreSection.appendChild(scoreCard);
      body.appendChild(scoreSection);
    }
    
    // Compatible/Conflicting profiles
    if ((profile.compatibleWith && profile.compatibleWith.length > 0) || 
        (profile.conflictsWith && profile.conflictsWith.length > 0)) {
      const compatSection = document.createElement('div');
      const compatLabel = document.createElement('h3');
      compatLabel.className = 'text-lg font-semibold text-gray-900 mb-2';
      compatLabel.textContent = '🔗 Compatibility';
      compatSection.appendChild(compatLabel);
      
      const compatBox = document.createElement('div');
      compatBox.className = 'bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2';
      
      if (profile.compatibleWith && profile.compatibleWith.length > 0) {
        const compatDiv = document.createElement('div');
        compatDiv.className = 'text-sm';
        compatDiv.innerHTML = `<span class="font-medium text-gray-700">✅ Compatible with:</span> <span class="text-gray-600">${profile.compatibleWith.join(', ')}</span>`;
        compatBox.appendChild(compatDiv);
      }
      
      if (profile.conflictsWith && profile.conflictsWith.length > 0) {
        const conflictDiv = document.createElement('div');
        conflictDiv.className = 'text-sm';
        conflictDiv.innerHTML = `<span class="font-medium text-gray-700">⚠️ Conflicts with:</span> <span class="text-gray-600">${profile.conflictsWith.join(', ')}</span>`;
        compatBox.appendChild(conflictDiv);
      }
      
      compatSection.appendChild(compatBox);
      body.appendChild(compatSection);
    }

    // Footer actions
    const footer = document.createElement('div');
    footer.className = 'p-6 border-t border-gray-200 bg-gray-50 flex gap-3';
    
    const exportBtn = document.createElement('button');
    exportBtn.className = 'flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors';
    exportBtn.textContent = '📤 Export Profile';
    exportBtn.onclick = () => {
      this.handleExportProfile(profile);
      overlay.remove();
    };
    
    footer.appendChild(exportBtn);
    
    if (profile.isCustom) {
      const editBtn = document.createElement('button');
      editBtn.className = 'flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors';
      editBtn.textContent = '✏️ Edit Profile';
      editBtn.onclick = () => {
        overlay.remove();
        this.handleEditProfile(profile);
      };
      footer.appendChild(editBtn);
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors';
      deleteBtn.textContent = '🗑️';
      deleteBtn.title = 'Delete profile';
      deleteBtn.onclick = () => {
        if (confirm(`Delete "${profile.name}"? This cannot be undone.`)) {
          deleteDietProfile(profile.id);
          this.state.profiles = getAllDietProfiles();
          this.showToast(`"${profile.name}" deleted`, 'success');
          overlay.remove();
          this.rerender();
        }
      };
      footer.appendChild(deleteBtn);
    }

    modal.appendChild(header);
    modal.appendChild(body);
    modal.appendChild(footer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  /**
   * Show create/edit profile modal
   */
  showProfileModal(profile) {
    // TODO: Implement in next iteration
    alert('Profile create/edit form coming next!');
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `
      fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white font-medium z-50
      ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'}
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  /**
   * Re-render the page
   */
  rerender() {
    this.beforeRender();
    const currentContainer = document.getElementById('diet-profiles-container');
    if (currentContainer) {
      const newContainer = this.render();
      currentContainer.replaceWith(newContainer);
    }
  }
}
