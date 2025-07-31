describe('Task Management', () => {
  beforeEach(() => {
    cy.clearTestData();
    cy.visit('/tasks');
  });

  afterEach(() => {
    cy.clearTestData();
  });

  it('should display tasks list page', () => {
    cy.get('h2').should('contain', 'Tasks');
    cy.get('a').should('contain', 'Create New Task');
  });

  it('should show empty state when no tasks exist', () => {
    cy.get('p').should('contain', 'No tasks found');
    cy.get('a').should('contain', 'Create First Task');
  });

  it('should navigate to create task form', () => {
    cy.get('a').contains('Create New Task').click();
    cy.url().should('include', '/tasks/new');
    cy.get('h2').should('contain', 'Create New Task');
  });

  it('should create a new task successfully', () => {
    // Create a user first for assignment
    cy.createTestUser({
      name: 'Task Assignee',
      email: 'assignee@example.com'
    });
    
    // Navigate to create task form
    cy.get('a').contains('Create New Task').click();
    
    // Fill the form
    cy.fillTaskForm({
      title: 'Important Task',
      description: 'This is an important task that needs to be completed',
      status: 'pending',
      priority: 'high',
      dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
      assignedTo: '0' // First user in the list
    });
    
    // Submit the form
    cy.get('button[type="submit"]').click();
    
    // Should redirect to tasks list
    cy.url().should('eq', Cypress.config().baseUrl + '/tasks');
    
    // Should display the new task
    cy.get('table').should('contain', 'Important Task');
    cy.get('table').should('contain', 'high');
  });

  it('should validate required fields when creating task', () => {
    cy.get('a').contains('Create New Task').click();
    
    // Try to submit empty form
    cy.get('button[type="submit"]').click();
    
    // Should show validation errors
    cy.get('.error-message').should('contain', 'Title is required');
    cy.get('.error-message').should('contain', 'Description is required');
    cy.get('.error-message').should('contain', 'Due date is required');
    cy.get('.error-message').should('contain', 'Please assign the task to a user');
  });

  it('should validate due date is not in the past', () => {
    cy.get('a').contains('Create New Task').click();
    
    cy.get('input[name="title"]').type('Test Task');
    cy.get('textarea[name="description"]').type('Test description');
    cy.get('input[name="dueDate"]').type('2020-01-01'); // Past date
    
    cy.get('button[type="submit"]').click();
    
    cy.get('.error-message').should('contain', 'Due date cannot be in the past');
  });

  it('should edit an existing task', () => {
    // Create a task first
    cy.createTestTask({
      title: 'Original Task',
      description: 'Original description'
    });
    
    cy.visit('/tasks');
    
    // Click edit button for the task
    cy.get('table').should('contain', 'Original Task');
    cy.get('a').contains('Edit').first().click();
    
    // Should be on edit page
    cy.url().should('include', '/edit');
    cy.get('h2').should('contain', 'Edit Task');
    
    // Update the task
    cy.get('input[name="title"]').clear().type('Updated Task');
    cy.get('textarea[name="description"]').clear().type('Updated description');
    cy.get('select[name="priority"]').select('urgent');
    
    cy.get('button[type="submit"]').click();
    
    // Should redirect to tasks list
    cy.url().should('eq', Cypress.config().baseUrl + '/tasks');
    
    // Should display updated task
    cy.get('table').should('contain', 'Updated Task');
    cy.get('table').should('contain', 'urgent');
  });

  it('should delete a task', () => {
    // Create a task first
    cy.createTestTask({
      title: 'Task to Delete',
      description: 'This task will be deleted'
    });
    
    cy.visit('/tasks');
    
    // Should see the task
    cy.get('table').should('contain', 'Task to Delete');
    
    // Click delete button
    cy.get('button').contains('Delete').first().click();
    
    // Should show confirmation dialog
    cy.on('window:confirm', () => true);
    
    // Task should be removed from the list
    cy.get('table').should('not.contain', 'Task to Delete');
  });

  it('should filter tasks by status', () => {
    // Create tasks with different statuses
    cy.createTestTask({ title: 'Pending Task', status: 'pending' });
    cy.createTestTask({ title: 'Completed Task', status: 'completed' });
    
    cy.visit('/tasks');
    
    // Should see both tasks
    cy.get('table').should('contain', 'Pending Task');
    cy.get('table').should('contain', 'Completed Task');
    
    // Filter by pending status
    cy.get('select[name="status"]').select('pending');
    
    // Should only see pending tasks
    cy.get('table').should('contain', 'Pending Task');
    cy.get('table').should('not.contain', 'Completed Task');
  });

  it('should filter tasks by priority', () => {
    // Create tasks with different priorities
    cy.createTestTask({ title: 'Low Priority Task', priority: 'low' });
    cy.createTestTask({ title: 'High Priority Task', priority: 'high' });
    
    cy.visit('/tasks');
    
    // Filter by high priority
    cy.get('select[name="priority"]').select('high');
    
    // Should only see high priority tasks
    cy.get('table').should('contain', 'High Priority Task');
    cy.get('table').should('not.contain', 'Low Priority Task');
  });

  it('should filter tasks by assigned user', () => {
    // Create users
    cy.createTestUser({ name: 'User A', email: 'usera@example.com' });
    cy.createTestUser({ name: 'User B', email: 'userb@example.com' });
    
    // Create tasks assigned to different users
    cy.createTestTask({ title: 'Task for User A', assignedTo: 'User A' });
    cy.createTestTask({ title: 'Task for User B', assignedTo: 'User B' });
    
    cy.visit('/tasks');
    
    // Filter by User A
    cy.get('select[name="assignedTo"]').select('User A');
    
    // Should only see tasks assigned to User A
    cy.get('table').should('contain', 'Task for User A');
    cy.get('table').should('not.contain', 'Task for User B');
  });

  it('should handle pagination', () => {
    // Create multiple tasks to test pagination
    for (let i = 1; i <= 15; i++) {
      cy.createTestTask({
        title: `Task ${i}`,
        description: `Description for task ${i}`
      });
    }
    
    cy.visit('/tasks');
    
    // Should show pagination controls
    cy.get('button').contains('Next').should('be.visible');
    
    // Navigate to next page
    cy.get('button').contains('Next').click();
    
    // Should be on page 2
    cy.get('span').should('contain', 'Page 2');
  });

  it('should add tags to tasks', () => {
    cy.get('a').contains('Create New Task').click();
    
    // Fill basic form
    cy.get('input[name="title"]').type('Tagged Task');
    cy.get('textarea[name="description"]').type('Task with tags');
    cy.get('input[name="dueDate"]').type(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
    
    // Add tags
    cy.get('input[placeholder="Add a tag"]').type('important');
    cy.get('button').contains('Add').click();
    
    cy.get('input[placeholder="Add a tag"]').type('urgent');
    cy.get('button').contains('Add').click();
    
    // Should display tags
    cy.get('.badge').should('contain', 'important');
    cy.get('.badge').should('contain', 'urgent');
    
    // Remove a tag
    cy.get('.badge').contains('important').click();
    cy.get('.badge').should('not.contain', 'important');
  });

  it('should handle API errors gracefully', () => {
    cy.get('a').contains('Create New Task').click();
    
    // Fill form
    cy.fillTaskForm({
      title: 'Test Task',
      description: 'Test description'
    });
    
    // Mock API error response
    cy.intercept('POST', 'http://localhost:5000/api/tasks', {
      statusCode: 400,
      body: { success: false, error: 'Assigned user not found' }
    }).as('createTask');
    
    cy.get('button[type="submit"]').click();
    
    cy.wait('@createTask');
    
    // Should display error message
    cy.get('.error-message').should('contain', 'Assigned user not found');
  });

  it('should show loading states', () => {
    // Mock slow API response
    cy.intercept('GET', 'http://localhost:5000/api/tasks', (req) => {
      req.reply({
        delay: 1000,
        body: { success: true, data: [] }
      });
    }).as('getTasks');
    
    cy.visit('/tasks');
    
    // Should show loading state
    cy.get('.loading').should('be.visible');
    
    cy.wait('@getTasks');
    
    // Loading should disappear
    cy.get('.loading').should('not.exist');
  });

  it('should handle network errors', () => {
    // Mock network error
    cy.intercept('GET', 'http://localhost:5000/api/tasks', {
      forceNetworkError: true
    }).as('networkError');
    
    cy.visit('/tasks');
    
    cy.wait('@networkError');
    
    // Should show error message
    cy.get('.error').should('contain', 'Failed to load tasks');
    cy.get('button').contains('Retry').should('be.visible');
  });

  it('should display overdue tasks with warning', () => {
    // Create an overdue task
    cy.createTestTask({
      title: 'Overdue Task',
      dueDate: new Date(Date.now() - 86400000).toISOString() // Yesterday
    });
    
    cy.visit('/tasks');
    
    // Should show overdue warning
    cy.get('table').should('contain', 'Overdue Task');
    cy.get('span').should('contain', '⚠️');
  });

  it('should update task status', () => {
    // Create a task
    cy.createTestTask({
      title: 'Status Update Task',
      status: 'pending'
    });
    
    cy.visit('/tasks');
    
    // Should show pending status
    cy.get('table').should('contain', 'pending');
    
    // Edit the task
    cy.get('a').contains('Edit').first().click();
    
    // Change status to completed
    cy.get('select[name="status"]').select('completed');
    cy.get('button[type="submit"]').click();
    
    // Should show completed status
    cy.get('table').should('contain', 'completed');
  });
}); 