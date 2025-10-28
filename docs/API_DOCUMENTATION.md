# Catalogue API Documentation

## Overview

The Catalogue API provides programmatic access to the Marxists Explorer data, including categories, thinkers, and their works.

Base URL: `/api/catalogue`

All responses follow this format:
```json
{
  "success": true|false,
  "data": { ... },
  "error": "error message" // only if success is false
}
```

---

## Endpoints

### 1. Get Complete Catalogue Index

**GET** `/api/catalogue`

Returns the complete catalogue index with all categories.

**Response:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "first-international",
        "name": "First International",
        "path": "first-international",
        "count": 16
      },
      ...
    ]
  }
}
```

**Example:**
```bash
curl http://localhost:3000/api/catalogue
```

---

### 2. Get All Categories

**GET** `/api/catalogue/categories`

Returns a list of all available category IDs.

**Response:**
```json
{
  "success": true,
  "data": {
    "categories": [
      "first-international",
      "bolsheviks",
      "anarchists",
      ...
    ],
    "count": 32
  }
}
```

**Example:**
```bash
curl http://localhost:3000/api/catalogue/categories
```

---

### 3. Get Category Thinkers

**GET** `/api/catalogue/categories/[category]`

Returns all thinkers in a specific category (metadata only, without works).

**Parameters:**
- `category` (path): Category ID or name

**Response:**
```json
{
  "success": true,
  "data": {
    "category": "First International",
    "thinkers": [
      {
        "name": "Karl Marx",
        "category": "First International",
        "description": "German philosopher, economist...",
        "bioUrl": "https://...",
        "imageUrl": "https://...",
        "workCount": 1509,
        "majorWorks": [...],
        "works": []
      },
      ...
    ],
    "count": 16
  }
}
```

**Examples:**
```bash
# Get First International thinkers
curl http://localhost:3000/api/catalogue/categories/first-international

# Get Bolsheviks
curl http://localhost:3000/api/catalogue/categories/bolsheviks
```

---

### 4. Get All Thinkers

**GET** `/api/catalogue/thinkers`

Returns all thinkers from all categories (metadata only, without works).

**Response:**
```json
{
  "success": true,
  "data": {
    "thinkers": [...],
    "count": 634
  }
}
```

**Example:**
```bash
curl http://localhost:3000/api/catalogue/thinkers
```

---

### 5. Get Specific Thinker

**GET** `/api/catalogue/thinkers/[category]/[name]`

Returns a specific thinker with all their works.

**Parameters:**
- `category` (path): Category ID
- `name` (path): Thinker name (URL encoded)
- `metadata_only` (query): If `true`, returns only subjects without loading all works

**Response (full data):**
```json
{
  "success": true,
  "data": {
    "name": "Karl Marx",
    "category": "First International",
    "description": "...",
    "bioUrl": "...",
    "imageUrl": "...",
    "workCount": 1509,
    "majorWorks": [...],
    "works": [
      {
        "title": "Das Kapital, Volume I",
        "url": "https://..."
      },
      ...
    ]
  }
}
```

**Response (metadata only):**
```json
{
  "success": true,
  "data": {
    "category": "First International",
    "name": "Karl Marx",
    "subjects": [
      "Anarchism",
      "Art and Literature",
      "Economics",
      ...
    ]
  }
}
```

**Examples:**
```bash
# Get Karl Marx with all works
curl http://localhost:3000/api/catalogue/thinkers/first-international/Karl%20Marx

# Get only metadata and subjects
curl http://localhost:3000/api/catalogue/thinkers/first-international/Karl%20Marx?metadata_only=true

