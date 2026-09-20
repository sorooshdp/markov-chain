import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { firstOrderChain, secondOrderChain, tokensMap } from "./markov.js";
import { tokenizer } from "./tokenizer.js";
import path from "node:path";

type JsonModel = Record<string, Record<string, number>>;

const train = (datasetName: string, order: number, modelName: string): void => {
  const tokens = tokenizer(undefined, datasetName);
  let model: tokensMap;
  if (order === 1) {
    model = firstOrderChain(tokens);
  } else if (order === 2) {
    model = secondOrderChain(tokens);
  } else {
    throw new Error(`Unsupported Markov order: ${order}`);
  }
  console.log("saving the model");
  saveModel(model, modelName, order);
  console.log(`Model saved in "models\\${modelName}-${order}.json`);
};

const saveModel = (model: tokensMap, modelName: string, order:number): void => {
  mkdirSync("models", { recursive: true });
  const json = JSON.stringify(Object.fromEntries([...model].map(([k, v]) => [k, Object.fromEntries(v)])), null, 2);
  writeFileSync(path.join("models", `${modelName}-${order}.json`), json, "utf-8");
};

const loadModel = (modelName: string): tokensMap => {
  const text = readFileSync(path.join("models", `${modelName}.json`), "utf-8");
  const object = JSON.parse(text) as JsonModel;
  const model = new Map(Object.entries(object).map(([key, nextTokens]) => [key, new Map(Object.entries(nextTokens))]));
  console.log(model);
  return model;
};

train("small-dataset.txt", 2, "test-model");

