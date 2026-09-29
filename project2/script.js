// DOM Querying - grabbing HTML elements
const nextBtn = document.getElementById("next-btn");
const wordText = document.getElementById("word");
const translationText = document.getElementById("translation");
const flashcardBox = document.getElementById("flashcard-box");

// Array of Navajo vocabulary words
const words = [
  { word: "Yá’át’ééh", translation: "Hello / It is good" },
  { word: "Ahéhee’", translation: "Thank you" },
  { word: "Nizhóní", translation: "Beautiful" },
  { word: "Ałchiní", translation: "Children / Family" },
  { word: "Hózhǫ́", translation: "Harmony / Peace" }
];

let count = 0;

// Event Listener - triggers when button is clicked
nextBtn.addEventListener("click", function() {
  // Move to next word in array
  count = count + 1;
  
  // Loop back to start if we hit the end
  if (count >= words.length) {
    count = 0;
  }

  // DOM Manipulation - changing text contents
  wordText.textContent = words[count].word;
  translationText.textContent = "Translation: " + words[count].translation;

  // DOM Manipulation - toggling visual background style
  flashcardBox.classList.toggle("turquoise-bg");
});