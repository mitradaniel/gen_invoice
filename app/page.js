"use client";
import { useState, useRef, useEffect } from "react";

export default function Page() {

  const [dark, setDark] = useState(false);
  const [loading, setLoading] = useState(false);

  const [docType, setDocType] = useState("INVOICE");   // ✅ NEW
  const [remarks, setRemarks] = useState("");          // ✅ NEW

  const [tasks, setTasks] = useState([
    { id: Date.now(), name: "", qty: 0, rate: 0, amount: 0, type: "sqft" }
  ]);

  const [subject, setSubject] = useState("");
  const [invoice, setInvoice] = useState("2026/27/001");
  const [date, setDate] = useState("");
  const [to, setTo] = useState("");

  /* ===== LOGIC ===== */

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

  /* ===== PDF ===== */
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
          docType,   // ✅ NEW
          remarks    // ✅ NEW
        })
      });

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url);

      setLoading(false);
    } catch {
      alert("PDF failed");
      setLoading(false);
    }
  };

  return (
    <div style={{
      ...container,
      background: dark ? "#0b0b0c" : "#f5f5f7",
      color: dark ? "#fff" : "#000"
    }}>

      {/* HEADER */}
      <div style={header}>
        <h2 style={{ margin: 0 }}>Invoice Generator</h2>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={generatePDF} style={topBtn}>
            {loading ? "..." : "PDF"}
          </button>

          <button onClick={() => setDark(!dark)} style={toggle}>
            {dark ? "☀️" : "🌙"}
          </button>
        </div>
      </div>

      {/* FORM */}
      <div style={formWrapper}>

        <textarea placeholder="To Address" value={to} onChange={(e)=>setTo(e.target.value)} style={input}/>

        <input placeholder="Subject" value={subject} onChange={(e)=>setSubject(e.target.value)} style={input}/>

        {/* ✅ DOC TYPE TOGGLE */}
        <div style={segmentedContainer}>
          <div style={{
            ...slider,
            transform: docType === "INVOICE"
              ? "translateX(0%)"
              : "translateX(100%)"
          }}/>

          {["INVOICE","QUOTATION"].map(type => (
            <div
              key={type}
              onClick={()=>setDocType(type)}
              style={{...segmentItem, color:docType===type?"#fff":"#666"}}
            >
              {type}
            </div>
          ))}
        </div>

        <div style={row}>
          <input value={invoice} onChange={(e)=>setInvoice(e.target.value)} style={input}/>
          <input type="date" onChange={(e)=>setDate(e.target.value)} style={input}/>
        </div>

        {tasks.map((t)=>(
          <div key={t.id} style={card}>

            <div style={taskHeader}>
              <input value={t.name} onChange={(e)=>updateTask(t.id,"name",e.target.value)} style={{...input,marginBottom:0}}/>
              <button onClick={()=>deleteTask(t.id)} style={deleteBtn}>✕</button>
            </div>

            <div style={{
              ...slider,
              transform:
                t.type === "sqft"
                  ? "translateX(0%)"
                  : t.type === "nos"
                  ? "translateX(100%)"
                  : "translateX(200%)"
            }}/>

              {["sqft","nos","direct"].map(type=>(
                <div
                  key={type}
                  onClick={()=>updateTask(t.id,"type",type)}
                  style={{...segmentItem, color:t.type===type?"#fff":"#666"}}
                >
                  {type}
                </div>
              ))}
            </div>

            {t.type!=="direct"?(
              <div style={row}>
                <input type="number" placeholder="Qty" onChange={(e)=>updateTask(t.id,"qty",+e.target.value)} style={input}/>
                <input type="number" placeholder="Rate" onChange={(e)=>updateTask(t.id,"rate",+e.target.value)} style={input}/>
              </div>
            ):(
              <input type="number" placeholder="Amount" onChange={(e)=>updateTask(t.id,"amount",+e.target.value)} style={input}/>
            )}

            <div style={amount}>₹ {getTotal(t).toLocaleString()}</div>

          </div>
        ))}

        <button onClick={addTask} style={addBtn}>+ Add Task</button>

        {/* ✅ REMARKS */}
        <textarea
          placeholder="Remarks (optional)"
          value={remarks}
          onChange={(e)=>setRemarks(e.target.value)}
          style={input}
        />

      </div>

      {/* FLOATING TOTAL */}
      <div style={floating}>
        ₹ {total.toLocaleString()}
        <div style={{fontSize:12,opacity:0.6}}>Incl. GST</div>
      </div>

    </div>
  );
}

/* ===== STYLES ===== */

const container = { maxWidth:520, margin:"auto", padding:20 };

const header = { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 };

const topBtn = { padding:"10px 14px", borderRadius:10, border:"none", background:"#000", color:"#fff" };

const toggle = { padding:10, borderRadius:10, border:"none" };

const formWrapper = { padding:16, borderRadius:20, paddingBottom:150 };

const input = { width:"100%", padding:14, marginBottom:10, borderRadius:12, border:"1px solid #ddd" };

const row = { display:"flex", gap:10 };

const card = { padding:16, borderRadius:16, background:"#fff", marginBottom:12 };

const taskHeader = { display:"flex", gap:10 };

const deleteBtn = { width:32, height:32, borderRadius:"50%", border:"none" };

const segmentedContainer = { position:"relative", display:"flex", background:"#e5e7eb", borderRadius:14, padding:4, marginTop:10, marginBottom:14 };

const slider = {
  position: "absolute",
  top: 4,
  left: 4,
  width: "33.33%",   // FIXED
  height: "calc(100% - 8px)",
  background: "#000",
  borderRadius: 10,
  transition: "transform 0.25s ease"
};

const sliderTwo = {
  position: "absolute",
  top: 4,
  left: 4,
  width: "50%",   // ✅ for 2 tabs
  height: "calc(100% - 8px)",
  background: "#000",
  borderRadius: 10,
  transition: "transform 0.25s ease"
};

const segmentItem = { flex:1, textAlign:"center", padding:10, cursor:"pointer", zIndex:1 };

const amount = { textAlign:"right" };

const addBtn = { width:"100%", padding:14, borderRadius:12, background:"#000", color:"#fff" };

const floating = {
  position:"fixed",
  bottom:90,
  right:20,
  padding:"12px 16px",
  borderRadius:18,
  background:"rgba(255,255,255,0.7)",
  backdropFilter:"blur(20px)"
};
