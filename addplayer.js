document.getElementById("addBtn").onclick = async function () {
  const name = document.getElementById("name").value.trim();

  const forward = Number(document.getElementById("forward").value);
  const mid = Number(document.getElementById("mid").value);
  const defence = Number(document.getElementById("defence").value);
  const gk = Number(document.getElementById("gk").value);

  const msg = document.getElementById("addMsg");

  // Basic validation
  if (!name) {
    msg.textContent = "Name is required.";
    return;
  }

  if (
    isNaN(forward) || isNaN(mid) || isNaN(defence) || isNaN(gk) ||
    forward < 1 || forward > 10 ||
    mid < 1 || mid > 10 ||
    defence < 1 || defence > 10 ||
    gk < 1 || gk > 10
  ) {
    msg.textContent = "All ratings must be between 1 and 10.";
    return;
  }

  const payload = {
    name,
    forward,
    mid,
    defence,
    gk
  };

  const res = await fetch("/.netlify/functions/addPlayer", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (data.success) {
    msg.textContent = "Player added successfully!";
    setTimeout(() => {
      window.location.href = "playerdb.html";
    }, 800);
  } else {
    msg.textContent = "Error adding player.";
  }
};
