const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());

// Helper function to generate random URLs
function generateRandomUrl() {
  const domains = ['api.example.com', 'service.test.com', 'data.prod.com', 'auth.dev.com'];
  const paths = ['/users', '/orders', '/products', '/auth', '/payments', '/notifications'];
  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
  
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const path = paths[Math.floor(Math.random() * paths.length)];
  const method = methods[Math.floor(Math.random() * methods.length)];
  
  const url = `${method} https://${domain}${path}`;
  console.log(`[URL Generator] Generated URL: ${url}`);
  return url;
}

// Helper function to generate random headers
function generateRandomHeaders() {
  const headerNames = ['Content-Type', 'Authorization', 'Accept', 'User-Agent', 'X-Request-ID'];
  const headerValues = {
    'Content-Type': ['application/json', 'application/xml', 'text/plain', 'multipart/form-data'],
    'Authorization': ['Bearer token123', 'Basic auth456', 'OAuth2 token789'],
    'Accept': ['application/json', 'application/xml', 'text/plain'],
    'User-Agent': ['Mozilla/5.0', 'PostmanRuntime/7.32.3', 'curl/7.74.0'],
    'X-Request-ID': ['req-123', 'req-456', 'req-789']
  };

  const headers = {};
  const numHeaders = Math.floor(Math.random() * 3) + 2; // 2-4 headers

  for (let i = 0; i < numHeaders; i++) {
    const name = headerNames[Math.floor(Math.random() * headerNames.length)];
    headers[name] = headerValues[name][Math.floor(Math.random() * headerValues[name].length)];
  }

  return headers;
}

// Helper function to generate random JSON body
function generateRandomBody() {
  const bodyTypes = [
    { type: 'user', fields: ['id', 'name', 'email', 'role'] },
    { type: 'order', fields: ['orderId', 'items', 'total', 'status'] },
    { type: 'product', fields: ['productId', 'name', 'price', 'category'] },
    { type: 'payment', fields: ['transactionId', 'amount', 'currency', 'status'] }
  ];

  const type = bodyTypes[Math.floor(Math.random() * bodyTypes.length)];
  const body = {};

  type.fields.forEach(field => {
    switch (field) {
      case 'id':
      case 'orderId':
      case 'productId':
      case 'transactionId':
        body[field] = Math.floor(Math.random() * 1000);
        break;
      case 'name':
        body[field] = `Random ${type.type} ${Math.floor(Math.random() * 100)}`;
        break;
      case 'email':
        body[field] = `user${Math.floor(Math.random() * 100)}@example.com`;
        break;
      case 'role':
        body[field] = ['admin', 'user', 'guest'][Math.floor(Math.random() * 3)];
        break;
      case 'items':
        body[field] = Array(Math.floor(Math.random() * 3) + 1).fill().map(() => ({
          id: Math.floor(Math.random() * 100),
          quantity: Math.floor(Math.random() * 5) + 1
        }));
        break;
      case 'total':
      case 'amount':
        body[field] = Math.floor(Math.random() * 1000);
        break;
      case 'status':
        body[field] = ['pending', 'completed', 'failed'][Math.floor(Math.random() * 3)];
        break;
      case 'price':
        body[field] = (Math.random() * 1000).toFixed(2);
        break;
      case 'category':
        body[field] = ['electronics', 'clothing', 'books', 'food'][Math.floor(Math.random() * 4)];
        break;
      case 'currency':
        body[field] = ['USD', 'EUR', 'GBP'][Math.floor(Math.random() * 3)];
        break;
    }
  });

  return body;
}

// Generate random status codes (mostly 200s with some errors)
function generateRandomStatusCode() {
  const statusCodes = [200, 201, 400, 401, 403, 404, 500];
  return statusCodes[Math.floor(Math.random() * statusCodes.length)];
}

app.get('/api/sse', (req, res) => {
  console.log(`[SSE] New client connected from ${req.ip}`);
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send initial message
  const initialMessage = {
    url: generateRandomUrl(),
    status_code: 200,
    proxy: Math.random() > 0.5,
    request: {
      headers: generateRandomHeaders(),
      body: generateRandomBody()
    },
    response: {
      headers: generateRandomHeaders(),
      body: generateRandomBody()
    }
  };
  console.log(`[SSE] Sending initial message to client ${req.ip}`);
  res.write(`data: ${JSON.stringify(initialMessage)}\n\n`);

  // Send messages every second
  const intervalId = setInterval(() => {
    const message = {
      url: generateRandomUrl(),
      status_code: generateRandomStatusCode(),
      proxy: Math.random() > 0.5,
      request: {
        headers: generateRandomHeaders(),
        body: generateRandomBody()
      },
      response: {
        headers: generateRandomHeaders(),
        body: generateRandomBody()
      }
    };
    console.log(`[SSE] Sending message to client ${req.ip} with status code: ${message.status_code}`);
    res.write(`data: ${JSON.stringify(message)}\n\n`);
  }, 1000);

  // Clean up on client disconnect
  req.on('close', () => {
    console.log(`[SSE] Client disconnected: ${req.ip}`);
    clearInterval(intervalId);
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[Server] SSE Server running on port ${PORT}`);
  console.log(`[Server] Access the SSE endpoint at http://localhost:${PORT}/api/sse`);
}); 