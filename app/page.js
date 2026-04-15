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

  const addTask = () => {
    setTasks([...tasks, { name: "", qty: 0, rate: 0, amount: 0, type: "sqft" }]);
  };

  const updateTask = (i, field, value) => {
    const updated = [...tasks];
    updated[i][field] = value;
    setTasks(updated);
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
  };

  return (
    <div style={container}>

      <h2 style={title}>Invoice Generator</h2>

      {/* TO */}
      <textarea
        placeholder="To Address"
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
      <div style={row}>
        <input value={invoice} onChange={(e) => setInvoice(e.target.value)} style={input}/>
        <input type="date" onChange={(e) => setDate(e.target.value)} style={input}/>
      </div>

      <h4 style={{ marginTop: 20 }}>Tasks</h4>

      {tasks.map((t, i) => (
        <div key={i} style={card}>

          <input
            placeholder="Task description"
            value={t.name}
            onChange={(e) => updateTask(i, "name", e.target.value)}
            style={input}
          />

          {/* SEGMENTED CONTROL */}
          <div style={segmented}>
            {["sqft", "nos", "direct"].map(type => (
              <div
                key={type}
                onClick={() => updateTask(i, "type", type)}
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

          {/* INPUTS */}
          {t.type !== "direct" ? (
            <div style={row}>
              <input
                type="number"
                placeholder={t.type === "sqft" ? "SQFT/RFT" : "Qty"}
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
          ) : (
            <input
              type="number"
              placeholder="Amount"
              onChange={(e) => updateTask(i, "amount", +e.target.value)}
              style={input}
            />
          )}

          <div style={amount}>₹ {getTotal(t)}</div>

        </div>
      ))}

      <button onClick={addTask} style={addBtn}>+ Add Task</button>

      {/* SUMMARY */}
      <div style={summary}>
        <div>Subtotal ₹ {subtotal}</div>
        <div>SGST ₹ {sgst.toFixed(0)}</div>
        <div>CGST ₹ {cgst.toFixed(0)}</div>
        <div style={{ fontWeight: "bold" }}>Total ₹ {total.toFixed(0)}</div>
      </div>

      {/* FLOATING BUTTON */}
      <button onClick={generatePDF} style={floatingBtn}>
        Generate PDF
      </button>

    </div>
  );
}

/* ===== PREMIUM STYLES ===== */

const container = {
  maxWidth: 480,
  margin: "auto",
  padding: 20,
  fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif"
};

const title = {
  textAlign: "center",
  marginBottom: 20,
  fontWeight: 600
};

const input = {
  width: "100%",
  padding: 12,
  marginBottom: 10,
  borderRadius: 12,
  border: "1px solid #eee",
  background: "#fafafa"
};

const row = {
  display: "flex",
  gap: 10
};

const card = {
  padding: 15,
  borderRadius: 16,
  background: "rgba(255,255,255,0.7)",
  backdropFilter: "blur(10px)",
  marginBottom: 12,
  boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
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
  cursor: "pointer",
  fontSize: 13
};

const amount = {
  textAlign: "right",
  fontWeight: "bold",
  marginTop: 5
};

const addBtn = {
  width: "100%",
  padding: 12,
  borderRadius: 12,
  background: "#eee",
  border: "none",
  marginBottom: 15
};

const summary = {
  padding: 15,
  borderRadius: 16,
  background: "#f7f7f7",
  marginBottom: 80
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
  border: "none",
  fontSize: 16,
  boxShadow: "0 8px 20px rgba(0,0,0,0.2)"
};
