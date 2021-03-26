export default function chunkArray<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    const chunk: T[] = array.slice(i, i + size);
    result.push(chunk);
  }
  return result;
}
