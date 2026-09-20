import { tokenizer } from "./tokenizer.js";
import { generator } from "./generator.js";

export type tokensMap = Map<string, Map<string, number>>;

export enum Tokens {
  Start = "<START>",
  End = "<END>",
  Comma = "<COMMA>",
  Exclamation = "<EXCLAMATION>",
  Question = "<QUESTION>",
}

export const firstOrderChain = (tokens: Array<string>): tokensMap => {
  const wordMap: tokensMap = new Map();

  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i] === Tokens.End) continue;

    if (wordMap.has(tokens[i])) {
      const nextToken = wordMap.get(tokens[i]);
      if (nextToken) {
        if (nextToken.has(tokens[i + 1])) {
          const nextTokenCount = nextToken.get(tokens[i + 1]);
          if (nextTokenCount) nextToken.set(tokens[i + 1], nextTokenCount + 1);
        } else {
          nextToken.set(tokens[i + 1], 1);
        }
      }
    } else {
      const tempMap = new Map();
      if (tokens[i + 1]) {
        tempMap.set(tokens[i + 1], 1);
        wordMap.set(tokens[i], tempMap);
      } else {
        wordMap.set(tokens[i], tempMap);
      }
    }
  }

  return wordMap;
};

export const secondOrderChain = (tokens: Array<string>): tokensMap => {
  const wordMap: tokensMap = new Map();
  const wordPairs = [];
  let tokenPair = "";

  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i + 2]) {
      if (tokens[i] === Tokens.Start) {
        tokenPair = "<START> <START>";
      } else if (tokens[i] === Tokens.End) {
        continue;
      } else {
        tokenPair = tokens[i].concat(` ${tokens[i + 1]}`);
      }

      if (tokenPair.includes(Tokens.End)) continue;

      if (wordMap.has(tokenPair)) {
        const nextToken = wordMap.get(tokenPair);
        let nextTokenCount: number;
        if (tokenPair === "<START> <START>") {
          nextTokenCount = nextToken?.get(tokens[i + 1])!;
          if (nextToken && nextTokenCount) {
            if (nextToken.has(tokens[i + 1])) {
              nextToken.set(tokens[i + 1], nextTokenCount + 1);
            } else {
              nextToken.set(tokens[i + 1], 1);
            }
          }
        } else {
          nextTokenCount = nextToken?.get(tokens[i + 2])!;
          if (nextToken && nextTokenCount) {
            if (nextToken.has(tokens[i + 2])) {
              nextToken.set(tokens[i + 2], nextTokenCount + 1);
            } else {
              nextToken.set(tokens[i + 2], 1);
            }
          } else {
            nextToken?.set(tokens[i + 2], 1);
          }
        }
      } else {
        const tempMap = new Map();
        if (tokens[i + 2]) {
          if (tokenPair === "<START> <START>") {
            tempMap.set(tokens[i + 1], 1);
            wordMap.set(tokenPair, tempMap);
          } else {
            tempMap.set(tokens[i + 2], 1);
            wordMap.set(tokenPair, tempMap);
          }
        } else {
          wordMap.set(tokenPair, tempMap);
        }
      }
    } else {
      if (tokens[i + 1]) {
        wordPairs.push(tokens[i], tokens[i + 1]);
      } else {
        wordPairs.push(tokens[i]);
      }
    }
  }

  return wordMap;
};


export const run = (start: string | undefined = undefined) => {
  const tokens = tokenizer();
  const tokensMap = secondOrderChain(tokens);
  return generator(tokensMap, start);
};


console.log(generator(secondOrderChain(tokenizer()), "it is"))
