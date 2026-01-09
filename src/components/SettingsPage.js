/**
 * SettingsPage Component
 * Unified settings page with 4 sections:
 * 1. Storage Management - quota monitoring, backup/restore, data cleanup
 * 2. Household Members - manage eaters and their preferences
 * 3. Meal Planning Preferences - budget, shopping day, dietary goals
 * 4. Chat Preferences - Vanessa's personality and style
 * Slice 3 - Tasks 36, 37, 38
 */

import {
  loadEaters,
  saveEaters,
  createEater,
  updateEater,
  deleteEater,
  getOrCreateDefaultEater,
  loadBaseSpecification,
  saveBaseSpecification,
  getOrCreateBaseSpecification,
  updateBaseSpecification,
  getStorageQuota,
  exportAllData,
  importAllData,
  deleteOrphanedRecipes,
  clearOldMealPlans
} from '../utils/storage.js';

import { 
  getAllDietProfiles, 
  getDietProfileById 
} from '../utils/dietProfiles.js';

import { ensureDietProfiles, checkDietProfiles } from '../utils/forceDietProfilesInit.js';

export class SettingsPage {
  constructor() {
    this.state = {
      eaters: [],
      baseSpec: null,
      storageStats: null,
      activeSection: 'storage', // 'storage', 'household', 'mealPlanning', 'chatPreferences'
      editingEater: null, // For edit modal
      isAddingEater: false,
      saveStatus: null, // For showing save feedback
      saveTimeout: null
    };
  }

  /**
   * Load data before rendering
   */
  beforeRender() {
    // Ensure diet profiles are initialized (critical for household section)
    ensureDietProfiles();
    
    // Check and log diet profile status
    const profileStatus = checkDietProfiles();
    console.log('📋 Diet Profiles Status:', profileStatus);
    
    this.state.eaters = loadEaters();
    this.state.baseSpec = getOrCreateBaseSpecification();
    this.state.storageStats = getStorageQuota();
    
    console.log('Settings loaded:', {
      eatersCount: this.state.eaters.length,
      hasBaseSpec: !!this.state.baseSpec,
      storageUsed: this.state.storageStats.percentUsed + '%',
      dietProfiles: profileStatus.count
    });
  }

  /**
   * Main render method
   */
  render() {
    const container = document.createElement('div');
    container.className = 'settings-page min-h-screen bg-gray-50';
    container.id = 'settings-page-container';

    // Header
    const header = this.renderHeader();
    container.appendChild(header);

    // Main content
    const main = document.createElement('div');
    main.className = 'container mx-auto px-4 py-8 max-w-6xl';

    // Tab navigation
    const tabs = this.renderTabs();
    main.appendChild(tabs);

    // Active section content
    const sectionContent = this.renderActiveSection();
    main.appendChild(sectionContent);

    container.appendChild(main);

    return container;
  }

  /**
   * Render page header
   */
  renderHeader() {
    const header = document.createElement('div');
    header.className = 'bg-white shadow-sm border-b border-gray-200';

    const inner = document.createElement('div');
    inner.className = 'container mx-auto px-4 py-6 max-w-6xl';

    const titleRow = document.createElement('div');
    titleRow.className = 'flex items-center justify-between';

    // Title
    const titleDiv = document.createElement('div');
    const title = document.createElement('h1');
    title.className = 'text-3xl font-bold text-gray-900';
    title.textContent = 'Settings';
    const subtitle = document.createElement('p');
    subtitle.className = 'text-gray-600 mt-1';
    subtitle.textContent = 'Manage your profile, preferences, and data';
    titleDiv.appendChild(title);
    titleDiv.appendChild(subtitle);

    // Back button
    const backBtn = document.createElement('button');
    backBtn.className = 'text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2';
    backBtn.innerHTML = '← Back to Home';
    backBtn.onclick = () => window.location.hash = '#/';

    titleRow.appendChild(titleDiv);
    titleRow.appendChild(backBtn);
    inner.appendChild(titleRow);
    header.appendChild(inner);

    return header;
  }

  /**
   * Render tab navigation
   */
  renderTabs() {
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'mb-8';

    const tabsList = document.createElement('div');
    tabsList.className = 'flex space-x-1 bg-white rounded-lg p-1 shadow-sm border border-gray-200';

    const tabs = [
      { id: 'storage', label: '💾 Storage', icon: '💾' },
      { id: 'household', label: '👥 Household', icon: '👥' },
      { id: 'mealPlanning', label: '🍽️ Meal Planning', icon: '🍽️' },
      { id: 'mealPrep', label: '🔪 Meal Prep', icon: '🔪' },
      { id: 'chatPreferences', label: '💬 Chat', icon: '💬' },
      { id: 'dietProfiles', label: '📋 Diet Profiles', icon: '📋', isLink: true, href: '#/diet-profiles' }
    ];

    tabs.forEach(tab => {
      if (tab.isLink) {
        const link = document.createElement('a');
        link.href = tab.href;
        link.className = 'flex-1 py-3 px-4 rounded-md font-medium transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-50 text-center';
        link.textContent = tab.label;
        tabsList.appendChild(link);
      } else {
        const button = document.createElement('button');
        button.className = `
          flex-1 py-3 px-4 rounded-md font-medium transition-colors
          ${this.state.activeSection === tab.id
            ? 'bg-blue-500 text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }
        `.trim().replace(/\s+/g, ' ');
        button.textContent = tab.label;
        button.onclick = () => this.switchSection(tab.id);
        button.setAttribute('data-tab', tab.id);
        tabsList.appendChild(button);
      }
    });

    tabsContainer.appendChild(tabsList);
    return tabsContainer;
  }

  /**
   * Render the currently active section
   */
  renderActiveSection() {
    const wrapper = document.createElement('div');
    wrapper.className = 'section-content';

    switch (this.state.activeSection) {
      case 'storage':
        wrapper.appendChild(this.renderStorageSection());
        break;
      case 'household':
        wrapper.appendChild(this.renderHouseholdSection());
        break;
      case 'mealPlanning':
        wrapper.appendChild(this.renderMealPlanningSection());
        break;
      case 'mealPrep':
        wrapper.appendChild(this.renderMealPrepSection());
        break;
      case 'chatPreferences':
        wrapper.appendChild(this.renderChatPreferencesSection());
        break;
      default:
        wrapper.appendChild(this.renderStorageSection());
    }

    return wrapper;
  }

