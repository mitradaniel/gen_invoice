"use client";
import { useState, useRef, useEffect } from "react";

export default function Page() {

  const [dark, setDark] = useState(false);
  const [loading, setLoading] = useState(false);

  const [docType, setDocType] = useState("INVOICE"); // ✅ ADDED
<div style={{
  display: "flex",
  background: "#e5e7eb",
  borderRadius: 14,
  padding: 4,
  marginBottom: 12
}}>
  {["INVOICE", "QUOTATION"].map(type => (
    <div
      key={type}
      onClick={() => setDocType(type)}
      style={{
        flex: 1,
        textAlign: "center",
        padding: 10,
        borderRadius: 10,
        cursor: "pointer",
        background: docType === type ? "#000" : "transparent",
        color: docType === type ? "#fff" : "#666"
      }}
    >
      {type}
    </div>
  ))}
</div>

  
  const [tasks, setTasks] = useState([
    { id: Date.now(), name: "", qty: 0, rate: 0, amount: 0, type: "sqft" }
  ]);

  const [subject, setSubject] = useState("");
  const [invoice, setInvoice] = useState("2026/27/001");
  const [date, setDate] = useState("");
  const [to, setTo] = useState("");

  /* ===== FLOATING ===== */
  const [pos, setPos] = useState({ x: 260, y: 10 });
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
        docType   // ✅ ADD THIS ONLY
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

        {/* ✅ ADDED TOGGLE */}
        <div style={{
          display: "flex",
          background: "#e5e7eb",
          borderRadius: 14,
          padding: 4,
          marginBottom: 12
        }}>
          {["INVOICE", "QUOTATION"].map(type => (
            <div
              key={type}
              onClick={() => setDocType(type)}
              style={{
                flex: 1,
                textAlign: "center",
                padding: 10,
                borderRadius: 10,
                cursor: "pointer",
                background: docType === type ? "#000" : "transparent",
                color: docType === type ? "#fff" : "#666"
              }}
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

            <div style={amount}>₹ {getTotal(t).toLocaleString()}</div>

          </div>
        ))}

        <button onClick={addTask} style={addBtn}>+ Add Task</button>

      </div>

      {/* FLOATING TOTAL */}
      <div onMouseDown={startDrag} style={floating}>
        ₹ {total.toLocaleString()}
        <div style={{fontSize:12,opacity:0.6}}>Incl. GST</div>
      </div>

    </div>
  );
}
