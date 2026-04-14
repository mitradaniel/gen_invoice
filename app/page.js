"use client";
import { useState } from "react";

export default function Page() {
  const [tasks, setTasks] = useState([
    { name: "", qty: 0, rate: 0, amount: 0, unit: "Nos", mode: "qty" }
  ]);

  const [subject, setSubject] = useState("");
  const [invoice, setInvoice] = useState("2026/27/001");
  const [date, setDate] = useState("");
  const [to, setTo] = useState("");

  const addTask = () => {
    setTasks([
      ...tasks,
      { name: "", qty: 0, rate: 0, amount: 0, unit: "Nos", mode: "qty" }
    ]);
  };

  const updateTask = (i, field, value) => {
    const updated = [...tasks];
    updated[i][field] = value;
    setTasks(updated);
  };

  // 🔥 CORE CALCULATION LOGIC
  const getTotal = (t) => {
    if (t.mode === "qty") return (t.qty || 0) * (t.rate || 0);
    if (t.mode === "rate") return t.rate || 0;
    return t.amount || 0;
  };

  const subtotal = tasks.reduce((s, t) => s + getTotal(t), 0);
  const sgst = subtotal * 0.09;
  const cgst = subtotal * 0.09;
  const total = subtotal + sgst + cgst;

  const generatePDF = async () => {
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
      alert("PDF generation failed");
      return;
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoice}_${subject}.pdf`;
    a.click();
  };

  return (
    <div style={{ maxWidth: 480, margin: "auto", padding: 15 }}>

      <h2 style={{ textAlign: "center" }}>Khemraj Invoice</h2>

      {/* TO */}
      <textarea
        placeholder="TO Address"
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

      <div style={{ display: "flex", gap: 8 }}>
        <input value={invoice} onChange={(e) => setInvoice(e.target.value)} style={input}/>
        <input type="date" onChange={(e) => setDate(e.target.value)} style={input}/>
      </div>

      <h4>Tasks</h4>

      {tasks.map((t, i) => (
        <div key={i} style={card}>

          <input
            placeholder="Task description"
            value={t.name}
            onChange={(e) => updateTask(i, "name", e.target.value)}
            style={input}
          />

          {/* MODE */}
          <select
            value={t.mode}
            onChange={(e) => updateTask(i, "mode", e.target.value)}
            style={input}
          >
            <option value="qty">Qty × Rate</option>
            <option value="rate">Rate Only</option>
            <option value="direct">Direct Amount</option>
          </select>

          {/* UNIT DROPDOWN */}
          {t.mode === "qty" && (
            <select
              value={t.unit}
              onChange={(e) => updateTask(i, "unit", e.target.value)}
              style={input}
            >
              <option value="Sqft">Sqft</option>
              <option value="Nos">Nos</option>
              <option value="RFT">RFT</option>
            </select>
          )}

          {/* INPUTS */}
          {t.mode === "qty" && (
            <div style={{ display: "flex", gap: 6 }}>
              <input
                type="number"
                placeholder="Qty"
                onChange={(e) => updateTask(i, "qty", +e.target.value)}
                style={input}
              />
              <input
                type="number"
                placeholder="Rate"
                onChange={(e) => updateTask(i, "rate", +e.target.value)}
                style={input}
              />
            </div>
          )}

          {t.mode === "rate" && (
            <input
              type="number"
              placeholder="Rate"
              onChange={(e) => updateTask(i, "rate", +e.target.value)}
              style={input}
            />
          )}

          {t.mode === "direct" && (
            <input
              type="number"
              placeholder="Amount"
              onChange={(e) => updateTask(i, "amount", +e.target.value)}
              style={input}
            />
          )}

          <div style={{ textAlign: "right", fontWeight: "bold" }}>
            ₹ {getTotal(t)}
          </div>
        </div>
      ))}

      <button onClick={addTask} style={addBtn}>+ Add Task</button>

      <div style={summary}>
        <div>Subtotal: ₹ {subtotal}</div>
        <div>SGST (9%): ₹ {sgst.toFixed(0)}</div>
        <div>CGST (9%): ₹ {cgst.toFixed(0)}</div>
        <div><b>Total: ₹ {total.toFixed(0)}</b></div>
      </div>

      <button onClick={generatePDF} style={mainBtn}>
        Generate Invoice
      </button>
    </div>
  );
}

/* STYLES */
const input = {
  width: "100%",
  padding: 10,
  marginBottom: 8,
  borderRadius: 8,
  border: "1px solid #ddd"
};

const card = {
  padding: 10,
  marginBottom: 10,
  borderRadius: 10,
  background: "#f9f9f9"
};

const addBtn = {
  width: "100%",
  padding: 10,
  marginBottom: 15,
  background: "#eee",
  border: "none",
  borderRadius: 8
};

const summary = {
  padding: 10,
  background: "#f1f1f1",
  borderRadius: 10,
  marginBottom: 10
};

const mainBtn = {
  width: "100%",
  padding: 12,
  background: "black",
  color: "white",
  border: "none",
  borderRadius: 10
};
