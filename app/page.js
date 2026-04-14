"use client";
import { useState } from "react";

export default function Page() {
  const [tasks, setTasks] = useState([
    { name: "", qty: 0, rate: 0 }
  ]);
  const [subject, setSubject] = useState("");
  const [invoice, setInvoice] = useState("2026/27/001");
  const [date, setDate] = useState("");

  const addTask = () => {
    setTasks([...tasks, { name: "", qty: 0, rate: 0 }]);
  };

  const updateTask = (index, field, value) => {
    const updated = [...tasks];
    updated[index][field] = value;
    setTasks(updated);
  };

  const subtotal = tasks.reduce((sum, t) => sum + (t.qty * t.rate), 0);
  const gst = subtotal * 0.18;
  const total = subtotal + gst;

  const generatePDF = async () => {
    const res = await fetch("/api/generate", {
      method: "POST",
      body: JSON.stringify({
        tasks,
        subject,
        invoice,
        date,
        subtotal,
        gst,
        total
      })
    });

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoice}_${subject}.pdf`;
    a.click();
  };

  return (
    <div style={{ padding: 15, maxWidth: 500, margin: "auto" }}>
      <h2>Invoice Generator</h2>

      <textarea
        placeholder="To (Address)"
        style={{ width: "100%", marginBottom: 8 }}
      />

      <input
        placeholder="Subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        style={{ width: "100%", marginBottom: 8 }}
      />

      <input
        placeholder="Invoice Number"
        value={invoice}
        onChange={(e) => setInvoice(e.target.value)}
        style={{ width: "100%", marginBottom: 8 }}
      />

      <input
        type="date"
        onChange={(e) => setDate(e.target.value)}
        style={{ width: "100%", marginBottom: 12 }}
      />

      <h4>Tasks</h4>

      {tasks.map((t, i) => (
        <div key={i} style={{ marginBottom: 10 }}>
          <input
            placeholder="Task"
            value={t.name}
            onChange={(e) => updateTask(i, "name", e.target.value)}
            style={{ width: "100%", marginBottom: 5 }}
          />

          <div style={{ display: "flex", gap: 5 }}>
            <input
              type="number"
              placeholder="Qty"
              onChange={(e) => updateTask(i, "qty", +e.target.value)}
              style={{ width: "33%" }}
            />
            <input
              type="number"
              placeholder="Rate"
              onChange={(e) => updateTask(i, "rate", +e.target.value)}
              style={{ width: "33%" }}
            />
            <div style={{ width: "33%" }}>
              ₹{t.qty * t.rate}
            </div>
          </div>
        </div>
      ))}

      <button onClick={addTask}>+ Add Task</button>

      <hr />

      <p>Subtotal: ₹{subtotal}</p>
      <p>GST (18%): ₹{gst}</p>
      <p><b>Total: ₹{total}</b></p>

      <button
        onClick={generatePDF}
        style={{
          width: "100%",
          padding: 12,
          background: "black",
          color: "white",
          border: "none",
          marginTop: 10
        }}
      >
        Generate Invoice
      </button>
    </div>
  );
}
