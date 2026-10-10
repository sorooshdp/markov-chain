import type { JsonModel } from "./model.js";

self.onmessage = async (e: MessageEvent<string>) => {
  const targetUrl = e.data;

  try {
    const res = await fetch(targetUrl);

    if (!res.ok) {
      throw new Error(`Faild to load model: ${res.status}`);
    }

    const obj = (await res.json()) as JsonModel;

    const chain = new Map(
      Object.entries(obj.chain).map(([key, nextTokens]) => [key, new Map(Object.entries(nextTokens))]),
    );

    self.postMessage({ success: true, order: obj.order, chain });
  } catch (error) {
    self.postMessage({ success: false, error: (error as Error).message });
  }
};
