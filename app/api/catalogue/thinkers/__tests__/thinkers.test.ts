/**
 * @jest-environment node
 */
import { GET } from '../route';

describe('GET /api/catalogue/thinkers', () => {
  it('should return all thinkers', async () => {
    const request = new Request('http://localhost:3000/api/catalogue/thinkers');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('thinkers');
    expect(data.data).toHaveProperty('count');
    expect(Array.isArray(data.data.thinkers)).toBe(true);
  });

  it('should return 600+ thinkers', async () => {
    const request = new Request('http://localhost:3000/api/catalogue/thinkers');
    const response = await GET(request);
    const data = await response.json();

    expect(data.data.count).toBeGreaterThanOrEqual(600);
  });

  it('should include metadata without works', async () => {
    const request = new Request('http://localhost:3000/api/catalogue/thinkers');
    const response = await GET(request);
    const data = await response.json();

    const firstThinker = data.data.thinkers[0];
    expect(firstThinker).toHaveProperty('name');
    expect(firstThinker).toHaveProperty('category');
    expect(firstThinker).toHaveProperty('description');
    expect(firstThinker).toHaveProperty('bioUrl');
    expect(firstThinker).toHaveProperty('imageUrl');
    expect(firstThinker).toHaveProperty('workCount');
    expect(firstThinker.works).toEqual([]);
  });

  it('should have Karl Marx in the results', async () => {
    const request = new Request('http://localhost:3000/api/catalogue/thinkers');
    const response = await GET(request);
    const data = await response.json();

    const marx = data.data.thinkers.find((t: any) => t.name === 'Karl Marx');
    expect(marx).toBeDefined();
    expect(marx.category).toBe('First International');
    expect(marx.workCount).toBeGreaterThan(1000);
  });

  it('should have Vladimir Lenin in the results', async () => {
    const request = new Request('http://localhost:3000/api/catalogue/thinkers');
    const response = await GET(request);
    const data = await response.json();

    const lenin = data.data.thinkers.find((t: any) => t.name === 'Vladimir Lenin');
    expect(lenin).toBeDefined();
    expect(lenin.category).toBe('Bolsheviks');
    expect(lenin.workCount).toBeGreaterThan(100);
  });
});

