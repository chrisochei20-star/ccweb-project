import { describe, expect, it } from "vitest";
const { scoreQuiz, sanitizeQuizQuestions } = require("../db/persistenceCourses");

describe("courses quiz scoring", () => {
  it("scores partial answers", () => {
    const qs = [
      { prompt: "Q1", choices: ["a", "b"], correctIndex: 0 },
      { prompt: "Q2", choices: ["x", "y"], correctIndex: 1 },
    ];
    const { pct } = scoreQuiz(qs, { 0: 0, 1: 1 });
    expect(pct).toBe(100);
  });

  it("strips answers for clients", () => {
    const pub = sanitizeQuizQuestions([
      { prompt: "Hi", choices: ["a", "b"], correctIndex: 1 },
    ]);
    expect(pub[0].choices).toEqual(["a", "b"]);
    expect(pub[0]).not.toHaveProperty("correctIndex");
  });
});
