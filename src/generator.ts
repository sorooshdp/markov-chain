import { Tokens, MarkovChain } from "./markov.js";
import { MarkovModel } from "./model.js";
import { tokenizer } from "./tokenizer.js";

const getContext = (tokens: Array<string>, order: number): Array<string> => {
  const context: Array<string> = [];
  for (let i = tokens.length - 1; i >= 0; i--) {
    if (tokens[i] !== Tokens.End) {
      context.push(tokens[i]);
    }
    if (context.length === order) return context.reverse();
  }
  return context.reverse();
};

const renderOutput = (output: Array<string>): string => {
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
    } else {
      out += ` ${token}`;
    }
  }
  return out;
};

export const generator = (model: MarkovModel, start: string): string => {
  const startTokens: Array<string> = tokenizer(start);
  if (startTokens.length < model.order) {
    throw new Error("Starting sentace should have as many tokens as the order");
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

    if (markovMap.has(context.join(" "))) {
      const nextTokens = markovMap.get(context.join(" "));
      let totalWeight: number = 0;
      let cumulativeWeight: number = 0;
      let selectedToken: string = "";

      if (!nextTokens) {
        return renderOutput(out);
      }

      for (const count of nextTokens.values()) {
        totalWeight += count;
      }

      const randomNum = Math.floor(Math.random() * totalWeight);

      for (const [k, v] of nextTokens) {
        cumulativeWeight += v;

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
