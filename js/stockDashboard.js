console.log("Stock dashboard loaded");

document.getElementById("addStockBtn").addEventListener("click", () => {
  window.location.href = "stock.html";
});

const tableBody = document.querySelector("#stockTable tbody");

// ---------- DATE HELPERS ----------
function daysLeft(dateStr) {
  const today = new Date();
  const expiry = new Date(dateStr);
  return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
}

function getStatus(batch) {
  const d = daysLeft(batch.expiryDate);

  if (d < 0) return { text: "Expired", color: "red" };
  if (batch.quantityAvailable <= 0) return { text: "Out of Stock", color: "gray" };
  if (d <= 7) return { text: "Expiring Soon", color: "orange" };
  return { text: "In Stock", color: "green" };
}

// ---------- FIRESTORE LISTENER ----------
db.collection("batches")
  .orderBy("expiryDate")
  .onSnapshot(snapshot => {
    tableBody.innerHTML = "";

    snapshot.forEach(doc => {
      const batch = doc.data();
      const status = getStatus(batch);

      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${batch.productName}</td>
        <td>${batch.batchNumber}</td>
        <td>${batch.expiryDate}</td>
        <td>${batch.quantityAvailable}</td>
        <td style="color:${status.color}">
          ${status.text}
        </td>
      `;

      tableBody.appendChild(tr);
    });
  });
