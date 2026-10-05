const MAX_BUFFER_SIZE = 3;
const gestureBuffer = [];
let lastGesture = null;

const bufferEl = document.getElementById("buffer");
const sequenceEl = document.getElementById("sequence");
const eventCountEl = document.getElementById("eventCount");
const clearButton = document.getElementById("clearButton");
const speakButton = document.getElementById("speakButton");
const pauseButton = document.getElementById("pauseButton");
const resumeButton = document.getElementById("resumeButton");
const stopButton = document.getElementById("stopButton");
const speechStatusEl = document.getElementById("speechStatus");
let speechState = "idle";

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

function updateSpeechControls() {
  const synth = window.speechSynthesis;

  if (!synth || speechState === "idle" || !synth.speaking) {
    speakButton.disabled = false;
    pauseButton.disabled = true;
    resumeButton.disabled = true;
    stopButton.disabled = true;
    return;
  }

  speakButton.disabled = true;
  pauseButton.disabled = speechState !== "speaking";
  resumeButton.disabled = speechState !== "paused";
  stopButton.disabled = false;
}

function speakCurrentMessage() {
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
    speechStatusEl.textContent = "Speech synthesis is not supported in this browser.";
    return;
  }

  if (gestureBuffer.length === 0) {
    speechStatusEl.textContent = "Add a gesture before speaking.";
    return;
  }

  const synth = window.speechSynthesis;

  if (speechState === "speaking" || speechState === "paused") {
    speechStatusEl.textContent = speechState === "paused"
      ? "Speech is paused. Use RESUME."
      : "Speech is already running. Use PAUSE or STOP.";
    return;
  }

  const text = getCommunicationOutput(gestureBuffer);
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.95;
  utterance.pitch = 1;
  utterance.volume = 1;

  utterance.onstart = () => {
    speechState = "speaking";
    speakButton.textContent = "🔊 SPEAKING…";
    speechStatusEl.textContent = "Speech started.";
    updateSpeechControls();
  };

  utterance.onpause = () => {
    speechState = "paused";
    speechStatusEl.textContent = "Speech paused.";
    updateSpeechControls();
  };

  utterance.onresume = () => {
    speechState = "speaking";
    speechStatusEl.textContent = "Speech resumed.";
    updateSpeechControls();
  };

  utterance.onend = () => {
    speechState = "idle";
    speakButton.textContent = "🔊 SPEAK";
    speechStatusEl.textContent = "Speech finished.";
    updateSpeechControls();
  };

  utterance.onerror = event => {
    speechState = "idle";
    speakButton.textContent = "🔊 SPEAK";

    if (event.error === "interrupted" || event.error === "canceled") {
      speechStatusEl.textContent = "Speech stopped.";
      updateSpeechControls();
      return;
    }

    speechStatusEl.textContent = `Speech error: ${event.error || "unknown error"}`;
    updateSpeechControls();
  };

  const voices = synth.getVoices();
  const englishVoice = voices.find(voice =>
    voice.lang && voice.lang.toLowerCase().startsWith("en")
  );

  if (englishVoice) {
    utterance.voice = englishVoice;
  }

  // Clear any stale browser speech queue before starting a fresh utterance.
  synth.cancel();
  speechState = "speaking";
  speakButton.textContent = "🔊 SPEAKING…";
  speechStatusEl.textContent = "Starting speech…";
  updateSpeechControls();
  synth.speak(utterance);
}

;

document.querySelectorAll("[data-gesture]").forEach(button => {
  button.addEventListener("click", () => {
    addGesture(button.dataset.gesture);
  });
});

clearButton.addEventListener("click", clearBuffer);
speakButton.addEventListener("click", speakCurrentMessage);

pauseButton.addEventListener("click", () => {
  const synth = window.speechSynthesis;

  if (speechState === "speaking" && synth.speaking) {
    speechState = "paused";
    synth.pause();
    speechStatusEl.textContent = "Speech paused.";
    updateSpeechControls();
  }
});

resumeButton.addEventListener("click", () => {
  const synth = window.speechSynthesis;

  if (speechState === "paused" && synth.speaking) {
    speechState = "speaking";
    synth.resume();
    speechStatusEl.textContent = "Speech resumed.";
    updateSpeechControls();
  }
});

stopButton.addEventListener("click", () => {
  const synth = window.speechSynthesis;

  if (speechState === "speaking" || speechState === "paused") {
    speechState = "idle";
    synth.cancel();
    speakButton.textContent = "🔊 SPEAK";
    speechStatusEl.textContent = "Speech stopped.";
    updateSpeechControls();
  }
});

render();
updateSpeechControls();
