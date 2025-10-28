/**
 * Script to populate and verify category metadata from marxists.org/archive/index.htm
 * 
 * This script:
 * 1. Fetches the marxists.org archive index page
 * 2. Extracts category metadata (name, description, dates)
 * 3. Compares with existing metadata in lib/data/categories.ts
 * 4. Outputs a report or updates the file if needed
 * 
 * Run with: npx tsx scripts/populate-category-metadata.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface Category {
  id: string;
  name: string;
  description?: string;
  order: number;
}

interface ExtractedCategory {
  id: string;
  name: string;
  description: string;
  dates?: string;
}

// Mapping from marxists.org anchor IDs to our category IDs
const CATEGORY_MAPPING: Record<string, string> = {
  'iwma': 'first-international',
  'social-democracy': 'social-democracy',
  'reformism': 'reformists',
  'fabianism': 'fabians',
  'bolsheviks': 'bolsheviks',
  'early-comintern': 'early-comintern',
  'comintern': 'comintern',
  'soviet-writers': 'soviet-science',
  'soviet-marxism': 'soviet-marxism',
  'western-marxism': 'western-marxism',
  'french-left': 'french-left',
  'frankfurt-school': 'frankfurt-school',
  'trotskyism': 'trotskyists',
  'left-communism': 'left-communism',
  'marxist-humanism': 'marxist-humanism',
  'market-socialism': 'market-socialists',
  'guerilla-marxism': 'guerilla-marxism',
  'maoism': 'maoists',
  'national-liberation': 'national-liberation',
  'african-liberation': 'african-liberation',
  'black-liberation': 'black-liberation',
  'french-revolution': 'french-revolution',
  'paris-commune': 'paris-commune',
  'utopianism': 'utopianism',
  'anarchism': 'anarchists',
  'feminism': 'feminists',
  'populists': 'populists',
  'political-science': 'political-science',
  'philosophy': 'philosophy',
  'ethics': 'ethics',
  'political-economy': 'political-economy',
  'natural-science': 'natural-science'
};

async function fetchPage(): Promise<string> {
  const url = 'https://www.marxists.org/archive/index.htm';
  console.log(`Fetching ${url}...`);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch page: ${response.status} ${response.statusText}`);
  }
  
  return await response.text();
}

function extractCategories(html: string): ExtractedCategory[] {
  const categories: ExtractedCategory[] = [];
  
  // Extract table rows with category links
  // The page uses a table with links that have titles and IDs
  const linkRegex = /<a[^>]*href="#([^"]+)"[^>]*title="([^"]+)"[^>]*>([^<]+)<\/a>/g;
  
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const [, anchorId, title, name] = match;
    
    // Match the anchor ID to our category
    const categoryId = CATEGORY_MAPPING[anchorId];
    if (!categoryId) {
      console.warn(`No mapping found for anchor ID: ${anchorId}`);
      continue;
    }
    
    // Extract dates from title (e.g., "Marx and Engels, the founders of Marxism and their associates: 1844-1880s")
    const datesMatch = title.match(/: ([\d\-s]+)$/);
    const dates = datesMatch ? datesMatch[1] : undefined;
    
    categories.push({
      id: categoryId,
      name: name.trim(),
      description: title,
      dates
    });
  }
  
  return categories;
}

function compareMetadata(
  existing: Category[],
  extracted: ExtractedCategory[]
): { updated: Category[], differences: Array<{ id: string; field: string; old: string; new: string }> } {
  const differences: Array<{ id: string; field: string; old: string; new: string }> = [];
  const updated: Category[] = [];
  
  // Create a map of extracted categories
  const extractedMap = new Map(extracted.map(cat => [cat.id, cat]));
  
  for (const existingCat of existing) {
    const extractedCat = extractedMap.get(existingCat.id);
    
    if (!extractedCat) {
      console.warn(`Category not found on marxists.org: ${existingCat.id}`);
      updated.push(existingCat);
      continue;
    }
    
    // Compare description (normalize whitespace for comparison)
    const normalizedOld = (existingCat.description || '').trim().replace(/\s+/g, ' ');
    const normalizedNew = extractedCat.description.trim().replace(/\s+/g, ' ');
    
    if (normalizedOld !== normalizedNew) {
      differences.push({
        id: existingCat.id,
        field: 'description',
        old: existingCat.description || '',
        new: extractedCat.description
      });
      updated.push({
        ...existingCat,
        description: extractedCat.description
      });
    } else {
      updated.push(existingCat);
    }
  }
  
  return { updated, differences };
}

function writeUpdatedMetadata(categories: Category[]): void {
  const filePath = path.join(__dirname, '..', '..', 'lib', 'data', 'categories.ts');
  
  // Read the original file to preserve formatting and comments
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Replace the categories array
  const categoriesString = categories.map((cat, index) => {
    return `  {
    id: '${cat.id}',
    name: '${cat.name}',
    description: '${cat.description?.replace(/'/g, "\\'")}',
    order: ${cat.order}
  }`;
  }).join(',\n');
  
  // Find and replace the categories array
  const arrayRegex = /export const categories: Category\[\] = \[([\s\S]*?)\];/;
  
  if (arrayRegex.test(content)) {
    content = content.replace(arrayRegex, `export const categories: Category[] = [\n${categoriesString}\n];`);
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`\n✅ Updated ${filePath}`);
  } else {
    console.error('Could not find categories array in file');
  }
}

async function main() {
  try {
    console.log('📖 Fetching marxists.org archive index...\n');
    
    const html = await fetchPage();
    console.log('✅ Fetched page successfully\n');
    
    const extracted = extractCategories(html);
    console.log(`📋 Found ${extracted.length} categories\n`);
    
    // Import existing metadata
    console.log('📖 Loading existing categories...');
    // We need to use dynamic import since we're in a script context
    const { categories: existingCategories } = await import('../../lib/data/categories');
    
    console.log('🔍 Comparing with existing metadata...\n');
    const { updated, differences } = compareMetadata(existingCategories, extracted);
    
    if (differences.length > 0) {
      console.log('📝 Found differences:\n');
      differences.forEach(diff => {
        console.log(`  ${diff.id}:`);
        console.log(`    Field: ${diff.field}`);
        console.log(`    Old: ${diff.old}`);
        console.log(`    New: ${diff.new}`);
        console.log();
      });
      
      // Write updated metadata
      console.log('💾 Writing updated metadata...');
      writeUpdatedMetadata(updated);
    } else {
      console.log('✅ All metadata is up to date!\n');
    }
    
    // Summary
    console.log('\n📊 Summary:');
    console.log(`  Categories on marxists.org: ${extracted.length}`);
    console.log(`  Categories in database: ${existingCategories.length}`);
    console.log(`  Differences found: ${differences.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
main();

