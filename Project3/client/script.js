const form = document.getElementById("messageForm");
const messageInput = document.getElementById("message");
const messagesDiv = document.getElementById("messages");


function loadMessages() {

    fetch("/messages")
        .then(response => response.json())
        .then(messages => {

            messagesDiv.innerHTML = "";

            messages.forEach(message => {

                const div = document.createElement("div");

                div.className = "message";

                div.textContent = message;

                messagesDiv.appendChild(div);

            });

        });

}


form.addEventListener("submit", function(event) {

    event.preventDefault();

    const message = messageInput.value;

    fetch("/messages", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            message: message
        })

    })
    .then(response => {

        if (response.status === 201) {

            messageInput.value = "";

            loadMessages();

        }

    });

});


loadMessages();