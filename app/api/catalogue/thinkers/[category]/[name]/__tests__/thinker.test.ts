/**
 * @jest-environment node
 */
import { GET } from '../route';

describe('GET /api/catalogue/thinkers/[category]/[name]', () => {
  describe('Full thinker data', () => {
    it('should return Karl Marx with all works', async () => {
      const request = new Request('http://localhost:3000/api/catalogue/thinkers/first-international/Karl%20Marx');
      const params = Promise.resolve({ category: 'first-international', name: 'Karl Marx' });
      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('Karl Marx');
      expect(data.data.category).toBe('First International');
      expect(data.data.workCount).toBeGreaterThan(1000);
      expect(Array.isArray(data.data.works)).toBe(true);
      expect(data.data.works.length).toBeGreaterThan(0);
    });

    it('should return Vladimir Lenin with all works', async () => {
      const request = new Request('http://localhost:3000/api/catalogue/thinkers/bolsheviks/Vladimir%20Lenin');
      const params = Promise.resolve({ category: 'bolsheviks', name: 'Vladimir Lenin' });
      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('Vladimir Lenin');
      expect(data.data.workCount).toBeGreaterThan(100);
      expect(data.data.works.length).toBeGreaterThan(0);
    });

    it('should include major works', async () => {
      const request = new Request('http://localhost:3000/api/catalogue/thinkers/first-international/Karl%20Marx');
      const params = Promise.resolve({ category: 'first-international', name: 'Karl Marx' });
      const response = await GET(request, { params });
      const data = await response.json();

      expect(data.data.majorWorks).toBeDefined();
      expect(Array.isArray(data.data.majorWorks)).toBe(true);
      expect(data.data.majorWorks.length).toBeGreaterThan(0);
    });
  });

  describe('Metadata only', () => {
    it('should return only subjects when metadata_only=true', async () => {
      const request = new Request('http://localhost:3000/api/catalogue/thinkers/first-international/Karl%20Marx?metadata_only=true');
      const params = Promise.resolve({ category: 'first-international', name: 'Karl Marx' });
      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('subjects');
      expect(Array.isArray(data.data.subjects)).toBe(true);
      expect(data.data.subjects.length).toBeGreaterThan(0);
    });
  });

  describe('Error handling', () => {
    it('should return 404 for non-existent thinker', async () => {
      const request = new Request('http://localhost:3000/api/catalogue/thinkers/first-international/NonExistent');
      const params = Promise.resolve({ category: 'first-international', name: 'NonExistent' });
      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });

    it('should handle URL-encoded names', async () => {
      const request = new Request('http://localhost:3000/api/catalogue/thinkers/first-international/Karl%20Marx');
      const params = Promise.resolve({ category: 'first-international', name: 'Karl%20Marx' });
      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.name).toBe('Karl Marx');
    });
  });
});

