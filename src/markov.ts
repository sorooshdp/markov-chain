export type MarkovChain = Map<string, Map<string, number>>;

export enum Tokens {
  Start = "<START>",
  End = "<END>",
  Comma = "<COMMA>",
  Exclamation = "<EXCLAMATION>",
  Question = "<QUESTION>",
  Period = "<PERIOD>",
}

export const createMarkovChain = (tokens: Array<string>, order: number): MarkovChain => {
  if (!Number.isInteger(order) || order < 1) {
    throw new Error(`Order must be a positive integer, got ${order}`);
  }

  if (tokens.length < order + 1) {
    throw new Error(`Not enough tokens (${tokens.length}) to build an order-${order} chain`);
  }
  
  const chain: MarkovChain = new Map();

  for (let i = 0; i + order < tokens.length; i++) {
    const entry = tokens.slice(i, i + order).join(" ");
    const nextToken: string = tokens[i + order]!;
    if (chain.has(entry)) {
      const currEntry = chain.get(entry)!; // safe: has() returned true
      if (currEntry.has(nextToken)) {
        currEntry.set(nextToken, currEntry.get(nextToken)! + 1);
      } else {
        currEntry.set(nextToken, 1);
      }
    } else {
      const tempMap = new Map([[nextToken, 1]]);
      chain.set(entry, tempMap);
    }
  }

  return chain;
};
