console.log("Shop page loaded");

const items = [];
// ---------- SHOP CONTEXT ----------
const shopId = localStorage.getItem("shopId");

if (!shopId) {
  window.location.href = "shopLogin.html";
}

// ---------- FETCH BATCH DETAILS ----------
async function fetchBatchDetails() {
  const productId = document.getElementById("productId").value;
  const batchNumber = document.getElementById("batchNumber").value;

  if (!productId || !batchNumber) return;

  const querySnap = await db.collection("batches")
    .where("shopId", "==", shopId)
    .where("productId", "==", productId)
    .where("batchNumber", "==", batchNumber)
    .limit(1)
    .get();
  if (querySnap.empty) {
    alert("Batch not found for this shop");
    return;
  }
  const batch = querySnap.docs[0].data();

  // Prevent expired batch early
  if (new Date(batch.expiryDate) <= new Date()) {
    alert("This batch is expired");
    return;
  }

  document.getElementById("productName").value = batch.productName;
  document.getElementById("mfgDate").value = batch.mfgDate || "-";
  document.getElementById("expiryDate").value = batch.expiryDate;
  document.getElementById("warranty").value = batch.warrantyMonths;
  document.getElementById("mrp").value = batch.mrp;
}

// ---------- ADD ITEM ----------
function addItem() {
  const productId = document.getElementById("productId").value;
  const batchNumber = document.getElementById("batchNumber").value;
  const quantity = Number(document.getElementById("quantity").value);
  const productName = document.getElementById("productName").value;
  const mfgDate = document.getElementById("mfgDate").value;
  const expiryDate = document.getElementById("expiryDate").value;
  const warrantyMonths = document.getElementById("warranty").value;
  const mrp = document.getElementById("mrp").value;

  if (!productId || !batchNumber || !quantity) {
    alert("Product ID, Batch Number and Quantity are required");
    return;
  }

  if (!productName) {
    alert("Fetch batch details first");
    return;
  }

  const item = {
    productId,
    productName,
    batchNumber,
    mfgDate,
    expiryDate,
    warrantyMonths: warrantyMonths ? Number(warrantyMonths) : null,
    mrp: mrp ? Number(mrp) : null,
    quantity
  };

  items.push(item);

  // Table Data
  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td>${productName}</td>
    <td>${batchNumber}</td>
    <td>${quantity}</td>
    <td>${expiryDate}</td>
    <td>${warrantyMonths || "-"}</td>
    <td>${(mrp || "-")*quantity}</td>
  `;

document.getElementById("itemsTableBody").appendChild(tr);
const totalEl = document.getElementById("totalAmount");

const itemTotal = quantity * (mrp ? Number(mrp) : 0);
const currentTotal = Number(totalEl.innerText) || 0;

totalEl.innerText = currentTotal + itemTotal;

  // Clear item inputs
  document.getElementById("productId").value = "";
  document.getElementById("batchNumber").value = "";
  document.getElementById("quantity").value = "";
  document.getElementById("productName").value = "";
  document.getElementById("mfgDate").value = "";
  document.getElementById("expiryDate").value = "";
  document.getElementById("warranty").value = "";
  document.getElementById("mrp").value = "";
}

// ---------- CREATE BILL ----------
async function createBill() {
  const buyerPhone = document.getElementById("buyerPhone").value;

  if (!buyerPhone || items.length === 0) {
    alert("Buyer phone & at least one item required");
    return;
  }

  try {
    await db.runTransaction(async (transaction) => {

      for (const item of items) {
        const batchId = `${shopId}_${item.productId}_${item.batchNumber}`;
        const batchRef = db.collection("batches").doc(batchId);

        const batchSnap = await transaction.get(batchRef);

        if (!batchSnap.exists) {
          throw new Error(`Batch not found for ${item.productName}`);
        }

        const batch = batchSnap.data();

        if (new Date(batch.expiryDate) <= new Date()) {
          throw new Error(`${item.productName} batch is expired`);
        }

        if (batch.quantityAvailable < item.quantity) {
          throw new Error(
            `Insufficient stock for ${item.productName} (Available: ${batch.quantityAvailable})`
          );
        }

        transaction.update(batchRef, {
          quantityAvailable: batch.quantityAvailable - item.quantity
        });
      }

      const billRef = db.collection("bills").doc();

      transaction.set(billRef, {
        buyerPhone,
        shopId,
        shopName: "Demo Store",
        billDate: Date.now(),
        items
      });
    });

    alert("Bill saved & stock updated successfully");
    location.reload();

  } catch (err) {
    console.error(err);
    alert(err.message || "Transaction failed");
  }
}

