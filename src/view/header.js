// view.js
export function getEmail() {
 return document.getElementById("email").value;
}
export function getPassword() {
 return document.getElementById("password").value;
}
export function showUserUI(email) {
 document.getElementById("auth").style.display = "none";
 document.getElementById("data").style.display = "block";
 document.getElementById("logoutBtn").style.display = "inline-block";
 document.querySelector("h1").textContent = `Benvenuto, ${email}!`;
}
export function showLoginUI() {
 document.getElementById("auth").style.display = "block";
 document.getElementById("data").style.display = "none";
 document.getElementById("logoutBtn").style.display = "none";
 document.querySelector("h1").textContent = "Firebase + MVC";
}
export function renderData(data) {
 const ul = document.getElementById("output");
 ul.innerHTML = Object.entries(data)
   .map(([key, val]) => `<li>${key}: ${val}</li>`)
   .join("");
}