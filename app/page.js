"use client";
import { useState } from "react";

export default function Page() {

  const [tasks, setTasks] = useState([
    { id: Date.now(), name: "", qty: 0, rate: 0, amount: 0, type: "sqft" }
  ]);

  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [invoice, setInvoice] = useState("2026/27/001");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);

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
    setTasks(tasks.map(t =>
      t.id === id ? { ...t, [field]: value } : t
    ));
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

  const subtotal = tasks.reduce((sum, t) => sum + getTotal(t), 0);
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
      const text = await res.text();
      console.log("API ERROR:", text);
      alert("Backend error: " + text);
      setLoading(false);
      return;
    }

    const blob = await res.blob();

    const url = window.URL.createObjectURL(blob);
    window.open(url);

    setLoading(false);

  } catch (err) {
    console.error("FRONTEND ERROR:", err);
    alert(err.message);
    setLoading(false);
  }
};

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20 }}>

      <h2>Invoice Generator</h2>

      <textarea placeholder="To Address" value={to} onChange={e => setTo(e.target.value)} />

      <input placeholder="Subject" value={subject} onChange={e => setSubject(e.target.value)} />

      <input value={invoice} onChange={e => setInvoice(e.target.value)} />
      <input type="date" onChange={e => setDate(e.target.value)} />

      <h4>Tasks</h4>

      {tasks.map(t => (
        <div key={t.id} style={{ border: "1px solid #ddd", padding: 10, marginBottom: 10 }}>

          <input value={t.name} placeholder="Task" onChange={e => updateTask(t.id, "name", e.target.value)} />

          <div>
            <label>
              <input type="radio" checked={t.type === "sqft"} onChange={() => updateTask(t.id, "type", "sqft")} />
              SQFT
            </label>
            <label>
              <input type="radio" checked={t.type === "nos"} onChange={() => updateTask(t.id, "type", "nos")} />
              Nos
            </label>
            <label>
              <input type="radio" checked={t.type === "direct"} onChange={() => updateTask(t.id, "type", "direct")} />
              Direct
            </label>
          </div>

          {t.type !== "direct" ? (
            <>
              <input type="number" placeholder="Qty" onChange={e => updateTask(t.id, "qty", +e.target.value)} />
              <input type="number" placeholder="Rate" onChange={e => updateTask(t.id, "rate", +e.target.value)} />
            </>
          ) : (
            <input type="number" placeholder="Amount" onChange={e => updateTask(t.id, "amount", +e.target.value)} />
          )}

          <div>₹ {getTotal(t)}</div>

          <button onClick={() => deleteTask(t.id)}>Delete</button>

        </div>
      ))}

      <button onClick={addTask}>Add Task</button>

      <h3>Total: ₹ {total.toFixed(0)}</h3>

      <button onClick={generatePDF}>
        {loading ? "Generating..." : "Generate PDF"}
      </button>

    </div>
  );
}
