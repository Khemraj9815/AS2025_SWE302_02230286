## Overview

To strengthen the overall security of the RealWorld Conduit application, key HTTP security headers were added to both the backend (Go) and the frontend deployment layer. These headers provide protection against a wide range of web-based threats, including clickjacking, MIME-type spoofing, cross-site scripting, and insecure communication channels.

## Security Headers Added

### Backend (Go)

A middleware block was introduced in `hello.go` to append the following headers to every response:

```go
router.Use(func(c *gin.Context) {
    c.Header("X-Frame-Options", "DENY")
    c.Header("X-Content-Type-Options", "nosniff")
    c.Header("X-XSS-Protection", "1; mode=block")
    c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
    c.Header("Content-Security-Policy", "default-src 'self'")
    c.Next()
})
```

### Frontend Layer

Additional security headers were configured through the frontend’s deployment setup (such as Nginx, Apache, or cloud hosting header settings).

### What Each Header Does

* **X-Frame-Options: DENY**
  Blocks the application from being loaded inside an iframe, which protects users from clickjacking attempts.

* **X-Content-Type-Options: nosniff**
  Prevents browsers from guessing the content type of files, reducing the chance of malicious files being interpreted incorrectly.

* **X-XSS-Protection: 1; mode=block**
  Activates the browser’s built-in XSS detection and instructs it to block dangerous pages.
  *(Although modern browsers may deprecate this, it still adds layered protection.)*

* **Strict-Transport-Security: max-age=31536000; includeSubDomains**
  Forces clients to use HTTPS exclusively for a full year, covering the main domain and all subdomains.

* **Content-Security-Policy: default-src 'self'**
  Limits content loading to the same origin, reducing the likelihood of XSS or malicious content injection.

### Verification

A follow-up scan using OWASP ZAP confirmed that these headers were correctly applied and returned in all HTTP responses.

### Summary

By enabling these headers, the application gains additional safeguards against multiple classes of web attacks. These configurations should be periodically reviewed and updated to align with evolving security standards and browser behavior.
