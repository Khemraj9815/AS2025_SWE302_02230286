# Assignment 2: Static & Dynamic Application Security Testing (SAST & DAST)

## Executive Summary
This report details the outcomes of security testing conducted on the application using both Static Application Security Testing (SAST) and Dynamic Application Security Testing (DAST) approaches. Industry-standard tools such as SonarQube and Snyk were used for SAST, while OWASP ZAP was utilized for DAST. The primary goal was to uncover security vulnerabilities, assess the effectiveness of current security controls, and recommend actions to strengthen the application's security.

## Key Findings Across All Tools

### Static Application Security Testing (SAST)
- **SonarQube** flagged several code maintainability issues and security hotspots in both the backend and frontend. Most findings were related to input validation, code quality, and potential injection vulnerabilities.
- **Snyk** identified multiple vulnerable dependencies in both projects, including some high-severity issues in outdated libraries. Automated fixes were applied where possible and verified.

### Dynamic Application Security Testing (DAST)
- **OWASP ZAP** revealed several security concerns during both passive and active scans. Notable issues included missing or improperly configured security headers, possible XSS vulnerabilities, and information leakage via HTTP responses.
- The API assessment highlighted weak input validation and insufficient authentication on certain endpoints.

### General Observations
- The most critical risks stemmed from outdated dependencies and inadequate input validation.
- Security headers like `Content-Security-Policy`, `X-Frame-Options`, and `Strict-Transport-Security` were either absent or not set up correctly.
- Some vulnerabilities were addressed during this assignment, as documented in the remediation reports.

## Remaining Risks
- **Unresolved Vulnerabilities:** Some medium and low-severity issues remain, mainly due to dependencies lacking secure updates or requiring significant code changes.
- **Security Hotspots:** Certain areas flagged by SonarQube need further manual review and mitigation.
- **Incomplete Security Headers:** Not all recommended headers are in place, leaving the application partially exposed to web threats.
- **Authentication and Authorization Gaps:** Some API endpoints still lack strong authentication and authorization, posing a risk of unauthorized access.
- **Ongoing Dependency Management:** Regular monitoring and timely updates of third-party libraries are necessary to prevent future vulnerabilities.

## Conclusion
Significant progress has been made in identifying and addressing security risks, but continued vigilance and periodic security reviews are crucial for maintaining a robust security posture. Remaining issues should be prioritized for remediation, with a focus on updating dependencies, strengthening security headers, and ensuring