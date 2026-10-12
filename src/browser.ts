import { generator } from "./generator.js";
import type { MarkovModel } from "./model.js";

declare const vis: any;

const form = document.getElementById("markov-form") as HTMLFormElement;
const input = document.getElementById("user-input") as HTMLInputElement;
const output = document.getElementById("output") as HTMLDivElement;
const selectModels = document.getElementById("select-model") as HTMLDivElement;
const loadedModelDiv = document.getElementById("current-model-info") as HTMLDivElement;
const entriesEl = document.getElementById("model-entries") as HTMLDivElement;
const showMoreBtn = document.getElementById("show-more") as HTMLButtonElement;
const tempInput = document.getElementById("temperature") as HTMLInputElement;
const tempDisplay = document.getElementById("temp-display") as HTMLSpanElement;
const PAGE_SIZE = 50;

let loadedModel: MarkovModel;
let currentModelIterator: IterableIterator<[string, Map<string, number>]> | null = null;

(async (): Promise<string[]> => {
  try {
    const res = await fetch("../models/index.json");

    if (!res.ok) {
      throw new Error(`Failed to load model names: ${res.status}`);
    }

    const obj = await res.json();
    const modelNamesArr: string[] = new Array(...obj);

    if (modelNamesArr.length === 0) {
      selectModels.innerHTML = `
      <div class="empty-state">
          No models found. Add text files to <code>datasets/</code> and run <br>
          <code>node dist/cli.js train &lt;filename&gt; &lt;order&gt;</code> to get started.
      </div>
    `;
    }
    const frag = document.createDocumentFragment();

    for (const index in modelNamesArr) {
      const modelButton = document.createElement("button");
      modelButton.textContent = modelNamesArr[index]!;
      modelButton.className = `model-button-${index}`;
      frag.appendChild(modelButton);
    }

    selectModels.appendChild(frag);

    return modelNamesArr;
  } catch (error) {
    selectModels.innerHTML = `
      <div class="empty-state">
        Model index not found. Train a model via CLI first.
      </div>`;
    return [];
  }
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

const renderGraph = (model: MarkovModel, maxEdges: number = 500) => {
  const container = document.getElementById("network-graph");
  if (!container) {
    console.error("Could not find #network-graph container in DOM.");
    return;
  }

  const nodes = new Map<string, any>();
  const edges: any[] = [];
  let edgeCount = 0;

  console.log(`Rendering graph... Chain size: ${model.chain.size}`);

  for (const [currentState, nextTokens] of model.chain.entries()) {
    if (edgeCount >= maxEdges) break;

    if (!nodes.has(currentState)) {
      nodes.set(currentState, { id: currentState, label: currentState, title: "state" });
    }

    for (const [nextToken, weight] of nextTokens) {
      if (edgeCount >= maxEdges) break;

      // Calculate the literal Next State based on the Markov order
      let nextState = nextToken;
      if (model.order > 1) {
        const stateTokens = currentState.split(" ");
        stateTokens.shift();
        stateTokens.push(nextToken);
        nextState = stateTokens.join(" ");
      }

      if (!nodes.has(nextState)) {
        nodes.set(nextState, { id: nextState, label: nextState });
      }

      edges.push({
        from: currentState,
        to: nextState,
        value: weight, // vis.js uses 'value' to determine edge thickness
        label: nextToken, // Show the generated token on the line
        arrows: "to",
      });

      edgeCount++;
    }
  }

  const data = {
    nodes: new vis.DataSet(Array.from(nodes.values())),
    edges: new vis.DataSet(edges),
  };

  const options = {
    nodes: {
      shape: "dot",
      size: 16,
      font: {
        color: "#e4dfd3",
        size: 14,
        background: "#22221e",
        strokeWidth: 2,
        strokeColor: "#2c2c27",
      },
      color: { border: "#d0a84f", background: "#2c2c27" },
    },
    edges: {
      font: {
        color: "#9b978b",
        size: 12,
        align: "horizontal",
        background: "#22221e",
      },
      color: { color: "#555249", highlight: "#d0a84f" },
      smooth: { type: "continuous" },
    },
    physics: {
      solver: "forceAtlas2Based",
      forceAtlas2Based: {
        gravitationalConstant: -250, // Base repulsion
        centralGravity: 0.005, // Very weak center pull so the graph can expand outward
        springLength: 250, // Much longer edges to space out the text (was 150)
        springConstant: 0.04,
        avoidOverlap: 1,
      },
      maxVelocity: 15,
      minVelocity: 1,
      timestep: 0.35,
      stabilization: {
        enabled: true,
        iterations: 250,
        updateInterval: 25,
        fit: true,
      },
    },
  };

  new vis.Network(container, data, options);
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

    const valuesContainer = document.createElement("div");
    valuesContainer.className = "entry-values collapsed";

    for (const [nextMapKey, tokenCount] of nextMap) {
      const entryVal = document.createElement("span");
      entryVal.className = "entry-val";
      entryVal.innerText = `${nextMapKey} (count:${tokenCount})`;
      valuesContainer.appendChild(entryVal);
    }

    row.appendChild(valuesContainer);

    if (nextMap.size > 4) {
      const toggleBtn = document.createElement("button");
      toggleBtn.className = "toggle-btn";
      toggleBtn.innerText = "Show all";
      toggleBtn.type = "button";
      
      toggleBtn.addEventListener("click", () => {
        valuesContainer.classList.toggle("collapsed");
        toggleBtn.innerText = valuesContainer.classList.contains("collapsed") ? "Show all" : "Show less";
      });
      
      row.appendChild(toggleBtn);
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
    renderGraph(loadedModel);
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

  if (!loadedModel) {
    output.innerText = "Please select a model first.";
    return;
  }

  const start = input.value;
  const temperature = parseFloat(tempInput.value);

  try {
    output.innerText = generator(loadedModel, start, temperature);
  } catch (error) {
    output.innerText = `Error: ${(error as Error).message}`;
  }
});

tempInput.addEventListener("input", () => {
  tempDisplay.innerText = parseFloat(tempInput.value).toFixed(1);
});
