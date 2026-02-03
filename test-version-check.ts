// This test should be run in a browser environment
// Create a test HTML file to verify version checking
import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Version Check Test</title>
</head>
<body>
  <h1>Version Check Test</h1>
  <div id="output"></div>
  
  <script type="module">
    import productService from './src/services/productService.js';
    
    const output = document.getElementById('output');
    
    // Simulate old version data
    localStorage.setItem('SECURE_PRODUCTS_VERSION', '1');
    localStorage.setItem('SECURE_PRODUCTS', JSON.stringify([{ id: 1, name: 'Old Product' }]));
    
    // Create new instance of product service
    const service = productService;
    
    // Check if version was updated
    const newVersion = localStorage.getItem('SECURE_PRODUCTS_VERSION');
    const products = JSON.parse(localStorage.getItem('SECURE_PRODUCTS') || '[]');
    
    let result = '<h2>Test Results:</h2>';
    result += `<p>Current version: ${newVersion}</p>`;
    result += `<p>Number of products: ${products.length}</p>`;
    
    // Test that version checking works correctly
    if (newVersion === '2' && products.length > 1) {
      result += '<p style="color: green;">✓ Version checking works correctly</p>';
    } else {
      result += '<p style="color: red;">✗ Version checking failed</p>';
    }
    
    output.innerHTML = result;
  </script>
</body>
</html>
`;

fs.writeFileSync('test-version-check.html', htmlContent);
console.log('Created test file: test-version-check.html');
console.log('Open this file in a browser to test version checking functionality.');