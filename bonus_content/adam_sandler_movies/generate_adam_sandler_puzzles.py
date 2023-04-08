from slugify import slugify

from bonus_content.adam_sandler_movies.prompts import EMOJI_PUZZLE_PROMPT

from src.generate_emoji_puzzles import (
    load_puzzle_data_from_dir,
    write_json_to_file,
    get_json_for_title_with_backoff,
)


def main():
    output_dir = f'bonus_content/adam_sandler_movies/puzzles/'
    adam_sandler_movies = 'bonus_content/adam_sandler_movies/movies.csv'

    for adam_sandler_movie in load_puzzle_data_from_dir(adam_sandler_movies):
        title = adam_sandler_movie['title']
        json_output = get_json_for_title_with_backoff(EMOJI_PUZZLE_PROMPT, 'MOVIE', title)
        write_json_to_file(json_output, f'{output_dir}/{slugify(title)}.json')

    print('Done!')


if __name__ == '__main__':
    main()
