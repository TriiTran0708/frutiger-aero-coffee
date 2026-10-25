const MENU = [
  {id:"latte",name:"Cà phê sữa đá",category:"Cà phê",price:29000,image:"https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=85"},
  {id:"bac-xiu",name:"Bạc xỉu",category:"Cà phê",price:32000,image:"https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=900&q=85"},
  {id:"americano",name:"Americano",category:"Cà phê",price:35000,image:"https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=900&q=85"},
  {id:"peach-tea",name:"Trà đào cam sả",category:"Trà",price:42000,image:"https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=900&q=85"},
  {id:"avocado",name:"Sinh tố bơ",category:"Sinh tố",price:45000,image:"https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=900&q=85"},
  {id:"croissant",name:"Bánh croissant",category:"Bánh",price:38000,image:"https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=900&q=85"}
];
const ORDER_KEY = "coffee_customer_orders";
const CART_KEY = "coffee_customer_cart";
const $ = id => document.getElementById(id);
const money = value => Number(value).toLocaleString("vi-VN") + " ₫";
const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[char]));
const normalizePhone = value => value.replace(/[\s()-]/g, "");
const readJSON = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; }
  catch { return fallback; }
};
let cart = readJSON(CART_KEY, {});
let activeCategory = "Tất cả";

function saveCart(){ localStorage.setItem(CART_KEY, JSON.stringify(cart)); }
function readOrders(){ return readJSON(ORDER_KEY, []); }
function renderCategories(){
  const categories = ["Tất cả", ...new Set(MENU.map(item => item.category))];
  $("categoryFilter").innerHTML = categories.map(category => `<button type="button" class="${category === activeCategory ? "active" : ""}" data-category="${escapeHTML(category)}">${escapeHTML(category)}</button>`).join("");
}
function renderMenu(){
  const items = MENU.filter(item => activeCategory === "Tất cả" || item.category === activeCategory);
  $("customerProducts").innerHTML = items.map(item => `<article class="menu-item"><img src="${item.image}" alt="${escapeHTML(item.name)}" loading="lazy"><div class="menu-item-content"><div class="menu-item-top"><div><h3>${escapeHTML(item.name)}</h3><p class="menu-category">${escapeHTML(item.category)}</p></div></div><div class="menu-item-bottom"><span class="menu-price">${money(item.price)}</span><button class="add-to-cart" type="button" data-add="${item.id}" aria-label="Thêm ${escapeHTML(item.name)} vào giỏ">+</button></div></div></article>`).join("");
}
function renderCart(){
  const entries = Object.entries(cart).filter(([, quantity]) => Number(quantity) > 0);
  const count = entries.reduce((sum, [, quantity]) => sum + Number(quantity), 0);
  const total = entries.reduce((sum, [id, quantity]) => sum + (MENU.find(item => item.id === id)?.price || 0) * Number(quantity), 0);
  $("cartCount").textContent = count;
  $("cartTotalCount").textContent = `${count} món`;
  $("cartTotal").textContent = money(total);
  $("placeOrderBtn").disabled = count === 0;
  $("cartItems").innerHTML = entries.length ? entries.map(([id, quantity]) => {
    const item = MENU.find(product => product.id === id);
    if (!item) return "";
    return `<div class="cart-row"><div><div class="cart-row-name">${escapeHTML(item.name)}</div><div class="cart-row-price">${money(item.price * quantity)}</div></div><div class="quantity-control"><button type="button" data-decrease="${id}" aria-label="Giảm ${escapeHTML(item.name)}">−</button><span>${quantity}</span><button type="button" data-increase="${id}" aria-label="Tăng ${escapeHTML(item.name)}">+</button></div></div>`;
  }).join("") : `<p class="empty-note">Chưa có món nào. Chọn món từ thực đơn để bắt đầu.</p>`;
}
function renderTracking(phone){
  const orders = readOrders().filter(order => normalizePhone(order.customerPhone || "") === normalizePhone(phone)).sort((a,b) => b.createdAt - a.createdAt);
  $("trackingResults").innerHTML = orders.length ? orders.map(order => {
    const step = order.status === "done" ? 2 : order.status === "making" ? 1 : 0;
    const status = order.status === "done" ? "Hoàn thành" : order.status === "making" ? "Đang pha chế" : "Đã tiếp nhận";
    const items = (order.items || []).map(item => `${escapeHTML(item.name)} × ${item.quantity}`).join(", ");
    return `<article class="tracked-order"><div class="tracked-order-head"><span>${escapeHTML(order.id)}</span><span class="order-status ${order.status === "new" ? "" : order.status}">${status}</span></div><p>${new Date(order.createdAt).toLocaleString("vi-VN")}</p><p>${items}</p><p><strong>${money(order.total)}</strong></p><div class="order-progress" aria-label="Tiến độ đơn hàng">${[0,1,2].map(index => `<span class="${index <= step ? "active" : ""}"></span>`).join("")}</div></article>`;
  }).join("") : `<p class="empty-note">Chưa tìm thấy đơn hàng với số điện thoại này.</p>`;
}

$("categoryFilter").addEventListener("click", event => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  activeCategory = button.dataset.category;
  renderCategories(); renderMenu();
});
$("customerProducts").addEventListener("click", event => {
  const button = event.target.closest("[data-add]");
  if (!button) return;
  cart[button.dataset.add] = (Number(cart[button.dataset.add]) || 0) + 1;
  saveCart(); renderCart();
});
$("cartItems").addEventListener("click", event => {
  const button = event.target.closest("[data-increase], [data-decrease]");
  if (!button) return;
  const id = button.dataset.increase || button.dataset.decrease;
  cart[id] = (Number(cart[id]) || 0) + (button.dataset.increase ? 1 : -1);
  if (cart[id] <= 0) delete cart[id];
  saveCart(); renderCart();
});
$("checkoutForm").addEventListener("submit", event => {
  event.preventDefault();
  const name = $("customerName").value.trim();
  const phone = normalizePhone($("customerPhone").value);
  if (!name || !/^(0\d{9}|\+84\d{9})$/.test(phone)) {
    $("checkoutMessage").textContent = "Vui lòng nhập tên và số điện thoại hợp lệ (10 số hoặc +84).";
    return;
  }
  const items = Object.entries(cart).map(([id, quantity]) => {
    const item = MENU.find(product => product.id === id);
    return item ? {id:item.id,name:item.name,quantity:Number(quantity),price:item.price} : null;
  }).filter(Boolean);
  if (!items.length) return;
  const order = {id:`CF-${Date.now().toString(36).toUpperCase()}`,customerName:name,customerPhone:phone,items,total:items.reduce((sum,item) => sum + item.price * item.quantity, 0),status:"new",createdAt:Date.now()};
  const orders = readOrders();
  orders.push(order);
  localStorage.setItem(ORDER_KEY, JSON.stringify(orders));
  cart = {};
  saveCart(); renderCart();
  $("checkoutMessage").textContent = `Đã nhận đơn ${order.id}. Bạn có thể theo dõi bằng số điện thoại này.`;
  $("trackingPhone").value = phone;
  renderTracking(phone);
  document.querySelector("#tracking").scrollIntoView({behavior:"smooth",block:"center"});
});
$("trackingForm").addEventListener("submit", event => {
  event.preventDefault();
  const phone = normalizePhone($("trackingPhone").value.trim());
  if (phone) renderTracking(phone);
});
window.addEventListener("storage", event => {
  if (event.key === ORDER_KEY && $("trackingPhone").value) renderTracking($("trackingPhone").value);
});
renderCategories(); renderMenu(); renderCart();