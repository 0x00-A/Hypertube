export function computePagination(pageRaw: any, limitRaw: any) {
  const page = Math.max(1, parseInt(pageRaw as string, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(limitRaw as string, 10) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
// TODO: implement robust parsing and bounds checking
export function parsePagination(query: any) {
  const page = Math.max(parseInt(query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || '10', 10), 1), 100);
  return { page, limit };
}
