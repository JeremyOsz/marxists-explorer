# Data Cleanup Scripts

## Overview

Two scripts to help manage the transition from old to new data structure:

1. **`cleanup-old-data.sh`** - Analysis only (safe)
2. **`delete-old-data.sh`** - Actually deletes files (use with caution)

## Scripts

### 1. Analysis Script (Safe)

**File:** `scripts/cleanup-old-data.sh`

**Purpose:** Shows what files can be removed without deleting anything

**Usage:**
```bash
./scripts/cleanup-old-data.sh
```

**Output:**
- Lists all old files in `public/data/`
- Shows file sizes
- Calculates space that would be freed
- Provides recommendations

**Safe to run:** ✅ Yes - only reads and displays information

### 2. Deletion Script (Dangerous)

**File:** `scripts/delete-old-data.sh`

**Purpose:** Actually deletes the old data files

**Usage:**
```bash
./scripts/delete-old-data.sh
```

**Features:**
- Requires typing 'yes' to confirm
- Checks that new data exists before deleting
- Shows what will be deleted
- Only deletes `public/data/` (keeps `data/` source files)

**Safe to run:** ⚠️ Only after thorough testing!

## What Gets Deleted

### Will Be Deleted:
- ✅ `public/data/` - Old data structure (34 files, ~1.2MB)
  - All `thinkers-by-category/*.json` files
  - `thinkers-works.json` (856KB)

### Will Be Kept:
- ✅ `public/data-v2/` - New folder structure (keep!)
- ✅ `data/` - Source data (keep for reference!)
- ✅ `lib/data/folder-loader.ts` - New loader (keep!)
- ✅ `lib/data/thinkers-data.ts` - Old loader (keep for now)

## Recommended Workflow

### 1. Test First
```bash
npm run dev
```

Verify:
- ✅ All thinkers load
- ✅ Works display correctly
- ✅ No errors in console
- ✅ Search works
- ✅ Categories work

### 2. Review Analysis
```bash
./scripts/cleanup-old-data.sh
```

Review the output to see what will be deleted.

### 3. Delete Old Data
```bash
./scripts/delete-old-data.sh
```

Type 'yes' when prompted.

### 4. Final Verification
```bash
npm run dev
```

Make sure everything still works!

## Alternative: Archive Instead of Delete

If you want to keep a backup:

```bash
# Create archive directory
mkdir -p archive

# Move instead of delete
mv public/data archive/data-$(date +%Y%m%d)

# Or copy
cp -r public/data archive/data-$(date +%Y%m%d)
```

## What's Safe to Keep

### Keep Forever:
- `data/` - Source data, useful for reference
- `scripts/` - Migration and cleanup scripts
- Documentation files

### Can Delete:
- `public/data/` - Old structure (replaced by data-v2)
- Old test files if no longer needed

## File Sizes

**Before cleanup:**
- `public/data/`: ~1.2MB
- `public/data-v2/`: ~3.9MB
- Total: ~5.1MB

**After cleanup:**
- `public/data-v2/`: ~3.9MB
- Saves: ~1.2MB

## Rollback Plan

If you need to rollback:

1. The old loader `lib/data/thinkers-data.ts` still exists
2. Restore old data from archive:
   ```bash
   mv archive/data-YYYYMMDD public/data
   ```
3. Update imports in components back to old loader

## Notes

- Both scripts are idempotent (safe to run multiple times)
- The deletion script won't run if `public/data-v2/` doesn't exist
- Source data in `data/` is never touched
- New loader continues to work with new structure

## Summary

```bash
# 1. See what would be deleted
./scripts/cleanup-old-data.sh

# 2. Test thoroughly
npm run dev

# 3. Delete when ready
./scripts/delete-old-data.sh

# 4. Verify
npm run dev
```

