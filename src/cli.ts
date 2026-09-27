import { delModel, listModels, readFile, saveModel } from "./io.js";
import { train } from "./model.js";

const printHelp = (): void => {
  console.log(
    `Markov Chain Generator

Usage:
  markov <command> [options]

Commands:
  train       Train a model
  generate    Generate text
  models      List available models

Options:
  -h, --help      Show this help
  -v, --version   Show version`,
  );
};

const run = (): void => {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === "--help" || command === "-h") {
    printHelp();
    process.exit(0);
  } else if (command === "train") {
    const datasetName = args[1];
    const orderArg = args[2];

    if (datasetName === undefined || orderArg === undefined) {
      console.error("Usage: markov train <dataset> <order>");
      process.exit(1);
    }

    const order = parseInt(orderArg, 10);
    let text;

    if (Number.isNaN(order) || order < 1) {
      console.error("Order must be a positive number.");
      process.exit(1);
    }

    try {
      text = readFile(datasetName);
      const model = train(text, order);
      saveModel(model, `${datasetName.replace(".txt", "")}`);
      process.exit(0);
    } catch (e) {
      console.log(e);
      process.exit(1);
    }
  } else if (command === "del") {
    const modelName = args[1];

    if (modelName === undefined) {
      console.error("Usage: markov del <model>");
      process.exit(1);
    }

    delModel(modelName);
    console.log(`Deleted model "${modelName}"`);
    process.exit(0);
  } else if (command === "models") {
    const models = listModels();

    if (models.length === 0) {
      console.log("No models available.");
      process.exit(0);
    } else {
      for (const model of models) {
        console.log(model);
      }
      process.exit(0);
    }
  } else {
    console.error("Use correct arguments");
    printHelp();
    process.exit(1);
  }
};

run();
