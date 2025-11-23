# k6 Spike Test Analysis

## 1. Executive summary

- Test objective  
  Simulate a sudden traffic spike and observe system behavior: error rate, latency, and recovery characteristics.

- Test configuration (from spike-test.js)
  - Stages:
    - 10s → 10 VUs
    - 30s → 10 VUs (stable)
    - 10s → 500 VUs (sudden spike)
    - 3m  → 500 VUs (stay at spike)
    - 10s → 10 VUs (back to normal)
    - 3m  → 10 VUs (recovery)
    - 10s → 0 VUs (ramp down)

- High-level result (from your run)
  - Total HTTP requests: 57,567
  - Total checks: 57,567
  - Checks succeeded: 55,770 (96.87%)
  - Checks failed: 1,797 (3.12%)
  - http_reqs: 57,567 (≈133.87 req/s)
  - http_req_failed: 3.12% (1,797 failed)
  - http_req_duration:
    - avg = 1.16 s
    - median = 123.81 ms
    - p(90) = 970.5 ms
    - p(95) = 1.05 s
    - max ≈ 1 minute (60s client timeout)
    - min = 0s (edge case, may indicate local timing / aborted requests)
  - iterations: 57,567
  - vus_max reached: 500
  - data received: ~62 GB (very large — validate payload sizes)
  - Observed WARN lines in k6: request timeout, dial: i/o timeout

Quick verdict
- The application experienced degraded latency and a non-negligible failure rate during the spike. Several requests timed out (client-level 60s) and connection-level timeouts ("dial: i/o timeout") were reported. This indicates the spike pushed the system (or a dependency) past capacity.

---

## 2. Spike impact

What happened during the spike
- Latency jumped: median remained low (~124 ms) but the tail increased significantly (p90 ≈ 970 ms, p95 ≈ 1.05 s), and max hit 60s for some requests.
- Failure rate rose to ~3.12% (1,797 failed checks). Many failures were timeouts or connection-level errors per k6 WARNs.
- k6 warnings included:
  - request timeout (Get "http://localhost:8080/api/articles": request timeout)
  - dial: i/o timeout (Get "...": dial: i/o timeout)
- Network traffic was high (62 GB received). Confirm whether responses were large (e.g., large article payloads or images) or if test runs overlapped / repeated large downloads.

Interpreting the metrics
- The low median with high tail indicates that many requests were served quickly, but a growing fraction took much longer under the spike — classic sign of queueing/backpressure.
- Connection timeouts (dial i/o) typically mean the client could not establish TCP connection within system or k6 timeout — this can be caused by:
  - Server accept queue (backlog) overflow
  - Too many concurrent connections exhausting file descriptors or ephemeral ports
  - Reverse-proxy / load balancer limits (max connections/workers)
  - Network saturation between k6 runner and server
- Request timeouts (server not responding within k6 timeout) indicate either very long server-side processing, blocking operations, or heavy queueing.

Which endpoints were impacted
- The test exercised only GET /api/articles. Therefore the observed issues are directly tied to serving the articles list endpoint (including any DB queries and serialization associated).

---

## 3. Recovery

What the test implies about recovery
- Your output shows many long latencies and timeouts during the spike stage. The test includes a designated recovery period (3m at 10 VUs after the spike), but the provided output does not include explicit post-recovery metrics (the run duration printed was 7m10s). To confirm recovery you should:
  - Inspect the final portion of the run or re-run and save JSON.
  - Capture server metrics throughout the entire timeline and check whether CPU, memory, DB connections and thread/goroutine counts return to baseline during the recovery stages.

Recommended recovery checks (when re-running)
- Plot RPS and latency over time and mark the spike window.
- Plot CPU, memory, and database connections over the same time window.
- Verify how long it takes for p95/p99 to return to pre-spike values (this is the recovery time).

Potential cascading failures
- If server resources (DB connections, threads, or worker pools) remain saturated after the spike, you may observe continued high latency or failures after load drops. Check:
  - DB connection counts after spike
  - Worker queue lengths / request backlog
  - Any increased error counts in server logs that persist after spike

---

## 4. Real-world scenarios & implications

Relevant real-world cases the spike test simulates
- Marketing campaign or newsletter link driving sudden surge to the articles page.
- Viral content or external referrer suddenly sending many concurrent visitors.
- Automated bots or crawlers hitting the public feed heavily.

Implications for production
- With a 3% error rate under a short but severe spike, users may see failed page loads or long timeouts during a real spike.
- If spikes are common or expected, consider autoscaling, load-shedding, and caching to preserve core service availability.

