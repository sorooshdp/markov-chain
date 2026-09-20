import { Tokens, tokensMap } from "./markov.js";

export const generator = (words: tokensMap, start: string = "<START> <START>"): string => {
  if (start === "" || start === undefined) {
    throw new Error("Start can't be empty!");
  }
  const startTokens: Array<string> = start.split(" ");
  if (startTokens.length < 2) {
    throw new Error("Give an starting sentence with more than two words!");
  }

  let lastTwoTokens = startTokens.slice(-2);

  const probabilityArr: Array<string> = [];
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
          probabilityArr.push(k);
        }
      });
    } else {
      return out.join(" ");
    }

    let nextWord = probabilityArr[Math.floor(Math.random() * nextCount)];

    switch (nextWord) {
      case Tokens.Comma:
        nextWord = ","
        break;
      case Tokens.Exclamation:
        nextWord = "!"
        break;
      case Tokens.Question:
        nextWord = "?"
      case Tokens.End:
        return out.join(" ")

      default:
        break;
    }

    // console.log({
    //   lastTwoTokens,
    //   nextTokens,
    //   nextCount,
    //   nextWord,
    // });
    
    out.push(nextWord);
    probabilityArr.splice(0, probabilityArr.length);
    nextCount = 0;
    lastTwoTokens = out.slice(-2);
  }

  return out.join(" ");
};