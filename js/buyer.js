(() => {
  // ---------- DOM ELEMENTS ----------
  const loginScreen = document.getElementById("loginScreen");
  const otpScreen = document.getElementById("otpScreen");
  const dashboard = document.getElementById("dashboard");

  const urlParams = new URLSearchParams(location.search);
  const OPEN_ITEM_FROM_URL = urlParams.get("item");

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

  // ---------- LOGIN / OTP ----------
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

  // ---------- DASHBOARD ELEMENTS ----------
  const expiringDiv = document.getElementById("expiringSoon");
  const allBillsDiv = document.getElementById("allBills");
  const filterButtons = document.querySelectorAll(".filters button");

  if (!expiringDiv || !allBillsDiv) {
    console.error("Required dashboard elements not found");
    return;
  }

  // ---------- STATE ----------
  let activeFilter = "all";
  let activeCategory = "all";
  let cachedItems = [];
  const shopCategoryCache = {};

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

  async function getShopCategory(shopId) {
    if (shopCategoryCache[shopId]) {
      return shopCategoryCache[shopId];
    }

    const snap = await db.collection("shops").doc(shopId).get();
    const category = snap.exists ? snap.data().category : "unknown";

    shopCategoryCache[shopId] = category;
    return category;
  }

  // ---------- NOTIFICATION HELPERS ----------
  function notifyItem(item) {
    /*const title = `${item.productName} expiry reminder`;
    const body = `${expiryText(item.expiryDate)} (Qty: ${item.quantity})`;
    if (document.visibilityState === "visible") {
      showExpiryPopup(title, body, item.batchId);
      return;
    }*/

    if (Notification.permission !== "granted") return;
    if (!navigator.serviceWorker.controller) return;

    const key = `${item.batchId}-${item.expiryDate}`;
    if (localStorage.getItem(key)) return;

    navigator.serviceWorker.controller.postMessage({
      type: "EXPIRY_ALERT",
      title: `${item.productName} expiry reminder`,
      body: `${expiryText(item.expiryDate)} (Qty: ${item.quantity})`,
      itemKey: item.batchId
    });

    const todayKey = `${key}-${new Date().toDateString()}`;
    if (localStorage.getItem(todayKey)) return;
    localStorage.setItem(todayKey, "1");
  }

  function showExpiryPopup(title, body, itemKey) {
    const popup = document.getElementById("expiryPopup");

    document.getElementById("popupTitle").innerText = title;
    document.getElementById("popupBody").innerText = body;

    popup.style.display = "flex";

    document.getElementById("popupOk").onclick = () => {
      popup.style.display = "none";
      highlightItem(itemKey);
    };
  }

  // ---------- RENDER ----------
  function render() {
    expiringDiv.innerHTML = "";
    allBillsDiv.innerHTML = "";

    cachedItems.forEach(({ bill, item, shopCategory }) => {
      const d = daysLeft(item.expiryDate);

      if (activeFilter === "today" && d !== 0) return;
      if (activeFilter === "tomorrow" && d !== 1) return;
      if (activeCategory !== "all" && shopCategory !== activeCategory) return;

      const card = document.createElement("div");
      card.className = "bill";
      card.dataset.item = item.batchId;

      card.innerHTML = `
        <b>${item.productName}</b><br>
        <small>Qty: ${item.quantity}</small><br>
        <small>${bill.shopName}</small><br>
        <small>${expiryText(item.expiryDate)}</small>
      `;

      allBillsDiv.appendChild(card);

      if (isExpiringSoon(item.expiryDate)) {
        const expCard = card.cloneNode(true);
        expCard.dataset.item = item.batchId;
        expiringDiv.appendChild(expCard);
      }

      if (shouldNotify(item.expiryDate)) {
        notifyItem(item);
      }
    });
  }

  if (OPEN_ITEM_FROM_URL) {
    setTimeout(() => highlightItem(OPEN_ITEM_FROM_URL), 500);
  }

  // ---------- FILTER EVENTS ----------
  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      activeFilter = btn.dataset.filter;
      render();
    });
  });

  document.querySelectorAll("[data-category]").forEach(btn => {
    btn.addEventListener("click", () => {
      activeCategory = btn.dataset.category;
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

        snapshot.forEach(async doc => {
          const bill = doc.data();
          const shopCategory = await getShopCategory(bill.shopId);
          bill.items.forEach(item => {
            if (item.expiryDate) {
              cachedItems.push({
                bill,
                item,
                shopCategory
              });
            }
          });

          render();
        });
      });
  }
  function listenManualItems() {
  db.collection("manualItems")
    .where("buyerPhone", "==", CURRENT_USER_PHONE)
    .onSnapshot(snapshot => {
      snapshot.forEach(doc => {
        const item = doc.data();

        cachedItems.push({
          bill: {
            shopName: "Manual Entry"
          },
          item: {
            ...item,
            batchId: doc.id
          },
          shopCategory: item.category
        });
      });

      render();
    });
}

  // ---------- NOTIFICATION CLICK HANDLER ----------
  function highlightItem(itemKey) {
    document.querySelectorAll(".bill").forEach(card => {
      if (card.dataset.item === itemKey) {
        card.style.border = "2px solid red";
        card.scrollIntoView({ behavior: "smooth", block: "center" });

        setTimeout(() => {
          card.style.border = "";
        }, 1500);
      }
    });
  }

  if (CURRENT_USER_PHONE) {
    initFirestore();
    listenManualItems();
  }

  navigator.serviceWorker?.addEventListener("message", event => {
    if (event.data?.type === "OPEN_ITEM") {
      highlightItem(event.data.itemKey);
    }
  });

  // ---------- LOGOUT ----------
  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }
  const addManualBtn = document.getElementById("addManual");

  if (addManualBtn) {
    addManualBtn.addEventListener("click", () => {
      window.location.href = "manualItem.html";
    });
  }


  // ---------- DONATION NAV ----------
  const donationNav = document.getElementById("navDonation");

  if (donationNav) {
    donationNav.addEventListener("click", () => {
    
    const whatsappNumber = "916397733869"; 
    const message = encodeURIComponent(
      "Hello, I want to donate some items."
    );

    window.open(
      `https://wa.me/${whatsappNumber}?text=${message}`,
      "_blank"
    );
    });
  }

})();
