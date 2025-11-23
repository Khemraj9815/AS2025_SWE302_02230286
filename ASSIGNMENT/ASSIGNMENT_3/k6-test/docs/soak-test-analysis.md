# k6 Soak Test Analysis

## 1. Executive summary

- Objective: Validate stability and resource behavior under sustained moderate load to detect memory leaks, connection leaks or performance degradation over time.
- Environment (run context you provided):
  - Script executed: soak-test2.js
  - Execution mode: local k6 run
  - Test duration: 34m0s total (2m ramp up → 30m steady at 50 VUs → 2m ramp down)
- High-level outcome:
  - Thresholds configured:
    - http_req_duration: p(95) < 500 ms (PASS — p95 = 12.37 ms)
    - http_req_duration: p(99) < 1000 ms (PASS — p99 = 15.1 ms)
    - http_req_failed: rate < 0.01 (PASS — rate = 0.00%)
  - No failed requests observed during this run.
  - Summary (from k6 terminal):
    - Total HTTP requests: 38,388
    - Average RPS: 18.77 req/s
    - Average http_req_duration: 5.29 ms
    - Median (p50): 6.65 ms
    - p90: 11.38 ms
    - p95: 12.37 ms
    - p99: 15.10 ms
    - Min: 205.91 µs
    - Max: 38.01 ms
    - Iterations: 19,194
    - vus_max: 50
    - Data received: ~21 GB
    - Data sent: ~3.1 MB

Quick verdict: The system remained stable for the 30-minute steady period at 50 VUs — latency stayed low, p95/p99 were well under thresholds, and no request failures occurred.

---

## 2. Test configuration

- Stages executed:
  - 2m ramp-up → target 50 VUs
  - 30m steady → target 50 VUs (reduced from full 3h for assignment)
  - 2m ramp-down → target 0 VUs
- User behavior (per VU loop):
  - http.get(`${BASE_URL}/articles`);
  - sleep(3);
  - http.get(`${BASE_URL}/tags`);
  - sleep(2);
- Thresholds enforced in script:
  - http_req_duration: ['p(95)<500', 'p(99)<1000']
  - http_req_failed: ['rate<0.01']

---

## 3. Aggregate metrics and interpretation

- Load and throughput:
  - Total requests: 38,388
  - Average throughput: 18.77 req/s
  - Iterations: 19,194 (avg iteration ≈ 5.01 s)
- Latency:
  - Avg request duration: 5.29 ms
  - Median: 6.65 ms
  - p90: 11.38 ms
  - p95: 12.37 ms
  - p99: 15.10 ms
  - Max: 38.01 ms
- Error rate:
  - http_req_failed: 0.00% (0 failures)
- Network:
  - Data received: ~21 GB (note: review payload sizes)
  - Data sent: ~3.1 MB

Interpretation:
- The latency distribution and very low errors indicate the application handled sustained moderate load (50 VUs) consistently with no obvious runtime degradation during the 30-minute steady window.
- No clear evidence of memory leaks, DB connection leaks, or resource exhaustion from k6 metrics alone — but system-side metrics are required to confirm.

---

## 4. Resource & leak detection guidance (what to collect & why)

k6 metrics alone cannot prove absence of leaks — you must collect server-side telemetry over the entire run:

Essential telemetry to capture (start before ramp-up and continue at least several minutes after ramp-down):
- Process memory (RSS/heap) over time — look for monotonic growth.
- Go heap/allocations (pprof) snapshots: take at start, midway (~15m), and end.
- Goroutine count over time.
- Open file descriptor count for process.
- Database active connections over time (pg_stat_activity or equivalent).
- CPU (per core) and load average.
- Network interface throughput and socket statistics (ss -s).
- Reverse proxy (nginx/traefik) active connections and worker metrics.
- Logs from application and DB for warnings/errors.

---

## 5. Findings from this run

- All k6-enforced thresholds passed comfortably.
- No request failures observed (0.00% http_req_failed).
- Latency is very low and stable across the steady window (p95 = 12.37 ms).
- Data received is substantial (~21 GB). Confirm whether article payloads are expected to be that large or if repeated large responses skew the network numbers.
- Because k6 results are stable, there is no immediate sign of runtime degradation over the 30-minute steady period; however, a 30-minute run is shorter than the 3-hour target in the assignment, so long-term leaks could still be present.

---

## 6. Recommendations & next steps

Immediate / short-term
- Attach and include server-side graphs/snapshots for this run (memory, CPU, DB connections, goroutine counts, FD counts) to confirm there was no drift.
- Save the k6 JSON output:
  - k6 run --out json=soak-test-results.json soak-test2.js
  - Add the JSON to the repository (k6-tests/soak-test-results.json) for record and parsing.
- Capture pprof (heap) snapshots at start/mid/end if your Go app exposes /debug/pprof — analyze retained objects if memory grows.

Medium term
- If you can, run the full 3-hour soak on a staging environment that mirrors production. This increases confidence against slow memory leaks or connection leaks.
- Correlate k6 p95/p99 over time with memory and DB connection graphs; if p95 drifts upward while memory/goroutines increase, debug memory retention and query patterns.
- If DB connections slowly increase, review connection lifecycle: ensure connections are released, and pool settings are adequate.

---

## 7. Evidence checklist (attach these files/screenshots to your submission)

- k6 JSON: k6-tests/soak-test-results.json
- k6 terminal screenshot: screenshots/k6_terminal_soak.png
- Server CPU/Memory graphs timed to the run: screenshots/server_cpu_mem_soak.png
- pprof heap snapshots: profiles/heap_start.pprof, profiles/heap_mid.pprof, profiles/heap_end.pprof
- DB connection snapshots: screenshots/db_connections_soak.png
- Application logs covering the run window: logs/app_soak_run.log

---

## 8. Quick jq commands to extract key numbers from the JSON

- Total requests:
  - jq '.metrics.http_reqs.count' soak-test-results.json
- Avg latency (ms):
  - jq '.metrics.http_req_duration.metrics.mean' soak-test-results.json
- p95:
  - jq '.metrics.http_req_duration.percentiles["95.00"]' soak-test-results.json
- p99:
  - jq '.metrics.http_req_duration.percentiles["99.00"]' soak-test-results.json
- Error count:
  - jq '.metrics.http_req_failed.count' soak-test-results.json

---

## 9. Conclusion

The 30-minute steady soak run at 50 VUs completed successfully with low latency and zero failed requests, and the configured thresholds were satisfied. To be confident there are no long-term leaks, run the full 3-hour soak on a staging environment with the telemetry described above; if that is not possible, at minimum provide periodic heap/goroutine snapshots and DB-connection-time series covering this run so we can rule out slow resource leaks.
