// Array holding our word list
const words = [
  { navajo: "Yá'át'ééh", english: "Hello / It is good" },
  { navajo: "Ahéhee'", english: "Thank you" },
  { navajo: "Ałchiní", english: "Children" },
  { navajo: "Shimá", english: "My Mother" },
  { navajo: "Diné", english: "The People / Navajo" }
];

let index = 0;

//id
const wordTitle = document.getElementById("navajo-word");
const wordTranslation = document.getElementById("english-word");
const nextButton = document.getElementById("change-btn");

function showNextWord() {
  index = index + 1;

  if (index >= words.length) {
    index = 0;
  }

  wordTitle.textContent = words[index].navajo;
  wordTranslation.textContent = "Translation: " + words[index].english;
}

nextButton.addEventListener("click", showNextWord);