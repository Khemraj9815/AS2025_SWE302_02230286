describe('Article Editing', () => {
  let articleSlug;

  beforeEach(() => {
    cy.fixture('users').then((users) => {
      cy.login(users.testUser.email, users.testUser.password);
    });

    // Create article for each test
    const timestamp = Date.now();
    cy.createArticle(
      `Editable Article ${timestamp}`,
      'Description to edit',
      'Body to edit',
      ['edit', 'test']
    ).then((response) => {
      articleSlug = response.body.article.slug;
      cy.visit(`/article/${articleSlug}`);
    });
  });

  it('should show edit button for own article', () => {
    cy.contains('Edit Article').should('be.visible');
  });

  it('should navigate to editor when clicking edit', () => {
    cy.contains('Edit Article').click();
    cy.url().should('include', '/editor/');
  });

  it('should pre-populate editor with article data', () => {
    cy.contains('Edit Article').click();

    cy.get('input[placeholder="Article Title"]').should('have.value', `Editable Article`);
    cy.get('input[placeholder="What\'s this article about?"]').should('have.value', 'Description to edit');
    cy.get('textarea').should('contain.value', 'Body to edit');
  });

  it('should successfully update article', () => {
    cy.contains('Edit Article').click();

    // Modify content
    cy.get('input[placeholder="Article Title"]').clear().type('Updated Title');
    cy.get('textarea').clear().type('Updated body content');
    cy.get('button[type="submit"]').click();

    // Should show updated content
    cy.contains('Updated Title').should('be.visible');
    cy.contains('Updated body content').should('be.visible');
  });

  it('should successfully delete article', () => {
    cy.contains('Delete Article').click();

    // Should redirect to home
    cy.url().should('eq', `${Cypress.config().baseUrl}/`);

    // Article should not appear in list
    cy.visit('/');
    cy.contains(`Editable Article`).should('not.exist');
  });

  it('should not show edit/delete buttons for other users articles', () => {
    // Logout and login as different user
    cy.logout();
    cy.fixture('users').then((users) => {
      cy.login(users.secondUser.email, users.secondUser.password);
    });

    cy.visit(`/article/${articleSlug}`);

    cy.contains('Edit Article').should('not.exist');
    cy.contains('Delete Article').should('not.exist');
  });
});
