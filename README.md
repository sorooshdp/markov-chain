# Markov Chain Generator

A small TypeScript project that trains Markov-chain language models from text and generates new text from a starting phrase.

## Setup

1. Place your raw text datasets (`.txt` files) into the `datasets/` directory.
2. Install dependencies and build the project:

```bash
pnpm install
pnpm build
```

## CLI

Before using the UI, you must train a model. Models are saved as JSON files in the `models/` directory.

```bash
# Train a model from a file in datasets/
node dist/cli.js train small-dataset.txt 2

# List saved models
node dist/cli.js models

# Delete a saved model
node dist/cli.js del small-dataset-2
```

## Browser

Build the project, serve the repository with a local web server, and open `index.html`. Select a trained model, enter a starting phrase, and generate text.

## Tests

```bash
pnpm test
```

The main dataset comes from [High Quality English Sentences](https://huggingface.co/datasets/agentlans/high-quality-english-sentences).