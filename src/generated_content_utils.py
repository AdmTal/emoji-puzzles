import os
import json
from typing import Dict, List


def load_json_files_from_path(folder_path) -> List[Dict]:
    dictionaries = []
    for filename in os.listdir(folder_path):
        if filename.endswith('.json'):
            filepath = os.path.join(folder_path, filename)
            with open(filepath, 'r') as f:
                json_str = f.read()
                json_dict = json.loads(json_str)
                dictionaries.append(json_dict)
    return dictionaries
