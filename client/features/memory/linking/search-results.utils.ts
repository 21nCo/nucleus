/**
 * Sort the search results proritizing label search results over body search results.
 * @param a
 * @param b
 * @returns
 */
export const searchSort = (a: any, b: any) => {
  const aLabel = a.labelSearch ?? "";
  const bLabel = b.labelSearch ?? "";

  const aContainsHighlight = aLabel.includes("**");
  const bContainsHighlight = bLabel.includes("**");

  if (aContainsHighlight && !bContainsHighlight) {
    return -1;
  }
  if (!aContainsHighlight && bContainsHighlight) {
    return 1;
  }

  if (aLabel === "" && bLabel !== "") {
    return 1;
  }
  if (aLabel !== "" && bLabel === "") {
    return -1;
  }
  return aLabel.localeCompare(bLabel);
};

export const highlightSearchQuery = (items: any[], searchQuery: string) => {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return items.map((item) => {
    const aLabel = (item.label ?? "").toLowerCase();
    const aText = (item.text ?? "").toLowerCase();

    let labelSearch = undefined;
    let bodySearch = undefined;

    if (aLabel.includes(normalizedQuery)) {
      labelSearch = item.label.replace(
        new RegExp(`(${searchQuery})`, "gi"),
        "**$1**"
      );
    }

    if (aText.includes(normalizedQuery)) {
      const matchIndex = aText.indexOf(normalizedQuery);
      const preContextLength = 50;
      const postContextLength = 100;
      if (item.text.length <= preContextLength * 2 + searchQuery.length) {
        bodySearch = item.text
          .replace(/\(resource=[^)]+\)/g, "")
          .replace(/[\r\n\s]+/g, " ")
          .trim()
          .replace(new RegExp(`(${searchQuery})`, "gi"), "**$1**");
      } else {
        const startIndex = Math.max(0, matchIndex - preContextLength);
        const endIndex = Math.min(
          item.text.length,
          matchIndex + searchQuery.length + postContextLength
        );

        let truncatedText = item.text
          .slice(startIndex, endIndex)
          .replace(/\(resource=[^)]+\)/g, "")
          .replace(/[\r\n\s]+/g, " ")
          .trim();

        if (startIndex > 0) truncatedText = "..." + truncatedText;
        if (endIndex < item.text.length) truncatedText = truncatedText + "...";

        bodySearch = truncatedText.replace(
          new RegExp(`(${searchQuery})`, "gi"),
          "**$1**"
        );
      }
    }

    return {
      ...item,
      labelSearch,
      bodySearch
    };
  });
};
