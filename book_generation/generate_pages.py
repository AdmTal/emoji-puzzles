import os
from io import BytesIO

import emoji as emoji_lib
import emoji_data_python
from PIL import Image
from reportlab.lib.colors import HexColor
from reportlab.lib.units import inch
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Image as PlatypusImage
from reportlab.platypus import Paragraph
from reportlab.platypus import Table, TableStyle

# Replace the path with the correct path to your Arimo .ttf file
arimo_font_path = os.path.expanduser('fonts/Arimo/Arimo-VariableFont_wght.ttf')
pdfmetrics.registerFont(TTFont('Arimo', arimo_font_path))

GLOBAL_FONT = "Arimo"
SMALL_SQUARE = [7.5 * inch, 7.5 * inch]

_EBOOK_VERSION = True


def set_ebook_version(is_ebook_version):
    global _EBOOK_VERSION
    _EBOOK_VERSION = is_ebook_version


def is_left_page(page_num):
    # EVEN numbers are on RIGHT side
    return page_num % 2 != 0


def load_png_image(filename):
    try:
        img = Image.open(filename)
        img.load()
        return img
    except IOError as e:
        print(f"Error loading image: {e}")
        return None


def get_pil_image_for_emoji_char(emoji):
    file_name = emoji_data_python.char_to_unified(emoji)
    return load_png_image(f'emoji-data/img-google-136/{file_name}.png'.lower())


def concat_images(images):
    rgba_images = []
    for image in images:
        rgba_images.append(image.convert('RGBA'))
    widths, heights = zip(*(i.size for i in rgba_images))
    total_width = sum(widths)
    max_height = max(heights)
    new_image = Image.new('RGBA', (total_width, max_height), (0, 0, 0, 0))
    x_offset = 0
    for image in rgba_images:
        new_image.paste(image, (x_offset, 0), image)
        x_offset += image.size[0]
    return new_image


def create_emoji_image(emoji_puzzle):
    images = []
    for emoji in emoji_lib.emoji_list(emoji_puzzle):
        emoji_image = get_pil_image_for_emoji_char(emoji['emoji'])
        if emoji_image:
            images.append(emoji_image)
    return concat_images(images)


def make_puzzle_page(emoji_puzzle, genre_1, genre_2, release_year, pdf_file, puzzle_page_number, answer_page_number, chapter_emoji):
    c = canvas.Canvas(pdf_file, pagesize=SMALL_SQUARE)
    c.saveState()

    c.setFillColor(HexColor('#FFFFFF'))
    c.rect(0, 0, SMALL_SQUARE[0], SMALL_SQUARE[1], fill=True, stroke=False)

    c.restoreState()
    c.setFont(GLOBAL_FONT, 24)
    c.drawCentredString(
        SMALL_SQUARE[0] / 2,
        SMALL_SQUARE[1] - 1.65 * inch,
        f"{genre_1} | {genre_2} | {release_year}"
    )

    # Create emoji puzzle image
    images = []
    scale_factor = .67
    for emoji in emoji_lib.emoji_list(emoji_puzzle.strip()):
        emoji_image = get_pil_image_for_emoji_char(emoji['emoji'])
        if emoji_image:
            img_width = int(emoji_image.width * scale_factor)
            img_height = int(emoji_image.height * scale_factor)
            img_data = BytesIO()
            emoji_image.save(img_data, format="PNG")
            img_data.seek(0)
            images.append(PlatypusImage(img_data, img_width, img_height))
    total_width = sum([img.drawWidth for img in images])
    start_x = (SMALL_SQUARE[0] - total_width) / 2

    for img in images:
        img_width = img.drawWidth
        img_height = img.drawHeight
        img.drawOn(
            c,
            start_x,
            SMALL_SQUARE[1] / 2 - img_height / 2
        )
        start_x += img_width

    # Draw Chapter Emoji
    chapter_title_emoji = create_emoji_image(chapter_emoji)
    width, height = chapter_title_emoji.size
    max_width = .5 * inch
    scale_factor = max_width / width
    img_data = BytesIO()
    chapter_title_emoji.save(img_data, format="PNG")
    img_data.seek(0)
    chapter_title_img = PlatypusImage(img_data, width * scale_factor, height * scale_factor)
    chapter_title_img.drawOn(
        c,
        (SMALL_SQUARE[0] / 2) - chapter_title_img.drawWidth / 2,
        SMALL_SQUARE[1] - 1.15 * inch
    )

    # In make_page function
    # Draw answer page number
    answer_text = f"Answer on page {answer_page_number}"
    answer_x = SMALL_SQUARE[0] / 2
    answer_y = 0.6 * inch
    draw_horizontal_centered_string(c, answer_x, answer_y, answer_text, 16)

    # Draw page number corners
    if is_left_page(puzzle_page_number):
        draw_page_number_corner(c, (0, 0), puzzle_page_number)
    else:
        draw_page_number_corner(c, (SMALL_SQUARE[0] - inch, 0), puzzle_page_number)

    # Save PDF
    c.showPage()
    c.save()

    # return pdf_file, average_color_hex
    return pdf_file


