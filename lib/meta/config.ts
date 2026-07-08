export function isMetaGraphConfigured(): boolean {
  return Boolean(process.env.META_GRAPH_API_ACCESS_TOKEN?.trim())
}
