import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

const mermaidMocks = vi.hoisted(() => ({
  initialize: vi.fn(),
  render: vi.fn(),
}));

vi.mock("mermaid", () => ({
  default: {
    initialize: mermaidMocks.initialize,
    render: mermaidMocks.render,
  },
}));

import { __resetMermaidDiagramStateForTests, renderMermaidSvg } from "./MermaidDiagram";

const DIAGRAM = "flowchart LR\n  A --> B";

describe("renderMermaidSvg", () => {
  beforeEach(() => {
    __resetMermaidDiagramStateForTests();
    mermaidMocks.initialize.mockReset();
    mermaidMocks.render.mockReset();
    mermaidMocks.render.mockResolvedValue({
      svg: '<svg data-testid="mermaid-svg"><text>ok</text></svg>',
    });
  });

  afterEach(() => {
    __resetMermaidDiagramStateForTests();
  });

  it("initializes mermaid with strict security and returns svg", async () => {
    const svg = await renderMermaidSvg(DIAGRAM, "dark");

    expect(mermaidMocks.initialize).toHaveBeenCalledWith(
      expect.objectContaining({
        startOnLoad: false,
        securityLevel: "strict",
        suppressErrorRendering: true,
        theme: "dark",
      }),
    );
    expect(svg).toContain("mermaid-svg");
  });

  it("uses the default theme for light mode", async () => {
    await renderMermaidSvg(DIAGRAM, "light");

    expect(mermaidMocks.initialize).toHaveBeenCalledWith(
      expect.objectContaining({ theme: "default" }),
    );
  });

  it("re-initializes only when the theme changes", async () => {
    await renderMermaidSvg(DIAGRAM, "light");
    await renderMermaidSvg("flowchart LR\n  C --> D", "light");
    await renderMermaidSvg(DIAGRAM, "dark");

    expect(mermaidMocks.initialize).toHaveBeenCalledTimes(2);
    expect(mermaidMocks.initialize).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ theme: "default" }),
    );
    expect(mermaidMocks.initialize).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ theme: "dark" }),
    );
  });

  it("reuses a cached diagram instead of rendering again", async () => {
    await renderMermaidSvg(DIAGRAM, "dark");
    await renderMermaidSvg(DIAGRAM, "dark");

    expect(mermaidMocks.render).toHaveBeenCalledTimes(1);
  });

  it("caches per theme so a theme switch re-renders", async () => {
    await renderMermaidSvg(DIAGRAM, "dark");
    await renderMermaidSvg(DIAGRAM, "light");

    expect(mermaidMocks.render).toHaveBeenCalledTimes(2);
  });

  it("propagates render failures so the component can fall back", async () => {
    mermaidMocks.render.mockRejectedValue(new Error("bad diagram"));

    await expect(renderMermaidSvg("not valid", "light")).rejects.toThrow("bad diagram");
  });
});