def draw_horizontal_centered_string(c, x, y, text, font_size=24):
    c.setFont(GLOBAL_FONT, font_size)
    c.setFillColorRGB(0, 0, 0)
    text_width = c.stringWidth(text, GLOBAL_FONT, font_size)
    text_height = font_size

    # Save the current graphic state
    c.saveState()

    # Draw the text
    c.drawString(x - text_width / 2, y - text_height / 2, text)

    # Restore the previous graphic state
    c.restoreState()


def draw_page_number_corner(c, position, page_number):
    global _EBOOK_VERSION
    if _EBOOK_VERSION:
        return
    corner_size = 1 * inch
    c.setFillColorRGB(1, 1, 1)
    c.rect(position[0], position[1], corner_size, corner_size, fill=True, stroke=False)

    # Set the font size larger
    font_size = 16
    c.setFont(GLOBAL_FONT, font_size)
    c.setFillColorRGB(0, 0, 0)

    # Calculate the vertical and horizontal offsets to center the text
    text = str(page_number)
    text_width = c.stringWidth(text, GLOBAL_FONT, font_size)
    text_height = font_size
    horizontal_offset = (corner_size - text_width) / 2
    vertical_offset = ((corner_size - text_height) / 2) - 3.5

    # Adjust the position for left and right pages
    if is_left_page(page_number):  # Left page
        horizontal_offset += 0.15 * inch
        vertical_offset += 0.15 * inch
    else:  # Right page
        horizontal_offset -= 0.15 * inch
        vertical_offset += 0.15 * inch

    # Draw the centered text
    c.drawString(position[0] + horizontal_offset, position[1] + vertical_offset, text)


