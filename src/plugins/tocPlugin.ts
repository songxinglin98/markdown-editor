/**
 * Milkdown TOC Plugin
 * Renders [TOC] as a clickable table of contents
 */

import { $prose } from "@milkdown/kit/utils";
import { Plugin, PluginKey } from "@milkdown/kit/prose/state";
import { Decoration, DecorationSet } from "@milkdown/kit/prose/view";

export const tocPluginKey = new PluginKey("TOC_PLUGIN");

interface Heading {
  level: number;
  text: string;
  pos: number;
}

/**
 * Extract all headings from the document
 */
function extractHeadings(doc: any): Heading[] {
  const headings: Heading[] = [];

  doc.descendants((node: any, pos: number) => {
    if (node.type.name === "heading") {
      const level = node.attrs.level || 1;
      const text = node.textContent;
      if (text.trim()) {
        headings.push({ level, text, pos });
      }
    }
  });

  return headings;
}

/**
 * Find all [TOC] positions in the document
 */
function findTocPositions(doc: any): { from: number; to: number }[] {
  const positions: { from: number; to: number }[] = [];

  doc.descendants((node: any, pos: number) => {
    if (node.type.name === "paragraph" && node.childCount === 1) {
      const textNode = node.firstChild;
      if (textNode && textNode.isText) {
        const text = textNode.text?.trim();
        if (text === "[TOC]" || text === "[toc]") {
          positions.push({ from: pos, to: pos + node.nodeSize });
        }
      }
    }
  });

  return positions;
}

/**
 * Generate TOC HTML
 */
function generateTocHtml(headings: Heading[]): string {
  if (headings.length === 0) {
    return `<div class="toc-widget toc-empty">
      <div class="toc-title">目录</div>
      <div class="toc-empty-text">暂无标题</div>
    </div>`;
  }

  // Find the minimum heading level to normalize indentation
  const minLevel = Math.min(...headings.map((h) => h.level));

  const items = headings
    .map((h) => {
      const indent = h.level - minLevel;
      const slug = h.text
        .toLowerCase()
        .replace(/[^\w\s\u4e00-\u9fff-]/g, "")
        .replace(/\s+/g, "-");
      return `<div class="toc-item toc-level-${indent}" data-heading="${encodeURIComponent(h.text)}">
        <a href="#${slug}">${escapeHtml(h.text)}</a>
      </div>`;
    })
    .join("");

  return `<div class="toc-widget">
    <div class="toc-title">目录</div>
    <div class="toc-list">${items}</div>
  </div>`;
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Create the TOC plugin
 */
export const tocPlugin = $prose(() => {
  return new Plugin({
    key: tocPluginKey,
    props: {
      decorations(state) {
        const { doc } = state;
        const tocPositions = findTocPositions(doc);

        if (tocPositions.length === 0) {
          return DecorationSet.empty;
        }

        const headings = extractHeadings(doc);
        const decorations: Decoration[] = [];

        tocPositions.forEach(({ from, to }) => {
          const tocHtml = generateTocHtml(headings);

          // Create a widget decoration to replace the [TOC] paragraph
          const widget = Decoration.widget(from, () => {
            const container = document.createElement("div");
            container.className = "toc-container";
            container.innerHTML = tocHtml;

            // Add click handlers for navigation
            container.querySelectorAll(".toc-item").forEach((item) => {
              item.addEventListener("click", (e) => {
                e.preventDefault();
                const headingText = decodeURIComponent(
                  (item as HTMLElement).dataset.heading || "",
                );

                // Find and scroll to the heading
                const editorEl = document.querySelector(
                  ".milkdown-editor-wrapper",
                );
                if (!editorEl) return;

                const headingEls = editorEl.querySelectorAll(
                  "h1, h2, h3, h4, h5, h6",
                );
                for (const heading of headingEls) {
                  if (heading.textContent?.trim() === headingText) {
                    heading.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                    break;
                  }
                }
              });
            });

            return container;
          });

          decorations.push(widget);

          // Hide the original [TOC] text
          const hideDecoration = Decoration.node(from, to, {
            class: "toc-original-hidden",
          });
          decorations.push(hideDecoration);
        });

        return DecorationSet.create(doc, decorations);
      },
    },
  });
});
