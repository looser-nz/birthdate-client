const http = require('http');
const fs   = require('fs');
const path = require('path');
const url  = require('url');

const PORT    = 3001;
const BACKEND = 'http://whatismattsbirthday.com';

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);

  // Proxy /exec/sql and /exec/submit → backend
  if (parsed.pathname === '/exec/sql' || parsed.pathname === '/exec/submit') {
    const target = url.parse(BACKEND);
    const options = {
      hostname: target.hostname,
      port:     target.port || 80,
      path:     req.url,        // preserves the full query string
      method:   req.method,
      headers:  { ...req.headers, host: target.host },
    };

    const proxy = http.request(options, (backendRes) => {
      res.writeHead(backendRes.statusCode, {
        'Content-Type': backendRes.headers['content-type'] || 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      backendRes.pipe(res);
    });

    proxy.on('error', (err) => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Proxy error: ${err.message}` }));
    });

    if (req.method === 'GET' || req.method === 'HEAD') {
      proxy.end();
    } else {
      req.pipe(proxy);
    }
    return;
  }

  // Serve static files
  const mimeTypes = {
    '.html': 'text/html',
    '.css':  'text/css',
    '.js':   'application/javascript',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.svg':  'image/svg+xml',
    '.ico':  'image/x-icon',
  };

  const reqPath   = parsed.pathname === '/' ? '/index.html' : parsed.pathname;
  const filePath  = path.join(__dirname, reqPath);
  const ext       = path.extname(filePath);
  const mimeType  = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Client running at http://localhost:${PORT}`);
  console.log(`Proxying /exec/sql and /exec/submit → ${BACKEND}`);
});
