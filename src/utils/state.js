/**
 * State Management
 * Centralized state management for the application
 */

import { saveCheckedItems, loadCheckedItems } from './storage.js';

class AppState {
  constructor() {
    this.currentPage = 'home';
    this.checkedItems = loadCheckedItems();
    this.hideChecked = false;
  }

  /**
   * Navigate to a different page
   * @param {string} page - Page identifier ('home', 'shopping', or day key)
   */
  navigateTo(page) {
    this.currentPage = page;
    this.notifyListeners();
  }

  /**
   * Toggle checked state of an item
   * @param {string} id - Item ID
   */
  toggleItem(id) {
    this.checkedItems[id] = !this.checkedItems[id];
    saveCheckedItems(this.checkedItems);
    this.notifyListeners();
  }

  /**
   * Toggle hide checked items setting
   */
  toggleHideChecked() {
    this.hideChecked = !this.hideChecked;
    this.notifyListeners();
  }

  /**
   * Get checked state of an item
   * @param {string} id - Item ID
   * @returns {boolean} Checked state
   */
  isChecked(id) {
    return !!this.checkedItems[id];
  }

  /**
   * Get current page
   * @returns {string} Current page identifier
   */
  getCurrentPage() {
    return this.currentPage;
  }

  /**
   * Get checked items count
   * @returns {number} Number of checked items
   */
  getCheckedCount() {
    return Object.values(this.checkedItems).filter(Boolean).length;
  }

  // Observer pattern for state changes
  listeners = [];

  /**
   * Subscribe to state changes
   * @param {Function} callback - Callback function
   */
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Notify all listeners of state changes
   */
  notifyListeners() {
    this.listeners.forEach(listener => listener(this));
  }
}

// Export singleton instance
export const appState = new AppState();
