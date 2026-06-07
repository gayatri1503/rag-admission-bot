import { useState, useRef, useEffect } from "react"
import axios from "axios"

const API_URL = "http://127.0.0.1:5000"

const FAQS = [
  "📄 Documents needed for CAP Round 1?",
  "🔄 Explain freeze, float and slide",
  "💰 What is TFWS category?",
  "🇮🇳 Difference between AI and MH seats?",
]

const SUGGESTED = [
  "Colleges for 85 percentile general category?",
  "VJTI cutoff for OBC 2025?",
  "Best CS colleges in Pune for 90 percentile?",
  "COEP Electronics cutoff 2025?",
]

const COLORS = {
  purple: "#7c3aed",
  purpleLight: "#a78bfa",
  purpleDark: "#5b21b6",
  green: "#10b981",
  red: "#ef4444",
}

function useTheme(isDark) {
  return {
    bg: isDark ? "#0a0a0f" : "#fafafa",
    surface: isDark ? "#111118" : "#ffffff",
    surface2: isDark ? "#1a1a24" : "#f4f4f8",
    surface3: isDark ? "#22223a" : "#ebebf5",
    border: isDark ? "rgba(124,58,237,0.15)" : "rgba(124,58,237,0.12)",
    text: isDark ? "#f0f0ff" : "#0a0a1a",
    textSub: isDark ? "#6b6b8a" : "#8888aa",
    textMuted: isDark ? "#3d3d5c" : "#c0c0d8",
    userBubble: "linear-gradient(135deg, #7c3aed, #5b21b6)",
    botBubble: isDark ? "#1a1a24" : "#f0f0f8",
    inputBg: isDark ? "#1a1a24" : "#f0f0f8",
  }
}

let uid = 1
const newId = () => `c${uid++}`

function timeStr() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function initMessages() {
  return [{
    role: "bot",
    content: "Hi! I'm your **MHT CET Admission Assistant**.\n\nI have access to official DTE Maharashtra cutoff data for 368+ colleges across 2022–2025. Ask me anything about:\n\n• College recommendations by percentile\n• Category-wise cutoffs (GOPENS, OBC, SC, ST, EWS, TFWS)\n• CAP round strategy\n• Document checklists",
    sources: null,
    showFaqs: false,
    id: newId(),
  }]
}

function MarkdownText({ text, color }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <span style={{ color }}>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**")
          ? <strong key={i}>{p.slice(2, -2)}</strong>
          : <span key={i} style={{ whiteSpace: "pre-wrap" }}>{p}</span>
      )}
    </span>
  )
}

