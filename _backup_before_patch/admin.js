// NBIU Survey Admin — no seeded/fake student records.
// Supabase integration is intentionally pending. Set these values only when connecting the project.
// Never place a Supabase service_role key in browser code.
const SUPABASE_URL = "";
const SUPABASE_ANON_KEY = "";
const SUPABASE_TABLE = "convocation_survey_responses";
const data = []; // Real records will be loaded here from Supabase after secure integration.
const $=id=>document.getElementById(id);
let page=1,selected=new Set(),detail=null;
const size=8;
const statusText={registered:"Registered",will:"Will register",undecided:"Undecided",no:"Not registering"};
const venueText={campus:"Own campus",outside:"Outside venue",either:"Either acceptable"};
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function filtered(){
 const q=$("search").value.toLowerCase().trim(),d=$("dept").value,v=$("venue").value;
 return data.filter(r=>(!q||[r.id,r.name,r.contact,r.department,r.batch].join(" ").toLowerCase().includes(q))&&(!d||r.department===d)&&(!v||r.venue===v));
}
function updateStats(){
 const total=data.length;
 const count=k=>data.filter(r=>r.venue===k).length;
 const pct=n=>total?Math.round(n/total*100):0;
 const contact=data.filter(r=>String(r.contact||"").trim()).length;
 $("statTotal").textContent=total;
 $("chartTotal").textContent=total;
 $("navCount").textContent=total;
 $("statCampus").textContent=total?`${pct(count("campus"))}%`:"—";
 $("statOutside").textContent=total?`${pct(count("outside"))}%`:"—";
 $("statContact").textContent=total?`${pct(contact)}%`:"—";
 $("statCampusNote").textContent=total?`${count("campus")} responses`:"Awaiting live responses";
 $("statOutsideNote").textContent=total?`${count("outside")} responses`:"Awaiting live responses";
 $("statContactNote").textContent=total?`${contact} responses with contact`:"Awaiting live responses";
 $("barTotal").style.width=total?"100%":"0%";
 $("barCampus").style.width=`${pct(count("campus"))}%`;
 $("barOutside").style.width=`${pct(count("outside"))}%`;
 $("barContact").style.width=`${pct(contact)}%`;
 $("legendCampus").textContent=total?`${pct(count("campus"))}%`:"—";
 $("legendOutside").textContent=total?`${pct(count("outside"))}%`:"—";
 $("legendEither").textContent=total?`${pct(count("either"))}%`:"—";
 $("chartNote").textContent=total?"Distribution calculated from loaded records.":"Connect Supabase to display real survey results.";
 const donut=$("analytics").querySelector(".donut");
 donut.style.background=total?`conic-gradient(#183e72 0 ${pct(count("campus"))}%,#8d83e4 ${pct(count("campus"))}% ${pct(count("campus")+count("outside"))}%,#e8bd59 ${pct(count("campus")+count("outside"))}% 100%)`:"conic-gradient(#e8edf4 0 100%)";
}
function render(){
 const arr=filtered(),pages=Math.max(1,Math.ceil(arr.length/size));page=Math.min(page,pages);
 const start=(page-1)*size,vis=arr.slice(start,start+size);
 $("rows").innerHTML=vis.map(r=>`<tr><td><input type="checkbox" class="check" data-id="${esc(r.id)}" ${selected.has(r.id)?"checked":""}></td><td><div class="student"><span class="student-avatar">${esc(String(r.name||"?").split(" ").map(x=>x[0]).slice(0,2).join(""))}</span><div><b>${esc(r.name)}</b><small>${esc(r.contact||"No contact provided")}</small></div></div></td><td><span class="dept-name">${esc(r.department)}</span><small class="batch">${esc(r.batch)}</small></td><td><span class="pill ${esc(r.status)}">${esc(statusText[r.status]||r.status||"Not specified")}</span></td><td><span class="pill ${esc(r.venue)}">${esc(venueText[r.venue]||r.venue||"Not specified")}</span></td><td>${esc(r.submitted||"—")}</td><td><div class="actions"><button class="iconbtn view" data-id="${esc(r.id)}" title="View details">↗</button><button class="iconbtn single" data-id="${esc(r.id)}" title="Download single response">↓</button></div></td></tr>`).join("");
 $("empty").hidden=!!vis.length;
 $("empty").textContent=data.length?"No matching responses.":"No survey responses loaded yet. Connect Supabase to display verified submissions.";
 $("showing").textContent=arr.length?`Showing ${start+1}–${Math.min(start+size,arr.length)} of ${arr.length} responses`:"Showing 0 responses";
 $("page").textContent=page;$("prev").disabled=page===1;$("next").disabled=page===pages;
 $("selected").textContent=selected.size;
 $("all").checked=vis.length>0&&vis.every(r=>selected.has(r.id));
 $("all").indeterminate=vis.some(r=>selected.has(r.id))&&!$("all").checked;
 updateStats();
}
function notify(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");clearTimeout(notify.timer);notify.timer=setTimeout(()=>t.classList.remove("show"),3500)}
function csv(records,file){
 if(!records.length){notify("No real records available to download.");return}
 const rows=[["Response ID","Full Name","Contact","Department","Batch","Registration Status","Venue Preference","Submitted","Opinion"],...records.map(r=>[r.id,r.name,r.contact,r.department,r.batch,statusText[r.status]||r.status,venueText[r.venue]||r.venue,r.submitted,r.opinion])];
 const content="\uFEFF"+rows.map(row=>row.map(x=>'"'+String(x??"").replace(/"/g,'""')+'"').join(",")).join("\r\n");
 const a=document.createElement("a"),u=URL.createObjectURL(new Blob([content],{type:"text/csv;charset=utf-8"}));a.href=u;a.download=file;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(u);notify(`Downloaded ${records.length} response(s) as CSV.`);
}
function openDetail(id){
 detail=data.find(r=>String(r.id)===String(id));if(!detail)return;
 const fields=[["Response ID",detail.id],["Full name",detail.name],["Contact",detail.contact||"Not provided"],["Department",detail.department],["Batch",detail.batch],["Registration status",statusText[detail.status]||detail.status||"Not specified"],["Preferred venue",venueText[detail.venue]||detail.venue||"Not specified"],["Submitted",detail.submitted||"—"],["Opinion / suggestions",detail.opinion||"No opinion provided"]];
 $("detail").innerHTML=fields.map(([k,v],i)=>`<div class="detail-item ${i===8?"full":""}"><label>${esc(k)}</label><p>${esc(v)}</p></div>`).join("");$("modal").hidden=false;
}
function close(){ $("modal").hidden=true;detail=null; }
$("rows").addEventListener("click",e=>{const v=e.target.closest(".view"),s=e.target.closest(".single");if(v)openDetail(v.dataset.id);if(s)csv(data.filter(r=>String(r.id)===String(s.dataset.id)),`nbiu-${s.dataset.id}.csv`)});
$("rows").addEventListener("change",e=>{if(e.target.matches(".check")){e.target.checked?selected.add(e.target.dataset.id):selected.delete(e.target.dataset.id);render()}});
$("all").addEventListener("change",()=>{const arr=filtered().slice((page-1)*size,page*size);arr.forEach(r=>$("all").checked?selected.add(String(r.id)):selected.delete(String(r.id)));render()});
["search","dept","venue"].forEach(id=>$(id).addEventListener(id==="search"?"input":"change",()=>{page=1;render()}));
$("prev").onclick=()=>{page=Math.max(1,page-1);render()};$("next").onclick=()=>{page++;render()};
$("allDownload").onclick=$("exportTop").onclick=()=>csv(data,"nbiu-full-response-sheet.csv");
$("filteredDownload").onclick=$("exportFiltered").onclick=()=>csv(filtered(),"nbiu-filtered-responses.csv");
$("selectedDownload").onclick=()=>csv(data.filter(r=>selected.has(String(r.id))),"nbiu-selected-responses.csv");
$("close").onclick=$("done").onclick=close;$("modal").addEventListener("click",e=>{if(e.target===$("modal"))close()});document.addEventListener("keydown",e=>{if(e.key==="Escape")close()});
$("singleModal").onclick=()=>{if(detail)csv([detail],`nbiu-${detail.id}.csv`)};
$("menu").onclick=()=>$("sidebar").classList.toggle("open");
document.querySelectorAll(".nav").forEach(a=>a.addEventListener("click",()=>{document.querySelectorAll(".nav").forEach(n=>n.classList.remove("active"));a.classList.add("active");$("sidebar").classList.remove("open")}));
render();
// Supabase integration will populate `data` after auth/RLS and query code are configured.
