import {
  LinkType,
  type ILinkTag
} from "@nucleum/datafn/link.type";

export function linkTagLabelMapper(tag: ILinkTag) {
  const label = tag.group
    ? `${tag.group}:${tag.label}`
    : tag.label || "Unknown";
  return {
    ...tag,
    label
  };
}

export function resolveLinkTypeConfig(
  linkType: LinkType,
  direction: "incoming" | "outgoing" | undefined
) {
  if (linkType === LinkType.DIRECT) {
    return {
      icon: "ph:arrows-left-right-light",
      label: "Direct link"
    };
  } else if (linkType === LinkType.MENTION) {
    if (direction === "incoming") {
      return {
        icon: "incoming",
        label: "Incoming mention"
      };
    } else if (direction === "outgoing") {
      return {
        icon: "outgoing",
        label: "Outgoing mention"
      };
    } else {
      return {
        icon: "at",
        label: "Mention"
      };
    }
  }
  return {
    icon: "link",
    label: "Link",
    description: "Link to another node"
  };
}
