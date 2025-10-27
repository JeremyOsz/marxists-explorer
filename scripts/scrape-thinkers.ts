import { writeFileSync } from 'fs';
import { resolve } from 'path';

// This is a manual list of major Marxist thinkers from marxists.org
// We'll start with a curated list and can expand later

interface ThinkerData {
  name: string;
  category: string;
  description: string;
  bioUrl: string;
}

const thinkers: ThinkerData[] = [
  // Founders of Marxism
  {
    name: "Karl Marx",
    category: "Founders",
    description: "Co-founder of Marxism, author of Das Kapital",
    bioUrl: "/reference/archive/marx/bio/index.htm"
  },
  {
    name: "Friedrich Engels",
    category: "Founders",
    description: "Co-founder of Marxism, author of Anti-Dühring",
    bioUrl: "/reference/archive/engels/bio/index.htm"
  },
  
  // Second International
  {
    name: "Vladimir Lenin",
    category: "Bolsheviks",
    description: "Leader of the Russian Revolution, founder of the USSR",
    bioUrl: "/reference/archive/lenin/bio/index.htm"
  },
  {
    name: "Leon Trotsky",
    category: "Bolsheviks",
    description: "Revolutionary leader and Marxist theorist",
    bioUrl: "/reference/archive/trotsky/bio/index.htm"
  },
  {
    name: "Rosa Luxemburg",
    category: "Social Democracy",
    description: "Polish-German revolutionary Marxist theorist",
    bioUrl: "/reference/archive/luxemburg/index.htm"
  },
  {
    name: "Antonio Gramsci",
    category: "Italian Communists",
    description: "Italian Marxist philosopher and political theorist",
    bioUrl: "/reference/archive/gramsci/bio/index.htm"
  },
  
  // Early Comintern
  {
    name: "Karl Kautsky",
    category: "Social Democracy",
    description: "German-Austrian Marxist theorist",
    bioUrl: "/reference/archive/kautsky/bio/index.htm"
  },
  {
    name: "Georgi Plekhanov",
    category: "Social Democracy",
    description: "Russian Marxist theorist and philosopher",
    bioUrl: "/reference/archive/plekhanov/bio/index.htm"
  },
  
  // Western Marxism
  {
    name: "Georg Lukacs",
    category: "Western Marxism",
    description: "Hungarian Marxist philosopher and literary critic",
    bioUrl: "/reference/archive/lukacs/index.htm"
  },
  {
    name: "Louis Althusser",
    category: "French Left",
    description: "French Marxist philosopher",
    bioUrl: "/reference/archive/althusser/bio/index.htm"
  },
  {
    name: "Jean-Paul Sartre",
    category: "French Left",
    description: "French existentialist philosopher influenced by Marxism",
    bioUrl: "/reference/archive/sartre/bio/index.htm"
  },
  {
    name: "Herbert Marcuse",
    category: "Frankfurt School",
    description: "German-American philosopher, member of the Frankfurt School",
    bioUrl: "/reference/archive/marcuse/index.htm"
  },
  {
    name: "Theodor Adorno",
    category: "Frankfurt School",
    description: "German philosopher, sociologist and musicologist",
    bioUrl: "/reference/archive/adorno/bio/index.htm"
  },
  {
    name: "Walter Benjamin",
    category: "Frankfurt School",
    description: "German philosopher and cultural critic",
    bioUrl: "/reference/archive/benjamin/bio/index.htm"
  },
  
  // Guerilla Marxism
  {
    name: "Che Guevara",
    category: "Guerilla Marxism",
    description: "Argentine Marxist revolutionary and guerrilla leader",
    bioUrl: "/archive/guevara/index.htm"
  },
  {
    name: "Fidel Castro",
    category: "National Liberation",
    description: "Cuban revolutionary and Marxist-Leninist",
    bioUrl: "/archive/castro/index.htm"
  },
  
  // National Liberation
  {
    name: "Ho Chi Minh",
    category: "National Liberation",
    description: "Vietnamese revolutionary leader and Marxist theorist",
    bioUrl: "/archive/ho/index.htm"
  },
  {
    name: "Frantz Fanon",
    category: "National Liberation",
    description: "Martiniquais-Algerian psychiatrist and revolutionary theorist",
    bioUrl: "/reference/archive/fanon/bio/index.htm"
  },
  
  // Black Liberation
  {
    name: "Angela Davis",
    category: "Black Liberation",
    description: "American Marxist, feminist, and activist",
    bioUrl: "/archive/davis-angela/index.htm"
  },
  {
    name: "Malcolm X",
    category: "Black Liberation",
    description: "African American nationalist and civil rights leader",
    bioUrl: "/archive/malcolm-x/index.htm"
  },
  
  // Chinese Communists
  {
    name: "Mao Zedong",
    category: "Maoists",
    description: "Leader of the Chinese Communist Party and Marxist theorist",
    bioUrl: "/reference/archive/mao/bio/index.htm"
  },
  
  // Feminists
  {
    name: "Alexandra Kollontai",
    category: "Feminists",
    description: "Russian revolutionary, diplomat, and Marxist feminist",
    bioUrl: "/archive/kollontai/index.htm"
  },
  {
    name: "Simone de Beauvoir",
    category: "Feminists",
    description: "French existentialist philosopher and feminist theorist",
    bioUrl: "/reference/archive/debeauvoir/bio/index.htm"
  }
];

// Save the initial thinkers data
const outputPath = resolve(process.cwd(), 'data/thinkers.json');
writeFileSync(outputPath, JSON.stringify(thinkers, null, 2));

console.log(`✅ Created data file with ${thinkers.length} thinkers at ${outputPath}`);
