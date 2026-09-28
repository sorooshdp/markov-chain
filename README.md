# Markov Chain Generator

A small TypeScript project that trains Markov-chain language models from text and generates new text from a starting phrase.

## Setup

```bash
pnpm install
pnpm build
```

## CLI

```bash
# Train a model from a file in datasets/
node dist/cli.js train small-dataset.txt 2

# List saved models
node dist/cli.js models

# Delete a saved model
node dist/cli.js del small-dataset-2
```

Models are saved as JSON files in `models/`.

## Browser

Build the project, serve the repository with a local web server, and open `index.html`. Select a trained model, enter a starting phrase, and generate text.

## Tests

```bash
pnpm test
```

The main dataset comes from [High Quality English Sentences](https://huggingface.co/datasets/agentlans/high-quality-english-sentences).