#!/usr/bin/env python3

import json

def update_wikipedia_urls(thinkers_to_update: list[dict]):
    """
    Updates the bioUrl (b field) in thinkers-metadata.json with Wikipedia URLs
    for specified thinkers.

    Args:
        thinkers_to_update: A list of dictionaries, each with 'name' and 'wikipedia_url'.
    """
    metadata_file = "data/thinkers-metadata.json"

    with open(metadata_file, "r+", encoding="utf-8") as f:
        thinkers_metadata = json.load(f)

        for update_item in thinkers_to_update:
            thinker_name = update_item["name"]
            wikipedia_url = update_item["wikipedia_url"]

            found_thinker = False
            for category_key, thinkers_list in thinkers_metadata.items():
                for thinker in thinkers_list:
                    if thinker["n"] == thinker_name:
                        thinker["b"] = wikipedia_url  # Update bioUrl
                        print(f"Updated {thinker_name} with Wikipedia URL: {wikipedia_url}")
                        found_thinker = True
                        break
                if found_thinker:
                    break
            if not found_thinker:
                print(f"Thinker '{thinker_name}' not found in metadata.")

        f.seek(0)
        json.dump(thinkers_metadata, f, indent=2, ensure_ascii=False)
        f.truncate()

if __name__ == "__main__":
    # Example usage:
    thinkers = [
        {
            "name": "Karl Marx",
            "wikipedia_url": "https://en.wikipedia.org/wiki/Karl_Marx"
        },
        {
            "name": "Friedrich Engels",
            "wikipedia_url": "https://en.wikipedia.org/wiki/Friedrich_Engels"
        },
        # Add more thinkers here as needed
    ]

    update_wikipedia_urls(thinkers)
    print("Wikipedia URLs update script finished.")
