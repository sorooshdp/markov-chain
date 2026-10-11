import { Tokens, type MarkovChain } from "./markov.js";
import type { MarkovModel } from "./model.js";
import { tokenizer } from "./tokenizer.js";

export const getContext = (tokens: Array<string>, order: number): Array<string> => {
  const context: Array<string> = [];
  for (let i = tokens.length - 1; i >= 0; i--) {
    if (tokens[i] !== Tokens.End) {
      context.push(tokens[i]!);
    }
    if (context.length === order) return context.reverse();
  }
  return context.reverse();
};

export const renderOutput = (output: Array<string>): string => {
  let out: string = "";
  for (const [index, token] of output.entries()) {
    if (token === Tokens.End) {
      out += ". ";
    } else if (token === Tokens.Question) {
      out += "? ";
      if (index === output.length - 2) return out;
    } else if (token === Tokens.Comma) {
      out += ", ";
    } else if (token === Tokens.Exclamation) {
      out += "! ";
      if (index === output.length - 2) return out;
    } else if (token === Tokens.Start) {
      out += "_";
    } else {
      if (index === 0) {
        out += `${token}`;
      } else {
        out += ` ${token}`;
      }
    }
  }
  return out.trim();
};

export const generator = (
  model: MarkovModel,
  start: string,
  temperature: number = 1.0,
  rng: () => number = Math.random,
): string => {
  const startTokens: Array<string> = tokenizer(start);
  if (startTokens.length < model.order) {
    throw new Error("Starting sentence should have as many tokens as the order");
  }
  const markovMap: MarkovChain = model.chain;
  let context = getContext(startTokens, model.order);
  let steps: number = 0;
  let stepsLimit: number = 1000;
  let out: Array<string> = [...context];

  while (true) {
    steps++;
    if (steps > stepsLimit) {
      console.log("Steps limit reached!");
      return renderOutput(out);
    }

    const mapEntry = context.join(" ");
    if (markovMap.has(mapEntry)) {
      const nextTokens = markovMap.get(mapEntry)!;
      let totalWeight: number = 0;
      let cumulativeWeight: number = 0;
      let selectedToken: string = "";

      const adjustedWeights = new Map<string, number>();

      const safeTemp = Math.max(0.01, temperature);

      for (const [k, count] of nextTokens) {
        const weight = Math.pow(count, 1 / safeTemp);
        adjustedWeights.set(k, weight);
        totalWeight += count;
      }

      const randomNum = rng() * totalWeight;

      for (const [k, weight] of nextTokens) {
        cumulativeWeight += weight;

        if (randomNum < cumulativeWeight) {
          selectedToken = k;
          break;
        }
      }

      if (selectedToken === "") {
        return renderOutput(out);
      } else if (selectedToken === Tokens.End) {
        out.push(selectedToken);
        return renderOutput(out);
      } else {
        out.push(selectedToken);
        context = getContext(out, model.order);
      }
    } else {
      return renderOutput(out);
    }
  }
};
