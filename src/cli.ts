import { generator } from "./generator.js";
import { delModel, listModels, loadModel, readFile, saveModel } from "./io.js";
import { train } from "./model.js";

const VERSION = "1.0.0";

const EXIT_OK = 0;
const EXIT_ERROR = 1;

type Command = {
  readonly name: string;
  readonly usage: string;
  readonly description: string;
  readonly run: (args: readonly string[]) => number;
};

const cmdTrain = (args: readonly string[]) => {
  const datasetName = args[0];
  const order = args[1];

  if (datasetName === undefined || datasetName === "") {
    throw new Error("Missing <dataset name>");
  }

  if (order === undefined || order === "") {
    throw new Error("Missing <order>");
  }

  const n = Number(order);

  if (!Number.isInteger(n) || n < 1) {
    throw new Error(`Order must be a positive integer, got "${order}"`);
  }

  let text: string;

  try {
    text = readFile(datasetName);
  } catch (e) {
    throw new Error(`Failed to read dataset "${datasetName}": ${(e as Error).message}`);
  }

  const model = train(text, n);
  const modelName = datasetName.endsWith(".txt") ? datasetName.slice(0, -4) : datasetName;

  try {
    saveModel(model, modelName);
  } catch (e) {
    throw new Error(`Failed to save model "${modelName}": ${(e as Error).message}`);
  }

  console.log(`Trained "${modelName}" (order ${order}).`);
  return EXIT_OK;
};

const cmdDel = (args: readonly string[]): number => {
  const modelName = args[0];

  if (modelName === undefined || modelName === "") {
    throw new Error("Missing <model name>");
  }

  try {
    delModel(modelName);
  } catch (e) {
    throw new Error(`Failed to delete model "${modelName}": ${(e as Error).message}`);
  }

  console.log(`Deleted model "${modelName}".`);
  return EXIT_OK;
};

const cmdModels = (): number => {
  const models = listModels();
  if (models.length === 0) {
    console.log("No models available.");
    return EXIT_OK;
  }
  for (const model of models) console.log(model);
  return EXIT_OK;
};

const cmdGen = (args: readonly string[]) => {
  const modelName = args[0];
  const startingText = args.slice(1).join(" ").trim();
  if (startingText === "") {
    throw new Error("Missing <starting text");
  }
  if (modelName === undefined || modelName === "") {
    throw new Error("Missing <model name>");
  }

  let model;

  try {
    model = loadModel(modelName);
  } catch (e) {
    throw new Error(`Failed to load model "${modelName}": ${(e as Error).message}`);
  }

  let output: string;
  try {
    output = generator(model, startingText);
  } catch (e) {
    throw new Error(`Generation failed: ${(e as Error).message}`);
  }

  console.log(output);
  return EXIT_OK;
};

const COMMANDS: readonly Command[] = [
  {
    name: "train",
    usage: "train <dataset> <order>",
    description: "Train a model from a dataset in ./datasets",
    run: cmdTrain,
  },
  {
    name: "gen",
    usage: "gen <model> <starting text...>",
    description: "Generate text from a trained model",
    run: cmdGen,
  },
  {
    name: "del",
    usage: "del <model>",
    description: "Delete a trained model",
    run: cmdDel,
  },
  {
    name: "models",
    usage: "models",
    description: "List trained models",
    run: cmdModels,
  },
];

const printHelp = (stdout: (msg: string) => void): void => {
  stdout(`Markov Chain Generator v${VERSION}`);
  stdout("");
  stdout("Usage: markov <command> [options]");
  stdout("");
  stdout("Commands:");
  for (const c of COMMANDS) {
    stdout(`  ${c.usage.padEnd(34)}${c.description}`);
  }
  stdout("");
  stdout("Options:");
  stdout("  -h, --help      Show this help");
  stdout("  -v, --version   Show version");
};

const run = (argv: readonly string[] = process.argv.slice(2)) => {
  const [command, ...rest] = argv;

  if (command === undefined || command === "--help" || command === "-h") {
    printHelp(console.log);
    return EXIT_OK;
  }
  if (command === "--version" || command === "-v") {
    console.log(VERSION);
    return EXIT_OK;
  }

  const cmd = COMMANDS.find((c) => c.name === command);

  if (cmd === undefined) {
    console.error(`Unknown command: "${command}"`);
    printHelp(console.error);
    return EXIT_ERROR;
  }

  try {
    return cmd.run(rest);
  } catch (e) {
    console.error(`Error: ${(e as Error).message}`);
  }
};

process.exitCode = run();
