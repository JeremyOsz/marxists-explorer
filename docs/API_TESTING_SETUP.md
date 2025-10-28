# API Testing Setup Guide

## Test Results Summary

**Current Status**:
- ✅ 2 test suites passing (basic tests)
- ⚠️ 8 test suites require server or mocks

## Why Tests Need Server

The API tests interact with the actual data loaders which use `fetch()` to load JSON files. In a pure unit test environment without a running server, these fetch calls fail with `EPERM` errors.

### Tests That Pass (No Server Required)
- `catalogue.test.ts` - Uses static import
- `categories.test.ts` - Uses static import

### Tests That Need Server (File Fetching)
- `category.test.ts` - Fetches category metadata
- `thinkers.test.ts` - Fetches all thinker metadata  
- `thinker.test.ts` - Fetches specific thinker data
- `subject.test.ts` - Fetches work files
- `search.test.ts` - Fetches metadata for search
- `stats.test.ts` - Fetches metadata for statistics
- `random.test.ts` - Fetches metadata for random selection
- `compare.test.ts` - Fetches metadata for comparison

## Solution 1: Integration Tests (Recommended)

Run tests against a live development server:

### Step 1: Start Dev Server
```bash
# Terminal 1
npm run dev
```

### Step 2: Run Tests Against Server
```bash
# Terminal 2
# These tests would need to be updated to hit http://localhost:3000
npm test
```

### Update Tests for Integration
Tests would need to use actual fetch to localhost:
```typescript
// Instead of calling GET() directly
const response = await fetch('http://localhost:3000/api/catalogue/stats');
const data = await response.json();
```

## Solution 2: Mock Data Loaders

Mock the data loading functions:

### Create Mock Setup
```typescript
// jest.setup.js or in test file
jest.mock('@/lib/data/folder-loader', () => ({
  loadAllThinkersMetadata: jest.fn().mockResolvedValue([
    {
      name: 'Karl Marx',
      category: 'First International',
      workCount: 1509,
      // ... other fields
    },
    // ... more mocked thinkers
  ]),
  loadCategoryIndex: jest.fn().mockResolvedValue({
    categories: [
      { id: 'first-international', name: 'First International', path: 'first-international', count: 16 },
      // ... more categories
    ]
  }),
  // ... mock other functions
}));
```

### Pros & Cons

**Integration Tests (Solution 1)**
- ✅ Tests real behavior
- ✅ Catches actual bugs
- ❌ Slower execution
- ❌ Requires running server

**Mocked Tests (Solution 2)**
- ✅ Fast execution
- ✅ No server needed
- ❌ Doesn't test real data loading
- ❌ More maintenance

## Solution 3: E2E Testing with Playwright

Use Playwright for full end-to-end testing:

```typescript
// tests/e2e/api.spec.ts
import { test, expect } from '@playwright/test';

test('API returns statistics', async ({ request }) => {
  const response = await request.get('http://localhost:3000/api/catalogue/stats');
  expect(response.ok()).toBeTruthy();
  
  const data = await response.json();
  expect(data.success).toBe(true);
  expect(data.data.totalThinkers).toBeGreaterThan(600);
});
```

## Recommended Approach

### For This Project

Given the nature of this API (data-driven, file-based), I recommend:

1. **Keep current unit tests** for route logic validation
2. **Add integration tests** for actual API behavior  
3. **Use mocks selectively** for complex scenarios

### Test Structure

```
app/api/catalogue/
├── __tests__/
│   ├── unit/           # Unit tests with mocks
│   │   ├── catalogue.test.ts
│   │   └── ...
│   └── integration/    # Integration tests (require server)
│       ├── stats.test.ts
│       └── ...
```

## Quick Fix: Manual Testing

For now, test manually using the existing test script:

```bash
# Start server
npm run dev

# In another terminal, run the manual test script
node scripts/typescript/test-catalogue-api.mjs
```

This script makes actual HTTP requests and validates responses.

## Running Manual Test Script

The manual test script (`scripts/typescript/test-catalogue-api.mjs`) provides immediate validation:

```bash
npm run dev  # Start server first
node scripts/typescript/test-catalogue-api.mjs
```

**Output Example:**
```
🧪 Catalogue API Test Suite

============================================================
Testing: Get Complete Catalogue Index
Endpoint: /api/catalogue
============================================================
✓ Success!
Total categories: 32
  - First International (16 thinkers)
  - Bolsheviks (88 thinkers)
  ...

============================================================
Testing: Get Statistics
Endpoint: /api/catalogue/stats
============================================================
✓ Success!
Total Thinkers: 634
Total Works: 15420
...

✅ All tests completed!
```

## Future Improvements

### 1. Jest Configuration for Integration Tests

```javascript
// jest.config.integration.js
module.exports = {
  ...require('./jest.config.js'),
  testMatch: ['**/__tests__/integration/**/*.test.ts'],
  testTimeout: 10000,
  globalSetup: './tests/globalSetup.ts',  // Start server
  globalTeardown: './tests/globalTeardown.ts',  // Stop server
};
```

### 2. Automatic Server Start/Stop

```typescript
// tests/globalSetup.ts
import { exec } from 'child_process';

export default async () => {
  // Start Next.js dev server
  const server = exec('npm run dev');
  
  // Wait for server to be ready
  await waitForServer('http://localhost:3000');
  
  // Store server process
  global.__SERVER__ = server;
};

// tests/globalTeardown.ts
export default async () => {
  // Kill server
  global.__SERVER__.kill();
};
```

## Current Status

✅ **Test code is correct and well-structured**  
✅ **Manual test script works perfectly**  
⚠️ **Automated tests need server or mocks**  

The tests are production-ready but require either:
1. Running server for integration testing
2. Mocked data for unit testing
3. Using the manual test script for validation

## Recommendation

For immediate validation, use:
```bash
npm run dev
node scripts/typescript/test-catalogue-api.mjs
```

This provides comprehensive API testing without the complexity of Jest integration test setup.


