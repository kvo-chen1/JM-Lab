export class PinterestSearchBar {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) throw new Error(`Container element with ID '${containerId}' not found.`);

    this.options = {
      placeholder: 'Search',
      onSearch: options.onSearch || this.mockSearch,
      debounceTime: 300,
      ...options
    };

    this.init();
  }

  init() {
    this.render();
    this.cacheElements();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="pinterest-search-wrapper">
        <div class="pinterest-search-bar" role="search">
          <div class="search-icon-wrapper">
            <svg class="search-icon" viewBox="0 0 24 24" aria-hidden="true">
               <path d="M10 16c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z M10 2c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8z" />
            </svg>
          </div>
          <input type="text" 
            placeholder="${this.options.placeholder}" 
            aria-label="Search" 
            id="pinterest-search-input"
            autocomplete="off"
          >
          <button class="clear-btn" aria-label="Clear search">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
          <div class="search-results" aria-live="polite"></div>
        </div>
      </div>
    `;
  }

  cacheElements() {
    this.searchBar = this.container.querySelector('.pinterest-search-bar');
    this.input = this.container.querySelector('input');
    this.clearBtn = this.container.querySelector('.clear-btn');
    this.resultsContainer = this.container.querySelector('.search-results');
  }

  bindEvents() {
    // Focus
    this.input.addEventListener('focus', () => this.searchBar.classList.add('focused'));
    this.input.addEventListener('blur', () => {
      this.searchBar.classList.remove('focused');
      // Delay hiding results to allow clicking them
      setTimeout(() => this.hideResults(), 200);
    });

    // Input & Debounce
    const debouncedSearch = this.debounce((value) => {
        this.handleSearch(value);
    }, this.options.debounceTime);

    this.input.addEventListener('input', (e) => {
      const value = e.target.value;
      this.toggleClearButton(value);
      debouncedSearch(value);
    });

    // Clear Button
    this.clearBtn.addEventListener('click', () => {
      this.input.value = '';
      this.toggleClearButton('');
      this.input.focus();
      this.hideResults();
    });

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== this.input) {
        e.preventDefault();
        this.input.focus();
      }
      if (e.key === 'Escape' && document.activeElement === this.input) {
        this.input.value = '';
        this.toggleClearButton('');
        this.input.blur();
        this.hideResults();
      }
    });
  }

  toggleClearButton(value) {
    if (value.length > 0) {
      this.clearBtn.classList.add('visible');
    } else {
      this.clearBtn.classList.remove('visible');
    }
  }

  debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  handleSearch(query) {
    if (!query.trim()) {
      this.hideResults();
      return;
    }

    // Show Skeleton
    this.showSkeleton();

    // Execute Search
    Promise.resolve(this.options.onSearch(query)).then(results => {
      // Check if input value matches the query (avoid race conditions)
      if (this.input.value !== query) return;
      this.renderResults(results);
    });
  }

  showSkeleton() {
    this.resultsContainer.innerHTML = `
      <div class="skeleton-container">
          <div class="skeleton-item"></div>
          <div class="skeleton-item"></div>
          <div class="skeleton-item"></div>
      </div>
    `;
    this.resultsContainer.classList.add('visible');
  }

  hideResults() {
    this.resultsContainer.classList.remove('visible');
    // Clear content after animation to avoid flicker
    setTimeout(() => {
        if (!this.resultsContainer.classList.contains('visible')) {
            this.resultsContainer.innerHTML = '';
        }
    }, 200);
  }

  renderResults(results) {
    if (!results || results.length === 0) {
       this.resultsContainer.innerHTML = '<div style="padding:12px; color:#767676; text-align:center;">No results found</div>';
       return;
    }

    const list = document.createElement('ul');
    list.style.listStyle = 'none';
    list.style.padding = '0';
    list.style.margin = '0';

    results.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      li.style.padding = '12px 16px';
      li.style.cursor = 'pointer';
      li.style.fontSize = '16px';
      li.style.fontWeight = '700';
      li.style.color = '#111';
      li.style.borderRadius = '8px';
      li.style.transition = 'background-color 0.2s';
      
      li.addEventListener('mouseenter', () => li.style.backgroundColor = '#e9e9e9');
      li.addEventListener('mouseleave', () => li.style.backgroundColor = 'transparent');
      li.addEventListener('click', () => {
          this.input.value = item;
          // alert(`Selected: ${item}`); // Optional: user didn't ask for alert, just behavior
          this.hideResults();
      });

      list.appendChild(li);
    });

    this.resultsContainer.innerHTML = '';
    this.resultsContainer.appendChild(list);
  }

  // Default mock search
  mockSearch(query) {
    return new Promise(resolve => {
      setTimeout(() => {
        const mockData = [
          'Chicken dinner recipes',
          'Home decor ideas',
          'Summer outfits',
          'Travel photography',
          'DIY crafts',
          'Healthy snacks',
          'Wedding inspiration',
          'Tattoo ideas'
        ];
        const results = mockData.filter(item => 
            item.toLowerCase().includes(query.toLowerCase())
        );
        resolve(results);
      }, 800);
    });
  }
}
