# Cloudflare + Railway Domain Configuration Guide

> Complete setup guide for configuring `sidra.sd` with Cloudflare (Free Plan) and Railway

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Step 1: Create Cloudflare Account](#step-1-create-cloudflare-account)
4. [Step 2: Add Domain to Cloudflare](#step-2-add-domain-to-cloudflare)
5. [Step 3: Update Nameservers](#step-3-update-nameservers)
6. [Step 4: Get Railway CNAME Values](#step-4-get-railway-cname-values)
7. [Step 5: Configure DNS Records](#step-5-configure-dns-records)
8. [Step 6: Configure SSL/TLS Settings](#step-6-configure-ssltls-settings)
9. [Step 7: Verify Domain in Railway](#step-7-verify-domain-in-railway)
10. [Step 8: Additional Cloudflare Optimizations](#step-8-additional-cloudflare-optimizations)
11. [Troubleshooting](#troubleshooting)
12. [DNS Propagation](#dns-propagation)

---

## Overview

### Architecture

```
User Request
     ↓
[Cloudflare Edge Network]
  - CDN Caching
  - DDoS Protection
  - SSL Termination
     ↓
[Railway Proxy]
  - Load Balancing
  - SSL (Let's Encrypt)
     ↓
[Your Application]
  - Web (Next.js)
  - API (NestJS)
```

### Domain Structure

| Domain | Service | Environment |
|--------|---------|-------------|
| `sidra.sd` | Web App | Production |
| `www.sidra.sd` | Web App (redirect) | Production |
| `api.sidra.sd` | API | Production |
| `staging.sidra.sd` | Web App | Staging |
| `api-staging.sidra.sd` | API | Staging |

---

## Prerequisites

- [ ] Access to your domain registrar (where you bought `sidra.sd`)
- [ ] Railway account with deployed services
- [ ] Email address for Cloudflare account

---

## Step 1: Create Cloudflare Account

1. Go to [cloudflare.com](https://cloudflare.com)
2. Click **Sign Up**
3. Enter your email and create a password
4. Verify your email address

---

## Step 2: Add Domain to Cloudflare

1. Log in to Cloudflare dashboard
2. Click **Add a Site** (or **+ Add Site** button)
3. Enter your domain: `sidra.sd`
4. Click **Add Site**
5. Select **Free** plan → Click **Continue**
6. Cloudflare will scan your existing DNS records
7. Review the records (you can modify them later) → Click **Continue**

---

## Step 3: Update Nameservers

Cloudflare will provide you with two nameservers, something like:

```
alice.ns.cloudflare.com
bob.ns.cloudflare.com
```

### At Your Domain Registrar:

1. Log in to your domain registrar (where you purchased `sidra.sd`)
2. Find **DNS Settings** or **Nameservers** section
3. Replace the current nameservers with Cloudflare's nameservers
4. Save changes

> **Note:** Nameserver changes can take up to 24-48 hours to propagate globally, but usually complete within 1-2 hours.

### Verify Nameserver Change:

Back in Cloudflare:
1. Click **Done, check nameservers**
2. Cloudflare will periodically check until nameservers are updated
3. You'll receive an email when your site is active on Cloudflare

---

## Step 4: Get Railway CNAME Values

For each service you want to add a custom domain to:

### Production Web App:

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Select your **Production** project
3. Click on the **Web** service
4. Go to **Settings** tab
5. Scroll to **Public Networking** section
6. Click **+ Custom Domain**
7. Enter: `sidra.sd`
8. Railway will show you a CNAME value like: `xxx.up.railway.app`
9. **Copy this value** (you'll need it for Cloudflare)
10. Repeat for `www.sidra.sd`

### Production API:

1. Click on the **API** service
2. Go to **Settings** → **Public Networking**
3. Click **+ Custom Domain**
4. Enter: `api.sidra.sd`
5. Copy the CNAME value

### Staging Services:

Repeat the same process for staging:
- `staging.sidra.sd` → Staging Web service
- `api-staging.sidra.sd` → Staging API service

### Example CNAME Values (yours will be different):

| Domain | Railway CNAME |
|--------|---------------|
| `sidra.sd` | `a1b2c3.up.railway.app` |
| `www.sidra.sd` | `a1b2c3.up.railway.app` |
| `api.sidra.sd` | `d4e5f6.up.railway.app` |
| `staging.sidra.sd` | `g7h8i9.up.railway.app` |
| `api-staging.sidra.sd` | `j0k1l2.up.railway.app` |

---

## Step 5: Configure DNS Records

In Cloudflare Dashboard:

1. Go to **DNS** → **Records**
2. Delete any existing A or CNAME records that conflict
3. Add the following records:

### Production Records:

| Type | Name | Target | Proxy | TTL |
|------|------|--------|-------|-----|
| CNAME | `@` | `a1b2c3.up.railway.app` | ☁️ Proxied (Orange) | Auto |
| CNAME | `www` | `a1b2c3.up.railway.app` | ☁️ Proxied (Orange) | Auto |
| CNAME | `api` | `d4e5f6.up.railway.app` | ☁️ Proxied (Orange) | Auto |

### Staging Records:

| Type | Name | Target | Proxy | TTL |
|------|------|--------|-------|-----|
| CNAME | `staging` | `g7h8i9.up.railway.app` | ☁️ Proxied (Orange) | Auto |
| CNAME | `api-staging` | `j0k1l2.up.railway.app` | ☁️ Proxied (Orange) | Auto |

### How to Add Each Record:

1. Click **+ Add Record**
2. Select **Type**: `CNAME`
3. **Name**: Enter the subdomain (e.g., `@` for root, `www`, `api`)
4. **Target**: Paste the Railway CNAME value
5. **Proxy status**: Keep it **Proxied** (orange cloud)
6. **TTL**: Auto
7. Click **Save**

> **Note:** The `@` symbol represents the root domain (`sidra.sd`). Cloudflare's CNAME flattening allows this to work even though traditionally CNAMEs can't be used at the apex/root.

---

## Step 6: Configure SSL/TLS Settings

**This is critical for Railway + Cloudflare to work correctly!**

1. In Cloudflare Dashboard, go to **SSL/TLS** → **Overview**
2. Set encryption mode to **Full** (NOT "Full (Strict)")

```
┌─────────────────────────────────────────────────────┐
│  SSL/TLS Encryption Mode                            │
├─────────────────────────────────────────────────────┤
│  ○ Off (not secure)                                 │
│  ○ Flexible                                         │
│  ● Full           ← SELECT THIS                     │
│  ○ Full (Strict)  ← DO NOT USE WITH RAILWAY         │
└─────────────────────────────────────────────────────┘
```

### Why "Full" and not "Full (Strict)"?

- **Full**: Encrypts traffic between Cloudflare and Railway, accepts Railway's auto-generated Let's Encrypt certificate
- **Full (Strict)**: Requires a certificate that matches your exact domain, which Railway's shared certificate doesn't provide

### Additional SSL Settings:

1. Go to **SSL/TLS** → **Edge Certificates**
2. Enable **Always Use HTTPS**: ON
3. Enable **Automatic HTTPS Rewrites**: ON
4. Set **Minimum TLS Version**: TLS 1.2

---

## Step 7: Verify Domain in Railway

After DNS propagation (usually 5-30 minutes):

1. Go back to Railway Dashboard
2. Check each service's **Settings** → **Public Networking**
3. Your custom domains should show a **green checkmark** ✓
4. If not verified yet:
   - Click **Verify** or wait a few more minutes
   - Railway will automatically issue an SSL certificate once verified

### Test Your Domains:

```bash
# Test production
curl -I https://sidra.sd
curl -I https://api.sidra.sd/health

# Test staging
curl -I https://staging.sidra.sd
curl -I https://api-staging.sidra.sd/health
```

Expected response should include:
```
HTTP/2 200
server: cloudflare
```

---

## Step 8: Additional Cloudflare Optimizations

These free features will improve your site's performance:

### 1. Enable Caching

Go to **Caching** → **Configuration**:
- **Caching Level**: Standard
- **Browser Cache TTL**: 4 hours (or as needed)

### 2. Enable Auto Minify

Go to **Speed** → **Optimization** → **Content Optimization**:
- Enable **Auto Minify** for JavaScript, CSS, HTML

### 3. Enable Brotli Compression

Go to **Speed** → **Optimization** → **Content Optimization**:
- Enable **Brotli**: ON

### 4. Set Up Page Rules (Optional)

Go to **Rules** → **Page Rules** (3 free rules available):

**Rule 1: Force HTTPS**
- URL: `*sidra.sd/*`
- Setting: Always Use HTTPS

**Rule 2: Cache Static Assets**
- URL: `*sidra.sd/*.js`
- Setting: Cache Level → Cache Everything
- Edge Cache TTL: 1 month

### 5. WWW Redirect (Optional)

Go to **Rules** → **Redirect Rules**:
- Create rule to redirect `www.sidra.sd` to `sidra.sd` (or vice versa)

---

## Troubleshooting

### Domain Not Verifying in Railway

**Symptoms:** Domain shows "Pending" or "Not Verified" in Railway

**Solutions:**
1. Check DNS records are correctly configured in Cloudflare
2. Ensure proxy is enabled (orange cloud)
3. Verify SSL/TLS mode is set to "Full"
4. Wait up to 30 minutes for propagation
5. Try clicking "Verify" button in Railway

### ERR_SSL_VERSION_OR_CIPHER_MISMATCH

**Cause:** SSL/TLS mode is set to "Full (Strict)"

**Solution:** Change SSL/TLS mode to "Full" (not strict)

### 522 Connection Timed Out

**Cause:** Cloudflare can't connect to Railway

**Solutions:**
1. Verify Railway service is running
2. Check Railway service has a valid port configured
3. Ensure the CNAME target is correct

### 526 Invalid SSL Certificate

**Cause:** SSL/TLS mode mismatch

**Solution:** Set SSL/TLS mode to "Full"

### Too Many Redirects (ERR_TOO_MANY_REDIRECTS)

**Cause:** SSL/TLS mode set to "Flexible" while app forces HTTPS

**Solutions:**
1. Set SSL/TLS mode to "Full"
2. Or disable "Always Use HTTPS" in Cloudflare (not recommended)

### DNS_PROBE_FINISHED_NXDOMAIN

**Cause:** DNS not propagated or nameservers not updated

**Solutions:**
1. Verify nameservers are set to Cloudflare at your registrar
2. Wait up to 48 hours for propagation
3. Check with: `nslookup sidra.sd`

---

## DNS Propagation

### Check DNS Propagation Status:

Use these tools to verify your DNS changes have propagated:

- [whatsmydns.net](https://www.whatsmydns.net/) - Global DNS propagation checker
- [dnschecker.org](https://dnschecker.org/) - DNS lookup tool

### Expected Timeline:

| Change | Typical Time |
|--------|--------------|
| Cloudflare DNS records | 1-5 minutes |
| Nameserver change | 1-48 hours |
| SSL certificate issuance | 5-15 minutes |

---

## Final Checklist

- [ ] Cloudflare account created
- [ ] Domain added to Cloudflare
- [ ] Nameservers updated at registrar
- [ ] Nameservers verified in Cloudflare
- [ ] Railway CNAME values obtained
- [ ] DNS records configured in Cloudflare
- [ ] SSL/TLS mode set to "Full"
- [ ] Always Use HTTPS enabled
- [ ] Domains verified in Railway (green checkmark)
- [ ] All domains accessible via HTTPS
- [ ] API health endpoints responding

---

## Quick Reference

### Cloudflare Dashboard URLs:
- Dashboard: https://dash.cloudflare.com
- DNS: https://dash.cloudflare.com/?to=/:account/:zone/dns
- SSL/TLS: https://dash.cloudflare.com/?to=/:account/:zone/ssl-tls

### Railway Dashboard:
- Dashboard: https://railway.app/dashboard

### Your Domains After Setup:

| Environment | Web | API |
|-------------|-----|-----|
| Production | https://sidra.sd | https://api.sidra.sd |
| Staging | https://staging.sidra.sd | https://api-staging.sidra.sd |

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-31 | Claude Code | Initial document |

---

**Need help?** Check [Cloudflare Community](https://community.cloudflare.com/) or [Railway Help Station](https://station.railway.com/)
