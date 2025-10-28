# Architecture Documentation

## Overview

Marxists Explorer is a Next.js application that provides searchable access to Marxist thinkers and their works from Marxists.org.

## Data Architecture

### Current Structure (data-v2)

The application uses a hierarchical folder structure optimized for scalability and performance:

```
public/data-v2/
├── index.json                          # Category index
├── {category}/                         # e.g., "bolsheviks", "anarchists"
│   ├── metadata.json                   # All thinkers in this category
│   └── {thinker-name}/                # e.g., "Vladimir Lenin"
│       ├── General.json                # Works in General category
│       ├── Political Theory.json       # Works in Political Theory category
│       ├── Economics.json              # Works in Economics category
│       └── ...                         # Other subject categories
```

### Metadata Schema

**Category Metadata** (`{category}/metadata.json`):
```typescript
{
  "n": string,           // name
  "c": string,           // category
  "d": string,           // description
  "b": string,           // bioUrl
  "i": string,           // imageUrl
  "t"?: string,          // thumbnailUrl
  "w": number,           // workCount
  "j"?: Work[],          // majorWorks (optional)
  "subjects"?: Array<{   // available subjects
    "name": string,
    "count": number
  }>
}
```

**Work Schema**:
```typescript
{
  "title": string,
  "url": string,
  "description"?: string
}
```

### Major Works Feature

Thinkers can have a curated list of major works (`j` field) that are highlighted in the UI:
- Displayed in a separate "Major Works" section at the top of the thinker's profile
- Independent from the works-by-subject organization
- Provides quick access to the most important texts

Example:
```json
{
  "n": "Karl Marx",
  "j": [
    {
      "title": "The Communist Manifesto",
      "url": "https://www.marxists.org/archive/marx/works/1848/communist-manifesto/"
    },
    {
      "title": "Das Kapital, Volume I",
      "url": "https://www.marxists.org/archive/marx/works/1867-c1/"
    }
  ]
}
```

## Component Architecture

### Main Components

1. **`app/page.tsx`**
   - Server component
   - Loads thinker metadata using `loadAllThinkersMetadata()`
   - Passes data to client component

2. **`components/thinker-search.tsx`**
   - Client component with search/filter logic
   - Manages selected thinker state
   - Lazy-loads works when thinker is selected

3. **`components/thinker-search-ui/`**
   - `ThinkerSearchBar` - Search input and category filters
   - `ThinkerList` - Display thinkers grouped by category
   - `ThinkerCard` - Individual thinker card
   - `ThinkerDetailDialog` - Modal showing thinker details
   - `ThinkerWorksBySection` - Works organized by subject
   - `ThinkerWorksList` - Simple list of works (legacy)

### Data Loading

**`lib/data/folder-loader.ts`** - Primary data loader:
- `loadAllThinkersMetadata()` - Load all thinkers (metadata only)
- `loadThinker(category, name)` - Load single thinker with works
- `loadThinkerWorks(category, name)` - Load works for thinker
- `loadCategoryMetadata(category)` - Load thinkers in category

**`lib/data/thinker-lookups.ts`**:
- `loadThinkerWorksBySubject(name, category)` - Load works grouped by subject

## UI/UX Flow

1. **Initial Load**
   - Server loads all thinker metadata (names, descriptions, categories)
   - Fast initial page load (~150KB vs ~400KB with full data)

2. **Search & Browse**
   - Client-side search/filter through metadata
   - Results grouped by category with accordion UI
   - Primary matches highlighted at top

3. **View Thinker**
   - Click thinker card → opens modal dialog
   - Lazy-load works for selected thinker
   - Display:
     - Biography section with image
     - Major Works (if defined)
     - Works by Subject (organized in accordion)

## Type System

**`lib/types/thinker.ts`**:
```typescript
export interface Thinker {
  name: string;
  category: string;
  description: string;
  bioUrl: string;
  works: Work[];
  majorWorks?: Work[];
  imageUrl: string;
  thumbnailUrl?: string;
  workCount?: number;
}

export interface Work {
  title: string;
  url: string;
  description?: string;
}
```

## Performance Optimizations

1. **Lazy Loading**: Works loaded only when thinker is selected
2. **Metadata Bundling**: Initial load includes only essential info
3. **Client-side Search**: Fast filtering without server requests
4. **Folder Structure**: Enables efficient CDN caching
5. **Image Optimization**: Thumbnails for list view, full images for detail view

## Migration History

The project migrated from:
- **Old**: Flat JSON files (`thinkers-works.json`, `thinkers-metadata.json`)
- **New**: Hierarchical folder structure (`data-v2/`)

Benefits:
- Better organization and scalability
- Smaller initial bundle size
- Easier to maintain and update individual thinkers
- More flexible data structure (subjects, major works)

## Scripts

- `scripts/shell/cleanup-old-data.sh` - Analyze old files
- `scripts/shell/delete-old-data.sh` - Remove old data structure
- `scripts/typescript/migrate-to-folder-schema.ts` - Migration script
- `scripts/python/` - Python scrapers and data processors

## Future Enhancements

Possible improvements:
- Full-text search across works
- Advanced filtering (by date, subject, etc.)
- Reading lists and bookmarks
- Work summaries and context
- Related thinkers/works suggestions

