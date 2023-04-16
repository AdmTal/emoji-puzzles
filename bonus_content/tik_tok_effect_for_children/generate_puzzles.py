import os
from slugify import slugify

from bonus_content.tik_tok_effect_for_children.prompts import EMOJI_PUZZLE_PROMPT

from src.generate_emoji_puzzles import (
    load_puzzle_data_from_dir,
    write_json_to_file,
    get_json_for_title_with_backoff,
)


def main():
    output_dir = 'bonus_content/tik_tok_effect_for_children/puzzles'
    inputs = 'bonus_content/tik_tok_effect_for_children/inputs'

    def process_titles(category):
        if category in ('video_games', 'tv_shows'):
            return
        for input_title in load_puzzle_data_from_dir(f'{inputs}/{category}.csv'):
            title = input_title['title']
            json_output = get_json_for_title_with_backoff(EMOJI_PUZZLE_PROMPT, category.upper(), title)
            write_json_to_file(json_output, f'{output_dir}/{category}/{slugify(title)}.json')

    categories = [os.path.splitext(file)[0] for file in os.listdir(inputs) if file.endswith('.csv')]

    for category in categories:
        process_titles(category)


if __name__ == "__main__":
    main()
