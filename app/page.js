"use client";
import { useState } from "react";

export default function Page() {

  const [dark, setDark] = useState(false);
  const [loading, setLoading] = useState(false);

  const [docType, setDocType] = useState("INVOICE");
  const [remarks, setRemarks] = useState("");

  const [tasks, setTasks] = useState([
    { id: Date.now(), name: "", qty: 0, rate: 0, amount: 0, type: "sqft" }
  ]);

  const [subject, setSubject] = useState("");
  const [invoice, setInvoice] = useState("2026/27/001");
  const [date, setDate] = useState("");
  const [to, setTo] = useState("");

  const updateTask = (id, field, value) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const addTask = () => {
    setTasks([...tasks, {
      id: Date.now(),
      name: "",
      qty: 0,
      rate: 0,
      amount: 0,
      type: "sqft"
    }]);
  };

  const deleteTask = (id) => {
    if (tasks.length === 1) return;
    setTasks(tasks.filter(t => t.id !== id));
  };

  const getTotal = (t) => {
    if (t.type === "direct") return t.amount || 0;
    return (t.qty || 0) * (t.rate || 0);
  };

  const subtotal = tasks.reduce((s, t) => s + getTotal(t), 0);
  const gst = subtotal * 0.18;
  const total = subtotal + gst;

  const generatePDF = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          tasks,
          subject,
          invoice,
          date,
          subtotal,
          sgst: gst / 2,
          cgst: gst / 2,
          total,
          docType,
          remarks
        })
      });

      if (!res.ok) {
        const err = await res.text();
        alert("PDF ERROR: " + err);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url);

    } catch (err) {
      console.error(err);
      alert("PDF failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: 520,
      margin: "auto",
      padding: 20,
      background: dark ? "#0b0b0c" : "#f5f5f7"
    }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>Invoice Generator</h2>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={generatePDF} style={btn}>
            {loading ? "..." : "PDF"}
          </button>

          <button onClick={() => setDark(!dark)} style={btn}>
            {dark ? "☀️" : "🌙"}
          </button>
        </div>
      </div>

      <textarea placeholder="To Address" value={to} onChange={(e)=>setTo(e.target.value)} style={input}/>
      <input placeholder="Subject" value={subject} onChange={(e)=>setSubject(e.target.value)} style={input}/>

      {/* DOC TYPE */}
      <div style={segmented}>
        <div style={{
          ...slider2,
          transform: docType === "INVOICE" ? "translateX(0%)" : "translateX(100%)"
        }}/>
        {["INVOICE","QUOTATION"].map(t => (
          <div key={t} onClick={()=>setDocType(t)} style={segItem}>{t}</div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <input value={invoice} onChange={(e)=>setInvoice(e.target.value)} style={input}/>
        <input type="date" onChange={(e)=>setDate(e.target.value)} style={input}/>
      </div>

      {tasks.map(t => (
        <div key={t.id} style={card}>

          <input value={t.name} onChange={(e)=>updateTask(t.id,"name",e.target.value)} style={input}/>

          {/* TASK TYPE */}
          <div style={segmented}>
            <div style={{
              ...slider3,
              transform:
                t.type==="sqft"?"translateX(0%)":
                t.type==="nos"?"translateX(100%)":
                "translateX(200%)"
            }}/>

            {["sqft","nos","direct"].map(type => (
              <div key={type} onClick={()=>updateTask(t.id,"type",type)} style={segItem}>
                {type}
              </div>
            ))}
          </div>

          {t.type !== "direct" ? (
            <div style={{ display: "flex", gap: 10 }}>
              <input type="number" placeholder="Qty" onChange={(e)=>updateTask(t.id,"qty",+e.target.value)} style={input}/>
              <input type="number" placeholder="Rate" onChange={(e)=>updateTask(t.id,"rate",+e.target.value)} style={input}/>
            </div>
          ) : (
            <input type="number" placeholder="Amount" onChange={(e)=>updateTask(t.id,"amount",+e.target.value)} style={input}/>
          )}

          <div style={{ textAlign: "right" }}>
            ₹ {getTotal(t).toLocaleString("en-IN")}
          </div>

        </div>
      ))}

      <button onClick={addTask} style={btn}>+ Add Task</button>

      <textarea placeholder="Remarks" value={remarks} onChange={(e)=>setRemarks(e.target.value)} style={input}/>

      <div style={floating}>
        ₹ {total.toLocaleString("en-IN")}
        <div style={{ fontSize: 12 }}>Incl. GST</div>
      </div>

    </div>
  );
}

/* STYLES */
const input = { width:"100%", padding:12, marginBottom:10, borderRadius:10 };
const btn = { padding:12, background:"#000", color:"#fff", borderRadius:10, border:"none" };
const card = { padding:16, background:"#fff", borderRadius:16, marginBottom:12 };

const segmented = { position:"relative", display:"flex", background:"#e5e7eb", borderRadius:12, padding:4, marginBottom:10 };

const slider2 = { position:"absolute", top:4, left:4, width:"50%", height:"calc(100% - 8px)", background:"#000", borderRadius:10 };
const slider3 = { position:"absolute", top:4, left:4, width:"33.33%", height:"calc(100% - 8px)", background:"#000", borderRadius:10 };

const segItem = { flex:1, textAlign:"center", padding:10, zIndex:1, cursor:"pointer" };

const floating = { position:"fixed", bottom:90, right:20, padding:14, background:"#fff", borderRadius:16 };
