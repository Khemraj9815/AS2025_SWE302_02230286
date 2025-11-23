# k6 Load Test Analysis

## 1. Executive summary

- Test objective: Validate API performance under a realistic ramping load; verify thresholds (p95 < 500 ms, error rate < 1%); identify slow endpoints or failure modes.
- Environment:
  - Backend URL: http://localhost:8080/api
  - Test runner: k6 (local)
  - Test start: <add timestamp of test start>
  - Test host: <add OS / CPU / RAM details of test machine or server>
- High-level result (from local run):
  - Total HTTP requests: 30,217
  - Average RPS: 31.34 req/s
  - Average response time: 2.83 ms
  - p90 response time: 7.15 ms
  - p95 response time: 9 ms
  - p99 response time: (not explicitly shown in terminal) — add from JSON if needed
  - Error rate: 0.00% (0 failed requests)
  - Checks: 35,252 checks executed; 100.00% succeeded

Quick verdict:
- Threshold http_req_duration p(95)<500: PASS (p95 = 9 ms)
- Threshold http_req_failed rate<0.01: PASS (rate = 0.00%)

Screenshots / evidence placeholders:
- k6 terminal summary screenshot
![load test](../screenshots/load-test1.png)  

- JSON results file: k6-tests/load-test-results.json
![load test result/JSON file](/screenshots/load-test2.png)

---

## 2. Test configuration

- Script: k6-tests/load-test.js
- k6 options (from script):
  - stages:
    - 2m -> 10 VUs (ramp up)
    - 5m -> 10 VUs (steady)
    - 2m -> 50 VUs (ramp up)
    - 5m -> 50 VUs (steady)
    - 2m -> 0 VUs (ramp down)
  - thresholds: http_req_duration p(95) < 500 ms, http_req_failed rate < 0.01
- Authentication: setup() logs in test user and returns token; default test uses this token for authenticated endpoints.
- Sequence per VU iteration:
  1. GET /articles
  2. GET /tags
  3. GET /user
  4. POST /articles (create article)
  5. GET /articles/:slug
  6. POST /articles/:slug/favorite

Notes:
- Script uses unique article titles (Date.now()) to avoid collisions.
- sleep() inserted between actions to simulate user think time.

---

## 3. Aggregate performance metrics (from run)

- Total requests: 30,217
- Total checks: 35,252 (100% success)
- Test wall-clock duration: ~16m04s
- Average RPS: 31.3375 req/s
- Data transferred:
  - Data received: 2.8 GB (≈2.9 MB/s)
  - Data sent: 6.1 MB

HTTP request duration (latency) distribution:
- Mean (avg) http_req_duration: 2.83 ms
- Median (p50): 1.67 ms
- p90: 7.15 ms
- p95: 9 ms
- Min: 0.16753 ms
- Max: 37.4 ms

Iteration metrics:
- Iterations: 5,036 total (avg iteration_duration ≈ 5.02 s)
- vus: min 1, max 50 (vus_max = 50)

Checks (assertions):
- checks_total: 35,252
- checks_succeeded: 35,252 (100%)
- checks_failed: 0

Errors:
- http_req_failed: 0.00% (0 out of 30,217)

---

## 4. Request-by-endpoint analysis

The k6 terminal output aggregates HTTP metrics; per-endpoint metrics are not automatically broken out unless you tag requests or inspect the JSON. Based on script flow and check pass rates, all endpoints responded successfully. You can get per-endpoint detail by re-running with tags or by checking the JSON for metrics by URL tag.

Suggested per-endpoint metrics to capture (placeholders — fill from JSON or re-run with tags):
Endpoint | Requests | Avg (ms) | p95 (ms) | p99 (ms) | Min (ms) | Max (ms) | Failed | Fail %
--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---:
GET /api/articles | <n> | <avg> | <p95> | <p99> | <min> | <max> | 0 | 0.00%
GET /api/tags | <n> | <avg> | <p95> | <p99> | <min> | <max> | 0 | 0.00%
GET /api/user | <n> | <avg> | <p95> | <p99> | <min> | <max> | 0 | 0.00%
POST /api/articles | <n> | <avg> | <p95> | <p99> | <min> | <max> | 0 | 0.00%
GET /api/articles/:slug | <n> | <avg> | <p95> | <p99> | <min> | <max> | 0 | 0.00%
POST /api/articles/:slug/favorite | <n> | <avg> | <p95> | <p99> | <min> | <max> | 0 | 0.00%

