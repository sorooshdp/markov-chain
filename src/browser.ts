import { run } from "./markov.js";

const form = document.getElementById("markov-form") as HTMLFormElement;
const input = document.getElementById("user-input") as HTMLTextAreaElement;
const output = document.getElementById("output") as HTMLDivElement;

form.addEventListener("submit", (event) => {
    event.preventDefault();
    console.log(input.value);

    output.textContent = run(input.value);
});