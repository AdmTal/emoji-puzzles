import argparse
import os
import random
import tempfile
import time
from typing import Dict, List

from PyPDF2 import PdfReader, PdfMerger

from book_generation.generated_content_utils import load_json_files_from_path
from book_generation.generate_pages import (
    make_puzzle_page,
    make_answer_key_page,
    make_chapter_divider_page,
    make_blank_page,
    is_left_page,
    set_ebook_version,
)

parser = argparse.ArgumentParser()
parser.add_argument("--layout", required=True, choices=["ebook", "paperback"])
parser.add_argument("--input", default=None, type=str)
args = parser.parse_args()

IS_EBOOK = args.layout == "ebook"
IS_PAPERBACK = not IS_EBOOK
set_ebook_version(IS_EBOOK)


def latest_puzzle_folder():
    puzzles_dir = 'generated_files/puzzle_pages'
    puzzle_folders = [f for f in os.listdir(puzzles_dir) if os.path.isdir(os.path.join(puzzles_dir, f))]
    latest_folder = max(puzzle_folders, key=lambda x: time.strptime(x, '%Y-%m-%d-%I-%M-%p'))
    return latest_folder


iteration_id = args.input if args.input else latest_puzzle_folder()

print(f'Generating {args.layout} from {iteration_id}')


def sort_dicts_by_release_year(dict_list):
    return sorted(dict_list, key=lambda x: int(x['release_year']))


content_source_directory = f'generated_files/puzzle_pages/{iteration_id}'
movies = sort_dicts_by_release_year(
    load_json_files_from_path(
        f'{content_source_directory}/movies/'))

tv_shows = sort_dicts_by_release_year(
    load_json_files_from_path(
        f'{content_source_directory}/tv_shows/'))

books = sort_dicts_by_release_year(
    load_json_files_from_path(
        f'{content_source_directory}/books/'))


def create_dir(path):
    if not os.path.exists(path):
        os.makedirs(path)


manuscript_output_dir = f'generated_files/manuscripts/{iteration_id}'
create_dir(manuscript_output_dir)

temp_output_dir = tempfile.mkdtemp()
create_dir(temp_output_dir)

# These pages are generated from code
blank_page = make_blank_page(f'{temp_output_dir}/blank.pdf')
title_page = make_chapter_divider_page('Emoji Puzzles', '🧩', f'{temp_output_dir}/title.pdf')
dedication_page = make_chapter_divider_page('Dedication', '❤️', f'{temp_output_dir}/dedication.pdf')
intro_page = make_chapter_divider_page('Intro', '👋', f'{temp_output_dir}/intro.pdf')
copyright_attributions = make_chapter_divider_page('Copyright ©', '⚖️', f'{temp_output_dir}/copyright_attributions.pdf')
movies_page = make_chapter_divider_page('Movies', '🎬', f'{temp_output_dir}/movies.pdf')
tv_shows_page = make_chapter_divider_page('TV Shows', '📺', f'{temp_output_dir}/tv_shows.pdf')
books_page = make_chapter_divider_page('Books', '📚', f'{temp_output_dir}/books.pdf')
answers_page = make_chapter_divider_page('Answers', '💡', f'{temp_output_dir}/answers.pdf')

# These pages were created manually on https://www.canva.com/ and included here
qr_code_page = 'externally_generated_files/qr-code.pdf'
toc_paperback = 'externally_generated_files/paperback-table-of-contents.pdf'
toc_ebook = 'externally_generated_files/ebook-table-of-contents.pdf'
how_to_play = 'externally_generated_files/how-to-play.pdf'

# Before building the book, figure out what page each Puzzle and Answer will land on
puzzle_page_lookup = {}
answer_page_lookup = {}
puzzle_to_answer = {}

