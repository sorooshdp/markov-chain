import { generator } from "./generator.js";
import type { MarkovModel } from "./model.js";

const form = document.getElementById("markov-form") as HTMLFormElement;
const input = document.getElementById("user-input") as HTMLInputElement;
const output = document.getElementById("output") as HTMLDivElement;
const selectModels = document.getElementById("select-model") as HTMLDivElement;
const loadedModelDiv = document.getElementById("current-model-info") as HTMLDivElement;
const entriesEl = document.getElementById("model-entries") as HTMLDivElement;
const showMoreBtn = document.getElementById("show-more") as HTMLButtonElement;
const PAGE_SIZE = 50;

let loadedModel: MarkovModel;
let currentModelIterator: IterableIterator<[string, Map<string, number>]> | null = null;

(async (): Promise<string[]> => {
  const res = await fetch("../models/index.json");

  if (!res.ok) {
    throw new Error(`Failed to load model names: ${res.status}`);
  }

  const obj = await res.json();
  const modelNamesArr: string[] = new Array(...obj);
  const frag = document.createDocumentFragment();

  for (const index in modelNamesArr) {
    const modelButton = document.createElement("button");
    modelButton.textContent = modelNamesArr[index]!;
    modelButton.className = `model-button-${index}`;
    frag.appendChild(modelButton);
  }

  selectModels.appendChild(frag);

  return modelNamesArr;
})();

const loadModelViaWorker = async (modelName: string): Promise<MarkovModel> => {
  return new Promise((resolve, reject) => {
    const workerUrl = new URL("./worker.js", import.meta.url);
    const worker = new Worker(workerUrl, { type: "module" });

    worker.onmessage = (e) => {
      if (e.data.success) {
        resolve({ order: e.data.order, chain: e.data.chain });
      } else {
        reject(new Error(e.data.error));
      }

      worker.terminate();
    };

    worker.onerror = (err) => {
      reject(err);
      worker.terminate();
    };

    const targetUrl = new URL(`models/${modelName}`, window.location.href).href;

    worker.postMessage(targetUrl);
  });
};

const renderModel = (model: MarkovModel, limit: number = 50) => {
  entriesEl.innerHTML = "";
  currentModelIterator = model.chain.entries();
  renderNextPage();
};

const renderNextPage = () => {
  if (!currentModelIterator) return;
  let count = 0;
  let result = currentModelIterator.next();

  while (!result.done && count < PAGE_SIZE) {
    const [key, nextMap] = result.value;

    const row = document.createElement("div");
    row.className = "entry-box";

    const entryKey = document.createElement("span");
    entryKey.className = "entry-key";
    entryKey.innerText = key;
    row.appendChild(entryKey);

    for (const [nextMapKey, tokenCount] of nextMap) {
      const entryVal = document.createElement("span");
      entryVal.className = "entry-val";
      entryVal.innerText = `${nextMapKey} (count:${tokenCount})`;
      row.appendChild(entryVal);
    }

    entriesEl.appendChild(row);

    count++;
    if (count < PAGE_SIZE) {
      result = currentModelIterator.next();
    }
  }

  // Hide the button if we've exhausted the Map
  if (result.done) {
    showMoreBtn.hidden = true;
  } else {
    showMoreBtn.hidden = false;
  }
};

const onModelSelectClick = async (event: PointerEvent) => {
  const target = event.target;

  if (!(target instanceof HTMLButtonElement)) {
    return;
  }

  const modelName = target.textContent;

  loadedModelDiv.innerText = `Loading ${modelName}...`;
  entriesEl.innerHTML = "";
  showMoreBtn.hidden = true;

  try {
    loadedModel = await loadModelViaWorker(target.textContent!);
    renderModel(loadedModel);
    loadedModelDiv.innerText = target.textContent;
  } catch (error) {
    loadedModelDiv.innerText = "Failed to load model.";
    console.error(error);
  }
};

showMoreBtn.addEventListener("click", () => {
  renderNextPage();
});

selectModels.addEventListener("click", (e) => {
  onModelSelectClick(e);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const start = input.value;
  console.log(input.value);

  console.log("sent to generator");
  output.innerText = generator(loadedModel, start);
});
