describe('User Login', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('should display login form', () => {
    cy.contains('Sign in').should('be.visible');
    cy.get('input[placeholder="Email"]').should('be.visible');
    cy.get('input[placeholder="Password"]').should('be.visible');
  });

  it('should successfully login with valid credentials', () => {
    cy.fixture('users').then((users) => {
      cy.get('input[placeholder="Email"]').type(users.testUser.email);
      cy.get('input[placeholder="Password"]').type(users.testUser.password);
      cy.get('button[type="submit"]').click();

      // Should redirect to home
      cy.url().should('eq', `${Cypress.config().baseUrl}/`);

      // Should show user's name in header
      cy.get('.nav-link').contains(users.testUser.username).should('be.visible');
    });
  });

  it('should show error for invalid credentials', () => {
    cy.get('input[placeholder="Email"]').type('wrong@example.com');
    cy.get('input[placeholder="Password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();

    // Should show error message
    cy.contains('email or password').should('be.visible');

    // Should remain on login page
    cy.url().should('include', '/login');
  });

  it('should persist login after page refresh', () => {
    cy.fixture('users').then((users) => {
      cy.get('input[placeholder="Email"]').type(users.testUser.email);
      cy.get('input[placeholder="Password"]').type(users.testUser.password);
      cy.get('button[type="submit"]').click();

      cy.url().should('eq', `${Cypress.config().baseUrl}/`);

      // Refresh page
      cy.reload();

      // User should still be logged in
      cy.get('.nav-link').contains(users.testUser.username).should('be.visible');
    });
  });

  it('should logout successfully', () => {
    cy.fixture('users').then((users) => {
      // Login first
      cy.login(users.testUser.email, users.testUser.password);
      cy.visit('/');

      // Click logout
      cy.contains('Settings').click();
      cy.contains('Or click here to logout').click();

      // Should redirect to home and show sign in link
      cy.contains('Sign in').should('be.visible');
    });
  });
});
