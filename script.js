// Query elements from the webpage
let button = document.querySelector("#changeButton");
let message = document.querySelector("#message");
let welcome = document.querySelector("#welcome");

// Create an event
button.onclick = function() {

    // Change the content of the webpage
    message.textContent = "Thanks for visiting my webpage!";

    welcome.textContent = "JavaScript changed this message!";

};