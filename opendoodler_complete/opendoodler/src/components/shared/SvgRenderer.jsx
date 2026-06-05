// Safely renders an SVG string inside a div, preserving aspect ratio.
export default function SvgRenderer({ svg, style, className }) {
  return (
    <div
      className={className}
      style={{ lineHeight: 0, ...style }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