---

## 5. Root-cause hypotheses & debugging checklist

Possible root causes (prioritized)
1. Server accept queue or connection handling limit — too many concurrent connections cause "dial: i/o timeout".
2. Application-side worker saturation (goroutine blocking, long synchronous DB queries).
3. Database saturation (slow queries, connection pool exhaustion, locks).
4. Reverse proxy (nginx, Traefik) limits (worker_processes, proxy_read_timeout, proxy_connect_timeout).
5. Network limitations (bandwidth or socket ephemeral port exhaustion).
6. Large payloads causing high network throughput (62 GB received) and blocking.

Immediate debugging checklist (what to capture now)
- Re-run spike test with JSON output: `k6 run --out json=spike-test-results.json spike-test.js`
- While running, collect system metrics at high resolution:
  - top/htop (CPU per core)
  - vmstat 1
  - iostat -x 1
  - ss -s and ss -tanp | grep <app-port>
  - ulimit -n (file descriptor limit)
- Collect application metrics:
  - goroutine count (if Go: pprof / expvar) over time
  - open file descriptors for process (lsof -p <pid> | wc -l)
- Collect DB metrics:
  - current connections (e.g., SELECT count(*) FROM pg_stat_activity)
  - slow query log entries and long-running transactions
- Collect reverse proxy / load balancer logs & metrics
- Save application logs for the spike window — search for errors, timeouts, or stack traces.

---

## 6. Recommendations & mitigations

Short-term actions (quick to implement)
- Add a simple cache for GET /api/articles (Redis or in-memory) so large spikes hit the cache rather than DB.
- Introduce rate limiting or throttling at edge (nginx, API gateway) to protect backend from extremely sudden spikes.
- Reduce server-side request timeout and DB query timeout to fail fast and free resources instead of letting requests hang for 60s.
- Check and increase file descriptor (ulimit) limits and ephemeral port range if socket exhaustion suspected.

Medium-term actions
- Tune database (indexes on articles for the queries used by GET /articles, optimize joins / preloads).
- Tune the web server and reverse proxy (increase worker counts, accept backlog, tune keepalive / timeouts).
- Implement autoscaling (horizontal scaling of app instances) based on CPU/latency thresholds.
- Add a CDN or edge caching layer if the article list contains static assets or cacheable content.

Long-term actions
- Implement circuit breakers and graceful degradation: on overload, return a degraded but fast response (e.g., cached fallback, lighter payload).
- Add robust monitoring/alerting: RPS, latency p95/p99, DB connection pool usage, file descriptors.
- Add continuous load testing in CI or nightly jobs to detect regressions early.

---

## 7. Test script / measurement improvements

To make future runs easier to analyze:
- Save k6 results to JSON: `k6 run --out json=spike-test-results.json spike-test.js`
- Tag requests for per-endpoint metrics: e.g., use params.tags = { name: 'GET /articles' } in http.get so k6 groups metrics by tag.
- If realistic authentication is required, use setup() to login and include auth headers so test simulates realistic load paths.
- Consider running spike test from a machine/network close to the server or from multiple k6 workers to avoid k6 runner becoming the bottleneck (for very high connection counts).

---

## 8. Evidence you should attach to complete this deliverable

- k6 JSON output: k6-tests/spike-test-results.json
- k6 terminal screenshot: screenshots/k6_terminal_spike.png
- Server metrics screenshots timed to the spike window:
  - CPU and per-core usage (e.g., top/htop)
  - Memory usage over time (free/used)
  - DB active connections and slow queries screenshot
  - Reverse proxy metrics (if any)
  - Network bandwidth graphs (the run showed very high data_received)
- Application logs covering the spike time window
- Any Grafana / Prometheus charts you collected for the spike run

Placeholders for images to insert into the report:
- ![k6_spike_terminal](/screenshots/spike-test1.png)

---

## 9. Conclusions & next steps

- Spike test successfully revealed the system's behavior under an extreme, sudden increase to 500 VUs: elevated tail latency, connection/timeouts, and a ~3% failure rate. This is exactly the intent of spike testing.
- Next steps:
  1. Re-run the spike test saving JSON results.
  2. Collect server and DB metrics during the run.
  3. Investigate logs for timeouts/errors around the timestamps k6 reported long latencies/timeouts.
  4. Implement quick mitigations (edge rate-limiting, caching) and re-run to measure improvement.
  5. Document findings and attach the JSON + screenshots to `k6-spike-test-analysis.md` for submission.
