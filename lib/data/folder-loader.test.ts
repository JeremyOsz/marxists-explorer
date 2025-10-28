/**
 * Test file for folder-loader.ts
 * Note: This loader is designed for browser/client-side use with Next.js
 * The fetch calls need a base URL. In production, this runs in the browser.
 * 
 * To test, you would need to run the Next.js dev server and test in the browser,
 * or mock the fetch responses.
 */

// For Node.js testing, we need to read files directly
import * as fs from 'fs';
import * as path from 'path';

const DATA_BASE_NODE = path.join(__dirname, '../../public/data-v2');

// Helper functions for Node.js file reading
function readJSON(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

async function testLoader() {
  console.log('🧪 Testing folder-loader.ts\n');

  try {
    console.log('📝 Note: This is a file-system test. The loader is designed for browser/client-side use.\n');

    // Test 1: Load category index
    console.log('1️⃣ Reading category index from file system...');
    const index = readJSON(path.join(DATA_BASE_NODE, 'index.json'));
    console.log(`   ✅ Loaded ${index.categories.length} categories`);
    console.log(`   Categories: ${index.categories.slice(0, 3).map(c => c.name).join(', ')}...\n`);

    // Test 3: Load category metadata
    console.log('3️⃣ Reading metadata for "anarchists"...');
    const metadata = readJSON(path.join(DATA_BASE_NODE, 'anarchists', 'metadata.json'));
    console.log(`   ✅ Found ${metadata.length} thinkers`);
    console.log(`   Sample thinkers: ${metadata.slice(0, 3).map(t => t.n).join(', ')}\n`);

    // Test 5: Get subjects for a thinker
    console.log('5️⃣ Getting subjects for "Bill Haywood"...');
    const billHaywood = metadata.find(t => t.n === 'Bill Haywood');
    if (billHaywood && billHaywood.subjects) {
      console.log(`   ✅ Subjects: ${billHaywood.subjects.map(s => s.name).join(', ')}\n`);
    }

    // Test 6: Load works by subject
    console.log('6️⃣ Reading works by subject for "Bill Haywood - History"...');
    const worksBySubject = readJSON(path.join(DATA_BASE_NODE, 'anarchists', 'Bill Haywood', 'History.json'));
    console.log(`   ✅ Loaded ${worksBySubject.length} works`);
    if (worksBySubject.length > 0) {
      console.log(`   Sample work: ${worksBySubject[0]?.title}\n`);
    } else {
      console.log(`   No works found\n`);
    }

    // Test file sizes
    console.log('📊 File size analysis:');
    const indexPath = path.join(DATA_BASE_NODE, 'index.json');
    const metadataPath = path.join(DATA_BASE_NODE, 'anarchists', 'metadata.json');
    const worksPath = path.join(DATA_BASE_NODE, 'anarchists', 'Bill Haywood', 'History.json');
    
    const indexSize = (fs.statSync(indexPath).size / 1024).toFixed(2);
    const metadataSize = (fs.statSync(metadataPath).size / 1024).toFixed(2);
    const worksSize = (fs.statSync(worksPath).size / 1024).toFixed(2);
    
    console.log(`   index.json: ${indexSize} KB`);
    console.log(`   anarchists/metadata.json: ${metadataSize} KB`);
    console.log(`   anarchists/Bill Haywood/History.json: ${worksSize} KB\n`);

    console.log('✅ File structure test passed!');
    console.log('\n💡 The new loader (browser-side):');
    console.log('   • Loads metadata quickly (~5KB per category)');
    console.log('   • Loads works on-demand only');
    console.log('   • Caches metadata for performance');
    console.log('   • Supports subject-based organization');
    console.log('\n⚠️  To test the actual loader, run the Next.js dev server');
    console.log('   and test in the browser where fetch() is available.');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testLoader();

