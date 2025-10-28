# Catalogue API

REST API for accessing the Marxists Explorer catalogue data.

## Endpoints

```
GET /api/catalogue                                                 - Complete catalogue index
GET /api/catalogue/categories                                      - List all categories
GET /api/catalogue/categories/[category]                          - Thinkers in category
GET /api/catalogue/thinkers                                        - All thinkers (metadata)
GET /api/catalogue/thinkers/[category]/[name]                     - Specific thinker
GET /api/catalogue/thinkers/[category]/[name]/subjects/[subject]  - Works by subject
GET /api/catalogue/search?q=...&category=...                      - Search thinkers
```

## Directory Structure

```
app/api/catalogue/
├── route.ts                                    # GET /api/catalogue
├── categories/
│   ├── route.ts                               # GET /api/catalogue/categories
│   └── [category]/
│       └── route.ts                           # GET /api/catalogue/categories/[category]
├── thinkers/
│   ├── route.ts                               # GET /api/catalogue/thinkers
│   └── [category]/
│       └── [name]/
│           ├── route.ts                       # GET /api/catalogue/thinkers/[category]/[name]
│           └── subjects/
│               └── [subject]/
│                   └── route.ts               # GET /api/catalogue/thinkers/[category]/[name]/subjects/[subject]
├── search/
│   └── route.ts                               # GET /api/catalogue/search
└── README.md                                  # This file
```

## Quick Examples

### Get all categories
```bash
curl http://localhost:3000/api/catalogue/categories
```

### Get Karl Marx with all works
```bash
curl http://localhost:3000/api/catalogue/thinkers/first-international/Karl%20Marx
```

### Get Marx's Economics works
```bash
curl http://localhost:3000/api/catalogue/thinkers/first-international/Karl%20Marx/subjects/Economics
```

### Search for thinkers
```bash
curl http://localhost:3000/api/catalogue/search?q=marx
```

## Full Documentation

See [/docs/API_DOCUMENTATION.md](/docs/API_DOCUMENTATION.md) for complete API documentation.

## Testing

Run the test suite:
```bash
npm run dev  # Start dev server first
node scripts/typescript/test-catalogue-api.mjs
```

