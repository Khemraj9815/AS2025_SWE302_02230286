# Vulnerability Remediation Plan

This document outlines the critical, high, and medium/low priority security issues identified in the project, along with recommended remediation steps, estimated effort, and testing guidance.

---

## Critical Issues (Immediate Attention Required)

### 1. Predictable Value Range in `form-data`

* **Severity:** Critical (CVSS 9.4)
* **Package:** `form-data@2.3.3` (via `superagent@3.8.3`)
* **CVE:** CVE-2025-7783
* **Description:** Predictable values generated from previous outputs can lead to HTTP parameter manipulation or other security risks.
* **Remediation Steps:**

  1. Upgrade `superagent` to `10.2.2` or higher, which includes a secure version of `form-data` (`4.0.5+`).
  2. Review and update any existing code using `superagent` to align with potential API changes.
* **Estimated Fix Time:** 2–4 hours (including code updates, testing, and verification)

---

## High Priority Issues

### 2. Regular Expression Denial of Service (ReDoS) in `marked`

* **Severity:** Medium–High (CVSS up to 7.5)
* **Package:** `marked@0.3.19`
* **CVE:** CVE-2022-21680, CVE-2022-21681, others
* **Description:** Vulnerable regex patterns in markdown parsing can allow crafted input to cause high CPU usage, leading to Denial of Service.
* **Remediation Steps:**

  1. Upgrade `marked` to `4.0.10` or higher.
  2. Review markdown rendering code to ensure compatibility with the updated API.
* **Temporary Mitigation:**

  * Sanitize all user-supplied markdown input.
  * Limit the size of markdown input to reduce DoS risk.
* **Estimated Fix Time:** 1–2 hours

---

## Medium / Low Priority Issues

### Hardcoded Passwords in Test Files

* **Severity:** Low / Best Practice
* **Files:**

  * `src/components/Login.test.js` (lines 70, 99)
  * `src/reducers/auth.test.js` (lines 58, 65)
* **Description:** Hardcoded test credentials can pose a risk if accidentally reused or deployed.
* **Remediation:** Replace hardcoded values with environment variables or mocked secrets.
* **Risk Assessment:** Low if test credentials are not exposed in production.
* **Estimated Fix Time:** 30 minutes

---

## Dependency Upgrade Strategy

### Target Packages

| Package      | Current Version | Recommended Version | Purpose                                  |
| ------------ | --------------- | ------------------- | ---------------------------------------- |
| `superagent` | 3.8.3           | 10.2.2+             | Pulls in secure `form-data`              |
| `form-data`  | 2.3.3           | 4.0.5+              | Resolves predictable value vulnerability |
| `marked`     | 0.3.19          | 4.0.10+             | Fixes ReDoS vulnerabilities              |

### Potential Breaking Changes

* **superagent:** Major version upgrade may change API behavior. Review [changelog](https://github.com/visionmedia/superagent/releases) and update code accordingly.
* **marked:** Upgrading may affect markdown parsing/rendering. Verify markdown outputs for any regression.

---

## Testing Plan After Upgrades

1. Run all unit and integration tests.
2. Test markdown rendering and API calls using `superagent`.
3. Re-run Snyk (`snyk test` and `snyk code test`) to confirm all vulnerabilities are resolved.
4. Validate full application functionality in development and staging environments.

---

## Summary Table

| Issue                            | Severity | Package(s)            | Remediation                  | ETA     |
| -------------------------------- | -------- | --------------------- | ---------------------------- | ------- |
| Predictable Value in `form-data` | Critical | form-data, superagent | Upgrade superagent/form-data | 2–4 hrs |
| ReDoS in `marked`                | High     | marked                | Upgrade marked               | 1–2 hrs |
| Hardcoded passwords in tests     | Low      | N/A                   | Refactor test code           | 0.5 hr  |

---

**Notes:**

* Critical issues must be addressed immediately.
* High priority issues should be fixed as soon as possible to reduce risk.
* Medium/low priority issues should be tracked in upcoming sprints to maintain best practices.
