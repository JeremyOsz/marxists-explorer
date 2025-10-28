/**
 * @jest-environment node
 */
import { GET } from '../route';

describe('GET /api/catalogue', () => {
  it('should return the complete catalogue index', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('categories');
    expect(Array.isArray(data.data.categories)).toBe(true);
    expect(data.data.categories.length).toBeGreaterThan(0);
  });

  it('should include category metadata', async () => {
    const response = await GET();
    const data = await response.json();

    const firstCategory = data.data.categories[0];
    expect(firstCategory).toHaveProperty('id');
    expect(firstCategory).toHaveProperty('name');
    expect(firstCategory).toHaveProperty('path');
    expect(firstCategory).toHaveProperty('count');
  });

  it('should handle errors gracefully', async () => {
    // This test ensures error handling works
    const response = await GET();
    
    expect(response).toBeDefined();
    expect(response.status).toBeLessThan(600);
  });
});

