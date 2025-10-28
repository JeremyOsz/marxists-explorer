# Category Metadata Population Script

## Overview

This script (`populate-category-metadata.ts`) fetches the latest category metadata from marxists.org and compares it with the local data to identify any differences or updates needed.

## Purpose

The Marxists Internet Archive periodically updates their category descriptions, and this script helps keep our local metadata in sync with the source.

## Usage

Run the script using:

```bash
npx tsx scripts/populate-category-metadata.ts
```

## What It Does

1. **Fetches** the marxists.org archive index page
2. **Extracts** category names, descriptions, and date ranges from the HTML
3. **Compares** with existing metadata in `lib/data/categories.ts`
4. **Reports** any differences found
5. **Updates** the local file if differences are detected

## Output

The script will:
- Show which categories were found on marxists.org
- List any differences between local and remote data
- Update `lib/data/categories.ts` if changes are found
- Display a summary of the comparison

## Examples

### No changes needed:
```
✅ All metadata is up to date!
```

### Changes found:
```
📝 Found differences:

  category-name:
    Field: description
    Old: Old description text
    New: New description text

💾 Writing updated metadata...
✅ Updated lib/data/categories.ts
```

## Notes

- The script is **idempotent** - running it multiple times won't cause issues
- It preserves the formatting of `lib/data/categories.ts`
- ⚠️ **Important**: The marxists.org page contains some typos (e.g., "stablised" instead of "stabilized", "Partyk" instead of "Party"). You may need to manually review changes before committing.
- The script maps marxists.org anchor IDs to our internal category IDs

## Recommendations

After running the script, review the changes with:
```bash
git diff lib/data/categories.ts
```

If any typos are introduced from marxists.org, you can manually fix them before committing.

## Category Mapping

The script uses a mapping table to convert marxists.org's category IDs to our internal IDs. For example:
- `iwma` → `first-international`
- `trotskyism` → `trotskyists`
- `soviet-writers` → `soviet-science`

See the `CATEGORY_MAPPING` constant in the script for the full mapping.

