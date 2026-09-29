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
  if (order < 1) {
    throw new Error("Order must be bigger than zero!");
  }
  const chain: MarkovChain = new Map();

  for (let i = 0; i < tokens.length; i++) {
    if (i + order < tokens.length) {
      const entry = tokens.slice(i, i + order).join(" ");
      const nextToken: string = tokens[i + order]!;
      if (chain.has(entry)) {
        const currEntry = chain.get(entry);

        if (currEntry?.has(nextToken)) {
          const nextTokenCount = currEntry.get(nextToken)!;
          currEntry.set(nextToken, nextTokenCount + 1);
        } else {
          currEntry?.set(nextToken, 1);
        }
      } else {
        const tempMap = new Map([[nextToken, 1]]);
        chain.set(entry, tempMap);
      }
    } else {
      return chain;
    }
  }

  return chain;
};
