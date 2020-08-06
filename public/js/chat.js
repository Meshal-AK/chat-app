const socket = io();

// Elements
const $messageForm = document.querySelector("#message-form");
const $messageFormInput = $messageForm.elements[0];
const $messageFormButton = $messageForm.elements[1];
const $sendLocationButton = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");
const $sidebar = document.querySelector("#sidebar");

// Templates
const messageTemaplate = document.querySelector("#message-template").innerHTML;
const locationTemaplate = document.querySelector("#location-template")
  .innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoscroll = () => {
  // New message element
  const $newMessage = $messages.lastElementChild;

  // Height of the new message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  // Visible height
  const visibleHeight = $messages.offsetHeight;

  // Height of message container
  const containerHeight = $messages.scrollHeight;

  // How far have I scrolled
  const scrollOffset = $messages.scrollTop + visibleHeight;

  // console.log(containerHeight - newMessageHeight, scrollOffset);

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

socket.on("message", (message) => {
  // console.log(message);
  const html = Mustache.render(messageTemaplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("locationMessage", (url) => {
  // console.log(url);
  const html = Mustache.render(locationTemaplate, {
    username: url.username,
    url: url.url,
    createdAt: moment(url.createdAt).format("h:mm a"),
  });
  console.log(html);

  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });
  $sidebar.innerHTML = html;
});

$messageForm.addEventListener("submit", (e) => {
  e.preventDefault();

  // Disable
  $messageFormButton.setAttribute("disabled", "disabled");

  const message = e.target.elements[0].value;

  socket.emit("sendMessage", message, (error) => {
    // Enable
    $messageFormButton.removeAttribute("disabled");
    $messageFormInput.value = "";
    $messageFormInput.focus();

    if (error) {
      return console.log(error);
    }
    console.log("The message was delivered");
  });
});

$sendLocationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser.");
  }

  $sendLocationButton.setAttribute("disabled", "disabled");

  navigator.geolocation.getCurrentPosition((postion) => {
    const { latitude, longitude } = postion.coords;
    locat = {
      latitude,
      longitude,
    };

    socket.emit("sendLocation", locat, () => {
      $sendLocationButton.removeAttribute("disabled");
      console.log("Location Shared!");
    });
  });
});

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
