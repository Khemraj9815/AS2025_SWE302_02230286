import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL } from './config.js';

export const options = {
  stages: [
    { duration: '10s', target: 10 },    // Normal load
    { duration: '30s', target: 10 },    // Stable
    { duration: '10s', target: 500 },   // Sudden spike!
    { duration: '3m', target: 500 },    // Stay at spike
    { duration: '10s', target: 10 },    // Back to normal
    { duration: '3m', target: 10 },     // Recovery period
    { duration: '10s', target: 0 },     // Ramp down
  ],
};

export default function () {
  const response = http.get(`${BASE_URL}/articles`);
  check(response, {
    'status is 200': (r) => r.status === 200,
  });
}