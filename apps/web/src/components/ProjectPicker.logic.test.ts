import { assert, describe, it } from "vite-plus/test";

import { filterProjectPickerOptions, type ProjectPickerOption } from "./ProjectPicker.logic";

const options: readonly ProjectPickerOption<null>[] = [
  { value: "all", label: "All projects", data: null },
  { value: "client-portal", label: "Client Portal", data: null },
  { value: "gamma-utilities", label: "Gamma Utilities", data: null },
  { value: "project-phoenix", label: "Project Phoenix", data: null },
  { value: "alpha-project", label: "Alpha Project", data: null },
];

function valuesForQuery(query: string): string[] {
  return filterProjectPickerOptions(options, query).map((option) => option.value);
}

describe("filterProjectPickerOptions", () => {
  it("returns all options in source order for an empty query", () => {
    assert.deepEqual(
      valuesForQuery("  "),
      options.map((option) => option.value),
    );
  });

  it("matches case-insensitively", () => {
    assert.deepEqual(valuesForQuery("CLIENT"), ["client-portal"]);
  });

  it("matches prefixes and substrings", () => {
    assert.deepEqual(valuesForQuery("phoenix"), ["project-phoenix"]);
    assert.deepEqual(valuesForQuery("lient"), ["client-portal"]);
  });

  it("matches a three-character fuzzy subsequence", () => {
    assert.deepEqual(valuesForQuery("gmu"), ["gamma-utilities"]);
  });

  it("does not use one-character or two-character fuzzy subsequences", () => {
    assert.deepEqual(valuesForQuery("g"), ["gamma-utilities"]);
    assert.deepEqual(valuesForQuery("cp"), []);
  });

  it("requires every token in a multi-token query to match", () => {
    assert.deepEqual(valuesForQuery("project alpha"), ["alpha-project"]);
    assert.deepEqual(valuesForQuery("project gamma"), []);
  });

  it("returns an empty list when no label matches", () => {
    assert.deepEqual(valuesForQuery("nonexistent"), []);
  });

  it("uses match scores only as a predicate and preserves source order", () => {
    assert.deepEqual(valuesForQuery("project"), ["all", "project-phoenix", "alpha-project"]);
  });

  it("applies the same visible-label matching rules to All projects", () => {
    assert.deepEqual(valuesForQuery("all"), ["all"]);
    assert.deepEqual(valuesForQuery("everything"), []);
  });
});
