const MAX_BUFFER_SIZE = 3;
const gestureBuffer = [];

const bufferEl = document.getElementById("buffer");
const sequenceEl = document.getElementById("sequence");
const eventCountEl = document.getElementById("eventCount");
const clearButton = document.getElementById("clearButton");

function addGesture(gesture) {
  gestureBuffer.push(gesture);

  if (gestureBuffer.length > MAX_BUFFER_SIZE) {
    gestureBuffer.shift();
  }

  render();
}

function clearBuffer() {
  gestureBuffer.length = 0;
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

    sequenceEl.textContent = gestureBuffer.join(" → ");
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

render();