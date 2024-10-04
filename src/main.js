// if ('serviceWorker' in navigator) {
//   navigator.serviceWorker.register("./sw.js")
//   .then((reg) => console.log("sw Registred", reg))
//   .catch((err) => console.log ("sw NOT Registred !", err));
// }

var hostName, lsRss, rssData, rssItems, lastRead, lastUpdt, showRead
// const hostName = (document.location.href).replace('index.html','');
// hostName="https://127.0.0.1:24157/rss"
GlobalFn(); ElementsFn(); StartApp()

function GlobalFn(){
  cl = (txt) => console.log(txt);
  qs = (el, parent = document) => parent.querySelector(el);
  qsAll = (el, parent = document) => [...parent.querySelectorAll(el)];
  Getls = () => JSON.parse(localStorage.getItem('lsRss'))
  Setls = () => localStorage.setItem('lsRss', JSON.stringify(lsRss))
  IsWindows = () => navigator.userAgentData.platform == "Windows"
  window.onclick = function(event) { if (!event.target.matches('.dropdown-btn')) qsAll('.dropdown-content').map(i => i.classList.remove('dropdown-show')) }
}
function ElementsFn(){
  Mask    = (pg) => qs("#"+pg).classList.toggle("mask-show")
  Modal   = (tmpltId='foo') => {Mask('Modal'); qs('.Modal').classList.toggle('modal-show'); qs('.Modal').innerHTML=qs('#'+tmpltId).innerHTML}
  Action  = (tmpltId="foo") => {Mask("action"); qs(".action").classList.toggle("action-show"); qs(".action").innerHTML=qs("#"+tmpltId).innerHTML}
  SideBar = (tmpltId="foo") => {Mask("sidebar"); qs(".sidebar").classList.toggle("sidebar-show");}
  Msgbox  = (title="msgbox title",txt="msgbox txt") => { Mask('msgbox'); qs(".msgbox").classList.toggle("msgbox-show"); qs(".msgbox").classList.remove('text-danger'); qs("#msgbox-title").innerHTML=title; qs("#msgbox-body").innerHTML=txt; }
  Warning = (title="msgbox title",txt="msgbox txt") => { Mask('msgbox'); qs(".msgbox").classList.toggle("msgbox-show"); qs(".msgbox").classList.add('text-danger'); qs("#msgbox-title").innerHTML=title; qs("#msgbox-body").innerHTML=txt; }
  Toast   = (txt) => {qs(".toast-msg").innerHTML = txt; qs(".toast-box").classList.toggle("toast-show"); setTimeout(() => qs(".toast-box").classList.toggle("toast-show"), 2000); } 
  Goto_Page = (pg) => {pages.map(p => qs('#'+p).classList.add('page-hide')); qs('#'+pg).classList.remove('page-hide') }
  Update_Full_Screen_Icon = () => {
    if(document.fullscreenElement) qsAll('.bi-arrows-fullscreen').map(i => i.classList.add('bi-fullscreen-exit'))
    else qsAll('.bi-arrows-fullscreen').map(i => i.classList.remove('bi-fullscreen-exit'))
  }
  Toggle_Full_Screen = () => { 
    if(document.fullscreenElement) {document.exitFullscreen(); Update_Full_Screen_Icon()}
    else {document.body.requestFullscreen(); Update_Full_Screen_Icon()}
  }
}

// START APP
async function StartApp(){ 
  [1,2,4,6,8,10,12,18,24,48].map(i => qs(".dropdown-content").innerHTML += `
    <div class="drop-item border-bottom pointer px-2 py-2" onclick="Get_Items_From_Time(${i})">לפני ${i} שעות</div>`)
  if (localStorage.getItem("lsRss")==null){ lsRss={};lsRss.theme="dark"; lsRss.hostName=""; Setls() }
  lsRss = Getls(); document.body.setAttribute("data-bs-theme", lsRss.theme);
  if(lsRss.hostName=="") {let hostNm = prompt('enter hostname'); hostName = "http://"+hostNm+"/rss"; }
  else hostName = lsRss.hostName
  try {
    let req = await axios.get(hostName+'/check-host-name');
    let res = await req.status;
    if( res == 200){ lsRss.hostName = hostName; Setls(); Get_Data('/get-data'); } 
  } catch {
    alert ('wrong host name'); return;
  }
}
function Theme_Toggle() {
  lsRss.theme = document.body.getAttribute("data-bs-theme")=="dark" ? "light" : "dark"
  Setls();
  document.body.setAttribute("data-bs-theme", lsRss.theme); 
}

// DATA 
async function Get_Data(route){
  let req = await axios.get(hostName+route)
  let res = await req.data
  rssItems=res.items; rssFeeds=res.feeds; lastRead=res.lastRead; lastUpdt=res.lastUpdt;
  rssFeeds.unshift({ id:'0', name:'הצג הכל', url:"#"});
  lsRss.hostName = hostName
  Setls(); Fill_Feeds(); Fill_Data("#rss-box",rssItems);
}

