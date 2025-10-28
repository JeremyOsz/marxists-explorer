# Catalogue API - Feature Suggestions

## Overview

This document outlines potential enhancements to the Catalogue API that would improve functionality, user experience, and data accessibility.

---

## 🎯 High Priority Features

### 1. Statistics & Analytics Endpoints

**Rationale**: Provide insights into the catalogue's content and usage patterns.

#### Proposed Endpoints

**GET `/api/catalogue/stats`**
```json
{
  "success": true,
  "data": {
    "totalThinkers": 634,
    "totalWorks": 15420,
    "totalCategories": 32,
    "totalSubjects": 127,
    "topCategories": [
      { "name": "Bolsheviks", "thinkers": 88, "works": 2540 },
      { "name": "Early Comintern", "thinkers": 126, "works": 1890 }
    ],
    "topSubjects": [
      { "name": "Political Theory", "works": 3420, "thinkers": 234 },
      { "name": "Philosophy", "works": 2150, "thinkers": 189 }
    ],
    "mostProlificThinkers": [
      { "name": "Karl Marx", "works": 1509 },
      { "name": "Vladimir Lenin", "works": 115 }
    ]
  }
}
```

**GET `/api/catalogue/categories/[category]/stats`**
```json
{
  "success": true,
  "data": {
    "category": "First International",
    "thinkers": 16,
    "totalWorks": 1624,
    "subjects": [
      { "name": "Economics", "works": 89 },
      { "name": "Philosophy", "works": 156 }
    ],
    "averageWorksPerThinker": 101.5
  }
}
```

---

### 2. Pagination Support

**Rationale**: Handle large result sets efficiently and improve performance.

#### Implementation

Add query parameters to list endpoints:
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20, max: 100)

**GET `/api/catalogue/thinkers?page=2&limit=50`**
```json
{
  "success": true,
  "data": {
    "thinkers": [...],
    "pagination": {
      "page": 2,
      "limit": 50,
      "total": 634,
      "totalPages": 13,
      "hasNext": true,
      "hasPrev": true
    }
  }
}
```

---

### 3. Advanced Filtering & Sorting

**Rationale**: Enable more precise queries and better user experience.

#### Proposed Query Parameters

**Filtering:**
```
GET /api/catalogue/thinkers?
  min_works=100&
  max_works=2000&
  category=bolsheviks&
  has_major_works=true
```

**Sorting:**
```
GET /api/catalogue/thinkers?
  sort_by=work_count&
  order=desc
```

**Available sort fields:**
- `name` - Alphabetical by name
- `work_count` - Number of works
- `category` - By category name
- `recent` - Recently added (if timestamp available)

**Response:**
```json
{
  "success": true,
  "data": {
    "filters": {
      "minWorks": 100,
      "maxWorks": 2000,
      "category": "bolsheviks"
    },
    "sort": {
      "by": "work_count",
      "order": "desc"
    },
    "results": [...],
    "count": 15
  }
}
```

---

### 4. Advanced Search Features

**Rationale**: More powerful search capabilities for better discoverability.

#### Enhancements

**GET `/api/catalogue/search/advanced`**

Query parameters:
- `q`: Main search query
- `field`: Search specific fields (name, description, category)
- `fuzzy`: Enable fuzzy matching
- `exact`: Exact phrase matching
- `exclude`: Terms to exclude

```bash
# Search for "revolution" in descriptions, exclude "french"
GET /api/catalogue/search/advanced?
  q=revolution&
  field=description&
  exclude=french
```

**Full-text work search:**
```bash
GET /api/catalogue/works/search?q=dialectical+materialism
```

**Response:**
```json
{
  "success": true,
  "data": {
    "query": "dialectical materialism",
    "results": [
      {
        "thinker": "Karl Marx",
        "category": "First International",
        "work": {
          "title": "Das Kapital, Volume I",
          "url": "...",
          "subject": "Economics"
        }
      }
    ],
    "count": 47
  }
}
```

---

## 📊 Analytics & Insights Features

### 5. Subject Network Analysis

**GET `/api/catalogue/subjects/network`**

Show relationships between subjects and thinkers.

```json
{
  "success": true,
  "data": {
    "subjects": [
      {
        "name": "Economics",
        "thinkers": 234,
        "works": 1240,
        "relatedSubjects": [
          { "name": "Political Theory", "overlap": 180 },
          { "name": "Historical Materialism", "overlap": 95 }
        ]
      }
    ]
  }
}
```

### 6. Compare Thinkers

**GET `/api/catalogue/compare?thinkers=Karl Marx,Vladimir Lenin`**

