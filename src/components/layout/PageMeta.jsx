import { useEffect } from "react";

/**
 * Sets document.title and optionally meta description.
 * Usage: <PageMeta title="Dashboard — ContentAudit Pro" />
 */
export default function PageMeta({ title, description }) {
  useEffect(() => {
    if (title) document.title = title;

    if (description) {
      let tag = document.querySelector('meta[name="description"]');
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", "description");
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", description);
    }
  }, [title, description]);

  return null;
}