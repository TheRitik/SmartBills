const shopId = localStorage.getItem("shopId");

if (!shopId) {
  window.location.href = "shopLogin.html";
}

function go(page) {
  window.location.href = page;
}

document.getElementById("sellerLogout").onclick = () => {
  localStorage.removeItem("shopId");
  window.location.href = "shopLogin.html";
};

// ---------- LIVE STOCK CHART ----------
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
db.collection("batches")
  .where("shopId", "==", shopId)
  .onSnapshot(snapshot => {
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

// ---------- BILLING HISTORY ----------
const billingHistoryDiv = document.getElementById("billingHistory");

db.collection("bills")
  .where("shopId", "==", shopId)
  .orderBy("billDate","desc")
  .limit(10)
  .onSnapshot(snapshot => {
    billingHistoryDiv.innerHTML = "";

    if (snapshot.empty) {
      billingHistoryDiv.innerHTML = `<div class="empty">No bills yet</div>`;
      return;
    }

    snapshot.forEach(doc => {
      const bill = doc.data();
      const total = bill.items.reduce((sum, i) => {
        return sum + (i.mrp || 0) * (i.quantity || 1);
      }, 0);

      const card = document.createElement("div");
      card.className = "bill-history-card";
      card.innerHTML = `
        <div>
          <b>₹${total}</b>
          <small>Buyer: ${bill.buyerPhone}</small>
        </div>
        <span class="bill-date">
          ${new Date(bill.billDate).toLocaleDateString()}
        </span>
      `;
      billingHistoryDiv.appendChild(card);
    });
  });

