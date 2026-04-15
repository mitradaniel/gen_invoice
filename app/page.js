"use client";
import { useState, useRef, useEffect } from "react";

export default function Page() {

  const [tasks, setTasks] = useState([
    { id: Date.now(), name: "", qty: 0, rate: 0, amount: 0, type: "sqft" }
  ]);

  const [subject, setSubject] = useState("");
  const [invoice, setInvoice] = useState("2026/27/001");
  const [date, setDate] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);

  /* ===== DRAG STATE ===== */
  const [pos, setPos] = useState({ x: 140, y: 500 });
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  /* ===== DRAG HANDLERS ===== */

  const startDrag = (e) => {
    dragging.current = true;
    const rect = e.currentTarget.getBoundingClientRect();

    offset.current = {
      x: (e.touches ? e.touches[0].clientX : e.clientX) - rect.left,
      y: (e.touches ? e.touches[0].clientY : e.clientY) - rect.top
    };
  };

  const onMove = (e) => {
    if (!dragging.current) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    setPos({
      x: clientX - offset.current.x,
      y: clientY - offset.current.y
    });
  };

  const stopDrag = () => {
    dragging.current = false;
  };

  useEffect(() => {
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", stopDrag);
    window.addEventListener("touchmove", onMove);
    window.addEventListener("touchend", stopDrag);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", stopDrag);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", stopDrag);
    };
  }, []);

  /* ===== TASK LOGIC ===== */

  const addTask = () => {
    setTasks([
      ...tasks,
      { id: Date.now(), name: "", qty: 0, rate: 0, amount: 0, type: "sqft" }
    ]);
  };

  const updateTask = (id, field, value) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, [field]: value } : t));
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
  const sgst = subtotal * 0.09;
  const cgst = subtotal * 0.09;
  const total = subtotal + sgst + cgst;

  const generatePDF = async () => {
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
        sgst,
        cgst,
        total
      })
    });

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoice}_${subject}.pdf`;
    a.click();

    setLoading(false);
  };

  return (
    <div style={container}>

      <h2 style={title}>Invoice Generator</h2>

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

      <h4 style={{ marginTop: 20 }}>Tasks</h4>

      {tasks.map((t) => (
        <div key={t.id} style={card}>

          {/* HEADER FIXED */}
          <div style={taskHeader}>
            <input
              placeholder="Task description"
              value={t.name}
              onChange={(e) => updateTask(t.id, "name", e.target.value)}
              style={{ ...input, marginBottom: 0 }}
            />

            <button onClick={() => deleteTask(t.id)} style={deleteBtn}>
              ✕
            </button>
          </div>

          <div style={segmented}>
            {["sqft", "nos", "direct"].map(type => (
              <div
                key={type}
                onClick={() => updateTask(t.id, "type", type)}
                style={{
                  ...segmentItem,
                  background: t.type === type ? "#000" : "transparent",
                  color: t.type === type ? "#fff" : "#555"
                }}
              >
                {type === "sqft" ? "SQFT/RFT" : type === "nos" ? "Nos" : "Direct"}
              </div>
            ))}
          </div>

          {t.type !== "direct" ? (
            <div style={row}>
              <input
                type="number"
                placeholder="Qty"
                onChange={(e) => updateTask(t.id, "qty", +e.target.value)}
                style={input}
              />
              <input
                type="number"
                placeholder="Rate"
                onChange={(e) => updateTask(t.id, "rate", +e.target.value)}
                style={input}
              />
            </div>
          ) : (
            <input
              type="number"
              placeholder="Amount"
              onChange={(e) => updateTask(t.id, "amount", +e.target.value)}
              style={input}
            />
          )}

          <div style={amount}>
            ₹ {getTotal(t).toLocaleString()}
          </div>

        </div>
      ))}

      <button onClick={addTask} style={addBtn}>
        + Add Task
      </button>

      {/* DRAGGABLE TOTAL */}
      <div
        onMouseDown={startDrag}
        onTouchStart={startDrag}
        style={{
          ...floatingTotal,
          transform: `translate(${pos.x}px, ${pos.y}px)`
        }}
      >
        ₹ {total.toFixed(0)}
        <div style={{ fontSize: 12 }}>Incl. GST</div>
      </div>

      {/* BUTTON */}
      <button onClick={generatePDF} style={floatingBtn}>
        {loading ? "Generating..." : "Generate PDF"}
      </button>

    </div>
  );
}

/* ===== STYLES ===== */

const container = {
  maxWidth: 480,
  margin: "auto",
  padding: 20,
  fontFamily: "sans-serif"
};

const title = { textAlign: "center", marginBottom: 20 };

const input = {
  width: "100%",
  padding: 12,
  marginBottom: 10,
  borderRadius: 12,
  border: "1px solid #eee",
  background: "#fafafa"
};

const row = { display: "flex", gap: 10 };

const card = {
  padding: 15,
  borderRadius: 16,
  background: "#fff",
  marginBottom: 12,
  boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
};

const taskHeader = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  marginBottom: 10
};

const deleteBtn = {
  width: 36,
  height: 36,
  borderRadius: "50%",
  border: "none",
  background: "#f1f1f1",
  cursor: "pointer"
};

const segmented = {
  display: "flex",
  borderRadius: 12,
  background: "#f1f1f1",
  overflow: "hidden",
  marginBottom: 10
};

const segmentItem = {
  flex: 1,
  textAlign: "center",
  padding: 8,
  cursor: "pointer"
};

const amount = { textAlign: "right", fontWeight: "bold" };

const addBtn = {
  width: "100%",
  padding: 14,
  borderRadius: 14,
  background: "#000",
  color: "#fff",
  border: "none",
  marginBottom: 20
};

const floatingTotal = {
  position: "fixed",
  top: 0,
  left: 0,
  background: "#fff",
  padding: "12px 16px",
  borderRadius: 20,
  boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
  cursor: "grab",
  zIndex: 20,
  fontWeight: "bold"
};

const floatingBtn = {
  position: "fixed",
  bottom: 20,
  left: "50%",
  transform: "translateX(-50%)",
  width: "90%",
  maxWidth: 400,
  padding: 14,
  borderRadius: 14,
  background: "#000",
  color: "#fff",
  border: "none"
};
