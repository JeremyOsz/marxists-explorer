# Catalogue API - Example Implementations

This document shows practical examples of suggested API features that have been implemented.

---

## 📊 Statistics Endpoint

**Endpoint**: `GET /api/catalogue/stats`

**Purpose**: Provides overview statistics about the entire catalogue.

### Example Request

```bash
curl http://localhost:3000/api/catalogue/stats
```

### Example Response

```json
{
  "success": true,
  "data": {
    "totalThinkers": 634,
    "totalWorks": 15420,
    "totalCategories": 32,
    "averageWorksPerThinker": 24,
    "topCategories": [
      {
        "name": "Bolsheviks",
        "thinkers": 88,
        "works": 2540
      },
      {
        "name": "Early Comintern",
        "thinkers": 126,
        "works": 1890
      }
    ],
    "mostProlificThinkers": [
      {
        "name": "Karl Marx",
        "category": "First International",
        "works": 1509
      },
      {
        "name": "Vladimir Lenin",
        "category": "Bolsheviks",
        "works": 115
      }
    ],
    "lastUpdated": "2024-10-28T01:30:00.000Z"
  }
}
```

### Use Cases

- Dashboard displays
- Overview pages
- Analytics
- Content planning

---

## 🎲 Random Thinker

**Endpoint**: `GET /api/catalogue/random/thinker`

**Purpose**: Get a random thinker for discovery and exploration.

### Example Request

```bash
# Random thinker from any category
curl http://localhost:3000/api/catalogue/random/thinker

# Random thinker from specific category
curl http://localhost:3000/api/catalogue/random/thinker?category=bolsheviks
```

### Example Response

```json
{
  "success": true,
  "data": {
    "name": "Rosa Luxemburg",
    "category": "Social Democracy",
    "description": "Polish-German Marxist theorist, socialist philosopher...",
    "bioUrl": "https://...",
    "imageUrl": "https://...",
    "workCount": 67,
    "majorWorks": [
      {
        "title": "The Accumulation of Capital",
        "url": "https://..."
      }
    ]
  }
}
```

### Use Cases

- "Discover a thinker" feature
- Random quote generators
- Educational tools
- Content rotation

### Client Usage

```typescript
import { CatalogueClient } from '@/lib/api/catalogue-client';

// Add to client (example extension)
export async function getRandomThinker(category?: string): Promise<Thinker> {
  const params = category ? `?category=${encodeURIComponent(category)}` : '';
  const response = await fetch(`/api/catalogue/random/thinker${params}`);
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error);
  }
  
  return result.data;
}

// Usage
const randomThinker = await getRandomThinker();
const randomBolshevik = await getRandomThinker('bolsheviks');
```

---

## 🔄 Compare Thinkers

**Endpoint**: `GET /api/catalogue/thinkers/compare`

**Purpose**: Compare multiple thinkers side-by-side.

### Example Request

```bash
curl "http://localhost:3000/api/catalogue/thinkers/compare?thinkers=Karl%20Marx,Vladimir%20Lenin,Rosa%20Luxemburg"
```

### Example Response

```json
{
  "success": true,
  "data": {
    "comparison": [
      {
        "name": "Karl Marx",
        "category": "First International",
        "description": "German philosopher, economist...",
        "works": 1509,
        "subjects": 29,
        "majorWorks": 10
      },
      {
        "name": "Vladimir Lenin",
        "category": "Bolsheviks",
        "description": "Russian revolutionary...",
        "works": 115,
        "subjects": 8,
        "majorWorks": 12
      },
      {
        "name": "Rosa Luxemburg",
        "category": "Social Democracy",
        "description": "Polish-German Marxist...",
        "works": 67,
        "subjects": 12,
        "majorWorks": 5
      }
    ],
    "sharedSubjects": [
      "Philosophy",
      "Economics",
      "Political Theory"
    ]
  }
}
```

### Use Cases

- Comparison pages
- Educational content
- Research tools
- Content recommendations

### Frontend Example

