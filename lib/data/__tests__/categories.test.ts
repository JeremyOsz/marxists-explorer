import { categories, getCategoryById, getCategoryIds } from '../categories';

describe('categories', () => {
  describe('categories array', () => {
    it('should have categories with required fields', () => {
      expect(categories.length).toBeGreaterThan(0);
      
      categories.forEach(category => {
        expect(category).toHaveProperty('id');
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('description');
        expect(category).toHaveProperty('order');
        expect(typeof category.order).toBe('number');
      });
    });

    it('should have unique category IDs', () => {
      const ids = categories.map(c => c.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });

    it('should have categories sorted by order', () => {
      for (let i = 1; i < categories.length; i++) {
        expect(categories[i].order).toBeGreaterThanOrEqual(categories[i - 1].order);
      }
    });
  });

  describe('getCategoryById', () => {
    it('should return a category when found', () => {
      const category = getCategoryById('marxist-humanism');
      expect(category).toBeDefined();
      expect(category?.id).toBe('marxist-humanism');
    });

    it('should return undefined when not found', () => {
      const category = getCategoryById('non-existent-category');
      expect(category).toBeUndefined();
    });
  });

  describe('getCategoryIds', () => {
    it('should return an array of category IDs', () => {
      const ids = getCategoryIds();
      expect(ids).toBeInstanceOf(Array);
      expect(ids.length).toBe(categories.length);
    });
  });
});

