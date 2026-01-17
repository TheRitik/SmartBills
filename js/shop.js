console.log("Shop page loaded");
const items = [];

const shopId = localStorage.getItem("shopId");

if (!shopId) {
  window.location.href = "shopLogin.html";
}

async function fetchBatchDetails() {
  const productId = document.getElementById("productId").value;
  const batchNumber = document.getElementById("batchNumber").value;

  if (!productId || !batchNumber) return;

  const batchId = `${productId}_${batchNumber}`;
  const batchSnap = await db.collection("batches").doc(batchId).get();

  if (!batchSnap.exists) {
    alert("Batch not found");
    return;
  }

  const batch = batchSnap.data();

  // ❌ Prevent expired batch early
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


function addItem() {
  const productId = document.getElementById("productId").value;
  const batchNumber = document.getElementById("batchNumber").value;
  const quantity = Number(document.getElementById("quantity").value);
  const batchId = `${productId}_${batchNumber}`;
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
    batchId,
    mfgDate,
    expiryDate,
    warrantyMonths: warrantyMonths ? Number(warrantyMonths) : null,
    mrp: mrp ? Number(mrp) : null,
    quantity
  };

  items.push(item);

  // UI
  const li = document.createElement("li");
  li.innerText = `${productName} (Batch: ${batchNumber}, Qty: ${quantity})`;
  document.getElementById("itemsList").appendChild(li);

  // Clear only item-related inputs
  document.getElementById("productId").value = "";
  document.getElementById("batchNumber").value = "";
  document.getElementById("quantity").value = "";

  document.getElementById("productName").value = "";
  document.getElementById("mfgDate").value = "";
  document.getElementById("expiryDate").value = "";
  document.getElementById("warranty").value = "";
  document.getElementById("mrp").value = "";
}

async function createBill() {
  const buyerPhone = document.getElementById("buyerPhone").value;
  const bill = {
  buyerPhone,
  shopId,
  shopName: "Demo Store", 
  billDate: Date.now(),
  items
  };
  if (!buyerPhone || items.length === 0) {
    alert("Buyer phone & at least one item required");
    return;
  }

  try {
    await db.runTransaction(async (transaction) => {

      // Validate & reduce stock
      for (const item of items) {
        const batchRef = db.collection("batches").doc(item.batchId);
        const batchSnap = await transaction.get(batchRef);

        if (!batchSnap.exists) {
          throw new Error(`Batch ${item.batchId} not found`);
        }

        const batch = batchSnap.data();

        
        if (new Date(batch.expiryDate) <= new Date()) {
          throw new Error(`${item.productName} batch is expired`);
        }

        // Stock check
        if (batch.quantityAvailable < item.quantity) {
          throw new Error(
            `Insufficient stock for ${item.productName} (Available: ${batch.quantityAvailable})`
          );
        }

        // Reduce stock
        transaction.update(batchRef, {
          quantityAvailable: batch.quantityAvailable - item.quantity
        });
      }

      // Save bill
      const billRef = db.collection("bills").doc();

      transaction.set(billRef, {
        buyerPhone: buyerPhone,
        shopName: "Demo Store",
        billDate: Date.now(),
        items: items
      });
    });

    alert("Bill saved & stock updated successfully");
    location.reload();

  } catch (err) {
    console.error(err);
    alert(err.message || "Transaction failed");
  }
}

