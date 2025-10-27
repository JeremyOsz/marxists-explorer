import { loadThinkersMetadata, getAvailableCategories, loadThinker, loadThinkerWorks } from '../thinkers-data';

describe('thinkers-data', () => {
  describe('loadThinkersMetadata', () => {
    it('should load thinkers metadata without works', () => {
      const thinkers = loadThinkersMetadata();
      
      expect(thinkers).toBeInstanceOf(Array);
      expect(thinkers.length).toBeGreaterThan(0);
      
      // Check first thinker has required fields
      const firstThinker = thinkers[0];
      expect(firstThinker).toHaveProperty('name');
      expect(firstThinker).toHaveProperty('category');
      expect(firstThinker).toHaveProperty('description');
      expect(firstThinker).toHaveProperty('bioUrl');
    });

    it('should return unique thinkers (no duplicates)', () => {
      const thinkers = loadThinkersMetadata();
      const names = thinkers.map(t => t.name);
      const uniqueNames = new Set(names);
      
      expect(names.length).toBe(uniqueNames.size);
    });

    it('should return thinkers sorted alphabetically by name', () => {
      const thinkers = loadThinkersMetadata();
      
      for (let i = 1; i < thinkers.length; i++) {
        expect(thinkers[i].name.localeCompare(thinkers[i - 1].name)).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('getAvailableCategories', () => {
    it('should return an array of category names', () => {
      const categories = getAvailableCategories();
      
      expect(categories).toBeInstanceOf(Array);
      expect(categories.length).toBeGreaterThan(0);
    });

    it('should return categories sorted alphabetically', () => {
      const categories = getAvailableCategories();
      
      for (let i = 1; i < categories.length; i++) {
        expect(categories[i].localeCompare(categories[i - 1])).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('loadThinkerWorks', () => {
    it('should load works for a specific thinker', async () => {
      const firstThinker = loadThinkersMetadata()[0];
      const works = await loadThinkerWorks(firstThinker.name);
      
      expect(works).toBeInstanceOf(Array);
      
      // If works exist, check structure
      if (works.length > 0) {
        const firstWork = works[0];
        expect(firstWork).toHaveProperty('title');
      }
    });

    it('should return empty array for non-existent thinker', async () => {
      const works = await loadThinkerWorks('NonExistent Thinker 123456');
      expect(works).toEqual([]);
    });
  });

  describe('loadThinker', () => {
    it('should load a specific thinker with works', async () => {
      const allThinkers = loadThinkersMetadata();
      
      if (allThinkers.length > 0) {
        const testThinkerName = allThinkers[0].name;
        const thinker = await loadThinker(testThinkerName);
        
        expect(thinker).not.toBeNull();
        expect(thinker).toHaveProperty('name', testThinkerName);
        expect(thinker).toHaveProperty('works');
        expect(thinker?.works).toBeInstanceOf(Array);
      }
    });

    it('should return null for non-existent thinker', async () => {
      const thinker = await loadThinker('NonExistent Thinker 123456');
      expect(thinker).toBeNull();
    });
  });
});

