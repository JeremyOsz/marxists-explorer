/**
 * @jest-environment node
 */
import { GET } from '../route';

describe('GET /api/catalogue/thinkers/compare', () => {
  it('should compare Marx and Lenin', async () => {
    const request = new Request('http://localhost:3000/api/catalogue/thinkers/compare?thinkers=Karl%20Marx,Vladimir%20Lenin');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('comparison');
    expect(data.data).toHaveProperty('sharedSubjects');
    expect(Array.isArray(data.data.comparison)).toBe(true);
    expect(data.data.comparison.length).toBe(2);
  });

  it('should include complete comparison data', async () => {
    const request = new Request('http://localhost:3000/api/catalogue/thinkers/compare?thinkers=Karl%20Marx,Vladimir%20Lenin');
    const response = await GET(request);
    const data = await response.json();

    const marx = data.data.comparison.find((t: any) => t.name === 'Karl Marx');
    const lenin = data.data.comparison.find((t: any) => t.name === 'Vladimir Lenin');

    expect(marx).toBeDefined();
    expect(lenin).toBeDefined();

    expect(marx).toHaveProperty('name');
    expect(marx).toHaveProperty('category');
    expect(marx).toHaveProperty('works');
    expect(marx).toHaveProperty('subjects');
    expect(marx.works).toBeGreaterThan(1000);

    expect(lenin.works).toBeGreaterThan(100);
  });

  it('should find shared subjects', async () => {
    const request = new Request('http://localhost:3000/api/catalogue/thinkers/compare?thinkers=Karl%20Marx,Vladimir%20Lenin');
    const response = await GET(request);
    const data = await response.json();

    expect(Array.isArray(data.data.sharedSubjects)).toBe(true);
    expect(data.data.sharedSubjects.length).toBeGreaterThan(0);
    
    // Both should have Philosophy
    expect(data.data.sharedSubjects).toContain('Philosophy');
  });

  it('should compare 3 or more thinkers', async () => {
    const request = new Request('http://localhost:3000/api/catalogue/thinkers/compare?thinkers=Karl%20Marx,Vladimir%20Lenin,Friedrich%20Engels');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.comparison.length).toBe(3);
  });

  it('should return 400 without thinkers parameter', async () => {
    const request = new Request('http://localhost:3000/api/catalogue/thinkers/compare');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('should return 400 with only one thinker', async () => {
    const request = new Request('http://localhost:3000/api/catalogue/thinkers/compare?thinkers=Karl%20Marx');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('should handle non-existent thinkers', async () => {
    const request = new Request('http://localhost:3000/api/catalogue/thinkers/compare?thinkers=Karl%20Marx,NonExistent');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.comparison.length).toBe(1);
    expect(data.data.notFound).toContain('NonExistent');
  });

  it('should handle case differences in names', async () => {
    const request = new Request('http://localhost:3000/api/catalogue/thinkers/compare?thinkers=karl%20marx,vladimir%20lenin');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.comparison.length).toBe(2);
  });
});

