#!/usr/bin/env node

/**
 * Update Karl Marx metadata in first-international/metadata.json
 * to reflect all the migrated subject files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const METADATA_FILE = path.join(__dirname, '../../public/data-v2/first-international/metadata.json');
const KARL_MARX_DIR = path.join(__dirname, '../../public/data-v2/first-international/Karl Marx');

function main() {
  console.log('Updating Karl Marx metadata...\n');
  
  // Read metadata
  console.log(`Reading metadata from: ${METADATA_FILE}`);
  const metadata = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf-8'));
  
  // Find Karl Marx entry
  const marxIndex = metadata.findIndex(t => t.n === 'Karl Marx');
  if (marxIndex === -1) {
    console.error('Karl Marx not found in metadata!');
    process.exit(1);
  }
  
  console.log(`Found Karl Marx at index ${marxIndex}\n`);
  
  // Read all subject files
  const files = fs.readdirSync(KARL_MARX_DIR)
    .filter(f => f.endsWith('.json'))
    .sort();
  
  console.log(`Found ${files.length} subject files:\n`);
  
  // Count works in each file
  const subjects = [];
  let totalWorks = 0;
  
  for (const file of files) {
    const filepath = path.join(KARL_MARX_DIR, file);
    const works = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    const subjectName = file.replace('.json', '');
    const count = works.length;
    
    subjects.push({
      name: subjectName,
      count: count
    });
    
    totalWorks += count;
    console.log(`  ${subjectName}: ${count} works`);
  }
  
  console.log(`\nTotal works: ${totalWorks}\n`);
  
  // Update Karl Marx metadata
  metadata[marxIndex].subjects = subjects;
  metadata[marxIndex].w = totalWorks;
  
  // Write back to file
  const content = JSON.stringify(metadata, null, 2) + '\n';
  fs.writeFileSync(METADATA_FILE, content, 'utf-8');
  
  console.log('✓ Metadata updated successfully!');
  console.log(`  Work count: ${totalWorks}`);
  console.log(`  Subjects: ${subjects.length}`);
}

try {
  main();
} catch (error) {
  console.error('Error updating metadata:', error);
  process.exit(1);
}

