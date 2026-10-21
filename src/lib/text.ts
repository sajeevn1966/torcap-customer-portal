/**
 * Capitalizes the first letter of each word — "mohammed hassan" -> "Mohammed Hassan".
 * Used by the TextInput component so every free-text field in the app
 * capitalizes as the person types, without each form having to remember to
 * do it individually. Doesn't touch letters after the first in each word,
 * so it won't fight an intentional "McDonald" or "iPhone" mid-word casing —
 * it only forces the leading letter of each word to uppercase.
 */
export function capitalizeWords(value: string): string {
  return value.replace(/(^|\s)([a-z])/g, (_, boundary, letter) => boundary + letter.toUpperCase());
}
