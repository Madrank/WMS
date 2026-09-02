import { api } from "../lib/api.js";

export async function downloadCsv(url: string, filename: string) {
  const { data } = await api.get(url, { responseType: "blob" });
  const blobUrl = URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(blobUrl);
}
