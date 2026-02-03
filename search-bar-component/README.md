# Pinterest Search Bar Component

A pixel-perfect replica of the Pinterest search bar, implemented in vanilla JavaScript and SCSS.

## Features

- **Visual Fidelity:** Exact match of Pinterest's border radius, colors, shadows, and animations.
- **Interactivity:**
  - Focus states with specific border and shadow.
  - Clear button (×) appears when typing.
  - Keyboard shortcuts: `/` to focus, `Esc` to clear/blur.
  - Debounced search input (default 300ms).
- **Accessibility:** Fully accessible with `aria-label`, `aria-live` regions, and keyboard support.
- **Zero Dependencies:** Pure Vanilla JS and CSS/SCSS.

## Usage

1. **Include Styles:**
   Link the CSS file in your HTML head.
   ```html
   <link rel="stylesheet" href="search-bar.css">
   ```

2. **Include Script:**
   Import the module in your script.
   ```javascript
   import { PinterestSearchBar } from './search-bar.js';
   ```

3. **Initialize:**
   Create a container and instantiate the class.
   ```html
   <div id="my-search-container"></div>
   ```

   ```javascript
   const search = new PinterestSearchBar('my-search-container', {
       placeholder: 'Search...',
       onSearch: async (query) => {
           // Your search logic here
           return ['Result 1', 'Result 2'];
       }
   });
   ```

## API

### `new PinterestSearchBar(containerId, options)`

- **containerId** (string): The ID of the DOM element to mount the search bar into.
- **options** (object):
  - `placeholder` (string): Input placeholder text. Default: `'Search'`.
  - `debounceTime` (number): Debounce delay in ms. Default: `300`.
  - `onSearch` (function): Async function called with the search query. Should return a Promise resolving to an array of strings.

## Customization

You can override the CSS variables in your own stylesheet to match your theme.

```css
:root {
  --pb-height: 50px;
  --pb-border-radius: 25px;
  --pb-focus-border: #007bff; /* Blue focus */
}
```

## Development

- **Styles:** Edit `search-bar.scss` and compile to CSS.
- **Tests:** Run with Jest (requires setup).
  ```bash
  npm test
  ```

## Deliverables

- `search-bar.js`: Main logic.
- `search-bar.scss`: Styles.
- `demo.html`: Live demo.
- `search-bar.test.js`: Unit tests.
