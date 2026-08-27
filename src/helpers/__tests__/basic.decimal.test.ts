import Decimal from "decimal.js";
import { decimalUpdater } from "@/helpers/basic";
import { convertDataToDecimal } from "@/helpers/common";

describe("decimalUpdater", () => {
  it("unwraps a bare Decimal to a number", () => {
    expect(decimalUpdater(new Decimal("5"))).toBe(5);
  });

  it("unwraps to a string when useString is set", () => {
    expect(decimalUpdater(new Decimal("5"), true)).toBe("5");
  });

  it("unwraps Decimal fields inside an object", () => {
    expect(decimalUpdater({ amount: new Decimal("1.5"), label: "x" })).toEqual({
      amount: 1.5,
      label: "x",
    });
  });

  it("unwraps Decimal fields as strings when requested", () => {
    expect(decimalUpdater({ amount: new Decimal("1.5") }, true)).toEqual({
      amount: "1.5",
    });
  });

  it("unwraps Decimals inside arrays", () => {
    expect(decimalUpdater([new Decimal("1"), new Decimal("2")])).toEqual([
      1, 2,
    ]);
  });

  it("unwraps nested Decimals", () => {
    expect(decimalUpdater({ outer: { inner: new Decimal("3") } })).toEqual({
      outer: { inner: 3 },
    });
  });

  it("leaves plain values untouched", () => {
    expect(decimalUpdater({ a: 1, b: "s" })).toEqual({ a: 1, b: "s" });
    expect(decimalUpdater(42)).toBe(42);
    expect(decimalUpdater("foo")).toBe("foo");
    expect(decimalUpdater(null)).toBeNull();
  });
});

describe("convertDataToDecimal <-> decimalUpdater round-trip", () => {
  it("returns numeric values unchanged after a full round-trip", () => {
    const original = { amount: 1000, fee: 12.5, label: "trade" };
    const asDecimal = convertDataToDecimal({ ...original });
    expect(decimalUpdater(asDecimal)).toEqual(original);
  });
});
