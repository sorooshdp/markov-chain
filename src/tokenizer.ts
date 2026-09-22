import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { Tokens } from "./markov.js";

export const tokenizer = (input: string | undefined = undefined, datasetName: string = "train.txt"): Array<string> => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const tokens: Array<string> = [];
  let word: string = "";
  let text: string;

  if (input === undefined) {
    const filePath = path.join(__dirname, `../datasets/${datasetName}`);
    text = readFileSync(filePath, "utf-8");
  } else {
    text = input;
  }

  const chars = text.split("");

  for (let i = 0; i < chars.length; i++) {
    if (i === 0) {
      tokens.push(Tokens.Start);
    }
    switch (chars[i]) {
      case ".":
        if (chars[i + 1] === "\r" || chars[i + 1] === "\n") {
          tokens.push(word, Tokens.End, Tokens.Start);
          word = "";
        } else {
          word = word.concat(chars[i]);
        }
        break;

      case "!":
        if (chars[i + 1] === "\r" || chars[i + 1] === "\n") {
          tokens.push(word, Tokens.Exclamation, Tokens.End, Tokens.Start);
          word = "";
        } else {
          tokens.push(word, Tokens.Exclamation);
          word = "";
        }
        break;

      case "?":
        if (chars[i + 1] === "\r" || chars[i + 1] === "\n") {
          tokens.push(word, Tokens.Question, Tokens.End, Tokens.Start);
          word = "";
        } else {
          tokens.push(word, Tokens.Question);
          word = "";
        }
        break;

      case "'":
        word = word.concat(chars[i]);
        break;

      case ",":
        if (chars[i + 1] === "\r" || chars[i + 1] === "\n") {
          tokens.push(word, Tokens.Comma, Tokens.End, Tokens.Start);
          word = "";
        } else {
          tokens.push(word, Tokens.Comma);
          word = "";
        }
        break;

      case " ":
        if (word === "") {
          continue;
        } else {
          tokens.push(word);
          word = "";
        }
        break;

      case "":
        continue;

      case "\r":
        continue;

      case "\n":
        continue;

      default:
        word = word.concat(chars[i]);
        break;
    }
    if (i + 1 >= chars.length) {
      if (word !== "") {
        if (word.endsWith(".")) {
          tokens.push(word.slice(0, -1), Tokens.End);
        } else {
          tokens.push(word, Tokens.End);
        }
        word = "";
      } else {
        tokens.push(Tokens.End);
      }
    }
  }

  return tokens;
};
