export const toBase64Json = (object: any) =>
  Buffer.from(JSON.stringify(object)).toString("base64");
