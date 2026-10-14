"use client";
import {useState} from "react";
export function ContactForm(){
 const [s,setS]=useState<"idle"|"sending"|"ok"|"err">("idle");
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setS("sending");
  const r=await fetch("/api/contact",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(Object.fromEntries(new FormData(e.currentTarget)))});
  setS(r.ok?"ok":"err");}
 const f="w-full bg-panel border border-white/10 px-4 py-3 focus:border-red";
 return <form onSubmit={submit} className="grid gap-5 max-w-xl">
  <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden/>
  <label>Name<input required name="name" maxLength={80} className={f}/></label>
  <label>Email<input required type="email" name="email" maxLength={120} className={f}/></label>
  <label>Project type<select name="projectType" className={f}><option>Short-form</option><option>YouTube</option><option>Promotional</option><option>Cinematic / Event</option></select></label>
  <label>Estimated budget (optional)<input name="budget" maxLength={40} className={f}/></label>
  <label>Project description<textarea required name="description" rows={5} minLength={10} maxLength={2000} className={f}/></label>
  <label>Preferred deadline (optional)<input name="deadline" type="date" className={f}/></label>
  <button disabled={s==="sending"} className="bg-red px-6 py-3 hover:bg-cherry transition-colors">{s==="sending"?"Sending…":"Send Project Inquiry"}</button>
  <p role="status" className="text-mute">{s==="ok"&&"Thanks — your inquiry was sent."}{s==="err"&&"Could not send. Check the fields and try again."}</p></form>;
}
