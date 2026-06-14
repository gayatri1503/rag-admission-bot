import { useState, useRef, useEffect } from "react"
import axios from "axios"

const API_URL = "http://127.0.0.1:5000"

const SUGGESTED = [
  "Colleges for 85 percentile general category?",
  "VJTI cutoff for OBC 2025?",
  "Best CS colleges in Pune for 90 percentile?",
  "COEP Electronics cutoff 2025?",
]

let uid = 1
const newId = () => `${uid++}`
const timeStr = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

function initMessages() {
  return [{
    role: "bot",
    content: "Hello! I'm your MHT CET Admission Assistant.\n\nI can help you with:\n• Cutoff data for 368+ colleges across 2022–2025\n• Category-wise cutoffs (General, OBC, SC, ST, EWS, TFWS)\n• College recommendations by percentile\n• CAP round guidance and strategy",
    sources: null,
    showFaqs: false,
    id: newId(),
  }]
}

// ─── Theme ───────────────────────────────────────────────────

function getColors(isDark) {
  return {
    bg: isDark
      ? "radial-gradient(circle at 15% 15%, rgba(124,58,237,0.12) 0%, transparent 50%), radial-gradient(circle at 85% 85%, rgba(79,70,229,0.1) 0%, transparent 50%), #080811"
      : "#f0f0f8",
    sidebar: isDark ? "#0d0d1a" : "#ffffff",
    sidebarBorder: isDark ? "rgba(255,255,255,0.07)" : "#e0e0ee",
    headerBg: isDark ? "rgba(8,8,17,0.9)" : "#ffffff",
    border: isDark ? "rgba(255,255,255,0.07)" : "#e0e0ee",
    text: isDark ? "#f1f5f9" : "#111827",
    textSub: isDark ? "#94a3b8" : "#374151",
    textMuted: isDark ? "#475569" : "#9ca3af",
    surface: isDark ? "rgba(255,255,255,0.04)" : "#f9f9ff",
    hoverBg: isDark ? "rgba(255,255,255,0.06)" : "#eeeefc",
    activeChat: isDark ? "rgba(124,58,237,0.15)" : "rgba(124,58,237,0.08)",
    inputBg: isDark ? "#1a1a2e" : "#ffffff",
    inputBorder: isDark ? "#3d3d6b" : "#d1d5db",
    botBubble: isDark ? "#1a1a2e" : "#f4f4f8",
    botBorder: isDark ? "rgba(255,255,255,0.08)" : "#e2e2f0",
  }
}

// ─── Auth Page ───────────────────────────────────────────────

