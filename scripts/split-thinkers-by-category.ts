#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';

/**
 * Split thinkers-expanded.json into individual category files
 * This improves performance by loading only needed categories
 */

const DATA_DIR = path.join(__dirname, '../data');
const THINKERS_FILE = path.join(DATA_DIR, 'thinkers-expanded.json');
const CATEGORIES_DIR = path.join(DATA_DIR, 'thinkers-by-category');

// Ensure categories directory exists
if (!fs.existsSync(CATEGORIES_DIR)) {
  fs.mkdirSync(CATEGORIES_DIR, { recursive: true });
}

// Read the main thinkers file
const thinkersData = JSON.parse(fs.readFileSync(THINKERS_FILE, 'utf8'));

// Group by category
const groupedByCategory = thinkersData.reduce((acc: Record<string, any[]>, thinker: any) => {
  const category = thinker.category;
  if (!acc[category]) {
    acc[category] = [];
  }
  acc[category].push(thinker);
  return acc;
}, {});

// Create individual category files
const categoryFiles: string[] = [];
Object.entries(groupedByCategory).forEach(([category, thinkers]) => {
  // Create safe filename from category name
  const filename = category
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '') + '.json';
  
  const filepath = path.join(CATEGORIES_DIR, filename);
  
  // Write category file
  fs.writeFileSync(filepath, JSON.stringify(thinkers, null, 2));
  
  categoryFiles.push(filename);
  
  console.log(`Created ${filename} with ${thinkers.length} thinkers`);
});

// Create an index file mapping categories to filenames
const categoryIndex = Object.keys(groupedByCategory).reduce((acc, category) => {
  const filename = category
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '') + '.json';
  
  acc[category] = filename;
  return acc;
}, {} as Record<string, string>);

const indexPath = path.join(CATEGORIES_DIR, 'index.json');
fs.writeFileSync(indexPath, JSON.stringify(categoryIndex, null, 2));

console.log(`\nCreated ${categoryFiles.length} category files`);
console.log(`Created index.json with category mappings`);
console.log(`Total thinkers: ${thinkersData.length}`);

// Create a summary
const summary = {
  total_thinkers: thinkersData.length,
  total_categories: Object.keys(groupedByCategory).length,
  categories: Object.entries(groupedByCategory).map(([category, thinkers]) => ({
    category,
    count: thinkers.length,
    filename: category
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '') + '.json'
  })).sort((a, b) => a.category.localeCompare(b.category))
};

const summaryPath = path.join(CATEGORIES_DIR, 'summary.json');
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

console.log(`Created summary.json with category statistics`);
