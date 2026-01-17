(() => {
  //                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          ---------- DOM ELEMENTS ----------
  const loginScreen = document.getElementById("loginScreen");
  const otpScreen = document.getElementById("otpScreen");
  const dashboard = document.getElementById("dashboard");
  let CURRENT_USER_PHONE = localStorage.getItem("buyerPhone");
  function showDashboard() {
    loginScreen.style.display = "none";
    otpScreen.style.display = "none";
    dashboard.style.display = "block";
  }
  if (CURRENT_USER_PHONE) {
    showDashboard();
  } else {
    loginScreen.style.display = "block";
  }
  document.getElementById("sendOtp").onclick = () => {
  const phone = document.getElementById("loginPhone").value;
  if (!phone) return alert("Enter phone number");

  // UI-only OTP
  otpScreen.style.display = "block";
  loginScreen.style.display = "none";
};
document.getElementById("verifyOtp").onclick = () => {
  const otp = document.getElementById("otpInput").value;

  if (otp !== "123456") {
    alert("Invalid OTP");
    return;
  }

  const phone = document.getElementById("loginPhone").value;
  localStorage.setItem("buyerPhone", phone);
  CURRENT_USER_PHONE = phone;

  showDashboard();
  initFirestore(); // important
};


  const expiringDiv = document.getElementById("expiringSoon");
  const allBillsDiv = document.getElementById("allBills");
  const filterButtons = document.querySelectorAll(".filters button");

  if (!expiringDiv || !allBillsDiv) {
    console.error("Required dashboard elements not found");
    return;
  }

  // ---------- STATE ----------
  let activeFilter = "all";
  let cachedItems = [];

  // ---------- NOTIFICATION PERMISSION ----------
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }

  // ---------- DATE UTILITIES ----------
  function daysLeft(expiryDateStr) {
    const today = new Date();
    const expiry = new Date(expiryDateStr);
    return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  }

  function expiryText(expiryDateStr) {
    const d = daysLeft(expiryDateStr);
    if (d > 1) return `Expires in ${d} days`;
    if (d === 1) return "Expires tomorrow";
    if (d === 0) return "Expires today";
    return `Expired ${Math.abs(d)} days ago`;
  }

  function isExpiringSoon(expiryDateStr) {
    const d = daysLeft(expiryDateStr);
    return d >= 0 && d <= 7;
  }

  function shouldNotify(expiryDateStr) {
    const d = daysLeft(expiryDateStr);
    return d === 7 || d === 1 || d === 0;
  }
  function logout() {
    localStorage.removeItem("buyerPhone");
    location.reload();
  }


  // ---------- NOTIFICATION HELPERS ----------
  function notifyItem(item) {
    if (Notification.permission !== "granted") return;
    if (!navigator.serviceWorker.controller) return;

    const key = `${item.batchId}-${item.expiryDate}`;
    if (localStorage.getItem(key)) return;

    navigator.serviceWorker.controller.postMessage({
      title: `${item.productName} expiry reminder`,
      body: `${expiryText(item.expiryDate)} (Qty: ${item.quantity})`,
      itemKey: item.batchId
      
    });

    localStorage.setItem(key, "1");
  }

  // ---------- RENDER ----------
  function render() {
    expiringDiv.innerHTML = "";
    allBillsDiv.innerHTML = "";
    
    cachedItems.forEach(({ bill, item }) => {
      const d = daysLeft(item.expiryDate);

      if (activeFilter === "today" && d !== 0) return;
      if (activeFilter === "tomorrow" && d !== 1) return;

      const card = document.createElement("div");
      card.className = "bill";
      card.dataset.item = item.batchId;

      card.innerHTML = `
      <b>${item.productName}</b><br>
      <small>Qty: ${item.quantity}</small><br>
      <small>${bill.shopName}</small><br>
      <small>${expiryText(item.expiryDate)}</small>`;
      allBillsDiv.appendChild(card);
      if (isExpiringSoon(item.expiryDate)) {
        expiringDiv.appendChild(card.cloneNode(true));
      }
      if (shouldNotify(item.expiryDate)) {
        notifyItem(item);
      }
    });
    if (isExpiringSoon(item.expiryDate)) {
      card.classList.add("expiring");
    }
  }
  // ---------- FILTER EVENTS ----------
  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      activeFilter = btn.dataset.filter;
      render();
    });
  });
  // ---------- FIRESTORE ----------
  function initFirestore() {
  db.collection("bills")
    .where("buyerPhone", "==", CURRENT_USER_PHONE)
    .orderBy("billDate", "desc")
    .onSnapshot(snapshot => {
      cachedItems = [];

      snapshot.forEach(doc => {
        const bill = doc.data();
        bill.items.forEach(item => {
          if (item.expiryDate) {
            cachedItems.push({ bill, item });
          }
        });
      });
      render();
    });
}
  // ---------- NOTIFICATION CLICK HANDLER ----------
  navigator.serviceWorker?.addEventListener("message", event => {
    if (event.data?.type === "OPEN_ITEM") {
      document.querySelectorAll(".bill").forEach(card => {
        if (card.dataset.item === event.data.itemKey) {
          card.style.border = "2px solid red";
          card.scrollIntoView({ behavior: "smooth" });
          setTimeout(() => {
            card.style.border = "";
            }, 1000);
        }
      });
    }
  });
  if (CURRENT_USER_PHONE) {
    initFirestore();
  }
  // Buyer's logout
  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("buyerPhone");
      location.reload();
    });
  }

})();
