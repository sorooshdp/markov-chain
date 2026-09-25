import { Tokens } from "./markov.js";

export const tokenizer = (text: string): Array<string> => {
  const tokens: Array<string> = [];
  let word: string = "";

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
      // treat EOF as an implicit sentence boundary
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