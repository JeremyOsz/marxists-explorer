/**
 * @jest-environment node
 */
import { GET } from '../route';

describe('GET /api/catalogue/stats', () => {
  it('should return complete statistics', async () => {
    const request = new Request('http://localhost:3000/api/catalogue/stats');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('totalThinkers');
    expect(data.data).toHaveProperty('totalWorks');
    expect(data.data).toHaveProperty('totalCategories');
    expect(data.data).toHaveProperty('averageWorksPerThinker');
    expect(data.data).toHaveProperty('topCategories');
    expect(data.data).toHaveProperty('mostProlificThinkers');
    expect(data.data).toHaveProperty('lastUpdated');
  });

  it('should have correct totals', async () => {
    const request = new Request('http://localhost:3000/api/catalogue/stats');
    const response = await GET(request);
    const data = await response.json();

    expect(data.data.totalThinkers).toBeGreaterThan(600);
    expect(data.data.totalWorks).toBeGreaterThan(10000);
    expect(data.data.totalCategories).toBeGreaterThanOrEqual(30);
    expect(data.data.averageWorksPerThinker).toBeGreaterThan(0);
  });

  it('should include top categories', async () => {
    const request = new Request('http://localhost:3000/api/catalogue/stats');
    const response = await GET(request);
    const data = await response.json();

    expect(Array.isArray(data.data.topCategories)).toBe(true);
    expect(data.data.topCategories.length).toBeGreaterThan(0);
    
    const firstCategory = data.data.topCategories[0];
    expect(firstCategory).toHaveProperty('name');
    expect(firstCategory).toHaveProperty('thinkers');
    expect(firstCategory).toHaveProperty('works');
  });

  it('should include most prolific thinkers', async () => {
    const request = new Request('http://localhost:3000/api/catalogue/stats');
    const response = await GET(request);
    const data = await response.json();

    expect(Array.isArray(data.data.mostProlificThinkers)).toBe(true);
    expect(data.data.mostProlificThinkers.length).toBeGreaterThan(0);
    
    const firstThinker = data.data.mostProlificThinkers[0];
    expect(firstThinker).toHaveProperty('name');
    expect(firstThinker).toHaveProperty('category');
    expect(firstThinker).toHaveProperty('works');
    expect(firstThinker.works).toBeGreaterThan(0);
  });

  it('should have Karl Marx as one of the most prolific', async () => {
    const request = new Request('http://localhost:3000/api/catalogue/stats');
    const response = await GET(request);
    const data = await response.json();

    const marx = data.data.mostProlificThinkers.find((t: any) => t.name === 'Karl Marx');
    expect(marx).toBeDefined();
    expect(marx.works).toBeGreaterThan(1000);
  });

  it('should have valid timestamp', async () => {
    const request = new Request('http://localhost:3000/api/catalogue/stats');
    const response = await GET(request);
    const data = await response.json();

    expect(data.data.lastUpdated).toBeDefined();
    const date = new Date(data.data.lastUpdated);
    expect(date.toString()).not.toBe('Invalid Date');
  });
});