function Bubble({ msg, onFaq, t, isDark }) {
  const isUser = msg.role === "user"
  return (
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      padding: "6px 20px",
      gap: "10px",
      alignItems: "flex-start",
    }}>
      {!isUser && (
        <div style={{
          width: "30px", height: "30px", borderRadius: "10px",
          background: `linear-gradient(135deg, ${COLORS.purple}, ${COLORS.purpleDark})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "14px", flexShrink: 0, marginTop: "2px",
          boxShadow: `0 4px 12px ${COLORS.purple}40`,
        }}>🎓</div>
      )}

      <div style={{ maxWidth: "68%", display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{
          background: isUser ? t.userBubble : t.botBubble,
          borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
          padding: "12px 16px",
          fontSize: "13.5px",
          lineHeight: "1.75",
          color: isUser ? "#fff" : t.text,
          boxShadow: isUser
            ? `0 4px 20px ${COLORS.purple}30`
            : `0 2px 8px rgba(0,0,0,0.08)`,
          border: isUser ? "none" : `1px solid ${t.border}`,
          transition: "all 0.2s",
        }}>
          <MarkdownText text={msg.content} color={isUser ? "#fff" : t.text} />

          {msg.sources?.length > 0 && (
            <div style={{
              marginTop: "12px",
              paddingTop: "10px",
              borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
            }}>
              <p style={{ fontSize: "10px", color: t.textSub, marginBottom: "6px", fontWeight: "700", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                Sources
              </p>
              {msg.sources.slice(0, 3).map((s, i) => (
                <div key={i} style={{
                  background: isDark ? "rgba(124,58,237,0.08)" : "rgba(124,58,237,0.05)",
                  border: `1px solid ${isDark ? "rgba(124,58,237,0.15)" : "rgba(124,58,237,0.1)"}`,
                  borderRadius: "8px",
                  padding: "6px 10px",
                  marginBottom: "4px",
                  fontSize: "11px",
                }}>
                  <span style={{ color: COLORS.purpleLight, fontWeight: "600" }}>{s.college}</span>
                  <span style={{ color: t.textSub }}> · {s.branch} · </span>
                  <span style={{ color: COLORS.green, fontWeight: "600" }}>{s.category}</span>
                  <span style={{ color: t.textSub }}> · </span>
                  <span style={{ color: t.text, fontWeight: "700" }}>{s.percentile?.toFixed(2)}%</span>
                  <span style={{ color: t.textSub }}> · {s.year}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {msg.showFaqs && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {FAQS.map((f, i) => (
              <button key={i} onClick={() => onFaq(f.replace(/^[^\w]+/, ""))} style={{
                background: "transparent",
                border: `1px solid ${t.border}`,
                borderRadius: "20px",
                padding: "5px 12px",
                fontSize: "11px",
                color: t.textSub,
                cursor: "pointer",
                transition: "all 0.2s",
                fontFamily: "inherit",
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = COLORS.purple
                  e.currentTarget.style.color = COLORS.purpleLight
                  e.currentTarget.style.background = `${COLORS.purple}15`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = t.border
                  e.currentTarget.style.color = t.textSub
                  e.currentTarget.style.background = "transparent"
                }}
              >{f}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Dots({ t }) {
  return (
    <div style={{ display: "flex", padding: "6px 20px", gap: "10px", alignItems: "center" }}>
      <div style={{
        width: "30px", height: "30px", borderRadius: "10px",
        background: `linear-gradient(135deg, ${COLORS.purple}, ${COLORS.purpleDark})`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "14px", flexShrink: 0,
      }}>🎓</div>
      <div style={{
        background: t.botBubble,
        border: `1px solid ${t.border}`,
        borderRadius: "16px 16px 16px 4px",
        padding: "12px 16px",
        display: "flex", gap: "5px", alignItems: "center",
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: "6px", height: "6px", borderRadius: "50%",
            background: COLORS.purple,
            animation: "bounce 1.2s ease-in-out infinite",
            animationDelay: `${i * 0.18}s`,
          }} />
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const [isDark, setIsDark] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [chats, setChats] = useState(() => {
    const id = newId()
    return [{ id, title: "New conversation", time: timeStr() }]
  })
  const [activeId, setActiveId] = useState(() => chats[0]?.id)
  const [convos, setConvos] = useState(() => ({ [chats[0]?.id]: initMessages() }))
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const t = useTheme(isDark)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [convos, activeId, loading])

  function newChat() {
    const id = newId()
    setChats(p => [{ id, title: "New conversation", time: timeStr() }, ...p])
    setConvos(p => ({ ...p, [id]: initMessages() }))
    setActiveId(id)
    setInput("")
    inputRef.current?.focus()
  }

  async function send(text) {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput("")

    setChats(p => p.map(c =>
      c.id === activeId && c.title === "New conversation"
        ? { ...c, title: msg.slice(0, 32) + (msg.length > 32 ? "…" : "") }
        : c
    ))

    setConvos(p => ({
      ...p,
      [activeId]: [...(p[activeId] || []), { role: "user", content: msg, id: newId() }]
    }))

    setLoading(true)
    try {
      const res = await axios.post(`${API_URL}/chat`, { message: msg })
      setConvos(p => ({
        ...p,
        [activeId]: [...(p[activeId] || []), {
          role: "bot",
          content: res.data.answer,
          sources: res.data.sources,
          showFaqs: true,
          id: newId(),
        }]
      }))
    } catch {
      setConvos(p => ({
        ...p,
        [activeId]: [...(p[activeId] || []), {
          role: "bot",
          content: "⚠️ Could not connect to the server. Please make sure the Flask backend is running on port 5000.",
          sources: null,
          showFaqs: false,
          id: newId(),
        }]
      }))
    } finally {
      setLoading(false)
    }
  }

  const msgs = convos[activeId] || []

  return (
    <div style={{
      display: "flex", height: "100vh", overflow: "hidden",
      background: t.bg,
      fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
      transition: "background 0.3s",
    }}>

      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? "260px" : "0px",
        flexShrink: 0,
        overflow: "hidden",
        transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)",
        background: t.surface,
        borderRight: `1px solid ${t.border}`,
        display: "flex",
        flexDirection: "column",
      }}>
        <div style={{ width: "260px", display: "flex", flexDirection: "column", height: "100%" }}>

          {/* Sidebar header */}
          <div style={{ padding: "20px 16px 14px", borderBottom: `1px solid ${t.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "10px",
                background: `linear-gradient(135deg, ${COLORS.purple}, ${COLORS.purpleDark})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "18px", boxShadow: `0 4px 12px ${COLORS.purple}40`,
              }}>🎓</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "13px", fontWeight: "700", color: t.text, letterSpacing: "-0.3px" }}>MHT CET Bot</p>
                <p style={{ fontSize: "10px", color: t.textSub }}>Admission Assistant</p>
              </div>
              <button onClick={() => setIsDark(d => !d)} style={{
                background: t.surface2,
                border: `1px solid ${t.border}`,
                borderRadius: "8px",
                width: "30px", height: "30px",
                cursor: "pointer", fontSize: "14px",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>{isDark ? "☀️" : "🌙"}</button>
            </div>

            <button onClick={newChat} style={{
              width: "100%",
              background: `linear-gradient(135deg, ${COLORS.purple}, ${COLORS.purpleDark})`,
              border: "none", borderRadius: "10px",
              padding: "10px", color: "#fff",
              fontSize: "13px", fontWeight: "600",
              cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center",
              gap: "6px", letterSpacing: "-0.2px",
              boxShadow: `0 4px 14px ${COLORS.purple}40`,
              transition: "all 0.2s",
              fontFamily: "inherit",
            }}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
            >✏️ New Chat</button>
          </div>

          {/* Chat list */}
          <div style={{ flex: 1, overflowY: "auto", padding: "10px 8px" }}>
            <p style={{
              fontSize: "9px", color: t.textMuted, fontWeight: "700",
              padding: "4px 8px 8px", textTransform: "uppercase", letterSpacing: "1px"
            }}>Recent</p>
            {chats.map(c => (
              <div key={c.id} onClick={() => setActiveId(c.id)} style={{
                padding: "9px 12px", borderRadius: "10px",
                cursor: "pointer", marginBottom: "2px",
                background: c.id === activeId ? `${COLORS.purple}18` : "transparent",
                border: `1px solid ${c.id === activeId ? `${COLORS.purple}30` : "transparent"}`,
                transition: "all 0.15s",
              }}
                onMouseEnter={e => {
                  if (c.id !== activeId) e.currentTarget.style.background = t.surface2
                }}
                onMouseLeave={e => {
                  if (c.id !== activeId) e.currentTarget.style.background = "transparent"
                }}
              >
                <p style={{
                  fontSize: "12px", color: c.id === activeId ? COLORS.purpleLight : t.text,
                  fontWeight: c.id === activeId ? "600" : "400",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>{c.title}</p>
                <p style={{ fontSize: "10px", color: t.textSub, marginTop: "2px" }}>{c.time}</p>
              </div>
            ))}
          </div>

          {/* Sidebar footer */}
          <div style={{ padding: "12px 16px", borderTop: `1px solid ${t.border}` }}>
            <p style={{ fontSize: "10px", color: t.textMuted, textAlign: "center" }}>
              Data: DTE Maharashtra · 2022–2025
            </p>
          </div>
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>

        {/* Top bar */}
        <div style={{
          padding: "12px 20px",
          background: t.surface,
          borderBottom: `1px solid ${t.border}`,
          display: "flex", alignItems: "center", gap: "12px",
          flexShrink: 0,
        }}>
          <button onClick={() => setSidebarOpen(o => !o)} style={{
            background: t.surface2,
            border: `1px solid ${t.border}`,
            borderRadius: "8px",
            width: "32px", height: "32px",
            cursor: "pointer", fontSize: "16px",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: t.textSub, flexShrink: 0,
            transition: "all 0.2s",
          }}
            onMouseEnter={e => e.currentTarget.style.color = COLORS.purpleLight}
            onMouseLeave={e => e.currentTarget.style.color = t.textSub}
          >{sidebarOpen ? "◀" : "▶"}</button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: "14px", fontWeight: "700", color: t.text, letterSpacing: "-0.3px" }}>
              MHT CET Admission Assistant
            </h1>
            <p style={{ fontSize: "10px", color: t.textSub }}>
              RAG · Llama 3.1 · ChromaDB · 255K+ records
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{
              width: "6px", height: "6px", borderRadius: "50%",
              background: COLORS.green,
              boxShadow: `0 0 6px ${COLORS.green}`,
              animation: "pulse 2s infinite",
            }} />
            <span style={{ fontSize: "11px", color: COLORS.green, fontWeight: "600" }}>Live</span>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", paddingTop: "16px", paddingBottom: "8px" }}>
          {msgs.map(m => <Bubble key={m.id} msg={m} onFaq={send} t={t} isDark={isDark} />)}
          {loading && <Dots t={t} />}
          <div ref={bottomRef} />
        </div>

        {/* Suggested questions */}
        {msgs.length === 1 && (
          <div style={{
            padding: "0 20px 12px",
            display: "flex", gap: "8px", flexWrap: "wrap",
          }}>
            {SUGGESTED.map((q, i) => (
              <button key={i} onClick={() => send(q)} style={{
                background: "transparent",
                border: `1px solid ${t.border}`,
                borderRadius: "20px",
                padding: "7px 14px",
                fontSize: "12px",
                color: t.textSub,
                cursor: "pointer",
                transition: "all 0.2s",
                fontFamily: "inherit",
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = COLORS.purple
                  e.currentTarget.style.color = COLORS.purpleLight
                  e.currentTarget.style.background = `${COLORS.purple}12`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = t.border
                  e.currentTarget.style.color = t.textSub
                  e.currentTarget.style.background = "transparent"
                }}
              >{q}</button>
            ))}
          </div>
        )}

        {/* Input area */}
        <div style={{
          padding: "14px 20px",
          background: t.surface,
          borderTop: `1px solid ${t.border}`,
          display: "flex", gap: "10px", alignItems: "flex-end",
          flexShrink: 0,
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            placeholder="Ask about colleges, cutoffs, CAP rounds… (Enter to send)"
            rows={1}
            style={{
              flex: 1,
              background: t.inputBg,
              border: `1px solid ${t.border}`,
              borderRadius: "12px",
              padding: "11px 16px",
              fontSize: "13.5px",
              color: t.text,
              resize: "none",
              outline: "none",
              fontFamily: "inherit",
              lineHeight: "1.6",
              transition: "border-color 0.2s",
            }}
            onFocus={e => e.target.style.borderColor = COLORS.purple}
            onBlur={e => e.target.style.borderColor = t.border}
          />
          <button onClick={() => send()} disabled={loading || !input.trim()} style={{
            width: "42px", height: "42px",
            borderRadius: "12px",
            background: loading || !input.trim()
              ? t.surface2
              : `linear-gradient(135deg, ${COLORS.purple}, ${COLORS.purpleDark})`,
            border: `1px solid ${loading || !input.trim() ? t.border : "transparent"}`,
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: loading || !input.trim() ? t.textMuted : "#fff",
            fontSize: "16px",
            transition: "all 0.2s",
            flexShrink: 0,
            boxShadow: loading || !input.trim() ? "none" : `0 4px 14px ${COLORS.purple}40`,
          }}
            onMouseEnter={e => {
              if (!loading && input.trim()) e.currentTarget.style.transform = "translateY(-1px)"
            }}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
          >➤</button>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { overflow: hidden; }
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.6; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${COLORS.purple}40; border-radius: 2px; }
        textarea::placeholder { color: ${isDark ? "#3d3d5c" : "#aaaacc"}; }
      `}</style>
    </div>
  )
}