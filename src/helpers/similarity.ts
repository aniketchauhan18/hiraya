export function cosineSimilarity(a: any, b: any) {
  const dotProduct = a.reduce(
    (sum: any, val: any, i: any) => sum + val * b[i],
    0,
  );
  const magnitudeA = Math.sqrt(
    a.reduce((sum: any, val: any) => sum + val * val, 0),
  );
  const magnitudeB = Math.sqrt(
    b.reduce((sum: any, val: any) => sum + val * val, 0),
  );
  return dotProduct / (magnitudeA * magnitudeB);
}
