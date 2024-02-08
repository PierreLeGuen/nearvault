export const fetchJson = async <T>(url: string, options = {}): Promise<T> => {
  const response = await fetch(url, options);
  return (await response.json()) as T;
};
