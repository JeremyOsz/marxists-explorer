import * as fs from 'fs';
import * as path from 'path';

// Type definitions
interface ThinkerMetadata {
  n: string;  // name
  c: string;  // category
  d: string;  // description
  b: string;  // bioUrl
  i: string;  // imageUrl
  t?: string; // thumbnailUrl
  w: number;  // workCount
}

interface Work {
  title: string;
  url: string;
  description?: string;
  subject?: string;
}

interface CategoryMetadata {
  n: string;
  c: string;
  d: string;
  b: string;
  i: string;
  t?: string;
  w: number;
  subjects?: Array<{ name: string; count: number }>;
}

// Subject categorization rules
const SUBJECT_KEYWORDS: Record<string, string[]> = {
  'Political Theory': [
    'political', 'theory', 'state', 'government', 'revolution', 'party', 'communism',
    'socialism', 'democracy', 'authority', 'power', 'rebellion', 'uprising'
  ],
  'Economics': [
    'capital', 'economics', 'economic', 'market', 'value', 'price', 'wage', 'labor',
    'labour', 'commodity', 'exchange', 'money', 'profit', 'production'
  ],
  'Philosophy': [
    'philosophy', 'philosophical', 'ethics', 'epistemology', 'metaphysics', 'ideology',
    'consciousness', 'materialism', 'dialectical', 'logic', 'truth', 'morality'
  ],
  'History': [
    'history', 'historical', 'war', 'class', 'struggle', 'revolutionary', 'movement',
    'proletariat', 'bourgeoisie', 'imperialism', 'colonial', 'national liberation'
  ],
  'Literature': [
    'literature', 'literary', 'novel', 'story', 'poem', 'poetry', 'fiction',
    'narrative', 'autobiography', 'memoir'
  ],
  'Letters': [
    'letter', 'correspondence', 'to ', 'from ', 'dear comrade'
  ],
  'Criticism': [
    'criticism', 'critique', 'review', 'analysis of', 'on ', 'response to', 'reply'
  ],
  'Biography': [
    'biography', 'life of', 'memoir', 'autobiography', 'diary'
  ]
};

// Determine subject from work title/description
function categorizeWork(work: Work): string {
  const text = `${work.title} ${work.description || ''}`.toLowerCase();
  
  // Check each subject category
  for (const [subject, keywords] of Object.entries(SUBJECT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return subject;
      }
    }
  }
  
  return 'General';
}

// Sanitize names for folder/file paths
function sanitizeName(name: string): string {
  // Remove or replace problematic characters
  return name
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid filename chars
    .replace(/\s+/g, ' ')           // Normalize spaces
    .trim();
}

