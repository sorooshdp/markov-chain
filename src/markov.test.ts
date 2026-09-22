import { describe, expect, test } from "vitest";
import { createMarkovChain } from "./markov.js";

describe("createMarkovChain", () => {
  test("creates a first-order chain", () => {
    const tokens = [
      "<START>",
      "I",
      "like",
      "cats",
      "<END>",
    ];

    const result = createMarkovChain(tokens, 1);

    expect(result).toEqual(
      new Map([
        ["<START>", new Map([["I", 1]])],
        ["I", new Map([["like", 1]])],
        ["like", new Map([["cats", 1]])],
        ["cats", new Map([["<END>", 1]])],
      ]),
    );
  });

  test("counts multiple transitions from the same state", () => {
    const tokens = [
      "<START>",
      "I",
      "like",
      "cats",
      "<END>",
      "<START>",
      "I",
      "like",
      "dogs",
      "<END>",
    ];

    const result = createMarkovChain(tokens, 1);

    expect(result.get("I")).toEqual(
      new Map([
        ["like", 2],
      ]),
    );

    expect(result.get("like")).toEqual(
      new Map([
        ["cats", 1],
        ["dogs", 1],
      ]),
    );
  });

  test("creates a second-order chain", () => {
    const tokens = [
      "<START>",
      "I",
      "like",
      "cats",
      "<END>",
    ];

    const result = createMarkovChain(tokens, 2);

    expect(result).toEqual(
      new Map([
        ["<START> I", new Map([["like", 1]])],
        ["I like", new Map([["cats", 1]])],
        ["like cats", new Map([["<END>", 1]])],
      ]),
    );
  });

  test("counts transitions for the same second-order state", () => {
    const tokens = [
      "<START>",
      "I",
      "like",
      "cats",
      "<END>",
      "<START>",
      "I",
      "like",
      "dogs",
      "<END>",
    ];

    const result = createMarkovChain(tokens, 2);

    expect(result.get("I like")).toEqual(
      new Map([
        ["cats", 1],
        ["dogs", 1],
      ]),
    );
  });

  test("rejects an order smaller than 1", () => {
    const tokens = ["<START>", "Hello", "<END>"];

    expect(() => createMarkovChain(tokens, 0)).toThrow(
      "Order must be bigger than zero!",
    );
  });
});