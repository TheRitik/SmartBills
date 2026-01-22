(() => {
  const status = document.getElementById("status");

  //Ensure shop context
  const shopId = localStorage.getItem("shopId");
  if (!shopId) {
    alert("Please login as a shop first");
    window.location.href = "shopLogin.html";
    return;
  }

  document.getElementById("saveBatch").onclick = async () => {
    const productId = productIdInput().value;
    const productName = productNameInput().value;
    const batchNumber = batchNumberInput().value;
    const mfgDate = mfgDateInput().value;
    const expiryDate = expiryDateInput().value;
    const warrantyMonths = Number(warrantyMonthsInput().value || 0);
    const mrp = Number(mrpInput().value);
    const quantity = Number(quantityInput().value);

    // -------- VALIDATION --------
    if (!productId || !batchNumber || !expiryDate || !mrp || !quantity) {
      alert("Please fill all required fields");
      return;
    }

    if (new Date(expiryDate) <= new Date()) {
      alert("Expiry date must be in the future");
      return;
    }

    // Shop-scoped batch ID
    const batchId = `${shopId}_${productId}_${batchNumber}`;

    try {
      await db.collection("batches").doc(batchId).set({
        shopId,              
        batchId,
        productId,
        productName,
        batchNumber,
        mfgDate: mfgDate || null,
        expiryDate,
        warrantyMonths,
        mrp,
        quantityAvailable: quantity,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      status.innerText = "Batch saved successfully";
      status.style.color = "green";
      clearForm();
    } catch (err) {
      console.error(err);
      status.innerText = "Error saving batch";
      status.style.color = "red";
    }
  };

  // -------- HELPERS --------
  function productIdInput() { return document.getElementById("productId"); }
  function productNameInput() { return document.getElementById("productName"); }
  function batchNumberInput() { return document.getElementById("batchNumber"); }
  function mfgDateInput() { return document.getElementById("mfgDate"); }
  function expiryDateInput() { return document.getElementById("expiryDate"); }
  function warrantyMonthsInput() { return document.getElementById("warrantyMonths"); }
  function mrpInput() { return document.getElementById("mrp"); }
  function quantityInput() { return document.getElementById("quantity"); }

  function clearForm() {
    productIdInput().value = "";
    productNameInput().value = "";
    batchNumberInput().value = "";
    mfgDateInput().value = "";
    expiryDateInput().value = "";
    warrantyMonthsInput().value = "";
    mrpInput().value = "";
    quantityInput().value = "";
  }
})();