```tsx
import { useState } from 'react';

function ThinkerComparison() {
  const [comparison, setComparison] = useState(null);
  
  async function compare(thinkers: string[]) {
    const response = await fetch(
      `/api/catalogue/thinkers/compare?thinkers=${thinkers.join(',')}`
    );
    const result = await response.json();
    
    if (result.success) {
      setComparison(result.data);
    }
  }
  
  return (
    <div>
      <button onClick={() => compare(['Karl Marx', 'Vladimir Lenin'])}>
        Compare Marx and Lenin
      </button>
      
      {comparison && (
        <div>
          <h2>Comparison</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Works</th>
                <th>Subjects</th>
              </tr>
            </thead>
            <tbody>
              {comparison.comparison.map(t => (
                <tr key={t.name}>
                  <td>{t.name}</td>
                  <td>{t.works}</td>
                  <td>{t.subjects}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div>
            <h3>Shared Subjects</h3>
            <ul>
              {comparison.sharedSubjects.map(s => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 📄 Pagination Example (Proposed)

**Endpoint**: `GET /api/catalogue/thinkers?page=1&limit=20`

### Implementation Guide

Add to existing `/api/catalogue/thinkers/route.ts`:

```typescript
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    
    const allThinkers = await loadAllThinkersMetadata();
    
    // Calculate pagination
    const total = allThinkers.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedThinkers = allThinkers.slice(startIndex, endIndex);
    
    return NextResponse.json({
      success: true,
      data: {
        thinkers: paginatedThinkers,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    // error handling
  }
}
```

### Usage Example

```typescript
async function loadThinkersPage(page: number = 1, limit: number = 20) {
  const response = await fetch(
    `/api/catalogue/thinkers?page=${page}&limit=${limit}`
  );
  const result = await response.json();
  
  if (result.success) {
    const { thinkers, pagination } = result.data;
    
    console.log(`Page ${pagination.page} of ${pagination.totalPages}`);
    console.log(`Showing ${thinkers.length} of ${pagination.total} thinkers`);
    
    return { thinkers, pagination };
  }
}

// Usage
const page1 = await loadThinkersPage(1, 50);
const page2 = await loadThinkersPage(2, 50);
```

---

## 🔍 Advanced Search Example (Proposed)

**Endpoint**: `GET /api/catalogue/search/advanced`

### Implementation Sketch

```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const query = searchParams.get('q')?.toLowerCase() || '';
  const field = searchParams.get('field'); // 'name' | 'description' | 'category'
  const fuzzy = searchParams.get('fuzzy') === 'true';
  const exact = searchParams.get('exact') === 'true';
  const exclude = searchParams.get('exclude')?.toLowerCase();
  
  const allThinkers = await loadAllThinkersMetadata();
  
  let results = allThinkers;
  
  // Apply field-specific search
  if (field && query) {
    results = results.filter(t => {
      const value = t[field as keyof typeof t]?.toString().toLowerCase();
      if (exact) {
        return value === query;
      }
      return value?.includes(query);
    });
  } else if (query) {
    // Search all fields
    results = results.filter(t =>
      t.name.toLowerCase().includes(query) ||
      t.description?.toLowerCase().includes(query) ||
      t.category.toLowerCase().includes(query)
    );
  }
  
  // Apply exclusions
  if (exclude) {
    results = results.filter(t =>
      !t.name.toLowerCase().includes(exclude) &&
      !t.description?.toLowerCase().includes(exclude)
    );
  }
  
  return NextResponse.json({
    success: true,
    data: {
      query,
      filters: { field, fuzzy, exact, exclude },
      results,
      count: results.length,
    },
  });
}
```

---

## 🎯 Quick Implementation Checklist

### Already Implemented ✅
- [x] Statistics endpoint
- [x] Random thinker endpoint
- [x] Compare thinkers endpoint

### Easy to Implement (< 1 hour)
- [ ] Pagination for list endpoints
- [ ] Sorting by name/work count
- [ ] Category statistics endpoint
- [ ] Random work endpoint

### Medium Complexity (2-4 hours)
- [ ] Advanced search with field filtering
- [ ] Export to CSV/Markdown
- [ ] Related thinkers suggestions
- [ ] Subject network analysis

### Complex (1+ days)
- [ ] Full-text work search
- [ ] Timeline/chronological features
- [ ] User bookmarks/favorites (requires auth)
- [ ] GraphQL endpoint

---

## Testing New Features

Update the test script to include new endpoints:

```javascript
// Add to scripts/typescript/test-catalogue-api.mjs

// Test statistics
await testAPI('/api/catalogue/stats', 'Get Catalogue Statistics');

// Test random thinker
await testAPI('/api/catalogue/random/thinker', 'Get Random Thinker');
await testAPI('/api/catalogue/random/thinker?category=bolsheviks', 'Get Random Bolshevik');

// Test comparison
await testAPI(
  '/api/catalogue/thinkers/compare?thinkers=Karl%20Marx,Vladimir%20Lenin',
  'Compare Marx and Lenin'
);
```

---

## Performance Considerations

### Caching Recommendations

For expensive operations like statistics:

```typescript
// Add caching layer
const statsCache = new Map();
const CACHE_TTL = 3600000; // 1 hour

export async function GET() {
  const cached = statsCache.get('stats');
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }
  
  // Compute stats...
  const stats = await computeStats();
  
  statsCache.set('stats', {
    data: { success: true, data: stats },
    timestamp: Date.now(),
  });
  
  return NextResponse.json({ success: true, data: stats });
}
```

### Database Considerations

For features like trending, bookmarks, or analytics:

```sql
-- Track API calls (optional analytics table)
CREATE TABLE api_calls (
  id SERIAL PRIMARY KEY,
  endpoint VARCHAR(255),
  thinker_name VARCHAR(255),
  category VARCHAR(100),
  timestamp TIMESTAMP DEFAULT NOW()
);

-- User bookmarks (if implementing user features)
CREATE TABLE bookmarks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  type VARCHAR(50),
  thinker_name VARCHAR(255),
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Conclusion

These implementations demonstrate how the suggested features can be added incrementally to enhance the API's functionality. Start with the simpler features (statistics, random, compare) and expand based on user feedback and usage patterns.

