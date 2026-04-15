"use client";
import { useState, useRef, useEffect } from "react";

export default function Page() {

  const [dark, setDark] = useState(false);

  const [tasks, setTasks] = useState([
    { id: Date.now(), name: "", qty: 0, rate: 0, amount: 0, type: "sqft" }
  ]);

  const [subject, setSubject] = useState("");
  const [invoice, setInvoice] = useState("2026/27/001");
  const [date, setDate] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);

  /* ===== DRAG ===== */
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
          total
        })
      });

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url);

      setLoading(false);

    } catch (err) {
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
        <h2>Invoice Generator</h2>
        <button onClick={() => setDark(!dark)} style={toggle}>
          {dark ? "☀️" : "🌙"}
        </button>
      </div>

      {/* FORM WRAPPER (FIXED WIDTH ALIGNMENT) */}
      <div style={formWrapper}>

        <textarea
          placeholder="To Address"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          style={input}
        />

        <input
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          style={input}
        />

        <div style={row}>
          <input value={invoice} onChange={(e) => setInvoice(e.target.value)} style={input}/>
          <input type="date" onChange={(e) => setDate(e.target.value)} style={input}/>
        </div>

        {tasks.map((t) => (
          <div key={t.id} style={card}>

            <div style={taskHeader}>
              <input
                placeholder="Task"
                onChange={(e) => updateTask(t.id, "name", e.target.value)}
                style={{...input, marginBottom:0}}
              />
              <button onClick={() => deleteTask(t.id)} style={deleteBtn}>✕</button>
            </div>

            <div style={segmented}>
              {["sqft","nos","direct"].map(type => (
                <div key={type}
                  onClick={() => updateTask(t.id,"type",type)}
                  style={{
                    ...segmentItem,
                    background: t.type === type ? "#000" : "transparent",
                    color: t.type === type ? "#fff" : "#777"
                  }}>
                  {type}
                </div>
              ))}
            </div>

            {t.type !== "direct" ? (
              <div style={row}>
                <input type="number" placeholder="Qty" onChange={(e)=>updateTask(t.id,"qty",+e.target.value)} style={input}/>
                <input type="number" placeholder="Rate" onChange={(e)=>updateTask(t.id,"rate",+e.target.value)} style={input}/>
              </div>
            ) : (
              <input type="number" placeholder="Amount" onChange={(e)=>updateTask(t.id,"amount",+e.target.value)} style={input}/>
            )}

            <div style={amount}>₹ {getTotal(t).toLocaleString()}</div>
          </div>
        ))}

        <button onClick={addTask} style={addBtn}>+ Add Task</button>

      </div>

      {/* LIVE PREVIEW */}
      <div style={preview}>
        <h3>Live Preview</h3>
        <div>{subject}</div>
        {tasks.map((t,i)=>(
          <div key={i}>{t.name} - ₹ {getTotal(t)}</div>
        ))}
        <hr/>
        <b>Total: ₹ {total.toFixed(0)}</b>
      </div>

      {/* FLOATING TOTAL */}
      <div
        onMouseDown={startDrag}
        style={{
          ...floating,
          transform:`translate(${pos.x}px,${pos.y}px)`
        }}
      >
        ₹ {total.toLocaleString()}
        <div style={{fontSize:12, opacity:0.6}}>Incl. GST</div>
      </div>

      {/* GENERATE BUTTON */}
      <button onClick={generatePDF} style={generateBtn}>
        {loading ? "Generating..." : "Generate PDF"}
      </button>

    </div>
  );
}

/* ===== STYLES ===== */

const container = {
  maxWidth: 520,
  margin: "auto",
  padding: 20,
  fontFamily: "Inter"
};

const formWrapper = {
  background: "#ffffff10",
  padding: 16,
  borderRadius: 20,
  backdropFilter: "blur(10px)"
};

const header = {
  display:"flex",
  justifyContent:"space-between",
  alignItems:"center",
  marginBottom:10
};

const toggle = {
  border:"none",
  padding:10,
  borderRadius:10,
  cursor:"pointer"
};

const input = {
  width:"100%",
  padding:14,
  marginBottom:10,
  borderRadius:12,
  border:"1px solid #ddd"
};

const row = {display:"flex", gap:10};

const card = {
  padding:16,
  borderRadius:16,
  background:"#fff",
  marginBottom:12,
  boxShadow:"0 10px 30px rgba(0,0,0,0.1)"
};

const taskHeader = {display:"flex", gap:10};

const deleteBtn = {
  width:32,
  height:32,
  borderRadius:"50%",
  border:"none"
};

const segmented = {
  display: "flex",
  background: "#eee",
  borderRadius: 12,
  overflow: "hidden",
  marginTop: 10,
  marginBottom: 14   // 👈 THIS ADDS GAP
};

const segmentItem = {
  flex:1,
  padding:10,
  textAlign:"center",
  cursor:"pointer"
};

const amount = {textAlign:"right"};

const addBtn = {
  width:"100%",
  padding:14,
  borderRadius:12,
  background:"#000",
  color:"#fff"
};

const preview = {
  marginTop:20,
  padding:15,
  borderRadius:16,
  background:"#fff",
  boxShadow:"0 10px 30px rgba(0,0,0,0.08)"
};

const floating = {
  position:"fixed",
  top:0,
  left:0,
  padding:"14px 18px",
  borderRadius:25,
  background:"rgba(255,255,255,0.7)",
  backdropFilter:"blur(20px)",
  boxShadow:"0 20px 40px rgba(0,0,0,0.2)",
  fontWeight:"600",
  cursor:"grab"
};

const generateBtn = {
  position:"fixed",
  bottom:20,
  left:"50%",
  transform:"translateX(-50%)",
  width:"92%",
  maxWidth:420,
  padding:16,
  borderRadius:16,
  background:"#000",
  color:"#fff",
  border:"none",
  fontWeight:"600"
};
