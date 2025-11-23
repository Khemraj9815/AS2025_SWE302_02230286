import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL } from './config.js';

export const options = {
  stages: [
    { duration: '2m', target: 50 },     // Ramp up
    { duration: '3h', target: 50 },     // Stay at load for 3 hours
    { duration: '2m', target: 0 },      // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  // Realistic user behavior
  http.get(`${BASE_URL}/articles`);
  sleep(3);

  http.get(`${BASE_URL}/tags`);
  sleep(2);
}