from src.generate_pages import make_puzzle_page_as_png
from src.generate_book_utils import (
    sort_dicts_by_release_year,
)
from src.generated_content_utils import load_json_files_from_path
import os

_OUTPUT = './bonus_content/tik_tok_effect_for_children/images/'

puzzles_path = 'bonus_content/tik_tok_effect_for_children/puzzles'
images_output_dir = f'bonus_content/tik_tok_effect_for_children/images'

categories = os.listdir(puzzles_path)

categories_to_emoji = {
    'songs': '🎵',
    'video_games': '🎮',
    'books': '📚',
    'tv_shows': '📺',
    'movies': '🎬',
}

for category in categories:
    category_list = sort_dicts_by_release_year(
        load_json_files_from_path(f'{puzzles_path}/{category}'))

    for item in category_list:
        title = item['title']

        g1, g2 = sorted([item['genre_1'], item['genre_2']])
        image_path = make_puzzle_page_as_png(
            item['emoji'],
            g1,
            g2,
            item.get('release_year', '🖨'),
            categories_to_emoji[category],
            title.replace(' ', '-'),
            (500, 300),
            _OUTPUT
        )
        print(image_path)
