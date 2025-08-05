# Maintenance Mode

## How to Enable Maintenance Mode

To temporarily disable access to Gradual while fixing issues, follow these steps:

### 1. Create or Update `.env.local`

Add this line to your `.env.local` file:

```bash
NEXT_PUBLIC_MAINTENANCE_MODE=true
```

### 2. Restart Your Development Server

```bash
npm run dev
```

### 3. Disable Maintenance Mode

When you're ready to re-enable access, change the value to:

```bash
NEXT_PUBLIC_MAINTENANCE_MODE=false
```

## What Happens in Maintenance Mode

- All pages redirect to a maintenance page
- Users can still join the waitlist
- Contact information is provided
- Professional messaging about improvements

## Current Issues Being Fixed

1. **Authentication Issues**: API endpoints require proper Firebase authentication tokens
2. **Frontend Integration**: Need to properly send auth tokens with API requests
3. **Firebase Permissions**: Dashboard features need proper Firestore security rules

## TODO After Maintenance

1. Re-enable authentication on all API endpoints
2. Fix frontend authentication token handling
3. Update Firestore security rules
4. Test all features thoroughly 