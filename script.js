
let button = document.querySelector("#changeButton");
let message = document.querySelector("#message");
let welcome = document.querySelector("#welcome");


button.onclick = function() {

    message.textContent = "Thanks for visiting my webpage!";

    welcome.textContent = "JavaScript changed this message!";

};