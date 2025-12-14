# TaskMgr Backend API

A RESTful API server with real-time updates for task management. Built with Node.js, Express, TypeScript, MongoDB, and Socket.IO.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Testing](#testing)
- [API Documentation](#api-documentation)
- [Socket.IO Events](#socketio-events)
- [Authentication](#authentication)
- [Error Handling](#error-handling)

## Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **Real-time**: Socket.IO
- **Validation**: express-validator
- **Security**: bcrypt, helmet
- **Testing**: Jest, Supertest, fast-check (property-based testing)

## Project Structure

```
TaskMgr_Backend/
├── src/
│   ├── config/              # Database and environment configuration
│   │   ├── database.ts      # MongoDB connection setup
│   │   ├── env.ts           # Environment variable validation
│   │   └── index.ts         # Config exports
│   ├── models/              # Mongoose schemas and models
│   │   ├── User.ts          # User model
│   │   ├── Task.ts          # Task model
│   │   └── Notification.ts  # Notification model
│   ├── controllers/         # Request/response handling
│   │   ├── authController.ts
│   │   ├── taskController.ts
│   │   ├── notificationController.ts
│   │   └── userController.ts
│   ├── services/            # Business logic layer
│   │   ├── authService.ts
│   │   ├── taskService.ts
│   │   ├── notificationService.ts
│   │   ├── userService.ts
│   │   └── socketService.ts
│   ├── routes/              # API route definitions
│   │   ├── authRoutes.ts
│   │   ├── taskRoutes.ts
│   │   ├── notificationRoutes.ts
│   │   └── userRoutes.ts
│   ├── middleware/          # Express middleware
│   │   ├── auth.ts          # JWT authentication
│   │   ├── validation.ts    # Request validation
│   │   ├── errorHandler.ts  # Global error handler
│   │   └── errors.ts        # Custom error classes
│   ├── utils/               # Helper functions
│   │   ├── jwt.ts           # JWT utilities
│   │   ├── password.ts      # Password hashing
│   │   └── testHelpers.ts   # Test utilities
│   ├── socket/              # Socket.IO configuration
│   │   └── index.ts         # Socket.IO setup and auth
│   ├── types/               # TypeScript type definitions
│   │   └── express.d.ts     # Express type extensions
│   ├── scripts/             # Utility scripts
│   │   └── seed.ts          # Database seeding
│   ├── app.ts               # Express app configuration
│   └── server.ts            # Application entry point
├── .env.example             # Example environment variables
├── .gitignore
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

## Setup Instructions

### Prerequisites

- **Node.js** v18 or higher
- **MongoDB** instance (local or cloud like MongoDB Atlas)
- **npm** or **yarn** package manager

### Installation

1. **Clone the repository** (if not already done)

2. **Navigate to the backend directory:**
   ```bash
   cd TaskMgr_Backend
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

5. **Configure environment variables** (see [Environment Variables](#environment-variables) section)

6. **Start MongoDB** (if running locally):
   ```bash
   # Using MongoDB service
   mongod
   
   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `development` | Yes |
| `PORT` | Server port | `3000` | Yes |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/taskmgr` | Yes |
| `JWT_SECRET` | Secret key for JWT signing | - | Yes |
| `JWT_EXPIRES_IN` | JWT token expiration time | `24h` | Yes |
| `CORS_ORIGIN` | Allowed CORS origin for API | `http://localhost:5173` | Yes |
| `BCRYPT_SALT_ROUNDS` | Salt rounds for password hashing | `10` | Yes |
| `SOCKET_IO_CORS_ORIGIN` | Allowed CORS origin for Socket.IO | `http://localhost:5173` | Yes |

**Example `.env` file:**
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/taskmgr
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:5173
BCRYPT_SALT_ROUNDS=10
SOCKET_IO_CORS_ORIGIN=http://localhost:5173
```

**⚠️ Security Note:** Never commit your `.env` file to version control. Always use a strong, randomly generated `JWT_SECRET` in production.

## Development

### Running the Application

**Development mode with hot reload:**
```bash
npm run dev
```
The server will start on `http://localhost:3000` (or your configured PORT).

**Production build:**
```bash
npm run build
npm start
```

### Database Seeding

Populate the database with sample data for development and testing:

```bash
npm run seed
```

This creates:
- **5 sample users** (including 1 admin)
- **15 sample tasks** with various statuses and priorities
- **Sample notifications** for each user

Sample login credentials will be displayed in the console after seeding completes.

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run seed` - Seed database with sample data

## Testing

The project uses **Jest** for unit testing and **fast-check** for property-based testing.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test API endpoints end-to-end
- **Property-Based Tests**: Verify universal properties across all inputs

### Test Coverage

The project aims for 80%+ code coverage across all modules.

## API Documentation

Base URL: `http://localhost:3000/api`

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "USER",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": { /* user object */ },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400
  }
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": { /* user object */ }
}
```

#### Change Password
```http
PUT /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Task Endpoints

#### Create Task
```http
POST /api/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Complete project documentation",
  "description": "Write comprehensive README and API docs",
  "dueDate": "2024-12-31T23:59:59.000Z",
  "priority": "HIGH",
  "status": "TODO",
  "assignedToId": "507f1f77bcf86cd799439011"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "title": "Complete project documentation",
    "description": "Write comprehensive README and API docs",
    "dueDate": "2024-12-31T23:59:59.000Z",
    "priority": "HIGH",
    "status": "TODO",
    "creatorId": "507f1f77bcf86cd799439010",
    "assignedToId": "507f1f77bcf86cd799439011",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Get All Tasks
```http
GET /api/tasks?page=1&limit=10&status=TODO&priority=HIGH&search=documentation
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `status` (optional): Filter by status (TODO, IN_PROGRESS, REVIEW, COMPLETED)
- `priority` (optional): Filter by priority (LOW, MEDIUM, HIGH, URGENT)
- `search` (optional): Search in title and description

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [ /* array of tasks */ ],
    "total": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

#### Get Task by ID
```http
GET /api/tasks/:id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": { /* task object */ }
}
```

#### Update Task
```http
PUT /api/tasks/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "IN_PROGRESS",
  "priority": "URGENT"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { /* updated task object */ }
}
```

#### Delete Task
```http
DELETE /api/tasks/:id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

#### Get Assigned Tasks
```http
GET /api/tasks/assigned
Authorization: Bearer <token>
```

Returns all tasks assigned to the current user, ordered by priority and due date.

**Response (200):**
```json
{
  "success": true,
  "data": [ /* array of tasks with creator info */ ]
}
```

#### Get Created Tasks
```http
GET /api/tasks/created
Authorization: Bearer <token>
```

Returns all tasks created by the current user.

**Response (200):**
```json
{
  "success": true,
  "data": [ /* array of tasks with assignee info */ ]
}
```

#### Get Overdue Tasks
```http
GET /api/tasks/overdue
Authorization: Bearer <token>
```

Returns all overdue tasks (past due date, not completed) for the current user.

**Response (200):**
```json
{
  "success": true,
  "data": [ /* array of overdue tasks */ ]
}
```

### Notification Endpoints

#### Get Notifications
```http
GET /api/notifications
Authorization: Bearer <token>
```

Returns all notifications for the current user, ordered by creation date (newest first).

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439013",
      "userId": "507f1f77bcf86cd799439011",
      "type": "TASK_ASSIGNED",
      "title": "New Task Assigned",
      "message": "You have been assigned to: Complete project documentation",
      "read": false,
      "resourceId": "507f1f77bcf86cd799439012",
      "resourceType": "TASK",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### Mark Notification as Read
```http
PUT /api/notifications/:id/read
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": { /* updated notification */ }
}
```

#### Mark All Notifications as Read
```http
PUT /api/notifications/read-all
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

#### Delete Notification
```http
DELETE /api/notifications/:id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

### User Profile Endpoints

#### Get User Profile
```http
GET /api/users/profile
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "USER",
    "avatarUrl": "https://example.com/avatar.jpg",
    "bio": "Software developer",
    "phoneNumber": "+1234567890",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Update User Profile
```http
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "bio": "Senior Software Developer",
  "phoneNumber": "+1234567890",
  "avatarUrl": "https://example.com/new-avatar.jpg"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { /* updated user profile */ }
}
```

## Socket.IO Events

The backend uses Socket.IO for real-time bidirectional communication.

### Connection

**Client connects with JWT authentication:**
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Server-Emitted Events

#### `task:created`
Emitted when a new task is created.

**Payload:**
```json
{
  "id": "507f1f77bcf86cd799439012",
  "title": "New Task",
  "description": "Task description",
  "priority": "MEDIUM",
  "status": "TODO",
  "creatorId": "507f1f77bcf86cd799439010",
  "assignedToId": "507f1f77bcf86cd799439011",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### `task:updated`
Emitted when a task is updated.

**Payload:**
```json
{
  "id": "507f1f77bcf86cd799439012",
  "title": "Updated Task",
  /* ... other task fields ... */
  "updatedAt": "2024-01-01T01:00:00.000Z"
}
```

#### `task:deleted`
Emitted when a task is deleted.

**Payload:**
```json
{
  "taskId": "507f1f77bcf86cd799439012"
}
```

#### `notification:new`
Emitted to a specific user when they receive a new notification.

**Payload:**
```json
{
  "id": "507f1f77bcf86cd799439013",
  "userId": "507f1f77bcf86cd799439011",
  "type": "TASK_ASSIGNED",
  "title": "New Task Assigned",
  "message": "You have been assigned to: Complete project documentation",
  "read": false,
  "resourceId": "507f1f77bcf86cd799439012",
  "resourceType": "TASK",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Client Event Listeners

```javascript
// Listen for task events
socket.on('task:created', (task) => {
  console.log('New task created:', task);
});

socket.on('task:updated', (task) => {
  console.log('Task updated:', task);
});

socket.on('task:deleted', ({ taskId }) => {
  console.log('Task deleted:', taskId);
});

// Listen for notifications (user-specific)
socket.on('notification:new', (notification) => {
  console.log('New notification:', notification);
});

// Handle connection events
socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});
```

## Authentication

The API uses **JWT (JSON Web Tokens)** for authentication.

### How It Works

1. **Register or Login**: Client receives a JWT token
2. **Store Token**: Client stores token securely (e.g., localStorage, httpOnly cookie)
3. **Include Token**: Client includes token in Authorization header for protected routes
4. **Token Verification**: Server verifies token on each request

### Authorization Header Format

```
Authorization: Bearer <your-jwt-token>
```

### Token Expiration

Tokens expire after the time specified in `JWT_EXPIRES_IN` (default: 24 hours). Clients should handle token expiration by:
- Detecting 401 Unauthorized responses
- Redirecting to login page
- Implementing token refresh mechanism (if needed)

### Socket.IO Authentication

Socket.IO connections also require JWT authentication:

```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

Invalid or missing tokens will result in connection rejection.

## Error Handling

All API errors follow a consistent format:

### Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "status": 400,
  "errors": {
    "fieldName": ["Error message 1", "Error message 2"]
  }
}
```

### HTTP Status Codes

| Code | Description | Example |
|------|-------------|---------|
| `200` | Success | Request completed successfully |
| `201` | Created | Resource created successfully |
| `400` | Bad Request | Validation errors, invalid input |
| `401` | Unauthorized | Missing or invalid authentication token |
| `403` | Forbidden | Insufficient permissions |
| `404` | Not Found | Resource doesn't exist |
| `500` | Internal Server Error | Unexpected server error |

### Common Error Scenarios

#### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "status": 400,
  "errors": {
    "email": ["Email is required", "Email must be valid"],
    "password": ["Password must be at least 8 characters"]
  }
}
```

#### Authentication Error (401)
```json
{
  "success": false,
  "message": "Invalid or expired token",
  "status": 401
}
```

#### Authorization Error (403)
```json
{
  "success": false,
  "message": "You do not have permission to access this resource",
  "status": 403
}
```

#### Not Found Error (404)
```json
{
  "success": false,
  "message": "Task not found",
  "status": 404
}
```

## Data Models

### User
- `id`: string (MongoDB ObjectId)
- `email`: string (unique, required)
- `password`: string (hashed, required)
- `firstName`: string (required)
- `lastName`: string (required)
- `role`: "USER" | "ADMIN" (default: "USER")
- `avatarUrl`: string (optional)
- `bio`: string (optional)
- `phoneNumber`: string (optional)
- `createdAt`: Date
- `updatedAt`: Date

### Task
- `id`: string (MongoDB ObjectId)
- `title`: string (required)
- `description`: string (optional)
- `dueDate`: Date (optional)
- `priority`: "LOW" | "MEDIUM" | "HIGH" | "URGENT" (default: "MEDIUM")
- `status`: "TODO" | "IN_PROGRESS" | "REVIEW" | "COMPLETED" (default: "TODO")
- `creatorId`: string (required, ref: User)
- `assignedToId`: string (optional, ref: User)
- `createdAt`: Date
- `updatedAt`: Date

### Notification
- `id`: string (MongoDB ObjectId)
- `userId`: string (required, ref: User)
- `type`: "TASK_ASSIGNED" | "TASK_UPDATED" | "DEADLINE_APPROACHING" | "MENTION"
- `title`: string (required)
- `message`: string (required)
- `read`: boolean (default: false)
- `resourceId`: string (optional)
- `resourceType`: "TASK" | "COMMENT" (optional)
- `createdAt`: Date

## Security Best Practices

1. **Environment Variables**: Never commit `.env` files to version control
2. **JWT Secret**: Use a strong, randomly generated secret in production
3. **Password Hashing**: Passwords are hashed using bcrypt with 10 salt rounds
4. **CORS**: Configure allowed origins appropriately for your environment
5. **Helmet**: Security headers are automatically added via helmet middleware
6. **Input Validation**: All inputs are validated using express-validator
7. **MongoDB Injection**: Protected by Mongoose's built-in sanitization
8. **Rate Limiting**: Consider implementing rate limiting for production

## Contributing

1. Follow the existing code structure and conventions
2. Write tests for new features
3. Ensure all tests pass before submitting
4. Update documentation as needed

## License

ISC
