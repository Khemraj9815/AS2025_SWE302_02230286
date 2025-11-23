describe('Article Comments', () => {
  let articleSlug;

  before(() => {
    cy.fixture('users').then((users) => {
      cy.login(users.testUser.email, users.testUser.password);
    });

    cy.createArticle(
      'Article with Comments',
      'Testing comments',
      'Comment testing article',
      ['comments']
    ).then((response) => {
      articleSlug = response.body.article.slug;
    });
  });

  beforeEach(() => {
    cy.fixture('users').then((users) => {
      cy.login(users.testUser.email, users.testUser.password);
    });
    cy.visit(`/article/${articleSlug}`);
  });

  it('should display comment form when logged in', () => {
    cy.get('textarea[placeholder="Write a comment..."]').should('be.visible');
    cy.contains('Post Comment').should('be.visible');
  });

  it('should add a comment successfully', () => {
    const commentText = `Test comment ${Date.now()}`;

    cy.get('textarea[placeholder="Write a comment..."]').type(commentText);
    cy.contains('Post Comment').click();

    // Comment should appear
    cy.contains(commentText).should('be.visible');
  });

  it('should display multiple comments', () => {
    cy.get('textarea').type('Comment 1{enter}');
    cy.contains('Post Comment').click();
    cy.wait(500);

    cy.get('textarea').type('Comment 2{enter}');
    cy.contains('Post Comment').click();

    cy.get('.card').should('have.length.at.least', 2);
  });

  it('should delete own comment', () => {
    const commentText = `Comment to delete ${Date.now()}`;

    cy.get('textarea').type(commentText);
    cy.contains('Post Comment').click();

    // Find and click delete button for this comment
    cy.contains(commentText).parent().parent().find('.mod-options').click();

    // Comment should be removed
    cy.contains(commentText).should('not.exist');
  });

  it('should not show delete button for others comments', () => {
    // Add comment as first user
    const commentText = `Other user comment ${Date.now()}`;
    cy.get('textarea').type(commentText);
    cy.contains('Post Comment').click();

    // Logout and login as different user
    cy.logout();
    cy.fixture('users').then((users) => {
      cy.login(users.secondUser.email, users.secondUser.password);
    });
    cy.visit(`/article/${articleSlug}`);

    // Should not see delete button for first user's comment
    cy.contains(commentText).parent().parent().find('.mod-options').should('not.exist');
  });
});