# Ebooks + Paperback layouts are different.
# Paperback books need to have blank pages to ensure Left/Right page alignment
# So you'll see some IF statements treating them differently as the book is being built
if IS_EBOOK:
    page_offset = len([
        'title',
        'copyright_attribution',
        'dedication',
        'QR Code', 'intro',
        'how-to-play',
        'Table of Contents',
        'Movies Chapter Page',
    ])
else:
    page_offset = len([
        'title',
        'copyright_attribution', 'dedication',
        'QR Code', 'intro',
        'blank', 'how-to-play',
        'blank', 'Table of Contents',
        'blank', 'Movies Chapter Page',
        'blank'
    ])

if IS_EBOOK:
    # Page numbers are just actual PDF natural page numbers
    current_page_num = page_offset
else:
    # "Page 1" will be the one with the first puzzle, and it should be on the RIGHT side
    current_page_num = 0

# 😅 Please don't judge me too hard - the following code is very repetitive
# But I genuinely feel it's easier for layout to keep it this way - easier to change if needed

# Add all the Movie Puzzles
for item in movies:
    title = item['title']
    current_page_num += 1
    puzzle_page_lookup[title] = current_page_num

if IS_PAPERBACK:
    # If the last page was on the LEFT
    if is_left_page(current_page_num):
        # add 2 more for LEFT (RIGHT, LEFT)
        current_page_num += 2
    else:
        # Add one for RIGHT (LEFT)
        current_page_num += 1

# Hold space for a Chapter Page
current_page_num += 1
if IS_PAPERBACK:
    # Add one so LEFT after chapter page can be blank
    current_page_num += 1

# Add all the TV Shows
for item in tv_shows:
    title = item['title']
    current_page_num += 1
    puzzle_page_lookup[title] = current_page_num

if IS_PAPERBACK:
    # If the last page was on the LEFT
    if is_left_page(current_page_num):
        # add 2 more for LEFT (RIGHT, LEFT)
        current_page_num += 2
    else:
        # Add one for RIGHT (LEFT)
        current_page_num += 1

# Hold space for Chapter Page
current_page_num += 1
if IS_PAPERBACK:
    # Add one so LEFT after chapter page can be blank
    current_page_num += 1

# Add all the Books
for item in books:
    title = item['title']
    current_page_num += 1
    puzzle_page_lookup[title] = current_page_num

if IS_PAPERBACK:
    # If the last page was on the LEFT
    if is_left_page(current_page_num):
        # add 2 more for LEFT (RIGHT, LEFT)
        current_page_num += 2
    else:
        # Add one for RIGHT (LEFT)
        current_page_num += 1

# Hold space for Chapter Page
current_page_num += 1
if IS_PAPERBACK:
    # Add one so LEFT after chapter page can be blank
    current_page_num += 1

# Shuffle the answers to keep it interesting
all_items_for_answers = movies + tv_shows + books
random.shuffle(all_items_for_answers)

# Add the Answer pages
answer_pages = []
for item in all_items_for_answers:
    title = item['title']
    current_page_num += 1
    answer_page_lookup[title] = current_page_num
    answer_pdf_file = f'{temp_output_dir}//{title}-answer.pdf'
    answer_pages.append(answer_pdf_file)


def create_puzzles_and_answers(category_list: List[Dict], chapter_emoji: str) -> List[str]:
    """
    Generate and return list of Puzzle Page PDF File names
    :param category_list: That thing we loaded earlier from load_json_files_from_path
    :param chapter_emoji: Single emoji to be featured above the title
    """
    global puzzle_page_lookup
    global answer_page_lookup
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


# Create PUZZLES and ANSWER PDFs for all categories
movie_puzzles = create_puzzles_and_answers(movies, '🎬')
tv_show_puzzles = create_puzzles_and_answers(tv_shows, '📺')
book_puzzles = create_puzzles_and_answers(books, '📚')

# ASSEMBLE THE BOOK
merger = PdfMerger()

# TITLE PAGE
merger.append(PdfReader(open(title_page, 'rb')))

