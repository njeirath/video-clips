# Testing Guide for Video Clips Feature

This guide explains how to test the new video clips feature that allows logged-in users to add video clips with name and description fields.

## Prerequisites

1. Node.js (v20 or higher)
2. npm (v10 or higher)
3. AWS Cognito account credentials (for testing authentication)

## Setup

1. Install dependencies:
```bash
npm install
```

2. (Optional) Start OpenSearch locally:
```bash
# Using Docker
docker run -p 9200:9200 -p 9600:9600 -e "discovery.type=single-node" opensearchproject/opensearch:latest

# Or skip this step - the app works without OpenSearch for testing
```

## Running the Application

### Start Backend

In one terminal:
```bash
npx nx serve backend
```

The backend will start at `http://localhost:3020/graphql`

Expected output:
```
Server started on http://localhost:3020/graphql
Error initializing OpenSearch index: ConnectionError... (if OpenSearch not running - this is OK)
```

### Start Frontend

In another terminal:
```bash
npx nx serve frontend
```

The frontend will start at `http://localhost:4200`

## Testing Steps

### 1. Test Unauthenticated Access

1. Navigate to `http://localhost:4200`
2. Verify you see "Sign Up" and "Sign In" buttons in the header
3. Try navigating to `http://localhost:4200/add-clip`
4. Verify you are redirected to the sign-in page

✅ **Expected**: Unauthenticated users cannot access the add-clip page

### 2. Test Sign Up Flow

1. Click "Sign Up" button
2. Enter an email address
3. Complete the Cognito sign-up flow
4. Verify your email with the confirmation code

✅ **Expected**: New user account created successfully

### 3. Test Sign In Flow

1. Click "Sign In" button
2. Enter your email address
3. Complete the Cognito sign-in flow (may require MFA/OTP)
4. Verify you are redirected to the home page
5. Verify the header now shows "Add Clip" button and user menu icon

✅ **Expected**: User is authenticated and sees the "Add Clip" button

### 4. Test Adding a Video Clip

1. Click "Add Clip" button in the header
2. Verify you see the "Add Video Clip" form
3. Fill in the form:
   - **Video Clip Name**: "My First Video Clip"
   - **Description**: "This is a test video clip with a detailed description"
4. Click "Add Video Clip" button
5. Verify you see a success message
6. Verify you are redirected to the home page after 2 seconds

✅ **Expected**: Video clip created successfully

### 5. Test Form Validation

1. Navigate to `/add-clip`
2. Try to submit the form with empty fields
3. Verify the submit button is disabled
4. Fill in only the name field
5. Verify the submit button is still disabled
6. Fill in both fields
7. Verify the submit button is enabled

✅ **Expected**: Form validates required fields

### 6. Test GraphQL API Directly

Using a GraphQL client (Apollo Studio, Insomnia, Postman) or curl:

#### Test Hello Query
```bash
curl -X POST http://localhost:3020/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ hello }"}'
```

Expected response:
```json
{"data":{"hello":"Hello from TypeGraphQL!"}}
```

#### Test VideoClips Query
```bash
curl -X POST http://localhost:3020/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ videoClips { id name description userId createdAt } }"}'
```

Expected response (if OpenSearch is running):
```json
{
  "data": {
    "videoClips": [
      {
        "id": "550e8400-...",
        "name": "My First Video Clip",
        "description": "This is a test video clip...",
        "userId": "user-sub-from-cognito",
        "createdAt": "2025-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

#### Test Create VideoClip Mutation (Authenticated)

First, get your ID token:
1. Sign in to the frontend
2. Open browser DevTools > Application > Local Storage
3. Find the Cognito ID token

Then test the mutation:
```bash
curl -X POST http://localhost:3020/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ID_TOKEN_HERE" \
  -d '{
    "query": "mutation CreateVideoClip($input: CreateVideoClipInput!) { createVideoClip(input: $input) { id name description userId createdAt } }",
    "variables": {
      "input": {
        "name": "API Test Clip",
        "description": "Created via API"
      }
    }
  }'
```

Expected response:
```json
{
  "data": {
    "createVideoClip": {
      "id": "550e8400-...",
      "name": "API Test Clip",
      "description": "Created via API",
      "userId": "your-user-sub",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  }
}
```

#### Test Create VideoClip Without Authentication

```bash
curl -X POST http://localhost:3020/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation CreateVideoClip($input: CreateVideoClipInput!) { createVideoClip(input: $input) { id name description userId createdAt } }",
    "variables": {
      "input": {
        "name": "Unauthorized Clip",
        "description": "This should fail"
      }
    }
  }'
```

Expected response:
```json
{
  "errors": [
    {
      "message": "Not authenticated. Please sign in to add video clips."
    }
  ]
}
```

✅ **Expected**: Mutation fails without authentication

## Troubleshooting

### Backend won't start
- Check if port 3020 is already in use
- Verify dependencies are installed: `npm install`
- Check Node.js version: `node --version` (should be v20+)

### Frontend won't start
- Check if port 4200 is already in use
- Verify dependencies are installed: `npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`

### OpenSearch errors
- These are expected if OpenSearch is not running
- The app will work for development, just won't persist data
- To fix: Run OpenSearch locally or ignore the errors

### Authentication issues
- Verify Cognito User Pool configuration in `apps/frontend/src/app/cognito-config.ts`
- Check that the User Pool ID and Client ID are correct
- Clear browser cookies/local storage and try again

### GraphQL mutation fails
- Verify you're sending the Authorization header
- Check that the token hasn't expired (tokens expire after 1 hour)
- Sign in again to get a fresh token

## Known Limitations

1. **OpenSearch Connection**: App logs errors if OpenSearch is not running, but continues to function
2. **Data Persistence**: Without OpenSearch, data is not persisted (in-memory only)
3. **Token Expiration**: ID tokens expire after 1 hour - user must sign in again
4. **No Edit/Delete**: Currently only supports creating video clips, not editing or deleting

## Next Steps

After confirming the feature works:
1. Set up AWS OpenSearch Service for production
2. Implement update and delete mutations
3. Add video clip listing on the home page
4. Add search and filtering capabilities
5. Implement actual video upload functionality
