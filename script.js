const MAX_BUFFER_SIZE = 3;
const gestureBuffer = [];
let lastGesture = null;

const bufferEl = document.getElementById("buffer");
const sequenceEl = document.getElementById("sequence");
const eventCountEl = document.getElementById("eventCount");
const clearButton = document.getElementById("clearButton");
const speakButton = document.getElementById("speakButton");

function getCommunicationOutput(sequence) {
  const key = sequence.join("→");

  const phrases = {
    "HELLO": "Hello.",
    "YES": "Yes.",
    "STOP": "Please stop.",
    "YES→HELLO": "Hello, yes.",
    "HELLO→STOP": "Hello, please stop.",
    "YES→YES": "Yes, yes.",
    "YES→YES→YES": "Yes, yes, yes.",
    "HELLO→YES": "Hello, yes.",
    "STOP→YES": "Please stop. Yes."
  };

  return phrases[key] || sequence.map(gesture => {
    if (gesture === "HELLO") return "Hello.";
    if (gesture === "STOP") return "Please stop.";
    if (gesture === "YES") return "Yes.";
    return gesture;
  }).join(" ");
}

function addGesture(gesture) {
  // Treat repeated observations of the same held gesture as one event.
  if (gesture === lastGesture) {
    return;
  }

  lastGesture = gesture;
  gestureBuffer.push(gesture);

  if (gestureBuffer.length > MAX_BUFFER_SIZE) {
    gestureBuffer.shift();
  }

  render();
}

function clearBuffer() {
  gestureBuffer.length = 0;
  lastGesture = null;
  render();
}

function render() {
  bufferEl.innerHTML = "";

  if (gestureBuffer.length === 0) {
    bufferEl.innerHTML = '<span class="empty">[ empty ]</span>';
    sequenceEl.textContent = "Waiting for gesture events…";
  } else {
    for (const gesture of gestureBuffer) {
      const token = document.createElement("span");
      token.className = "token";
      token.textContent = gesture;
      bufferEl.appendChild(token);
    }

    sequenceEl.textContent = getCommunicationOutput(gestureBuffer);
  }

  eventCountEl.textContent =
    `${gestureBuffer.length} event${gestureBuffer.length === 1 ? "" : "s"} in buffer`;
}

document.querySelectorAll("[data-gesture]").forEach(button => {
  button.addEventListener("click", () => {
    addGesture(button.dataset.gesture);
  });
});

clearButton.addEventListener("click", clearBuffer);

speakButton.addEventListener("click", () => {
  const text = getCommunicationOutput(gestureBuffer);

  if (!("speechSynthesis" in window)) {
    sequenceEl.textContent = "Speech synthesis is not supported in this browser.";
    return;
  }

  if (gestureBuffer.length === 0) {
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.95;
  utterance.pitch = 1;

  window.speechSynthesis.speak(utterance);
});

render();