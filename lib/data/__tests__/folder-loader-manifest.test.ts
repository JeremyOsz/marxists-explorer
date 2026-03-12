/**
 * @jest-environment node
 */
import {
  getThinkerSubjects,
  loadAllThinkersMetadata,
  loadThinkerManifest,
  loadThinkerWorksBySubject,
} from '../folder-loader';

describe('folder-loader manifest-backed loaders', () => {
  it('loads thinkers from the generated manifest', async () => {
    const thinkers = await loadAllThinkersMetadata();

    expect(thinkers.length).toBeGreaterThan(500);
    expect(thinkers[0]).toHaveProperty('searchText');
    expect(thinkers[0].works).toEqual([]);
  });

  it('loads a thinker manifest by category and thinker name', async () => {
    const thinker = await loadThinkerManifest('first-international', 'Karl Marx');

    expect(thinker).toBeTruthy();
    expect(thinker?.n).toBe('Karl Marx');
    expect(thinker?.subjects?.length).toBeGreaterThan(0);
  });

  it('returns thinker subjects without loading full works', async () => {
    const subjects = await getThinkerSubjects('first-international', 'Karl Marx');

    expect(subjects).toContain('Economics');
  });

  it('loads a single subject file directly', async () => {
    const works = await loadThinkerWorksBySubject('first-international', 'Karl Marx', 'Economics');

    expect(Array.isArray(works)).toBe(true);
    expect(works.length).toBeGreaterThan(0);
  });

  it('returns an empty array for a missing subject file', async () => {
    const works = await loadThinkerWorksBySubject('first-international', 'Karl Marx', 'Not A Real Subject');

    expect(works).toEqual([]);
  });
});
