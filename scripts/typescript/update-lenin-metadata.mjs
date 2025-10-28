#!/usr/bin/env node

/**
 * Update Vladimir Lenin metadata in bolsheviks/metadata.json
 * to reflect all the migrated subject files and major works
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const METADATA_FILE = path.join(__dirname, '../../public/data-v2/bolsheviks/metadata.json');
const LENIN_DIR = path.join(__dirname, '../../public/data-v2/bolsheviks/Vladimir Lenin');
const OLD_LENIN_FILE = path.join(__dirname, '../../data/lenin-works-by-subject.json');

function main() {
  console.log('Updating Vladimir Lenin metadata...\n');
  
  // Read metadata
  console.log(`Reading metadata from: ${METADATA_FILE}`);
  const metadata = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf-8'));
  
  // Find Lenin entry
  const leninIndex = metadata.findIndex(t => t.n === 'Vladimir Lenin');
  if (leninIndex === -1) {
    console.error('Vladimir Lenin not found in metadata!');
    process.exit(1);
  }
  
  console.log(`Found Vladimir Lenin at index ${leninIndex}\n`);
  
  // Read all subject files
  const files = fs.readdirSync(LENIN_DIR)
    .filter(f => f.endsWith('.json'))
    .sort();
  
  console.log(`Found ${files.length} subject files:\n`);
  
  // Count works in each file
  const subjects = [];
  let totalWorks = 0;
  
  for (const file of files) {
    const filepath = path.join(LENIN_DIR, file);
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
  
  // Read major works from old data file
  const oldData = JSON.parse(fs.readFileSync(OLD_LENIN_FILE, 'utf-8'));
  const majorWorks = oldData.major_works;
  
  console.log(`Found ${majorWorks.length} major works\n`);
  
  // Update Lenin metadata
  metadata[leninIndex].subjects = subjects;
  metadata[leninIndex].w = totalWorks;
  metadata[leninIndex].j = majorWorks;
  
  // Write back to file
  const content = JSON.stringify(metadata, null, 2) + '\n';
  fs.writeFileSync(METADATA_FILE, content, 'utf-8');
  
  console.log('✓ Metadata updated successfully!');
  console.log(`  Work count: ${totalWorks}`);
  console.log(`  Subjects: ${subjects.length}`);
  console.log(`  Major works: ${majorWorks.length}`);
}

try {
  main();
} catch (error) {
  console.error('Error updating metadata:', error);
  process.exit(1);
}

