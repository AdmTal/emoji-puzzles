import argparse
import os
import random
import tempfile

from PyPDF2 import PdfReader, PdfMerger

from src.generated_content_utils import load_json_files_from_path
from src.generate_pages import (
    make_chapter_divider_page,
    make_blank_page,
    is_left_page,
    set_ebook_version,
)
from src.generate_book_utils import (
    latest_puzzle_folder,
    sort_dicts_by_release_year,
    create_dir,
    create_puzzles_and_answers
)

parser = argparse.ArgumentParser()
parser.add_argument("--layout", required=True, choices=["ebook", "paperback"])
parser.add_argument("--input", default=None, type=str)
args = parser.parse_args()

IS_EBOOK = args.layout == "ebook"
IS_PAPERBACK = not IS_EBOOK
set_ebook_version(IS_EBOOK)

iteration_id = args.input if args.input else latest_puzzle_folder()

print(f'Generating {args.layout} from {iteration_id}')

content_source_directory = f'output/generated_puzzles/{iteration_id}'
movies = sort_dicts_by_release_year(
    load_json_files_from_path(
        f'{content_source_directory}/movies/'))

tv_shows = sort_dicts_by_release_year(
    load_json_files_from_path(
        f'{content_source_directory}/tv_shows/'))

books = sort_dicts_by_release_year(
    load_json_files_from_path(
        f'{content_source_directory}/books/'))

manuscript_output_dir = f'output/generated_manuscripts/{iteration_id}'
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
qr_code_page = 'static/qr-code.pdf'
toc_paperback = 'static/paperback-table-of-contents.pdf'
toc_ebook = 'static/ebook-table-of-contents.pdf'
how_to_play = 'static/how-to-play.pdf'

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
    # "Page 1" is the first chapter title page, but the number is invisible
    current_page_num = 1

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

# Create PUZZLES and ANSWER PDFs for all categories
common_args = [puzzle_page_lookup, answer_page_lookup, temp_output_dir]
movie_puzzles = create_puzzles_and_answers(movies, '🎬', *common_args)
tv_show_puzzles = create_puzzles_and_answers(tv_shows, '📺', *common_args)
book_puzzles = create_puzzles_and_answers(books, '📚', *common_args)

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

cur_page = 1

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