  /**
   * SECTION 1: Storage Management
   */
  renderStorageSection() {
    const section = document.createElement('div');
    section.className = 'space-y-6';

    // Storage Stats Card
    const statsCard = this.createCard('Storage Usage', this.renderStorageStats());
    section.appendChild(statsCard);

    // Backup & Restore Card
    const backupCard = this.createCard('Backup & Restore', this.renderBackupRestore());
    section.appendChild(backupCard);

    // Data Cleanup Card
    const cleanupCard = this.createCard('Data Cleanup', this.renderDataCleanup());
    section.appendChild(cleanupCard);

    return section;
  }

  /**
   * Render storage stats with progress bar
   */
  renderStorageStats() {
    const container = document.createElement('div');

    const stats = this.state.storageStats;
    const percentNum = parseFloat(stats.percentUsed);
    
    // Progress bar
    const progressContainer = document.createElement('div');
    progressContainer.className = 'mb-4';
    
    const progressLabel = document.createElement('div');
    progressLabel.className = 'flex justify-between text-sm text-gray-600 mb-2';
    progressLabel.innerHTML = `
      <span>${stats.usedMB} MB / ${stats.limitMB} MB</span>
      <span class="font-semibold">${stats.percentUsed}%</span>
    `;
    
    const progressBarBg = document.createElement('div');
    progressBarBg.className = 'w-full bg-gray-200 rounded-full h-4 overflow-hidden';
    
    const progressBarFill = document.createElement('div');
    progressBarFill.className = `h-full rounded-full transition-all ${
      percentNum > 80 ? 'bg-red-500' : 
      percentNum > 60 ? 'bg-yellow-500' : 
      'bg-green-500'
    }`;
    progressBarFill.style.width = `${percentNum}%`;
    
    progressBarBg.appendChild(progressBarFill);
    progressContainer.appendChild(progressLabel);
    progressContainer.appendChild(progressBarBg);
    
    container.appendChild(progressContainer);

    // Warning banner if critical
    if (stats.warning === 'critical') {
      const warning = document.createElement('div');
      warning.className = 'bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4';
      warning.innerHTML = `
        <strong>⚠️ Storage Almost Full</strong>
        <p class="text-sm mt-1">You're using more than 80% of available storage. Consider cleaning up old data or exporting a backup.</p>
      `;
      container.appendChild(warning);
    } else if (stats.warning === 'warning') {
      const warning = document.createElement('div');
      warning.className = 'bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg mb-4';
      warning.innerHTML = `
        <strong>📊 Storage Usage Notice</strong>
        <p class="text-sm mt-1">You've used over 60% of available storage. Keep an eye on your data usage.</p>
      `;
      container.appendChild(warning);
    }

    // Remaining space
    const remaining = document.createElement('p');
    remaining.className = 'text-sm text-gray-600';
    remaining.textContent = `${stats.remainingMB} MB remaining`;
    container.appendChild(remaining);

    return container;
  }

  /**
   * Render backup and restore controls
   */
  renderBackupRestore() {
    const container = document.createElement('div');
    container.className = 'space-y-4';

    // Export button
    const exportBtn = document.createElement('button');
    exportBtn.className = 'w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2';
    exportBtn.innerHTML = '📥 Export Backup';
    exportBtn.onclick = () => this.handleExport();

    // Import button
    const importBtn = document.createElement('button');
    importBtn.className = 'w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2';
    importBtn.innerHTML = '📤 Import Backup';
    importBtn.onclick = () => this.handleImportClick();

    // Hidden file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/json,.json';
    fileInput.style.display = 'none';
    fileInput.onchange = (e) => this.handleImport(e.target.files[0]);
    fileInput.id = 'backup-file-input';

    container.appendChild(exportBtn);
    container.appendChild(importBtn);
    container.appendChild(fileInput);

    return container;
  }

  /**
   * Render data cleanup controls
   */
  renderDataCleanup() {
    const container = document.createElement('div');
    container.className = 'space-y-4';

    // Delete orphaned recipes
    const orphanedBtn = document.createElement('button');
    orphanedBtn.className = 'w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-lg transition-colors';
    orphanedBtn.textContent = '🗑️ Remove Unused Recipes';
    orphanedBtn.onclick = () => this.handleDeleteOrphaned();

    // Clear old meal plans (Slice 4 feature - currently disabled)
    const clearPlansBtn = document.createElement('button');
    clearPlansBtn.className = 'w-full bg-gray-300 text-gray-500 font-medium py-3 px-4 rounded-lg cursor-not-allowed';
    clearPlansBtn.textContent = '📅 Clear Old Meal Plans (Coming in Slice 4)';
    clearPlansBtn.disabled = true;

    container.appendChild(orphanedBtn);
    container.appendChild(clearPlansBtn);

    return container;
  }

  /**
   * SECTION 2: Household Management
   */
  renderHouseholdSection() {
    const section = document.createElement('div');
    section.className = 'space-y-6';

    // Household members list
    const membersCard = this.createCard(
      'Household Members',
      this.renderEatersList(),
      this.renderAddEaterButton()
    );
    section.appendChild(membersCard);

    return section;
  }

