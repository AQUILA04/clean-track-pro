const http = require('http');

const PORT = 8090;

const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/print-order') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            console.log('--- PRINT ORDER RECEIVED ---');
            try {
                const parsed = JSON.parse(body);
                console.log(JSON.stringify(parsed, null, 2));
            } catch (e) {
                console.log('Invalid JSON:', body);
            }
            console.log('------------------------------');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok' }));
        });
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`Mock Print Proxy listening on http://localhost:${PORT}`);
});
