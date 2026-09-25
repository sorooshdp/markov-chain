import { describe, expect, test } from "vitest";
import { getContext, renderOutput } from "./generator.js";
import { Tokens } from "./markov.js";

describe("getContext", () => {
  test("returns the last N non-<END> tokens for the given order", () => {
    const tokens = ["<START>", "I", "like", "cats"];
    expect(getContext(tokens, 2)).toEqual(["like", "cats"]);
  });

  test("skips <END> tokens when building context", () => {
    const tokens = ["<START>", "I", "like", "cats", "<END>"];
    expect(getContext(tokens, 2)).toEqual(["I", "like"]);
  });

  test("returns fewer tokens than order if not enough history exists", () => {
    const tokens = ["<START>"];
    expect(getContext(tokens, 2)).toEqual(["<START>"]);
  });

  test("returns an empty array for empty input", () => {
    expect(getContext([], 2)).toEqual([]);
  });
});

describe("renderOutput", () => {
  test("renders a plain sentence ending in <END>", () => {
    const tokens = ["I", "like", "cats", Tokens.End];
    expect(renderOutput(tokens)).toBe(" I like cats. ");
  });

  test("renders a comma inline", () => {
    const tokens = ["I", "like", "cats", Tokens.Comma, "dogs", Tokens.End];
    expect(renderOutput(tokens)).toBe(" I like cats,  dogs. ");
  });

  test("stops early on a trailing exclamation mark", () => {
    const tokens = ["I", "love", "this", Tokens.Exclamation, Tokens.End];
    expect(renderOutput(tokens)).toBe(" I love this! ");
  });

  test("stops early on a trailing question mark", () => {
    const tokens = ["Is", "this", "working", Tokens.Question, Tokens.End];
    expect(renderOutput(tokens)).toBe(" Is this working? ");
  });

  test("does not early-return on a mid-sentence exclamation mark", () => {
    // Exclamation is not the second-to-last token here, so the loop
    // should continue instead of returning early.
    const tokens = ["Wow", Tokens.Exclamation, "really", Tokens.End];
    expect(renderOutput(tokens)).toBe(" Wow! really. ");
  });
});