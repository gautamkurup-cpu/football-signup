document.getElementById("addBtn").onclick = async function () {
  const name = document.getElementById("name").value.trim();

  const ballControl = Number(document.getElementById("ballControl").value);
  const pace = Number(document.getElementById("pace").value);
  const shooting = Number(document.getElementById("shooting").value);
  const passing = Number(document.getElementById("passing").value);
  const defending = Number(document.getElementById("defending").value);
  const workRate = Number(document.getElementById("workRate").value);
  const goalKeeping = Number(document.getElementById("goalKeeping").value);

  const msg = document.getElementById("addMsg");

  if (!name) {
    msg.textContent = "Name is required.";
    return;
  }

  const payload = {
    name,
    ballControl,
    pace,
    shooting,
    passing,
    defending,
    workRate,
    goalKeeping
  };

  const res = await fetch("/.netlify/functions/addPlayer", {
    method: "POST",
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
