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

function speakCurrentMessage() {
  if (!("speechSynthesis" in window)) {
    sequenceEl.textContent = "Speech synthesis is not supported in this browser.";
    return;
  }

  if (gestureBuffer.length === 0) {
    sequenceEl.textContent = "Add a gesture before speaking.";
    return;
  }

  const text = getCommunicationOutput(gestureBuffer);
  const synth = window.speechSynthesis;

  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.95;
  utterance.pitch = 1;
  utterance.volume = 1;

  utterance.onstart = () => {
    speakButton.textContent = "🔊 SPEAKING…";
  };

  utterance.onend = () => {
    speakButton.textContent = "🔊 SPEAK";
  };

  utterance.onerror = event => {
    speakButton.textContent = "🔊 SPEAK";
    sequenceEl.textContent = `Speech error: ${event.error || "unknown error"}`;
  };

  // Some browsers populate their voice list asynchronously.
  const voices = synth.getVoices();
  const englishVoice = voices.find(voice => voice.lang?.toLowerCase().startsWith("en"));

  if (englishVoice) {
    utterance.voice = englishVoice;
  }

  synth.speak(utterance);

  // Work around a known browser speech-synthesis pause issue.
  window.setTimeout(() => {
    if (synth.paused) {
      synth.resume();
    }
  }, 100);
}

document.querySelectorAll("[data-gesture]").forEach(button => {
  button.addEventListener("click", () => {
    addGesture(button.dataset.gesture);
  });
});

clearButton.addEventListener("click", clearBuffer);
speakButton.addEventListener("click", speakCurrentMessage);

render();