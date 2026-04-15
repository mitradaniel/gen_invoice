"use client";
import { useState } from "react";

export default function Page() {

  const [tasks, setTasks] = useState([
    { name: "", qty: 0, rate: 0, amount: 0, type: "sqft" }
  ]);

  const [subject, setSubject] = useState("");
  const [invoice, setInvoice] = useState("2026/27/001");
  const [date, setDate] = useState("");
  const [to, setTo] = useState("");

  // ===== ADD TASK =====
  const addTask = () => {
    setTasks([
      ...tasks,
      { name: "", qty: 0, rate: 0, amount: 0, type: "sqft" }
    ]);
  };

  // ===== UPDATE TASK =====
  const updateTask = (i, field, value) => {
    const updated = [...tasks];
    updated[i][field] = value;
    setTasks(updated);
  };

  // ===== CALCULATE TOTAL =====
  const getTotal = (t) => {
    if (t.type === "direct") return t.amount || 0;
    return (t.qty || 0) * (t.rate || 0);
  };

  const subtotal = tasks.reduce((s, t) => s + getTotal(t), 0);
  const sgst = subtotal * 0.09;
  const cgst = subtotal * 0.09;
  const total = subtotal + sgst + cgst;

  // ===== GENERATE PDF =====
  const generatePDF = async () => {
    try {
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

    } catch (err) {
      alert("Error generating PDF");
    }
  };

  return (
    <div style={container}>

      <h2 style={title}>Khemraj M Rasganya Invoice</h2>

      {/* TO ADDRESS */}
      <textarea
        placeholder="To Address (multi-line)"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        style={input}
      />

      {/* SUBJECT */}
      <input
        placeholder="Subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        style={input}
      />

      {/* HEADER */}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={invoice}
          onChange={(e) => setInvoice(e.target.value)}
          style={{ ...input, flex: 1 }}
        />
        <input
          type="date"
          onChange={(e) => setDate(e.target.value)}
          style={{ ...input, flex: 1 }}
        />
      </div>

      <h4>Tasks</h4>

      {/* TASKS */}
      {tasks.map((t, i) => (
        <div key={i} style={card}>

          <input
            placeholder="Task description"
            value={t.name}
            onChange={(e) => updateTask(i, "name", e.target.value)}
            style={input}
          />

          {/* SINGLE RADIO */}
          <div style={radioGroup}>
            <label style={radioItem}>
              <input
                type="radio"
                value="sqft"
                checked={t.type === "sqft"}
                onChange={(e) => updateTask(i, "type", e.target.value)}
              />
              SQFT / RFT
            </label>

            <label style={radioItem}>
              <input
                type="radio"
                value="nos"
                checked={t.type === "nos"}
                onChange={(e) => updateTask(i, "type", e.target.value)}
              />
              Nos
            </label>

            <label style={radioItem}>
              <input
                type="radio"
                value="direct"
                checked={t.type === "direct"}
                onChange={(e) => updateTask(i, "type", e.target.value)}
              />
              Direct
            </label>
          </div>

          {/* DYNAMIC INPUTS */}
          {t.type !== "direct" && (
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="number"
                placeholder={t.type === "sqft" ? "SQFT / RFT" : "Qty"}
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

          {t.type === "direct" && (
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

      <button onClick={addTask} style={addBtn}>
        + Add Task
      </button>

      {/* SUMMARY */}
      <div style={summary}>
        <div>Subtotal: ₹ {subtotal}</div>
        <div>SGST (9%): ₹ {sgst.toFixed(0)}</div>
        <div>CGST (9%): ₹ {cgst.toFixed(0)}</div>
        <div style={{ fontWeight: "bold" }}>
          Total: ₹ {total.toFixed(0)}
        </div>
      </div>

      <button onClick={generatePDF} style={mainBtn}>
        Generate Invoice
      </button>

    </div>
  );
}

/* ===== STYLES ===== */

const container = {
  maxWidth: 480,
  margin: "auto",
  padding: 15,
  fontFamily: "sans-serif"
};

const title = {
  textAlign: "center",
  marginBottom: 15
};

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

const radioGroup = {
  display: "flex",
  gap: 12,
  marginBottom: 10
};

const radioItem = {
  display: "flex",
  alignItems: "center",
  gap: 4
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
