# API Request Monitor - SSE Demo

A real-time API request monitoring system built with Server-Sent Events (SSE) that simulates and displays live API request/response data.

## Overview

This project demonstrates the implementation of Server-Sent Events (SSE) to stream real-time API request and response data. It simulates various API endpoints, generating random but realistic HTTP requests and responses to showcase how SSE can be used for real-time monitoring.

## Features

- Real-time streaming of API request/response data
- Simulated HTTP requests with random:
  - URLs and endpoints
  - HTTP methods (GET, POST, PUT, DELETE, PATCH)
  - Request/Response headers
  - Request/Response bodies
  - Status codes
- CORS enabled for cross-origin requests
- Clean connection handling and cleanup

## Technical Stack

- Node.js
- Express.js
- Server-Sent Events (SSE)
- CORS middleware

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd demo-sse
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

1. Start the server:
```bash
npm start
```

2. The server will start on port 3000 (or the port specified in the PORT environment variable)

3. Access the SSE endpoint at: `http://localhost:3000/api/sse`

## API Endpoints

### GET /api/sse
The main SSE endpoint that streams simulated API request/response data.

#### Response Format
```typescript
{
  url: string;              // Randomly generated API URL
  status_code: number;      // HTTP status code
  proxy: boolean;          // Whether the request was proxied
  request: {
    headers: object;       // Random request headers
    body: object;         // Random request body
  },
  response: {
    headers: object;      // Random response headers
    body: object;        // Random response body
  }
}
```

## Data Generation

The application generates random but realistic data for:

- URLs (domains and paths)
- HTTP methods
- Headers (Content-Type, Authorization, etc.)
- Request/Response bodies (users, orders, products, payments)
- Status codes (200, 201, 400, 401, 403, 404, 500)

## Development

The project structure is organized as follows:

```
demo-sse/
├── server.js           # Main server implementation
├── package.json        # Project dependencies and scripts
└── README.md          # Project documentation
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 