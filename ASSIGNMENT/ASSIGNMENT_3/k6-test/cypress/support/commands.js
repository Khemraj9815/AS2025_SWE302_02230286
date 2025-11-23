// Custom commands for common actions

Cypress.Commands.add('login', (email, password) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/users/login`,
    body: {
      user: { email, password }
    }
  }).then((response) => {
    window.localStorage.setItem('jwt', response.body.user.token);
  });
});

Cypress.Commands.add('register', (email, username, password) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/users`,
    body: {
      user: { email, username, password }
    }
  }).then((response) => {
    window.localStorage.setItem('jwt', response.body.user.token);
  });
});

Cypress.Commands.add('logout', () => {
  window.localStorage.removeItem('jwt');
});

Cypress.Commands.add('createArticle', (title, description, body, tags = []) => {
  const token = window.localStorage.getItem('jwt');
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/articles`,
    headers: {
      'Authorization': `Token ${token}`
    },
    body: {
      article: { title, description, body, tagList: tags }
    }
  });
});
