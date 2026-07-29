import { describe, expect, it, vi } from "vitest";
import { PortfolioManager } from "./PortfolioManager.js";

function createMockApi() {
  return {
    propertyUseListGet: vi.fn(),
    propertyUseGet: vi.fn(),
  } as unknown as ConstructorParameters<typeof PortfolioManager>[0];
}

function makeListResponse(links: unknown[]) {
  return {
    response: {
      links: { link: links },
      "@_status": "Ok",
    },
  };
}

function makeUseResponse(useType: string, name: string, floorArea: number) {
  return {
    "?xml": { "@_version": "1.0" },
    [useType]: {
      name,
      useDetails: {
        totalGrossFloorArea: { value: floorArea, "@_units": "Square Feet" },
      },
    },
  };
}

describe("PortfolioManager facade - getPropertyUseDetails", () => {
  it("returns an array of property use details", async () => {
    const api = createMockApi();
    api.propertyUseListGet.mockResolvedValue(
      makeListResponse([{ "@_id": "1" }, { "@_id": "2" }])
    );
    api.propertyUseGet
      .mockResolvedValueOnce(makeUseResponse("office", "Main Office", 5000))
      .mockResolvedValueOnce(makeUseResponse("retail", "Retail Space", 3000));

    const pm = new PortfolioManager(api as never);
    const details = await pm.getPropertyUseDetails(42);

    expect(details).toHaveLength(2);
    expect(details[0]).toEqual({
      name: "Main Office",
      useType: "office",
      totalGrossFloorArea: 5000,
    });
    expect(details[1]).toEqual({
      name: "Retail Space",
      useType: "retail",
      totalGrossFloorArea: 3000,
    });
    expect(api.propertyUseListGet).toHaveBeenCalledWith(42);
    expect(api.propertyUseGet).toHaveBeenCalledWith(1);
    expect(api.propertyUseGet).toHaveBeenCalledWith(2);
  });

  it("returns empty array when response has no links (empty response)", async () => {
    const api = createMockApi();
    api.propertyUseListGet.mockResolvedValue({
      response: { links: "", "@_status": "Ok" },
    });

    const pm = new PortfolioManager(api as never);
    const details = await pm.getPropertyUseDetails(42);

    expect(details).toEqual([]);
  });

  it("handles a single link (not an array)", async () => {
    const api = createMockApi();
    api.propertyUseListGet.mockResolvedValue(
      makeListResponse({ "@_id": "5" })
    );
    api.propertyUseGet.mockResolvedValueOnce(
      makeUseResponse("office", "Single Office", 10000)
    );

    const pm = new PortfolioManager(api as never);
    const details = await pm.getPropertyUseDetails(42);

    expect(details).toHaveLength(1);
    expect(details[0].useType).toBe("office");
    expect(details[0].totalGrossFloorArea).toBe(10000);
  });

  it("filters out null results when propertyUseGet returns no use type key", async () => {
    const api = createMockApi();
    api.propertyUseListGet.mockResolvedValue(
      makeListResponse([{ "@_id": "1" }, { "@_id": "2" }])
    );
    api.propertyUseGet
      .mockResolvedValueOnce(makeUseResponse("office", "Office", 5000))
      .mockResolvedValueOnce({ "?xml": { "@_version": "1.0" } }); // no use type key

    const pm = new PortfolioManager(api as never);
    const details = await pm.getPropertyUseDetails(42);

    expect(details).toHaveLength(1);
    expect(details[0].useType).toBe("office");
  });

  it("handles missing useDetails gracefully", async () => {
    const api = createMockApi();
    api.propertyUseListGet.mockResolvedValue(
      makeListResponse([{ "@_id": "1" }])
    );
    api.propertyUseGet.mockResolvedValueOnce({
      "?xml": { "@_version": "1.0" },
      office: { name: "Office" },
    });

    const pm = new PortfolioManager(api as never);
    const details = await pm.getPropertyUseDetails(42);

    expect(details).toHaveLength(1);
    expect(details[0].name).toBe("Office");
    expect(details[0].totalGrossFloorArea).toBe(0);
  });
});
