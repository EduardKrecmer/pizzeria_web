# Serverless-Ready Email Configuration

This document describes the email system setup in the Pizzeria Janíček application, which has been optimized for serverless environments.

## Key Features

1. **Retry Mechanism with Exponential Backoff**
   - Each email delivery attempt uses progressive delays between retries
   - Customer emails: 3 retry attempts
   - Restaurant emails: 5 retry attempts (higher priority)

2. **Improved Connection Management**
   - New transporter created for each email to avoid stale connections
   - Timeouts optimized for serverless execution (10s connection timeout)
   - Race conditions prevented with Promise.race() pattern

3. **Error Handling and Resilience**
   - Comprehensive try/catch blocks for all critical operations
   - Detailed logging for better troubleshooting
   - Graceful fallbacks for template generation errors

4. **Diagnostic API Endpoints**
   - `/api/diagnostic` - Overview of available API endpoints
   - `/api/diagnostic/email-config` - Tests SMTP configuration and connection
   - `/api/test-email-direct` - Sends a test email with detailed diagnostics

5. **Environment Variable Security**
   - Email credentials stored as Replit secrets
   - Verification that required variables exist before attempting connections

## Vercel Configuration

The `vercel.json` file has been optimized with:
- Explicit route mappings for each API endpoint
- Increased memory allocation for email functions
- Extended execution timeouts for email operations
- Optimized CORS headers

## Getting It Working in Production

1. Ensure all email environment variables are defined in the deployment:
   - `EMAIL_HOST` (e.g. 'smtp.gmail.com')
   - `EMAIL_PORT` (e.g. '465')
   - `EMAIL_USER` (e.g. 'pizza.objednavka@gmail.com')
   - `EMAIL_PASS` (Application password for Gmail)
   - `EMAIL_SECURE` (Set to 'true' for Gmail on port 465)
   - `EMAIL_FROM` (e.g. '"Pizzeria Janíček" <pizza.objednavka@gmail.com>')
   - `RESTAURANT_EMAIL` (e.g. 'vlastnawebstranka@gmail.com')

2. When deployed, use the diagnostic endpoints to verify:
   - Email environment variables are properly set
   - SMTP connection can be established 
   - Actual emails can be sent

This serverless-optimized implementation should work reliably in both development and production environments.