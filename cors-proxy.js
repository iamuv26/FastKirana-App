const http = require('http');
const https = require('https');
const url = require('url');

const PROXY_PORT = 3999;
const TARGET = 'https://www.fastkirana.in';

const server = http.createServer((req, res) => {
  console.log(`[Proxy] ${req.method} ${req.url}`);
  
  // CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, x-user-id, x-user-role, x-user-email, x-user-name');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': req.headers['access-control-request-headers'] || '*',
      'Access-Control-Max-Age': '86400'
    });
    res.end();
    return;
  }


  const targetUrl = `${TARGET}${req.url}`;
  const parsed = url.parse(targetUrl);

  const options = {
    hostname: parsed.hostname,
    port: 443,
    path: parsed.path,
    method: req.method,
    headers: {
      ...req.headers,
      host: parsed.hostname,
    },
  };

  // Remove localhost-specific headers
  delete options.headers['origin'];
  delete options.headers['referer'];

  const proxyReq = https.request(options, (proxyRes) => {
    // Copy status and headers, add CORS
    const headers = { ...proxyRes.headers };
    
    // Remove existing CORS headers to avoid duplicates
    delete headers['access-control-allow-origin'];
    delete headers['access-control-allow-methods'];
    delete headers['access-control-allow-headers'];
    delete headers['access-control-allow-credentials'];
    
    // Set clean CORS headers
    headers['Access-Control-Allow-Origin'] = '*';
    headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';
    headers['Access-Control-Allow-Headers'] = req.headers['access-control-request-headers'] || '*';
    
    res.writeHead(proxyRes.statusCode, headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err.message);
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ error: 'Proxy error', message: err.message }));
    } else {
      res.end();
    }
  });

  req.pipe(proxyReq);
});

server.listen(PROXY_PORT, () => {
  console.log(`\n🚀 CORS Proxy running at http://localhost:${PROXY_PORT}`);
  console.log(`   Proxying to: ${TARGET}`);
  console.log(`   Example: http://localhost:${PROXY_PORT}/api/products\n`);
});