How to get per-endpoint metrics:
- Re-run the test using tags, e.g.:
  - http.get(url, { tags: { name: 'GET /articles' } })
- Or parse the JSON file for grouped metrics.

---

## 5. Success / Failure rates and error analysis

- Successful requests: 30,217
- Failed requests: 0 (0.00%)
- Checks: all passed (35,252 / 35,252)
- No HTTP 5xx/4xx failures observed in this run.

Temporal behavior:
- No errors observed during ramp-ups or steady-state.
- Latency remains low across stages (p95 = 9 ms), indicating good capacity for this workload profile.

---

## 6. Threshold analysis

- Configured thresholds:
  - http_req_duration: p(95) < 500 ms — RESULT: PASS (p95 = 9 ms)
  - http_req_failed: rate < 0.01 — RESULT: PASS (rate = 0.00%)

Interpretation:
- The service easily meets the specified test thresholds in the load test scenario up to 50 VUs and ~31 RPS.

---

## 7. Resource utilization (to add)

You must capture these during the test. Add screenshots and numbers below.

- Server CPU (average / peak): <CPU_AVG>% / <CPU_PEAK>%
- Server Memory usage (start / peak / end): <MEM_START_MB> MB / <MEM_PEAK_MB> MB / <MEM_END_MB> MB
- Database active connections (peak): <DB_CONN_PEAK>
- Disk / I/O: <DISK_IO>
- Network: observed bandwidth ~2.9 MB/s inbound during test

---

## 8. Findings and recommendations

Findings:
1. The API performed very well under the configured load: very low latency (avg 2.83 ms) and no failures.
2. No threshold breaches; all checks passed.
3. This load profile (up to 50 VUs, ~31 RPS) is handled cleanly by the backend.

**Recommendations**
- Run the stress test (stress-test.js) to discover the breaking point and capture where errors begin to appear.
- Run the spike test (spike-test.js) to validate behavior during sudden spikes and measure recovery time.
- Run the soak test (soak-test.js), or a reduced 30-minute soak for the assignment, to detect memory leaks and long-term degradation.
- Collect server resource metrics (CPU, memory, DB connections) during all tests and attach screenshots.
- If stress/spike/soak reveal bottlenecks, apply optimizations:
  - Add DB indexes (slug, created_at) and re-run tests.
  - Fix any N+1 query patterns by eager-loading relations.
  - Tune DB connection pool and application worker counts.
- Re-run load/stress tests after optimizations and produce a before/after comparison (performance-improvement-report.md).

---

<!-- ## 9. Action items (for submission)

- [ ] Add k6 JSON file: k6-tests/load-test-results.json
- [ ] Add k6 terminal screenshot: screenshots/k6_terminal_load.png
- [ ] Add server monitoring screenshots: screenshots/server_cpu_mem.png, screenshots/db_connections.png
- [ ] Run and attach stress, spike, and soak JSON outputs and fill corresponding analysis markdowns:
  - k6-tests/stress-test-results.json → k6-stress-test-analysis.md
  - k6-tests/spike-test-results.json → k6-spike-test-analysis.md
  - k6-tests/soak-test-results.json → k6-soak-test-analysis.md
- [ ] Implement backend optimizations and run before/after comparisons (performance-improvement-report.md)

--- -->

## 10. Helpful jq commands to extract metrics from JSON

- Total requests:
  - jq '.metrics.http_reqs.count' k6-tests/load-test-results.json
- Mean latency (ms):
  - jq '.metrics.http_req_duration.metrics.mean' k6-tests/load-test-results.json
- p95:
  - jq '.metrics.http_req_duration.percentiles["95.00"]' k6-tests/load-test-results.json
- Error rate:
  - jq '.metrics.http_req_failed.rate' k6-tests/load-test-results.json
- Iterations:
  - jq '.metrics.iterations.count' k6-tests/load-test-results.json

---

## 11. Observations

- checks_total: 35252
- checks_succeeded: 35252 (100%)
- http_req_duration: avg=2.83ms min=167.53µs med=1.67ms max=37.4ms p(90)=7.15ms p(95)=9ms
- http_reqs: 30217 total, rate=31.3375/s
- iteration_duration: avg=5.02s
- vus_max was 50, iterations 5036 complete
