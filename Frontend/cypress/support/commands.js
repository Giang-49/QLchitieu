// Cypress Custom Commands for SmartMoney QLchitieu

Cypress.Commands.add('login', (email = 'demo@sochi.test', password = 'SoChiDemo2026!') => {
  cy.visit('/login.html');
  cy.get('#form-login input[name="email"]').clear().type(email);
  cy.get('#form-login input[name="password"]').clear().type(password);
  cy.get('#form-login button[type="submit"]').click();
  cy.url().should('include', 'index.html');
});