```json
{
  "success": true,
  "data": {
    "comparison": [
      {
        "name": "Karl Marx",
        "works": 1509,
        "subjects": 29,
        "topSubjects": ["Art and Literature", "Marx Quotes", "Ireland"]
      },
      {
        "name": "Vladimir Lenin",
        "works": 115,
        "subjects": 8,
        "topSubjects": ["On the National Question", "On the Emancipation of Women"]
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

---

## 🔍 Discovery Features

### 7. Random Thinker/Work

**Rationale**: Help users discover new content.

**GET `/api/catalogue/random/thinker`**
```json
{
  "success": true,
  "data": {
    "name": "Rosa Luxemburg",
    "category": "Social Democracy",
    "description": "...",
    "workCount": 45
  }
}
```

**GET `/api/catalogue/random/work?category=bolsheviks`**
```json
{
  "success": true,
  "data": {
    "title": "The State and Revolution",
    "url": "...",
    "thinker": "Vladimir Lenin",
    "subject": "Political Theory"
  }
}
```

### 8. Related Thinkers

**GET `/api/catalogue/thinkers/[category]/[name]/related`**

Suggest related thinkers based on:
- Same category
- Similar subjects
- Contemporary period
- Ideological similarity

```json
{
  "success": true,
  "data": {
    "thinker": "Karl Marx",
    "related": [
      {
        "name": "Friedrich Engels",
        "reason": "Same category, collaborated extensively",
        "similarity": 0.95
      },
      {
        "name": "Vladimir Lenin",
        "reason": "Developed Marxist theory",
        "similarity": 0.78
      }
    ]
  }
}
```

### 9. Trending & Popular

**GET `/api/catalogue/trending`**

Based on search frequency, API calls, or manual curation.

```json
{
  "success": true,
  "data": {
    "thinkers": [
      { "name": "Karl Marx", "views": 15420, "trend": "+12%" },
      { "name": "Rosa Luxemburg", "views": 8920, "trend": "+45%" }
    ],
    "subjects": [
      { "name": "Political Theory", "views": 25600 },
      { "name": "Economics", "views": 19800 }
    ]
  }
}
```

---

## 💾 Export & Format Features

### 10. Multiple Export Formats

**GET `/api/catalogue/thinkers/[category]/[name]/export?format=json|csv|bibtex|md`**

**CSV Export:**
```csv
Title,URL,Subject
"Das Kapital, Volume I","https://...","Economics"
"The Communist Manifesto","https://...","Political Theory"
```

**BibTeX Export:**
```bibtex
@book{marx1867kapital,
  title={Das Kapital, Volume I},
  author={Marx, Karl},
  year={1867},
  url={https://...}
}
```

**Markdown Export:**
```markdown
# Karl Marx - Works

## Economics
- [Das Kapital, Volume I](https://...)
- [Wage Labour and Capital](https://...)
```

### 11. Bulk Operations

**POST `/api/catalogue/bulk/thinkers`**

Request body:
```json
{
  "thinkers": [
    { "category": "first-international", "name": "Karl Marx" },
    { "category": "bolsheviks", "name": "Vladimir Lenin" }
  ],
  "include": ["works", "majorWorks"]
}
```

Response: Array of thinker objects

---

## 🔗 Cross-Reference Features

### 12. Work Citations & References

**GET `/api/catalogue/works/[id]/references`**

Track which works reference others.

```json
{
  "success": true,
  "data": {
    "work": "Das Kapital, Volume I",
    "referencedBy": [
      {
        "thinker": "Vladimir Lenin",
        "work": "Imperialism, the Highest Stage of Capitalism",
        "context": "Economic analysis"
      }
    ],
    "references": [
      {
        "author": "David Ricardo",
        "work": "On the Principles of Political Economy and Taxation"
      }
    ]
  }
}
```

### 13. Subject Cross-References

**GET `/api/catalogue/subjects/[subject]/cross-references`**

```json
{
  "success": true,
  "data": {
    "subject": "Economics",
    "also_tagged_as": [
      { "subject": "Political Economy", "overlap": 156 },
      { "subject": "Historical Materialism", "overlap": 89 }
    ],
    "frequently_with": [
      { "subject": "Philosophy", "co_occurrence": 234 }
    ]
  }
}
```

---

## 📅 Timeline Features

### 14. Chronological View

**GET `/api/catalogue/timeline?start_year=1840&end_year=1920`**

```json
{
  "success": true,
  "data": {
    "timeline": [
      {
        "year": 1848,
        "works": [
          {
            "title": "The Communist Manifesto",
            "author": "Karl Marx",
            "significance": "major"
          }
        ]
      },
      {
        "year": 1867,
        "works": [
          {
            "title": "Das Kapital, Volume I",
            "author": "Karl Marx",
            "significance": "major"
          }
        ]
      }
    ]
  }
}
```

### 15. Thinker Timeline

**GET `/api/catalogue/thinkers/[category]/[name]/timeline`**

Chronological list of a thinker's works (if dates available).

---

## 🎨 Presentation Features

### 16. Metadata Enhancement

Add richer metadata to works:
- Publication year
- Original language
- Word count (if available)
- Tags/keywords
- Difficulty level
- Reading time estimate

**Response with enhanced metadata:**
```json
{
  "title": "Das Kapital, Volume I",
  "url": "...",
  "year": 1867,
  "language": "German",
  "translated": true,
  "tags": ["economics", "capitalism", "labor-theory"],
  "difficulty": "advanced",
  "estimatedReadingTime": "40 hours"
}
```

### 17. Thumbnail & Image Support

**GET `/api/catalogue/thinkers/[category]/[name]/images`**

```json
{
  "success": true,
  "data": {
    "portrait": "https://.../marx-portrait.jpg",
    "thumbnail": "https://.../marx-thumb.jpg",
    "gallery": [
      "https://.../marx-young.jpg",
      "https://.../marx-statue.jpg"
    ]
  }
}
```

---

## 🔐 User Features (Optional)

### 18. Bookmarks & Favorites

**POST `/api/catalogue/user/bookmarks`**

Allow users to save favorites (requires auth).

```json
{
  "type": "thinker|work",
  "id": "karl-marx",
  "category": "first-international"
}
```

**GET `/api/catalogue/user/bookmarks`**

Returns user's saved items.

### 19. Reading Lists

**POST `/api/catalogue/user/reading-lists`**

Create custom reading lists.

```json
{
  "name": "Introduction to Marxism",
  "works": [
    {
      "thinker": "Karl Marx",
      "work": "The Communist Manifesto"
    },
    {
      "thinker": "Vladimir Lenin",
      "work": "The State and Revolution"
    }
  ]
}
```

---

## 🚀 Performance Features

### 20. Caching Headers

Add proper cache headers:
```http
Cache-Control: public, max-age=3600
ETag: "abc123"
Last-Modified: Mon, 28 Oct 2024 01:00:00 GMT
```

### 21. Compression

Support compressed responses:
```http
Accept-Encoding: gzip, deflate
```

### 22. GraphQL Alternative

Provide a GraphQL endpoint for flexible querying:

```graphql
query {
  thinker(category: "first-international", name: "Karl Marx") {
    name
    workCount
    works(subject: "Economics") {
      title
      url
    }
  }
}
```

---

## 📱 API Versioning

### 23. Version Strategy

Implement API versioning:

```
/api/v1/catalogue/...
/api/v2/catalogue/...
```

Or use headers:
```http
Accept: application/vnd.marxists-explorer.v1+json
```

---

## Implementation Priority

### Phase 1 (Quick Wins)
1. ✅ Statistics endpoint
2. ✅ Pagination
3. ✅ Basic sorting
4. ✅ Random thinker/work

### Phase 2 (Enhanced Discovery)
5. ✅ Advanced filtering
6. ✅ Related thinkers
7. ✅ Export formats
8. ✅ Trending/popular

### Phase 3 (Advanced Features)
9. ✅ Compare thinkers
10. ✅ Full-text work search
11. ✅ Cross-references
12. ✅ Timeline features

### Phase 4 (User Features)
13. ✅ Bookmarks/favorites
14. ✅ Reading lists
15. ✅ User authentication

### Phase 5 (Performance & Scale)
16. ✅ GraphQL support
17. ✅ Caching optimization
18. ✅ Rate limiting
19. ✅ API analytics

---

## Technical Considerations

### Data Requirements

Some features require additional data:
- **Timeline features**: Need publication dates for works
- **Trending**: Requires usage tracking/analytics
- **References**: Need citation data
- **Difficulty levels**: Manual curation needed

### Storage

User features require database:
- PostgreSQL for relational data
- Redis for caching and sessions
- Elasticsearch for full-text search

### Performance

- Implement caching layer (Redis)
- Add database indexes
- Use CDN for static assets
- Consider read replicas for scale

---

## Conclusion

These features would transform the Catalogue API from a simple data access layer into a comprehensive research and discovery platform. Prioritize based on:

1. **User value**: Features most requested by users
2. **Technical feasibility**: Easy wins vs complex implementations
3. **Data availability**: What data do we already have?
4. **Maintenance burden**: Long-term support requirements

Start with Phase 1 features and gather user feedback before moving to more complex implementations.

