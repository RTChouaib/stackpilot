export default function JsonLd({ data }: { data: unknown }) {
  // Escape "<" so content can never close the script tag early.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
