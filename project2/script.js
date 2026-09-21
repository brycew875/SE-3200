const generateButton = document.querySelector("#generateButton");
const pokemonCard = document.querySelector("#pokemonCard");
const history = document.querySelector("#history");

const pokemonTypes = [
    "normal",
    "fire",
    "water",
    "electric",
    "grass",
    "ice",
    "fighting",
    "poison",
    "ground",
    "flying"
];

let pokemonHistory = [];

generateButton.addEventListener("click", generatePokemon);

async function generatePokemon() {

    const randomNumber = Math.floor(Math.random() * 151) + 1;

    pokemonCard.innerHTML = "<p>Loading Pokémon...</p>";

    try {

        const response = await fetch(
            `https://pokeapi.co/api/v2/pokemon/${randomNumber}`
        );

        const pokemon = await response.json();

        displayPokemon(pokemon);

        addToHistory(pokemon);

    } catch (error) {

        pokemonCard.innerHTML =
            "<p>Something went wrong. Please try again.</p>";

        console.log(error);
    }
}

function displayPokemon(pokemon) {

    const name = pokemon.name;
    const image = pokemon.sprites.front_default;
    const height = pokemon.height;
    const weight = pokemon.weight;
    const type = pokemon.types[0].type.name;

    pokemonCard.innerHTML = `
        <img src="${image}" alt="${name}">

        <h3>${name}</h3>

        <p><strong>Type:</strong> ${type}</p>

        <p><strong>Height:</strong> ${height / 10} m</p>

        <p><strong>Weight:</strong> ${weight / 10} kg</p>
    `;
}

function addToHistory(pokemon) {

    pokemonHistory.push({
        name: pokemon.name,
        image: pokemon.sprites.front_default
    });

    const historyCard = document.createElement("div");

    historyCard.classList.add("history-card");

    historyCard.innerHTML = `
        <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
        <p>${pokemon.name}</p>
    `;

    history.prepend(historyCard);
}