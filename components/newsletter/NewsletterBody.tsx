import Icon from "@/components/ui/Icon";
import {
  parseNewsletterMarkdown,
  type NewsletterBlock,
  type NewsletterInline,
} from "@/lib/newsletter-markdown";
import styles from "./NewsletterBody.module.css";

function InlineNode({ node }: { node: NewsletterInline }) {
  switch (node.type) {
    case "text":
      return node.text;
    case "bold":
      return <strong>{node.text}</strong>;
    case "break":
      return <br />;
    case "link":
      return (
        <a href={node.href} target="_blank" rel="noopener noreferrer">
          {node.text}
        </a>
      );
    default: {
      const unreachable: never = node;
      return unreachable;
    }
  }
}

function InlineRun({
  inlines,
  breakMode,
}: {
  inlines: readonly NewsletterInline[];
  breakMode: "paragraph" | "line";
}) {
  if (breakMode === "line") {
    return inlines.map((node, index) => <InlineNode key={index} node={node} />);
  }

  const segments: NewsletterInline[][] = [[]];
  for (const node of inlines) {
    if (node.type === "break") segments.push([]);
    else segments[segments.length - 1]?.push(node);
  }

  return segments
    .filter((segment) => segment.length > 0)
    .map((segment, index) => (
      <p key={index}>
        {segment.map((node, nodeIndex) => (
          <InlineNode key={nodeIndex} node={node} />
        ))}
      </p>
    ));
}

function BlockView({ block }: { block: NewsletterBlock }) {
  switch (block.type) {
    case "heading":
      return block.level === 2 ? <h2>{block.text}</h2> : <h3>{block.text}</h3>;
    case "paragraph":
      return <InlineRun inlines={block.inlines} breakMode="paragraph" />;
    case "list": {
      const items = block.items.map((item, index) => (
        <li key={index}>
          <InlineRun inlines={item} breakMode="line" />
        </li>
      ));
      return block.ordered ? <ol>{items}</ol> : <ul>{items}</ul>;
    }
    case "callout":
      return (
        <div className={styles.callout}>
          <Icon name="timer" size={22} className={styles.calloutIcon} />
          <div>
            {block.blocks.map((child, index) => (
              <BlockView key={index} block={child} />
            ))}
          </div>
        </div>
      );
    default: {
      const unreachable: never = block;
      return unreachable;
    }
  }
}

/** 電子報內文。`<br />` 在段落裡另起一段；清單項目裡則換行。 */
export function NewsletterBody({ body }: { body: string }) {
  const blocks = parseNewsletterMarkdown(body);
  return (
    <div className={styles.rich}>
      {blocks.map((block, index) => (
        <BlockView key={index} block={block} />
      ))}
    </div>
  );
}
