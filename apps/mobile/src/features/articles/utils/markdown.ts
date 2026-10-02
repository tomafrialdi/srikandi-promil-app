import type { ArticleBlock } from "../types";

/** Inline markup isn't rendered yet: **bold**, _italic_ and [links](url) fall back to plain text. */
function plain(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(^|\s)_([^_]+)_(?=\s|[.,;:!?]|$)/g, "$1$2");
}

const CTA = /^:::cta\s+(.+?)\s*\|\s*(\S+)\s*$/;

/**
 * Turns the Content library's markdown into the blocks the article screen renders:
 * `## heading`, `![alt](url)` images, `- bullets` / `1. numbered`, `> quote`, `:::cta Label | srikandi://link`, paragraphs.
 */
export function markdownToBlocks(markdown: string): ArticleBlock[] {
  const blocks: ArticleBlock[] = [];
  let paragraph: string[] = [];
  let bullets: string[] = [];
  let quote: string[] = [];

  const flush = () => {
    if (paragraph.length) blocks.push({ type: "paragraph", text: plain(paragraph.join(" ")) });
    if (bullets.length) blocks.push({ type: "bullets", items: bullets });
    if (quote.length) blocks.push({ type: "quote", text: plain(quote.join(" ")) });
    paragraph = [];
    bullets = [];
    quote = [];
  };

  for (const raw of markdown.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }

    const heading = /^#{1,3}\s+(.+)$/.exec(line);
    const cta = CTA.exec(line);
    const image = /^!\[([^\]]*)\]\((\S+)\)$/.exec(line);
    const bullet = /^(?:[-*]|\d+\.)\s+(.+)$/.exec(line);
    const quoted = /^>\s?(.*)$/.exec(line);

    if (heading) {
      flush();
      blocks.push({ type: "heading", text: plain(heading[1]) });
    } else if (image) {
      flush();
      blocks.push({ type: "image", alt: image[1], url: image[2] });
    } else if (cta) {
      flush();
      // Editors wrap the label in quotes, e.g. Open “Log LH test”; keep it readable as a button.
      blocks.push({ type: "cta", label: cta[1].replace(/[“”"]/g, ""), link: cta[2] });
    } else if (bullet) {
      if (paragraph.length || quote.length) flush();
      bullets.push(plain(bullet[1]));
    } else if (quoted) {
      if (paragraph.length || bullets.length) flush();
      quote.push(quoted[1]);
    } else {
      if (bullets.length || quote.length) flush();
      paragraph.push(line);
    }
  }
  flush();
  return blocks;
}
