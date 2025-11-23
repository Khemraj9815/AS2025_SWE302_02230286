describe('Article Creation', () => {
  beforeEach(() => {
    cy.fixture('users').then((users) => {
      cy.login(users.testUser.email, users.testUser.password);
    });
    cy.visit('/editor');
  });

  it('should display article editor form', () => {
    cy.get('input[placeholder="Article Title"]').should('be.visible');
    cy.get('input[placeholder="What\'s this article about?"]').should('be.visible');
    cy.get('textarea[placeholder="Write your article (in markdown)"]').should('be.visible');
    cy.get('input[placeholder="Enter tags"]').should('be.visible');
  });

  it('should create a new article successfully', () => {
    const timestamp = Date.now();
    const title = `Test Article ${timestamp}`;

    cy.get('input[placeholder="Article Title"]').type(title);
    cy.get('input[placeholder="What\'s this article about?"]').type('Test Description');
    cy.get('textarea[placeholder="Write your article (in markdown)"]').type('# Test Content\n\nThis is test content.');
    cy.get('input[placeholder="Enter tags"]').type('test{enter}');
    cy.get('button[type="submit"]').contains('Publish Article').click();

    // Should redirect to article page
    cy.url().should('include', '/article/');

    // Article should be displayed
    cy.contains(title).should('be.visible');
    cy.contains('Test Description').should('be.visible');
    cy.contains('This is test content').should('be.visible');
    cy.contains('test').should('be.visible');
  });

  it('should add multiple tags', () => {
    cy.get('input[placeholder="Enter tags"]').type('tag1{enter}');
    cy.get('input[placeholder="Enter tags"]').type('tag2{enter}');
    cy.get('input[placeholder="Enter tags"]').type('tag3{enter}');

    cy.get('.tag-default').should('have.length', 3);
    cy.contains('tag1').should('be.visible');
    cy.contains('tag2').should('be.visible');
    cy.contains('tag3').should('be.visible');
  });

  it('should remove tags', () => {
    cy.get('input[placeholder="Enter tags"]').type('tag1{enter}');
    cy.get('input[placeholder="Enter tags"]').type('tag2{enter}');

    // Click X to remove tag
    cy.get('.tag-default').first().find('.tag-remove').click();

    cy.get('.tag-default').should('have.length', 1);
    cy.contains('tag2').should('be.visible');
  });

  it('should show validation for required fields', () => {
    cy.get('button[type="submit"]').click();

    // Should remain on editor page
    cy.url().should('include', '/editor');
  });
});
