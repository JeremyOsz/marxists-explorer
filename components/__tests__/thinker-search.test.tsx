import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThinkerSearch } from '../thinker-search';

jest.mock('../thinker-search-ui/ThinkerSearchBar', () => ({
  ThinkerSearchBar: ({ searchQuery, setSearchQuery }: { searchQuery: string; setSearchQuery: (value: string) => void }) => (
    <input
      aria-label="Thinker search"
      value={searchQuery}
      onChange={(event) => setSearchQuery(event.target.value)}
    />
  ),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

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
    searchText: 'karl marx first-international father of modern socialism',
    subjects: [{ name: 'Economics', count: 5 }],
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
    searchText: 'vladimir lenin bolsheviks leader of the russian revolution',
    subjects: [{ name: 'Political Theory', count: 4 }],
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
    searchText: 'leon trotsky trotskyists bolshevik revolutionary',
    subjects: [{ name: 'History', count: 6 }],
  },
];

describe('ThinkerSearch', () => {
  it('should render the search component', () => {
    render(<ThinkerSearch thinkers={mockThinkers} />);
    
    expect(screen.getByLabelText('Thinker search')).toBeTruthy();
  });

  it('should display all thinkers initially', async () => {
    render(<ThinkerSearch thinkers={mockThinkers} />);
    
    // Wait for items to appear
    await waitFor(() => {
      expect(screen.getByText('Karl Marx')).toBeTruthy();
      expect(screen.getByText('Vladimir Lenin')).toBeTruthy();
      expect(screen.getByText('Leon Trotsky')).toBeTruthy();
    });
  });

  it('should filter thinkers using precomputed search text', async () => {
    render(<ThinkerSearch thinkers={mockThinkers} />);

    const input = screen.getByLabelText('Thinker search');
    fireEvent.input(input, { target: { value: 'russian revolution' } });

    await waitFor(() => {
      expect(screen.getByText('Vladimir Lenin')).toBeTruthy();
      expect(screen.queryByText('Karl Marx')).toBeNull();
    });
  });
});
