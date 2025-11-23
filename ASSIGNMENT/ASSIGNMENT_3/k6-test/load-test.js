import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, THRESHOLDS } from './config.js';
import { login, getAuthHeaders } from './helpers.js';

export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp up to 10 users over 2 minutes
    { duration: '5m', target: 10 },   // Stay at 10 users for 5 minutes
    { duration: '2m', target: 50 },   // Ramp up to 50 users over 2 minutes
    { duration: '5m', target: 50 },   // Stay at 50 users for 5 minutes
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: THRESHOLDS,
};

let token;

export function setup() {
  // Setup: Create test user and get token
  // This runs once before the test
  const loginRes = http.post(`${BASE_URL}/users/login`, JSON.stringify({
    user: {
      email: 'test@example.com',
      password: 'password'
    }
  }), {
    headers: { 'Content-Type': 'application/json' }
  });

  return { token: loginRes.json('user.token') };
}

export default function (data) {
  const authHeaders = getAuthHeaders(data.token);

  // Test 1: Get articles list
  let response = http.get(`${BASE_URL}/articles`, authHeaders);
  check(response, {
    'articles list status is 200': (r) => r.status === 200,
    'articles list has data': (r) => r.json('articles') !== null,
  });
  sleep(1);

  // Test 2: Get tags
  response = http.get(`${BASE_URL}/tags`, authHeaders);
  check(response, {
    'tags status is 200': (r) => r.status === 200,
  });
  sleep(1);

  // Test 3: Get current user
  response = http.get(`${BASE_URL}/user`, authHeaders);
  check(response, {
    'current user status is 200': (r) => r.status === 200,
  });
  sleep(1);

  // Test 4: Create article
  const articlePayload = JSON.stringify({
    article: {
      title: `Test Article ${Date.now()}`,
      description: 'Performance test article',
      body: 'This is a test article for performance testing',
      tagList: ['test', 'performance']
    }
  });

  response = http.post(`${BASE_URL}/articles`, articlePayload, authHeaders);
  check(response, {
    'article created': (r) => r.status === 200 || r.status === 201,
  });

  if (response.status === 200 || response.status === 201) {
    const slug = response.json('article.slug');

    // Test 5: Get single article
    response = http.get(`${BASE_URL}/articles/${slug}`, authHeaders);
    check(response, {
      'get article status is 200': (r) => r.status === 200,
    });
    sleep(1);

    // Test 6: Favorite article
    response = http.post(`${BASE_URL}/articles/${slug}/favorite`, null, authHeaders);
    check(response, {
      'favorite successful': (r) => r.status === 200,
    });
    sleep(1);
  }
}

export function teardown(data) {
  // Cleanup if needed
}