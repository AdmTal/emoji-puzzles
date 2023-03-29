# Emoji Puzzles

The code behind the book

### Setup & Install Dependancies

```commandline
python3 -m virtualenv venv
source venv/bin/activate
pip install -r requirements.txt
```

This repo has [emoji-data](https://github.com/iamcal/emoji-data) installed as a submodule.

You will need to download that in order to be able to generate emoji puzzle books.

This downloads ~4GB of emoji files, so it might take a little while.

```commandline
git submodule update --init
```

### Generating Puzzles with GPT4

You'll need access to OpenAIs REST API to generate puzzles.

Sign up for an account at https://openai.com/.

Follow [their documentation](https://platform.openai.com/docs/api-reference) to provision your own API credentials.

Heads up, OpenAI charges for API usage, so make sure you go to your [Settings](https://platform.openai.com/account/usage) to keep tabs on how much you are spending.  I recommend you set up a **hard limit** under [billing settings](https://platform.openai.com/account/billing/limits) to avoid any surprises.

Save your API credentials into OS Environment Variables, and run the [generation script](gpt_content_generation/generate_emoji_puzzles.py):

```commandline
export OPENAI_API_ORG=add-your-org-id-here
export OPENAI_API_KEY=add-your-api-secret-key-here
python gpt_content_generation/generate_emoji_puzzles.py
```

### How to change to Movies, TV Shows, and Books

Edit the files found in [the input directories](gpt_content_generation/inputs).

They are CSV files with a single column. You can add or remove titles, and rerun the above generation script.

### Generate an Emoji Puzzle Book

```commandline
python book_generation/generate_book.py --layout ebook
python book_generation/generate_book.py --layout paperback
```

The [generate_book script](book_generation/generate_book.py) uses the newest folder in the [generated puzzles directory](generated_files/puzzle_pages) unless otherwise specified.

```commandline
python book_generation/generate_book.py --layout ebook --input 2023-03-29-06-37-AM
```