function Refresh_Data(){
  qs("#rss-box").innerHTML = `<div class="flex-center flex-grow-1 gap-2 w-100"><div class="spinner-grow spinner-grow" role="status"><span class="visually-hidden"></span></div>מעדכן...</div>`;
  Get_Data('/get-data');
}
function Get_From_Time_Click() {
  qs(".dropdown-content").classList.toggle("dropdown-show");
}
async function Get_Items_From_Time(i){
  let date = new Date(), fromTime=date.setHours(date.getHours()-i);
  let req = await axios.post(hostName+'/get-from-time',{fromTime:fromTime})
  let res = await req.data
  rssItems= await res.items; rssFeeds=res.feeds; lastRead=res.lastRead; lastUpdt=res.lastUpdt;
  Fill_Feeds(); Fill_Data("#rss-box",rssItems)
}
function Mark_Read_All(){
  axios.get(hostName+'/mark-read-all')
  Fill_Feeds()
  qs("#rss-box").innerHTML = `<div class='flex-center w-100 h-100 fs-3'>אין פה מה לקרוא</div>`;
}
function Fill_Feeds(){
  qs("#rss-box").innerHTML=""; qs("#rss-feeds").innerHTML=""
  for (s of rssFeeds){
    let newFeed = document.createElement("div")
    let feedCount = s.name=="הצג הכל" ?rssItems.length :rssItems.filter(n => n.site==s.name).length
    feedCount = feedCount==0 ?"" :feedCount
    newFeed.innerHTML = `
    <div class="d-flex pointer" onclick="Filter_Feeds('${s.name}')">
      <span class="flex-grow-1">${s.name}</span>
      <small class="px-4 text-left text-danger small">${feedCount}</small>
    </div>`
    qs("#rss-feeds").appendChild(newFeed)
  }
}
function Filter_Feeds(site){
  SideBar()
  siteRss = site=="הצג הכל" ?rssItems :rssItems.filter(n => n.site==site)
  Fill_Data("#rss-box",siteRss)
}
function Fill_Data(box,itms){
  qs(box).innerHTML = "";
  if (itms.length==0) 
    return qs(box).innerHTML = `<div class='flex-center w-100 h-100 fs-3'>אין פה מה לקרוא</div>`
  scrollTo({top: 0});
  titleColor = showRead==true ?"text-secondary-emphasis" :"";
  itms.map((itm,i) =>{
    let newItem = document.createElement("div")
    let tmpDiv = document.createElement("div"); tmpDiv.innerHTML = itm.description;
    let rText = tmpDiv.innerText;
    let rDate = new Date(itm.pubDate).toLocaleString('he-IL',{dateStyle:"short", timeStyle:"short"})
    if (qs("img",tmpDiv)!=null && qs("img",tmpDiv).getAttribute('src')!="") rImg = qs("img",tmpDiv).getAttribute('src')
      else rImg = "";
    newItem.innerHTML = qs("#new-item").innerHTML.replaceAll("~i~",i).replace("~Color~",titleColor).replace("~Link~",itm.link).replace("~Title~",itm.title).replace("~Date~",rDate).replace("~Site~",itm.site).replace("~Text~",rText).replaceAll("~Img~",rImg);
    qs(box).appendChild(newItem)
    if (qs(`#new-item-${i}`).offsetWidth < 600) 
      { qs(`#ti-${i}`).classList.remove('d-none'); qs(`#si-${i}`).classList.add('d-none'); }
    if (rImg=="") qs(`#si-${i}`).classList.add('invisable')
  })
}

// ADD FEED
function Add_Feed_Show(){
  SideBar(); Modal('new-feed-modal')
  // qs("#preview-box").innerHTML = ""; Mask('new-feed-modal'); qs("#new-feed-body").classList.toggle("modal-show"); 
}
function Preview_Feed(){
  let feedUrl = qs("#feed-url").value;
  if (feedUrl=="") return alert("נא להזין כתובת פיד")
  qs("#preview-box").innerHTML = `<div class="flex-center gap-3" style="height:100%"><div class="spinner-grow spinner-grow-sm" role="status"><span class="visually-hidden"></span></div>מעדכן...</div>`;
  axios.post(hostName+'preview', {url:feedUrl})
    .then((res) => {qs('#add-feed-confirm').disabled=false; Fill_Data("#preview-box",res.data)})
    .catch(() => {qs("#preview-box").innerHTML = "<h4 class='flex-center text-center text-danger pt-4'>ארעה שגיאה<br><br>בדוק כתובת פיד</h4>"});
  }
function Add_Feed_Confirm(){
  let feedName=qs("#feed-name").value, feedUrl = qs("#feed-url").value, id=rssFeeds.length; 
  qs('#add-feed-confirm').disabled=true;
  rssFeeds.shift(); rssFeeds.push({id:id, name:feedName, url:feedUrl})
  axios.post(hostName+'add-feed',{feeds:JSON.stringify(rssFeeds)})
  .then (() => {qs("#preview-box").innerHTML = "<h4 class='text-center text-success pt-4'>הפיד נוסף בהצלחה</h4>"; Refresh_Data()})
}

// function SideBar(){
//   Mask('side-bar'); qs(".sidebar").classList.toggle("sidebar-show"); 
// }

