#!/usr/bin/env node

/**
 * Test script for the Catalogue API
 * 
 * Run the dev server first:
 *   npm run dev
 * 
 * Then run this script:
 *   node scripts/typescript/test-catalogue-api.mjs
 */

const BASE_URL = 'http://localhost:3000';

async function testAPI(endpoint, description) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${description}`);
  console.log(`Endpoint: ${endpoint}`);
  console.log('='.repeat(60));
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    const result = await response.json();
    
    if (!result.success) {
      console.error('❌ API Error:', result.error);
      return;
    }
    
    console.log('✅ Success!');
    
    // Pretty print result based on endpoint type
    if (endpoint.includes('/stats')) {
      console.log(`Total Thinkers: ${result.data.totalThinkers}`);
      console.log(`Total Works: ${result.data.totalWorks}`);
      console.log(`Total Categories: ${result.data.totalCategories}`);
      console.log(`\nTop Categories:`);
      result.data.topCategories?.slice(0, 3).forEach(c => {
        console.log(`  - ${c.name}: ${c.thinkers} thinkers, ${c.works} works`);
      });
      console.log(`\nMost Prolific:`);
      result.data.mostProlificThinkers?.slice(0, 3).forEach(t => {
        console.log(`  - ${t.name}: ${t.works} works`);
      });
    } else if (endpoint.includes('/compare')) {
      console.log(`Comparing ${result.data.comparison.length} thinkers:`);
      result.data.comparison.forEach(t => {
        console.log(`  - ${t.name}: ${t.works} works, ${t.subjects} subjects`);
      });
      if (result.data.sharedSubjects?.length > 0) {
        console.log(`\nShared Subjects: ${result.data.sharedSubjects.join(', ')}`);
      }
    } else if (endpoint.includes('/random')) {
      console.log(`Random: ${result.data.name} (${result.data.category})`);
      console.log(`Works: ${result.data.workCount || 0}`);
    } else if (endpoint.includes('/search')) {
      console.log(`Found ${result.data.count} results`);
      result.data.results.slice(0, 3).forEach(t => {
        console.log(`  - ${t.name} (${t.category})`);
      });
    } else if (endpoint.includes('/subjects/')) {
      console.log(`Works: ${result.data.count}`);
      result.data.works.slice(0, 5).forEach(w => {
        console.log(`  - ${w.title}`);
      });
    } else if (endpoint.includes('/thinkers/') && !endpoint.includes('/subjects')) {
      if (result.data.subjects) {
        console.log(`Subjects: ${result.data.subjects.length}`);
        result.data.subjects.slice(0, 5).forEach(s => {
          console.log(`  - ${s}`);
        });
      } else {
        console.log(`Thinker: ${result.data.name}`);
        console.log(`Works: ${result.data.workCount || result.data.works?.length || 0}`);
        if (result.data.majorWorks) {
          console.log(`Major Works: ${result.data.majorWorks.length}`);
        }
      }
    } else if (endpoint.includes('/categories/') && endpoint.split('/').length === 4) {
      console.log(`Category: ${result.data.category}`);
      console.log(`Thinkers: ${result.data.count}`);
      result.data.thinkers.slice(0, 3).forEach(t => {
        console.log(`  - ${t.name} (${t.workCount} works)`);
      });
    } else if (endpoint === '/api/catalogue/categories') {
      console.log(`Total categories: ${result.data.count}`);
      result.data.categories.slice(0, 5).forEach(c => {
        console.log(`  - ${c}`);
      });
    } else if (endpoint === '/api/catalogue/thinkers') {
      console.log(`Total thinkers: ${result.data.count}`);
      result.data.thinkers.slice(0, 3).forEach(t => {
        console.log(`  - ${t.name} (${t.category})`);
      });
    } else if (endpoint === '/api/catalogue') {
      console.log(`Total categories: ${result.data.categories.length}`);
      result.data.categories.slice(0, 3).forEach(c => {
        console.log(`  - ${c.name} (${c.count} thinkers)`);
      });
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

async function main() {
  console.log('\n🧪 Catalogue API Test Suite\n');
  console.log('Make sure the dev server is running on http://localhost:3000\n');
  
  // Test 1: Get complete catalogue
  await testAPI(
    '/api/catalogue',
    'Get Complete Catalogue Index'
  );
  
  // Test 2: Get all categories
  await testAPI(
    '/api/catalogue/categories',
    'Get All Categories'
  );
  
  // Test 3: Get category thinkers
  await testAPI(
    '/api/catalogue/categories/first-international',
    'Get First International Thinkers'
  );
  
  // Test 4: Get all thinkers
  await testAPI(
    '/api/catalogue/thinkers',
    'Get All Thinkers'
  );
  
  // Test 5: Get specific thinker (metadata only)
  await testAPI(
    '/api/catalogue/thinkers/first-international/Karl%20Marx?metadata_only=true',
    'Get Karl Marx (Metadata Only)'
  );
  
  // Test 6: Get specific thinker (with works)
  await testAPI(
    '/api/catalogue/thinkers/bolsheviks/Vladimir%20Lenin',
    'Get Vladimir Lenin (Full Data)'
  );
  
  // Test 7: Get works by subject
  await testAPI(
    '/api/catalogue/thinkers/first-international/Karl%20Marx/subjects/Economics',
    'Get Marx Works on Economics'
  );
  
  // Test 8: Search by query
  await testAPI(
    '/api/catalogue/search?q=revolution',
    'Search for "revolution"'
  );
  
  // Test 9: Search within category
  await testAPI(
    '/api/catalogue/search?q=lenin&category=bolsheviks',
    'Search for "lenin" in Bolsheviks'
  );
  
  // Test 10: Statistics
  await testAPI(
    '/api/catalogue/stats',
    'Get Catalogue Statistics'
  );
  
  // Test 11: Random thinker
  await testAPI(
    '/api/catalogue/random/thinker',
    'Get Random Thinker'
  );
  
  // Test 12: Random thinker from category
  await testAPI(
    '/api/catalogue/random/thinker?category=bolsheviks',
    'Get Random Thinker (Bolsheviks only)'
  );
  
  // Test 13: Compare thinkers
  await testAPI(
    '/api/catalogue/thinkers/compare?thinkers=Karl%20Marx,Vladimir%20Lenin',
    'Compare Karl Marx and Vladimir Lenin'
  );
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ All tests completed!');
  console.log('='.repeat(60) + '\n');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

