export type ParsedBarcode =
  | {
      type: "GS1-128";
      gtin?: string;
      lot?: string;
      expiry?: string;
      serial?: string;
    }
  | ({
      type: "QR";
    } & Record<string, unknown>)
  | {
      type: "PLAIN";
      value: string;
    };

export function parseBarcode(payload: string): ParsedBarcode {
  if (payload.startsWith("(01)")) {
    const gtin = payload.substring(4, 18);
    const lot = payload.match(/\(10\)([^\(]*)/)?.[1];
    const expiry = payload.match(/\(17\)([^\(]*)/)?.[1];
    const serial = payload.match(/\(21\)([^\(]*)/)?.[1];

    return {
      type: "GS1-128",
      gtin,
      lot,
      expiry,
      serial,
    };
  }

  try {
    const json = JSON.parse(payload);
    if (json && typeof json === "object") {
      return {
        type: "QR",
        ...json,
      };
    }
  } catch {
    // Ignore and fall through to plain text parsing
  }

  return {
    type: "PLAIN",
    value: payload,
  };
}
