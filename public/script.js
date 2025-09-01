document.addEventListener("DOMContentLoaded", () => {
  const textInput = document.getElementById("text-input");
  const fileInput = document.getElementById("file-input");
  const generateBtn = document.getElementById("generate-btn");
  const flashcardCountContainer = document.getElementById(
    "flashcard-count-container"
  );
  const flashcardContainer = document.getElementById("flashcard-container");
  const spinnerContainer = document.getElementById("spinner-container");
  const downloadContainer = document.getElementById("download-container");
  const downloadCsvBtn = document.getElementById("download-csv");
  const downloadTxtBtn = document.getElementById("download-txt");
  const modeInputs = document.querySelectorAll('input[name="mode"]');

  fileInput.addEventListener("change", handleFileSelect, false);

  generateBtn.addEventListener("click", () => {
    const selectedMode = document.querySelector(
      'input[name="mode"]:checked'
    ).value;
    const text = textInput.value;

    if (selectedMode === "manual") {
      if (text) {
        if (text.includes(",")) {
          generateFlashcards(text, ",");
        } else {
          generateFlashcards(text);
        }
      } else {
        alert("Please enter some text.");
      }
    } else {
      generateBtn.disabled = true;
      spinnerContainer.classList.remove("hidden");
      fetch("/generate-flashcards-auto", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      })
        .then((response) => response.json())
        .then((data) => {
          generateFlashcards(data.flashcards);
        })
        .catch((error) => {
          console.error("Error:", error);
          alert("Failed to generate flashcards automatically.");
        })
        .finally(() => {
          generateBtn.disabled = false;
          spinnerContainer.classList.add("hidden");
        });
    }
  });

  function generateFlashcards(text, delimiter = ":") {
    flashcardContainer.innerHTML = "";
    flashcardCountContainer.innerHTML = "";
    const pairs = text.split("\n").filter((line) => line.includes(delimiter));

    pairs.forEach((pair) => {
      const [front, back] = pair.split(delimiter);
      const card = createFlashcard(front.trim(), back.trim());
      flashcardContainer.appendChild(card);
    });

    const flashcardCount = document.createElement("p");
    flashcardCount.textContent = `Generated ${pairs.length} flashcards.`;
    flashcardCountContainer.prepend(flashcardCount);

    if (pairs.length > 0) {
      downloadContainer.classList.remove("hidden");
    } else {
      downloadContainer.classList.add("hidden");
    }
  }

  function createFlashcard(frontText, backText) {
    const card = document.createElement("div");
    card.classList.add("flashcard");

    const front = document.createElement("div");
    front.classList.add("front");
    front.textContent = frontText;

    const back = document.createElement("div");
    back.classList.add("back");
    back.textContent = backText;

    card.appendChild(front);
    card.appendChild(back);

    card.addEventListener("click", () => {
      card.classList.toggle("flip");
    });

    return card;
  }

  function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    if (file.type === "application/pdf") {
      const reader = new FileReader();
      reader.onload = function (e) {
        const typedarray = new Uint8Array(e.target.result);
        pdfjsLib.getDocument(typedarray).promise.then((pdf) => {
          let text = "";
          const numPages = pdf.numPages;
          let countPromises = [];
          for (let i = 1; i <= numPages; i++) {
            let page = pdf.getPage(i);
            countPromises.push(
              page.then(function (page) {
                let textContent = page.getTextContent();
                return textContent.then(function (text) {
                  return text.items
                    .map(function (s) {
                      return s.str;
                    })
                    .join(" ");
                });
              })
            );
          }
          Promise.all(countPromises).then(function (texts) {
            textInput.value = texts.join(" ");
          });
        });
      };
      reader.readAsArrayBuffer(file);
    } else if (
      file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const arrayBuffer = e.target.result;
        mammoth
          .extractRawText({ arrayBuffer: arrayBuffer })
          .then(function (result) {
            textInput.value = result.value;
          });
      };
      reader.readAsArrayBuffer(file);
    } else if (file.type === "text/csv") {
      const reader = new FileReader();
      reader.onload = function (e) {
        textInput.value = e.target.result;
      };
      reader.readAsText(file);
    } else {
      const reader = new FileReader();
      reader.onload = function (e) {
        textInput.value = e.target.result;
      };
      reader.readAsText(file);
    }
  }

  downloadCsvBtn.addEventListener("click", () => {
    const flashcards = getFlashcards();
    downloadFile(
      flashcards.map((f) => `"${f.front}","${f.back}"`).join("\n"),
      "flashcards.csv",
      "text/csv"
    );
  });

  downloadTxtBtn.addEventListener("click", () => {
    const flashcards = getFlashcards();
    downloadFile(
      flashcards.map((f) => `${f.front}:${f.back}`).join("\n"),
      "flashcards.txt",
      "text/plain"
    );
  });

  function getFlashcards() {
    const flashcardElements = document.querySelectorAll(".flashcard");
    const flashcards = [];
    flashcardElements.forEach((card) => {
      const front = card.querySelector(".front").textContent;
      const back = card.querySelector(".back").textContent;
      flashcards.push({ front, back });
    });
    return flashcards;
  }

  function downloadFile(content, fileName, mimeType) {
    const a = document.createElement("a");
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }
});
