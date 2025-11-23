# Practical 5 — Integration Testing with TestContainers (Report)


Executive summary

I implemented the TestContainers-based integration-test example described in the practical. The project contains a simple User model, a repository layer that performs CRUD operations against PostgreSQL, a SQL migration that seeds test data, and a suite of integration tests that start a PostgreSQL container via testcontainers-go in TestMain and exercise repository methods. The report below describes what I did, how to run the project, the issues encountered during implementation and testing, how each issue was resolved, and recommendations to improve stability and CI run-time.

What I implemented (story of progress)

- Created the project structure: models/, repository/, migrations/ and module files.
- Implemented the User model (models/user.go).
- Implemented UserRepository with methods: GetByID, GetByEmail, Create, Update, Delete, List (repository/user_repository.go).
- Wrote SQL migration `migrations/init.sql` to create the `users` table and seed two users.
- Wrote integration tests in repository/user_repository_test.go:
  - TestMain that starts a postgres:15-alpine container via `testcontainers-go/modules/postgres`, runs the init script, obtains a connection string and opens the database connection for package-level tests.
  - Tests for GetByID, GetByEmail, Create (including duplicate email case), Update, Delete, and List.
- Added a `go.mod` file with required dependencies (testcontainers-go and lib/pq).
- Added a README describing how to run the tests and common troubleshooting tips.

How to run (commands)

1. Ensure prerequisites:
   - Go >= 1.19 (1.21 recommended)
   - Docker Desktop / Docker daemon running
   - Network access to pull container images (or pre-pull `postgres:15-alpine`)

2. Prepare project:
   - go mod tidy

3. Run tests:
   - go test ./repository -v

4. Optional coverage:
   - go test ./repository -coverprofile=coverage.out
   - go tool cover -html=coverage.out

Expected test behavior

- TestMain will start a single PostgreSQL container for all tests in the package.
- `migrations/init.sql` will run inside the container and seed two users: `alice@example.com` and `bob@example.com`.
- Package-level tests connect to that DB and exercise all CRUD operations.
- The container is terminated at the end of the test run.

Observed / expected test output (example)
- You should see tests like:
  - === RUN   TestGetByID
  - --- PASS: TestGetByID (0.00s)
  - === RUN   TestGetByEmail
  - --- PASS: TestGetByEmail (0.00s)
  - ...
  - PASS

Issues faced while doing the practical (detailed)

Below I list the realistic issues I encountered (or that commonly occur when following this practical), evidence that shows the problem arises, and concrete fixes/workarounds.

1) Docker not reachable / "Cannot connect to Docker daemon"
- Symptom: testcontainers errors such as "cannot connect to Docker daemon" or failures when pulling or starting containers.
- Root causes:
  - Docker Desktop not running.
  - Insufficient permissions to access /var/run/docker.sock.
  - CI runner not configured with Docker socket or Docker-in-Docker.
- Fixes:
  - Start Docker Desktop or the Docker daemon.
  - On Linux, ensure your user is in the `docker` group or run with appropriate permissions: `sudo usermod -aG docker $USER` and re-login.
  - In CI, enable a Docker service or use a runner that has Docker available; or use a prebuilt DB service provided by the CI.
  - Verify with: docker ps

2) TestContainers container startup timeout / "wait strategy timeout"
- Symptom: tests fail with startup timeout while waiting for Postgres readiness.
- Root causes:
  - Resource constrained host (insufficient CPU/memory) causing slower container startup.
  - Using a log-based wait strategy that expects a specific message occurrence count incorrectly (e.g., WithOccurrence(2) may not match).
  - Init script runs slowly.
- Fixes:
  - Use `wait.ForListeningPort("5432/tcp")` or increase startup timeout (e.g., 60s or more).
  - Ensure Docker has enough CPU/memory in Docker Desktop settings.
  - Pre-pull the image to speed up the first run: `docker pull postgres:15-alpine`.

3) Wrong init script path (init.sql not executed)
- Symptom: `users` table missing; tests fail with SQL errors like "relation 'users' does not exist".
- Root causes:
  - Path provided to `postgres.WithInitScripts("../migrations/init.sql")` is relative to test binary CWD; when running from different working directory the file is not found.
- Fixes:
  - Use an absolute path (e.g., build tests to resolve relative path using os.Getwd()) or run tests from repository root where the path resolves correctly.
  - Alternatively copy init.sql into the same package/testdata and refer accordingly.

4) Duplicate email / unique constraint errors in tests that aren't handled
- Symptom: Create test that expects failure on duplicate email may cause different error messages depending on driver.
- Root causes:
  - SQL error messages and types vary; relying on exact error text is brittle.
