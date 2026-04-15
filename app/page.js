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

  /* ===== DRAG ===== */
  const [pos, setPos] = useState({ x: 120, y: 500 });
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const startDrag = (e) => {
    dragging.current = true;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;

    offset.current = {
      x: x - rect.left,
      y: y - rect.top
    };
  };

  const move = (e) => {
    if (!dragging.current) return;

    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;

    setPos({
      x: x - offset.current.x,
      y: y - offset.current.y
    });
  };

  const stop = () => dragging.current = false;

  useEffect(() => {
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", stop);
    window.addEventListener("touchmove", move);
    window.addEventListener("touchend", stop);

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", stop);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", stop);
    };
  }, []);

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
    return t.type === "direct"
      ? t.amount || 0
      : (t.qty || 0) * (t.rate || 0);
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
          sgst: subtotal * 0.09,
          cgst: subtotal * 0.09,
          total
        })
      });

      if (!res.ok) {
        alert("API failed");
        setLoading(false);
        return;
      }

      const blob = await res.blob();

      if (blob.type !== "application/pdf") {
        alert("Invalid PDF");
        setLoading(false);
        return;
      }

      const url = window.URL.createObjectURL(blob);
      window.open(url);

      setLoading(false);

    } catch (err) {
      console.error(err);
      alert("Error generating PDF");
      setLoading(false);
    }
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
        <input
          value={invoice}
          onChange={(e) => setInvoice(e.target.value)}
          style={input}
        />
        <input
          type="date"
          onChange={(e) => setDate(e.target.value)}
          style={input}
        />
      </div>

      <h4>Tasks</h4>

      {tasks.map((t) => (
        <div key={t.id} style={card}>

          <div style={taskHeader}>
            <input
              placeholder="Task"
              value={t.name}
              onChange={(e) => updateTask(t.id, "name", e.target.value)}
              style={{ ...input, marginBottom: 0 }}
            />

            <button onClick={() => deleteTask(t.id)} style={deleteBtn}>
              ✕
            </button>
          </div>

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
          ...floating,
          transform: `translate(${pos.x}px, ${pos.y}px)`
        }}
      >
        ₹ {total.toFixed(0)}
        <div style={{ fontSize: 12 }}>Incl GST</div>
      </div>

      <button onClick={generatePDF} style={generateBtn}>
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

const title = {
  textAlign: "center",
  marginBottom: 20
};

const input = {
  width: "100%",
  padding: 12,
  marginBottom: 10,
  borderRadius: 12,
  border: "1px solid #ddd"
};

const row = {
  display: "flex",
  gap: 10
};

const card = {
  background: "#fff",
  padding: 15,
  borderRadius: 16,
  marginBottom: 10,
  boxShadow: "0 4px 10px rgba(0,0,0,0.05)"
};

const taskHeader = {
  display: "flex",
  alignItems: "center",
  gap: 10
};

const deleteBtn = {
  width: 36,
  height: 36,
  borderRadius: "50%",
  border: "none",
  background: "#eee",
  cursor: "pointer"
};

const amount = {
  textAlign: "right",
  fontWeight: "bold"
};

const addBtn = {
  width: "100%",
  padding: 14,
  borderRadius: 12,
  background: "#000",
  color: "#fff",
  border: "none",
  marginTop: 10
};

const floating = {
  position: "fixed",
  top: 0,
  left: 0,
  background: "#fff",
  padding: "12px 16px",
  borderRadius: 20,
  boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
  cursor: "grab",
  zIndex: 20,
  fontWeight: "bold"
};

const generateBtn = {
  position: "fixed",
  bottom: 20,
  left: "50%",
  transform: "translateX(-50%)",
  width: "90%",
  maxWidth: 400,
  padding: 14,
  borderRadius: 12,
  background: "#000",
  color: "#fff",
  border: "none"
};
