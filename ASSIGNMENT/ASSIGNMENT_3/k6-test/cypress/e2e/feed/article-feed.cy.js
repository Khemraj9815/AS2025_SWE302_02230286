describe('Article Feed', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display global feed', () => {
    cy.contains('Global Feed').should('be.visible');
    cy.get('.article-preview').should('have.length.at.least', 1);
  });

  it('should display popular tags', () => {
    cy.get('.sidebar').should('be.visible');
    cy.contains('Popular Tags').should('be.visible');
    cy.get('.tag-pill').should('have.length.at.least', 1);
  });

  it('should filter by tag', () => {
    // Click a tag
    cy.get('.tag-pill').first().click();

    // Should show filtered articles
    cy.get('.nav-link.active').should('contain.text', '#');
  });

  it('should show your feed when logged in', () => {
    cy.fixture('users').then((users) => {
      cy.login(users.testUser.email, users.testUser.password);
    });
    cy.visit('/');

    cy.contains('Your Feed').should('be.visible');
    cy.contains('Your Feed').click();

    // Should show personal feed
    cy.url().should('eq', `${Cypress.config().baseUrl}/`);
  });

  it('should paginate articles', () => {
    // If there are more than 10 articles
    cy.get('.article-preview').then(($articles) => {
      if ($articles.length === 10) {
        // Check for pagination
        cy.get('.pagination').should('be.visible');

        // Click next page
        cy.get('.page-link').contains('2').click();

        // Should load different articles
        cy.url().should('include', '?page=2');
      }
    });
  });
});
