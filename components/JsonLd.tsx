type JsonLdProps = {
  data: Record<string, unknown>;
};

/** schema.org JSON-LD，供搜尋引擎理解節目與單集 */
export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
