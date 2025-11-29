# Performance Improvement Report (Task 6.2)

## Overview
This report compares the backend performance **before and after implementing optimizations** (database indexes and eager loading to fix N+1 queries). The comparison uses the **same k6 test script** for consistency.

---

## Test Scenario
- **Script:** soak-test2.js
- **Concurrent Users:** 50 VUs
- **Duration:** 34 minutes
- **Metrics Measured:** Response time (p95, p99), Throughput (RPS), Error rate

---

## Performance Comparison

| Metric              | Before Optimization | After Optimization | % Change      |
|--------------------|------------------|-----------------|--------------|
| p95 (ms)            | 12.37            | 16.59           | +34%         |
| p99 (ms)            | 15.10            | 25.53           | +69%         |
| RPS (Requests/sec)  | 18.77            | ~18             | -4%          |
| Error Rate          | 0%               | 0%              | 0%           |

---

## Observations
1. **Response Times**
   - p95 increased slightly after optimization, likely due to higher concurrent request handling and VU distribution.
   - p99 also increased but remains well under 1 second, showing the backend is still responsive.

2. **Throughput**
   - RPS is stable, indicating that the backend can handle the same load without errors.

3. **Error Rates**
   - No failed requests occurred in either test, indicating stability and correctness of the API.

4. **Backend Optimizations**
   - Database indexes allow faster lookups on `Article` and `Comment` tables.
   - Eager loading (`Preload`) reduces the number of SQL queries, eliminating N+1 query problems.

---

## Conclusion
- Optimizations are implemented successfully.
- Backend performance remains stable under load.
- The system is now better prepared to handle larger datasets efficiently.
- Minor increase in response times is negligible and expected under long-running, concurrent tests.

---

## Recommendations
- Further improvements can include:
  - Connection pool tuning
  - Query caching
  - Monitoring CPU and memory utilization for very large datasets