  /**
   * Render list of eaters
   */
  renderEatersList() {
    const container = document.createElement('div');
    container.id = 'eaters-list-container';

    if (this.state.eaters.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'text-center py-8 text-gray-500';
      empty.textContent = 'No household members yet. Add your first member!';
      container.appendChild(empty);
      return container;
    }

    const list = document.createElement('div');
    list.className = 'space-y-3';

    // Sort eaters: default first, then alphabetically
    const sortedEaters = [...this.state.eaters].sort((a, b) => {
      if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    sortedEaters.forEach(eater => {
      const item = this.renderEaterItem(eater);
      list.appendChild(item);
    });

    container.appendChild(list);
    return container;
  }

  /**
   * Render a single eater item
   */
  renderEaterItem(eater) {
    const item = document.createElement('div');
    item.className = `
      bg-white border border-gray-200 rounded-lg p-4 
      hover:shadow-md transition-shadow
      ${eater.isDefault ? 'ring-2 ring-blue-300' : ''}
    `.trim().replace(/\s+/g, ' ');

    const content = document.createElement('div');
    content.className = 'flex items-start justify-between';

    // Left: Info
    const info = document.createElement('div');
    info.className = 'flex-1';

    const nameRow = document.createElement('div');
    nameRow.className = 'flex items-center gap-2 mb-2';

    const name = document.createElement('h3');
    name.className = 'text-lg font-semibold text-gray-900';
    name.textContent = eater.name;
    nameRow.appendChild(name);

    if (eater.isDefault) {
      const badge = document.createElement('span');
      badge.className = 'bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded';
      badge.textContent = 'Default';
      nameRow.appendChild(badge);
    }

    info.appendChild(nameRow);

    // Preferences
    if (eater.preferences) {
      const pref = document.createElement('p');
      pref.className = 'text-sm text-gray-600 mb-1';
      pref.textContent = `Preferences: ${eater.preferences}`;
      info.appendChild(pref);
    }

    // Allergies
    if (eater.allergies && eater.allergies.length > 0) {
      const allergies = document.createElement('p');
      allergies.className = 'text-sm text-red-600 mb-1';
      allergies.textContent = `⚠️ Allergies: ${eater.allergies.join(', ')}`;
      info.appendChild(allergies);
    }

    // Dietary restrictions
    if (eater.dietaryRestrictions && eater.dietaryRestrictions.length > 0) {
      const restrictions = document.createElement('p');
      restrictions.className = 'text-sm text-orange-600 mb-1';
      restrictions.textContent = `🥗 Restrictions: ${eater.dietaryRestrictions.join(', ')}`;
      info.appendChild(restrictions);
    }

    // Diet Profile (Slice 5)
    if (eater.dietProfile) {
      const profileName = getDietProfileById(eater.dietProfile)?.name || eater.dietProfile;
      const profile = document.createElement('p');
      profile.className = 'text-sm text-blue-600 font-medium mb-1';
      profile.textContent = `🍽️ Profile: ${profileName}`;
      info.appendChild(profile);
    }

    // Exclusions/Preferences (Slice 5)
    if ((eater.excludeIngredients && eater.excludeIngredients.length > 0) || 
        (eater.preferIngredients && eater.preferIngredients.length > 0)) {
      const tags = document.createElement('div');
      tags.className = 'flex flex-wrap gap-1 mt-1 mb-2';
      
      (eater.excludeIngredients || []).forEach(ex => {
        const span = document.createElement('span');
        span.className = 'bg-red-50 text-red-600 text-xs px-1.5 py-0.5 rounded border border-red-100';
        span.textContent = `⛔ ${ex}`;
        tags.appendChild(span);
      });

      (eater.preferIngredients || []).forEach(pref => {
        const span = document.createElement('span');
        span.className = 'bg-green-50 text-green-600 text-xs px-1.5 py-0.5 rounded border border-green-100';
        span.textContent = `❤️ ${pref}`;
        tags.appendChild(span);
      });

      info.appendChild(tags);
    }

    // Schedule
    if (eater.schedule) {
      const schedule = document.createElement('p');
      schedule.className = 'text-sm text-gray-500';
      schedule.textContent = `Schedule: ${eater.schedule}`;
      info.appendChild(schedule);
    }

    // Right: Actions
    const actions = document.createElement('div');
    actions.className = 'flex gap-2';

    const editBtn = document.createElement('button');
    editBtn.className = 'text-blue-600 hover:text-blue-700 font-medium text-sm px-3 py-1 rounded hover:bg-blue-50';
    editBtn.textContent = 'Edit';
    editBtn.onclick = () => this.handleEditEater(eater);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'text-red-600 hover:text-red-700 font-medium text-sm px-3 py-1 rounded hover:bg-red-50';
    deleteBtn.textContent = 'Delete';
    deleteBtn.onclick = () => this.handleDeleteEater(eater);

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    content.appendChild(info);
    content.appendChild(actions);
    item.appendChild(content);

    return item;
  }

  /**
   * Render "Add Member" button
   */
  renderAddEaterButton() {
    const button = document.createElement('button');
    button.className = 'w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2';
    button.innerHTML = '+ Add Household Member';
    button.onclick = () => this.handleAddEater();
    return button;
  }

  /**
   * SECTION 3: Meal Planning Preferences
   */
  renderMealPlanningSection() {
    const section = document.createElement('div');
    section.className = 'space-y-6';

    const card = this.createCard('Meal Planning Settings', this.renderMealPlanningForm());
    section.appendChild(card);

    return section;
  }

  /**
   * Render meal planning form
   */
  renderMealPlanningForm() {
    const form = document.createElement('form');
    form.className = 'space-y-6';
    form.id = 'meal-planning-form';
    form.onsubmit = (e) => e.preventDefault();

    const spec = this.state.baseSpec;

    // Weekly Budget
    const budgetGroup = this.createFormGroup(
      'Weekly Budget',
      'number',
      'weeklyBudget',
      spec.weeklyBudget || 150,
      'Enter your weekly grocery budget'
    );
    budgetGroup.querySelector('input').min = '0';
    budgetGroup.querySelector('input').step = '1';
    form.appendChild(budgetGroup);

    // Max Shopping List Items
    const maxItemsGroup = this.createFormGroup(
      'Maximum Shopping List Items',
      'number',
      'maxShoppingListItems',
      spec.maxShoppingListItems || 30,
      'Limit unique ingredients for simpler shopping'
    );
    const maxItemsInput = maxItemsGroup.querySelector('input');
    maxItemsInput.min = '15';
    maxItemsInput.max = '100';
    maxItemsInput.step = '5';
    const maxItemsHelp = document.createElement('p');
    maxItemsHelp.className = 'text-xs text-gray-500 mt-1';
    maxItemsHelp.textContent = 'Fewer items = simpler shopping and more ingredient reuse. Recommended: 25-35 items.';
    maxItemsGroup.appendChild(maxItemsHelp);
    form.appendChild(maxItemsGroup);

    // Shopping Day
    const shoppingGroup = this.createFormGroup(
      'Shopping Day',
      'select',
      'shoppingDay',
      spec.shoppingDay ?? 6,
      'Which day do you usually shop?'
    );
    const selectEl = shoppingGroup.querySelector('select');
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    days.forEach((day, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = day;
      option.selected = spec.shoppingDay === index;
      selectEl.appendChild(option);
    });
    form.appendChild(shoppingGroup);

    // Preferred Store
    const storeGroup = this.createFormGroup(
      'Preferred Store',
      'text',
      'preferredStore',
      spec.preferredStore || '',
      'e.g., Coles, Woolworths (optional)'
    );
    form.appendChild(storeGroup);

    // Dietary Goals
    const goalsGroup = document.createElement('div');
    goalsGroup.className = 'form-group';
    const goalsLabel = document.createElement('label');
    goalsLabel.className = 'block text-sm font-medium text-gray-700 mb-2';
    goalsLabel.textContent = 'Dietary Goals';
    const goalsTextarea = document.createElement('textarea');
    goalsTextarea.className = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent';
    goalsTextarea.name = 'dietaryGoals';
    goalsTextarea.rows = 3;
    goalsTextarea.value = spec.dietaryGoals || '';
    goalsTextarea.placeholder = 'Describe your dietary goals (e.g., lose weight, eat healthier, build muscle)';
    goalsGroup.appendChild(goalsLabel);
    goalsGroup.appendChild(goalsTextarea);
    form.appendChild(goalsGroup);
    
    // Slice 4: History Retention (Task 54)
    const historyRetentionGroup = this.createFormGroup(
      'History Retention',
      'select',
      'historyRetentionWeeks',
      spec.historyRetentionWeeks || 4,
      'How many weeks of meal plan history to keep'
    );
    const historySelect = historyRetentionGroup.querySelector('select');
    const retentionOptions = [
      { value: 1, label: '1 week' },
      { value: 2, label: '2 weeks' },
      { value: 4, label: '4 weeks (recommended)' },
      { value: 8, label: '8 weeks' },
      { value: 12, label: '12 weeks' }
    ];
    retentionOptions.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      option.selected = (spec.historyRetentionWeeks || 4) === opt.value;
      historySelect.appendChild(option);
    });
    form.appendChild(historyRetentionGroup);

    // Add change listeners for auto-save
    form.querySelectorAll('input, select, textarea').forEach(input => {
      input.addEventListener('blur', () => this.handleMealPlanningChange(form));
      input.addEventListener('change', () => this.handleMealPlanningChange(form));
    });

    // Save status message
    const saveStatus = document.createElement('div');
    saveStatus.id = 'meal-planning-save-status';
    saveStatus.className = 'text-sm text-gray-600 min-h-[20px]';
    form.appendChild(saveStatus);

    return form;
  }

