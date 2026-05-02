# Project 07: REST API

A Node.js REST API built with Express demonstrating backend fundamentals including CRUD operations, middleware patterns, and authentication.

## Skills

- Express framework
- REST principles
- Middleware patterns
- Error handling
- Input validation
- JWT authentication

## Setup

```bash
npm install
npm start
```

The server will start on `http://localhost:3000`.

## API Endpoints

| Method | Endpoint     | Description       |
|--------|--------------|-------------------|
| GET    | /api/items   | Get all items     |
| GET    | /api/items/:id | Get item by ID  |
| POST   | /api/items   | Create new item   |
| PUT    | /api/items/:id | Update item     |
| DELETE | /api/items/:id | Delete item     |

## Checklist

- [ ] CRUD endpoints working
- [ ] Input validation middleware
- [ ] Centralized error handling middleware
- [ ] Authentication with JWT
- [ ] Pagination support
