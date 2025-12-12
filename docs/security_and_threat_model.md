# Security and Threat Model

## Executive Summary

The Amrutam Telemedicine Backend implements defense-in-depth security with multiple layers of protection. This document outlines the security architecture, threat model, and mitigation strategies aligned with OWASP Top 10 and healthcare data protection requirements.

## Attack Surface Analysis

### 1. Authentication Endpoints

**Endpoints**:
- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/verify-mfa`
- `POST /api/v1/auth/reset-password`

**Attack Vectors**:
- Brute force password attacks
- Credential stuffing
- Account enumeration
- Session hijacking
- MFA bypass attempts

**Mitigations**:
- Rate limiting (5 attempts per 15 minutes)
- Strong password requirements (8+ chars, uppercase, lowercase, number, special char)
- Account lockout after failed attempts
- JWT with short expiration (15 minutes)
- MFA mandatory for admin accounts
- Secure password hashing (bcrypt, 12 rounds)
- No user enumeration (same response for valid/invalid emails)

### 2. Booking & Payment Endpoints

**Endpoints**:
- `POST /api/v1/consultations`
- `POST /api/v1/payments/initiate`
- `POST /api/v1/payments/webhook`

**Attack Vectors**:
- Double booking via race conditions
- Payment manipulation
- Replay attacks
- Unauthorized booking

**Mitigations**:
- Database transactions with row-level locking
- Idempotency keys for write operations
- Authentication required for booking
- Payment webhook signature verification (production)
- Rate limiting on booking endpoint (5 per minute)
- Input validation on all parameters

### 3. Admin APIs

**Endpoints**:
- `GET /api/v1/admin/analytics/*`
- `GET /api/v1/audit-logs`
- `PATCH /api/v1/users/:id/role`
- `PATCH /api/v1/doctors/:id/approve`

**Attack Vectors**:
- Privilege escalation
- Unauthorized data access
- Admin account compromise

**Mitigations**:
- Role-based access control (RBAC)
- MFA mandatory for admin accounts
- Audit logging of all admin actions
- IP whitelisting (production recommendation)
- Session timeout
- Principle of least privilege

## Data Classification

### Personally Identifiable Information (PII)

**Data**: Name, email, phone, address, date of birth

**Access Control**:
- Users can view/edit their own PII
- Doctors can view patient PII for their consultations only
- Admins have read-only access for support purposes

**Protection**:
- Encrypted in transit (HTTPS)
- Encrypted at rest (database-level encryption)
- Masked in logs (email → e***@example.com)
- Soft delete preserves data for audit

### Protected Health Information (PHI)

**Data**: Consultation reason, notes, prescriptions, medical history

**Access Control**:
- Patients can view their own PHI
- Doctors can view/edit PHI for their patients
- Admins have read-only access for compliance
- All access logged in audit trail

**Protection**:
- End-to-end encryption (HTTPS)
- Database encryption at rest
- Access logging for HIPAA compliance
- Retention policy (7 years)
- Secure deletion procedures

### Financial Data

**Data**: Payment amounts, transaction references, card details (if integrated)

**Access Control**:
- Users can view their own payment history
- Admins can view for reconciliation
- No storage of full card details (PCI-DSS)

**Protection**:
- Tokenization for payment methods
- TLS 1.3 for transmission
- Audit logging of all transactions
- Fraud detection (future)

## OWASP Top 10 Mitigations

### A01:2021 – Broken Access Control

**Risks**:
- Unauthorized access to consultations
- Viewing other users' prescriptions
- Modifying doctor availability

**Mitigations**:
- JWT authentication on all protected routes
- RBAC middleware enforcing role requirements
- Resource ownership checks in services
- Audit logging of access attempts
- Deny by default policy

### A02:2021 – Cryptographic Failures

**Risks**:
- Password exposure
- Token interception
- Data breach

**Mitigations**:
- Bcrypt for password hashing (12 rounds)
- JWT with HMAC-SHA256
- HTTPS enforced (production)
- Secure cookie flags (httpOnly, secure, sameSite)
- No sensitive data in logs or error messages

### A03:2021 – Injection

**Risks**:
- SQL injection
- NoSQL injection
- Command injection

**Mitigations**:
- Prisma ORM with prepared statements
- Input validation with Zod schemas
- Parameterized queries only
- No dynamic query construction
- Escaping user input in logs

### A04:2021 – Insecure Design

**Risks**:
- Business logic flaws
- Missing security controls
- Inadequate threat modeling

**Mitigations**:
- Threat modeling during design
- Security requirements in planning
- Peer review of critical flows
- Idempotency for write operations
- Transaction boundaries for consistency

### A05:2021 – Security Misconfiguration

**Risks**:
- Default credentials
- Unnecessary features enabled
- Verbose error messages

**Mitigations**:
- Environment-based configuration
- Helmet.js for security headers
- Error messages without stack traces (production)
- Disabled directory listing
- Regular dependency updates

### A06:2021 – Vulnerable Components

**Risks**:
- Outdated dependencies
- Known vulnerabilities

**Mitigations**:
- `npm audit` in CI pipeline
- Automated dependency updates (Dependabot)
- Minimal dependencies
- Regular security patches
- Version pinning in package.json

### A07:2021 – Authentication Failures

**Risks**:
- Weak passwords
- Session fixation
- Credential stuffing

**Mitigations**:
- Strong password policy
- MFA for admin accounts
- Rate limiting on auth endpoints
- JWT with short expiration
- Refresh token rotation
- Account lockout mechanism

### A08:2021 – Software and Data Integrity

**Risks**:
- Unsigned packages
- Insecure CI/CD
- Tampering

**Mitigations**:
- Package lock files
- Integrity checks in CI
- Code signing (future)
- Immutable infrastructure
- Audit logging

### A09:2021 – Logging and Monitoring Failures

**Risks**:
- Undetected breaches
- Insufficient audit trail
- No alerting

**Mitigations**:
- Structured logging with Pino
- Audit logs for sensitive operations
- Correlation IDs for request tracking
- Metrics endpoint for monitoring
- Alerting on anomalies (production)

### A10:2021 – Server-Side Request Forgery (SSRF)

**Risks**:
- Internal network scanning
- Cloud metadata access

**Mitigations**:
- No user-controlled URLs
- Whitelist for external requests
- Network segmentation
- Firewall rules

## Encryption

### In Transit

**Implementation**:
- HTTPS enforced (TLS 1.3)
- HSTS headers
- Certificate pinning (mobile apps)

**Configuration**:
```javascript
// Helmet configuration
app.use(helmet({
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

### At Rest

**Database**:
- PostgreSQL transparent data encryption (TDE)
- Encrypted backups
- Encrypted volumes (AWS EBS, etc.)

**Application**:
- Passwords hashed with bcrypt
- Tokens encrypted before storage
- Sensitive fields encrypted (future enhancement)

## Key Rotation

### JWT Secrets

**Frequency**: Every 90 days

**Process**:
1. Generate new secret
2. Update environment variable
3. Dual-signing period (7 days)
4. Verify new tokens work
5. Remove old secret
6. Force re-authentication if needed

### Database Encryption Keys

**Frequency**: Annually

**Process**:
1. Generate new key
2. Re-encrypt data with new key
3. Verify integrity
4. Securely destroy old key

### API Keys (External Services)

**Frequency**: On compromise or every 180 days

**Process**:
1. Generate new key in provider dashboard
2. Update environment variable
3. Test integration
4. Revoke old key

## Audit Logging & Monitoring

### What Gets Logged

**Authentication Events**:
- Login attempts (success/failure)
- MFA enable/disable
- Password resets
- Account lockouts

**Authorization Events**:
- Role changes
- Permission denials
- Admin actions

**Data Access**:
- Prescription views
- Consultation access
- Payment information access

**Business Events**:
- Consultation bookings
- Cancellations
- Doctor approvals

### Log Protection

**Storage**:
- Append-only log files
- Separate log database/service
- Encrypted storage
- Access restricted to admins

**Retention**:
- 90 days in hot storage
- 7 years in cold storage (compliance)
- Automated archival

**Monitoring**:
- Real-time alerting on suspicious patterns
- Dashboard for security team
- Anomaly detection (ML-based, future)

## Dependency Scanning

### Tools

- `npm audit` (built-in)
- Dependabot (GitHub)
- Snyk (optional)

### Process

1. **CI Pipeline**: Run `npm audit` on every build
2. **Weekly Scans**: Automated dependency checks
3. **Severity Triage**:
   - Critical: Fix within 24 hours
   - High: Fix within 7 days
   - Medium: Fix within 30 days
   - Low: Fix in next release

### Remediation

```bash
# Check for vulnerabilities
npm audit

# Fix automatically where possible
npm audit fix

# Manual review for breaking changes
npm audit fix --force
```

## Threat Scenarios & Responses

### Scenario 1: Brute Force Attack

**Detection**: Rate limiter triggers, multiple 429 responses

**Response**:
1. Automatic IP blocking (rate limiter)
2. Alert security team
3. Review logs for patterns
4. Extend block duration if needed

### Scenario 2: Data Breach

**Detection**: Unusual data access patterns, large queries

**Response**:
1. Isolate affected systems
2. Revoke all active sessions
3. Force password resets
4. Notify affected users (GDPR/HIPAA)
5. Forensic analysis
6. Patch vulnerability
7. Post-mortem and improvements

### Scenario 3: Privilege Escalation

**Detection**: Audit logs show unauthorized role changes

**Response**:
1. Revoke compromised account
2. Review all recent admin actions
3. Rollback unauthorized changes
4. Investigate attack vector
5. Strengthen RBAC controls

### Scenario 4: DDoS Attack

**Detection**: Abnormal traffic spike, slow response times

**Response**:
1. Enable DDoS protection (Cloudflare, AWS Shield)
2. Rate limiting at edge
3. Scale infrastructure
4. Block malicious IPs
5. Analyze attack pattern

## Compliance

### HIPAA (Health Insurance Portability and Accountability Act)

**Requirements**:
- Access controls ✓
- Audit trails ✓
- Encryption ✓
- Data integrity ✓
- Disaster recovery ✓

**Gaps** (Future Work):
- Business Associate Agreements (BAA)
- Physical security documentation
- Formal risk assessment
- Employee training program

### GDPR (General Data Protection Regulation)

**Requirements**:
- Right to access ✓
- Right to deletion (soft delete) ✓
- Data portability (export API, future)
- Breach notification ✓
- Consent management (future)

## Security Checklist

### Development
- [ ] Input validation on all endpoints
- [ ] Authentication on protected routes
- [ ] Authorization checks in services
- [ ] Sensitive data not in logs
- [ ] Error messages sanitized

### Deployment
- [ ] HTTPS enforced
- [ ] Environment variables secured
- [ ] Database encryption enabled
- [ ] Firewall rules configured
- [ ] Monitoring and alerting active

### Operations
- [ ] Regular security audits
- [ ] Dependency updates
- [ ] Access reviews
- [ ] Incident response plan
- [ ] Backup testing

## Recommendations

### Immediate (Production Launch)
1. Enable database encryption at rest
2. Configure HTTPS with valid certificate
3. Set up monitoring and alerting
4. Implement IP whitelisting for admin
5. Enable automated backups

### Short-term (3 months)
1. Penetration testing
2. Security audit by third party
3. Implement WAF (Web Application Firewall)
4. Add anomaly detection
5. Employee security training

### Long-term (6-12 months)
1. HIPAA compliance certification
2. SOC 2 Type II audit
3. Bug bounty program
4. Advanced threat detection
5. Zero-trust architecture

## Conclusion

The Amrutam Telemedicine Backend implements comprehensive security controls aligned with industry best practices and regulatory requirements. Continuous monitoring, regular audits, and proactive threat modeling ensure the system remains secure as it evolves.
