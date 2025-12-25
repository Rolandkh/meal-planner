/**
 * Navigation Component
 * Global navigation bar with mobile hamburger menu
 * Slice 3 - Task 44
 */

export class Navigation {
  constructor() {
    this.isMenuOpen = false;
  }

  /**
   * Render the navigation bar
   */
  render() {
    const nav = document.createElement('nav');
    nav.className = 'bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40';
    nav.id = 'main-navigation';

    const container = document.createElement('div');
    container.className = 'container mx-auto px-4 py-3 max-w-7xl';

    const innerWrapper = document.createElement('div');
    innerWrapper.className = 'flex items-center justify-between';

    // Logo/Home link
    const logoLink = document.createElement('a');
    logoLink.href = '#/';
    logoLink.className = 'text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all';
    logoLink.textContent = 'Vanessa';

    // Desktop nav links
    const desktopLinks = document.createElement('div');
    desktopLinks.className = 'hidden md:flex items-center space-x-6';

    const navItems = [
      { path: '/', label: 'Home', icon: '🏠' },
      { path: '/recipes', label: 'Recipes', icon: '📖' },
      { path: '/shopping-list', label: 'Shopping', icon: '🛒' },
      { path: '/settings', label: 'Settings', icon: '⚙️' }
    ];

    navItems.forEach(item => {
      const link = document.createElement('a');
      link.href = `#${item.path}`;
      link.className = 'nav-link transition-colors';
      link.innerHTML = `<span class="mr-1">${item.icon}</span>${item.label}`;
      link.setAttribute('data-path', item.path);
      this.updateLinkStyle(link, item.path);
      desktopLinks.appendChild(link);
    });

    // Mobile hamburger button
    const mobileMenuBtn = document.createElement('button');
    mobileMenuBtn.className = 'md:hidden text-gray-600 hover:text-gray-900 focus:outline-none';
    mobileMenuBtn.innerHTML = `
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
      </svg>
    `;
    mobileMenuBtn.onclick = () => this.toggleMobileMenu();
    mobileMenuBtn.id = 'mobile-menu-btn';

    // Assemble desktop nav
    innerWrapper.appendChild(logoLink);
    innerWrapper.appendChild(desktopLinks);
    innerWrapper.appendChild(mobileMenuBtn);

    container.appendChild(innerWrapper);

    // Mobile menu (hidden by default)
    const mobileMenu = document.createElement('div');
    mobileMenu.className = 'md:hidden hidden mt-4 pb-4 border-t border-gray-200';
    mobileMenu.id = 'mobile-menu';

    const mobileLinks = document.createElement('div');
    mobileLinks.className = 'flex flex-col space-y-3 mt-4';

    navItems.forEach(item => {
      const link = document.createElement('a');
      link.href = `#${item.path}`;
      link.className = 'mobile-nav-link py-2 px-4 rounded-lg transition-colors';
      link.innerHTML = `<span class="mr-2 text-xl">${item.icon}</span>${item.label}`;
      link.setAttribute('data-path', item.path);
      link.onclick = () => this.closeMobileMenu();
      this.updateLinkStyle(link, item.path);
      mobileLinks.appendChild(link);
    });

    mobileMenu.appendChild(mobileLinks);
    container.appendChild(mobileMenu);

    nav.appendChild(container);

    return nav;
  }

  /**
   * Update link style based on active route
   */
  updateLinkStyle(link, path) {
    const currentHash = window.location.hash.slice(1) || '/';
    const isActive = 
      path === currentHash ||
      (path !== '/' && currentHash.startsWith(path));

    if (link.classList.contains('mobile-nav-link')) {
      // Mobile link styles
      if (isActive) {
        link.className = 'mobile-nav-link py-2 px-4 rounded-lg bg-blue-50 text-blue-600 font-medium';
      } else {
        link.className = 'mobile-nav-link py-2 px-4 rounded-lg hover:bg-gray-50 text-gray-700';
      }
    } else {
      // Desktop link styles
      if (isActive) {
        link.className = 'nav-link text-blue-600 font-semibold border-b-2 border-blue-600 pb-1 transition-colors';
      } else {
        link.className = 'nav-link text-gray-600 hover:text-blue-600 transition-colors';
      }
    }
  }

  /**
   * Toggle mobile menu
   */
  toggleMobileMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    const menu = document.getElementById('mobile-menu');
    
    if (menu) {
      if (this.isMenuOpen) {
        menu.classList.remove('hidden');
      } else {
        menu.classList.add('hidden');
      }
    }
  }

  /**
   * Close mobile menu
   */
  closeMobileMenu() {
    this.isMenuOpen = false;
    const menu = document.getElementById('mobile-menu');
    
    if (menu) {
      menu.classList.add('hidden');
    }
  }

  /**
   * Update active link highlights (called on route change)
   */
  updateActiveLinks() {
    const links = document.querySelectorAll('.nav-link, .mobile-nav-link');
    links.forEach(link => {
      const path = link.getAttribute('data-path');
      if (path) {
        this.updateLinkStyle(link, path);
      }
    });
  }

  /**
   * Attach to DOM and set up event listeners
   */
  attach() {
    // Check if navigation already exists
    let existingNav = document.getElementById('main-navigation');
    
    if (existingNav) {
      // Update existing navigation
      const newNav = this.render();
      existingNav.replaceWith(newNav);
    } else {
      // Create and insert new navigation
      const app = document.getElementById('app');
      if (app) {
        const newNav = this.render();
        app.parentNode.insertBefore(newNav, app);
      }
    }

    // Listen for hash changes to update active links
    window.addEventListener('hashchange', () => this.updateActiveLinks());
  }
}