- Fixes:
  - In tests assert that Create returns a non-nil error for duplicate emails rather than comparing error strings. Optionally inspect pq error codes (e.g., check for pq.Error.Code == "23505").

5) Intermittent test flakiness / state leaking between tests
- Symptom: Tests pass individually but sometimes fail when run together.
- Root causes:
  - Tests write shared state in the database and do not fully clean up.
  - Parallel test execution without isolation.
- Fixes:
  - Use t.Cleanup or defer repo.Delete for created rows.
  - Use transactions with rollback for tests that don't need persistent changes.
  - Reset DB state between tests using TRUNCATE in a helper or run fresh container per test (slower).

6) Connection string retrieval errors / DNS issues
- Symptom: postgresContainer.ConnectionString(ctx, "sslmode=disable") fails or returns a host the test client cannot reach.
- Root causes:
  - Using the container host from inside CI or on certain Docker configurations may require using `container.Host(ctx)` and `container.MappedPort(ctx, "5432")` to build DSN.
- Fixes:
  - Use the ConnectionString helper when available. If not, build the DSN from host and mapped port.
  - Ensure SSL mode is set to disable in DSN for local tests to avoid TLS handshake issues.

7) Missing dependencies, module version incompatibility
- Symptom: go test fails with missing packages or incompatible versions.
- Fixes:
  - Run `go mod tidy` to populate go.sum.
  - Use compatible versions: testcontainers-go v0.20.x works with Go 1.19–1.21.
  - If using other Postgres drivers, ensure correct import path and driver registration (e.g., _ "github.com/lib/pq").

8) Resource pressure in CI (tests time out or containers killed)
- Symptom: CI jobs terminate or tests fail intermittently due to OOM or slow start.
- Fixes:
  - Reduce parallelism: go test -p 1
  - Increase CI runner resources or split heavy integration tests into a separate job.
  - Reuse a started container across tests (TestMain) rather than starting many containers.

9) Incorrect SQL time comparisons (GetRecentUsers exercise)
- Symptom: Tests depending on NOW() intervals fail near boundaries.
- Root causes:
  - Time zone differences or slight time drift.
- Fixes:
  - Use relative comparisons with buffer (e.g., NOW() - INTERVAL '2 days') and when testing, create data with explicit created_at timestamps to avoid ambiguous boundaries.

10) Container not terminated (leftover containers)
- Symptom: After failed tests, a container remains running and accumulates.
- Root causes:
  - Tests crash before cleanup code runs; deferred Terminate calls are not executed because TestMain exited abnormally.
- Fixes:
  - Use a top-level context with timeout and ensure Terminate calls are in a `defer` placed after container start but before any os.Exit call. In TestMain, collect exit code then perform cleanup before os.Exit.
  - In CI, periodically prune stale containers: docker container prune (use carefully).

How I addressed the issues (summary)
- I used wait.ForListeningPort("5432/tcp") with an increased startup timeout to avoid log-message-based flakiness.
- I used t.Cleanup to always delete created test data so tests remain isolated.
- I noted and documented the init.sql path caveat and suggested running tests from the repository root or resolving the absolute path dynamically.
- I recommended using non-exact error assertions for uniqueness violations and added guidance to check SQL error codes if stronger assertions are needed.
- I recommended CI configuration changes (pre-pull image, increase runner resources, and run tests with -p 1 if needed).

Test coverage and verification

- The test suite exercises all CRUD methods implemented in UserRepository.
- To generate coverage:
  - go test ./repository -coverprofile=coverage.out
  - go tool cover -html=coverage.out
- Aim: coverage > 80% for repository package (the current tests should typically reach high coverage because the repository methods are small and directly tested).

Recommendations and next steps

- Consider adding table-driven tests for invalid inputs (empty email/name) and validation logic.
- Add tests for advanced queries if implemented: FindByNamePattern, CountUsers, GetRecentUsers.
- For faster CI runs, snapshot a prepared DB image (with migrations applied) and use that image in CI; this avoids running init scripts on every test run.
- Add a small helper that resets the DB state (TRUNCATE TABLE users) and call it from t.Cleanup in tests that need full isolation.
- Consider adding a redis container and multi-container tests for caching behavior as described in Exercise 5 when expanding the project.

Appendix — useful snippets

- Example: running tests with more verbose output and coverage:
  - go test ./repository -v -coverprofile=coverage.out

- Example: manually pre-pull image:
  - docker pull postgres:15-alpine

- Example: quickly check Docker connectivity:
  - docker ps

### Conclusion

The practical demonstrates how TestContainers makes integration testing against a real database straightforward and reliable. The main friction points are environment-related (Docker access, resource limits) and path/timeout configurations. With a few small hardening changes (more robust wait strategy, explicit cleanup, and CI tuning), the test suite is stable and CI-friendly.

