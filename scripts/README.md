# Scripts Directory

This directory contains all maintenance and data population scripts for the Marxists Explorer project, organized by type.

## 📁 Directory Structure

```
scripts/
├── python/          # Python data scraping and population scripts
├── shell/           # Shell utility scripts
├── typescript/      # TypeScript metadata and migration scripts
├── docs/            # Documentation for specific scripts
├── requirements.txt # Python dependencies
└── venv_subpaths/   # Python virtual environment
```

## 🐍 Python Scripts

Located in `python/` - Data scraping, population, and conversion tools.

### Web Scrapers (`python/scrapers/`)
Scripts that crawl the web for content:

- **`populate-thinker-works-final-parallel.py`** - Main script to populate thinker works data from MIA
- **`fetch-wikimedia-portraits-bundle-improved.py`** - Fetch portrait images from Wikimedia

### Data Processing (`python/`)
Local data processing and conversion:

- **`convert-bundle-to-efficient-formats.py`** - Convert data to efficient folder structure
- **`update_wiki_bios.py`** - Update Wikipedia bios for thinkers

### Setup
```bash
cd scripts
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## 🔧 Shell Scripts

Located in `shell/` - Quick utility scripts for cleanup and maintenance.

- **`cleanup-old-data.sh`** - Remove old data files after migration
- **`delete-old-data.sh`** - Delete deprecated data structures

### Usage
```bash
./shell/cleanup-old-data.sh
./shell/delete-old-data.sh
```

## 📘 TypeScript Scripts

Located in `typescript/` - Metadata and schema migration tools.

- **`populate-category-metadata.ts`** - Fetch and update category metadata from marxists.org
- **`migrate-to-folder-schema.ts`** - Migrate data to folder-based schema

### Usage
```bash
npx tsx typescript/populate-category-metadata.ts
npx tsx typescript/migrate-to-folder-schema.ts
```

## 📚 Documentation

Located in `docs/` - Additional documentation for specific scripts.

- **`README_CLEANUP.md`** - Documentation for cleanup scripts
- **`README_METADATA.md`** - Documentation for metadata population scripts

## Common Tasks

### Populate Category Metadata
```bash
npx tsx typescript/populate-category-metadata.ts
```
Updates category descriptions from marxists.org archive index.

### Populate Thinker Works
```bash
source venv/bin/activate
python python/scrapers/populate-thinker-works-final-parallel.py
```
Fetches works data from MIA for all thinkers.

### Fetch Portrait Images
```bash
source venv/bin/activate
python python/scrapers/fetch-wikimedia-portraits-bundle-improved.py
```
Downloads portrait images from Wikimedia Commons.

### Clean Up Old Data
```bash
./shell/cleanup-old-data.sh
```
Removes deprecated data files after migration.

## Script Categories

### Data Population
- Populating thinker data from MIA
- Fetching images from Wikimedia
- Updating bios from Wikipedia

### Data Migration
- Converting to folder-based schema
- Migrating to efficient formats
- Updating data structures

### Maintenance
- Cleaning up old data
- Updating metadata
- Managing dependencies

## Dependencies

### Python
- `beautifulsoup4` - HTML parsing
- `requests` - HTTP requests
- `lxml` - XML/HTML processing

Install with:
```bash
pip install -r requirements.txt
```

### Node.js/TypeScript
- `tsx` - TypeScript execution
- Already configured in project dependencies

## File Paths

All scripts reference paths relative to the project root:
- Python: `../data/`, `../public/data/`
- TypeScript: `../lib/`, `../public/data-v2/`
- Shell: Project root directories

## Best Practices

1. **Always review changes** before committing
   ```bash
   git diff
   ```

2. **Test scripts** with small samples first
   ```bash
   python python/fetch-wikimedia-portraits-bundle-improved.py 10
   ```

3. **Check logs** for errors and progress
   - Python scripts log to console
   - TypeScript scripts show detailed output

4. **Backup data** before major operations
   ```bash
   cp -r public/data public/data.backup
   ```

5. **Run from project root** for correct paths
   ```bash
   cd /path/to/marxists-explorer
   npx tsx scripts/typescript/populate-category-metadata.ts
   ```

## Troubleshooting

### Python Path Issues
If imports fail, ensure you're in the virtual environment:
```bash
source venv/bin/activate
```

### TypeScript Execution
Use `npx tsx` for execution, not `ts-node`:
```bash
npx tsx scripts/typescript/populate-category-metadata.ts
```

### Permission Errors (Shell Scripts)
Make scripts executable:
```bash
chmod +x shell/*.sh
```

## History

This directory was reorganized to group scripts by type for better maintainability. Original scripts are preserved in their respective subdirectories.
