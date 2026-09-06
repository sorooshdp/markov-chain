import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

type tokensMap = Map<string, Map<string, number>>;

const tokenizer = (): Array<string> => {
  let tokens = [];
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const filePath = path.join(__dirname, "dataset.txt");
  const text = readFileSync(filePath, "utf-8");

  for (const line of text.split("\r\n")) {
    for (const word of line.split(" ")) {
      if (word.endsWith(".")) {
        tokens.push(word.slice(0, word.length - 1), "<END>");
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
    if (tokens[i] === "<END>") continue;

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
      tokenPair = tokens[i].concat(` ${tokens[i + 1]}`);

      if (wordMap.has(tokenPair)) {
        const nextToken = wordMap.get(tokenPair);
        const nextTokenCount = nextToken?.get(tokens[i + 2]);
        if (nextToken && nextTokenCount) {
          if (nextToken.has(tokens[i + 2])) {
            nextToken.set(tokens[i + 2], nextTokenCount + 1);
          } else {
            nextToken.set(tokens[i + 2], 1);
          }
        }
      } else {
        const tempMap = new Map();
        if (tokens[i + 2]) {
          tempMap.set(tokens[i + 2], 1);
          wordMap.set(tokenPair, tempMap);
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

const generator = (words: tokensMap, start: string): string => {
  if (start === "" || start === undefined) {
    throw new Error("Start can't be empty!");
  }
  const startTokens: Array<string> = start.split(" ");
  if (startTokens.length < 2) {
    throw new Error("Give an starting sentence with more than two words!");
  }

  let lastTwoTokens = startTokens.slice(-2);

  console.log("last two: " + lastTwoTokens);

  const probablityArr: Array<string> = [];
  let nextCount = 0;
  let out: Array<string> = lastTwoTokens;
  let steps = 0;

  console.log("out: " + out);

  while (lastTwoTokens[lastTwoTokens.length - 1] !== "<END>") {
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
    if (nextWord === "<END>") return out.join(" ");
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

console.dir(generator(secondOrderChain(tokenizer()), "It can"), { maxArrayLength: null });

// console.log(secondOrderChain(tokenizer()));

// console.log(generator(secondOrderChain(tokenizer()), "from the"));
