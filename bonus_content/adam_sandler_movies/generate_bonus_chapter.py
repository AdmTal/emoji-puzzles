import os
import random
import tempfile

from PyPDF2 import PdfReader, PdfMerger

from src.generate_book_utils import (
    create_puzzles_and_answers,
    sort_dicts_by_release_year,
    create_dir,
)
from src.generated_content_utils import load_json_files_from_path
from src.generate_pages import (
    make_chapter_divider_page,
    make_blank_page,
    set_ebook_version,
)

IS_EBOOK = True
set_ebook_version(IS_EBOOK)

puzzles_path = 'bonus_content/adam_sandler_movies/puzzles'
manuscript_output_dir = f'bonus_content/adam_sandler_movies'

adam_sandler_movies = sort_dicts_by_release_year(
    load_json_files_from_path(puzzles_path))
create_dir(manuscript_output_dir)
temp_output_dir = tempfile.mkdtemp()
create_dir(temp_output_dir)

# These pages are generated from code
movies_page = make_chapter_divider_page('Movies', '🎬', f'{temp_output_dir}/movies.pdf')
answers_page = make_chapter_divider_page('Answers', '💡', f'{temp_output_dir}/answers.pdf')

# These pages were created manually on https://www.canva.com/ and included here
title_page = 'static/adam-sandler-cover-page.pdf'
sandler_intro_page = 'static/adam-sandler-intro-page.pdf'
how_to_play = 'static/how-to-play.pdf'
intro_page = 'static/intro-page.pdf'
qr_code_page = 'static/qr-code.pdf'

# Before building the book, figure out what page each Puzzle and Answer will land on
puzzle_page_lookup = {}
answer_page_lookup = {}
puzzle_to_answer = {}

page_offset = len([
    'title',
    'sandler_intro',
    'how-to-play',
    'Movies Chapter Page',
])

# Page numbers are just actual PDF natural page numbers
current_page_num = page_offset

# Add all the Movie Puzzles
for item in adam_sandler_movies:
    title = item['title']
    current_page_num += 1
    puzzle_page_lookup[title] = current_page_num

# Shuffle the answers to keep it interesting
all_items_for_answers = adam_sandler_movies.copy()
random.shuffle(all_items_for_answers)

# Add the Answer pages
answer_pages = []
for item in all_items_for_answers:
    title = item['title']
    current_page_num += 1
    answer_page_lookup[title] = current_page_num
    answer_pdf_file = f'{temp_output_dir}/{title}-answer.pdf'
    answer_pages.append(answer_pdf_file)

# Create PUZZLES and ANSWER PDFs for all categories
common_args = [puzzle_page_lookup, answer_page_lookup, temp_output_dir]
movie_puzzles = create_puzzles_and_answers(adam_sandler_movies, '🎬', *common_args)

# ASSEMBLE THE BOOK
merger = PdfMerger()
merger.append(PdfReader(open(title_page, 'rb')))
merger.append(PdfReader(open(sandler_intro_page, 'rb')))
merger.append(PdfReader(open(how_to_play, 'rb')))
merger.append(PdfReader(open(movies_page, 'rb')))

cur_page = 1
for puzzle_page in movie_puzzles:
    merger.append(PdfReader(open(puzzle_page, 'rb')))
    cur_page += 1

# Add answer pages
for answer_page in answer_pages:
    merger.append(PdfReader(open(answer_page, 'rb')))

merger.append(PdfReader(open(intro_page, 'rb')))
merger.append(PdfReader(open(qr_code_page, 'rb')))

# Write the merged PDF
output_path = f'{manuscript_output_dir}/adam-sandler-bonus-chapter.pdf'
output = open(output_path, 'wb')
merger.write(output)
output.close()

print(f'Book created at {output_path}')
os.system(f'open {output_path}')
