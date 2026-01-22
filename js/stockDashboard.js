console.log("Stock dashboard loaded");

// 🔐 Ensure shop context
const shopId = localStorage.getItem("shopId");
if (!shopId) {
  alert("Please login as a shop first");
  window.location.href = "shopLogin.html";
}

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

// ---------- FIRESTORE LISTENER (SHOP-SCOPED) ----------
db.collection("batches")
  .where("shopId", "==", shopId)       
  .orderBy("expiryDate")
  .onSnapshot(snapshot => {
    tableBody.innerHTML = "";

    if (snapshot.empty) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="5">No stock added yet</td>`;
      tableBody.appendChild(tr);
      return;
    }

    snapshot.forEach(doc => {
      const batch = doc.data();
      const status = getStatus(batch);

      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${batch.productName || "-"}</td>
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

  //  LIVE STOCK CHART 
let stockChart;

function renderStockChart(dataMap) {
  const labels = Object.keys(dataMap);
  const values = Object.values(dataMap);

  if (stockChart) stockChart.destroy();
  stockChart = new Chart(document.getElementById("stockChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Stock Quantity",
        data: values,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      }
    }
  });
}

// Firestore live listener
db.collection("batches").onSnapshot(snapshot => {
  const productStock = {};
  snapshot.forEach(doc => {
    const batch = doc.data();
    if (!productStock[batch.productName]) {
      productStock[batch.productName] = 0;
    }
    productStock[batch.productName] += batch.quantityAvailable;
  });
  renderStockChart(productStock);
});

