// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command to create a test user
Cypress.Commands.add('createTestUser', (userData = {}) => {
  const defaultUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    role: 'user'
  };
  
  const user = { ...defaultUser, ...userData };
  
  return cy.request({
    method: 'POST',
    url: 'http://localhost:5000/api/users',
    body: user,
    failOnStatusCode: false
  });
});

// Custom command to create a test task
Cypress.Commands.add('createTestTask', (taskData = {}) => {
  const defaultTask = {
    title: 'Test Task',
    description: 'This is a test task',
    status: 'pending',
    priority: 'medium',
    dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    assignedTo: null, // Will be set by the command
    tags: ['test']
  };
  
  const task = { ...defaultTask, ...taskData };
  
  // If no assignedTo is provided, create a user first
  if (!task.assignedTo) {
    return cy.createTestUser().then((response) => {
      if (response.status === 201) {
        task.assignedTo = response.body.data.id;
      } else {
        // If user creation failed, try to get existing users
        return cy.request('GET', 'http://localhost:5000/api/users').then((usersResponse) => {
          if (usersResponse.body.data.length > 0) {
            task.assignedTo = usersResponse.body.data[0]._id;
          }
        });
      }
    }).then(() => {
      return cy.request({
        method: 'POST',
        url: 'http://localhost:5000/api/tasks',
        body: task,
        failOnStatusCode: false
      });
    });
  }
  
  return cy.request({
    method: 'POST',
    url: 'http://localhost:5000/api/tasks',
    body: task,
    failOnStatusCode: false
  });
});

// Custom command to clear test data
Cypress.Commands.add('clearTestData', () => {
  // Clear tasks
  cy.request({
    method: 'GET',
    url: 'http://localhost:5000/api/tasks',
    failOnStatusCode: false
  }).then((response) => {
    if (response.status === 200 && response.body.data) {
      response.body.data.forEach(task => {
        cy.request({
          method: 'DELETE',
          url: `http://localhost:5000/api/tasks/${task._id}`,
          failOnStatusCode: false
        });
      });
    }
  });
  
  // Clear users (except the first one to avoid breaking references)
  cy.request({
    method: 'GET',
    url: 'http://localhost:5000/api/users',
    failOnStatusCode: false
  }).then((response) => {
    if (response.status === 200 && response.body.data.length > 1) {
      response.body.data.slice(1).forEach(user => {
        cy.request({
          method: 'DELETE',
          url: `http://localhost:5000/api/users/${user._id}`,
          failOnStatusCode: false
        });
      });
    }
  });
});

// Custom command to wait for page load
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('body').should('be.visible');
  cy.get('.loading').should('not.exist');
});

// Custom command to fill user form
Cypress.Commands.add('fillUserForm', (userData = {}) => {
  const defaultData = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    role: 'user'
  };
  
  const data = { ...defaultData, ...userData };
  
  cy.get('input[name="name"]').clear().type(data.name);
  cy.get('input[name="email"]').clear().type(data.email);
  if (data.password) {
    cy.get('input[name="password"]').clear().type(data.password);
  }
  cy.get('select[name="role"]').select(data.role);
  if (data.isActive !== undefined) {
    cy.get('input[name="isActive"]').check({ force: data.isActive });
  }
});

// Custom command to fill task form
Cypress.Commands.add('fillTaskForm', (taskData = {}) => {
  const defaultData = {
    title: 'Test Task',
    description: 'This is a test task description',
    status: 'pending',
    priority: 'medium',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    assignedTo: '0' // First user in the list
  };
  
  const data = { ...defaultData, ...taskData };
  
  cy.get('input[name="title"]').clear().type(data.title);
  cy.get('textarea[name="description"]').clear().type(data.description);
  cy.get('select[name="status"]').select(data.status);
  cy.get('select[name="priority"]').select(data.priority);
  cy.get('input[name="dueDate"]').clear().type(data.dueDate);
  if (data.assignedTo) {
    cy.get('select[name="assignedTo"]').select(data.assignedTo);
  }
});

// Custom command to check for error messages
Cypress.Commands.add('checkForErrors', () => {
  cy.get('.error-message').should('not.exist');
  cy.get('.error').should('not.exist');
});

// Custom command to check for success messages
Cypress.Commands.add('checkForSuccess', () => {
  cy.get('.success-message').should('exist');
});

// Override visit command to wait for page load
Cypress.Commands.overwrite('visit', (originalFn, url, options) => {
  return originalFn(url, options).then(() => {
    cy.waitForPageLoad();
  });
}); 