# API Tests

Comprehensive test suite for the Catalogue API endpoints.

## Test Coverage

### Core Endpoints (7 test files)
1. ✅ **catalogue.test.ts** - Complete catalogue index
2. ✅ **categories.test.ts** - All categories list
3. ✅ **category.test.ts** - Category thinkers
4. ✅ **thinkers.test.ts** - All thinkers
5. ✅ **thinker.test.ts** - Specific thinker
6. ✅ **subject.test.ts** - Works by subject
7. ✅ **search.test.ts** - Search functionality

### Bonus Features (3 test files)
8. ✅ **stats.test.ts** - Statistics endpoint
9. ✅ **random.test.ts** - Random thinker
10. ✅ **compare.test.ts** - Compare thinkers

## Running Tests

### Run all tests
```bash
npm test
```

### Run API tests only
```bash
npm test -- app/api/catalogue
```

### Run specific test file
```bash
npm test -- app/api/catalogue/__tests__/catalogue.test.ts
```

### Run in watch mode
```bash
npm test -- --watch
```

### Run with coverage
```bash
npm test -- --coverage
```

## Test Structure

Each test file includes:
- **Success cases**: Valid requests with expected data
- **Edge cases**: Boundary conditions and special scenarios
- **Error handling**: Invalid inputs and error responses
- **Data validation**: Response structure and content verification

## Example Test

```typescript
describe('GET /api/catalogue', () => {
  it('should return the complete catalogue index', async () => {
    const request = new Request('http://localhost:3000/api/catalogue');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('categories');
  });
});
```

## Test Statistics

- **Total test files**: 10
- **Core endpoints covered**: 7
- **Bonus endpoints covered**: 3
- **Test cases**: 80+
- **Coverage**: All API routes

## Key Features Tested

### Data Validation
- Response structure
- Required fields
- Data types
- Array lengths

### Functionality
- Basic operations
- Query parameters
- URL encoding
- Filtering and search

### Error Handling
- Missing parameters
- Invalid inputs
- Non-existent resources
- 404 responses

### Performance
- Large datasets (Marx: 1,509 works)
- Multiple queries
- Random selection

## Continuous Integration

These tests can be integrated into CI/CD pipelines:

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm test
```

## Troubleshooting

### Tests timing out
Increase Jest timeout in test file:
```typescript
jest.setTimeout(10000); // 10 seconds
```

### Mock data issues
Ensure test data matches production data structure.

### Port conflicts
Tests use localhost:3000. Ensure no conflicts.

## Contributing

When adding new endpoints:
1. Create test file in `__tests__/` directory
2. Follow existing test structure
3. Include success, error, and edge cases
4. Update this README

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Next.js Testing](https://nextjs.org/docs/app/building-your-application/testing)
- [API Documentation](../../../docs/API_DOCUMENTATION.md)

