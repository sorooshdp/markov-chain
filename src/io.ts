import { writeFileSync, mkdirSync, readFileSync, existsSync, unlinkSync } from "node:fs";
import type { MarkovModel, JsonModel } from "./model.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");
const MODELS_DIR = path.join(PROJECT_ROOT, "models");
const DATASETS_DIR = path.join(PROJECT_ROOT, "datasets");
const INDEX_PATH = path.join(MODELS_DIR, "index.json");

type ModelsIndex = string[];

const normalizeName = (name: string): string => (name.endsWith(".json") ? name.slice(0, -5) : name);

export const readFile = (datasetName: string): string => {
  const filePath = path.join(DATASETS_DIR, `${datasetName}`);
  return readFileSync(filePath, "utf-8");
};

export const saveModel = (model: MarkovModel, modelName: string): void => {
  const name = normalizeName(modelName);

  mkdirSync(MODELS_DIR, { recursive: true });
  const fileName = `${name}-${model.order}.json`;

  const jsonModel = {
    order: model.order,
    chain: Object.fromEntries([...model.chain].map(([k, v]) => [k, Object.fromEntries(v)])),
  };
  const json = JSON.stringify(jsonModel, null, 2);
  writeFileSync(path.join("models", `${fileName}`), json, "utf-8"); // save main model

  let models: ModelsIndex = [];

  if (existsSync(INDEX_PATH)) {
    const indexJson = readFileSync(INDEX_PATH, "utf-8");
    models = JSON.parse(indexJson) as ModelsIndex;
  }

  if (!models.includes(fileName)) {
    models.push(fileName);
  }

  writeFileSync(INDEX_PATH, JSON.stringify(models, null, 2), "utf-8"); //update the index of models
};

export const loadModel = (modelName: string): MarkovModel => {
  const name = normalizeName(modelName);
  try {
    const text = readFileSync(path.join(MODELS_DIR, `${name}.json`), "utf-8");
    const object = JSON.parse(text) as JsonModel;
    const chain = new Map(
      Object.entries(object.chain).map(([key, nextTokens]) => [key, new Map(Object.entries(nextTokens))]),
    );

    return {
      order: object.order,
      chain,
    };
  } catch (error) {
    throw new Error(`Error while reading file: ${path.join("models", `${modelName}.json`)} ${error}`);
  }
};

export const delModel = (modelName: string): void => {
  const name = normalizeName(modelName);
  let models: ModelsIndex = [];
  try {
    if (existsSync(INDEX_PATH)) {
      const indexJson = readFileSync(INDEX_PATH, "utf-8");
      models = JSON.parse(indexJson);
      models = models.filter((model) => model !== `${name}.json`);
      writeFileSync(INDEX_PATH, JSON.stringify(models, null, 2), "utf-8");
    }
    unlinkSync(path.join(MODELS_DIR, `${name}.json`));
  } catch (e) {
    throw new Error(`Error while deleteing file: ${path.join(MODELS_DIR, `${name}.json`)} ${e}`);
  }
};

export const listModels = (): ModelsIndex => {
  try {
    if (!existsSync(INDEX_PATH)) {
      return [];
    }
    const indexJson = readFileSync(INDEX_PATH, "utf-8");
    return JSON.parse(indexJson) as ModelsIndex;
  } catch (e) {
    throw new Error(`Error while listing models: ${INDEX_PATH} ${e}`);
  }
};
