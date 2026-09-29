import { generator } from "./generator.js";
import type { JsonModel, MarkovModel } from "./model.js";

const form = document.getElementById("markov-form") as HTMLFormElement;
const input = document.getElementById("user-input") as HTMLInputElement;
const output = document.getElementById("output") as HTMLDivElement;
const selectModels = document.getElementById("select-model") as HTMLDivElement;
const loadedModelDiv = document.getElementById("current-model-info") as HTMLDivElement;
let loadedModel: MarkovModel;

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

const loadModelFromBrowser = async (modelName: string): Promise<MarkovModel> => {
  const res = await fetch(`../models/${modelName}`);

  if (!res.ok) {
    throw new Error(`Failed to load model: ${res.status}`);
  }

  const obj = (await res.json()) as JsonModel;

  const chain = new Map(
    Object.entries(obj.chain).map(([key, nextTokens]) => [key, new Map(Object.entries(nextTokens))]),
  );

  return {
    order: obj.order,
    chain,
  };
};

const onModelSelectClick = async (event: PointerEvent) => {
  const target = event.target;

  if (!(target instanceof HTMLButtonElement)) {
    return;
  }

  loadedModel = await loadModelFromBrowser(target.textContent!);
  loadedModelDiv.innerText = target.textContent;
};

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
