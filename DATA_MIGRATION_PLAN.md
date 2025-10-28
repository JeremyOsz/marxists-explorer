# Data Migration Plan: Folder-Based Schema

## Overview

Migrating from a flat JSON structure to a hierarchical folder-based schema for better organization and efficient loading.

## Current Structure

```
public/data/
├── thinkers-by-category/
│   ├── index.json               # Category index
│   ├── anarchists.json          # All anarchists
│   ├── bolsheviks.json
│   └── ... (33 category files)
└── thinkers-works.json          # All works keyed by thinker name
```

**Problems:**
- Single large works file (~22K lines)
- Loading all data upfront is slow
- Hard to update individual thinkers
- No subject categorization
- Difficult to cache efficiently

## New Structure

```
public/data/
├── anarchists/
│   ├── metadata.json            # List of all anarchists
│   ├── Emma Goldman/
│   │   ├── Political Theory.json
│   │   ├── Literature.json
│   │   └── General.json
│   └── Alexander Berkman/
│       └── Political Theory.json
├── bolsheviks/
│   ├── metadata.json
│   └── Vladimir Lenin/
│       ├── Political Theory.json
│       └── Philosophy.json
└── ...
```

## Benefits

### 1. **Granular Files**
- Each JSON file: 1-50KB (vs 200KB+ currently)
- Perfect for CDN caching
- Faster initial loads

### 2. **Lazy Loading**
```typescript
// Load one thinker with subjects
const works = await loadThinkerWorks('anarchists', 'Emma Goldman');
// Only loads: Emma Goldman's files (e.g., 3 files × 10KB = 30KB)
```

### 3. **Subject Organization**
- Natural grouping: Political Theory, Philosophy, Economics, etc.
- Easy to navigate
- Better user experience

### 4. **Easy Updates**
- Edit single thinker: `anarchists/Emma Goldman/Literature.json`
- No need to rebuild entire bundle
- Better version control diffs

### 5. **Better Performance**
- Initial page load: Only metadata (~5KB per category)
- Thinker selected: Load that thinker's works (~10-30KB)
- Perfect for mobile/slow connections

## File Format

### Category Metadata (`anarchists/metadata.json`)

```json
[
  {
    "n": "Emma Goldman",
    "c": "Anarchists",
    "d": "Anarchist political activist and writer.",
    "b": "https://www.marxists.org/reference/archive/",
    "i": "https://...",
    "t": "https://...",
    "subjects": [
      { "name": "Political Theory", "count": 15 },
      { "name": "Literature", "count": 8 },
      { "name": "General", "count": 3 }
    ]
  }
]
```

### Subject Works (`anarchists/Emma Goldman/Political Theory.json`)

```json
[
  {
    "title": "Anarchism and Other Essays",
    "url": "https://www.marxists.org/...",
    "description": "Collection of essays on anarchism..."
  },
  {
    "title": "My Disillusionment in Russia",
    "url": "https://www.marxists.org/..."
  }
]
```

## Subject Categories

Initial categorization scheme:

- **Political Theory** - Political writings, theory
- **Economics** - Economic analysis, works on capital
- **Philosophy** - Philosophical works, ethics, epistemology
- **History** - Historical analysis, revolutionary history
- **Literature** - Fiction, poetry, creative works
- **Biography** - Autobiography, biographical works
- **Letters** - Correspondence
- **Criticism** - Literary/philosophical criticism
- **General** - Uncategorized works

## Migration Strategy

### Phase 1: Keep Current System (✅ Now)
- Existing files remain unchanged
- No breaking changes

### Phase 2: Generate New Structure (In Progress)
1. Parse existing JSON files
2. Group works by subject (keyword matching)
3. Generate folder structure
4. Write new JSON files

### Phase 3: Create New Loader
- `lib/data/folder-loader.ts`
- Load metadata first
- Load works on-demand by subject

### Phase 4: Migration & Testing
- Test new loader
- Update components to use new loader
- Verify performance improvements

### Phase 5: Cleanup (Optional)
- Archive old files
- Remove old loader code

## Implementation

### Step 1: Migration Script
**File:** `scripts/migrate-to-folder-schema.ts`

```typescript
// Read existing data
// Extract works for each thinker
// Group by subject (keyword-based)
// Generate folder structure
// Write new files
```

### Step 2: New Loader
**File:** `lib/data/folder-loader.ts`

```typescript
export async function loadThinker(
  category: string,
  name: string
): Promise<Thinker>

export async function loadThinkerWorks(
  category: string,
  name: string,
  subject?: string
): Promise<Work[]>
```

### Step 3: Category Index
**File:** `public/data/index.json`

```json
{
  "categories": [
    {
      "id": "anarchists",
      "name": "Anarchists",
      "path": "anarchists",
      "thinkerCount": 24
    }
  ]
}
```

## Performance Comparison

### Current System
- Initial load: ~200KB (entire works file)
- Search: Parse entire works file
- Cache: Large monolithic file

### New System
- Initial load: ~5KB (just metadata)
- Search: Parse only selected thinker's works (~10-30KB)
- Cache: Many small files (better CDN caching)

**Expected improvement:** 90% faster initial loads

## Rollout Plan

1. ✅ Create migration script
2. ✅ Run migration to generate new structure
3. ⏳ Create new loader
4. ⏳ Test with sample data
5. ⏳ Update app to use new loader
6. ⏳ Deploy and monitor
7. ⏳ Archive old files (optional)

## Migration Status: COMPLETE ✅

**Generated:**
- ✅ 31 category folders
- ✅ 229 thinker folders  
- ✅ 867 JSON files (3.8MB total)
- ✅ Global index: `public/data-v2/index.json`
- ✅ Category metadata files with subject counts

**See `MIGRATION_SUMMARY.md` for detailed results.**

## Notes

- **Backward Compatible**: Old files kept during transition
- **Progressive Migration**: Can migrate category by category
- **Easy Rollback**: Keep old loader as fallback
- **No User Impact**: Existing functionality preserved

