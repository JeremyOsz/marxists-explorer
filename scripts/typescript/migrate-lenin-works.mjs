#!/usr/bin/env node

/**
 * Migration script to transfer Lenin works from old data structure to new folder-based structure
 * 
 * Old structure: data/lenin-works-by-subject.json (object with works_by_subject and major_works)
 * New structure: public/data-v2/bolsheviks/Vladimir Lenin/{Subject}.json (separate files per subject)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OLD_FILE = path.join(__dirname, '../../data/lenin-works-by-subject.json');
const NEW_DIR = path.join(__dirname, '../../public/data-v2/bolsheviks/Vladimir Lenin');

function main() {
  console.log('Starting Lenin works migration...\n');
  
  // Read old data
  console.log(`Reading old data from: ${OLD_FILE}`);
  const oldDataRaw = fs.readFileSync(OLD_FILE, 'utf-8');
  const oldData = JSON.parse(oldDataRaw);
  console.log(`Found data with ${Object.keys(oldData.works_by_subject).length} subjects\n`);
  
  // Count total works
  let totalWorks = 0;
  for (const subject in oldData.works_by_subject) {
    totalWorks += oldData.works_by_subject[subject].length;
  }
  console.log(`Total works in old structure: ${totalWorks}\n`);
  
  // Group works by subject
  const worksBySubject = new Map();
  
  for (const [subjectName, works] of Object.entries(oldData.works_by_subject)) {
    const newWorks = works.map(work => ({
      title: work.title,
      url: work.url
    }));
    
    worksBySubject.set(subjectName, newWorks);
  }
  
  console.log(`Grouped works into ${worksBySubject.size} subjects:\n`);
  
  // Sort subjects alphabetically
  const sortedSubjects = Array.from(worksBySubject.keys()).sort();
  
  // Display subject counts
  for (const subject of sortedSubjects) {
    const count = worksBySubject.get(subject).length;
    console.log(`  ${subject}: ${count} works`);
  }
  console.log();
  
  // Ensure target directory exists
  if (!fs.existsSync(NEW_DIR)) {
    console.log(`Creating directory: ${NEW_DIR}`);
    fs.mkdirSync(NEW_DIR, { recursive: true });
  }
  
  // Write each subject to a separate file
  console.log('\nWriting files...\n');
  let filesCreated = 0;
  let filesUpdated = 0;
  
  for (const subject of sortedSubjects) {
    const works = worksBySubject.get(subject);
    const filename = `${subject}.json`;
    const filepath = path.join(NEW_DIR, filename);
    
    const exists = fs.existsSync(filepath);
    
    // Write file with pretty formatting
    const content = JSON.stringify(works, null, 2) + '\n';
    fs.writeFileSync(filepath, content, 'utf-8');
    
    if (exists) {
      console.log(`  ✓ Updated: ${filename} (${works.length} works)`);
      filesUpdated++;
    } else {
      console.log(`  ✓ Created: ${filename} (${works.length} works)`);
      filesCreated++;
    }
  }
  
  console.log(`\nMigration complete!`);
  console.log(`  Files created: ${filesCreated}`);
  console.log(`  Files updated: ${filesUpdated}`);
  console.log(`  Total works migrated: ${totalWorks}`);
  console.log(`\nNew files location: ${NEW_DIR}`);
  
  // Also save the major_works info for reference
  console.log(`\nNote: major_works array has ${oldData.major_works.length} entries`);
  console.log('These should be added to the metadata.json file manually or via update script');
}

try {
  main();
} catch (error) {
  console.error('Error during migration:', error);
  process.exit(1);
}

