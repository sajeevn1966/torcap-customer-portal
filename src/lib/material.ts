export type MaterialLabel = "Diamond" | "Gold" | "Silver" | null;

/**
 * Classifies a sold/purchased line item as Diamond, Gold, or Silver — "which
 * one only" as opposed to showing every weight column a line item happens
 * to have. Based on the real data: item.main_division holds "DIAMOND" for
 * diamond-set pieces; item.division holds "GOLD" or "SILVER" for plain
 * metal items (stone_type_id was unused/null across the sample data, so
 * main_division is the reliable diamond signal, not stone_type_id).
 */
export function classifyMaterial(item?: { mainDivision?: string | null; division?: string | null } | null): MaterialLabel {
  if (!item) return null;
  if (item.mainDivision === "DIAMOND") return "Diamond";
  if (item.division === "GOLD") return "Gold";
  if (item.division === "SILVER") return "Silver";
  return null;
}

/** Picks the one weight figure that matches the classified material. */
export function materialWeight(
  material: MaterialLabel,
  weights: { stoneWeight?: number | null; netWeight?: number | null; weight?: number | null }
): number | null {
  if (material === "Diamond") return weights.stoneWeight ?? null;
  if (material === "Gold" || material === "Silver") return weights.netWeight ?? weights.weight ?? null;
  return weights.weight ?? weights.netWeight ?? null;
}
