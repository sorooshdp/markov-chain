import { Tokens } from "./markov.js";

const abbreviations = new Set(["Mr", "Mrs", "Ms", "Dr", "Prof", "Sr", "Jr", "St", "etc"]);

const isAbbreviation = (word: string) => {
  return abbreviations.has(word);
};

const lexer = (text: string): Array<string> => {
  const tokens: Array<string> = [];
  let token: string = "";

  for (let i = 0; i < text.length; i++) {
    const char = text[i]!;

    if (i === 0) {
      tokens.push(Tokens.Start);
    }

    switch (char) {
      case ".":
        if (token !== "") {
          tokens.push(token, Tokens.Period);
          token = "";
        }
        break;

      case "!":
        if (token !== "") {
          tokens.push(token, Tokens.Exclamation);
          token = "";
        }
        break;

      case "?":
        if (token !== "") {
          tokens.push(token, Tokens.Question);
          token = "";
        }
        break;

      case "'":
        token += "'";
        break;

      case ",":
        if (token !== "") {
          tokens.push(token, Tokens.Comma);
          token = "";
        }
        break;

      case "":
        continue;

      case " ":
        if (token !== "") {
          tokens.push(token);
          token = "";
        }
        break;

      case "\r":
      case "\t":
      case "\n":
        if (token !== "") {
          tokens.push(token);
          token = "";
        }
        break;

      default:
        token += char;
        break;
    }
  }

  return tokens;
};

const normalizer = (tokens: Array<string>): Array<string> => {
  const normalizedTokens: Array<string> = [];
  let i = 0;

  while (i < tokens.length) {
    const curr = tokens[i]!;
    const prev = tokens[i - 1];
    const next = tokens[i + 1];
    const last = normalizedTokens[normalizedTokens.length - 1];

    if (curr === Tokens.Period) {
      // 3 . 14 -> 3.14
      if (prev !== undefined && next !== undefined && /\d/.test(prev) && /\d/.test(next)) {
        normalizedTokens[normalizedTokens.length - 1] = `${last}.${next}`;
        i += 2;
        continue;
      }

      // Dr . Smith -> Dr.
      if (prev !== undefined && next !== undefined && isAbbreviation(prev)) {
        normalizedTokens[normalizedTokens.length - 1] = `${last}.`;
        i++;
        continue;
      }

      // Otherwise, this is a sentence-ending period.
      if (next !== undefined) {
        normalizedTokens.push(Tokens.End, Tokens.Start);
        i++;
        continue;
      } else {
        normalizedTokens.push(Tokens.End);
        break;
      }
    } else if (curr === Tokens.Exclamation || curr === Tokens.Question) {
      if (next !== undefined) {
        normalizedTokens.push(curr, Tokens.End, Tokens.Start);
        i++;
      } else {
        normalizedTokens.push(curr, Tokens.End);
        break;
      }
    } else {
      normalizedTokens.push(curr);
      i++;
    }
  }

  return normalizedTokens;
};

export const tokenizer = (text: string): Array<string> => {
  const tokens = lexer(text);
  return normalizer(tokens);
};