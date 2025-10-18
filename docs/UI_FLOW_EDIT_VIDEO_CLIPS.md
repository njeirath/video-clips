# Video Clip Editing Feature - UI Flow

This document describes the user interface flow for the video clip editing feature.

## 1. Home Page - Video Clip Grid

**Route:** `/`

**Changes:**
- Video clip cards are now **clickable**
- Hovering shows elevation effect (existing)
- Clicking navigates to detail page (new)

**Visual Elements:**
```
┌─────────────────────────────────────────────┐
│ [Logo]          Add Clip    [User Menu]     │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│          [Search Bar]                       │
└─────────────────────────────────────────────┘

┌──────────┐  ┌──────────┐  ┌──────────┐
│ ┌──────┐ │  │ ┌──────┐ │  │ ┌──────┐ │
│ │Video │ │  │ │Video │ │  │ │Video │ │
│ │ or   │ │  │ │ or   │ │  │ │ or   │ │
│ │Thumb │ │  │ │Thumb │ │  │ │Thumb │ │
│ └──────┘ │  │ └──────┘ │  │ └──────┘ │
│ Title  📤│  │ Title  📤│  │ Title  📤│
│ Desc...  │  │ Desc...  │  │ Desc...  │
│ Added: XX│  │ Added: XX│  │ Added: XX│
└──────────┘  └──────────┘  └──────────┘
   ↓ CLICK       ↓ CLICK       ↓ CLICK
```

## 2. Video Clip Detail Page

**Route:** `/clip/:id`

**Purpose:** View all details of a video clip

**Layout:**
```
┌─────────────────────────────────────────────┐
│ [Logo]          Add Clip    [User Menu]     │
└─────────────────────────────────────────────┘

        ┌────────────────────┐
        │    📹 Video Icon   │
        └────────────────────┘
            Video Clip Title

┌─────────────────────────────────────────────┐
│                                             │
│         [Video Player with Controls]        │
│            (shows thumbnail poster)         │
│                                             │
└─────────────────────────────────────────────┘

        [✏️ Edit]  ← Only shown if authenticated
        
        ───────── Details ─────────
        
        Description
        This is the video clip description text
        
        Script
        "These are the words spoken in the clip"
        
        Duration
        30.5 seconds
        
        Characters
        [Character 1] [Character 2] [Character 3]
        
        Tags
        [comedy] [action] [classic]
        
        Source
        Show: The Office
        Season 2, Episode 5
        Aired: 2024-01-15
        
        ─────────────────────────────
        
        Created: 2024-01-01 10:00:00
        Last updated: 2024-01-15 14:30:00 by user@example.com
        
        [    Back to Home    ]
```

**User Actions:**
- Click "Edit" → Navigate to edit page (if authenticated)
- Click "Back to Home" → Navigate to home page
- Play video → Video plays in the player

## 3. Edit Video Clip Page

**Route:** `/clip/:id/edit`

**Purpose:** Edit all editable fields of a video clip