# Get Lenin
curl http://localhost:3000/api/catalogue/thinkers/bolsheviks/Vladimir%20Lenin
```

---

### 6. Get Thinker Works by Subject

**GET** `/api/catalogue/thinkers/[category]/[name]/subjects/[subject]`

Returns works for a specific thinker filtered by subject.

**Parameters:**
- `category` (path): Category ID
- `name` (path): Thinker name (URL encoded)
- `subject` (path): Subject name (URL encoded)

**Response:**
```json
{
  "success": true,
  "data": {
    "category": "First International",
    "thinker": "Karl Marx",
    "subject": "Economics",
    "works": [
      {
        "title": "Wage Labour and Capital",
        "url": "https://..."
      },
      ...
    ],
    "count": 34
  }
}
```

**Examples:**
```bash
# Get Marx's works on Economics
curl http://localhost:3000/api/catalogue/thinkers/first-international/Karl%20Marx/subjects/Economics

# Get Lenin's works on the National Question
curl http://localhost:3000/api/catalogue/thinkers/bolsheviks/Vladimir%20Lenin/subjects/On%20the%20National%20Question
```

---

### 7. Search Catalogue

**GET** `/api/catalogue/search`

Search thinkers by name, description, or category.

**Query Parameters:**
- `q` (optional): Search query (searches in name, description, category)
- `category` (optional): Filter by category

**Response:**
```json
{
  "success": true,
  "data": {
    "query": "marx",
    "category": null,
    "results": [...],
    "count": 5
  }
}
```

**Examples:**
```bash
# Search for "marx"
curl http://localhost:3000/api/catalogue/search?q=marx

# Search within a category
curl http://localhost:3000/api/catalogue/search?category=bolsheviks

# Search for Lenin within Bolsheviks
curl http://localhost:3000/api/catalogue/search?q=lenin&category=bolsheviks
```

---

## Common Use Cases

### 1. Build a Category Browser
```javascript
// Get all categories
const { data } = await fetch('/api/catalogue').then(r => r.json());
const categories = data.categories;

// Get thinkers in a category
const response = await fetch('/api/catalogue/categories/first-international');
const { thinkers } = await response.json().then(r => r.data);
```

### 2. Load Thinker Profile
```javascript
// Get thinker with all works
const response = await fetch('/api/catalogue/thinkers/first-international/Karl%20Marx');
const thinker = await response.json().then(r => r.data);

console.log(thinker.name, thinker.workCount);
thinker.works.forEach(work => console.log(work.title));
```

### 3. Lazy Load Works by Subject
```javascript
// First get metadata only
const response = await fetch(
  '/api/catalogue/thinkers/first-international/Karl%20Marx?metadata_only=true'
);
const { subjects } = await response.json().then(r => r.data);

// Then load specific subject
const worksResponse = await fetch(
  '/api/catalogue/thinkers/first-international/Karl%20Marx/subjects/Economics'
);
const { works } = await worksResponse.json().then(r => r.data);
```

### 4. Search Functionality
```javascript
// Search across all thinkers
const searchQuery = 'revolution';
const response = await fetch(`/api/catalogue/search?q=${searchQuery}`);
const { results, count } = await response.json().then(r => r.data);

console.log(`Found ${count} results for "${searchQuery}"`);
```

---

## Error Handling

All endpoints return appropriate HTTP status codes:

- **200**: Success
- **400**: Bad request (missing required parameters)
- **404**: Resource not found
- **500**: Server error

Error response format:
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

**Example error handling:**
```javascript
const response = await fetch('/api/catalogue/thinkers/invalid/name');
const result = await response.json();

if (!result.success) {
  console.error('API Error:', result.error);
}
```

---

## Rate Limiting

Currently, there are no rate limits on the API. However, it's recommended to:

1. Cache responses when possible
2. Use `metadata_only=true` when you don't need full work lists
3. Load works by subject instead of loading all works at once

---

## Data Format

### Thinker Object
```typescript
interface Thinker {
  name: string;
  category: string;
  description: string;
  bioUrl: string;
  imageUrl: string;
  thumbnailUrl?: string;
  workCount: number;
  works: Work[];
  majorWorks?: Work[];
}
```

### Work Object
```typescript
interface Work {
  title: string;
  url: string;
}
```

### Category Object
```typescript
interface Category {
  id: string;
  name: string;
  path: string;
  count: number;
}
```