function AuthPage({ onLogin, isDark }) {
  const [isLogin, setIsLogin] = useState(true)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const t = getColors(isDark)

  async function handleSubmit() {
    setError("")
    if (!email || !password || (!isLogin && !name)) {
      setError("Please fill in all fields")
      return
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setLoading(true)
    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register"
      const payload = isLogin ? { email, password } : { name, email, password }
      const res = await axios.post(`${API_URL}${endpoint}`, payload)
      localStorage.setItem("token", res.data.token)
      localStorage.setItem("user", JSON.stringify(res.data.user))
      onLogin(res.data.user)
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: "100%",
    background: isDark ? "#1a1a2e" : "#ffffff",
    border: `1.5px solid ${isDark ? "#3d3d6b" : "#d1d5db"}`,
    borderRadius: "10px",
    padding: "12px 14px",
    fontSize: "14px",
    color: t.text,
    outline: "none",
    fontFamily: "inherit",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  }

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: t.bg,
      fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "400px",
        padding: "0 20px",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            width: "52px", height: "52px", borderRadius: "14px",
            background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "24px", margin: "0 auto 14px",
            boxShadow: "0 0 24px rgba(124,58,237,0.4)",
          }}>🎓</div>
          <h1 style={{ fontSize: "22px", fontWeight: "700", color: t.text, marginBottom: "6px" }}>
            MHT CET Assistant
          </h1>
          <p style={{ fontSize: "13px", color: t.textMuted }}>
            {isLogin ? "Sign in to continue" : "Create your account"}
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: isDark ? "#0d0d1a" : "#ffffff",
          border: `1px solid ${t.sidebarBorder}`,
          borderRadius: "16px",
          padding: "28px 24px",
          boxShadow: isDark
            ? "0 8px 32px rgba(0,0,0,0.4)"
            : "0 4px 24px rgba(0,0,0,0.08)",
        }}>
          {/* Toggle */}
          <div style={{
            display: "flex",
            background: isDark ? "#1a1a2e" : "#f4f4f8",
            borderRadius: "10px",
            padding: "4px",
            marginBottom: "24px",
          }}>
            {["Login", "Register"].map((tab, i) => (
              <button key={tab} onClick={() => { setIsLogin(i === 0); setError("") }} style={{
                flex: 1,
                padding: "8px",
                borderRadius: "8px",
                border: "none",
                background: (isLogin ? i === 0 : i === 1)
                  ? "linear-gradient(135deg, #7c3aed, #5b21b6)"
                  : "transparent",
                color: (isLogin ? i === 0 : i === 1) ? "#fff" : t.textMuted,
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.2s",
              }}>{tab}</button>
            ))}
          </div>

          {/* Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {!isLogin && (
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: t.textSub, display: "block", marginBottom: "6px" }}>
                  Full Name
                </label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = "#7c3aed"}
                  onBlur={e => e.target.style.borderColor = isDark ? "#3d3d6b" : "#d1d5db"}
                />
              </div>
            )}

            <div>
              <label style={{ fontSize: "12px", fontWeight: "600", color: t.textSub, display: "block", marginBottom: "6px" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = "#7c3aed"}
                onBlur={e => e.target.style.borderColor = isDark ? "#3d3d6b" : "#d1d5db"}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
              />
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: "600", color: t.textSub, display: "block", marginBottom: "6px" }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = "#7c3aed"}
                onBlur={e => e.target.style.borderColor = isDark ? "#3d3d6b" : "#d1d5db"}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
              />
            </div>

            {error && (
              <div style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "8px",
                padding: "10px 14px",
                fontSize: "13px",
                color: "#ef4444",
              }}>
                {error}
              </div>
            )}

            <button onClick={handleSubmit} disabled={loading} style={{
              width: "100%",
              background: loading
                ? "rgba(124,58,237,0.5)"
                : "linear-gradient(135deg, #7c3aed, #5b21b6)",
              border: "none",
              borderRadius: "10px",
              padding: "12px",
              fontSize: "14px",
              fontWeight: "600",
              color: "#fff",
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              boxShadow: "0 4px 16px rgba(124,58,237,0.4)",
              transition: "all 0.2s",
              marginTop: "4px",
            }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = "translateY(-1px)" }}
              onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
            >
              {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
            </button>
          </div>
        </div>

        <p style={{ textAlign: "center", fontSize: "12px", color: t.textMuted, marginTop: "20px" }}>
          Official DTE Maharashtra data · 368 colleges · 2022–2025
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder { color: ${isDark ? "#475569" : "#9ca3af"} !important; }
      `}</style>
    </div>
  )
}

// ─── Components ──────────────────────────────────────────────

function BotAvatar({ thinking = false }) {
  return (
    <div style={{
      width: "34px", height: "34px", borderRadius: "10px",
      background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "16px", flexShrink: 0,
      boxShadow: "0 0 16px rgba(124,58,237,0.5)",
      animation: thinking ? "avatarPulse 1.5s ease-in-out infinite" : "none",
    }}>🎓</div>
  )
}

function Message({ msg, onFaq, isDark, t }) {
  const isUser = msg.role === "user"
  const [visible, setVisible] = useState(false)

  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])

  if (isUser) {
    return (
      <div style={{
        display: "flex", justifyContent: "flex-end", marginBottom: "20px",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.3s ease, transform 0.3s ease",
      }}>
        <div style={{
          maxWidth: "62%",
          background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
          borderRadius: "24px 24px 6px 24px",
          padding: "12px 18px",
          fontSize: "14px", lineHeight: "1.7", color: "#ffffff",
          boxShadow: "0 4px 20px rgba(124,58,237,0.4)",
        }}>{msg.content}</div>
      </div>
    )
  }

  return (
    <div style={{
      display: "flex", gap: "14px", marginBottom: "28px",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(12px)",
      transition: "opacity 0.3s ease, transform 0.3s ease",
    }}>
      <BotAvatar />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "12px", fontWeight: "700", color: "#a78bfa", marginBottom: "8px", letterSpacing: "0.5px", textTransform: "uppercase" }}>
          MHT CET Assistant
        </p>
        <div style={{
          background: t.botBubble,
          border: `1px solid ${t.botBorder}`,
          borderRadius: "4px 16px 16px 16px",
          padding: "16px 18px",
        }}>
          <div style={{ fontSize: "14px", lineHeight: "1.85", color: isDark ? "#e2e8f0" : "#1e293b", whiteSpace: "pre-wrap" }}>
            {msg.content.split(/(\*\*[^*]+\*\*)/).map((p, i) =>
              p.startsWith("**") && p.endsWith("**")
                ? <strong key={i} style={{ color: isDark ? "#fff" : "#000" }}>{p.slice(2, -2)}</strong>
                : <span key={i}>{p}</span>
            )}
          </div>

          {msg.sources?.length > 0 && (
            <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: `1px solid ${t.botBorder}` }}>
              <p style={{ fontSize: "10px", fontWeight: "700", color: "#7c3aed", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px" }}>
                📚 Official DTE Sources
              </p>
              {msg.sources.slice(0, 3).map((s, i) => (
                <div key={i} style={{
                  background: isDark ? "#12122a" : "#ececf8",
                  border: `1px solid ${isDark ? "rgba(124,58,237,0.2)" : "rgba(124,58,237,0.15)"}`,
                  borderRadius: "8px", padding: "8px 12px", marginBottom: "6px", fontSize: "12px",
                }}>
                  <span style={{ color: "#a78bfa", fontWeight: "700" }}>{s.college}</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px", alignItems: "center" }}>
                    <span style={{ color: isDark ? "#94a3b8" : "#64748b" }}>{s.branch}</span>
                    <span style={{ background: "rgba(124,58,237,0.15)", color: "#a78bfa", padding: "1px 8px", borderRadius: "10px", fontWeight: "600", fontSize: "10px" }}>{s.category}</span>
                    <span style={{ color: "#10b981", fontWeight: "700" }}>{typeof s.percentile === 'number' ? s.percentile.toFixed(2) : s.percentile}%</span>
                    <span style={{ color: isDark ? "#475569" : "#94a3b8" }}>{s.year}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {msg.showFaqs && msg.suggestions?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
            {msg.suggestions.map((f, i) => (
              <button key={i} onClick={() => onFaq(f)} style={{
                background: "transparent",
                border: `1px solid ${isDark ? "rgba(124,58,237,0.3)" : "rgba(124,58,237,0.25)"}`,
                borderRadius: "20px", padding: "5px 14px",
                fontSize: "12px", color: isDark ? "#94a3b8" : "#64748b",
                cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s ease",
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "#7c3aed"
                  e.currentTarget.style.color = "#a78bfa"
                  e.currentTarget.style.background = "rgba(124,58,237,0.1)"
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = isDark ? "rgba(124,58,237,0.3)" : "rgba(124,58,237,0.25)"
                  e.currentTarget.style.color = isDark ? "#94a3b8" : "#64748b"
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

function Typing() {
  return (
    <div style={{ display: "flex", gap: "14px", marginBottom: "28px" }}>
      <BotAvatar thinking={true} />
      <div style={{ paddingTop: "8px" }}>
        <p style={{ fontSize: "12px", fontWeight: "700", color: "#a78bfa", marginBottom: "10px", letterSpacing: "0.5px", textTransform: "uppercase" }}>Thinking...</p>
        <div style={{ display: "flex", gap: "5px" }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: "7px", height: "7px", borderRadius: "50%", background: "#7c3aed",
              animation: "bounce 1.2s ease-in-out infinite",
              animationDelay: `${i * 0.18}s`,
            }} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────

export default function App() {
  const [isDark, setIsDark] = useState(true)
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")) } catch { return null }
  })
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [search, setSearch] = useState("")
  const [chats, setChats] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [convos, setConvos] = useState({})
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const t = getColors(isDark)

  const token = localStorage.getItem("token")
  const authHeaders = { Authorization: `Bearer ${token}` }

  const msgs = convos[activeId] || []
  const filteredChats = chats.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  )

  // Load chats on login
  useEffect(() => {
    if (user) loadChats()
  }, [user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [convos, activeId, loading])

  async function loadChats() {
    try {
      const res = await axios.get(`${API_URL}/chats`, { headers: authHeaders })
      setChats(res.data.chats)
      
      // Always create a new chat on login
      const newRes = await axios.post(`${API_URL}/chats`, {}, { headers: authHeaders })
      const chat = newRes.data.chat
      setChats(p => [chat, ...res.data.chats])
      setActiveId(chat.id)
      setConvos(p => ({ ...p, [chat.id]: initMessages() }))
    } catch (e) {
      console.error("Load chats failed", e)
    }
  }

  async function loadMessages(chatId) {
    try {
      const res = await axios.get(`${API_URL}/chats/${chatId}/messages`, { headers: authHeaders })
      const msgs = res.data.messages.map(m => ({
        ...m,
        role: m.role,
        showFaqs: m.role === "bot",
        id: newId(),
      }))

      if (msgs.length === 0) {
        setConvos(p => ({ ...p, [chatId]: initMessages() }))
      } else {
        setConvos(p => ({ ...p, [chatId]: msgs }))
      }
    } catch (e) {
      console.error("Load messages failed", e)
    }
  }

  async function selectChat(chatId) {
    setActiveId(chatId)
    if (!convos[chatId]) {
      await loadMessages(chatId)
    }
  }

  async function newChat() {
    try {
      const res = await axios.post(`${API_URL}/chats`, {}, { headers: authHeaders })
      const chat = res.data.chat
      setChats(p => [chat, ...p])
      setActiveId(chat.id)
      setConvos(p => ({ ...p, [chat.id]: initMessages() }))
      setInput("")
      setSearch("")
      setTimeout(() => inputRef.current?.focus(), 100)
    } catch (e) {
      console.error("New chat failed", e)
    }
  }

  async function deleteChat(chatId, e) {
    e.stopPropagation()
    try {
      await axios.delete(`${API_URL}/chats/${chatId}`, { headers: authHeaders })
      const remaining = chats.filter(c => c.id !== chatId)
      setChats(remaining)
      if (activeId === chatId) {
        if (remaining.length > 0) {
          setActiveId(remaining[0].id)
          await loadMessages(remaining[0].id)
        } else {
          setActiveId(null)
          await newChat()
        }
      }
    } catch (e) {
      console.error("Delete failed", e)
    }
  }

  function logout() {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setUser(null)
    setChats([])
    setConvos({})
    setActiveId(null)
  }

  async function send(text) {
    const msg = (text || input).trim()
    if (!msg || loading || !activeId) return
    setInput("")

    const tempId = newId()
    setConvos(p => ({
      ...p,
      [activeId]: [...(p[activeId] || []), { role: "user", content: msg, id: tempId }]
    }))

    setLoading(true)
    try {
      const res = await axios.post(`${API_URL}/chat`, {
        message: msg,
        chat_id: activeId
      }, { headers: authHeaders })

      // Update chat title
      if (res.data.chat_title) {
        setChats(p => p.map(c =>
          c.id === activeId ? { ...c, title: res.data.chat_title } : c
        ))
      }

      setConvos(p => ({
        ...p,
        [activeId]: [...(p[activeId] || []), {
          role: "bot", id: newId(),
          content: res.data.answer,
          sources: res.data.sources,
          showFaqs: true,
          suggestions: res.data.suggestions || [],
        }]
      }))
    } catch (err) {
      setConvos(p => ({
        ...p,
        [activeId]: [...(p[activeId] || []), {
          role: "bot", id: newId(),
          content: "⚠️ Could not connect to backend. Make sure Flask is running on port 5000.",
          sources: null, showFaqs: false,
        }]
      }))
    } finally {
      setLoading(false)
    }
  }

  // Show auth page if not logged in
  if (!user) {
    return <AuthPage onLogin={setUser} isDark={isDark} />
  }

  return (
    <div style={{
      display: "flex", height: "100vh", overflow: "hidden",
      background: t.bg,
      fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
      transition: "all 0.3s ease",
    }}>

      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? "260px" : "0px",
        flexShrink: 0, overflow: "hidden",
        transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)",
        background: t.sidebar,
        borderRight: `1px solid ${t.sidebarBorder}`,
        display: "flex", flexDirection: "column",
      }}>
        <div style={{ width: "260px", height: "100%", display: "flex", flexDirection: "column" }}>

          <div style={{ padding: "16px 14px 12px", borderBottom: `1px solid ${t.sidebarBorder}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "10px",
                background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "18px", boxShadow: "0 0 20px rgba(124,58,237,0.4)",
              }}>🎓</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "13px", fontWeight: "700", color: t.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {user.name}
                </p>
                <p style={{ fontSize: "10px", color: t.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {user.email}
                </p>
              </div>
              <button onClick={() => setIsDark(d => !d)} style={{
                background: t.surface, border: `1px solid ${t.border}`,
                borderRadius: "8px", width: "28px", height: "28px",
                cursor: "pointer", fontSize: "13px",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: t.text, flexShrink: 0,
              }}>{isDark ? "☀️" : "🌙"}</button>
            </div>

            <button onClick={newChat} style={{
              width: "100%",
              background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
              border: "none", borderRadius: "10px",
              padding: "10px", color: "#fff",
              fontSize: "13px", fontWeight: "600",
              cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
              boxShadow: "0 4px 20px rgba(124,58,237,0.4)",
              marginBottom: "10px", transition: "all 0.2s ease",
            }}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
            >✏️ New Chat</button>

            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "12px", color: t.textMuted, pointerEvents: "none" }}>🔍</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search chats..."
                style={{
                  width: "100%", background: t.inputBg,
                  border: `1px solid ${t.inputBorder}`,
                  borderRadius: "8px", padding: "7px 10px 7px 28px",
                  fontSize: "12px", color: t.text, outline: "none", fontFamily: "inherit",
                }}
                onFocus={e => e.target.style.borderColor = "#7c3aed"}
                onBlur={e => e.target.style.borderColor = t.inputBorder}
              />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "10px 8px" }}>
            <p style={{ fontSize: "9px", fontWeight: "700", color: t.textMuted, padding: "4px 8px 8px", textTransform: "uppercase", letterSpacing: "1px" }}>
              Recent Chats
            </p>
            {filteredChats.length === 0 && (
              <p style={{ fontSize: "12px", color: t.textMuted, padding: "16px 8px", textAlign: "center" }}>No chats yet</p>
            )}
            {filteredChats.map(c => (
              <div key={c.id} onClick={() => selectChat(c.id)} style={{
                padding: "9px 10px", borderRadius: "8px",
                cursor: "pointer", marginBottom: "2px",
                background: c.id === activeId ? t.activeChat : "transparent",
                border: `1px solid ${c.id === activeId ? "rgba(124,58,237,0.3)" : "transparent"}`,
                transition: "all 0.15s ease",
                display: "flex", alignItems: "center", gap: "6px",
              }}
                onMouseEnter={e => { if (c.id !== activeId) e.currentTarget.style.background = t.hoverBg }}
                onMouseLeave={e => { if (c.id !== activeId) e.currentTarget.style.background = "transparent" }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: "12px", fontWeight: c.id === activeId ? "600" : "400",
                    color: c.id === activeId ? "#a78bfa" : t.textSub,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>{c.title}</p>
                  <p style={{ fontSize: "10px", color: t.textMuted, marginTop: "2px" }}>
                    {new Date(c.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <button onClick={(e) => deleteChat(c.id, e)} style={{
                  background: "transparent", border: "none",
                  color: t.textMuted, cursor: "pointer",
                  fontSize: "14px", padding: "2px 4px",
                  borderRadius: "4px", flexShrink: 0,
                  opacity: 0, transition: "opacity 0.15s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.color = "#ef4444" }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = "0"; e.currentTarget.style.color = t.textMuted }}
                >🗑</button>
              </div>
            ))}
          </div>

          <div style={{ padding: "12px 14px", borderTop: `1px solid ${t.sidebarBorder}` }}>
            <button onClick={logout} style={{
              width: "100%", background: "transparent",
              border: `1px solid ${t.border}`, borderRadius: "8px",
              padding: "8px", fontSize: "12px", color: t.textMuted,
              cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.color = "#ef4444" }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textMuted }}
            >Sign Out</button>
            <p style={{ fontSize: "10px", color: t.textMuted, textAlign: "center", marginTop: "8px" }}>
              DTE Maharashtra · 2022–2025 · 255K+ records
            </p>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>

        <div style={{
          padding: "12px 20px", borderBottom: `1px solid ${t.border}`,
          background: t.headerBg,
          display: "flex", alignItems: "center", gap: "12px", flexShrink: 0,
        }}>
          <button onClick={() => setSidebarOpen(o => !o)} style={{
            background: "transparent", border: `1px solid ${t.border}`,
            borderRadius: "8px", width: "32px", height: "32px",
            cursor: "pointer", fontSize: "15px", color: t.textSub,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.color = t.text; e.currentTarget.style.background = t.hoverBg }}
            onMouseLeave={e => { e.currentTarget.style.color = t.textSub; e.currentTarget.style.background = "transparent" }}
          >☰</button>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
            <p style={{ fontSize: "14px", fontWeight: "700", color: t.text }}>MHT CET Admission Assistant</p>
            <span style={{ fontSize: "10px", color: t.textMuted, background: t.surface, border: `1px solid ${t.border}`, borderRadius: "6px", padding: "2px 8px" }}>
              255K+ records
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: "11px", color: "#10b981", fontWeight: "600" }}>Live</span>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          <div style={{ maxWidth: "800px", margin: "0 auto", padding: "28px 24px 0" }}>
            {msgs.map(m => <Message key={m.id} msg={m} onFaq={send} isDark={isDark} t={t} />)}
            {loading && <Typing />}

            {msgs.length === 1 && (
              <div style={{ marginTop: "32px" }}>
                <p style={{ fontSize: "11px", color: t.textMuted, marginBottom: "14px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.8px" }}>Try asking</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {SUGGESTED.map((q, i) => (
                    <button key={i} onClick={() => send(q)} style={{
                      background: isDark ? "#1a1a2e" : "#ffffff",
                      border: `1px solid ${t.border}`,
                      borderRadius: "12px", padding: "14px 16px",
                      fontSize: "13px", color: t.textSub,
                      cursor: "pointer", textAlign: "left",
                      fontFamily: "inherit", lineHeight: "1.5",
                      transition: "all 0.2s ease",
                      boxShadow: isDark ? "none" : "0 1px 4px rgba(0,0,0,0.06)",
                    }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)"
                        e.currentTarget.style.color = t.text
                        e.currentTarget.style.transform = "translateY(-2px)"
                        e.currentTarget.style.boxShadow = "0 4px 20px rgba(124,58,237,0.15)"
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = t.border
                        e.currentTarget.style.color = t.textSub
                        e.currentTarget.style.transform = "translateY(0)"
                        e.currentTarget.style.boxShadow = isDark ? "none" : "0 1px 4px rgba(0,0,0,0.06)"
                      }}
                    >{q}</button>
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} style={{ height: "24px" }} />
          </div>
        </div>

        <div style={{ padding: "14px 24px 20px", background: "transparent", flexShrink: 0 }}>
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "10px",
              background: t.inputBg,
              border: `2px solid ${t.inputBorder}`,
              borderRadius: "16px", padding: "12px 14px",
              boxShadow: isDark ? "0 4px 24px rgba(0,0,0,0.5)" : "0 2px 12px rgba(0,0,0,0.08)",
              transition: "border-color 0.2s ease, box-shadow 0.2s ease",
            }}
              onFocusCapture={e => {
                e.currentTarget.style.borderColor = "#7c3aed"
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.15)"
              }}
              onBlurCapture={e => {
                e.currentTarget.style.borderColor = t.inputBorder
                e.currentTarget.style.boxShadow = isDark ? "0 4px 24px rgba(0,0,0,0.5)" : "0 2px 12px rgba(0,0,0,0.08)"
              }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder="Message MHT CET Assistant... (Enter to send)"
                rows={1}
                style={{
                  flex: 1, background: "transparent", border: "none", outline: "none",
                  fontSize: "14px", color: t.text, resize: "none",
                  fontFamily: "inherit", lineHeight: "1.6",
                  maxHeight: "160px", overflowY: "auto", padding: "4px 0",
                }}
              />
              <button onClick={() => send()} disabled={loading || !input.trim()} style={{
                width: "38px", height: "38px", borderRadius: "10px",
                background: loading || !input.trim()
                  ? (isDark ? "#2a2a4a" : "#e5e7eb")
                  : "linear-gradient(135deg, #7c3aed, #5b21b6)",
                border: "none",
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: loading || !input.trim() ? (isDark ? "#4a4a7a" : "#9ca3af") : "#ffffff",
                fontSize: "16px", flexShrink: 0,
                boxShadow: loading || !input.trim() ? "none" : "0 4px 16px rgba(124,58,237,0.5)",
                transition: "all 0.2s ease",
              }}>➤</button>
            </div>
            <p style={{ fontSize: "11px", color: t.textMuted, textAlign: "center", marginTop: "10px" }}>
              Official DTE Maharashtra data · 368 colleges · 2022–2025
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { overflow: hidden; }
        @keyframes bounce { 0%,60%,100%{transform:translateY(0);opacity:0.4} 30%{transform:translateY(-6px);opacity:1} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes avatarPulse { 0%,100%{box-shadow:0 0 16px rgba(124,58,237,0.5)} 50%{box-shadow:0 0 28px rgba(124,58,237,0.8)} }
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:rgba(124,58,237,0.3);border-radius:4px}
        textarea::placeholder{color:${isDark ? "rgba(148,163,184,0.5)" : "rgba(71,85,105,0.5)"}!important}
        input::placeholder{color:${isDark ? "rgba(148,163,184,0.5)" : "rgba(71,85,105,0.5)"}!important}
      `}</style>
    </div>
  )
}