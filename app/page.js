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

  /* ===== SMOOTH DRAG ===== */
  const [pos, setPos] = useState({ x: 140, y: 500 });
  const dragging = useRef(false);
  const velocity = useRef({ x: 0, y: 0 });
  const offset = useRef({ x: 0, y: 0 });

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

    const newX = clientX - offset.current.x;
    const newY = clientY - offset.current.y;

    velocity.current = {
      x: newX - pos.x,
      y: newY - pos.y
    };

    setPos({ x: newX, y: newY });
  };

  const stopDrag = () => {
    dragging.current = false;

    // Smooth inertial effect
    let friction = 0.92;
    let vx = velocity.current.x;
    let vy = velocity.current.y;

    const animate = () => {
      vx *= friction;
      vy *= friction;

      if (Math.abs(vx) < 0.1 && Math.abs(vy) < 0.1) return;

      setPos((prev) => ({
        x: prev.x + vx,
        y: prev.y + vy
      }));

      requestAnimationFrame(animate);
    };

    animate();
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
  }, [pos]);

  /* ===== TASK LOGIC ===== */

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
  const total = subtotal * 1.18;

  const generatePDF = async () => {
    setLoading(true);
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, tasks, subject, invoice, date, subtotal, total })
    });

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    window.open(url);
    setLoading(false);
  };

  return (
    <div style={container}>

      <h2 style={title}>Invoice Generator</h2>

      <textarea placeholder="To Address" value={to} onChange={(e) => setTo(e.target.value)} style={input}/>
      <input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} style={input}/>

      <div style={row}>
        <input value={invoice} onChange={(e) => setInvoice(e.target.value)} style={input}/>
        <input type="date" onChange={(e) => setDate(e.target.value)} style={input}/>
      </div>

      {tasks.map((t) => (
        <div key={t.id} style={card}>

          <div style={taskHeader}>
            <input
              placeholder="Task"
              value={t.name}
              onChange={(e) => updateTask(t.id, "name", e.target.value)}
              style={{ ...input, marginBottom: 0 }}
            />
            <button onClick={() => deleteTask(t.id)} style={deleteBtn}>✕</button>
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
                {type}
              </div>
            ))}
          </div>

          {t.type !== "direct" ? (
            <div style={row}>
              <input type="number" placeholder="Qty" onChange={(e) => updateTask(t.id, "qty", +e.target.value)} style={input}/>
              <input type="number" placeholder="Rate" onChange={(e) => updateTask(t.id, "rate", +e.target.value)} style={input}/>
            </div>
          ) : (
            <input type="number" placeholder="Amount" onChange={(e) => updateTask(t.id, "amount", +e.target.value)} style={input}/>
          )}

          <div style={amount}>₹ {getTotal(t).toLocaleString()}</div>

        </div>
      ))}

      <button onClick={addTask} style={addBtn}>+ Add Task</button>

      {/* FLOATING TOTAL */}
      <div
        onMouseDown={startDrag}
        onTouchStart={startDrag}
        style={{
          ...floating,
          transform: `translate(${pos.x}px, ${pos.y}px)`
        }}
      >
        ₹ {total.toLocaleString()}
      </div>

      {/* BUTTON */}
      <button onClick={generatePDF} style={generateBtn}>
        {loading ? "Generating..." : "Generate PDF"}
      </button>

    </div>
  );
}

/* ===== APPLE STYLE ===== */

const container = {
  maxWidth: 480,
  margin: "auto",
  padding: 20,
  fontFamily: "Inter, sans-serif",
  background: "#f5f5f7",
  minHeight: "100vh"
};

const title = {
  textAlign: "center",
  marginBottom: 20,
  fontSize: 22,
  fontWeight: "600"
};

const input = {
  width: "100%",
  padding: 14,
  marginBottom: 12,
  borderRadius: 14,
  border: "1px solid #ddd",
  background: "#fff",
  transition: "0.2s"
};

const row = { display: "flex", gap: 10 };

const card = {
  padding: 16,
  borderRadius: 20,
  background: "#fff",
  marginBottom: 14,
  boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
  transition: "0.3s"
};

const taskHeader = {
  display: "flex",
  gap: 10,
  alignItems: "center"
};

const deleteBtn = {
  width: 32,
  height: 32,
  borderRadius: "50%",
  background: "#f2f2f2",
  border: "none",
  cursor: "pointer"
};

const segmented = {
  display: "flex",
  borderRadius: 12,
  background: "#eee",
  marginTop: 10,
  overflow: "hidden"
};

const segmentItem = {
  flex: 1,
  padding: 10,
  textAlign: "center",
  cursor: "pointer"
};

const amount = {
  textAlign: "right",
  marginTop: 10,
  fontWeight: "600"
};

const addBtn = {
  width: "100%",
  padding: 14,
  borderRadius: 14,
  background: "#000",
  color: "#fff",
  border: "none",
  marginTop: 10
};

const floating = {
  position: "fixed",
  top: 0,
  left: 0,
  padding: "14px 20px",
  borderRadius: 25,
  background: "rgba(255,255,255,0.7)",
  backdropFilter: "blur(20px)",
  boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
  fontWeight: "600",
  cursor: "grab"
};

const generateBtn = {
  position: "fixed",
  bottom: 20,
  left: "50%",
  transform: "translateX(-50%)",
  width: "90%",
  padding: 16,
  borderRadius: 18,
  background: "#000",
  color: "#fff",
  border: "none"
};
