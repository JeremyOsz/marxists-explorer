/**
 * @jest-environment node
 */
import { GET } from '../route';

describe('GET /api/catalogue/thinkers/[category]/[name]/subjects/[subject]', () => {
  it('should return Marx works on Economics', async () => {
    const request = new Request('http://localhost:3000/api/catalogue/thinkers/first-international/Karl%20Marx/subjects/Economics');
    const params = Promise.resolve({ 
      category: 'first-international', 
      name: 'Karl Marx',
      subject: 'Economics'
    });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.thinker).toBe('Karl Marx');
    expect(data.data.subject).toBe('Economics');
    expect(Array.isArray(data.data.works)).toBe(true);
    expect(data.data.works.length).toBeGreaterThan(0);
    expect(data.data.count).toBe(data.data.works.length);
  });

  it('should return Marx works on Philosophy', async () => {
    const request = new Request('http://localhost:3000/api/catalogue/thinkers/first-international/Karl%20Marx/subjects/Philosophy');
    const params = Promise.resolve({ 
      category: 'first-international', 
      name: 'Karl Marx',
      subject: 'Philosophy'
    });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.works.length).toBeGreaterThan(0);
  });

  it('should return Lenin works on On the National Question', async () => {
    const request = new Request('http://localhost:3000/api/catalogue/thinkers/bolsheviks/Vladimir%20Lenin/subjects/On%20the%20National%20Question');
    const params = Promise.resolve({ 
      category: 'bolsheviks', 
      name: 'Vladimir Lenin',
      subject: 'On the National Question'
    });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.works.length).toBeGreaterThan(50);
  });

  it('should include work title and url', async () => {
    const request = new Request('http://localhost:3000/api/catalogue/thinkers/first-international/Karl%20Marx/subjects/Economics');
    const params = Promise.resolve({ 
      category: 'first-international', 
      name: 'Karl Marx',
      subject: 'Economics'
    });
    const response = await GET(request, { params });
    const data = await response.json();

    const firstWork = data.data.works[0];
    expect(firstWork).toHaveProperty('title');
    expect(firstWork).toHaveProperty('url');
    expect(typeof firstWork.title).toBe('string');
    expect(typeof firstWork.url).toBe('string');
    expect(firstWork.url).toMatch(/^https?:\/\//);
  });

  it('should return empty array for non-existent subject', async () => {
    const request = new Request('http://localhost:3000/api/catalogue/thinkers/first-international/Karl%20Marx/subjects/NonExistentSubject');
    const params = Promise.resolve({ 
      category: 'first-international', 
      name: 'Karl Marx',
      subject: 'NonExistentSubject'
    });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.works).toEqual([]);
    expect(data.data.count).toBe(0);
  });

  it('should handle URL-encoded subject names', async () => {
    const request = new Request('http://localhost:3000/api/catalogue/thinkers/first-international/Karl%20Marx/subjects/Art%20and%20Literature');
    const params = Promise.resolve({ 
      category: 'first-international', 
      name: 'Karl Marx',
      subject: 'Art%20and%20Literature'
    });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.subject).toBe('Art and Literature');
  });
});

