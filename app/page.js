"use client";
import { useState, useRef, useEffect } from "react";

export default function Page() {

  const [dark, setDark] = useState(false);
  const [loading, setLoading] = useState(false);
  const [docType, setDocType] = useState("INVOICE");

  const [tasks, setTasks] = useState([
    { id: Date.now(), name: "", qty: 0, rate: 0, amount: 0, type: "sqft" }
  ]);

  const [subject, setSubject] = useState("");
  const [invoice, setInvoice] = useState("2026/27/001");
  const [date, setDate] = useState("");
  const [to, setTo] = useState("");

  /* ===== FLOATING ===== */
  const [pos, setPos] = useState({ x: 20, y: 80 });
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const startDrag = (e) => {
    dragging.current = true;
    const rect = e.currentTarget.getBoundingClientRect();
    offset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const onMove = (e) => {
    if (!dragging.current) return;
    setPos({
      x: e.clientX - offset.current.x,
      y: e.clientY - offset.current.y
    });
  };

  const stopDrag = () => dragging.current = false;

  useEffect(() => {
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", stopDrag);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", stopDrag);
    };
  }, []);

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
          docType
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
      background: dark ? "rgba(20,20,20,0.8)" : "#fff",
      color: dark ? "#fff" : "#000"
    }}>

      {/* HEADER */}
      <div style={header}>
        <h2 style={{ margin: 0 }}>Khemraj M Rasganya: Invoice Generator</h2>

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

        {/* INVOICE / QUOTATION */}
        <div style={segmentedContainer}>
          {["INVOICE","QUOTATION"].map(type=>(
            <div key={type} onClick={()=>setDocType(type)} style={{
              flex:1,
              textAlign:"center",
              padding:10,
              borderRadius:10,
              background: docType===type?"#000":"transparent",
              color: docType===type?"#fff":"#666",
              cursor:"pointer"
            }}>{type}</div>
          ))}
        </div>

        <div style={row}>
          <input value={invoice} onChange={(e)=>setInvoice(e.target.value)} style={input}/>
          <input type="date" onChange={(e)=>setDate(e.target.value)} style={input}/>
        </div>

        {/* TASKS */}
        {tasks.map((t)=>(
          <div key={t.id} style={card}>

            <div style={taskHeader}>
              <input
                value={t.name}
                onChange={(e)=>updateTask(t.id,"name",e.target.value)}
                style={{...input,marginBottom:0}}
              />
              <button onClick={()=>deleteTask(t.id)} style={deleteBtn}>✕</button>
            </div>

            {/* SEGMENTED */}
            <div style={segmentedContainer}>
              <div style={{
                ...slider,
                transform:
                  t.type==="sqft"?"translateX(0%)":
                  t.type==="nos"?"translateX(100%)":
                  "translateX(200%)"
              }}/>

              {["sqft","nos","direct"].map(type=>(
                <div key={type}
                  onClick={()=>{
                    updateTask(t.id,"type",type);
                    navigator.vibrate?.(10);
                  }}
                  style={{...segmentItem, color:t.type===type?"#fff":"#666"}}
                >
                  {type}
                </div>
              ))}
            </div>

            {t.type!=="direct"?(
              <div style={row}>
                <input type="number" placeholder="Qty" value={t.qty || ""} onChange={(e)=>updateTask(t.id,"qty",+e.target.value)} style={input}/>
                <input type="number" placeholder="Rate" value={t.rate || ""} onChange={(e)=>updateTask(t.id,"rate",+e.target.value)} style={input}/>
              </div>
            ):(
              <input type="number" placeholder="Amount" value={t.amount || ""} onChange={(e)=>updateTask(t.id,"amount",+e.target.value)} style={input}/>
            )}

            <div style={amount}>
              ₹ {getTotal(t).toLocaleString()}
            </div>

          </div>
        ))}

        <button onClick={addTask} style={addBtn}>+ Add Task</button>

      </div>

      {/* FLOATING */}
      <div
        onMouseDown={startDrag}
        style={{
          ...floating,
          left: pos.x,
          top: pos.y
        }}
      >
        ₹ {total.toLocaleString()}
        <div style={{fontSize:12,opacity:0.6}}>Incl. GST</div>
      </div>

    </div>
  );
}

/* ===== STYLES ===== */

const container = { maxWidth:520, margin:"auto", padding:20 };
const header = { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0" };
const topBtn = { padding:"10px 14px", borderRadius:10, border:"none", background:"#000", color:"#fff" };
const toggle = { padding:10, borderRadius:10, border:"none" };
const formWrapper = { padding:16, borderRadius:20, paddingBottom:120 };
const input = { width:"100%", padding:14, marginBottom:12, borderRadius:12 };
const row = { display:"flex", gap:10 };
const card = { padding:16, borderRadius:18, marginBottom:14 };
const taskHeader = { display:"flex", gap:10 };
const deleteBtn = { width:32, height:32, borderRadius:"50%" };
const segmentedContainer = { position:"relative", display:"flex", background:"#e5e7eb", borderRadius:14, padding:4, marginTop:10, marginBottom:14 };
const slider = { position:"absolute", top:4, left:4, width:"33.33%", height:"calc(100% - 8px)", background:"#000", borderRadius:10, transition:"transform 0.28s cubic-bezier(0.34,1.56,0.64,1)" };
const segmentItem = { flex:1, textAlign:"center", padding:10, cursor:"pointer", zIndex:1 };
const amount = { textAlign:"right" };
const addBtn = { width:"100%", padding:14, borderRadius:12, background:"#000", color:"#fff" };
const floating = { position:"fixed", padding:"12px 18px", borderRadius:20, background:"#fff", boxShadow:"0 10px 30px rgba(0,0,0,0.2)" };
