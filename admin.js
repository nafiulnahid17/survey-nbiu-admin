// NBIU Survey Admin UI — demo data only; Supabase connection will be added later.
// Configure SUPABASE_URL and SUPABASE_ANON_KEY here when ready. Never expose service_role keys.
// Protect admin access with Supabase Auth and configure Row Level Security before launch.
const SUPABASE_URL = "";
const SUPABASE_ANON_KEY = "";
const SUPABASE_TABLE = "convocation_survey_responses";
const data = [
["NB-001","Ayesha Rahman","ayesha.r@example.com","CSE","45th Batch","registered","campus","25 Oct 2026","I prefer our own campus because this is a historic moment for NBIU."],
["NB-002","Tanvir Ahmed","tanvir.a@example.com","Law","42nd Batch","will","campus","25 Oct 2026","Please consider campus capacity and accessibility."],
["NB-003","Nusrat Jahan","","BBA","43rd Batch","registered","outside","25 Oct 2026","An outside venue is fine if transport is arranged."],
["NB-004","Fahim Hasan","fahim.h@example.com","CSE","44th Batch","undecided","campus","24 Oct 2026","The ceremony should be held at our own campus if possible."],
["NB-005","Samia Sultana","samia.s@example.com","English","41st Batch","registered","either","24 Oct 2026","Safety, seating and guest facilities should be priorities."],
["NB-006","Mahmudul Islam","","EEE","40th Batch","will","campus","24 Oct 2026","Campus would make the event more memorable."],
["NB-007","Rafiul Karim","rafiul.k@example.com","Sociology","39th Batch","no","outside","23 Oct 2026","Please share venue and transport details early."],
["NB-008","Mim Akter","mim.akter@example.com","BBA","45th Batch","registered","campus","23 Oct 2026","My preference is the university campus."],
["NB-009","Sakib Hossain","sakib.h@example.com","Law","43rd Batch","will","campus","22 Oct 2026","Please allow family members to attend."],
["NB-010","Jannatul Ferdous","jannat.f@example.com","CSE","42nd Batch","undecided","either","22 Oct 2026","Both venues are okay if arrangements are suitable."],
["NB-011","Rakib Hasan","rakib.h@example.com","English","44th Batch","registered","campus","21 Oct 2026","The campus has sentimental value for graduates."],
["NB-012","Tania Islam","","EEE","41st Batch","will","outside","21 Oct 2026","An accessible hall could work if campus space is limited."]
].map(([id,name,contact,department,batch,status,venue,submitted,opinion])=>({id,name,contact,department,batch,status,venue,submitted,opinion}));
const $=id=>document.getElementById(id);let page=1,selected=new Set(),detail=null;const size=8;
const statusText={registered:"Registered",will:"Will register",undecided:"Undecided",no:"Not registering"},venueText={campus:"Own campus",outside:"Outside venue",either:"Either acceptable"};
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function filtered(){let q=$("search").value.toLowerCase().trim(),d=$("dept").value,v=$("venue").value;return data.filter(r=>(!q||[r.id,r.name,r.contact,r.department,r.batch].join(" ").toLowerCase().includes(q))&&(!d||r.department===d)&&(!v||r.venue===v))}
function render(){let arr=filtered(),pages=Math.max(1,Math.ceil(arr.length/size));page=Math.min(page,pages);let start=(page-1)*size,vis=arr.slice(start,start+size);$("rows").innerHTML=vis.map(r=>`<tr><td><input type="checkbox" class="check" data-id="${r.id}" ${selected.has(r.id)?"checked":""}></td><td><div class="student"><span class="student-avatar">${esc(r.name.split(" ").map(x=>x[0]).slice(0,2).join(""))}</span><div><b>${esc(r.name)}</b><small>${esc(r.contact||"No contact provided")}</small></div></div></td><td><span class="dept-name">${esc(r.department)}</span><small class="batch">${esc(r.batch)}</small></td><td><span class="pill ${r.status}">${statusText[r.status]}</span></td><td><span class="pill ${r.venue}">${venueText[r.venue]}</span></td><td>${r.submitted}</td><td><div class="actions"><button class="iconbtn view" data-id="${r.id}" title="View details">↗</button><button class="iconbtn single" data-id="${r.id}" title="Download single response">↓</button></div></td></tr>`).join("");$("empty").hidden=!!vis.length;$("showing").textContent=arr.length?`Showing ${start+1}–${Math.min(start+size,arr.length)} of ${arr.length} demo responses`:"No responses found";$("page").textContent=page;$("prev").disabled=page===1;$("next").disabled=page===pages;$("selected").textContent=selected.size;$("all").checked=vis.length>0&&vis.every(r=>selected.has(r.id));$("all").indeterminate=vis.some(r=>selected.has(r.id))&&!$("all").checked;}
function notify(msg){let t=$("toast");t.textContent=msg;t.classList.add("show");clearTimeout(notify.timer);notify.timer=setTimeout(()=>t.classList.remove("show"),3500)}
function csv(records,file){if(!records.length){notify("No records selected or matching.");return}let rows=[["Response ID","Full Name","Contact","Department","Batch","Registration Status","Venue Preference","Submitted","Opinion"],...records.map(r=>[r.id,r.name,r.contact,r.department,r.batch,statusText[r.status],venueText[r.venue],r.submitted,r.opinion])];let content="\uFEFF"+rows.map(row=>row.map(x=>'"'+String(x??"").replace(/"/g,'""')+'"').join(",")).join("\r\n");let a=document.createElement("a"),u=URL.createObjectURL(new Blob([content],{type:"text/csv;charset=utf-8"}));a.href=u;a.download=file;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(u);notify(`Downloaded ${records.length} demo response(s) as CSV.`)}
function openDetail(id){detail=data.find(r=>r.id===id);if(!detail)return;let fields=[["Response ID",detail.id],["Full name",detail.name],["Contact",detail.contact||"Not provided"],["Department",detail.department],["Batch",detail.batch],["Registration status",statusText[detail.status]],["Preferred venue",venueText[detail.venue]],["Submitted",detail.submitted],["Opinion / suggestions",detail.opinion]];$("detail").innerHTML=fields.map(([k,v],i)=>`<div class="detail-item ${i===8?"full":""}"><label>${esc(k)}</label><p>${esc(v)}</p></div>`).join("");$("modal").hidden=false}
function close(){ $("modal").hidden=true;detail=null }
$("rows").addEventListener("click",e=>{let v=e.target.closest(".view"),s=e.target.closest(".single");if(v)openDetail(v.dataset.id);if(s)csv(data.filter(r=>r.id===s.dataset.id),`nbiu-${s.dataset.id}.csv`)});
$("rows").addEventListener("change",e=>{if(e.target.matches(".check")){e.target.checked?selected.add(e.target.dataset.id):selected.delete(e.target.dataset.id);render()}});
$("all").addEventListener("change",()=>{let arr=filtered().slice((page-1)*size,page*size);arr.forEach(r=>$("all").checked?selected.add(r.id):selected.delete(r.id));render()});
["search","dept","venue"].forEach(id=>$(id).addEventListener(id==="search"?"input":"change",()=>{page=1;render()}));
$("prev").onclick=()=>{page=Math.max(1,page-1);render()};$("next").onclick=()=>{page++;render()};
$("allDownload").onclick=$("exportTop").onclick=()=>csv(data,"nbiu-full-response-sheet-DEMO.csv");
$("filteredDownload").onclick=$("exportFiltered").onclick=()=>csv(filtered(),"nbiu-filtered-responses-DEMO.csv");
$("selectedDownload").onclick=()=>csv(data.filter(r=>selected.has(r.id)),"nbiu-selected-responses-DEMO.csv");
$("close").onclick=$("done").onclick=close;$("modal").addEventListener("click",e=>{if(e.target===$("modal"))close()});document.addEventListener("keydown",e=>{if(e.key==="Escape")close()});$("singleModal").onclick=()=>{if(detail)csv([detail],`nbiu-${detail.id}.csv`)};
$("menu").onclick=()=>$("sidebar").classList.toggle("open");document.querySelectorAll(".nav").forEach(a=>a.addEventListener("click",()=>{document.querySelectorAll(".nav").forEach(n=>n.classList.remove("active"));a.classList.add("active");$("sidebar").classList.remove("open")}));
render();