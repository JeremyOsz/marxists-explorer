/**
 * @jest-environment node
 */
import { GET } from '../route';

describe('GET /api/catalogue/random/thinker', () => {
  it('should return a random thinker', async () => {
    const request = new Request('http://localhost:3000/api/catalogue/random/thinker');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('name');
    expect(data.data).toHaveProperty('category');
    expect(data.data).toHaveProperty('description');
    expect(data.data).toHaveProperty('workCount');
  });

  it('should return different thinkers on multiple calls', async () => {
    const names = new Set();
    
    for (let i = 0; i < 5; i++) {
      const request = new Request('http://localhost:3000/api/catalogue/random/thinker');
      const response = await GET(request);
      const data = await response.json();
      names.add(data.data.name);
    }
    
    // With 600+ thinkers, very likely to get at least 2 different ones in 5 tries
    expect(names.size).toBeGreaterThanOrEqual(2);
  });

  it('should filter by category', async () => {
    const request = new Request('http://localhost:3000/api/catalogue/random/thinker?category=bolsheviks');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.category.toLowerCase()).toContain('bolshevik');
  });

  it('should handle category filter case-insensitively', async () => {
    const request = new Request('http://localhost:3000/api/catalogue/random/thinker?category=BOLSHEVIKS');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.category.toLowerCase()).toContain('bolshevik');
  });

  it('should return 404 for non-existent category', async () => {
    const request = new Request('http://localhost:3000/api/catalogue/random/thinker?category=nonexistent-xyz');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
  });

  it('should include complete thinker metadata', async () => {
    const request = new Request('http://localhost:3000/api/catalogue/random/thinker');
    const response = await GET(request);
    const data = await response.json();

    expect(data.data).toHaveProperty('bioUrl');
    expect(data.data).toHaveProperty('imageUrl');
    expect(typeof data.data.name).toBe('string');
    expect(typeof data.data.category).toBe('string');
  });
});

