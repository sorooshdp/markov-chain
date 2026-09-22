import { describe, expect, test } from "vitest";
import { tokenizer } from "./tokenizer.js";

describe("tokenizer", () => {
  test("tokenizes punctuation", () => {
    const res = tokenizer("Hello, world!");

    expect(res).toEqual(["<START>", "Hello", "<COMMA>", "world", "<EXCLAMATION>", "<END>"]);
  });
});

test("handles newlines", () => {
    const result = tokenizer("Hello.\nThis is another sentence.");

    expect(result).toEqual([
        "<START>",
        "Hello",
        "<END>",
        "<START>",
        "This",
        "is",
        "another",
        "sentence",
        "<END>",
    ]);
});

test("handles contractions", () => {
    const result = tokenizer("It's working. I don't know.");

    expect(result).toEqual([
        "<START>",
        "It's",
        "working",
        "<END>",
        "<START>",
        "I",
        "don't",
        "know",
        "<END>",
    ]);
});

test("doesn't produce empty tokens", () => {
    const result = tokenizer("Hello,   world!");

    expect(result).not.toContain("");
});