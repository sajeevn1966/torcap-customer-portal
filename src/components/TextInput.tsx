"use client";

import { forwardRef, useRef } from "react";
import { capitalizeWords } from "@/lib/text";

type TextInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "type"> & {
  onChange?: (value: string) => void;
};

/**
 * Default free-text input for the app: capitalizes the first letter of
 * each word as the person types — "mohammed hassan" becomes "Mohammed
 * Hassan" — on both desktop typing (handled here in JS) and mobile virtual
 * keyboards (the autoCapitalize="words" attribute hints the OS keyboard to
 * do the same). Cursor position is preserved across the re-render since
 * capitalizing a letter never changes the string's length.
 *
 * Use this instead of a raw <input> for any new name / free-text field
 * (customer name, item description, remarks, etc.). Fields where
 * word-capitalization doesn't make sense — mobile numbers, emails, codes,
 * IDs — should keep using a plain <input> with the appropriate type
 * instead of this component.
 */
const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { onChange, ...props },
  forwardedRef
) {
  const localRef = useRef<HTMLInputElement | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const el = e.target;
    const cursor = el.selectionStart;
    const capitalized = capitalizeWords(el.value);
    onChange?.(capitalized);
    requestAnimationFrame(() => {
      if (cursor !== null) el.setSelectionRange(cursor, cursor);
    });
  }

  return (
    <input
      {...props}
      type="text"
      autoCapitalize="words"
      onChange={handleChange}
      ref={(node) => {
        localRef.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      }}
    />
  );
});

export default TextInput;
