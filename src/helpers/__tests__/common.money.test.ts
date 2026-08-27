import Decimal from "decimal.js";
import {
  dividCommaDecimal,
  convertFileSize,
  getNumber,
  getLocaleString,
  getFixedString,
  convertToNumber,
  decimalToNumber,
  convertDataToDecimal,
  getNickname,
  getNameId,
} from "@/helpers/common";

describe("dividCommaDecimal", () => {
  it("groups thousands and keeps up to 2 decimals", () => {
    expect(dividCommaDecimal(1234567)).toBe("1,234,567");
  });

  it("rounds to 2 decimal places", () => {
    expect(dividCommaDecimal(1234.567)).toBe("1,234.57");
  });

  it("drops trailing zeros from toFixed", () => {
    expect(dividCommaDecimal(1234.5)).toBe("1,234.5");
  });

  it("formats zero", () => {
    expect(dividCommaDecimal(0)).toBe("0");
  });
});

describe("convertFileSize", () => {
  it("reports raw bytes under 1000", () => {
    expect(convertFileSize(500)).toBe("500 bytes");
  });

  it("converts to KB", () => {
    expect(convertFileSize(2048)).toBe("2 KB");
  });

  it("converts to MB", () => {
    expect(convertFileSize(5 * 1024 ** 2)).toBe("5 MB");
  });

  // Known quirk: values in [1000, 1024) bytes match no unit
  // (>=1000 bytes fails the bytes branch, <1 KB fails the KB branch).
  it("returns undefined in the 1000-byte gap", () => {
    expect(convertFileSize(1000)).toBeUndefined();
  });
});

describe("getNumber", () => {
  it("defaults nullish to 0", () => {
    expect(getNumber(undefined)).toBe(0);
    expect(getNumber(null)).toBe(0);
  });

  it("preserves an explicit 0", () => {
    expect(getNumber(0)).toBe(0);
  });

  it("passes through a real number", () => {
    expect(getNumber(42)).toBe(42);
  });
});

describe("getLocaleString", () => {
  it("returns empty string for zero", () => {
    expect(getLocaleString(0)).toBe("");
  });

  it("returns empty string for non-numeric input", () => {
    expect(getLocaleString("abc")).toBe("");
  });

  it("formats with thousands separators", () => {
    expect(getLocaleString(1234567)).toBe("1,234,567");
  });
});

describe("getFixedString", () => {
  it("blanks zero", () => {
    expect(getFixedString(0)).toBe("");
  });

  it("returns the raw value otherwise", () => {
    expect(getFixedString(1234)).toBe(1234);
  });
});

describe("convertToNumber", () => {
  it("coerces nullish/empty to 0", () => {
    expect(convertToNumber(undefined)).toBe(0);
    expect(convertToNumber(null)).toBe(0);
    expect(convertToNumber("")).toBe(0);
  });

  it("preserves an explicit 0", () => {
    expect(convertToNumber(0)).toBe(0);
  });

  it("parses numeric strings", () => {
    expect(convertToNumber("123")).toBe(123);
  });

  it("unwraps a Decimal via toNumber()", () => {
    expect(convertToNumber(new Decimal("99.5"))).toBe(99.5);
  });
});

describe("decimalToNumber", () => {
  it("unwraps a Decimal", () => {
    expect(decimalToNumber(new Decimal("7.5"))).toBe(7.5);
  });

  it("coerces a plain numeric string", () => {
    expect(decimalToNumber("10")).toBe(10);
  });
});

describe("convertDataToDecimal", () => {
  it("converts numeric fields to Decimal and leaves others untouched", () => {
    const result = convertDataToDecimal({ amount: 1000, label: "fee" });
    expect(Decimal.isDecimal(result.amount)).toBe(true);
    expect((result.amount as Decimal).toNumber()).toBe(1000);
    expect(result.label).toBe("fee");
  });
});

describe("getNickname / getNameId", () => {
  it("splits the composite name token", () => {
    expect(getNickname("john*&*123")).toBe("john");
    expect(getNameId("john*&*123")).toBe("123");
  });

  it("falls back to the whole string when no separator is present", () => {
    expect(getNickname("plain")).toBe("plain");
    expect(getNameId("plain")).toBe("plain");
  });
});
