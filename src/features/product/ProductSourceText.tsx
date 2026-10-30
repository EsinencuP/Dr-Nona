import type { ProductSourceBlock } from "../../data";

export function ProductSourceText({ blocks, text }: { blocks?: ProductSourceBlock[]; text: string }) {
  if (!blocks?.length) return text.split(/\n\s*\n/u).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>);
  return blocks.map((block, index) => {
    if (block.type === "list") {
      const List = block.ordered ? "ol" : "ul";
      return <List key={index} data-source-block="list">{block.items.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}</List>;
    }
    return block.type === "heading" || (block.text.endsWith(":") && block.text.length < 140)
      ? <h3 key={index} data-source-block="heading">{block.text}</h3>
      : <p key={index} data-source-block="paragraph">{block.text}</p>;
  });
}
