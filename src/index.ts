import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

type tokensMap = Map<string, Map<string, number>>;

enum Tokens {
  Start = "<START>",
  End = "<END>",
  Comma = "<COMMA>",
  Exclamation = "<EXCLAMATION>",
  Question = "<QUESTION",
}

const tokenizer = (): Array<string> => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const filePath = path.join(__dirname, "../datasets/test.txt");
  const text = readFileSync(filePath, "utf-8");
  let tokens: Array<string> = [];

  for (const line of text.split("\r\n")) {
    tokens.push(Tokens.Start);
    for (const word of line.split(" ")) {
      if (word === "") {
        continue;
      } else if (word.endsWith(".")) {
        tokens.push(word.slice(0, word.length - 1), Tokens.End);
      } else if (word.endsWith(",")) {
        tokens.push(word.slice(0, word.length - 1), Tokens.Comma);
      } else if (word.endsWith("!")) {
        tokens.push(word.slice(0, word.length - 1), Tokens.Exclamation);
      } else if (word.endsWith("?")) {
        tokens.push(word.slice(0, word.length - 1), Tokens.Question);
      } else {
        tokens.push(word);
      }
    }
  }

  return tokens;
};

const firstOrderChain = (tokens: Array<string>): tokensMap => {
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

const secondOrderChain = (tokens: Array<string>): tokensMap => {
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

      // console.log("token pair: " + tokenPair);
      // if (tokenPair === "<START> <START>") {
      //   console.log("next token of pair: " + tokens[i + 1]);
      // } else {
      //   console.log("next token of pair: " + tokens[i + 2]);
      // }

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

const generator = (words: tokensMap, start: string = "<START> <START>"): string => {
  if (start === "" || start === undefined) {
    throw new Error("Start can't be empty!");
  }
  const startTokens: Array<string> = start.split(" ");
  if (startTokens.length < 2) {
    throw new Error("Give an starting sentence with more than two words!");
  }

  let lastTwoTokens = startTokens.slice(-2);

  const probablityArr: Array<string> = [];
  let nextCount = 0;
  let out: Array<string> = lastTwoTokens;
  let steps = 0;

  while (lastTwoTokens[lastTwoTokens.length - 1] !== Tokens.End) {
    steps++;

    if (steps > 100) {
      console.log("Probably stuck!");
      console.log("Current state:", lastTwoTokens);
      return out.join(" ");
    }
    const nextTokens = words.get(lastTwoTokens.join(" "));
    if (nextTokens) {
      nextTokens.forEach((v, k) => {
        nextCount += v;

        for (let i = 0; i < v; i++) {
          probablityArr.push(k);
        }
      });
    } else {
      return out.join(" ");
    }

    const nextWord = probablityArr[Math.floor(Math.random() * nextCount)];
    if (nextWord === Tokens.End) return out.join(" ");
    console.log({
      lastTwoTokens,
      nextTokens,
      nextCount,
      nextWord,
    });
    out.push(nextWord);
    probablityArr.splice(0, probablityArr.length);
    nextCount = 0;
    lastTwoTokens = out.slice(-2);
  }

  return out.join(" ");
};

const map = generator(secondOrderChain(tokenizer()), "it has");

console.log(map);

// console.dir(secondOrderChain(tokenizer()), { maxArrayLength: null });
