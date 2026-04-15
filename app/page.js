"use client";
import { useState } from "react";

export default function Page() {

  const [dark, setDark] = useState(false);
  const [loading, setLoading] = useState(false);

  const [docType, setDocType] = useState("INVOICE");
  const [remarks, setRemarks] = useState("");

  const [tasks, setTasks] = useState([
    { id: Date.now(), name: "", qty: 0, rate: 0, amount: 0, type: "sqft" }
  ]);

  const [subject, setSubject] = useState("");
  const [invoice, setInvoice] = useState("2026/27/001");
  const [date, setDate] = useState("");
  const [to, setTo] = useState("");

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
          total,
          docType,
          remarks
        })
      });

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url);

      setLoading(false);
    } catch {
      alert("PDF failed");
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: 520,
      margin: "auto",
      padding: 20,
      background: dark ? "#0b0b0c" : "#f5f5f7",
      color: dark ? "#fff" : "#000"
    }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>Invoice Generator</h2>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={generatePDF} style={topBtn}>
            {loading ? "..." : "PDF"}
          </button>

          <button onClick={() => setDark(!dark)} style={toggle}>
            {dark ? "☀️" : "🌙"}
          </button>
        </div>
      </div>

      {/* FORM */}
      <div style={{ paddingBottom: 150 }}>

        <textarea placeholder="To Address" value={to} onChange={(e) => setTo(e.target.value)} style={input} />
        <input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} style={input} />

        {/* DOC TYPE */}
        <div style={segmentedContainer}>
          <div style={{
            ...sliderTwo,
            transform: docType === "INVOICE" ? "translateX(0%)" : "translateX(100%)"
          }} />

          {["INVOICE", "QUOTATION"].map(type => (
            <div key={type} onClick={() => setDocType(type)} style={segmentItem(docType === type)}>
              {type}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <input value={invoice} onChange={(e) => setInvoice(e.target.value)} style={input} />
          <input type="date" onChange={(e) => setDate(e.target.value)} style={input} />
        </div>

        {tasks.map((t) => (
          <div key={t.id} style={card}>

            <div style={{ display: "flex", gap: 10 }}>
              <input value={t.name} onChange={(e) => updateTask(t.id, "name", e.target.value)} style={input} />
              <button onClick={() => deleteTask(t.id)}>✕</button>
            </div>

            {/* TASK TYPE */}
            <div style={segmentedContainer}>
              <div style={{
                ...slider,
                transform:
                  t.type === "sqft" ? "translateX(0%)" :
                  t.type === "nos" ? "translateX(100%)" :
                  "translateX(200%)"
              }} />

              {["sqft", "nos", "direct"].map(type => (
                <div
                  key={type}
                  onClick={() => updateTask(t.id, "type", type)}
                  style={segmentItem(t.type === type)}
                >
                  {type === "sqft" ? "SQFT/RFT" :
                   type === "nos" ? "Nos" :
                   "Direct"}
                </div>
              ))}
            </div>

            {/* INPUTS */}
            <div>
              {t.type !== "direct" ? (
                <div style={{ display: "flex", gap: 10 }}>
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
            </div>

            <div style={{ textAlign: "right" }}>
              ₹ {getTotal(t).toLocaleString("en-IN")}
            </div>

          </div>
        ))}

        <button onClick={addTask} style={addBtn}>+ Add Task</button>

        <textarea
          placeholder="Remarks"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          style={input}
        />

      </div>

      {/* FLOATING */}
      <div style={floating}>
        ₹ {total.toLocaleString("en-IN")}
        <div style={{ fontSize: 12 }}>Incl. GST</div>
      </div>

    </div>
  );
}

/* ===== STYLES ===== */

const input = { width: "100%", padding: 12, marginBottom: 10, borderRadius: 10, border: "1px solid #ddd" };
const card = { padding: 16, borderRadius: 16, background: "#fff", marginBottom: 12 };
const addBtn = { width: "100%", padding: 14, borderRadius: 12, background: "#000", color: "#fff" };

const segmentedContainer = { position: "relative", display: "flex", background: "#e5e7eb", borderRadius: 14, padding: 4, marginBottom: 12 };

const slider = { position: "absolute", top: 4, left: 4, width: "33.33%", height: "calc(100% - 8px)", background: "#000", borderRadius: 10, transition: "0.25s" };
const sliderTwo = { position: "absolute", top: 4, left: 4, width: "50%", height: "calc(100% - 8px)", background: "#000", borderRadius: 10, transition: "0.25s" };

const segmentItem = (active) => ({
  flex: 1,
  textAlign: "center",
  padding: 10,
  cursor: "pointer",
  zIndex: 1,
  color: active ? "#fff" : "#555",
  fontWeight: 500
});

const floating = {
  position: "fixed",
  bottom: 90,
  right: 20,
  padding: "12px 16px",
  borderRadius: 18,
  background: "rgba(255,255,255,0.6)",
  backdropFilter: "blur(20px)"
};

const topBtn = { padding: "10px 16px", borderRadius: 12, background: "#000", color: "#fff" };
const toggle = { padding: 10, borderRadius: 10 };
