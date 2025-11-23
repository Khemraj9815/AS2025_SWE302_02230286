describe('User Profile', () => {
  beforeEach(() => {
    cy.fixture('users').then((users) => {
      cy.login(users.testUser.email, users.testUser.password);
    });
  });

  it('should view own profile', () => {
    cy.fixture('users').then((users) => {
      cy.visit(`/@${users.testUser.username}`);

      cy.contains(users.testUser.username).should('be.visible');
      cy.contains('Edit Profile Settings').should('be.visible');
    });
  });

  it('should display user articles', () => {
    cy.fixture('users').then((users) => {
      // Create an article first
      cy.createArticle('Profile Article', 'Description', 'Body', ['profile']);

      cy.visit(`/@${users.testUser.username}`);

      cy.contains('My Articles').click();
      cy.contains('Profile Article').should('be.visible');
    });
  });

  it('should display favorited articles', () => {
    cy.fixture('users').then((users) => {
      cy.visit(`/@${users.testUser.username}`);

      cy.contains('Favorited Articles').click();
      // Should show favorited articles tab
      cy.url().should('include', 'favorites');
    });
  });

  it('should follow another user', () => {
    cy.fixture('users').then((users) => {
      // Visit another user's profile
      cy.visit(`/@${users.secondUser.username}`);

      // Click follow button
      cy.contains('Follow').click();

      // Button should change
      cy.contains('Unfollow').should('be.visible');
    });
  });

  it('should update profile settings', () => {
    cy.contains('Settings').click();

    cy.get('input[placeholder="URL of profile picture"]').clear().type('https://example.com/avatar.jpg');
    cy.get('textarea[placeholder="Short bio about you"]').clear().type('Updated bio');
    cy.contains('Update Settings').click();

    // Should redirect to profile
    cy.fixture('users').then((users) => {
      cy.url().should('include', `/@${users.testUser.username}`);
      cy.contains('Updated bio').should('be.visible');
    });
  });
});
