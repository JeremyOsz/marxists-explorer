import json

# Hardcoded portrait URLs from Wikimedia Commons
portrait_urls = {
    "Karl Marx": "https://upload.wikimedia.org/wikipedia/commons/b/b3/Karl_Marx_by_John_Jabez_Edwin_Mayall_1875_-_Restored.png",
    "Friedrich Engels": "https://upload.wikimedia.org/wikipedia/commons/2/21/Friedrich_Engels_portrait_%28cropped%29.jpg",
    "Vladimir Lenin": "https://upload.wikimedia.org/wikipedia/commons/1/1f/Vladimir_Lenin_in_July_1920_by_Pavel_Zhukov.jpg",
    "Leon Trotsky": "https://upload.wikimedia.org/wikipedia/commons/3/31/Leon_trotsky.jpg",
    "Rosa Luxemburg": "https://upload.wikimedia.org/wikipedia/commons/5/52/Rosa_Luxemburg.jpg",
    "Antonio Gramsci": "https://upload.wikimedia.org/wikipedia/commons/4/4b/Antonio_Gramsci_1920.jpg",
    "Karl Kautsky": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Karl_Kautsky.jpg/800px-Karl_Kautsky.jpg",
    "Georgi Plekhanov": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Georgi_Plekhanov_c._1901.jpg/800px-Georgi_Plekhanov_c._1901.jpg",
    "Georg Lukacs": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Gy%C3%B6rgy_Luk%C3%A1cs_1952.jpg/800px-Gy%C3%B6rgy_Luk%C3%A1cs_1952.jpg",
    "Louis Althusser": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Louis_Althusser_1970.jpg/800px-Louis_Althusser_1970.jpg",
    "Jean-Paul Sartre": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/JP_Sartre_1967_crop.jpg/800px-JP_Sartre_1967_crop.jpg",
    "Herbert Marcuse": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Herbert_Marcuse_1965.jpg/800px-Herbert_Marcuse_1965.jpg",
    "Theodor Adorno": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Theodor_W._Adorno_1964_cropped_and_colorized.jpg/800px-Theodor_W._Adorno_1964_cropped_and_colorized.jpg",
    "Walter Benjamin": "https://upload.wikimedia.org/wikipedia/commons/c/cc/Walter_Benjamin_vers_1928.jpg",
    "Che Guevara": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Che_Guevara_Gerardo_S%C3%A1nchez_Noguera.jpg/800px-Che_Guevara_Gerardo_S%C3%A1nchez_Noguera.jpg",
    "Fidel Castro": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Fidel_Castro_1977.jpg/800px-Fidel_Castro_1977.jpg",
    "Ho Chi Minh": "https://upload.wikimedia.org/wikipedia/commons/4/43/Nguyen_A%C3%AFn_Nu%C3%A4%27C_%28Ho-Chi-Minh%29%2C_d%C3%A9l%C3%A9gu%C3%A9_indochinois%2C_Congr%C3%A8s_communiste_de_Marseille%2C_1921%2C_Meurisse%2C_BNF_Gallica.jpg",
    "Frantz Fanon": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Frantz_Fanon_in_1950s.jpg/800px-Frantz_Fanon_in_1950s.jpg",
    "Angela Davis": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Angela_Davis_2010.jpg/800px-Angela_Davis_2010.jpg",
    "Malcolm X": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Malcolm_X_NYWTS_2a.jpg/800px-Malcolm_X_NYWTS_2a.jpg",
    "Mao Zedong": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Mao_Zedong_1945.jpg/800px-Mao_Zedong_1945.jpg",
    "Alexandra Kollontai": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Alexandra_Kollontai.jpg/800px-Alexandra_Kollontai.jpg",
    "Simone de Beauvoir": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Simone_de_Beauvoir_1967.jpg/800px-Simone_de_Beauvoir_1967.jpg"
}

# Read the thinkers data
with open('data/thinkers.json', 'r') as f:
    thinkers_data = json.load(f)

# Update images for each thinker
updated_count = 0
for thinker in thinkers_data:
    name = thinker['name']
    if name in portrait_urls:
        old_url = thinker['imageUrl']
        new_url = portrait_urls[name]
        thinker['imageUrl'] = new_url
        print(f"✓ Updated {name}")
        updated_count += 1
    else:
        print(f"✗ No URL found for {name}")

# Write the updated data back to thinkers.json
with open('data/thinkers.json', 'w') as f:
    json.dump(thinkers_data, f, indent=2)

print(f"\nDone! Updated {updated_count} portraits.")
