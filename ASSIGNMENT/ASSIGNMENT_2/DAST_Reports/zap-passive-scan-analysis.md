# **Alerts Summary**

* **Total Alerts Identified:** 12
* **Severity Distribution:**

  * **High:** 2
  * **Medium:** 3
  * **Low:** 4
  * **Informational:** 3

---

# **High-Severity Findings**

## **1. Missing Content Security Policy (CSP) Header**

* **Severity:** High
* **Affected Endpoints:**

  * `http://localhost:4100/`
  * `http://localhost:4100/api/*`
* **Issue Description:**
  The application does not return a `Content-Security-Policy` header. Without a CSP in place, the application is more susceptible to Cross-Site Scripting (XSS) and data injection attacks, as browsers lack guidance on which sources of content are trusted.
* **References:**

  * **CWE-693:** Protection Mechanism Failure
  * **OWASP Top 10 (A6:2017):** Security Misconfiguration

---

## **2. Session Cookie Missing the `Secure` Flag**

* **Severity:** High
* **Affected Endpoints:**

  * `http://localhost:4100/`
* **Issue Description:**
  Session cookies are being set without the `Secure` flag. This means cookies can be transmitted over unencrypted (HTTP) connections, increasing the risk of session hijacking or exposure through network eavesdropping.
* **References:**

  * **CWE-614:** Sensitive Cookie in Non-HTTPS Session
  * **OWASP Top 10 (A3:2017):** Sensitive Data Exposure

---

# **Commonly Observed Issues**

These issues frequently appear across multiple endpoints:

### **1. Missing or Weak Security Headers**

* Content-Security-Policy
* X-Frame-Options
* X-Content-Type-Options
* Strict-Transport-Security

### **2. Insecure Cookie Configuration**

* Cookies lacking `Secure` and/or `HttpOnly` flags
* Increases exposure to interception and client-side script access

### **3. Information Disclosure**

* Response headers may expose server/framework details such as `X-Powered-By`, aiding attackers in reconnaissance.

### **4. CORS Misconfiguration**

* `Access-Control-Allow-Origin` set to overly permissive value (e.g., `*`) or entirely missing.

---

# **Summary**

The ZAP passive analysis detected several high and medium-risk issues, predominantly related to missing security headers and improper cookie handling. Remediation of these findings—especially implementing CSP and securing session cookies—will significantly strengthen the overall security posture of the application.
