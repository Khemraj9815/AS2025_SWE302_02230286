# k6 Stress Test Analysis

## 1. Executive summary

- Test objective: Find the application's breaking point by ramping traffic up aggressively to 300 VUs and observe failures, latency growth, and recovery behavior.
- Test runner: k6 (local)
- Test script: k6-tests/stress-test.js (stages up to 300 VUs)
- Test start time: <add timestamp when you ran the test>

Quick outcome:
- Threshold http_req_duration p(95)<2000 ms: FAIL (p95 = 2.96 s)
- Threshold http_req_failed rate<0.1: PASS (rate = 0.38%)
- Total HTTP requests: 133,930
- Failed requests: 519 (0.38%)
- Average http_req_duration: 1.24 s
- Median http_req_duration: 678.19 ms
- p90 = 2.57 s, p95 = 2.96 s
- Max observed latency = ~1 minute (requests hit 60s timeout)

k6 summary excerpt (from run)
- checks_total: 133,930
- checks_succeeded: 133,411 (99.61%)
- checks_failed: 519 (0.38%)
- http_reqs: 133,930 (67.63 req/s)
- data_received: ~147 GB (very large; ensure this is expected)
- data_sent: ~11 MB

---

## 2. What the numbers indicate

- The system handled many requests but under very high concurrency latency increased significantly, with p95 ≈ 2.96 s and some requests timing out (~60s).
- The failure rate remained quite low (0.38%), within the allowed 10% for this stress test; nevertheless, the latency threshold was breached.
- The presence of many long responses and timeouts suggests one or more of:
  - Server saturation (CPU / thread / goroutine / worker exhaustion)
  - Database saturation (slow queries, connection pool exhaustion)
  - Resource limits (file descriptors, network backlog, reverse-proxy limits)
  - Blocking synchronous operations in request flow (e.g., heavy updates, external calls)

---

## 3. Timeline observations & reproducible points

- Failures and timeouts began to appear as the test reached the higher stages (likely as VUs approached 200–300).
- Max latency values (≈60s) indicate requests were waiting until the client-side timeout — an indicator the server was not responding quickly or the request queued for a long time.
- The test shows typical stress behavior: graceful degradation at lower overload, then long-tail latency and some timed-out requests as load increases.

---

## 4. Suggested immediate investigation steps

1. Collect server metrics during test (time-window when p95 rose and when timeouts happened):
   - CPU utilization per core
   - Memory usage and RSS
   - Process count / goroutine count (for Go)
   - Open file descriptors
   - Network socket backlog/queues
2. Collect DB metrics:
   - Active connections (peak)
   - Slow query log entries (queries taking more than e.g. 200 ms)
   - Lock waits, long transactions
3. Inspect application logs for stack traces, errors, or timeouts at the timestamps when k6 reported timeouts.
4. If you have a reverse proxy (nginx, Traefik) or load balancer in front, check its error rate and timeouts.
5. Confirm whether the large data_received (~147 GB) is expected (e.g., many articles or large payloads). If payloads are large, consider limiting payload sizes or paginating.

---

## 5. Prioritized remediation recommendations

- Tune DB (add indexes on frequently queried columns such as articles.created_at, article.slug; optimize any slow queries discovered).
- Tune DB connection pooling (increase pool size if pool is saturated, but ensure DB can handle it).
- Reduce synchronous work per request (defer non-critical work to background jobs).
- Enable request and DB query timeouts to fail fast rather than pile up requests.
- Add caching (Redis/memory) for read-heavy endpoints (e.g., GET /articles, GET /tags).

Medium-term
- Scale the application horizontally (add instances) and put behind a load balancer / autoscaler.
- Add read replicas for DB read traffic if DB CPU is the bottleneck.
- Add circuit breakers or rate-limiting for heavy endpoints to protect from overload spikes.

Long-term
- Introduce APM (NewRelic/Datadog/Jaeger) to track slow traces and identify hotspots.
- Implement capacity testing and set capacity targets (RPS / latency) for production SLA.

---

## 6. Test script improvements
- Tag requests (params.tags) so per-endpoint metrics appear in k6 JSON: makes it easier to see which endpoints cause latency.
- Use authentication (setup() + login) to reproduce realistic behavior.
- Do not add retries in stress tests because retries mask the true breaking point.

I updated the stress-test.js script to include authentication and tags (see repo file).

---

## 7. Next test actions

1. Re-run stress test and export JSON:
   - k6 run --out json=stress-test-results.json stress-test.js
2. While running, capture server metrics (top/htop, vmstat, iostat, Grafana dashboards) focused on:
   - CPU per core
   - Memory RSS and free memory
   - DB connection counts
   - Application goroutine counts / thread counts
3. Collect backend logs for timestamps when timeouts occurred.
4. Identify the top slow SQL queries (enable slow query log) and address them (indexes / query rewrite).
5. Re-run the stress test after each fix to measure improvement.

---

## 8. Evidence to collect and include in your report
- k6 terminal screenshot
![stress test output](/screenshots/stress-test1.png)

- k6 JSON results file
![stress test output](/screenshots/stress-test2.png)


---

## 9. Summary 
- The failure (p95 > 2s) is expected for a stress test — it's showing the system's limit.
- Investigate server and DB resource usage at the time of failures, fix bottlenecks (indexes, pooling, scaling), and re-run tests.
- After optimizations, produce a performance-improvement-report.md comparing before/after (p95/p99/RPS/error rate).

---

## 10. Helpful commands

- Run stress test and save JSON:
  - k6 run --out json=stress-test-results.json stress-test.js
- Extract p95 from JSON:
  - jq '.metrics.http_req_duration.percentiles["95.00"]' stress-test-results.json
- Extract total failed requests:
  - jq '.metrics.http_req_failed.count' stress-test-results.json
