#!/bin/bash

# Script to delete old data files after migration
# This script DELETES files - use with caution!

set -e  # Exit on error

echo "🗑️  Delete Old Data Files"
echo "========================"
echo ""
echo "This will DELETE the old data structure in public/data/"
echo ""

# Set colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Safety check: Make sure new data exists
if [ ! -d "public/data-v2" ]; then
    echo "${RED}❌ ERROR: New data structure (public/data-v2/) not found!${NC}"
    echo "   Migration may not be complete. Aborting for safety."
    exit 1
fi

# Show what will be deleted
echo "Files to be deleted:"
echo ""

if [ -d "public/data" ]; then
    echo "  ${YELLOW}public/data/${NC}"
    
    # Show size
    old_size=$(du -sh public/data 2>/dev/null | cut -f1)
    echo "  Size: $old_size"
    echo ""
    
    # List contents
    echo "  Contents:"
    ls -lh public/data/ 2>/dev/null | tail -n +2 | awk '{print "    " $9 " (" $5 ")"}' || true
    
    # Count files
    file_count=$(find public/data -type f | wc -l | tr -d ' ')
    echo ""
    echo "  Total files: $file_count"
else
    echo "${GREEN}✓ public/data/ not found (already cleaned up)${NC}"
    exit 0
fi

echo ""
echo "================================"
echo "⚠️  CONFIRMATION REQUIRED"
echo "================================"
echo ""
read -p "Are you sure you want to DELETE these files? (type 'yes' to confirm): " confirmation

if [ "$confirmation" != "yes" ]; then
    echo "${YELLOW}❌ Deletion cancelled${NC}"
    exit 0
fi

echo ""
echo "${RED}⚠️  DELETING FILES...${NC}"
echo ""

# Delete the old data directory
if [ -d "public/data" ]; then
    rm -rf public/data
    echo "${GREEN}✅ Deleted: public/data/${NC}"
fi

# Show what remains
echo ""
echo "================================"
echo "✅ CLEANUP COMPLETE"
echo "================================"
echo ""
echo "Remaining data structure:"
echo "  ${GREEN}✓ public/data-v2/${NC} (new structure)"
echo "  ${GREEN}✓ data/${NC} (source data - kept for reference)"
echo ""

# Show final sizes
if [ -d "public/data-v2" ]; then
    new_size=$(du -sh public/data-v2 2>/dev/null | cut -f1)
    echo "New structure size: ${GREEN}$new_size${NC}"
fi

if [ -d "data" ]; then
    source_size=$(du -sh data 2>/dev/null | cut -f1)
    echo "Source data size: $source_size"
fi

echo ""
echo "🎉 Old data removed successfully!"
echo ""

