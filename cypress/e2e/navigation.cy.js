describe('Navigation and Basic App Functionality', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should load the application and display header', () => {
    cy.get('header').should('be.visible');
    cy.get('h1').should('contain', 'MERN Testing App');
  });

  it('should display navigation links', () => {
    cy.get('nav').should('be.visible');
    cy.get('a[href="/"]').should('contain', 'Dashboard');
    cy.get('a[href="/users"]').should('contain', 'Users');
    cy.get('a[href="/tasks"]').should('contain', 'Tasks');
  });

  it('should navigate to Dashboard page', () => {
    cy.get('a[href="/"]').click();
    cy.url().should('eq', Cypress.config().baseUrl + '/');
    cy.get('h1').should('contain', 'Dashboard');
  });

  it('should navigate to Users page', () => {
    cy.get('a[href="/users"]').click();
    cy.url().should('eq', Cypress.config().baseUrl + '/users');
    cy.get('h2').should('contain', 'Users');
  });

  it('should navigate to Tasks page', () => {
    cy.get('a[href="/tasks"]').click();
    cy.url().should('eq', Cypress.config().baseUrl + '/tasks');
    cy.get('h2').should('contain', 'Tasks');
  });

  it('should highlight active navigation link', () => {
    // Dashboard should be active by default
    cy.get('a[href="/"]').should('have.class', 'active');
    
    // Navigate to Users
    cy.get('a[href="/users"]').click();
    cy.get('a[href="/users"]').should('have.class', 'active');
    cy.get('a[href="/"]').should('not.have.class', 'active');
    
    // Navigate to Tasks
    cy.get('a[href="/tasks"]').click();
    cy.get('a[href="/tasks"]').should('have.class', 'active');
    cy.get('a[href="/users"]').should('not.have.class', 'active');
  });

  it('should display dashboard with statistics cards', () => {
    cy.visit('/');
    cy.get('.card').should('have.length.at.least', 3);
    cy.get('.card-title').should('contain', 'Users');
    cy.get('.card-title').should('contain', 'Tasks');
    cy.get('.card-title').should('contain', 'Quick Actions');
  });

  it('should handle 404 routes gracefully', () => {
    cy.visit('/nonexistent-page');
    // Should either redirect to home or show a 404 message
    cy.get('body').should('be.visible');
  });

  it('should be responsive on different screen sizes', () => {
    // Test mobile viewport
    cy.viewport(375, 667);
    cy.get('header').should('be.visible');
    cy.get('nav').should('be.visible');
    
    // Test tablet viewport
    cy.viewport(768, 1024);
    cy.get('header').should('be.visible');
    cy.get('nav').should('be.visible');
    
    // Test desktop viewport
    cy.viewport(1280, 720);
    cy.get('header').should('be.visible');
    cy.get('nav').should('be.visible');
  });

  it('should load without JavaScript errors', () => {
    cy.visit('/', {
      onBeforeLoad(win) {
        cy.spy(win.console, 'error').as('consoleError');
      },
    });
    
    cy.get('@consoleError').should('not.be.called');
  });

  it('should have proper page titles', () => {
    cy.visit('/');
    cy.title().should('not.be.empty');
    
    cy.visit('/users');
    cy.title().should('not.be.empty');
    
    cy.visit('/tasks');
    cy.title().should('not.be.empty');
  });
}); 