def make_answer_key_page(movie_title, emoji_clue_pairs, description, pdf_file, page_number, puzzle_page_num):
    padding = 50
    c = canvas.Canvas(pdf_file, pagesize=SMALL_SQUARE)
    c.saveState()

    # c.setFillColor(HexColor(background_color))
    c.setFillColor(HexColor('#FFFFFF'))
    c.rect(0, 0, SMALL_SQUARE[0], SMALL_SQUARE[1], fill=True, stroke=False)

    c.restoreState()
    c.setFont(GLOBAL_FONT, 24)

    # Draw movie title
    if len(movie_title) < 35:
        c.setFont(GLOBAL_FONT, 24)
    else:
        c.setFont(GLOBAL_FONT, 18)
    c.drawCentredString(SMALL_SQUARE[0] / 2, SMALL_SQUARE[1] - .75 * inch, movie_title)

    # Draw description
    desc_text = f"<font face='{GLOBAL_FONT}' size='12'>" + description + "</font>"
    desc_paragraph = Paragraph(desc_text, style=None)
    w, h = desc_paragraph.wrap(SMALL_SQUARE[0] - 2 * padding, SMALL_SQUARE[1] - 3 * inch)
    desc_paragraph.drawOn(c, padding, SMALL_SQUARE[1] - 1 * inch - h)

    # Create table with emoji images and explanations
    table_data = []
    for emoji, explanation in emoji_clue_pairs:
        emoji_image = get_pil_image_for_emoji_char(emoji)
        if emoji_image:
            img_width = int(emoji_image.width * 0.5)
            img_height = int(emoji_image.height * 0.5)
            img_data = BytesIO()
            emoji_image.save(img_data, format="PNG")
            img_data.seek(0)

            img = PlatypusImage(img_data, img_width, img_height)

            explanation_text = f"<font face='{GLOBAL_FONT}' size='12'>" + explanation + "</font>"
            explanation_paragraph = Paragraph(explanation_text, style=None)

            table_data.append([img, explanation_paragraph])

    emoji_table = Table(table_data, colWidths=[0.2 * SMALL_SQUARE[0], 0.8 * SMALL_SQUARE[0] - padding * 2])
    emoji_table.setStyle(TableStyle([
        ('FONT', (0, 0), (-1, -1), GLOBAL_FONT, 12),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),  # Center vertically for all cells
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),  # Center horizontally for the left column
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))

    # Draw table on canvas
    table_top = SMALL_SQUARE[1] + .7 * inch
    table_height = 1 + len(emoji_clue_pairs) * 0.5 * inch
    table_bottom = table_top - table_height
    w, h = emoji_table.wrapOn(c, 0, 0)
    emoji_table.drawOn(c, padding, table_bottom - h)  # subtract h to position the table correctly

    # Draw page number corners
    if is_left_page(page_number):
        draw_page_number_corner(c, (0, 0), page_number)
    else:
        draw_page_number_corner(c, (SMALL_SQUARE[0] - inch, 0), page_number)

    # Draw "Puzzle on page ###" text
    puzzle_text = f"Puzzle on page {puzzle_page_num}"
    puzzle_x = SMALL_SQUARE[0] / 2
    puzzle_y = 0.6 * inch
    draw_horizontal_centered_string(c, puzzle_x, puzzle_y, puzzle_text, 16)

    # Save PDF
    c.showPage()
    c.save()

    return pdf_file


def make_blank_page(pdf_file):
    c = canvas.Canvas(pdf_file, pagesize=SMALL_SQUARE)
    c.saveState()

    c.setFillColor(HexColor("#FFFFFF"))
    c.rect(0, 0, SMALL_SQUARE[0], SMALL_SQUARE[1], fill=True, stroke=False)

    # Save PDF
    c.showPage()
    c.save()

    return pdf_file


def make_chapter_divider_page(word, emoji, pdf_file, page_number=None):
    c = canvas.Canvas(pdf_file, pagesize=SMALL_SQUARE)
    c.saveState()

    c.setFillColor(HexColor("#FFFFFF"))
    c.rect(0, 0, SMALL_SQUARE[0], SMALL_SQUARE[1], fill=True, stroke=False)

    font_size = 56
    c.restoreState()
    c.setFont(GLOBAL_FONT, 30)

    line_height = (.7 * inch)

    # Draw word
    c.setFillColor(HexColor("#000000"))
    word_x = SMALL_SQUARE[0] / 2
    word_y = (SMALL_SQUARE[1] / 2) + line_height
    draw_horizontal_centered_string(c, word_x, word_y, word, font_size)

    # Draw emoji
    emoji_image = get_pil_image_for_emoji_char(emoji)
    if emoji_image:
        img_width = int(emoji_image.width)
        img_height = int(emoji_image.height)
        img_data = BytesIO()
        emoji_image.save(img_data, format="PNG")
        img_data.seek(0)

        img = PlatypusImage(img_data, img_width, img_height)
        emoji_x = SMALL_SQUARE[0] / 2
        emoji_y = (SMALL_SQUARE[1] / 2) - line_height
        img.drawOn(c, emoji_x - img_width / 2, emoji_y - img_height / 2)

    # Draw page number corners
    if page_number:
        if page_number:
            draw_page_number_corner(c, (0, 0), page_number)
        else:
            draw_page_number_corner(c, (SMALL_SQUARE[0] - inch, 0), page_number)

    # Save PDF
    c.showPage()
    c.save()

    return pdf_file
