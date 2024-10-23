// deno-lint-ignore-file no-window
// if ('serviceWorker' in navigator) {
//   navigator.serviceWorker.register("./sw.js")
//   .then((reg) => console.log("sw Registred", reg))
//   .catch((err) => console.log ("sw NOT Registred !", err));
// }

// GLOBAL VARIABLES
let rssObj, lsRss={}, rssData, rssFeeds, rssItems, lastRead, readAll, url, showRead

// GLOBAL FUNCTIONS
const cl = (txt) => console.log(txt);
const qs = (el, parent = document) => parent.querySelector(el);
const qsAll = (el, parent = document) => [...parent.querySelectorAll(el)];
const Getls = (ls) => JSON.parse(localStorage.getItem(ls))
const Setls = (ls) => localStorage.setItem(ls, JSON.stringify(lsRss))
window.onclick = function(event) { if (!event.target.matches('.dropdown-btn')) qsAll('.dropdown-content').map(i => i.classList.remove('dropdown-show')) }

// API FUNCTIONS
const Get = async (url) => { const res = await fetch(url); const data = await res.json(); return data; } 
const Post = async (url, payload) => {
  const myHeaders = new Headers(); myHeaders.append("Content-Type", "application/json");
  await fetch(url, {method: "POST", body: JSON.stringify(payload), headers: myHeaders});
}
const Put = async (url, payload) => {
  const myHeaders = new Headers(); myHeaders.append("Content-Type", "application/json");
  await fetch(url, {method: "PUT", body: JSON.stringify(payload), headers: myHeaders});
}
const Delete = async(url, key) => { let res = await Get(url);  delete res[key]; await Post(url, res);}

// ELEMENTS FUNCTIONS
const Mask    = (pg) => qs("#"+pg).classList.toggle("mask-show")
const SideBar = () => {Mask("sidebar"); qs(".sidebar").classList.toggle("sidebar-show");}
const Goto_Page = (pg) => { qsAll('.pg').map(p =>p.classList.add('page-hide')); qs('#'+pg).classList.remove('page-hide') }

// START APP
Start_App()
async function Start_App(){
  [1,2,4,6,8,10,12,18,24,48].map(i => qs(".dropdown-content").innerHTML += `
    <div class="drop-item border-bottom pointer px-2 py-2" onclick="_Get_Items_From_Time(${i})">לפני ${i} שעות</div>`)
  if (Getls("lsRss")==null) {lsRss.theme="dark"; lsRss.url=""; Setls('lsRss')}
  lsRss = Getls('lsRss'); url = lsRss.url; document.body.setAttribute("data-bs-theme", lsRss.theme); 
  try{ 
    qs("#rss-box").innerHTML = `<div class="flex-center flex-grow-1 gap-2 w-100"><div class="spinner-grow spinner-grow" role="status"><span class="visually-hidden"></span></div>מעדכן...</div>`;
    rssObj = await Get(url); Get_Data(); Goto_Page('page-main') }
  catch{ Goto_Page('page-login')
  }
}
function _Read_Key_File(f){
  const file = f.files[0], reader = new FileReader(); reader.readAsText(file);
  reader.onload = () => {
    const pKey = reader.result;
    url=`https://getpantry.cloud/apiv1/pantry/${pKey}/basket/rss`;
    lsRss.url = url; Setls('lsRss'); location.reload();}
}
function _Theme_Toggle() {
  lsRss.theme = document.body.getAttribute("data-bs-theme")=="dark" ? "light" : "dark"
  Setls(); document.body.setAttribute("data-bs-theme", lsRss.theme); 
}

// DATA
function Get_Data(){
  readAll = new Date(); lastRead=rssObj.lastRead; rssFeeds=rssObj.feeds; rssData=rssObj.data
  rssFeeds.unshift({ id:'0', name:'הצג הכל', url:"#"});
  rssItems = rssData.filter (i => new Date(i.pubDate) > new Date(lastRead));
  Fill_Feeds(); Fill_Data("#rss-box",rssItems);
}
function _Get_From_Click() {
  qs(".dropdown-content").classList.toggle("dropdown-show");
}
function _Get_Items_From_Time(i){
  const date = new Date(), fromTime=date.setHours(date.getHours()-i);
  rssItems = rssData.filter (i => new Date(i.pubDate) > fromTime);
  Fill_Feeds(); Fill_Data("#rss-box",rssItems)
}
function _Mark_Read_All(){
  Put(url, {lastRead:rssObj.lastUpdt})
  rssItems = []; Fill_Feeds()
  qs("#rss-box").innerHTML = `<div class='flex-center w-100 h-100 fs-3'>אין פה מה לקרוא</div>`;
}

// FILL ELEMENTS
function Fill_Feeds(){
  qs("#rss-box").innerHTML=""; qs("#rss-feeds").innerHTML=""
  for (s of rssFeeds){
    const newFeed = document.createElement("div")
    let feedCount = s.name=="הצג הכל" ?rssItems.length :rssItems.filter(n => n.site==s.name).length
    feedCount = feedCount==0 ?"" :feedCount
    newFeed.innerHTML = `
    <div class="d-flex pointer" onclick="_Filter_Feeds('${s.name}')">
      <span class="flex-grow-1">${s.name}</span>
      <small class="px-4 text-left text-danger small">${feedCount}</small>
    </div>`
    qs("#rss-feeds").appendChild(newFeed)
  }
}
function _Filter_Feeds(site){
  SideBar()
  siteRss = site=="הצג הכל" ?rssItems :rssItems.filter(n => n.site==site)
  Fill_Data("#rss-box",siteRss)
}
function Fill_Data(box,itms){
  qs(box).innerHTML = "";
  if (itms.length==0) 
    return qs(box).innerHTML = `<div class='flex-center w-100 h-100 fs-3'>אין פה מה לקרוא</div>`
  scrollTo({top: 0});
  itms.map((itm,i) =>{
    const newItem = document.createElement("div")
    const tmpDiv = document.createElement("div"); tmpDiv.innerHTML = itm.description;
    const rText = tmpDiv.innerText;
    const rDate = new Date(itm.pubDate).toLocaleString('he-IL',{dateStyle:"short", timeStyle:"short"})
    if (qs("img",tmpDiv)!=null && qs("img",tmpDiv).getAttribute('src')!="") rImg = qs("img",tmpDiv).getAttribute('src')
      else rImg = "";
    newItem.innerHTML = qs("#new-item").innerHTML.replaceAll("~i~",i).replace("~Link~",itm.link).replace("~Title~",itm.title).replace("~Date~",rDate).replace("~Site~",itm.site).replace("~Text~",rText).replaceAll("~Img~",rImg);
    qs(box).appendChild(newItem)
    if (qs(`#new-item-${i}`).offsetWidth < 600) 
      { qs(`#ti-${i}`).classList.remove('d-none'); qs(`#si-${i}`).classList.add('d-none'); }
    if (rImg=="") qs(`#si-${i}`).classList.add('invisable')
  })
}

// ADD FEED
function _Add_Feed_Show(){
  SideBar(); 
  // Modal('new-feed-modal')
  // qs("#preview-box").innerHTML = ""; Mask('new-feed-modal'); qs("#new-feed-body").classList.toggle("modal-show"); 
}
