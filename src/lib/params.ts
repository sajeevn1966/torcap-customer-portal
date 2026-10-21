import "server-only";

export class InvalidIdError extends Error {}

/** Parses a route param (e.g. `[id]`) into a BigInt, throwing if it isn't a positive integer. */
export function parseBigIntParam(raw: string): bigint {
  if (!/^\d+$/.test(raw)) {
    throw new InvalidIdError(`"${raw}" is not a valid id.`);
  }
  return BigInt(raw);
}
