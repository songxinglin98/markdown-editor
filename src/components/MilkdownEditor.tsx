import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { rootCtx, defaultValueCtx, Editor } from "@milkdown/kit/core";
import { replaceAll, callCommand } from "@milkdown/kit/utils";
import {
  commonmark,
  toggleStrongCommand,
  toggleEmphasisCommand,
  wrapInBlockquoteCommand,
  insertHrCommand,
  toggleInlineCodeCommand,
  wrapInBulletListCommand,
  wrapInOrderedListCommand,
} from "@milkdown/kit/preset/commonmark";
import { gfm } from "@milkdown/kit/preset/gfm";
import { history } from "@milkdown/kit/plugin/history";
import { clipboard } from "@milkdown/kit/plugin/clipboard";
import { indent } from "@milkdown/kit/plugin/indent";
import { trailing } from "@milkdown/kit/plugin/trailing";
import { listener, listenerCtx } from "@milkdown/plugin-listener";
import { nord } from "@milkdown/theme-nord";
import { Milkdown, MilkdownProvider, useEditor } from "@milkdown/react";
import { tocPlugin } from "../plugins/tocPlugin";
import "@milkdown/theme-nord/style.css";

interface MilkdownEditorProps {
  content: string;
  onChange: (value: string) => void;
}

export interface MilkdownEditorHandle {
  toggleBold: () => void;
  toggleItalic: () => void;
  insertHeading: (level: number) => void;
  insertCodeBlock: () => void;
  insertInlineCode: () => void;
  insertBlockquote: () => void;
  insertHorizontalRule: () => void;
  insertBulletList: () => void;
  insertOrderedList: () => void;
  insertLink: () => void;
  scrollToHeading: (headingText: string) => void;
}

const MilkdownEditorInner = forwardRef<MilkdownEditorHandle, MilkdownEditorProps>(({
  content,
  onChange,
}, ref) => {
  const contentRef = useRef(content);
  const isInternalChange = useRef(false);

  const { get, loading } = useEditor((root) =>
    Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root);
        ctx.set(defaultValueCtx, content);
        ctx
          .get(listenerCtx)
          .markdownUpdated((_, markdown) => {
            isInternalChange.current = true;
            contentRef.current = markdown;
            onChange(markdown);
            // Reset the flag after a short delay
            setTimeout(() => {
              isInternalChange.current = false;
            }, 100);
          });
      })
      .config(nord)
      .use(commonmark)
      .use(gfm)
      .use(history)
      .use(clipboard)
      .use(indent)
      .use(trailing)
      .use(listener)
      .use(tocPlugin)
  );

  // Expose commands via ref
  useImperativeHandle(ref, () => ({
    toggleBold: () => {
      const editor = get();
      if (editor) {
        editor.action(callCommand(toggleStrongCommand.key));
      }
    },
    toggleItalic: () => {
      const editor = get();
      if (editor) {
        editor.action(callCommand(toggleEmphasisCommand.key));
      }
    },
    insertHeading: (level: number) => {
      // Milkdown doesn't have a direct heading command, insert via text
      const headingMark = "#".repeat(level) + " ";
      document.execCommand("insertText", false, headingMark);
    },
    insertCodeBlock: () => {
      document.execCommand("insertText", false, "```\n\n```");
    },
    insertInlineCode: () => {
      const editor = get();
      if (editor) {
        editor.action(callCommand(toggleInlineCodeCommand.key));
      }
    },
    insertBlockquote: () => {
      const editor = get();
      if (editor) {
        editor.action(callCommand(wrapInBlockquoteCommand.key));
      }
    },
    insertHorizontalRule: () => {
      const editor = get();
      if (editor) {
        editor.action(callCommand(insertHrCommand.key));
      }
    },
    insertBulletList: () => {
      const editor = get();
      if (editor) {
        editor.action(callCommand(wrapInBulletListCommand.key));
      }
    },
    insertOrderedList: () => {
      const editor = get();
      if (editor) {
        editor.action(callCommand(wrapInOrderedListCommand.key));
      }
    },
    insertLink: () => {
      const selection = window.getSelection();
      const text = selection?.toString() || "link text";
      document.execCommand("insertText", false, `[${text}](url)`);
    },
    scrollToHeading: (headingText: string) => {
      // Find heading elements in the editor
      const editorEl = document.querySelector(".milkdown-editor-wrapper");
      if (!editorEl) return;

      const headings = editorEl.querySelectorAll("h1, h2, h3, h4, h5, h6");
      for (const heading of headings) {
        const text = heading.textContent?.trim() || "";
        // Normalize text for comparison
        const normalizedSearch = headingText.toLowerCase().replace(/[^\w\s\u4e00-\u9fff-]/g, "").replace(/\s+/g, "-");
        const normalizedHeading = text.toLowerCase().replace(/[^\w\s\u4e00-\u9fff-]/g, "").replace(/\s+/g, "-");

        if (normalizedHeading === normalizedSearch) {
          heading.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
      }
    },
  }), [get]);

  // Update content when it changes externally (e.g., opening a new file)
  useEffect(() => {
    const editor = get();
    // Only update if:
    // 1. Editor is loaded
    // 2. Content is different from current editor content
    // 3. Change is not from the editor itself (external change like opening a file)
    if (editor && !loading && content !== contentRef.current && !isInternalChange.current) {
      try {
        editor.action(replaceAll(content));
        contentRef.current = content;
      } catch (err) {
        console.error("Failed to update editor content:", err);
      }
    }
  }, [content, get, loading]);

  return <Milkdown />;
});

MilkdownEditorInner.displayName = "MilkdownEditorInner";

const MilkdownEditor = forwardRef<MilkdownEditorHandle, MilkdownEditorProps>((props, ref) => {
  const innerRef = useRef<MilkdownEditorHandle>(null);
  const keyRef = useRef(0);
  const lastContentLengthRef = useRef(props.content.length);

  // Forward ref methods to inner component
  useImperativeHandle(ref, () => ({
    toggleBold: () => innerRef.current?.toggleBold(),
    toggleItalic: () => innerRef.current?.toggleItalic(),
    insertHeading: (level: number) => innerRef.current?.insertHeading(level),
    insertCodeBlock: () => innerRef.current?.insertCodeBlock(),
    insertInlineCode: () => innerRef.current?.insertInlineCode(),
    insertBlockquote: () => innerRef.current?.insertBlockquote(),
    insertHorizontalRule: () => innerRef.current?.insertHorizontalRule(),
    insertBulletList: () => innerRef.current?.insertBulletList(),
    insertOrderedList: () => innerRef.current?.insertOrderedList(),
    insertLink: () => innerRef.current?.insertLink(),
    scrollToHeading: (headingText: string) => innerRef.current?.scrollToHeading(headingText),
  }), []);

  // If content length changes dramatically, it's likely a new file
  useEffect(() => {
    const lengthDiff = Math.abs(props.content.length - lastContentLengthRef.current);
    if (lengthDiff > lastContentLengthRef.current * 0.5 && lengthDiff > 100) {
      keyRef.current += 1;
    }
    lastContentLengthRef.current = props.content.length;
  }, [props.content]);

  return (
    <MilkdownProvider key={keyRef.current}>
      <div className="flex-1 overflow-auto bg-white dark:bg-[#1e1e1e]">
        <div className="milkdown-editor-wrapper h-full">
          <MilkdownEditorInner ref={innerRef} {...props} />
        </div>
      </div>
    </MilkdownProvider>
  );
});

MilkdownEditor.displayName = "MilkdownEditor";

export default MilkdownEditor;
