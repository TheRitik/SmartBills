const saveBtn = document.getElementById("saveManual");

saveBtn.onclick = async () => {
  const productName = document.getElementById("productName").value;
  const category = document.getElementById("category").value;
  const quantity = document.getElementById("quantity").value;
  const expiryDate = document.getElementById("expiryDate").value;

  if (!productName || !expiryDate) {
    alert("Please fill required fields");
    return;
  }

  const buyerPhone = localStorage.getItem("buyerPhone");

  await db.collection("manualItems").add({
    buyerPhone,
    productName,
    category,
    quantity,
    expiryDate,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    source: "manual"
  });

  alert("Item added successfully");
  window.location.href = "index.html";
};
