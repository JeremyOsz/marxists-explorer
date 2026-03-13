# Agent memory

## Learned User Preferences

- Visualisation sections (e.g. Catalogue Scale, Corpus Analytics) should share the same style: uppercase small label, title, section background gradient, and spacing.
- Chart colours and bar width in visualisations should match the rest of the dashboard (e.g. same palette and bar padding as other work-count charts).
- This is a Marxist site: use red (not blue-green) for highlights, accents, bar charts, badges, progress bars, and graph highlights.
- Featured thinker on the home page should depend on selected category: All Categories → Karl Marx; Bolsheviks / Soviet Marxism → Lenin; Trotskyists → Leon Trotsky; Anarchists → Petr Kropotkin; Comintern → Stalin; Maoists → Mao Zedong; etc.
- When the canonical featured thinker for a category (e.g. Trotsky for Trotskyists) is filed under a different category in the data, resolve them from the full thinkers list so they still appear as featured.

## Learned Workspace Facts

- Multi-source text harvest: MIA (Marxists.org), Anarchist Library, redtexts.org, Goldman Archive; each source has a mapper and harvester; merge step dedupes by URL and attaches source_id.
- Harvest pipeline: zero-works thinkers → map (per source) → harvest (per source) → merge → apply → public/data-v2.
- Works can carry optional source_id for attribution (e.g. "mia", "anarchist_library", "redtexts", "goldman_archive").
- Thinker source register and build_source_register support multiple sources per thinker and source_id.
