/**
 * @jest-environment node
 */
import { GET } from '../route';

describe('GET /api/catalogue/search', () => {
  describe('Basic search', () => {
    it('should search for "marx"', async () => {
      const request = new Request('http://localhost:3000/api/catalogue/search?q=marx');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('results');
      expect(data.data).toHaveProperty('count');
      expect(Array.isArray(data.data.results)).toBe(true);
      expect(data.data.count).toBeGreaterThan(0);
    });

    it('should find Karl Marx', async () => {
      const request = new Request('http://localhost:3000/api/catalogue/search?q=karl%20marx');
      const response = await GET(request);
      const data = await response.json();

      const marx = data.data.results.find((t: any) => t.name === 'Karl Marx');
      expect(marx).toBeDefined();
    });

    it('should search in descriptions', async () => {
      const request = new Request('http://localhost:3000/api/catalogue/search?q=revolutionary');
      const response = await GET(request);
      const data = await response.json();

      expect(data.data.count).toBeGreaterThan(0);
    });

    it('should be case-insensitive', async () => {
      const request1 = new Request('http://localhost:3000/api/catalogue/search?q=MARX');
      const response1 = await GET(request1);
      const data1 = await response1.json();

      const request2 = new Request('http://localhost:3000/api/catalogue/search?q=marx');
      const response2 = await GET(request2);
      const data2 = await response2.json();

      expect(data1.data.count).toBeGreaterThan(0);
      expect(data1.data.count).toBe(data2.data.count);
    });
  });

  describe('Category filtering', () => {
    it('should filter by category', async () => {
      const request = new Request('http://localhost:3000/api/catalogue/search?category=bolsheviks');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.results.length).toBeGreaterThan(0);
      data.data.results.forEach((thinker: any) => {
        expect(thinker.category.toLowerCase()).toContain('bolshevik');
      });
    });

    it('should combine query and category filter', async () => {
      const request = new Request('http://localhost:3000/api/catalogue/search?q=lenin&category=bolsheviks');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.count).toBeGreaterThan(0);
      const lenin = data.data.results.find((t: any) => t.name === 'Vladimir Lenin');
      expect(lenin).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should return 400 without query or category', async () => {
      const request = new Request('http://localhost:3000/api/catalogue/search');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should return empty results for non-matching query', async () => {
      const request = new Request('http://localhost:3000/api/catalogue/search?q=xyzabcnonexistent123');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.results).toEqual([]);
      expect(data.data.count).toBe(0);
    });
  });
});

