console.log("Shop login loaded");

function saveShop() {
  const storeName = document.getElementById("storeName").value;
  const ownerName = document.getElementById("ownerName").value;
  const phone = document.getElementById("phone").value;
  const location = document.getElementById("location").value;
  const category = document.getElementById("category").value;

  if (!storeName || !phone || !category) {
    alert("Store name, phone and category are required");
    return;
  }

  const shopId = phone; // demo-friendly unique ID

  const shop = {
    storeName,
    ownerName,
    phone,
    location,
    category,
    createdAt: Date.now()
  };

  db.collection("shops").doc(shopId)
    .set(shop)
    .then(() => {
      localStorage.setItem("shopId", shopId);
      alert("Shop saved successfully");
      window.location.href = "stockDashboard.html";
    })
    .catch(err => {
      console.error(err);
      alert("Error saving shop");
    });
}