// Get category folder name from full category name
function getCategoryFolder(categoryName: string): string {
  return categoryName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

// Main migration function
async function migrateToFolderSchema() {
  console.log('🚀 Starting migration to folder-based schema...\n');

  const outputBaseDir = path.join(__dirname, '../public/data-v2');
  const inputCategoriesDir = path.join(__dirname, '../public/data/thinkers-by-category');
  const worksFile = path.join(__dirname, '../public/data/thinkers-works.json');

  // Ensure output directory exists
  if (!fs.existsSync(outputBaseDir)) {
    fs.mkdirSync(outputBaseDir, { recursive: true });
    console.log('📁 Created output directory:', outputBaseDir);
  }

  // Load works data
  console.log('📖 Loading works data...');
  const worksData: Record<string, Work[]> = JSON.parse(
    fs.readFileSync(worksFile, 'utf8')
  );
  console.log(`   Loaded works for ${Object.keys(worksData).length} thinkers\n`);

  // Process each category
  const categoryFiles = fs.readdirSync(inputCategoriesDir)
    .filter(file => file.endsWith('.json') && file !== 'index.json' && file !== 'summary.json');

  console.log(`📚 Processing ${categoryFiles.length} categories...\n`);

  let totalThinkers = 0;
  let totalWorks = 0;

  for (const categoryFile of categoryFiles) {
    const categoryPath = path.join(inputCategoriesDir, categoryFile);
    const categoryName = categoryFile.replace('.json', '');
    const categoryFolder = getCategoryFolder(categoryName);
    const outputCategoryDir = path.join(outputBaseDir, categoryFolder);

    console.log(`📂 Processing category: ${categoryName}`);

    // Load category data
    const thinkers: ThinkerMetadata[] = JSON.parse(
      fs.readFileSync(categoryPath, 'utf8')
    );

    console.log(`   Found ${thinkers.length} thinkers`);

    // Create category directory
    if (!fs.existsSync(outputCategoryDir)) {
      fs.mkdirSync(outputCategoryDir, { recursive: true });
    }

    // Process metadata for category
    const categoryMetadata: CategoryMetadata[] = [];

    for (const thinker of thinkers) {
      const thinkerWorks = worksData[thinker.n] || [];
      
      // Group works by subject
      const worksBySubject: Record<string, Work[]> = {};
      
      for (const work of thinkerWorks) {
        const subject = work.subject || categorizeWork(work);
        if (!worksBySubject[subject]) {
          worksBySubject[subject] = [];
        }
        worksBySubject[subject].push(work);
      }

      // If no works found but work count > 0, add to General
      if (Object.keys(worksBySubject).length === 0 && thinker.w > 0) {
        worksBySubject['General'] = [];
      }

      // Create thinker directory only if there are works or if we have a work count
      const sanitizedName = sanitizeName(thinker.n);
      const thinkerDir = path.join(outputCategoryDir, sanitizedName);
      
      const subjects: Array<{ name: string; count: number }> = [];
      
      // Only create directory and write files if there are works or categories
      if (Object.keys(worksBySubject).length > 0) {
        if (!fs.existsSync(thinkerDir)) {
          fs.mkdirSync(thinkerDir, { recursive: true });
        }

        // Write subject files
        for (const [subject, works] of Object.entries(worksBySubject)) {
          const subjectFileName = sanitizeName(subject) + '.json';
          const subjectFilePath = path.join(thinkerDir, subjectFileName);
          
          fs.writeFileSync(
            subjectFilePath,
            JSON.stringify(works, null, 2),
            'utf8'
          );

          subjects.push({ name: subject, count: works.length });
        }
      }

      // Always add to metadata, even if no works
      categoryMetadata.push({
        ...thinker,
        subjects: subjects.length > 0 ? subjects : undefined
      });

      totalThinkers++;
      totalWorks += thinkerWorks.length;
    }

    // Write category metadata
    const metadataPath = path.join(outputCategoryDir, 'metadata.json');
    fs.writeFileSync(
      metadataPath,
      JSON.stringify(categoryMetadata, null, 2),
      'utf8'
    );

    console.log(`   ✅ Created ${categoryMetadata.length} thinker folders\n`);
  }

  // Create global index
  const index: Array<{ id: string; name: string; path: string; count: number }> = [];
  
  for (const categoryFile of categoryFiles) {
    const categoryName = categoryFile.replace('.json', '');
    const categoryPath = path.join(outputBaseDir, getCategoryFolder(categoryName), 'metadata.json');
    
    if (fs.existsSync(categoryPath)) {
      const metadata: CategoryMetadata[] = JSON.parse(
        fs.readFileSync(categoryPath, 'utf8')
      );
      index.push({
        id: categoryName,
        name: categoryName,
        path: getCategoryFolder(categoryName),
        count: metadata.length
      });
    }
  }

  const indexPath = path.join(outputBaseDir, 'index.json');
  fs.writeFileSync(
    indexPath,
    JSON.stringify({ categories: index }, null, 2),
    'utf8'
  );

  console.log('\n✨ Migration complete!');
  console.log(`   📊 Total thinkers: ${totalThinkers}`);
  console.log(`   📚 Total works: ${totalWorks}`);
  console.log(`   📁 Output directory: ${outputBaseDir}`);
  console.log(`\n💡 Next steps:`);
  console.log(`   1. Review the generated data in: public/data-v2/`);
  console.log(`   2. Create the new loader: lib/data/folder-loader.ts`);
  console.log(`   3. Test the migration`);
  console.log(`   4. Update components to use new loader`);
}

// Run migration
migrateToFolderSchema().catch(console.error);

