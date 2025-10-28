/**
 * @jest-environment node
 */
import { GET } from '../route';

describe('GET /api/catalogue/categories/[category]', () => {
  it('should return thinkers for first-international', async () => {
    const request = new Request('http://localhost:3000/api/catalogue/categories/first-international');
    const params = Promise.resolve({ category: 'first-international' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('category');
    expect(data.data).toHaveProperty('thinkers');
    expect(data.data).toHaveProperty('count');
    expect(Array.isArray(data.data.thinkers)).toBe(true);
  });

  it('should return thinkers for bolsheviks', async () => {
    const request = new Request('http://localhost:3000/api/catalogue/categories/bolsheviks');
    const params = Promise.resolve({ category: 'bolsheviks' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.thinkers.length).toBeGreaterThan(0);
  });

  it('should include thinker metadata without works', async () => {
    const request = new Request('http://localhost:3000/api/catalogue/categories/first-international');
    const params = Promise.resolve({ category: 'first-international' });
    const response = await GET(request, { params });
    const data = await response.json();

    const firstThinker = data.data.thinkers[0];
    expect(firstThinker).toHaveProperty('name');
    expect(firstThinker).toHaveProperty('category');
    expect(firstThinker).toHaveProperty('description');
    expect(firstThinker).toHaveProperty('workCount');
    expect(firstThinker.works).toEqual([]);
  });

  it('should handle URL-encoded category names', async () => {
    const request = new Request('http://localhost:3000/api/catalogue/categories/first%20international');
    const params = Promise.resolve({ category: 'first%20international' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBeLessThan(500);
  });

  it('should handle invalid categories gracefully', async () => {
    const request = new Request('http://localhost:3000/api/catalogue/categories/invalid-category-xyz');
    const params = Promise.resolve({ category: 'invalid-category-xyz' });
    const response = await GET(request, { params });
    const data = await response.json();

    // Should either return empty array or error
    expect(data.success).toBeDefined();
  });
});

