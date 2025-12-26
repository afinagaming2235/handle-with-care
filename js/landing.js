const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const btn = document.getElementById("sendBtn");
const msg = document.getElementById("msg");

btn.addEventListener("click", async () => {
  msg.textContent = "";
  msg.className = "msg";

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();

  if (!name || !email) {
    msg.textContent = "Please enter your name and email.";
    msg.classList.add("error");
    return;
  }

  try {
    const res = await fetch("/api/request-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email })
    });

    const data = await res.json();

    if (!data.ok) {
      msg.textContent = "Something went wrong.";
      msg.classList.add("error");
      return;
    }

    msg.textContent = "Check your email to continue.";
    msg.classList.add("ok");

  } catch {
    msg.textContent = "Network error.";
    msg.classList.add("error");
  }
});
