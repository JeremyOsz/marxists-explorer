
import json

def update_thinker_data(
    thinker_name: str,
    category: str,
    bio_url: str,
    image_url: str,
    thumbnail_url: str,
    new_works: list[dict]
):
    # Update thinkers-works.json
    with open("data/thinkers-works.json", "r+") as f:
        thinkers_works = json.load(f)
        
        if thinker_name in thinkers_works:
            existing_works = thinkers_works[thinker_name]
            existing_urls = {work["url"] for work in existing_works}
            for work in new_works:
                if work["url"] not in existing_urls:
                    existing_works.append(work)
                    existing_urls.add(work["url"])
        else:
            thinkers_works[thinker_name] = new_works
        
        f.seek(0)
        json.dump(thinkers_works, f, indent=2)
        f.truncate()

    # Update thinkers-metadata.json
    with open("data/thinkers-metadata.json", "r+") as f:
        thinkers_metadata = json.load(f)
        
        found_thinker = False
        for cat_key, thinkers_list in thinkers_metadata.items():
            for thinker in thinkers_list:
                if thinker["n"] == thinker_name:
                    thinker["w"] = len(thinkers_works[thinker_name])
                    found_thinker = True
                    break
            if found_thinker:
                break

        if not found_thinker:
            new_metadata_entry = {
                "n": thinker_name,
                "c": category,
                "d": "", # Description needs to be provided as an argument if desired
                "b": bio_url,
                "i": image_url,
                "t": thumbnail_url,
                "w": len(thinkers_works[thinker_name])
            }
            if category in thinkers_metadata:
                thinkers_metadata[category].append(new_metadata_entry)
            else:
                thinkers_metadata[category] = [new_metadata_entry]
        
        f.seek(0)
        json.dump(thinkers_metadata, f, indent=2)
        f.truncate()

if __name__ == "__main__":
    # Example Usage (You would replace this with actual data for a new thinker)
    example_thinker_name = "New Thinker"
    example_category = "New Category"
    example_bio_url = "https://www.marxists.org/example/bio.htm"
    example_image_url = "https://upload.wikimedia.org/example.jpg"
    example_thumbnail_url = "https://upload.wikimedia.org/thumb/example.jpg"
    example_new_works = [
        {"title": "Work 1 of New Thinker", "url": "https://www.marxists.org/example/work1.htm"},
        {"title": "Work 2 of New Thinker", "url": "https://www.marxists.org/example/work2.htm"},
    ]

    # Uncomment the line below to run the example
    # update_thinker_data(example_thinker_name, example_category, example_bio_url, example_image_url, example_thumbnail_url, example_new_works)

    # You can also use this script to update existing thinkers by providing their correct data
    # For instance, to update Lenin again (you would provide the full list of his works here)
    # update_thinker_data(
    #     "Vladimir Lenin",
    #     "Bolsheviks",
    #     "/reference/archive/lenin/bio/index.htm",
    #     "https://upload.wikimedia.org/wikipedia/commons/1/1f/Vladimir_Lenin_in_July_1920_by_Pavel_Zhukov.jpg",
    #     "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Vladimir_Lenin_in_July_1920_by_Pavel_Zhukov.jpg/250px-Vladimir_Lenin_in_July_1920_by_Pavel_Zhukov.jpg",
    #     [
    #         {"title": "What Is To Be Done?", "url": "/archive/lenin/works/1901/witbd/"},
    #         {"title": "Imperialism, the Highest Stage of Capitalism", "url": "/archive/lenin/works/1916/imp-hsc/"},
    #         # ... and all other Lenin works ...
    #     ]
    # )
