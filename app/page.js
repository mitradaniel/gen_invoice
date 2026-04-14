"use client";
import { useState } from "react";

export default function Home() {
  const [tasks, setTasks] = useState([{ name: "", qty: 0, rate: 0 }]);
  const [subject, setSubject] = useState("");
  const [invoice, setInvoice] = useState("2026/27/001");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const addTask = () => {
    setTasks([...tasks, { name: "", qty: 0, rate: 0 }]);
  };

  const updateTask = (i, field, value) => {
    const updated = [...tasks];
    updated[i][field] = value;
    setTasks(updated);
  };

  const subtotal = tasks.reduce((sum, t) => sum + t.qty * t.rate, 0);
  const gst = subtotal * 0.18;
  const total = subtotal + gst;

  const generatePDF = async () => {
    const res = await fetch("/api/generate", {
      method: "POST",
      body: JSON.stringify({ tasks, subject, invoice, date, subtotal, gst, total }),
    });

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoice}_${subject}.pdf`;
    a.click();
  };

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h2>🧾 Invoice</h2>

      <input placeholder="Subject" onChange={e => setSubject(e.target.value)} />
      <input value={invoice} onChange={e => setInvoice(e.target.value)} />
      <input type="date" value={date} onChange={e => setDate(e.target.value)} />

      <h4>Tasks</h4>

      {tasks.map((t, i) => (
        <div key={i} style={{ display: "flex", gap: 5, marginBottom: 5 }}>
          <input placeholder="Task" onChange={e => updateTask(i, "name", e.target.value)} />
          <input type="number" placeholder="Qty" onChange={e => updateTask(i, "qty", +e.target.value)} />
          <input type="number" placeholder="Rate" onChange={e => updateTask(i, "rate", +e.target.value)} />
          <span>₹{t.qty * t.rate}</span>
        </div>
      ))}

      <button onClick={addTask}>➕ Add Task</button>

      <h4>Total: ₹{total}</h4>

      <button onClick={generatePDF}>📄 Generate PDF</button>
    </div>
  );
}