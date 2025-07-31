describe('User Management', () => {
  beforeEach(() => {
    cy.clearTestData();
    cy.visit('/users');
  });

  afterEach(() => {
    cy.clearTestData();
  });

  it('should display users list page', () => {
    cy.get('h2').should('contain', 'Users');
    cy.get('a').should('contain', 'Add New User');
  });

  it('should show empty state when no users exist', () => {
    cy.get('p').should('contain', 'No users found');
    cy.get('a').should('contain', 'Create First User');
  });

  it('should navigate to create user form', () => {
    cy.get('a').contains('Add New User').click();
    cy.url().should('include', '/users/new');
    cy.get('h2').should('contain', 'Add New User');
  });

  it('should create a new user successfully', () => {
    // Navigate to create user form
    cy.get('a').contains('Add New User').click();
    
    // Fill the form
    cy.fillUserForm({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'user'
    });
    
    // Submit the form
    cy.get('button[type="submit"]').click();
    
    // Should redirect to users list
    cy.url().should('eq', Cypress.config().baseUrl + '/users');
    
    // Should display the new user
    cy.get('table').should('contain', 'John Doe');
    cy.get('table').should('contain', 'john@example.com');
  });

  it('should validate required fields when creating user', () => {
    cy.get('a').contains('Add New User').click();
    
    // Try to submit empty form
    cy.get('button[type="submit"]').click();
    
    // Should show validation errors
    cy.get('.error-message').should('contain', 'Name is required');
    cy.get('.error-message').should('contain', 'Email is required');
    cy.get('.error-message').should('contain', 'Password is required');
  });

  it('should validate email format', () => {
    cy.get('a').contains('Add New User').click();
    
    cy.get('input[name="name"]').type('Test User');
    cy.get('input[name="email"]').type('invalid-email');
    cy.get('input[name="password"]').type('password123');
    
    cy.get('button[type="submit"]').click();
    
    cy.get('.error-message').should('contain', 'Please enter a valid email address');
  });

  it('should validate password length', () => {
    cy.get('a').contains('Add New User').click();
    
    cy.get('input[name="name"]').type('Test User');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('123');
    
    cy.get('button[type="submit"]').click();
    
    cy.get('.error-message').should('contain', 'Password must be at least 6 characters');
  });

  it('should edit an existing user', () => {
    // Create a user first
    cy.createTestUser({
      name: 'Original Name',
      email: 'original@example.com'
    });
    
    cy.visit('/users');
    
    // Click edit button for the user
    cy.get('table').should('contain', 'Original Name');
    cy.get('a').contains('Edit').first().click();
    
    // Should be on edit page
    cy.url().should('include', '/edit');
    cy.get('h2').should('contain', 'Edit User');
    
    // Update the user
    cy.get('input[name="name"]').clear().type('Updated Name');
    cy.get('input[name="email"]').clear().type('updated@example.com');
    
    cy.get('button[type="submit"]').click();
    
    // Should redirect to users list
    cy.url().should('eq', Cypress.config().baseUrl + '/users');
    
    // Should display updated user
    cy.get('table').should('contain', 'Updated Name');
    cy.get('table').should('contain', 'updated@example.com');
  });

  it('should delete a user', () => {
    // Create a user first
    cy.createTestUser({
      name: 'User to Delete',
      email: 'delete@example.com'
    });
    
    cy.visit('/users');
    
    // Should see the user
    cy.get('table').should('contain', 'User to Delete');
    
    // Click delete button
    cy.get('button').contains('Delete').first().click();
    
    // Should show confirmation dialog
    cy.on('window:confirm', () => true);
    
    // User should be removed from the list
    cy.get('table').should('not.contain', 'User to Delete');
  });

  it('should handle pagination', () => {
    // Create multiple users to test pagination
    for (let i = 1; i <= 15; i++) {
      cy.createTestUser({
        name: `User ${i}`,
        email: `user${i}@example.com`
      });
    }
    
    cy.visit('/users');
    
    // Should show pagination controls
    cy.get('button').contains('Next').should('be.visible');
    
    // Navigate to next page
    cy.get('button').contains('Next').click();
    
    // Should be on page 2
    cy.get('span').should('contain', 'Page 2');
  });

  it('should filter users by role', () => {
    // Create users with different roles
    cy.createTestUser({ name: 'Admin User', role: 'admin' });
    cy.createTestUser({ name: 'Regular User', role: 'user' });
    
    cy.visit('/users');
    
    // Should see both users
    cy.get('table').should('contain', 'Admin User');
    cy.get('table').should('contain', 'Regular User');
    
    // Filter by admin role (if filter exists)
    // This would depend on the actual implementation
  });

  it('should handle API errors gracefully', () => {
    cy.get('a').contains('Add New User').click();
    
    // Fill form with duplicate email
    cy.fillUserForm({
      name: 'Test User',
      email: 'duplicate@example.com',
      password: 'password123'
    });
    
    // Mock API error response
    cy.intercept('POST', 'http://localhost:5000/api/users', {
      statusCode: 400,
      body: { success: false, error: 'Email already exists' }
    }).as('createUser');
    
    cy.get('button[type="submit"]').click();
    
    cy.wait('@createUser');
    
    // Should display error message
    cy.get('.error-message').should('contain', 'Email already exists');
  });

  it('should show loading states', () => {
    // Mock slow API response
    cy.intercept('GET', 'http://localhost:5000/api/users', (req) => {
      req.reply({
        delay: 1000,
        body: { success: true, data: [] }
      });
    }).as('getUsers');
    
    cy.visit('/users');
    
    // Should show loading state
    cy.get('.loading').should('be.visible');
    
    cy.wait('@getUsers');
    
    // Loading should disappear
    cy.get('.loading').should('not.exist');
  });

  it('should handle network errors', () => {
    // Mock network error
    cy.intercept('GET', 'http://localhost:5000/api/users', {
      forceNetworkError: true
    }).as('networkError');
    
    cy.visit('/users');
    
    cy.wait('@networkError');
    
    // Should show error message
    cy.get('.error').should('contain', 'Failed to load users');
    cy.get('button').contains('Retry').should('be.visible');
  });
}); 