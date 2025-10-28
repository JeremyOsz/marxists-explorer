# Marxists Explorer

A searchable database of Marxist thinkers and their works, sourced from [Marxists.org](https://www.marxists.org).

## Features

- 🔍 **Search & Filter**: Browse hundreds of Marxist thinkers by name, category, or description
- 📚 **Works by Subject**: View works organized by subject categories (Political Theory, Economics, Philosophy, etc.)
- ⭐ **Major Works Highlighting**: Quick access to the most important texts for key thinkers
- 📖 **Direct Links**: All works link directly to full texts on Marxists.org
- 🎨 **Modern UI**: Clean, responsive interface built with Next.js and Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
marxists-explorer/
├── app/                    # Next.js app directory
├── components/             # React components
│   ├── thinker-search.tsx # Main search component
│   └── thinker-search-ui/ # UI subcomponents
├── lib/                    # Utilities and data loaders
│   ├── data/
│   │   └── folder-loader.ts  # Data loading from data-v2
│   └── types/              # TypeScript type definitions
├── public/
│   └── data-v2/           # Thinker data (folder structure)
│       ├── index.json     # Category index
│       └── {category}/    # Category folders
│           ├── metadata.json           # Thinker metadata
│           └── {thinker-name}/        # Thinker folders
│               └── {subject}.json     # Works by subject
└── scripts/               # Data processing and migration scripts
```

## Data Structure

The app uses a hierarchical folder structure in `public/data-v2/`:

- **Categories**: anarchists, bolsheviks, feminists, etc.
- **Thinkers**: Each category contains thinker folders
- **Subjects**: Works organized by subject (General, Political Theory, Economics, etc.)
- **Major Works**: Highlighted in thinker metadata for quick access

Example: `public/data-v2/bolsheviks/Vladimir Lenin/Political Theory.json`

## Key Technologies

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **cmdk** - Command palette for search

## Contributing

Contributions are welcome! The data is sourced from Marxists.org and organized into a searchable format.

## License

This project is open source and available under the MIT License.

## Acknowledgments

All texts and biographical information sourced from [Marxists.org](https://www.marxists.org) - The Marxists Internet Archive.
