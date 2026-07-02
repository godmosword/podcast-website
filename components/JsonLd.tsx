type JsonLdProps = {
  data: Record<string, unknown>;
};

/**
 * 將 JSON-LD 序列化為可安全內嵌於 <script> 的字串。
 * 跳脫 `<`、`>`、`&` 以避免內容含 `</script>` 時提前結束標籤（XSS 防護）。
 */
function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

/** schema.org JSON-LD，供搜尋引擎理解節目與單集 */
export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
