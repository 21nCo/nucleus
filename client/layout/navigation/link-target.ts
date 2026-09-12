export type NavigationLinkTarget =
  { kind: "internal"; url: string } | { kind: "external"; url: string };

/** Resolves relative app paths and rejects external links outside HTTP(S). */
export function resolveNavigationLinkTarget(
  input: string,
  origin: string
): NavigationLinkTarget | undefined {
  const isRelative =
    !input.startsWith("//") && !/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(input);
  if (isRelative) return { kind: "internal", url: input };

  try {
    const parsed = new URL(input, origin);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return;
    return { kind: "external", url: parsed.href };
  } catch {
    return;
  }
}
