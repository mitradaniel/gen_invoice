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

  const [pos, setPos] = useState({ x: 140, y: 500 });
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const startDrag = (e) => {
    dragging.current = true;
    const rect = e.currentTarget.getBoundingClientRect();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    offset.current = {
      x: clientX - rect.left,
      y: clientY - rect.top
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
          sgst,
          cgst,
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
    <div style={{ padding: 20, maxWidth: 500, margin: "auto" }}>

      <h2>Invoice Generator</h2>

      <textarea placeholder="To Address" value={to} onChange={e => setTo(e.target.value)} />

      <input placeholder="Subject" value={subject} onChange={e => setSubject(e.target.value)} />

      <input value={invoice} onChange={e => setInvoice(e.target.value)} />
      <input type="date" onChange={e => setDate(e.target.value)} />

      {tasks.map(t => (
        <div key={t.id}>
          <input value={t.name} onChange={e => updateTask(t.id, "name", e.target.value)} />
          <button onClick={() => deleteTask(t.id)}>X</button>
        </div>
      ))}

      <button onClick={addTask}>Add Task</button>

      <button onClick={generatePDF}>
        {loading ? "Generating..." : "Generate PDF"}
      </button>

    </div>
  );
}
