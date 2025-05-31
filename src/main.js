
// GLOBAL VARIABLES
const url = window.location.href.replace('/rss/','').replace('index.html','')+'/routs/rss'
let lsRss={}, rssObj, rssData, rssFeeds, rssItems, lastRead, lastUpdt

// GLOBAL FUNCTIONS
const cl = (txt) => console.log(txt);
const qs = (el, parent = document) => parent.querySelector(el);
const qsAll = (el, parent = document) => [...parent.querySelectorAll(el)];
const Getls = () => JSON.parse(localStorage.getItem('lsRss'))
const Setls = () => localStorage.setItem('lsRss', JSON.stringify(lsRss))
window.onclick = function(event) { if (!event.target.matches('.dropdown-btn')) qsAll('.dropdown-content').map(i => i.classList.remove('dropdown-show')) }
const ar = [1,2,4,6,8,10,12,18,24,48]; ar.map(i => qs(".dropdown-content").innerHTML += ` <div class="drop-item border-bottom pointer px-2 py-2" onclick="Fill_Get_From(${i})">לפני ${i} שעות</div>`)

// API FUNCTIONS
const Get = async (url) => { const res = await fetch(url); const data = await res.text(); return data; } 
const Post = async (url, payload) => {
  const myHeaders = new Headers();  myHeaders.append("Content-Type", "application/json");
  const res = await fetch(url, {method: "POST", body: payload, headers: myHeaders});
  const data = await res.text(); return data;
}

// ELEMENTS FUNCTIONS
const Mask    = (pg) => qs("#"+pg).classList.toggle("mask-show")
const Toggle_SideBar = () => {
  if (window.innerWidth<800) qsAll('.box').map(i => i.classList.toggle("d-none"))
}
const GotoPage = (pg) => { qsAll('.page').map(p =>p.classList.add('page-hide')); qs('#'+pg).classList.remove('page-hide') }
const Toggle_Theme = () => {
  lsRss.theme = document.body.getAttribute("data-bs-theme")=="dark" ? "light" : "dark"
  Setls(); document.body.setAttribute("data-bs-theme", lsRss.theme); 
}

// DATA
const Get_From_Click = () => {
  qs(".dropdown-content").classList.toggle("dropdown-show");
}
const Fill_Get_From = async (i) => {
  const date = new Date(), fromTime=date.setHours(date.getHours()-i);
  rssItems = rssData.filter(i => (new Date(i.pubDate) > fromTime))
  Fill_Feeds(); Fill_Data("#rss-box",rssItems)
}
const Mark_Read = async () => {
  qs("#rss-box").innerHTML = `<div class="flex-center w-100 h-100 fs-3 gap-3"><div class="spinner-grow spinner-grow" role="status"><span class="visually-hidden"></span></div></div>`;
  const pl = {"lastRead": `${lastUpdt}`}; lsRss.lastRead = lastUpdt; Setls();
  await Post(lsRss.pantry, JSON.stringify(pl))
  rssItems = []; Fill_Feeds();
  qs("#rss-box").innerHTML = `<div class='flex-center w-100 h-100 fs-3'>אין פה מה לקרוא</div>`;
}

// FILL ELEMENTS
const Fill_Feeds = () =>{
  qs("#rss-box").innerHTML=""; qs("#rss-feeds").innerHTML=""
  for (const s of rssFeeds){
    const newFeed = document.createElement("div")
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
const Filter_Feeds = (site) => {
  Toggle_SideBar();
  const siteRss = site=="הצג הכל" ?rssItems :rssItems.filter(n => n.site==site)
  Fill_Data("#rss-box",siteRss)
}
const Fill_Data = (box,itms) => {
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

// UPDATE FEEDS
const Edit_Feeds = () => {
  Toggle_SideBar()
  qs('#json-feeds').value = JSON.stringify(rssFeeds.slice(1),undefined,2);
  GotoPage('page-feeds');
}
const Update_Json = () => {
  try{
    JSON.parse(qs('#json-feeds').value);
    qs('#json-error').classList.add('d-none'); qs('#save-feeds').classList.remove('d-none'); qs('#json-feeds').classList.remove('bg-secondary-subtle'); 
  }catch{
    qs('#json-error').classList.remove('d-none'); qs('#save-feeds').classList.add('d-none'); qs('#json-feeds').classList.add('bg-secondary-subtle');    
  }
}
const Pritify_Json = () => {
  try{
    const jsonTxt = JSON.parse(qs('#json-feeds').value)
    qs('#json-feeds').value = JSON.stringify(jsonTxt,undefined,2)
  }catch{
    alert('Json Syntex Error')
  }
}
const Save_Feeds = async () => {
  rssFeeds = JSON.parse(qs('#json-feeds').value,null,2);
  qs('#json-feeds').value = "Updating... "
  rssObj.Feeds = rssFeeds;
  const res = await Post(url+"/save-feeds", JSON.stringify(rssObj))
  if (res=='ok') {
    alert('Feeds Updated')
    qs('#json-feeds').value = JSON.stringify(rssFeeds,undefined,2);}
  else alert("server connection error")
}

// START APP
const Read_Key_File = (f) => {
  try{
    const file = f.files[0], reader=new FileReader();
    reader.readAsText(file); reader.onload=()=> { 
    const keyFile = JSON.parse(reader.result); 
    lsRss.rssData = keyFile.rssData; lsRss.rssItems = keyFile.rssItems; lsRss.pantry = keyFile.pantry; Setls(); 
    location.reload(); }}
  catch{
    alert('Key File Error') }
}
const Adapt_Mobile = () => {
  ['.sidebar', '.logo', '.bi-pencil'].forEach(i => qs(i).classList.add('d-none'));
  qs('.bi-list').classList.remove('d-none'); 
}
const Start_App = async () => {
  if(window.innerWidth < 640) Adapt_Mobile();
  if (Getls()==null) {lsRss.theme="light"; Setls()}
  lsRss = Getls(); document.body.setAttribute("data-bs-theme", lsRss.theme); 
  if (lsRss.rssItems==null) {GotoPage('page-key-file'); return}
  try{ 
    qs("#rss-box").innerHTML = `<div class="flex-center w-100 h-100 fs-3 gap-3"><div class="spinner-grow spinner-grow" role="status"><span class="visually-hidden"></span></div>מעדכן...</div>`;
    rssObj = JSON.parse(await Get(lsRss.rssItems)); 
    rssFeeds = rssObj.Feeds; rssItems = rssObj.rssItems; lastUpdt = rssObj.lastUpdt; 
    rssFeeds.unshift({ id:'0', name:'הצג הכל', url:"#"});
    if (lsRss.lastRead == lastUpdt) rssItems=[]
    Fill_Feeds(); Fill_Data("#rss-box",rssItems); GotoPage('page-main') 
    const {Data} = JSON.parse(await Get(lsRss.rssData)); rssData = Data; }
  catch { 
    qs("#rss-box").innerHTML = `<div class="flex-center w-100 h-100 fs-3">SERVER ERROR</div>` } 
}

Start_App()
