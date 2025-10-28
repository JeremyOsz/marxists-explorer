# Cleanup Summary

## Old Data Files Analysis

### Files to Delete: 34 files (~1.2MB)

**Location:** `public/data/`

1. `thinkers-by-category/` (33 JSON files, 352KB)
   - All category JSON files
   - index.json, summary.json

2. `thinkers-works.json` (856KB)
   - Large monolithic file with all works

**Total size:** ~1.2MB

### Files to Keep

1. **`public/data-v2/`** (~3.9MB)
   - New folder-based structure
   - 564 thinkers with subject organization

2. **`data/`** (~3.2MB)
   - Source data files
   - Useful for reference and regeneration

## Commands

### View what can be deleted:
```bash
./scripts/cleanup-old-data.sh
```

### Delete old data (after testing):
```bash
./scripts/delete-old-data.sh
```

## Benefits of Cleanup

1. **Cleaner structure** - Only new organized data
2. **Less confusion** - One data source
3. **Smaller repo** - Removes ~1.2MB
4. **Clear separation** - Old vs new structure

## Safety Features

- ✅ New data must exist before deletion
- ✅ Requires typing 'yes' to confirm
- ✅ Shows what will be deleted first
- ✅ Keeps source data intact
- ✅ Can rollback if needed

