// NBIU Convocation Survey Admin — live data only, authenticated access.
// Configure SUPABASE_URL and SUPABASE_ANON_KEY below. Never use a service_role key in browser code.
const SUPABASE_URL = "https://rkjmflothfyeiwnnvlmo.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJram1mbG90aGZ5ZWl3bm52bG1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI5NDE3MTIsImV4cCI6MjEwODUxNzcxMn0.8BIcgMukk04ByBzS96SsGg9BBHHJpmGOlvJ6iEY75pI";
const SUPABASE_TABLE = "convocation_survey";
const $ = id => document.getElementById(id);
let supabaseClient = null, data = [], page = 1, selected = new Set(), detail = null, session = null;
const size = 8;
const statusText = {registered:"Registered",will:"Will register",undecided:"Undecided",no:"Not registering"};
const venueText = {campus:"Own campus",outside:"Outside venue",either:"Either acceptable","NBIU Official Campus":"Own campus","Zilla Convocation Hall":"Outside venue","Zilla Stadium / Convocation Hall":"Outside venue","Zilla Stadium/Convocation Hall":"Outside venue","Others":"Outside venue"};
const esc = s => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function first(r, keys, fallback="") { for (const k of keys) if (r[k] !== undefined && r[k] !== null && r[k] !== "") return r[k]; return fallback; }
function normalize(row, i) {
 const rawVenue = first(row,["preferred_venue","venue_preference","venue","preferredVenue"]);
 const venueTextRaw = String(rawVenue || "");
 const venue = /campus|university/i.test(venueTextRaw) ? "campus" : /either|both|no preference/i.test(venueTextRaw) ? "either" : /hall|stadium|other|outside/i.test(venueTextRaw) ? "outside" : venueTextRaw;
 const rawStatus = String(first(row,["registration_status","registration_status_for_convocation","registration","status"],"Not specified")).toLowerCase();
 const status = /already|registered|yes/.test(rawStatus) ? "registered" : /will|plan|intend/.test(rawStatus) ? "will" : /not|no/.test(rawStatus) ? "no" : /undecided|not sure|maybe/.test(rawStatus) ? "undecided" : rawStatus;
 const directContact = first(row,["contact_value","contact","phone_or_email"]);
 const contact = directContact || [first(row,["phone","phone_number","mobile","contact_number"]), first(row,["email","email_address"])].filter(Boolean).join(" · ");
 return {id:String(first(row,["id","response_id"],i+1)),name:first(row,["full_name","name","student_name"],"Unnamed submission"),contact:contact || first(row,["contact","phone_or_email"]),department:first(row,["department","program","faculty"],"—"),batch:first(row,["batch","session","academic_batch"],"—"),status,venue,venueRaw:venueTextRaw,suggestedVenue:first(row,["suggested_venue","other_venue","venue_suggestion"]),submitted:first(row,["created_at","submitted_at","submission_date","timestamp"]),opinion:first(row,["opinion_suggestions","opinion","suggestions","comments","message"]),raw:row};
}
function notify(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");clearTimeout(notify.timer);notify.timer=setTimeout(()=>t.classList.remove("show"),3500);}
function showAuth(message="Sign in with an authorized administrator account.") {
 let el=$("authGate");
 if(!el){el=document.createElement("div");el.id="authGate";el.className="auth-gate";el.innerHTML='<form class="auth-card" id="authForm"><div class="auth-mark">N</div><p class="eyebrow">PRIVATE ADMIN WORKSPACE</p><h1>NBIU Survey Admin</h1><p class="auth-copy" id="authMessage"></p><label for="authEmail">Administrator email</label><input id="authEmail" type="email" autocomplete="username" required placeholder="admin@example.com"><label for="authPassword">Password</label><input id="authPassword" type="password" autocomplete="current-password" required placeholder="Your password"><button class="primary auth-submit" type="submit">Sign in securely</button><small>Access is restricted to accounts authorized in Supabase Auth and database policies.</small></form>';document.body.appendChild(el);$("authForm").addEventListener("submit",signIn);}
 $("authMessage").textContent=message;el.hidden=false;
}
function hideAuth(){const el=$("authGate");if(el)el.hidden=true;}
async function signIn(e){e.preventDefault();if(!supabaseClient){notify("Add the Supabase URL and anon/publishable key in admin.js first.");return;}const btn=document.querySelector(".auth-submit");btn.disabled=true;btn.textContent="Signing in…";try{const {data:result,error}=await supabaseClient.auth.signInWithPassword({email:$("authEmail").value.trim(),password:$("authPassword").value});if(error)throw error;session=result.session;hideAuth();await loadData();}catch(err){$("authMessage").textContent=err.message||"Sign-in failed.";notify("Sign-in failed. Check credentials and configuration.");}finally{btn.disabled=false;btn.textContent="Sign in securely";}}
function filtered(){const q=$("search").value.toLowerCase().trim(),d=$("dept").value,v=$("venue").value;return data.filter(r=>(!q||[r.id,r.name,r.contact,r.department,r.batch,r.suggestedVenue,r.opinion].join(" ").toLowerCase().includes(q))&&(!d||r.department===d)&&(!v||(v==="outside"?r.venue==="outside":r.venue===v)));}
function updateStats(){const total=data.length,count=k=>data.filter(r=>r.venue===k).length,pct=n=>total?Math.round(n/total*100):0,contact=data.filter(r=>String(r.contact||"").trim()).length;$("statTotal").textContent=total;$("chartTotal").textContent=total;$("navCount").textContent=total;$("statCampus").textContent=total?pct(count("campus"))+"%":"—";$("statOutside").textContent=total?pct(count("outside"))+"%":"—";$("statContact").textContent=total?pct(contact)+"%":"—";$("statCampusNote").textContent=total?count("campus")+" responses":"Awaiting live responses";$("statOutsideNote").textContent=total?count("outside")+" responses":"Awaiting live responses";$("statContactNote").textContent=total?contact+" responses with contact":"Awaiting live responses";$("barTotal").style.width=total?"100%":"0%";$("barCampus").style.width=pct(count("campus"))+"%";$("barOutside").style.width=pct(count("outside"))+"%";$("barContact").style.width=pct(contact)+"%";$("legendCampus").textContent=total?pct(count("campus"))+"%":"—";$("legendOutside").textContent=total?pct(count("outside"))+"%":"—";$("legendEither").textContent=total?pct(count("either"))+"%":"—";$("chartNote").textContent=total?"Distribution calculated from live database records.":"No responses returned by the database.";const donut=$("analytics").querySelector(".donut");donut.style.background=total?`conic-gradient(#183e72 0 ${pct(count("campus"))}%,#8d83e4 ${pct(count("campus"))}% ${pct(count("campus")+count("outside"))}%,#e8bd59 ${pct(count("campus")+count("outside"))}% 100%)`:"conic-gradient(#e8edf4 0 100%)";}
function formatDate(v){if(!v)return"—";const d=new Date(v);return Number.isNaN(d.getTime())?String(v):d.toLocaleDateString(undefined,{year:"numeric",month:"short",day:"numeric"});}
function render(){const arr=filtered(),pages=Math.max(1,Math.ceil(arr.length/size));page=Math.min(page,pages);const start=(page-1)*size,vis=arr.slice(start,start+size);$("rows").innerHTML=vis.map(r=>`<tr><td><input type="checkbox" class="check" data-id="${esc(r.id)}" ${selected.has(r.id)?"checked":""}></td><td><div class="student"><span class="student-avatar">${esc(String(r.name||"?").split(" ").map(x=>x[0]).slice(0,2).join(""))}</span><div><b>${esc(r.name)}</b><small>${esc(r.contact||"No contact provided")}</small></div></div></td><td><span class="dept-name">${esc(r.department)}</span><small class="batch">${esc(r.batch)}</small></td><td><span class="pill ${esc(r.status)}">${esc(statusText[r.status]||r.status||"Not specified")}</span></td><td><span class="pill ${esc(r.venue)}">${esc(venueText[r.venue]||r.venueRaw||r.venue||"Not specified")}</span></td><td>${esc(formatDate(r.submitted))}</td><td><div class="actions"><button class="iconbtn view" data-id="${esc(r.id)}" title="View details">↗</button><button class="iconbtn single" data-id="${esc(r.id)}" title="Download single response">↓</button><button class="iconbtn delete-response" data-id="${esc(r.id)}" title="Delete response" aria-label="Delete response">×</button></div></td></tr>`).join("");$("empty").hidden=!!vis.length;$("empty").textContent=data.length?"No matching responses.":"No responses loaded. Check the configured table and Supabase policies.";$("showing").textContent=arr.length?`Showing ${start+1}–${Math.min(start+size,arr.length)} of ${arr.length} responses`:"Showing 0 responses";$("page").textContent=page;$("prev").disabled=page===1;$("next").disabled=page===pages;$("selected").textContent=selected.size;$("all").checked=vis.length>0&&vis.every(r=>selected.has(r.id));$("all").indeterminate=vis.some(r=>selected.has(r.id))&&!$("all").checked;updateStats();}
function csv(records,file){if(!records.length){notify("No records available to download.");return;}const rows=[["Response ID","Full Name","Contact","Department","Batch","Registration Status","Venue Preference","Suggested Venue","Submitted","Opinion"],...records.map(r=>[r.id,r.name,r.contact,r.department,r.batch,statusText[r.status]||r.status,venueText[r.venue]||r.venueRaw||r.venue,r.suggestedVenue,r.submitted,r.opinion])];const content="\uFEFF"+rows.map(row=>row.map(x=>'"'+String(x??"").replace(/"/g,'""')+'"').join(",")).join("\r\n");const a=document.createElement("a"),u=URL.createObjectURL(new Blob([content],{type:"text/csv;charset=utf-8"}));a.href=u;a.download=file;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);notify(`Downloaded ${records.length} response(s) as CSV.`);}
function pdf(records,file){
 if(!records.length){notify("No records available for PDF export.");return;}
 try{
  const jsPDF=window.jspdf&&window.jspdf.jsPDF;
  if(!jsPDF)throw new Error("PDF library did not load. Check your internet connection and refresh.");
  const doc=new jsPDF({orientation:"landscape",unit:"pt",format:"a4"});
  const pw=doc.internal.pageSize.getWidth(),ph=doc.internal.pageSize.getHeight(),left=32,right=32,top=102,bottom=42,tw=pw-left-right;
  const heads=["No.","Full name","Contact","Department","Batch","Registration","Preferred venue","Suggested venue","Submitted","Opinion / suggestions"];
  const widths=[25,82,82,58,43,65,82,72,56,tw-25-82-82-58-43-65-82-72-56];
  const rows=records.map((r,i)=>[String(i+1),r.name||"-",r.contact||"-",r.department||"-",r.batch||"-",statusText[r.status]||r.status||"Not specified",venueText[r.venue]||r.venueRaw||r.venue||"Not specified",r.suggestedVenue||"-",formatDate(r.submitted),r.opinion||"-"]);
  function drawHeader(){
   const logo=document.querySelector(".brand-logo");
   try{if(logo&&logo.complete&&logo.naturalWidth)doc.addImage(logo,"JPEG",left,24,43,43);}catch(e){}
   doc.setTextColor(12,31,60);doc.setFont("helvetica","bold");doc.setFontSize(16);doc.text("NORTH BENGAL INTERNATIONAL UNIVERSITY",left+54,40);
   doc.setFont("helvetica","normal");doc.setFontSize(10);doc.setTextColor(100,112,130);doc.text("Convocation Survey - Response Report",left+54,58);
   doc.setFontSize(8);doc.text("Generated: "+new Date().toLocaleString(),pw-right,40,{align:"right"});
   doc.setDrawColor(201,164,92);doc.setLineWidth(1.2);doc.line(left,78,pw-right,78);
   let x=left;doc.setFont("helvetica","bold");doc.setFontSize(6.5);doc.setFillColor(9,26,53);doc.setDrawColor(210,218,228);doc.setTextColor(255,255,255);
   heads.forEach((h,i)=>{doc.rect(x,top,widths[i],24,"FD");doc.text(doc.splitTextToSize(h,widths[i]-6),x+3,top+9);x+=widths[i];});
   return top+24;
  }
  function drawFooter(){doc.setFont("helvetica","normal");doc.setFontSize(7.5);doc.setTextColor(120,130,145);doc.text("NBIU Convocation Survey - Confidential student information",left,ph-18);doc.text("Page "+doc.internal.getNumberOfPages(),pw-right,ph-18,{align:"right"});}
  let y=drawHeader();
  rows.forEach((row,ri)=>{
   doc.setFont("helvetica","normal");doc.setFontSize(6.2);
   const lines=row.map((v,i)=>doc.splitTextToSize(String(v==null?"-":v),Math.max(12,widths[i]-7)));
   const h=Math.max(22,...lines.map(a=>a.length*7.2+8));
   if(y+h>ph-bottom){drawFooter();doc.addPage();y=drawHeader();}
   let x=left;
   row.forEach((v,i)=>{doc.setDrawColor(224,230,238);doc.setLineWidth(.35);if(ri%2){doc.setFillColor(248,249,251);doc.rect(x,y,widths[i],h,"FD");}else doc.rect(x,y,widths[i],h,"S");doc.setTextColor(35,53,78);doc.text(lines[i],x+3,y+10);x+=widths[i];});
   y+=h;
  });
  drawFooter();doc.save(file);notify("PDF report downloaded ("+records.length+" responses).");
 }catch(err){console.error("PDF export failed:",err);notify(err.message||"PDF export failed.");}
}
async function deleteResponse(id){
 const record=data.find(r=>String(r.id)===String(id));
 if(!record){notify("Response not found. Refresh the dashboard and try again.");return;}
 if(!record.raw?.id){notify("This record has no database id field, so it cannot be safely deleted.");return;}
 if(!confirm("Permanently delete the response from "+(record.name||"this student")+"? This cannot be undone."))return;
 try{
  const {error}=await supabaseClient.from(SUPABASE_TABLE).delete().eq("id",record.raw.id);
  if(error)throw error;
  data=data.filter(r=>String(r.id)!==String(id));selected.delete(String(id));
  if(detail&&String(detail.id)===String(id))close();
  render();notify("Response deleted.");
 }catch(err){console.error("Delete response failed:",err);notify("Delete failed: "+(err.message||"Check the database DELETE policy."));}
}
function openDetail(id){detail=data.find(r=>String(r.id)===String(id));if(!detail)return;const fields=[["Response ID",detail.id],["Full name",detail.name],["Contact",detail.contact||"Not provided"],["Department",detail.department],["Batch",detail.batch],["Registration status",statusText[detail.status]||detail.status||"Not specified"],["Preferred venue",venueText[detail.venue]||detail.venueRaw||detail.venue||"Not specified"],["Suggested venue",detail.suggestedVenue||"—"],["Submitted",formatDate(detail.submitted)],["Opinion / suggestions",detail.opinion||"No opinion provided"]];$("detail").innerHTML=fields.map(([k,v],i)=>`<div class="detail-item ${i===9?"full":""}"><label>${esc(k)}</label><p>${esc(v)}</p></div>`).join("");$("modal").hidden=false;}
function close(){ $("modal").hidden=true;detail=null; }
async function loadData(){if(!supabaseClient){showAuth("Setup required: add your Supabase project URL and anon/publishable key to admin.js. Do not use a service_role key.");$("connectionStatus").textContent="Not configured";$("chartNote").textContent="Configure Supabase to load live responses.";render();return;}try{const {data:rows,error}=await supabaseClient.from(SUPABASE_TABLE).select("*").order("created_at",{ascending:false});if(error)throw error;data=(rows||[]).map(normalize);selected.clear();$("connectionStatus").textContent="Connected · live data";$("chartNote").textContent="Live records from "+SUPABASE_TABLE;render();notify("Survey data refreshed.");}catch(err){$("connectionStatus").textContent="Connection error";$("chartNote").textContent="Could not load records. Check table name and Row Level Security policies.";data=[];render();notify("Database error: "+(err.message||"Check Supabase setup"));}}
async function init(){document.querySelector(".top-right").insertAdjacentHTML("beforeend",'<button class="outline" id="refreshData">↻ Refresh</button><button class="outline" id="signOut" hidden>Sign out</button>');$("refreshData").onclick=loadData;$("signOut").onclick=async()=>{if(supabaseClient)await supabaseClient.auth.signOut();session=null;data=[];render();showAuth();$("signOut").hidden=true;};$("connectionStatus").textContent="Checking configuration";if(window.supabase?.createClient&&SUPABASE_URL&&SUPABASE_ANON_KEY){supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});const {data:auth}=await supabaseClient.auth.getSession();session=auth.session;if(session){hideAuth();$("signOut").hidden=false;await loadData();}else showAuth();supabaseClient.auth.onAuthStateChange((_event,newSession)=>{session=newSession;$("signOut").hidden=!newSession;if(newSession){hideAuth();loadData();}else showAuth();});}else{showAuth("Setup required: add your Supabase project URL and anon/publishable key to admin.js. Never use a service_role key in browser code.");$("connectionStatus").textContent="Setup required";render();}
 $("rows").addEventListener("click",e=>{const v=e.target.closest(".view"),s=e.target.closest(".single"),d=e.target.closest(".delete-response");if(v)openDetail(v.dataset.id);if(s)csv(data.filter(r=>String(r.id)===String(s.dataset.id)),`nbiu-${s.dataset.id}.csv`);if(d)deleteResponse(d.dataset.id);});
 $("rows").addEventListener("change",e=>{if(e.target.matches(".check")){e.target.checked?selected.add(String(e.target.dataset.id)):selected.delete(String(e.target.dataset.id));render();}});
 $("all").addEventListener("change",()=>{const arr=filtered().slice((page-1)*size,page*size);arr.forEach(r=>$("all").checked?selected.add(String(r.id)):selected.delete(String(r.id)));render();});
 ["search","dept","venue"].forEach(id=>$(id).addEventListener(id==="search"?"input":"change",()=>{page=1;render();}));
 $("prev").onclick=()=>{page=Math.max(1,page-1);render();};$("next").onclick=()=>{page++;render();};
 $("allDownload").onclick=() => csv(data,"nbiu-full-response-sheet.csv");$("exportTop").onclick=()=>csv(data,"nbiu-full-response-sheet.csv");$("pdfTop").onclick=()=>pdf(data,"nbiu-convocation-survey-report.pdf");$("allPdfDownload").onclick=()=>pdf(data,"nbiu-convocation-survey-report.pdf");$("filteredDownload").onclick=$("exportFiltered").onclick=()=>csv(filtered(),"nbiu-filtered-responses.csv");$("filteredPdfDownload").onclick=()=>pdf(filtered(),"nbiu-filtered-survey-report.pdf");$("selectedDownload").onclick=()=>csv(data.filter(r=>selected.has(String(r.id))),"nbiu-selected-responses.csv");
 $("close").onclick=$("done").onclick=close;$("modal").addEventListener("click",e=>{if(e.target===$("modal"))close();});document.addEventListener("keydown",e=>{if(e.key==="Escape")close();});$("singleModal").onclick=()=>{if(detail)csv([detail],`nbiu-${detail.id}.csv`);};$("menu").onclick=()=>$("sidebar").classList.toggle("open");document.querySelectorAll(".nav").forEach(a=>a.addEventListener("click",()=>{document.querySelectorAll(".nav").forEach(n=>n.classList.remove("active"));a.classList.add("active");$("sidebar").classList.remove("open");}));
}
init();
