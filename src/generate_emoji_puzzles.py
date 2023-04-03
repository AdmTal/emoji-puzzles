from datetime import datetime
from random import uniform
import csv
import json
import os
import time

import openai

from prompts import EMOJI_PUZZLE_PROMPT
from slugify import slugify

openai.organization = os.getenv("OPENAI_API_ORG")
openai.api_key = os.getenv("OPENAI_API_KEY")


def get_completion(messages):
    return openai.ChatCompletion.create(
        model="gpt-4",
        messages=messages
    )


def get_content_title_message(title_type, title):
    return {
        "role": "user",
        "content": f'{title_type}: {title}'
    }


def get_system_message(p):
    return {
        "role": "system",
        "content": p,
    }


def write_json_to_file(json_string, file_path):
    try:
        json_data = json.loads(json_string)

        # Create directories if they don't exist
        os.makedirs(os.path.dirname(file_path), exist_ok=True)

        with open(file_path, 'w+', encoding='utf-8') as file:
            json.dump(json_data, file, ensure_ascii=False, indent=4)
        print(f"JSON data successfully written to {file_path}")
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON string: {e}")
    except IOError as e:
        print(f"Error writing to file: {e}")


def get_json_for_title_with_backoff(prompt, _type, title, max_retries=5, initial_delay=1, factor=2):
    retries = 0
    delay = initial_delay

    print(f'Generating emoji puzzle JSON with GPT4: {_type}: {title}')

    while retries <= max_retries:
        try:
            completion = get_completion(
                [
                    get_system_message(prompt),
                    get_content_title_message(_type, title)
                ]
            )
            return completion.choices[0].message.content
        except openai.error.RateLimitError:
            if retries == max_retries:
                print(f'\tNot working :(, try again later')
                raise Exception("Max retries reached, aborting.")
            print(f'\tgot rate limited, trying again...')
            jitter = uniform(0.5, 1.5)
            sleep_time = delay * jitter
            time.sleep(sleep_time)
            delay *= factor
            retries += 1


def load_puzzle_data_from_dir(filename):
    with open(filename, 'r') as f:
        reader = csv.DictReader(f)
        return [row for row in reader]


def generate_handy_time_based_folder_name():
    current_time = datetime.now()
    folder_name = current_time.strftime("%Y-%m-%d-%I-%M-%p")
    return folder_name


def main():
    iteration_id = generate_handy_time_based_folder_name()
    output_dir = f'output/generated_puzzles/{iteration_id}'
    input_dir = 'inputs'

    for movie in load_puzzle_data_from_dir(f'{input_dir}/movies.csv'):
        title = movie['title']
        json_output = get_json_for_title_with_backoff(EMOJI_PUZZLE_PROMPT, 'MOVIE', title)
        write_json_to_file(json_output, f'{output_dir}/movies/{slugify(title)}.json')

    for tv_show in load_puzzle_data_from_dir(f'{input_dir}/tv_shows.csv'):
        title = tv_show['title']
        json_output = get_json_for_title_with_backoff(EMOJI_PUZZLE_PROMPT, 'TV SHOW', title)
        write_json_to_file(json_output, f'./{output_dir}/tv_shows/{slugify(title)}.json')

    for book in load_puzzle_data_from_dir(f'{input_dir}/books.csv'):
        title = book['title']
        json_output = get_json_for_title_with_backoff(EMOJI_PUZZLE_PROMPT, 'BOOK', title)
        write_json_to_file(json_output, f'{output_dir}/books/{slugify(title)}.json')

    print('Done!')


if __name__ == '__main__':
    main()
