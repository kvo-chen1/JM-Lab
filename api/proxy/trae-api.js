// api/proxy/trae-api.js - Vercel serverless function for Trae API proxy

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  try {
    // Extract the path from the URL
    const url = new URL(req.url, `http://localhost:3000`);
    console.log('Full URL:', url.href);
    console.log('Pathname:', url.pathname);

    const path = url.pathname.replace('/api/proxy/trae-api', '');
    console.log('Processed path:', path);

    // Normal handling for all endpoints including text_to_image
    console.log('Proceeding to forward request to Trae API');


    // For other endpoints, handle normally
    const queryString = url.search;
    const remoteUrl = `https://trae-api-sg.mchost.guru${path}${queryString}`;

    try {
      const response = await fetch(remoteUrl, {
        method: req.method,
        headers: {
          'Accept': 'application/json, image/*, text/html, */*',
          ...(req.method !== 'GET' && req.headers['content-type'] && {
            'Content-Type': req.headers['content-type']
          })
        },
        ...(req.method !== 'GET' && req.body && {
          body: req.body
        })
      });

      // Set the response status code and headers
      res.statusCode = response.status;

      // Copy response headers
      response.headers.forEach((value, name) => {
        res.setHeader(name, value);
      });

      // Return the response body
      const buffer = Buffer.from(await response.arrayBuffer());
      res.end(buffer);
    } catch (fetchError) {
      console.error('Trae API fetch error:', fetchError);

      // If fetch fails, return a default fallback image
      console.log('Fetch failed, returning fallback image');

      // Using a base64 encoded SVG as fallback image
      const fallbackImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iMTAwIiBmaWxsPSIjZmZmZmZmIi8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iNzAiIGZpbGw9IiM2NjY2NjYiLz4KPHN2ZyB4PSI3MCIgeT0iNzAiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0ibm9uZSI+CjxyZWN0IHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0id2hpdGUiLz4KPHJlY3QgeD0iODAiIHk9IjgwIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiNkY2RjZGMiLz4KPHJlY3QgeD0iOTAuNSIgeT0iOTEiIHdpZHRoPSIxOSIgaGVpZ2h0PSIxOCIgc3Ryb2tlPSIjNzc3Nzc3IiBzdHJva2Utb3BhY2l0eT0iMC41IiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+Cjwvc3ZnPg==';

      res.statusCode = 200;
      res.setHeader('Content-Type', 'image/svg+xml');
      res.end(Buffer.from(fallbackImage.split(',')[1], 'base64'));
    }
  } catch (error) {
    console.error('Trae API proxy error:', error);

    // Return a default fallback image in case of any error
    const defaultImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iMTAwIiBmaWxsPSIjZmZmZmZmIi8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iNzAiIGZpbGw9IiM2NjY2NjYiLz4KPHN2ZyB4PSI3MCIgeT0iNzAiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0ibm9uZSI+CjxyZWN0IHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0id2hpdGUiLz4KPHJlY3QgeD0iODAiIHk9IjgwIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiNkY2RjZGMiLz4KPHJlY3QgeD0iOTAuNSIgeT0iOTEiIHdpZHRoPSIxOSIgaGVpZ2h0PSIxOCIgc3Ryb2tlPSIjNzc3Nzc3IiBzdHJva2Utb3BhY2l0eT0iMC41IiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+Cjwvc3ZnPg==';

    res.statusCode = 200;
    res.setHeader('Content-Type', 'image/svg+xml');
    res.end(Buffer.from(defaultImage.split(',')[1], 'base64'));
  }
}
