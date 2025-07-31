// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Global error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test on uncaught exceptions
  console.log('Uncaught exception:', err.message);
  return false;
});

// Global before hook to ensure server is running
beforeEach(() => {
  // Check if the server is running by making a request to the health endpoint
  cy.request({
    url: 'http://localhost:5000/health',
    failOnStatusCode: false,
    timeout: 5000
  }).then((response) => {
    if (response.status !== 200) {
      cy.log('Warning: Server might not be running on port 5000');
    }
  });
}); 