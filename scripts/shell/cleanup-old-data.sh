#!/bin/bash

# Script to identify old data files that can be removed after migration
# This script will NOT delete anything - it only lists what can be removed

echo "🧹 Old Data Cleanup Analysis"
echo "============================"
echo ""
echo "This script identifies old data files that can be removed."
echo "Review the output and manually delete when ready."
echo ""

# Set colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track what would be removed
total_size=0
file_count=0

echo "📋 OLD DATA FILES TO REVIEW:"
echo ""

# Check if public/data exists
if [ -d "public/data" ]; then
    echo "${YELLOW}Directory: public/data/${NC}"
    
    # Check thinkers-by-category files
    if [ -d "public/data/thinkers-by-category" ]; then
        echo "  📁 public/data/thinkers-by-category/"
        
        for file in public/data/thinkers-by-category/*.json; do
            if [ -f "$file" ]; then
                size=$(du -h "$file" | cut -f1)
                echo "    ❌ $(basename $file) ($size)"
                file_count=$((file_count + 1))
            fi
        done
        
        # Calculate total size
        if [ -d "public/data/thinkers-by-category" ]; then
            dir_size=$(du -sh public/data/thinkers-by-category 2>/dev/null | cut -f1)
            echo "    Total: ${GREEN}$dir_size${NC}"
        fi
    fi
    
    # Check main works file
    if [ -f "public/data/thinkers-works.json" ]; then
        size=$(du -h public/data/thinkers-works.json | cut -f1)
        echo "  ❌ public/data/thinkers-works.json ($size)"
        echo "      ${RED}Large file (224KB+)- migrated to folder structure${NC}"
        file_count=$((file_count + 1))
    fi
    
    echo ""
fi

# Check if data/ directory exists (old data files)
if [ -d "data" ]; then
    echo "${YELLOW}Directory: data/${NC}"
    
    # Old data files that can be deleted
    if [ -f "data/thinkers-metadata.json" ]; then
        size=$(du -h data/thinkers-metadata.json | cut -f1)
        echo "  ❌ data/thinkers-metadata.json ($size)"
        echo "      ${RED}Migrated to data-v2 structure${NC}"
        file_count=$((file_count + 1))
    fi
    
    if [ -f "data/thinkers-works.json" ]; then
        size=$(du -h data/thinkers-works.json | cut -f1)
        echo "  ❌ data/thinkers-works.json ($size)"
        echo "      ${RED}Migrated to data-v2 structure${NC}"
        file_count=$((file_count + 1))
    fi
    
    if [ -f "data/thinkers-bundle.json" ]; then
        size=$(du -h data/thinkers-bundle.json | cut -f1)
        echo "  ❌ data/thinkers-bundle.json ($size)"
        echo "      ${RED}No longer used${NC}"
        file_count=$((file_count + 1))
    fi
    
    if [ -f "data/marx-works-by-subject.json" ]; then
        size=$(du -h data/marx-works-by-subject.json | cut -f1)
        echo "  ❌ data/marx-works-by-subject.json ($size)"
        echo "      ${RED}Migrated to data-v2/first-international/Karl Marx/${NC}"
        file_count=$((file_count + 1))
    fi
    
    if [ -f "data/lenin-works-by-subject.json" ]; then
        size=$(du -h data/lenin-works-by-subject.json | cut -f1)
        echo "  ❌ data/lenin-works-by-subject.json ($size)"
        echo "      ${RED}Migrated to data-v2/bolsheviks/Vladimir Lenin/${NC}"
        file_count=$((file_count + 1))
    fi
    
    if [ -f "data/marx-subjects.json" ]; then
        size=$(du -h data/marx-subjects.json | cut -f1)
        echo "  ❌ data/marx-subjects.json ($size)"
        echo "      ${RED}No longer used${NC}"
        file_count=$((file_count + 1))
    fi
    
    # Check categories directory - can be kept for reference
    if [ -d "data/categories" ]; then
        echo "  📁 data/categories/"
        echo "    ${GREEN}KEEP: Source data - useful for reference${NC}"
        
        # Show size
        dir_size=$(du -sh data/categories 2>/dev/null | cut -f1)
        echo "    Total: $dir_size"
    fi
    
    echo ""
fi

# Check for old loader file
if [ -f "lib/data/thinkers-data.ts" ]; then
    size=$(du -h lib/data/thinkers-data.ts | cut -f1)
    echo "${YELLOW}Old Loader File:${NC}"
    echo "  ❌ lib/data/thinkers-data.ts ($size)"
    echo "      ${RED}Replaced by folder-loader.ts${NC}"
    file_count=$((file_count + 1))
    echo ""
fi

# Summary
echo "============================"
echo "📊 SUMMARY"
echo "============================"
echo ""
echo "Files to delete (after review): ${RED}$file_count${NC}"
echo ""
echo "${GREEN}✅ KEEP:${NC}"
echo "  • public/data-v2/  (new folder structure)"
echo "  • data/  (source data - useful for reference)"
echo "  • lib/data/folder-loader.ts  (new loader)"
echo ""
echo "${RED}❌ DELETE (after testing):${NC}"
echo "  • public/data/  (old structure)"
echo "  • data/thinkers-metadata.json"
echo "  • data/thinkers-works.json"
echo "  • data/thinkers-bundle.json"
echo "  • data/marx-works-by-subject.json"
echo "  • data/lenin-works-by-subject.json"
echo "  • data/marx-subjects.json"
echo "  • lib/data/thinkers-data.ts"

# Calculate space that would be freed
if [ -d "public/data" ]; then
    old_size=$(du -sh public/data 2>/dev/null | cut -f1)
    new_size=$(du -sh public/data-v2 2>/dev/null | cut -f1)
    
    echo ""
    echo "📦 SIZE COMPARISON:"
    echo "  Old structure: ${YELLOW}$old_size${NC}"
    echo "  New structure: ${GREEN}$new_size${NC}"
fi

echo ""
echo "============================"
echo "⚠️  NEXT STEPS:"
echo "============================"
echo ""
echo "1. Test the app thoroughly:"
echo "   ${GREEN}npm run dev${NC}"
echo ""
echo "2. Verify all thinkers load correctly"
echo ""
echo "3. When ready to clean up, run the delete script:"
echo "   ${RED}./scripts/shell/delete-old-data.sh${NC}"
echo ""
echo "4. Or manually delete files:"
echo "   ${RED}rm -rf public/data${NC}"
echo "   ${RED}rm data/thinkers-*.json data/marx-*.json data/lenin-*.json${NC}"
echo "   ${RED}rm lib/data/thinkers-data.ts${NC}"
echo ""
echo "============================"

