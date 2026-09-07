/** Worker-shaped endpoint retained for the existing Taco integration. */
export const tacoWorker: Pick<Worker, "postMessage" | "onmessage"> = {
  postMessage: () => {},
  onmessage: null
};
