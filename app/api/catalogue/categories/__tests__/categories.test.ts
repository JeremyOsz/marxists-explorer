/**
 * @jest-environment node
 */
import { GET} from '../route';

describe('GET /api/catalogue/categories', () => {
  it('should return all categories', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('categories');
    expect(data.data).toHaveProperty('count');
    expect(Array.isArray(data.data.categories)).toBe(true);
  });

  it('should return at least 30 categories', async () => {
    const response = await GET();
    const data = await response.json();

    expect(data.data.count).toBeGreaterThanOrEqual(30);
    expect(data.data.categories.length).toBe(data.data.count);
  });

  it('should return category IDs as strings', async () => {
    const response = await GET()
    const data = await response.json();

    data.data.categories.forEach((category: string) => {
      expect(typeof category).toBe('string');
      expect(category.length).toBeGreaterThan(0);
    });
  });
});

