var button = document.createElement("p");

button.innerText = "View Full Site >>";

button.className = "control";

button.addEventListener("click", function() {
  
  window.open("https://www.usvideohub.com/", "_blank");
});
document.getElementById("btncnt").appendChild(button);
