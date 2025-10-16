# Authentication Audit Logging

## Overview
All authentication-related activities are now tracked in the audit logs for security and compliance.

---

## Logged Authentication Events

### 1. **Successful Login** (`login`)
**Trigger:** User successfully logs in

**Data Logged:**
- User ID
- Email address
- IP address
- User agent (browser/device info)
- Timestamp

**Example:**
```json
{
  "action": "login",
  "module": "authentication",
  "new_values": {
    "user_id": 1,
    "email": "admin@ictinvent.com",
    "ip_address": "192.168.1.100",
    "user_agent": "Mozilla/5.0..."
  }
}
```

---

### 2. **Failed Login** (`login_failed`)
**Trigger:** User enters wrong credentials

**Data Logged:**
- Email address (attempted)
- IP address
- User agent
- Failure reason:
  - `user_not_found` - Email doesn't exist
  - `invalid_password` - Wrong password
- Timestamp

**Example:**
```json
{
  "action": "login_failed",
  "module": "authentication",
  "new_values": {
    "email": "hacker@example.com",
    "ip_address": "192.168.1.200",
    "user_agent": "curl/7.68.0",
    "reason": "user_not_found"
  }
}
```

**Security Use:** Detect brute force attacks, suspicious login attempts

---

### 3. **User Registration** (`register`)
**Trigger:** New user account created

**Data Logged:**
- User ID
- Email address
- Full name
- IP address
- Timestamp

**Example:**
```json
{
  "action": "register",
  "module": "authentication",
  "new_values": {
    "user_id": 5,
    "email": "newuser@ictinvent.com",
    "name": "New User",
    "ip_address": "192.168.1.150"
  }
}
```

---

### 4. **Logout** (`logout`)
**Trigger:** User logs out

**Data Logged:**
- User ID
- Email address
- IP address
- Timestamp

**Example:**
```json
{
  "action": "logout",
  "module": "authentication",
  "new_values": {
    "user_id": 1,
    "email": "admin@ictinvent.com",
    "ip_address": "192.168.1.100"
  }
}
```

---

## Viewing Authentication Logs

### In Audit Logs Page

**Filter by Module:**
- Select "authentication" from module dropdown

**Filter by Action:**
- `login` - Successful logins
- `login_failed` - Failed login attempts
- `register` - New registrations
- `logout` - User logouts

**Color Coding:**
- 🟢 **Green** - `login` (successful)
- 🔴 **Red** - `login_failed` (security alert)
- 🔵 **Blue** - `register` (new user)
- ⚫ **Gray** - `logout` (normal)

---

## Security Monitoring

### Detect Suspicious Activity

**1. Multiple Failed Logins**
```
Filter: action = "login_failed"
Sort: By IP address or email
```
→ Indicates brute force attack

**2. Login from New Location**
```
Filter: action = "login"
Compare: IP addresses for same user
```
→ Potential account compromise

**3. After-Hours Access**
```
Filter: action = "login"
Time: Outside business hours
```
→ Unauthorized access attempt

**4. Rapid Login/Logout**
```
Filter: action = "login" OR "logout"
User: Same user
Time: Within minutes
```
→ Possible bot activity

---

## SQL Queries for Analysis

### Failed Login Attempts (Last 24 Hours)
```sql
SELECT 
    new_values->>'$.email' as email,
    new_values->>'$.ip_address' as ip,
    COUNT(*) as attempts,
    MAX(created_at) as last_attempt
FROM audit_logs
WHERE action = 'login_failed'
  AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY email, ip
HAVING attempts > 3
ORDER BY attempts DESC;
```

### User Login History
```sql
SELECT 
    u.name,
    u.email,
    al.action,
    al.new_values->>'$.ip_address' as ip,
    al.created_at
FROM audit_logs al
JOIN users u ON al.user_id = u.id
WHERE al.module = 'authentication'
  AND al.action IN ('login', 'logout')
  AND u.id = 1
ORDER BY al.created_at DESC
LIMIT 50;
```

### Active Sessions (Logged in but not logged out)
```sql
SELECT 
    u.id,
    u.name,
    u.email,
    MAX(CASE WHEN al.action = 'login' THEN al.created_at END) as last_login,
    MAX(CASE WHEN al.action = 'logout' THEN al.created_at END) as last_logout
FROM users u
LEFT JOIN audit_logs al ON u.id = al.user_id 
    AND al.module = 'authentication'
GROUP BY u.id, u.name, u.email
HAVING last_login > COALESCE(last_logout, '1970-01-01')
ORDER BY last_login DESC;
```

---

## Compliance Benefits

✅ **ISO 27001** - Access control monitoring
✅ **SOC 2** - User activity tracking
✅ **GDPR** - Data access logging
✅ **PCI DSS** - Authentication logging
✅ **HIPAA** - User accountability

---

## Privacy Considerations

**What We Log:**
- ✅ Email addresses
- ✅ IP addresses
- ✅ User agents
- ✅ Timestamps

**What We DON'T Log:**
- ❌ Passwords (never logged)
- ❌ Session tokens
- ❌ Personal data beyond email/name
- ❌ Sensitive user information

---

## Retention Policy

**Recommended:**
- Keep authentication logs for **90 days** minimum
- Archive older logs for **1 year**
- Delete after retention period

**Implementation:**
```sql
-- Delete logs older than 90 days
DELETE FROM audit_logs 
WHERE module = 'authentication' 
  AND created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
```

---

## Alert Configuration

### Recommended Alerts

**1. Multiple Failed Logins**
- Threshold: 5 failed attempts in 15 minutes
- Action: Lock account, notify admin

**2. Login from New Country**
- Trigger: IP geolocation change
- Action: Email user, require 2FA

**3. Unusual Login Time**
- Trigger: Login outside 6 AM - 10 PM
- Action: Log for review

**4. Concurrent Sessions**
- Trigger: Login from 2+ IPs simultaneously
- Action: Force logout, notify user

---

## Summary

**All authentication activities are now tracked:**
- ✅ Login (successful)
- ✅ Login (failed)
- ✅ Registration
- ✅ Logout

**Benefits:**
- 🔒 Enhanced security monitoring
- 📊 User activity tracking
- 🚨 Breach detection
- 📋 Compliance reporting
- 🔍 Forensic investigation

**Your system now has complete authentication audit trails!** 🎉
