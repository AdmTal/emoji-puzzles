import os
import time
from typing import Dict, List

from src.generate_pages import (
    make_puzzle_page,
    make_answer_key_page,
)


def latest_puzzle_folder():
    puzzles_dir = 'output/generated_puzzles'
    puzzle_folders = [f for f in os.listdir(puzzles_dir) if os.path.isdir(os.path.join(puzzles_dir, f))]
    latest_folder = max(puzzle_folders, key=lambda x: time.strptime(x, '%Y-%m-%d-%I-%M-%p'))
    return latest_folder


def sort_dicts_by_release_year(dict_list):
    return sorted(dict_list, key=lambda x: int(x['release_year']))


def create_dir(path):
    if not os.path.exists(path):
        os.makedirs(path)


def create_puzzles_and_answers(
        category_list: List[Dict],
        chapter_emoji: str,
        puzzle_page_lookup: Dict,
        answer_page_lookup: Dict,
        temp_output_dir: str,
) -> List[str]:
    puzzle_pages = []

    for item in category_list:
        title = item['title']

        puzzle_pdf_file = f'{temp_output_dir}/{title}.pdf'
        pdf_page = make_puzzle_page(
            item['emoji'],
            item['genre_1'],
            item['genre_2'],
            item['release_year'],
            puzzle_pdf_file,
            puzzle_page_lookup[title],
            answer_page_lookup[title],
            chapter_emoji
        )
        puzzle_pages.append(pdf_page)

        answer_pdf_file = f'{temp_output_dir}/{title}-answer.pdf'
        make_answer_key_page(
            item['title'],
            item['explanation'],
            item['short_plot_summary'],
            answer_pdf_file,
            answer_page_lookup[title],
            puzzle_page_lookup[title],
        )
    return puzzle_pages
