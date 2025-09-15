# embeddings.py
import warnings
warnings.filterwarnings("ignore", category=UserWarning, module='urllib3')

import sys
import json
from sentence_transformers import SentenceTransformer

# Load model once
model = SentenceTransformer('all-MiniLM-L6-v2')

def get_embedding(text):
    embedding = model.encode(text)
    return embedding.tolist()

if __name__ == "__main__":
    # Expect input text as a JSON string from Node
    input_text = json.loads(sys.argv[1])
    embedding = get_embedding(input_text)
    # Print JSON output so Node can parse it
    print(json.dumps(embedding))
