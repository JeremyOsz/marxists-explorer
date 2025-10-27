import { Category } from '../types/thinker';

/**
 * Metadata for all thinker categories
 * Based on the marxists.org index structure
 */
export const categories: Category[] = [
  {
    id: 'first-international',
    name: 'First International',
    description: 'Marx and Engels, the founders of Marxism and their associates: 1844-1880s',
    order: 1
  },
  {
    id: 'social-democracy',
    name: 'Social Democracy',
    description: 'The Second International, founded in the 1880s and later the Labour Parties of the world',
    order: 2
  },
  {
    id: 'reformists',
    name: 'Reformists',
    description: 'Social Democrats who wanted to achieve socialism by gradual reform, not revolution: 1880s - 1914',
    order: 3
  },
  {
    id: 'fabians',
    name: 'Fabians',
    description: 'A British group of socialists who advocated reforms to avoid revolution: 1890s/1900s',
    order: 4
  },
  {
    id: 'the-bolsheviks',
    name: 'The Bolsheviks',
    description: 'Lenin and The Russian Social Democrats who made the October 1917 Revolution',
    order: 5
  },
  {
    id: 'early-comintern',
    name: 'Early Comintern',
    description: 'Communists across the world who rallied behind the Bolsheviks from 1919',
    order: 6
  },
  {
    id: 'comintern',
    name: 'Comintern',
    description: 'The Communist Parties of the world, from the mid-1920s - 1980s',
    order: 7
  },
  {
    id: 'soviet-science',
    name: 'Soviet Science',
    description: 'Soviet writers who applied Marxist ideas to different branches of science: 1914-1961',
    order: 8
  },
  {
    id: 'soviet-marxism',
    name: 'Soviet Marxism',
    description: 'Writers who continued Marxism in the guise of science and philosophy: 1924-1979',
    order: 9
  },
  {
    id: 'western-marxism',
    name: 'Western Marxism',
    description: 'After capitalism stabilized, Marxists faced new strategic problems, from the mid-1920s - 1990s',
    order: 10
  },
  {
    id: 'french-left',
    name: 'French Left',
    description: 'The French intellectuals and students who offered new directions: 1953-1974',
    order: 11
  },
  {
    id: 'frankfurt-school',
    name: 'Frankfurt School',
    description: "A 'Communist University' founded in 1923 and still operative today: 1923-1998",
    order: 12
  },
  {
    id: 'trotskyists',
    name: 'Trotskyists',
    description: 'Founded by Bolsheviks and other Communists who supported the Russian Revolution but opposed Stalin: 1923-2004',
    order: 13
  },
  {
    id: 'left-communism',
    name: 'Left Communism',
    description: 'Communists who opposed governmental power as a strategy for socialism: 1902-1978, and recent Left communists in Asia, 1978-1994',
    order: 14
  },
  {
    id: 'marxist-humanism',
    name: 'Marxist Humanism',
    description: 'Socialists who opposed ideas of structuralism and historical determinism, 1950s/60s',
    order: 15
  },
  {
    id: 'market-socialists',
    name: 'Market Socialists',
    description: 'Communists who advocated the opening up of the market within socialist society: 1972-1989',
    order: 16
  },
  {
    id: 'guerilla-marxism',
    name: 'Guerilla Marxism',
    description: 'Marxists who advocated guerilla warfare in the countryside: 1959-1969',
    order: 17
  },
  {
    id: 'maoists',
    name: 'Maoists',
    description: "Followers of Mao Zedong 1917-1975, and India's Naxalbari",
    order: 18
  },
  {
    id: 'national-liberation',
    name: 'National Liberation',
    description: 'Leaders of the national liberation movement against colonialism: 1950s/60s',
    order: 19
  },
  {
    id: 'african-liberation',
    name: 'African Liberation',
    description: 'Pan-Africanism and the South African Communist Party, 1961-1998',
    order: 20
  },
  {
    id: 'black-liberation',
    name: 'Black Liberation',
    description: 'The Black Panthers 1966-998, and their predecessors, 1800-1859',
    order: 21
  },
  {
    id: 'french-revolution',
    name: 'French Revolution',
    description: 'Writers of the Great French Revolution of 1789-1799',
    order: 22
  },
  {
    id: 'paris-commune',
    name: 'Paris Commune',
    description: 'The Parisian workers who took power in 1871',
    order: 23
  },
  {
    id: 'utopianism',
    name: 'Utopianism',
    description: 'Pioneers of socialism who imagined a better world: 1515-1888',
    order: 24
  },
  {
    id: 'anarchists',
    name: 'Anarchists',
    description: 'Anarchists who call for the destruction of all states',
    order: 25
  },
  {
    id: 'feminists',
    name: 'Feminists',
    description: 'Women who opposed sexism and patriarchy',
    order: 26
  },
  {
    id: 'populists',
    name: 'Populists',
    description: 'People who spread the word and popularised socialist ideas',
    order: 27
  },
  {
    id: 'political-science',
    name: 'Political Science',
    description: 'Pioneers of military, social and political science',
    order: 28
  },
  {
    id: 'philosophy',
    name: 'Philosophy',
    description: 'Hegel and other Philosophers who influenced Marxists',
    order: 29
  },
  {
    id: 'ethics',
    name: 'Ethics',
    description: 'Kant and other pioneers of Ethics',
    order: 30
  },
  {
    id: 'political-economy',
    name: 'Political Economy',
    description: 'From Adam Smith to John Maynard Keynes',
    order: 31
  },
  {
    id: 'natural-science',
    name: 'Natural Science',
    description: 'Important pioneers in natural science',
    order: 32
  }
];

/**
 * Get category by ID
 */
export function getCategoryById(id: string): Category | undefined {
  return categories.find(cat => cat.id === id);
}

/**
 * Get all category IDs
 */
export function getCategoryIds(): string[] {
  return categories.map(cat => cat.id);
}