  /**
   * SECTION 4: Meal Prep Settings (Slice 5)
   */
  renderMealPrepSection() {
    const section = document.createElement('div');
    section.className = 'space-y-6';

    const prepGridCard = this.createCard(
      'Daily Prep Levels',
      this.renderPrepLevelsGrid(),
      this.renderPrepLevelsLegend()
    );
    section.appendChild(prepGridCard);

    const batchDaysCard = this.createCard(
      'Batch Prep Days',
      this.renderBatchPrepDays()
    );
    section.appendChild(batchDaysCard);

    return section;
  }

  /**
   * Render 7x3 grid for prep levels
   */
  renderPrepLevelsGrid() {
    const container = document.createElement('div');
    container.className = 'overflow-x-auto';

    const spec = this.state.baseSpec;
    const prepSettings = spec.mealPrepSettings || {
      batchPrepDays: [6],
      prepLevels: {
        monday: { breakfast: 'medium', lunch: 'medium', dinner: 'medium' },
        tuesday: { breakfast: 'medium', lunch: 'medium', dinner: 'medium' },
        wednesday: { breakfast: 'medium', lunch: 'medium', dinner: 'medium' },
        thursday: { breakfast: 'medium', lunch: 'medium', dinner: 'medium' },
        friday: { breakfast: 'medium', lunch: 'medium', dinner: 'medium' },
        saturday: { breakfast: 'medium', lunch: 'medium', dinner: 'medium' },
        sunday: { breakfast: 'medium', lunch: 'medium', dinner: 'medium' }
      }
    };

    const table = document.createElement('table');
    table.className = 'w-full text-sm text-left';

    // Table Header
    const thead = document.createElement('thead');
    thead.className = 'text-xs text-gray-700 uppercase bg-gray-50';
    thead.innerHTML = `
      <tr>
        <th class="px-4 py-3">Day</th>
        <th class="px-4 py-3 text-center">Breakfast</th>
        <th class="px-4 py-3 text-center">Lunch</th>
        <th class="px-4 py-3 text-center">Dinner</th>
      </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const slots = ['breakfast', 'lunch', 'dinner'];

    days.forEach(day => {
      const row = document.createElement('tr');
      row.className = 'bg-white border-b hover:bg-gray-50';
      
      const dayCell = document.createElement('td');
      dayCell.className = 'px-4 py-4 font-medium text-gray-900 capitalize';
      dayCell.textContent = day;
      row.appendChild(dayCell);

      slots.forEach(slot => {
        const cell = document.createElement('td');
        cell.className = 'px-4 py-4';
        
        const select = document.createElement('select');
        select.className = 'w-full bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2';
        
        ['minimal', 'medium', 'full'].forEach(level => {
          const option = document.createElement('option');
          option.value = level;
          option.textContent = level.charAt(0).toUpperCase() + level.slice(1);
          
          // Defensive check for nested prepLevels
          const currentLevel = prepSettings.prepLevels?.[day]?.[slot] || 'medium';
          option.selected = currentLevel === level;
          select.appendChild(option);
        });

        select.onchange = (e) => this.handlePrepLevelChange(day, slot, e.target.value);
        cell.appendChild(select);
        row.appendChild(cell);
      });

      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    container.appendChild(table);

    // Save status
    const status = document.createElement('div');
    status.id = 'prep-grid-save-status';
    status.className = 'mt-4 text-sm text-gray-600 min-h-[20px]';
    container.appendChild(status);

    return container;
  }

  /**
   * Render legend for prep levels
   */
  renderPrepLevelsLegend() {
    const container = document.createElement('div');
    container.className = 'text-xs text-gray-500 space-y-1';
    container.innerHTML = `
      <p><strong>Minimal:</strong> Only reheating or < 5 mins assembly.</p>
      <p><strong>Medium:</strong> Basic cooking/chopping (15-30 mins).</p>
      <p><strong>Full:</strong> Elaborate cooking or from-scratch prep (45+ mins).</p>
    `;
    return container;
  }

  /**
   * Render batch prep days row
   */
  renderBatchPrepDays() {
    const container = document.createElement('div');
    container.className = 'space-y-4';

    const intro = document.createElement('p');
    intro.className = 'text-sm text-gray-600';
    intro.textContent = 'Which days do you dedicate to "Batch Prepping"? Vanessa will move time-consuming tasks like chopping and marinating to these days.';
    container.appendChild(intro);

    const grid = document.createElement('div');
    grid.className = 'flex flex-wrap gap-2';

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const spec = this.state.baseSpec;
    const batchDays = spec.mealPrepSettings?.batchPrepDays || [6];

    dayNames.forEach((name, index) => {
      const isSelected = batchDays.includes(index);
      const button = document.createElement('button');
      button.className = `
        px-4 py-2 rounded-full text-sm font-medium transition-colors border
        ${isSelected 
          ? 'bg-blue-500 text-white border-blue-600 shadow-sm' 
          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}
      `.trim().replace(/\s+/g, ' ');
      button.textContent = name;
      button.onclick = () => this.toggleBatchDay(index);
      grid.appendChild(button);
    });

    container.appendChild(grid);

    const status = document.createElement('div');
    status.id = 'batch-days-save-status';
    status.className = 'mt-2 text-sm text-gray-600 min-h-[20px]';
    container.appendChild(status);

    return container;
  }

  /**
   * Event Handlers for Prep Settings
   */

  handlePrepLevelChange(day, slot, level) {
    const spec = this.state.baseSpec;
    if (!spec.mealPrepSettings) {
      spec.mealPrepSettings = {
        batchPrepDays: [6],
        prepLevels: {}
      };
    }
    
    // Ensure all days exist
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    days.forEach(d => {
      if (!spec.mealPrepSettings.prepLevels[d]) {
        spec.mealPrepSettings.prepLevels[d] = { breakfast: 'medium', lunch: 'medium', dinner: 'medium' };
      }
    });

    spec.mealPrepSettings.prepLevels[day][slot] = level;
    
    this.saveMealPrepSettings('prep-grid-save-status');
  }

  toggleBatchDay(dayIndex) {
    const spec = this.state.baseSpec;
    if (!spec.mealPrepSettings) {
      spec.mealPrepSettings = {
        batchPrepDays: [6],
        prepLevels: {}
      };
    }

    let batchDays = spec.mealPrepSettings.batchPrepDays || [];
    if (batchDays.includes(dayIndex)) {
      batchDays = batchDays.filter(d => d !== dayIndex);
    } else {
      batchDays.push(dayIndex);
    }
    
    spec.mealPrepSettings.batchPrepDays = batchDays;
    
    this.saveMealPrepSettings('batch-days-save-status');
    this.rerender(); // Re-render to update button styles
  }

  saveMealPrepSettings(statusId) {
    const result = updateBaseSpecification({ 
      mealPrepSettings: this.state.baseSpec.mealPrepSettings 
    });
    
    const statusEl = document.getElementById(statusId);
    if (result.success && statusEl) {
      statusEl.textContent = '✓ Saved';
      statusEl.className = 'mt-4 text-sm text-green-600 min-h-[20px]';
      setTimeout(() => {
        statusEl.textContent = '';
      }, 2000);
    } else if (statusEl) {
      statusEl.textContent = '✗ Save failed';
      statusEl.className = 'mt-4 text-sm text-red-600 min-h-[20px]';
    }
  }

  /**
   * SECTION 5: Chat Preferences
   */
  renderChatPreferencesSection() {
    const section = document.createElement('div');
    section.className = 'space-y-6';

    const card = this.createCard('Chat Settings', this.renderChatPreferencesForm());
    section.appendChild(card);

    return section;
  }

  /**
   * Render chat preferences form
   */
  renderChatPreferencesForm() {
    const form = document.createElement('form');
    form.className = 'space-y-6';
    form.id = 'chat-preferences-form';
    form.onsubmit = (e) => e.preventDefault();

    const spec = this.state.baseSpec;
    const chatPrefs = spec.chatPreferences || {
      personality: 'friendly',
      communicationStyle: 'detailed'
    };

    // Vanessa Personality
    const personalityGroup = document.createElement('div');
    personalityGroup.className = 'form-group';
    const personalityLabel = document.createElement('label');
    personalityLabel.className = 'block text-sm font-medium text-gray-700 mb-3';
    personalityLabel.textContent = 'Vanessa\'s Personality';
    personalityGroup.appendChild(personalityLabel);

    const personalities = [
      { value: 'friendly', label: 'Friendly', desc: 'Warm and conversational' },
      { value: 'professional', label: 'Professional', desc: 'Formal and efficient' },
      { value: 'casual', label: 'Casual', desc: 'Relaxed and informal' }
    ];

    personalities.forEach(p => {
      const radio = this.createRadioOption(
        'personality',
        p.value,
        p.label,
        p.desc,
        chatPrefs.personality === p.value
      );
      personalityGroup.appendChild(radio);
    });

    form.appendChild(personalityGroup);

    // Communication Style
    const styleGroup = document.createElement('div');
    styleGroup.className = 'form-group';
    const styleLabel = document.createElement('label');
    styleLabel.className = 'block text-sm font-medium text-gray-700 mb-3';
    styleLabel.textContent = 'Communication Style';
    styleGroup.appendChild(styleLabel);

    const styles = [
      { value: 'concise', label: 'Concise', desc: 'Brief, to-the-point responses' },
      { value: 'detailed', label: 'Detailed', desc: 'Thorough explanations' }
    ];

    styles.forEach(s => {
      const radio = this.createRadioOption(
        'communicationStyle',
        s.value,
        s.label,
        s.desc,
        chatPrefs.communicationStyle === s.value
      );
      styleGroup.appendChild(radio);
    });

    form.appendChild(styleGroup);

    // Reset Onboarding Button
    const resetGroup = document.createElement('div');
    resetGroup.className = 'pt-4 border-t border-gray-200';
    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-lg transition-colors';
    resetBtn.textContent = '🔄 Reset Onboarding';
    resetBtn.onclick = () => this.handleResetOnboarding();
    resetGroup.appendChild(resetBtn);
    form.appendChild(resetGroup);

    // Add change listeners for auto-save
    form.querySelectorAll('input[type="radio"]').forEach(input => {
      input.addEventListener('change', () => this.handleChatPreferencesChange(form));
    });

    // Save status message
    const saveStatus = document.createElement('div');
    saveStatus.id = 'chat-preferences-save-status';
    saveStatus.className = 'text-sm text-gray-600 min-h-[20px]';
    form.appendChild(saveStatus);

    return form;
  }

  /**
   * Helper: Create a card container
   */
  createCard(title, content, footer = null) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden';

    const header = document.createElement('div');
    header.className = 'px-6 py-4 border-b border-gray-200 bg-gray-50';
    const h2 = document.createElement('h2');
    h2.className = 'text-xl font-semibold text-gray-900';
    h2.textContent = title;
    header.appendChild(h2);

    const body = document.createElement('div');
    body.className = 'px-6 py-6';
    body.appendChild(content);

    card.appendChild(header);
    card.appendChild(body);

    if (footer) {
      const footerDiv = document.createElement('div');
      footerDiv.className = 'px-6 py-4 border-t border-gray-200 bg-gray-50';
      footerDiv.appendChild(footer);
      card.appendChild(footerDiv);
    }

    return card;
  }

  /**
   * Helper: Create a form group (label + input)
   */
  createFormGroup(label, type, name, value, placeholder) {
    const group = document.createElement('div');
    group.className = 'form-group';

    const labelEl = document.createElement('label');
    labelEl.className = 'block text-sm font-medium text-gray-700 mb-2';
    labelEl.textContent = label;

    let inputEl;
    if (type === 'select') {
      inputEl = document.createElement('select');
      inputEl.className = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent';
    } else {
      inputEl = document.createElement('input');
      inputEl.type = type;
      inputEl.className = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent';
      inputEl.value = value;
      inputEl.placeholder = placeholder;
    }
    
    inputEl.name = name;

    group.appendChild(labelEl);
    group.appendChild(inputEl);

    return group;
  }

  /**
   * Helper: Create a radio option
   */
  createRadioOption(name, value, label, description, checked) {
    const wrapper = document.createElement('div');
    wrapper.className = 'flex items-start mb-3';

    const input = document.createElement('input');
    input.type = 'radio';
    input.name = name;
    input.value = value;
    input.checked = checked;
    input.className = 'mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500';
    input.id = `${name}-${value}`;

    const labelDiv = document.createElement('div');
    labelDiv.className = 'ml-3';

    const labelEl = document.createElement('label');
    labelEl.htmlFor = input.id;
    labelEl.className = 'font-medium text-gray-700 cursor-pointer';
    labelEl.textContent = label;

    const desc = document.createElement('p');
    desc.className = 'text-sm text-gray-500';
    desc.textContent = description;

    labelDiv.appendChild(labelEl);
    labelDiv.appendChild(desc);

    wrapper.appendChild(input);
    wrapper.appendChild(labelDiv);

    return wrapper;
  }

  /**
   * Event Handlers
   */

  switchSection(sectionId) {
    this.state.activeSection = sectionId;
    this.rerender();
  }

  handleAddEater() {
    this.showEaterModal(null);
  }

  handleEditEater(eater) {
    this.showEaterModal(eater);
  }

  handleDeleteEater(eater) {
    if (!confirm(`Are you sure you want to remove ${eater.name} from your household?`)) {
      return;
    }

    const result = deleteEater(eater.eaterId);
    
    if (result.success) {
      this.showToast(`${eater.name} removed successfully`, 'success');
      this.state.eaters = loadEaters();
      this.rerender();
    } else {
      this.showToast(`Error: ${result.message}`, 'error');
    }
  }

  handleExport() {
    const result = exportAllData();
    if (result.success) {
      this.showToast(`Backup exported successfully (${result.sizeKB} KB)`, 'success');
    } else {
      this.showToast(`Export failed: ${result.message}`, 'error');
    }
  }

  handleImportClick() {
    const fileInput = document.getElementById('backup-file-input');
    if (fileInput) {
      fileInput.click();
    }
  }

  async handleImport(file) {
    if (!file) return;

    if (!confirm('This will replace all your current data. Are you sure?')) {
      return;
    }

    try {
      const result = await importAllData(file);
      if (result.success) {
        this.showToast(`Data imported successfully! Reloading...`, 'success');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        this.showToast(`Import failed: ${result.message}`, 'error');
      }
    } catch (error) {
      this.showToast(`Import failed: ${error.message}`, 'error');
    }
  }

  handleDeleteOrphaned() {
    if (!confirm('This will delete recipes that are not used in any meal plan. Continue?')) {
      return;
    }

    const result = deleteOrphanedRecipes();
    
    if (result.success) {
      if (result.deleted === 0) {
        this.showToast('No unused recipes found', 'info');
      } else {
        this.showToast(`Deleted ${result.deleted} unused recipe(s)`, 'success');
      }
      this.state.storageStats = getStorageQuota();
      this.rerender();
    } else {
      this.showToast(`Error: ${result.message}`, 'error');
    }
  }

  handleMealPlanningChange(form) {
    const formData = new FormData(form);
    const updates = {
      weeklyBudget: parseInt(formData.get('weeklyBudget'), 10),
      maxShoppingListItems: parseInt(formData.get('maxShoppingListItems'), 10),
      shoppingDay: parseInt(formData.get('shoppingDay'), 10),
      preferredStore: formData.get('preferredStore'),
      dietaryGoals: formData.get('dietaryGoals'),
      historyRetentionWeeks: parseInt(formData.get('historyRetentionWeeks'), 10) // Slice 4: Task 54
    };

    // Clear existing timeout
    if (this.state.saveTimeout) {
      clearTimeout(this.state.saveTimeout);
    }

    // Debounce save
    this.state.saveTimeout = setTimeout(() => {
      const result = updateBaseSpecification(updates);
      const statusEl = document.getElementById('meal-planning-save-status');
      
      if (result.success && statusEl) {
        statusEl.textContent = '✓ Settings saved';
        statusEl.className = 'text-sm text-green-600 min-h-[20px]';
        setTimeout(() => {
          statusEl.textContent = '';
          statusEl.className = 'text-sm text-gray-600 min-h-[20px]';
        }, 2000);
      } else if (statusEl) {
        statusEl.textContent = '✗ Save failed';
        statusEl.className = 'text-sm text-red-600 min-h-[20px]';
      }

      this.state.baseSpec = loadBaseSpecification();
    }, 300);
  }

  handleChatPreferencesChange(form) {
    const formData = new FormData(form);
    const chatPreferences = {
      personality: formData.get('personality') || 'friendly',
      communicationStyle: formData.get('communicationStyle') || 'detailed'
    };

    const result = updateBaseSpecification({ chatPreferences });
    const statusEl = document.getElementById('chat-preferences-save-status');
    
    if (result.success && statusEl) {
      statusEl.textContent = '✓ Preferences saved';
      statusEl.className = 'text-sm text-green-600 min-h-[20px]';
      setTimeout(() => {
        statusEl.textContent = '';
        statusEl.className = 'text-sm text-gray-600 min-h-[20px]';
      }, 2000);
    } else if (statusEl) {
      statusEl.textContent = '✗ Save failed';
      statusEl.className = 'text-sm text-red-600 min-h-[20px]';
    }

    this.state.baseSpec = loadBaseSpecification();
  }

  handleResetOnboarding() {
    if (!confirm('This will reset the onboarding flow. Next time you visit, Vanessa will ask you the setup questions again. Continue?')) {
      return;
    }

    const result = updateBaseSpecification({ onboardingComplete: false });
    
    if (result.success) {
      this.showToast('Onboarding reset successfully', 'success');
      this.state.baseSpec = loadBaseSpecification();
    } else {
      this.showToast('Failed to reset onboarding', 'error');
    }
  }

  /**
   * Show eater add/edit modal
   */
  showEaterModal(eater) {
    const isEdit = eater !== null;
    
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    overlay.id = 'eater-modal-overlay';
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        this.closeEaterModal();
      }
    };

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto';

    // Modal header
    const header = document.createElement('div');
    header.className = 'px-6 py-4 border-b border-gray-200 flex items-center justify-between';
    const title = document.createElement('h3');
    title.className = 'text-xl font-semibold text-gray-900';
    title.textContent = isEdit ? 'Edit Household Member' : 'Add Household Member';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'text-gray-400 hover:text-gray-600';
    closeBtn.innerHTML = '✕';
    closeBtn.onclick = () => this.closeEaterModal();
    header.appendChild(title);
    header.appendChild(closeBtn);

    // Modal body (form)
    const body = document.createElement('div');
    body.className = 'px-6 py-6';

    const form = document.createElement('form');
    form.id = 'eater-form';
    form.className = 'space-y-4';
    form.onsubmit = (e) => {
      e.preventDefault();
      this.handleSaveEater(eater);
    };

    // Name
    const nameGroup = this.createFormGroup(
      'Name *',
      'text',
      'eaterName',
      eater?.name || '',
      'Enter name'
    );
    nameGroup.querySelector('input').required = true;
    form.appendChild(nameGroup);

    // Preferences
    const prefGroup = this.createFormGroup(
      'Food Preferences',
      'text',
      'eaterPreferences',
      eater?.preferences || '',
      'e.g., loves spicy food, dislikes seafood'
    );
    form.appendChild(prefGroup);

    // Allergies
    const allergyGroup = this.createFormGroup(
      'Allergies',
      'text',
      'eaterAllergies',
      eater?.allergies?.join(', ') || '',
      'Comma-separated: peanuts, shellfish, etc.'
    );
    form.appendChild(allergyGroup);

    // Dietary Restrictions
    const restrictionGroup = this.createFormGroup(
      'Dietary Restrictions',
      'text',
      'eaterRestrictions',
      eater?.dietaryRestrictions?.join(', ') || '',
      'Comma-separated: vegetarian, gluten-free, etc.'
    );
    form.appendChild(restrictionGroup);

    // Schedule
    const scheduleGroup = this.createFormGroup(
      'Schedule',
      'text',
      'eaterSchedule',
      eater?.schedule || '',
      'e.g., Home for dinner, travels on weekends'
    );
    form.appendChild(scheduleGroup);

    // --- SLICE 5: Diet Profile & Preferences ---
    const slice5Header = document.createElement('div');
    slice5Header.className = 'pt-4 border-t border-gray-200 mt-4';
    slice5Header.innerHTML = '<h4 class="text-md font-semibold text-gray-900 mb-2">Dietary Profile (Slice 5)</h4>';
    form.appendChild(slice5Header);

    // Diet Profile Dropdown
    const profiles = getAllDietProfiles();
    console.log('📋 Loading diet profiles for eater modal:', profiles.length, 'profiles available');
    if (profiles.length === 0) {
      console.warn('⚠️ No diet profiles found! Check if diet profiles are initialized in localStorage.');
    }
    
    const profileGroup = this.createFormGroup(
      'Diet Profile',
      'select',
      'eaterDietProfile',
      eater?.dietProfile || '',
      'Select a diet profile'
    );
    const profileSelect = profileGroup.querySelector('select');
    
    // Add "None" option
    const noneOption = document.createElement('option');
    noneOption.value = '';
    noneOption.textContent = 'None / Personalized';
    profileSelect.appendChild(noneOption);

    profiles.forEach(p => {
      const option = document.createElement('option');
      option.value = p.id;
      option.textContent = p.name;
      option.selected = eater?.dietProfile === p.id;
      profileSelect.appendChild(option);
    });
    form.appendChild(profileGroup);

    // Profile Description Box
    const profileDescBox = document.createElement('div');
    profileDescBox.id = 'profile-description-box';
    profileDescBox.className = 'bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800 mb-4 hidden';
    form.appendChild(profileDescBox);

    const updateProfileDesc = (profileId) => {
      const profile = getDietProfileById(profileId);
      if (profile) {
        profileDescBox.innerHTML = `
          <p class="font-semibold">${profile.name}</p>
          <p class="mt-1">${profile.summary}</p>
          <div class="mt-2 flex flex-wrap gap-1">
            ${(profile.foodsToEmphasize || []).slice(0, 5).map(f => `<span class="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-sm text-xs">❤️ ${f}</span>`).join('')}
          </div>
        `;
        profileDescBox.classList.remove('hidden');
      } else {
        profileDescBox.classList.add('hidden');
      }
    };

    profileSelect.onchange = (e) => updateProfileDesc(e.target.value);
    // Initial update
    if (eater?.dietProfile) updateProfileDesc(eater.dietProfile);

    // Exclude Ingredients
    const excludeGroup = this.createFormGroup(
      'Exclude Ingredients (Hard Filter)',
      'text',
      'eaterExcludeIngredients',
      eater?.excludeIngredients?.join(', ') || '',
      'e.g., eggplant, tomatoes, shellfish'
    );
    const excludeHelp = document.createElement('p');
    excludeHelp.className = 'text-xs text-gray-500 mt-1';
    excludeHelp.textContent = 'Vanessa will NEVER include these in your plan.';
    excludeGroup.appendChild(excludeHelp);
    form.appendChild(excludeGroup);

    // Prefer Ingredients
    const preferGroup = this.createFormGroup(
      'Prefer Ingredients (Soft Priority)',
      'text',
      'eaterPreferIngredients',
      eater?.preferIngredients?.join(', ') || '',
      'e.g., salmon, avocado, blueberries'
    );
    const preferHelp = document.createElement('p');
    preferHelp.className = 'text-xs text-gray-500 mt-1';
    preferHelp.textContent = 'Vanessa will try to prioritize these where possible.';
    preferGroup.appendChild(preferHelp);
    form.appendChild(preferGroup);

    // Personal Preferences Textarea
    const personalPrefGroup = document.createElement('div');
    personalPrefGroup.className = 'form-group';
    const personalPrefLabel = document.createElement('label');
    personalPrefLabel.className = 'block text-sm font-medium text-gray-700 mb-2';
    personalPrefLabel.textContent = 'Additional Notes / Preferences';
    const personalPrefTextarea = document.createElement('textarea');
    personalPrefTextarea.className = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent';
    personalPrefTextarea.name = 'eaterPersonalPreferences';
    personalPrefTextarea.rows = 3;
    personalPrefTextarea.value = eater?.personalPreferences || '';
    personalPrefTextarea.placeholder = 'e.g., loves spicy food, prefers hot breakfast, avoids complex textures';
    personalPrefGroup.appendChild(personalPrefLabel);
    personalPrefGroup.appendChild(personalPrefTextarea);
    form.appendChild(personalPrefGroup);

    // Is Default checkbox
    const defaultGroup = document.createElement('div');
    defaultGroup.className = 'flex items-center';
    const defaultCheckbox = document.createElement('input');
    defaultCheckbox.type = 'checkbox';
    defaultCheckbox.name = 'eaterIsDefault';
    defaultCheckbox.id = 'eaterIsDefault';
    defaultCheckbox.checked = eater?.isDefault || false;
    defaultCheckbox.className = 'h-4 w-4 text-blue-600 focus:ring-blue-500 rounded';
    const defaultLabel = document.createElement('label');
    defaultLabel.htmlFor = 'eaterIsDefault';
    defaultLabel.className = 'ml-2 text-sm text-gray-700';
    defaultLabel.textContent = 'Make this the default household member';
    defaultGroup.appendChild(defaultCheckbox);
    defaultGroup.appendChild(defaultLabel);
    form.appendChild(defaultGroup);

    body.appendChild(form);

    // Modal footer
    const footer = document.createElement('div');
    footer.className = 'px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'px-4 py-2 text-gray-700 hover:text-gray-900 font-medium';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = () => this.closeEaterModal();

    const saveBtn = document.createElement('button');
    saveBtn.type = 'submit';
    saveBtn.setAttribute('form', 'eater-form');
    saveBtn.className = 'px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors';
    saveBtn.textContent = isEdit ? 'Save Changes' : 'Add Member';

    footer.appendChild(cancelBtn);
    footer.appendChild(saveBtn);

    // Assemble modal
    modal.appendChild(header);
    modal.appendChild(body);
    modal.appendChild(footer);
    overlay.appendChild(modal);

    // Add to page
    document.body.appendChild(overlay);
  }

  closeEaterModal() {
    const overlay = document.getElementById('eater-modal-overlay');
    if (overlay) {
      overlay.remove();
    }
  }

  handleSaveEater(existingEater) {
    const form = document.getElementById('eater-form');
    const formData = new FormData(form);

    const name = formData.get('eaterName').trim();
    const preferences = formData.get('eaterPreferences').trim();
    const allergies = formData.get('eaterAllergies')
      .split(',')
      .map(a => a.trim())
      .filter(a => a.length > 0);
    const dietaryRestrictions = formData.get('eaterRestrictions')
      .split(',')
      .map(r => r.trim())
      .filter(r => r.length > 0);
    const schedule = formData.get('eaterSchedule').trim();
    const isDefault = formData.get('eaterIsDefault') === 'on';

    // Slice 5 fields
    const dietProfile = formData.get('eaterDietProfile') || null;
    const excludeIngredients = formData.get('eaterExcludeIngredients')
      .split(',')
      .map(a => a.trim())
      .filter(a => a.length > 0);
    const preferIngredients = formData.get('eaterPreferIngredients')
      .split(',')
      .map(a => a.trim())
      .filter(a => a.length > 0);
    const personalPreferences = formData.get('eaterPersonalPreferences').trim();

    if (!name) {
      this.showToast('Name is required', 'error');
      return;
    }

    let result;

    if (existingEater) {
      // Update existing eater
      result = updateEater(existingEater.eaterId, {
        name,
        preferences,
        allergies,
        dietaryRestrictions,
        schedule,
        isDefault,
        dietProfile,
        excludeIngredients,
        preferIngredients,
        personalPreferences
      });
    } else {
      // Create new eater
      const newEater = createEater({
        name,
        preferences,
        allergies,
        dietaryRestrictions,
        schedule,
        isDefault,
        dietProfile,
        excludeIngredients,
        preferIngredients,
        personalPreferences
      });

      const eaters = loadEaters();
      
      // If setting as default, unset others
      if (isDefault) {
        eaters.forEach(e => e.isDefault = false);
      }

      eaters.push(newEater);
      result = saveEaters(eaters);
    }

    if (result.success) {
      this.showToast(
        existingEater ? 'Member updated successfully' : 'Member added successfully',
        'success'
      );
      this.state.eaters = loadEaters();
      this.closeEaterModal();
      this.rerender();
    } else {
      this.showToast(`Error: ${result.message}`, 'error');
    }
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `
      fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white font-medium
      transition-all transform translate-y-0 opacity-100 z-50
      ${type === 'success' ? 'bg-green-500' :
        type === 'error' ? 'bg-red-500' :
        type === 'warning' ? 'bg-yellow-500' :
        'bg-blue-500'}
    `.trim().replace(/\s+/g, ' ');
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.transform = 'translateY(100px)';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /**
   * Re-render the page
   */
  rerender() {
    // Reload data
    this.beforeRender();

    // Get current container
    const currentContainer = document.getElementById('settings-page-container');
    if (!currentContainer) {
      console.error('Settings page container not found');
      return;
    }

    // Render new content
    const newContainer = this.render();

    // Replace in DOM
    currentContainer.replaceWith(newContainer);
  }

  /**
   * Cleanup when component is unmounted
   */
  afterRender() {
    console.log('Settings page rendered');
  }
}

