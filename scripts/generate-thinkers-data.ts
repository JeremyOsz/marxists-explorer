import { writeFileSync } from 'fs';
import { resolve } from 'path';

interface Thinker {
  name: string;
  category: string;
  description: string;
  bioUrl: string;
  imageUrl: string;
  works: {
    title: string;
    url: string;
  }[];
}

const thinkers: Thinker[] = [
  {
    name: "Karl Marx",
    category: "Founders",
    description: "Co-founder of Marxism, author of Das Kapital",
    bioUrl: "/reference/archive/marx/bio/index.htm",
    imageUrl: "/reference/archive/marx/bio/marx-big.jpg",
    works: [
      { title: "Das Kapital", url: "/archive/marx/works/1867-c1/" },
      { title: "Communist Manifesto", url: "/archive/marx/works/1848/communist-manifesto/" },
      { title: "The German Ideology", url: "/archive/marx/works/1845/german-ideology/" },
      { title: "The Eighteenth Brumaire of Louis Bonaparte", url: "/archive/marx/works/1852/18th-brumaire/" }
    ]
  },
  {
    name: "Friedrich Engels",
    category: "Founders",
    description: "Co-founder of Marxism, author of Anti-Dühring",
    bioUrl: "/reference/archive/engels/bio/index.htm",
    imageUrl: "/reference/archive/engels/bio/engels-big.jpg",
    works: [
      { title: "Anti-Dühring", url: "/archive/marx/works/1877/anti-duhring/" },
      { title: "The Origin of the Family", url: "/archive/marx/works/1884/origin-family/" },
      { title: "Socialism: Utopian and Scientific", url: "/archive/marx/works/1880/soc-utop/index.htm" },
      { title: "The Condition of the Working Class in England", url: "/archive/marx/works/1845/condition-working-class/" }
    ]
  },
  {
    name: "Vladimir Lenin",
    category: "Bolsheviks",
    description: "Leader of the Russian Revolution, founder of the USSR",
    bioUrl: "/reference/archive/lenin/bio/index.htm",
    imageUrl: "/reference/archive/lenin/bio/lenin-big.jpg",
    works: [
      { title: "What Is To Be Done?", url: "/archive/lenin/works/1901/witbd/" },
      { title: "Imperialism, the Highest Stage of Capitalism", url: "/archive/lenin/works/1916/imp-hsc/" },
      { title: "State and Revolution", url: "/archive/lenin/works/1917/staterev/" },
      { title: "April Theses", url: "/archive/lenin/works/1917/apr03.htm" }
    ]
  },
  {
    name: "Leon Trotsky",
    category: "Bolsheviks",
    description: "Revolutionary leader and Marxist theorist",
    bioUrl: "/reference/archive/trotsky/bio/index.htm",
    imageUrl: "https://www.marxists.org/archive/trotsky/bio/nphoto.htm",
    works: [
      { title: "The Permanent Revolution", url: "/archive/trotsky/1931/tpr/" },
      { title: "History of the Russian Revolution", url: "/archive/trotsky/1930/hrr/" },
      { title: "The Revolution Betrayed", url: "/archive/trotsky/1936/revbet/" },
      { title: "My Life", url: "/archive/trotsky/1930/mylife/" }
    ]
  },
  {
    name: "Rosa Luxemburg",
    category: "Social Democracy",
    description: "Polish-German revolutionary Marxist theorist",
    bioUrl: "/reference/archive/luxemburg/index.htm",
    works: [
      { title: "Reform or Revolution", url: "/archive/luxemburg/1900/reform-revolution/" },
      { title: "The Accumulation of Capital", url: "/archive/luxemburg/1913/accumulation-capital/" },
      { title: "The Mass Strike", url: "/archive/luxemburg/1906/mass-strike/" },
      { title: "The Russian Revolution", url: "/archive/luxemburg/1918/russian-revolution/" }
    ]
  },
  {
    name: "Antonio Gramsci",
    category: "Italian Communists",
    description: "Italian Marxist philosopher and political theorist",
    bioUrl: "/reference/archive/gramsci/bio/index.htm",
    works: [
      { title: "Prison Notebooks", url: "/archive/gramsci/" },
      { title: "The Southern Question", url: "/archive/gramsci/" }
    ]
  },
  {
    name: "Karl Kautsky",
    category: "Social Democracy",
    description: "German-Austrian Marxist theorist",
    bioUrl: "/reference/archive/kautsky/bio/index.htm",
    works: [
      { title: "The Economic Doctrines of Karl Marx", url: "/archive/kautsky/1883/econ/index.htm" },
      { title: "The Road to Power", url: "/archive/kautsky/1909/power/index.htm" }
    ]
  },
  {
    name: "Georgi Plekhanov",
    category: "Social Democracy",
    description: "Russian Marxist theorist and philosopher",
    bioUrl: "/reference/archive/plekhanov/bio/index.htm",
    works: [
      { title: "The Development of the Monist View of History", url: "/archive/plekhanov/" }
    ]
  },
  {
    name: "Georg Lukacs",
    category: "Western Marxism",
    description: "Hungarian Marxist philosopher and literary critic",
    bioUrl: "/reference/archive/lukacs/index.htm",
    works: [
      { title: "History and Class Consciousness", url: "/archive/lukacs/" },
      { title: "The Destruction of Reason", url: "/archive/lukacs/" }
    ]
  },
  {
    name: "Louis Althusser",
    category: "French Left",
    description: "French Marxist philosopher",
    bioUrl: "/reference/archive/althusser/bio/index.htm",
    works: [
      { title: "For Marx", url: "/archive/althusser/" },
      { title: "Reading Capital", url: "/archive/althusser/" },
      { title: "Ideology and Ideological State Apparatuses", url: "/archive/althusser/" }
    ]
  },
  {
    name: "Jean-Paul Sartre",
    category: "French Left",
    description: "French existentialist philosopher influenced by Marxism",
    bioUrl: "/reference/archive/sartre/bio/index.htm",
    works: [
      { title: "Being and Nothingness", url: "/archive/sartre/" },
      { title: "Critique of Dialectical Reason", url: "/archive/sartre/" }
    ]
  },
  {
    name: "Herbert Marcuse",
    category: "Frankfurt School",
    description: "German-American philosopher, member of the Frankfurt School",
    bioUrl: "/reference/archive/marcuse/index.htm",
    works: [
      { title: "One-Dimensional Man", url: "/reference/archive/marcuse/" },
      { title: "Eros and Civilization", url: "/reference/archive/marcuse/" }
    ]
  },
  {
    name: "Theodor Adorno",
    category: "Frankfurt School",
    description: "German philosopher, sociologist and musicologist",
    bioUrl: "/reference/archive/adorno/bio/index.htm",
    works: [
      { title: "Dialectic of Enlightenment", url: "/reference/archive/adorno/" },
      { title: "Negative Dialectics", url: "/reference/archive/adorno/" }
    ]
  },
  {
    name: "Walter Benjamin",
    category: "Frankfurt School",
    description: "German philosopher and cultural critic",
    bioUrl: "/reference/archive/benjamin/bio/index.htm",
    works: [
      { title: "The Work of Art in the Age of Mechanical Reproduction", url: "/reference/archive/benjamin/" },
      { title: "Theses on the Philosophy of History", url: "/reference/archive/benjamin/" }
    ]
  },
  {
    name: "Che Guevara",
    category: "Guerilla Marxism",
    description: "Argentine Marxist revolutionary and guerrilla leader",
    bioUrl: "/archive/guevara/index.htm",
    works: [
      { title: "Guerrilla Warfare", url: "/archive/guevara/" },
      { title: "Socialism and Man in Cuba", url: "/archive/guevara/" }
    ]
  },
  {
    name: "Fidel Castro",
    category: "National Liberation",
    description: "Cuban revolutionary and Marxist-Leninist",
    bioUrl: "/archive/castro/index.htm",
    works: [
      { title: "History Will Absolve Me", url: "/archive/castro/" }
    ]
  },
  {
    name: "Ho Chi Minh",
    category: "National Liberation",
    description: "Vietnamese revolutionary leader and Marxist theorist",
    bioUrl: "/archive/ho/index.htm",
    works: [
      { title: "Selected Works", url: "/archive/ho/" }
    ]
  },
  {
    name: "Frantz Fanon",
    category: "National Liberation",
    description: "Martiniquais-Algerian psychiatrist and revolutionary theorist",
    bioUrl: "/reference/archive/fanon/bio/index.htm",
    works: [
      { title: "The Wretched of the Earth", url: "/archive/fanon/" },
      { title: "Black Skin, White Masks", url: "/archive/fanon/" }
    ]
  },
  {
    name: "Angela Davis",
    category: "Black Liberation",
    description: "American Marxist, feminist, and activist",
    bioUrl: "/archive/davis-angela/index.htm",
    works: [
      { title: "Women, Race and Class", url: "/archive/davis-angela/" },
      { title: "Are Prisons Obsolete?", url: "/archive/davis-angela/" }
    ]
  },
  {
    name: "Malcolm X",
    category: "Black Liberation",
    description: "African American nationalist and civil rights leader",
    bioUrl: "/archive/malcolm-x/index.htm",
    works: [
      { title: "The Autobiography of Malcolm X", url: "/archive/malcolm-x/" }
    ]
  },
  {
    name: "Mao Zedong",
    category: "Maoists",
    description: "Leader of the Chinese Communist Party and Marxist theorist",
    bioUrl: "/reference/archive/mao/bio/index.htm",
    works: [
      { title: "On Contradiction", url: "/reference/archive/mao/selected-works/" },
      { title: "On Practice", url: "/reference/archive/mao/selected-works/" },
      { title: "Quotations from Chairman Mao", url: "/reference/archive/mao/selected-works/" }
    ]
  },
  {
    name: "Alexandra Kollontai",
    category: "Feminists",
    description: "Russian revolutionary, diplomat, and Marxist feminist",
    bioUrl: "/archive/kollontai/index.htm",
    works: [
      { title: "The Autobiography of a Sexually Emancipated Communist Woman", url: "/archive/kollontai/" },
      { title: "Selected Articles and Speeches", url: "/archive/kollontai/" }
    ]
  },
  {
    name: "Simone de Beauvoir",
    category: "Feminists",
    description: "French existentialist philosopher and feminist theorist",
    bioUrl: "/reference/archive/debeauvoir/bio/index.htm",
    works: [
      { title: "The Second Sex", url: "/reference/archive/debeauvoir/" }
    ]
  }
];

// Save the thinkers data
const outputPath = resolve(process.cwd(), 'data/thinkers.json');
writeFileSync(outputPath, JSON.stringify(thinkers, null, 2));

console.log(`✅ Created data file with ${thinkers.length} thinkers at ${outputPath}`);
