# Testing and Debugging Documentation

## Overview

This document provides comprehensive documentation for the testing and debugging implementation in the MERN stack application. The project includes unit tests, integration tests, and end-to-end tests with proper error handling and debugging techniques.

## Testing Strategy

### 1. Unit Testing
- **Framework**: Jest
- **Coverage**: React Testing Library for React components
- **Location**: `client/src/tests/unit/` and `server/tests/unit/`

### 2. Integration Testing
- **Framework**: Jest + Supertest
- **Coverage**: API endpoints and database operations
- **Location**: `server/tests/integration/`

### 3. End-to-End Testing
- **Framework**: Cypress
- **Coverage**: Complete user workflows
- **Location**: `cypress/e2e/`

## Test Coverage Requirements

- **Unit Tests**: 70% minimum coverage
- **Integration Tests**: All API endpoints
- **E2E Tests**: Critical user flows

## Running Tests

### Prerequisites
```bash
# Install dependencies
npm run install-all

# Start MongoDB (local or Atlas)
# Ensure MongoDB is running on localhost:27017 or set MONGODB_URI
```

### Server Tests
```bash
# Run all server tests
cd server
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run with coverage
npm run test:coverage
```

### Client Tests
```bash
# Run all client tests
cd client
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration
```

### End-to-End Tests
```bash
# Start the application first
npm run dev

# In another terminal, run Cypress
npx cypress open

# Or run headless
npx cypress run
```

### All Tests
```bash
# From root directory
npm test
```

## Test Structure

### Server-Side Tests

#### Unit Tests (`server/tests/unit/`)
- **User.test.js**: Tests for User model validation, methods, and error handling
- **Task.test.js**: Tests for Task model validation, methods, and error handling

#### Integration Tests (`server/tests/integration/`)
- **userRoutes.test.js**: API endpoint tests for user CRUD operations
- **taskRoutes.test.js**: API endpoint tests for task CRUD operations

### Client-Side Tests

#### Unit Tests (`client/src/tests/unit/`)
- **Header.test.jsx**: Navigation component tests
- **ErrorFallback.test.jsx**: Error boundary component tests

#### Integration Tests (`client/src/tests/integration/`)
- **UserForm.test.jsx**: Form validation and API interaction tests

### End-to-End Tests (`cypress/e2e/`)
- **navigation.cy.js**: Basic app navigation and functionality
- **user-management.cy.js**: Complete user management workflows
- **task-management.cy.js**: Complete task management workflows

## Debugging Techniques Implemented

### 1. Server-Side Debugging

#### Error Handling Middleware
```javascript
// server/src/middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  // Comprehensive error logging
  console.error('🔴 Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    user: req.user ? req.user.id : 'unauthenticated',
    timestamp: new Date().toISOString()
  });
  
  // Error type handling
  if (err.name === 'CastError') {
    // Handle invalid ObjectId
  }
  if (err.code === 11000) {
    // Handle duplicate key errors
  }
  // ... more error types
};
```

#### Logging Strategy
- **Morgan**: HTTP request logging
- **Custom logging**: Detailed error information
- **Environment-based**: Different log levels for dev/prod

#### Database Connection Monitoring
```javascript
// server/src/config/database.js
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB reconnected');
});
```

### 2. Client-Side Debugging

#### Error Boundaries
```javascript
// client/src/components/ErrorFallback.jsx
const ErrorFallback = ({ error, resetErrorBoundary }) => {
  return (
    <div className="error-fallback">
      <h2>Something went wrong!</h2>
      <details>
        <summary>Error Details</summary>
        <pre>{error.message}</pre>
      </details>
      <button onClick={resetErrorBoundary}>Try Again</button>
    </div>
  );
};
```

#### Global Error Handling
```javascript
// client/src/App.jsx
const handleError = (error, errorInfo) => {
  console.error('App Error:', error, errorInfo);
  // In production, send to error reporting service
};
```

#### Form Validation and Error Display
- Real-time validation feedback
- Clear error messages
- Loading states during API calls

## Test Data Management

### Database Setup
```javascript
// server/tests/setup.js
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

afterEach(async () => {
  // Clear all collections between tests
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
});
```

### Cypress Commands
```javascript
// cypress/support/commands.js
Cypress.Commands.add('createTestUser', (userData = {}) => {
  // Create test user via API
});

Cypress.Commands.add('createTestTask', (taskData = {}) => {
  // Create test task via API
});

Cypress.Commands.add('clearTestData', () => {
  // Clean up test data
});
```

## Performance Monitoring

### Server Performance
- Request timing with Morgan
- Database query monitoring
- Memory usage tracking

### Client Performance
- Component render timing
- API call performance
- Bundle size monitoring

## Security Testing

### Input Validation
- SQL injection prevention
- XSS protection
- Input sanitization

### Authentication Testing
- Password validation
- Role-based access control
- Session management

## Continuous Integration

### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm run install-all
      - run: npm test
      - run: npm run test:coverage
```

## Coverage Reports

### Generating Reports
```bash
# Server coverage
cd server && npm run test:coverage

# Client coverage
cd client && npm test -- --coverage --watchAll=false
```

### Coverage Thresholds
```javascript
// jest.config.js
coverageThreshold: {
  global: {
    statements: 70,
    branches: 60,
    functions: 70,
    lines: 70,
  },
}
```

## Best Practices Implemented

### 1. Test Organization
- Clear separation of unit, integration, and E2E tests
- Descriptive test names
- Proper setup and teardown

### 2. Mocking Strategy
- API mocking for isolated testing
- Database mocking with MongoDB Memory Server
- Component mocking for React tests

### 3. Error Handling
- Comprehensive error boundaries
- Graceful degradation
- User-friendly error messages

### 4. Performance
- Efficient test execution
- Minimal test data
- Proper cleanup

## Troubleshooting

### Common Issues

#### MongoDB Connection
```bash
# Check if MongoDB is running
mongosh --eval "db.runCommand('ping')"

# Set connection string
export MONGODB_URI="mongodb://localhost:27017/mern-testing"
```

#### Port Conflicts
```bash
# Check if ports are in use
lsof -i :3000  # React dev server
lsof -i :5000  # Express server
lsof -i :27017 # MongoDB
```

#### Test Failures
```bash
# Clear Jest cache
npx jest --clearCache

# Reset Cypress
npx cypress cache clear
```

## Future Improvements

### 1. Additional Test Types
- Visual regression tests
- Performance tests
- Security tests

### 2. Enhanced Debugging
- Real-time debugging tools
- Performance profiling
- Memory leak detection

### 3. Test Automation
- Automated test execution
- Parallel test execution
- Test result reporting

## Conclusion

This testing implementation provides comprehensive coverage of the MERN stack application with proper error handling and debugging techniques. The combination of unit, integration, and end-to-end tests ensures application reliability and maintainability.

For questions or issues, please refer to the test files or contact the development team. 