# Attributions + Dedication
merger.append(PdfReader(open(copyright_attributions, 'rb')))
merger.append(PdfReader(open(dedication_page, 'rb')))

# QR + INTRO
merger.append(PdfReader(open(qr_code_page, 'rb')))
merger.append(PdfReader(open(intro_page, 'rb')))

# BLANK + HOW TO PLAY
if IS_PAPERBACK:
    merger.append(PdfReader(open(blank_page, 'rb')))
merger.append(PdfReader(open(how_to_play, 'rb')))

# BLANK + TOC
if IS_PAPERBACK:
    merger.append(PdfReader(open(blank_page, 'rb')))
    merger.append(PdfReader(open(toc_paperback, 'rb')))
else:
    merger.append(PdfReader(open(toc_ebook, 'rb')))

# BLANK + MOVIES CHAPTER PAGE
if IS_PAPERBACK:
    merger.append(PdfReader(open(blank_page, 'rb')))
merger.append(PdfReader(open(movies_page, 'rb')))
if IS_PAPERBACK:
    merger.append(PdfReader(open(blank_page, 'rb')))

cur_page = 0

for puzzle_page in movie_puzzles:
    merger.append(PdfReader(open(puzzle_page, 'rb')))
    cur_page += 1

# Add a blank page to pad out to RIGHT if needed
if IS_PAPERBACK and is_left_page(cur_page):
    merger.append(PdfReader(open(blank_page, 'rb')))  # RIGHT
    cur_page += 1

# BLANK + TV SHOWS CHAPTER PAGE
if IS_PAPERBACK:
    merger.append(PdfReader(open(blank_page, 'rb')))  # LEFT
    cur_page += 1
merger.append(PdfReader(open(tv_shows_page, 'rb')))  # RIGHT
if IS_PAPERBACK:
    merger.append(PdfReader(open(blank_page, 'rb')))
    cur_page += 1
cur_page += 1

for puzzle_page in tv_show_puzzles:
    merger.append(PdfReader(open(puzzle_page, 'rb')))
    cur_page += 1

# Add a blank page to pad out to RIGHT if needed
if IS_PAPERBACK and is_left_page(cur_page):
    merger.append(PdfReader(open(blank_page, 'rb')))  # RIGHT
    cur_page += 1

# BLANK + BOOKS CHAPTER PAGE
if IS_PAPERBACK:
    merger.append(PdfReader(open(blank_page, 'rb')))  # LEFT
    cur_page += 1
merger.append(PdfReader(open(books_page, 'rb')))  # RIGHT
if IS_PAPERBACK:
    merger.append(PdfReader(open(blank_page, 'rb')))
    cur_page += 1
cur_page += 1

for puzzle_page in book_puzzles:
    merger.append(PdfReader(open(puzzle_page, 'rb')))
    cur_page += 1

# Add a blank page to pad out to RIGHT if needed
if IS_PAPERBACK and is_left_page(cur_page):
    merger.append(PdfReader(open(blank_page, 'rb')))  # RIGHT
    cur_page += 1

# BLANK + ANSWERS CHAPTER PAGE
if IS_PAPERBACK:
    merger.append(PdfReader(open(blank_page, 'rb')))
    cur_page += 1
merger.append(PdfReader(open(answers_page, 'rb')))
if IS_PAPERBACK:
    merger.append(PdfReader(open(blank_page, 'rb')))
    cur_page += 1
cur_page += 1

# Add answer pages
for answer_page in answer_pages:
    merger.append(PdfReader(open(answer_page, 'rb')))

if IS_PAPERBACK:
    merger.append(PdfReader(open(blank_page, 'rb')))

# Write the merged PDF
if IS_EBOOK:
    output_name = 'generated-ebook.pdf'
else:
    output_name = 'generated-paperback.pdf'

output_path = f'{manuscript_output_dir}/{output_name}'
output = open(output_path, 'wb')
merger.write(output)
output.close()

print(f'Book created at {output_path}')
os.system(f'open {output_path}')
