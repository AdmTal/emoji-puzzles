import json
import os

"""
File written with GPT-4
Prompt:

Write a python script that reads all of the .json files from a given directory, including any that are in subdirectories, and validates that they contain valid JSON.  Also, that they conform to the same shape as this object:

{
    "type": "Movie",
    "title": "Rocky",
    "release_year": "1976",
    "genre_1": "Sports",
    "genre_2": "Drama",
    "emoji": "🔔🏃‍♂️🥊🏟️❤️",
    "short_plot_summary": "A small-time Philadelphia boxer gets a supremely rare chance to fight the world heavyweight champion in a bout in which he strives to go the distance for his self-respect.",
    "explanation": [
        [
            "🔔",
            "A bell, representing the Liberty Bell and the movie's setting in Philadelphia"
        ],
        [
            "🏃‍♂️",
            "A running man, representing Rocky's iconic training scenes"
        ],
        [
            "🥊",
            "A boxing glove, the sport featured in the movie"
        ],
        [
            "🏟️",
            "An arena, signifying the climactic boxing match and Rocky's determination to prove himself"
        ],
        [
            "❤️",
            "A heart, symbolizing the love story between Rocky and Adrian"
        ]
    ]
}
"""


def validate_json_structure(json_data):
    keys = {
        'type', 'title', 'release_year', 'genre_1', 'genre_2', 'emoji',
        'short_plot_summary', 'explanation'
    }

    if not isinstance(json_data, dict):
        return 'JSON data is not a dictionary'

    missing_keys = keys - set(json_data.keys())
    if missing_keys:
        return f'Missing keys: {", ".join(missing_keys)}'

    extra_keys = set(json_data.keys()) - keys
    if extra_keys:
        return f'Extra keys: {", ".join(extra_keys)}'

    if not isinstance(json_data['explanation'], list):
        return 'The "explanation" field is not a list'

    for index, explanation_item in enumerate(json_data['explanation']):
        if not isinstance(explanation_item, list) or len(explanation_item) != 2:
            return f'Invalid explanation item at index {index}'

    return None


def validate_json_files(directory) -> bool:
    all_files_valid = True

    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.json'):
                file_path = os.path.join(root, file)
                file_title = file_path.replace(f'{directory}/', '')

                try:
                    with open(file_path, 'r') as f:
                        json_data = json.load(f)

                    error = validate_json_structure(json_data)
                    if error:
                        print(f'{file_title} - Error: {error}')
                        all_files_valid = False

                except json.JSONDecodeError as e:
                    print(f'{file_title}: Invalid JSON: {e}')
                    all_files_valid = False

    return all_files_valid


if __name__ == '__main__':
    directory = 'output/generated_puzzles'
    if validate_json_files(directory):
        print('All puzzle files are good!')
    else:
        print('Some puzzle files contain errors, please see above')
