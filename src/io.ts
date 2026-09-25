import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import type { MarkovModel, JsonModel } from "./model.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

type ModelsIndex = string[];

export const readFile = (datasetName: string): string => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const filePath = path.join(__dirname, `../datasets/${datasetName}`);
  return readFileSync(filePath, "utf-8");
};

export const saveModel = (model: MarkovModel, modelName: string): void => {
  mkdirSync("models", { recursive: true });
  const fileName = `${modelName}-${model.order}.json`;

  const jsonModel = {
    order: model.order,
    chain: Object.fromEntries([...model.chain].map(([k, v]) => [k, Object.fromEntries(v)])),
  };
  const json = JSON.stringify(jsonModel, null, 2);
  writeFileSync(path.join("models", `${fileName}`), json, "utf-8"); // save main model

  const indexPath = path.join("models", "index.json");
  let models: ModelsIndex = [];

  if (existsSync(indexPath)) {
    const indexJson = readFileSync(indexPath, "utf-8");
    models = JSON.parse(indexJson) as ModelsIndex;
  }

  if (!models.includes(fileName)) {
    models.push(fileName);
  }

  writeFileSync(indexPath, JSON.stringify(models, null, 2), "utf-8"); //update the index of models
};

export const loadModel = (modelName: string): MarkovModel => {
  try {
    const text = readFileSync(path.join("models", `${modelName}.json`), "utf-8");
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
