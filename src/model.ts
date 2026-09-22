import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { MarkovChain, createMarkovChain } from "./markov.js";
import { tokenizer } from "./tokenizer.js";
import path from "node:path";

type JsonModel = {
  order: number;
  chain: Record<string, Record<string, number>>;
};

export type MarkovModel = {
  order: number;
  chain: MarkovChain;
};

export const train = (datasetName: string, order: number, modelName: string): void => {
  const tokens = tokenizer(undefined, datasetName);
  let model: MarkovModel;
  model = {
    order,
    chain: createMarkovChain(tokens, order),
  };
  console.log("saving the model");
  saveModel(model, modelName, order);
  console.log(`Model saved in "models\\${modelName}-${order}.json`);
};

const saveModel = (model: MarkovModel, modelName: string, order: number): void => {
  mkdirSync("models", { recursive: true });
  const jsonModel = {
    order: model.order,
    chain: Object.fromEntries([...model.chain].map(([k, v]) => [k, Object.fromEntries(v)])),
  };
  const json = JSON.stringify(jsonModel, null, 2);
  writeFileSync(path.join("models", `${modelName}-${order}.json`), json, "utf-8");
};

export const loadModel = (modelName: string): MarkovModel => {
  const text = readFileSync(path.join("models", `${modelName}.json`), "utf-8");
  const object = JSON.parse(text) as JsonModel;
  const chain = new Map(
    Object.entries(object.chain).map(([key, nextTokens]) => [key, new Map(Object.entries(nextTokens))]),
  );

  return {
    order: object.order,
    chain,
  };
};
