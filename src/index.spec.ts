import { afterEach, describe, expect, it, vi } from "vitest";

describe("src index entrypoint", () => {
  const originalArgv = [...process.argv];

  afterEach(() => {
    process.argv = [...originalArgv];
    vi.resetModules();
  });

  it("runs cli parse when argv[1] matches portfolio-manager pattern", async () => {
    const parseSpy = vi.fn();

    vi.doMock("./cli/PortfolioManagerCommand.js", () => ({
      PortfolioManagerCommand: class {
        parse = parseSpy;
      },
    }));

    process.argv = [
      "node",
      "/usr/local/bin/portfolio-manager",
      "property",
      "list",
    ];

    await import("./index.js");

    expect(parseSpy).toHaveBeenCalledWith(process.argv);
  });

  it("runs cli parse when argv[1] ends with index.js", async () => {
    const parseSpy = vi.fn();

    vi.doMock("./cli/PortfolioManagerCommand.js", () => ({
      PortfolioManagerCommand: class {
        parse = parseSpy;
      },
    }));

    process.argv = [
      "node",
      "/repo/packages/sdk/src/index.js",
    ];

    await import("./index.js");

    expect(parseSpy).toHaveBeenCalledWith(process.argv);
  });

  it("does not run parse when argv[1] does not match", async () => {
    const parseSpy = vi.fn();

    vi.doMock("./cli/PortfolioManagerCommand.js", () => ({
      PortfolioManagerCommand: class {
        parse = parseSpy;
      },
    }));

    process.argv = ["node", "/some/other/tool"];

    await import("./index.js");

    expect(parseSpy).not.toHaveBeenCalled();
  });
});
