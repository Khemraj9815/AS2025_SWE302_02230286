describe('Article Reading', () => {
  let articleSlug;

  before(() => {
    // Create an article to test with
    cy.fixture('users').then((users) => {
      cy.login(users.testUser.email, users.testUser.password);
    });

    cy.fixture('articles').then((articles) => {
      cy.createArticle(
        articles.sampleArticle.title,
        articles.sampleArticle.description,
        articles.sampleArticle.body,
        articles.sampleArticle.tagList
      ).then((response) => {
        articleSlug = response.body.article.slug;
      });
    });
  });

  beforeEach(() => {
    cy.visit(`/article/${articleSlug}`);
  });

  it('should display article content', () => {
    cy.fixture('articles').then((articles) => {
      cy.contains(articles.sampleArticle.title).should('be.visible');
      cy.contains(articles.sampleArticle.description).should('be.visible');
      cy.contains(articles.sampleArticle.body).should('be.visible');
    });
  });

  it('should display article metadata', () => {
    cy.fixture('users').then((users) => {
      // Author name
      cy.contains(users.testUser.username).should('be.visible');

      // Date
      cy.get('.date').should('be.visible');

      // Tags
      cy.get('.tag-default').should('have.length.at.least', 1);
    });
  });

  it('should allow favoriting article', () => {
    cy.fixture('users').then((users) => {
      cy.login(users.testUser.email, users.testUser.password);
      cy.visit(`/article/${articleSlug}`);
    });

    // Click favorite button
    cy.get('.btn-outline-primary').contains('Favorite').click();

    // Button should change
    cy.get('.btn-primary').contains('Unfavorite').should('be.visible');
  });

  it('should allow unfavoriting article', () => {
    cy.fixture('users').then((users) => {
      cy.login(users.testUser.email, users.testUser.password);
      cy.visit(`/article/${articleSlug}`);
    });

    // Favorite first
    cy.get('.btn-outline-primary').contains('Favorite').click();

    // Then unfavorite
    cy.get('.btn-primary').contains('Unfavorite').click();

    // Button should change back
    cy.get('.btn-outline-primary').contains('Favorite').should('be.visible');
  });
});
