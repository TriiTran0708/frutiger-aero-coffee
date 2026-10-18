/* Cấu hình Supabase nằm trong config.js */
const configured = !SUPABASE_URL.includes("YOUR-PROJECT") && !SUPABASE_ANON_KEY.includes("YOUR-ANON");
const sb = configured ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
const $ = id => document.getElementById(id);
const money = n => n.toLocaleString("vi-VN") + " ₫";

/* ===== 2. AUTH ===== */
let mode = "in";
if (!configured) $("cfgWarn").classList.remove("hidden");

function setMode(m){
  mode = m;
  const up = m === "up";
  $("tabIn").classList.toggle("on", !up); $("tabUp").classList.toggle("on", up);
  $("nameWrap").classList.toggle("hidden", !up); $("confirmWrap").classList.toggle("hidden", !up);
  $("authTitle").textContent = up ? "Tạo tài khoản" : "Chào mừng trở lại";
  $("authSub").textContent = up ? "Đăng ký để quản lý quán của bạn." : "Đăng nhập để vào trang quản lý.";
  $("authBtn").textContent = up ? "Đăng ký" : "Đăng nhập";
  $("password").autocomplete = up ? "new-password" : "current-password";
  showMsg("");
}
function showMsg(t, type="err"){
  const el = $("authMsg");
  el.textContent = t; el.className = "msg " + type + (t ? "" : " hidden");
}
$("tabIn").onclick = () => setMode("in");
$("tabUp").onclick = () => setMode("up");

$("authBtn").onclick = async () => {
  const email = $("email").value.trim(), password = $("password").value;
  if (!sb) return showMsg("Chưa cấu hình Supabase URL và anon key.");
  if (!email || !password) return showMsg("Vui lòng nhập email và mật khẩu.");
  if (password.length < 6) return showMsg("Mật khẩu cần tối thiểu 6 ký tự.");
  $("authBtn").disabled = true;
  try {
    if (mode === "up") {
      if (password !== $("confirm").value) throw new Error("Mật khẩu nhập lại không khớp.");
      const { data, error } = await sb.auth.signUp({ email, password, options: { data: { full_name: $("fullName").value.trim() } } });
      if (error) throw error;
      if (data.session) return; // đã đăng nhập, onAuthStateChange sẽ chuyển trang
      showMsg("Đăng ký thành công. Kiểm tra email để xác nhận, sau đó đăng nhập.", "ok");
      setMode("in"); showMsg("Đăng ký thành công. Kiểm tra email để xác nhận, sau đó đăng nhập.", "ok");
    } else {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
    }
  } catch (e) {
    showMsg(e.message === "Invalid login credentials" ? "Email hoặc mật khẩu không đúng." : e.message);
  } finally { $("authBtn").disabled = false; }
};
$("logoutBtn").onclick = () => sb && sb.auth.signOut();

function render(session){
  const on = !!session;
  $("authView").classList.toggle("hidden", on);
  $("appView").classList.toggle("hidden", !on);
  if (on) {
    const u = session.user;
    $("who").textContent = (u.user_metadata?.full_name || "Chủ quán") + " · " + u.email;
    startLive();
  } else stopLive();
}
if (sb) {
  sb.auth.getSession().then(({ data }) => render(data.session));
  sb.auth.onAuthStateChange((_e, session) => render(session));
}

/* ===== 3. DỮ LIỆU MẪU (thay bằng bảng Supabase khi mở rộng) ===== */
const colors = ["#8a5a3c","#e8a13a","#19a974","#e0584f","#2fa8e8","#a07cb0"];
let products = [
  {name:"Cà phê sữa đá",price:29000,cat:"Cà phê"},{name:"Bạc xỉu",price:32000,cat:"Cà phê"},
  {name:"Americano",price:35000,cat:"Cà phê"},{name:"Trà đào cam sả",price:42000,cat:"Trà"},
  {name:"Sinh tố bơ",price:45000,cat:"Sinh tố"},{name:"Bánh croissant",price:38000,cat:"Bánh"}
];
let orders = [], seq = 1000;
const hours = [8,9,10,11,12,13,14,15];
let hourly = [180,260,340,290,420,310,230,270];
const customers = [
  {name:"Nguyễn Minh Anh",phone:"0901 234 567",orders:42},{name:"Trần Quốc Bảo",phone:"0912 345 678",orders:27},
  {name:"Lê Thu Hà",phone:"0933 456 789",orders:15},{name:"Phạm Gia Huy",phone:"0977 111 222",orders:6}
];
const tier = o => o >= 40 ? "Vàng" : o >= 20 ? "Bạc" : o >= 10 ? "Đồng" : "Mới";
const label = {new:"Mới",making:"Đang pha",done:"Hoàn thành"};

