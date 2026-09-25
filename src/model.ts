import { createMarkovChain, type MarkovChain } from "./markov.js";
import { tokenizer } from "./tokenizer.js";

export type JsonModel = {
  order: number;
  chain: Record<string, Record<string, number>>;
};

export type MarkovModel = {
  order: number;
  chain: MarkovChain;
};

export const train = (text: string, order: number): MarkovModel => {
  const tokens = tokenizer(text);

  return {
    order,
    chain: createMarkovChain(tokens, order),
  };
};