**Layout:**
```
┌─────────────────────────────────────────────┐
│ [Logo]          Add Clip    [User Menu]     │
└─────────────────────────────────────────────┘

        ┌────────────────────┐
        │    ✏️ Edit Icon    │
        └────────────────────┘
          Edit Video Clip
          
         "Video Clip Title"
         (displayed but not editable)

┌─────────────────────────────────────────────┐
│                                             │
│         [Video Player Preview]              │
│            (read-only)                      │
│                                             │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Description *                               │
│ ┌─────────────────────────────────────────┐ │
│ │ This is the description...              │ │
│ │                                         │ │
│ │                                         │ │
│ └─────────────────────────────────────────┘ │
│ (required field)                            │
└─────────────────────────────────────────────┘

    ────── Optional Information ──────

┌─────────────────────────────────────────────┐
│ Script                                      │
│ ┌─────────────────────────────────────────┐ │
│ │ Words spoken in the clip...             │ │
│ │                                         │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Duration (seconds)                          │
│ ┌─────────────────────────────────────────┐ │
│ │ 30.5                                    │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Characters                                  │
│ ┌─────────────────────────────────────────┐ │
│ │ Character 1, Character 2, Character 3   │ │
│ └─────────────────────────────────────────┘ │
│ Comma-separated list                        │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Tags                                        │
│ ┌─────────────────────────────────────────┐ │
│ │ comedy, action, drama                   │ │
│ └─────────────────────────────────────────┘ │
│ Comma-separated tags                        │
└─────────────────────────────────────────────┘

    ────── Source Information ──────

┌─────────────────────────────────────────────┐
│ Source Type                                 │
│ ┌─────────────────────────────────────────┐ │
│ │ TV Show/Series            ▼             │ │
│ └─────────────────────────────────────────┘ │
│ Options: None, TV Show/Series, Movie        │
└─────────────────────────────────────────────┘

    (If TV Show/Series selected:)
┌─────────────────────────────────────────────┐
│     TV Show Details                         │
│ ┌─────────────────────────────────────────┐ │
│ │ Show Title                              │ │
│ │ The Office                              │ │
│ ├─────────────────────────────────────────┤ │
│ │ Air Date                                │ │
│ │ 2024-01-15                              │ │
│ ├───────────────────┬─────────────────────┤ │
│ │ Season            │ Episode             │ │
│ │ 2                 │ 5                   │ │
│ ├───────────────────┼─────────────────────┤ │
│ │ Start (seconds)   │ End (seconds)       │ │
│ │ 120.5             │ 145.8               │ │
│ └───────────────────┴─────────────────────┘ │
└─────────────────────────────────────────────┘

    (If Movie selected:)
┌─────────────────────────────────────────────┐
│     Movie Details                           │
│ ┌─────────────────────────────────────────┐ │
│ │ Movie Title                             │ │
│ │ The Princess Bride                      │ │
│ ├─────────────────────────────────────────┤ │
│ │ Release Date                            │ │
│ │ 1987-09-25                              │ │
│ ├───────────────────┬─────────────────────┤ │
│ │ Start (seconds)   │ End (seconds)       │ │
│ │ 3456.2            │ 3489.7              │ │
│ └───────────────────┴─────────────────────┘ │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│     [✅ Save Changes]                       │
│     [      Cancel      ]                    │
└─────────────────────────────────────────────┘
```

**User Actions:**
- Fill/modify form fields
- Click "Save Changes" → Validates, saves, shows success message, redirects to detail page
- Click "Cancel" → Returns to detail page without saving
- Form validation:
  - Description required
  - Description cannot be empty/whitespace
  - All other fields optional

## 4. Success/Error States

### Success Message (after save)
```
┌─────────────────────────────────────────────┐
│ ✅ Video clip updated successfully!        │
│    (auto-dismiss after 2 seconds)          │
└─────────────────────────────────────────────┘
```

### Validation Error
```
┌─────────────────────────────────────────────┐
│ Description *                               │
│ ┌─────────────────────────────────────────┐ │
│ │                                         │ │ 
│ └─────────────────────────────────────────┘ │
│ ❌ Description is required                  │
└─────────────────────────────────────────────┘
```

### API Error
```
┌─────────────────────────────────────────────┐
│ ❌ Failed to update video clip             │
│    Error message from server                │
└─────────────────────────────────────────────┘
```

## 5. Authentication Flow

### Not Authenticated - Detail Page
```
Detail page shown WITHOUT "Edit" button
User can view all information but cannot edit
```

### Not Authenticated - Attempting to Access Edit Page
```
User navigates to /clip/:id/edit directly
   ↓
Redirected to /signin
   ↓
After sign-in, redirected back to /clip/:id/edit
```

## Key UI Patterns Used

1. **Material-UI Components:**
   - AppBar, Toolbar (navigation)
   - Container, Box (layout)
   - Card, CardContent (video clip cards)
   - TextField (all input fields)
   - Select, MenuItem (dropdowns)
   - Button (actions)
   - Chip (tags and characters display)
   - Avatar (icons)
   - Divider (section separators)
   - Alert (success/error messages)
   - CircularProgress (loading states)

2. **React Hook Form:**
   - Controller components for all inputs
   - Validation rules on required fields
   - Error message display
   - Form state management

3. **React Router:**
   - useNavigate for programmatic navigation
   - useParams for URL parameters
   - Link components for navigation

4. **Apollo Client:**
   - useQuery for fetching data
   - useMutation for updates
   - Loading and error states

## Responsive Behavior

- Home page: Grid layout adapts to screen size
- Detail page: Single column, max-width 800px
- Edit page: Single column, max-width 600px (form)
- All pages: Mobile-friendly with proper spacing

## Accessibility

- Semantic HTML elements
- Proper form labels
- Keyboard navigation support
- Screen reader friendly
- Error messages associated with fields
- Loading states announced
