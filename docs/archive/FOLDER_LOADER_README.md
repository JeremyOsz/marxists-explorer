# Folder-Based Data Loader

## Overview

The new `folder-loader.ts` provides efficient loading of data from the folder-based schema structure.

## Features

✅ **Fast initial loads** - Only loads metadata (~5KB per category)  
✅ **Lazy loading** - Loads works on-demand  
✅ **Caching** - Caches metadata for performance  
✅ **Subject support** - Load works by subject  
✅ **TypeScript** - Full type safety  

## API

### Loading Categories

```typescript
// Get all available categories
const categories = await getAvailableCategories();

// Load metadata for a category (no works)
const thinkers = await loadCategoryThinkersMetadata('anarchists');

// Load metadata with works for a category
const thinkers = await loadThinkersByCategory('anarchists');
```

### Loading Individual Thinkers

```typescript
// Load a thinker with all their works
const thinker = await loadThinker('anarchists', 'Bill Haywood');

// Load only metadata (no works)
const thinkers = await loadCategoryThinkersMetadata('anarchists');
const billHaywood = thinkers.find(t => t.name === 'Bill Haywood');
```

### Loading Works

```typescript
// Load all works for a thinker
const works = await loadThinkerWorks('anarchists', 'Bill Haywood');

// Load works by specific subject
const philosophyWorks = await loadThinkerWorksBySubject(
  'anarchists',
  'Bill Haywood',
  'Philosophy'
);

// Get available subjects for a thinker
const subjects = await getThinkerSubjects('anarchists', 'Bill Haywood');
```

### Bulk Loading

```typescript
// Load all thinkers from all categories (metadata only)
// Perfect for initial page load - very fast!
const allThinkers = await loadAllThinkersMetadata();
```

## Performance

### File Sizes

- `index.json`: ~3.7 KB (list of all categories)
- Category metadata: ~5-10 KB per category
- Subject works files: 0.5-5 KB per file

### Load Times (estimated)

| Action | Size | Time |
|--------|------|------|
| Load all metadata | ~5 KB | ~50-100ms |
| Load category works | ~10-30 KB | ~100-200ms |
| Load single subject | ~1-5 KB | ~20-50ms |

## Usage Example

```typescript
import {
  loadCategoryIndex,
  loadCategoryThinkersMetadata,
  loadThinker,
  loadThinkerWorksBySubject,
} from '@/lib/data/folder-loader';

// Initial page load - load only metadata
const thinkers = await loadCategoryThinkersMetadata('anarchists');
// This loads only 7.8 KB of data!

// User clicks on a thinker - load their works
const billHaywood = await loadThinker('anarchists', 'Bill Haywood');
// This loads additional ~2-3 KB per subject

// User views a specific subject
const philosophyWorks = await loadThinkerWorksBySubject(
  'anarchists',
  'Bill Haywood',
  'Philosophy'
);
```

## Comparison: Old vs New

### Old Loader (`thinkers-data.ts`)

```typescript
// Loaded ALL works upfront
const allThinkers = await loadThinkersData();
// This loads 224 KB of data immediately!
```

### New Loader (`folder-loader.ts`)

```typescript
// Load only metadata first
const metadata = await loadCategoryThinkersMetadata('anarchists');
// This loads only 7.8 KB!

// Load works only when needed
const billHaywood = await loadThinker('anarchists', 'Bill Haywood');
// This loads an additional ~10 KB
```

**Result:** 97% reduction in initial page load!

## Subject Categories

Works are organized into these subjects:

- **Political Theory** - Political writings
- **Economics** - Economic analysis
- **Philosophy** - Philosophical works
- **History** - Historical analysis
- **Literature** - Creative works
- **Letters** - Correspondence
- **Criticism** - Literary/philosophical criticism
- **Biography** - Autobiography/memoirs
- **General** - Uncategorized

## Caching

The loader caches metadata to avoid redundant fetches:

```typescript
// First call - fetches from server
const metadata1 = await loadCategoryMetadata('anarchists');

// Second call - returns from cache
const metadata2 = await loadCategoryMetadata('anarchists');

// Clear cache if needed
clearCache();
```

## Error Handling

The loader handles errors gracefully:

```typescript
// Returns empty array if category not found
const metadata = await loadCategoryMetadata('nonexistent');
// Returns: []

// Returns empty array if thinker not found
const works = await loadThinkerWorks('anarchists', 'Unknown Person');
// Returns: []
```

## Migration from Old Loader

### Before
```typescript
import { loadThinkersMetadata, loadThinkerWorks } from '@/lib/data/thinkers-data';

const allThinkers = loadThinkersMetadata(); // Sync, loads metadata
const works = await loadThinkerWorks('Bill Haywood');
```

### After
```typescript
import { 
  loadCategoryThinkersMetadata, 
  loadThinkerWorks 
} from '@/lib/data/folder-loader';

const thinkers = await loadCategoryThinkersMetadata('anarchists'); // Async
const works = await loadThinkerWorks('anarchists', 'Bill Haywood');
```

## Testing

Test the file structure:
```bash
npx tsx lib/data/folder-loader.test.ts
```

Test in browser:
1. Start Next.js dev server
2. Use browser DevTools to test fetch calls
3. Check Network tab for file loads

## Next Steps

1. ✅ Loader created
2. ⏳ Update components to use new loader
3. ⏳ Test performance improvements
4. ⏳ Deploy new structure

## Files

- **`lib/data/folder-loader.ts`** - Main loader implementation
- **`lib/data/folder-loader.test.ts`** - Test file
- **`public/data-v2/`** - New data structure
- **`FOLDER_LOADER_README.md`** - This file

