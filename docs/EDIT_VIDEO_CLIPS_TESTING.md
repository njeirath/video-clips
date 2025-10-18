# Manual Testing Guide: Video Clip Editing Feature

This guide provides steps to manually test the new video clip editing functionality.

## Prerequisites

1. Backend and frontend servers running:
   - Backend: `npx nx serve backend` (port 3000)
   - Frontend: `npx nx serve frontend` (port 4200)
2. AWS Cognito configured for authentication
3. OpenSearch instance running (or mocked)
4. At least one video clip in the system

## Testing Steps

### 1. View Video Clip Details

1. Navigate to `http://localhost:4200`
2. You should see a list of video clips on the home page
3. **Click on any video clip card** - this is a new feature
4. You should be redirected to `/clip/{id}` showing the detail page
5. Verify you can see:
   - Video player with the clip (if videoUrl exists)
   - Thumbnail (if thumbnailUrl exists)
   - Video clip name (as title)
   - Description
   - Script (if present)
   - Duration (if present)
   - Characters as chips (if present)
   - Tags as chips (if present)
   - Source information (TV Show or Movie details, if present)
   - Created date
   - Updated date and updatedBy (if the clip has been edited)

### 2. Edit Video Clip (Authenticated User)

1. From the detail page, verify you see an **"Edit" button** (only visible when signed in)
2. If not signed in, sign in first via the "Sign In" button
3. Click the **"Edit" button**
4. You should be redirected to `/clip/{id}/edit`
5. Verify the edit form shows:
   - Video player at the top
   - Video clip name (read-only, displayed as heading)
   - All editable fields pre-populated with existing data:
     - Description (required)
     - Script
     - Duration
     - Characters (comma-separated)
     - Tags (comma-separated)
     - Source Type dropdown (None, TV Show/Series, Movie)
     - Source details (based on selected type)

### 3. Test Form Validation

1. Try to clear the description field and submit
2. Verify you see a validation error: "Description is required" or "Description cannot be empty"
3. Fill in a valid description
4. Verify the submit button becomes enabled

### 4. Edit and Save Changes

1. Make changes to any editable fields:
   - Update the description
   - Add or modify the script
   - Change duration
   - Add/remove characters (comma-separated)
   - Add/remove tags (comma-separated)
   - Change source type or update source details

2. Click **"Save Changes"**
3. Verify:
   - A success message appears: "Video clip updated successfully!"
   - You are redirected back to the detail page after 2 seconds
   - The detail page shows your updated data
   - The "Last updated" timestamp is shown
   - The "updatedBy" field shows your email

### 5. Verify Immutable Fields

Verify these fields **cannot be edited** (not present in the edit form):
- `id` - not shown in edit form
- `name` - shown as heading but not editable
- `userId` - not shown
- `userEmail` - not shown
- `s3Key` - not shown
- `videoUrl` - shown in video player but not editable
- `thumbnailUrl` - shown in video player poster but not editable
- `blurhash` - not shown
- `createdAt` - not shown

### 6. Test Navigation

1. From the edit page, click **"Cancel"**
2. Verify you are redirected back to the detail page without saving changes
3. From the detail page, click **"Back to Home"**
4. Verify you are redirected to the home page
5. Click on a video clip card again
6. Verify you navigate to the detail page

### 7. Test Authentication Requirements

1. Sign out of the application
2. Navigate directly to `/clip/{id}/edit`
3. Verify you are redirected to the sign-in page
4. Sign in
5. Verify you are redirected back to the edit page

### 8. GraphQL API Testing

You can also test the GraphQL API directly using Apollo Studio or a GraphQL client:

#### Get Video Clip by ID

```graphql
query GetVideoClip($id: String!) {
  videoClip(id: $id) {
    id
    name
    description
    script
    duration
    characters
    tags
    source {
      ... on ShowSource {
        title
        season
        episode
        airDate
        start
        end
      }
      ... on MovieSource {
        title
        releaseDate
        start
        end
      }
    }
    createdAt
    updatedAt
    updatedBy
  }
}
```

#### Update Video Clip

```graphql
mutation UpdateVideoClip($input: UpdateVideoClipInput!) {
  updateVideoClip(input: $input) {
    id
    name
    description
    script
    duration
    characters
    tags
    source {
      ... on ShowSource {
        title
        season
        episode
        airDate
        start
        end
      }
      ... on MovieSource {
        title
        releaseDate
        start
        end
      }
    }
    updatedAt
    updatedBy
  }
}
```

**Variables:**
```json
{
  "input": {
    "id": "your-clip-id",
    "description": "Updated description",
    "script": "Updated script",
    "tags": ["tag1", "tag2"],
    "source": {
      "show": {
        "title": "Updated Show",
        "season": 2,
        "episode": 5
      }
    }
  }
}
```

**Headers:**
```json
{
  "Authorization": "Bearer <your-cognito-id-token>"
}
```

## Expected Behavior

### Successful Edit Flow
1. User clicks on a video clip card → navigates to detail page
2. User is signed in → sees "Edit" button
3. User clicks "Edit" → navigates to edit form with pre-populated data
4. User makes changes → clicks "Save Changes"
5. Backend validates authentication and updates the clip
6. Backend records `updatedAt` timestamp and `updatedBy` email
7. User sees success message → redirected to detail page
8. Detail page shows updated data with update metadata

### Error Handling
- Not authenticated: redirect to sign-in
- Invalid data: show validation errors
- Server error: show error message
- Network error: show error message

## Key Features Implemented

✅ Video clip cards are clickable and navigate to detail page  
✅ Detail page shows all video clip information  
✅ Edit button only visible when user is signed in  
✅ Edit form pre-populated with existing data  
✅ Form validation using react-hook-form  
✅ All editable fields can be updated  
✅ Immutable fields are not editable  
✅ Backend tracks updatedAt and updatedBy  
✅ GraphQL mutation for updating clips  
✅ Frontend and backend tests added  

## Known Limitations

- Only authenticated users can edit clips
- Any authenticated user can edit any clip (no ownership check)
- No confirmation dialog before saving changes
- No undo functionality after saving
