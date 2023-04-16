import os
import json
from collections import defaultdict


def print_defaultdict(d):
    # Sort the items in the defaultdict by value in descending order
    sorted_items = sorted(d.items(), key=lambda x: x[1], reverse=True)
    # Iterate through the sorted items and print each one
    for key, value in sorted_items:
        print(f"{key} -> {value}")
    exit()


def get_dicts(folder_path):
    stuff = []
    for filename in os.listdir(folder_path):
        if filename.endswith('.json'):
            filepath = os.path.join(folder_path, filename)
            with open(filepath, 'r') as f:
                json_str = f.read()
                try:
                    json_dict = json.loads(json_str)
                except Exception as err:
                    print(json_str)
                    exit()

                if 'release_year' not in json_dict:
                    raise Exception(f'{json_dict["title"]} missing release_year')

                stuff.append(json_dict)
    return stuff


g1 = defaultdict(int)

movies_dir = 'bonus_content/tik_tok_effect_for_children/puzzles/movies'
movies = get_dicts(movies_dir)

for item in movies:
    g1[item['genre_1']] += 1
    g1[item['genre_2']] += 1

print_defaultdict(g1)
