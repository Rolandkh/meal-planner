/**
 * Simple mock API server for local development
 * Run with: node api-mock.js
 */

const http = require('http');

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/api/chat-with-vanessa' && req.method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      const { message } = JSON.parse(body);
      console.log('Received message:', message);

      // Set up SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      // Mock streaming response
      const mockResponse = `Hi! I'm Vanessa, your AI meal planning assistant. You said: "${message}". This is a mock response for local testing. Deploy to Vercel to get real AI responses!`;
      
      // Stream the response word by word
      const words = mockResponse.split(' ');
      let index = 0;

      const interval = setInterval(() => {
        if (index < words.length) {
          const data = JSON.stringify({
            type: 'token',
            content: words[index] + ' ',
          });
          res.write(`data: ${data}\n\n`);
          index++;
        } else {
          clearInterval(interval);
          res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
          res.end();
        }
      }, 50); // Simulate streaming delay
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(3001, () => {
  console.log('Mock API server running on http://localhost:3001');
  console.log('Update ChatWidget.js fetch URL to http://localhost:3001/api/chat-with-vanessa');
});
