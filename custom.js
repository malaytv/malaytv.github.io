var button = document.createElement("p");

button.innerText = "View Full Site >>";

button.className = "control";

button.addEventListener("click", function() {
  
  window.open("https://www.tvmalaysia.homes/", "_blank");
});
document.getElementById("btncnt").appendChild(button);
