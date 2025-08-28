# Gmail SMTP Setup Guide for Rugalika Backend

## Current Issue
The server is trying to use Gmail credentials but getting authentication errors because Gmail no longer accepts regular passwords for SMTP.

## Solution: Use Gmail App Passwords

### Step 1: Enable 2-Factor Authentication
1. Go to: https://myaccount.google.com/security
2. Find "2-Step Verification" under "Signing in to Google"
3. Click "Get started" and complete the setup
4. Verify with your phone number

### Step 2: Generate App Password
1. After 2FA is enabled, go back to: https://myaccount.google.com/security
2. Find "App passwords" (this only appears after 2FA is enabled)
3. Click "App passwords"
4. Select app: "Mail"
5. Select device: "Other (Custom name)"
6. Enter name: "Rugalika Backend"
7. Click "Generate"
8. **Copy the 16-character password** (format: abcd efgh ijkl mnop)

### Step 3: Update Your .env File
Replace the SMTP_PASS value in your .env file with the App Password:

```env
SMTP_USER=karangwacyrille@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
```

### Step 4: Restart Server
After updating .env, restart your development server:
```bash
npm run dev
```

## Verification
When properly configured, you should see:
```
info: SMTP server is ready to take our messages
```

Instead of:
```
error: SMTP connection failed: Invalid login
```

## Security Notes
- App passwords are more secure than regular passwords
- Each app password is unique and can be revoked individually
- Never share your app password in public repositories
- The app password bypasses 2FA for the specific application

## Alternative: Disable Email for Development
If you don't need email functionality during development, you can comment out or remove the SMTP_USER and SMTP_PASS lines from your .env file. The server will run fine without email capabilities.
