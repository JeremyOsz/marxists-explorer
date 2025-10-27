import { render, screen, waitFor } from '@testing-library/react';
import { ThinkerSearch } from '../thinker-search';

// Mock the data loading functions
jest.mock('@/lib/data/thinkers-data', () => ({
  loadThinkerWorks: jest.fn(),
}));

import { loadThinkerWorks } from '@/lib/data/thinkers-data';

const mockThinkers = [
  {
    name: 'Karl Marx',
    category: 'first-international',
    description: 'The father of modern socialism',
    bioUrl: 'https://marxists.org/archive/marx/',
    imageUrl: 'https://example.com/marx.jpg',
    thumbnailUrl: 'https://example.com/marx-thumb.jpg',
    works: [],
    workCount: 10,
  },
  {
    name: 'Vladimir Lenin',
    category: 'bolsheviks',
    description: 'Leader of the Russian Revolution',
    bioUrl: 'https://marxists.org/archive/lenin/',
    imageUrl: 'https://example.com/lenin.jpg',
    thumbnailUrl: 'https://example.com/lenin-thumb.jpg',
    works: [],
    workCount: 8,
  },
  {
    name: 'Leon Trotsky',
    category: 'trotskyists',
    description: 'Bolshevik revolutionary',
    bioUrl: 'https://marxists.org/archive/trotsky/',
    imageUrl: 'https://example.com/trotsky.jpg',
    thumbnailUrl: 'https://example.com/trotsky-thumb.jpg',
    works: [],
    workCount: 12,
  },
];

describe('ThinkerSearch', () => {
  beforeEach(() => {
    (loadThinkerWorks as jest.Mock).mockResolvedValue([]);
  });

  it('should render the search component', () => {
    render(<ThinkerSearch thinkers={mockThinkers} />);
    
    // The command component should be present (it uses role="combobox" for autocomplete)
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should display all thinkers initially', async () => {
    render(<ThinkerSearch thinkers={mockThinkers} />);
    
    // Wait for items to appear
    await waitFor(() => {
      expect(screen.getByText('Karl Marx')).toBeInTheDocument();
      expect(screen.getByText('Vladimir Lenin')).toBeInTheDocument();
      expect(screen.getByText('Leon Trotsky')).toBeInTheDocument();
    });
  });
});