function addOrder(prodIdx, qty, cus){
  const p = products[prodIdx]; if (!p) return;
  orders.unshift({id:"#"+(++seq), cus:cus||"Khách lẻ", item:p.name+" ×"+qty, total:p.price*qty, status:"new"});
  orders = orders.slice(0,30); renderAll();
}
function renderAll(){
  const total = orders.reduce((s,o)=>s+o.total,0) + 3200000;
  $("sRev").textContent = money(total);
  $("sOrd").textContent = orders.length + 86;
  $("sMaking").textContent = orders.filter(o=>o.status==="making").length;
  $("sCus").textContent = customers.length + 128;
  const row = (o,act) => `<tr><td>${o.id}</td>${act?`<td>${o.cus}</td>`:""}<td>${o.item}</td><td>${money(o.total)}</td><td><span class="tag t-${o.status}">${label[o.status]}</span></td>${act?`<td>${o.status!=="done"?`<button class="small-btn" data-adv="${o.id}">${o.status==="new"?"Pha chế":"Xong"}</button>`:""}</td>`:""}</tr>`;
  $("recent").innerHTML = orders.slice(0,5).map(o=>row(o,false)).join("") || `<tr><td colspan="4">Chưa có đơn. Đơn mới sẽ hiện ở đây.</td></tr>`;
  $("orderRows").innerHTML = orders.map(o=>row(o,true)).join("") || `<tr><td colspan="6">Chưa có đơn. Tạo đơn đầu tiên ở phía trên.</td></tr>`;
  const max = Math.max(...hourly);
  $("bars").innerHTML = hourly.map((v,i)=>`<div style="height:${v/max*100}%" title="${v}k"><span>${hours[i]}h</span></div>`).join("");
  $("prodGrid").innerHTML = products.map((p,i)=>`<div class="panel prod"><div class="swatch" style="background:${colors[i%colors.length]}"></div><h4>${p.name}</h4><p>${p.cat} · ${money(p.price)}</p><button class="small-btn" data-del="${i}" style="margin-top:8px">Xóa</button></div>`).join("");
  $("oProd").innerHTML = products.map((p,i)=>`<option value="${i}">${p.name} (${money(p.price)})</option>`).join("");
  $("cusRows").innerHTML = customers.map(c=>`<tr><td>${c.name}</td><td>${c.phone}</td><td>${c.orders}</td><td>${c.orders*10}</td><td>${tier(c.orders)}</td></tr>`).join("");
}
document.addEventListener("click", e => {
  const a = e.target.dataset;
  if (a.adv){ const o = orders.find(x=>x.id===a.adv); o.status = o.status==="new"?"making":"done"; renderAll(); }
  if (a.del){ products.splice(+a.del,1); renderAll(); }
});
$("oAdd").onclick = () => { addOrder(+$("oProd").value, Math.max(1,+$("oQty").value||1), $("oCus").value.trim()); $("oCus").value=""; };
$("pAdd").onclick = () => {
  const name = $("pName").value.trim(), price = +$("pPrice").value;
  if (!name || price <= 0) return;
  products.push({name,price,cat:$("pCat").value}); $("pName").value=""; $("pPrice").value=""; renderAll();
};

/* Mô phỏng dữ liệu thời gian thực. Thực tế dùng sb.channel("orders").on("postgres_changes", ...) */
let timer = null;
function startLive(){
  if (timer) return;
  renderAll();
  timer = setInterval(() => {
    const names = ["Khách lẻ","Bàn 3","Bàn 7","Mang đi"];
    addOrder(Math.floor(Math.random()*products.length), 1+Math.floor(Math.random()*2), names[Math.floor(Math.random()*names.length)]);
    hourly[hourly.length-1] += 30 + Math.floor(Math.random()*40); renderAll();
  }, 7000);
}
function stopLive(){ clearInterval(timer); timer = null; }

/* ===== 4. ĐIỀU HƯỚNG ===== */
const titles = {overview:"Tổng quan",orders:"Đơn hàng",products:"Sản phẩm / Menu",customers:"Khách hàng",payments:"Thanh toán & Mở rộng"};
document.querySelectorAll(".nav").forEach(b => b.onclick = () => {
  document.querySelectorAll(".nav").forEach(x=>x.classList.toggle("on",x===b));
  document.querySelectorAll(".page").forEach(p=>p.classList.add("hidden"));
  $("p-"+b.dataset.page).classList.remove("hidden");
  $("pageTitle").textContent = titles[b.dataset.page];
});
renderAll();
