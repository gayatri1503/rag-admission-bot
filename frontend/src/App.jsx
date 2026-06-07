import { useState, useRef, useEffect } from "react"
import axios from "axios"

const API_URL = "http://127.0.0.1:5000"

const FAQS = [
  "What documents do I need for CAP Round 1?",
  "Explain freeze, float and slide options",
  "What is TFWS category?",
  "What is the difference between AI and MH seats?",
]

const SUGGESTED_QUESTIONS = [
  "Which colleges can I get with 85 percentile general category?",
  "What is VJTI cutoff for OBC category 2025?",
  "Best CS colleges in Pune for 90 percentile?",
  "COEP cutoff for Electronics 2025?",
]

function MessageBubble({ message, onFaqClick, isDark }) {
  const isUser = message.role === "user"

  return (
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: "16px",
      padding: "0 20px",
    }}>
      {!isUser && (
        <div style={{
          width: "34px", height: "34px", borderRadius: "50%",
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "16px", marginRight: "10px", flexShrink: 0, marginTop: "2px",
        }}>🎓</div>
      )}

      <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{
          background: isUser
            ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
            : isDark ? "#1e2130" : "#f1f5f9",
          borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          padding: "12px 16px",
          fontSize: "14px",
          lineHeight: "1.7",
          color: isUser ? "#fff" : isDark ? "#e2e8f0" : "#1e293b",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}>
          <p style={{ whiteSpace: "pre-wrap" }}>{message.content}</p>

          {message.sources && message.sources.length > 0 && (
            <div style={{
              marginTop: "12px",
              borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
              paddingTop: "10px"
            }}>
              <p style={{ fontSize: "11px", color: isDark ? "#94a3b8" : "#64748b", marginBottom: "6px", fontWeight: "600" }}>
                📚 Sources from official DTE data
              </p>
              {message.sources.slice(0, 3).map((source, i) => (
                <div key={i} style={{
                  background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                  borderRadius: "8px",
                  padding: "6px 10px",
                  marginBottom: "4px",
                  fontSize: "11px",
                  color: isDark ? "#cbd5e1" : "#475569",
                }}>
                  <span style={{ color: "#a78bfa", fontWeight: "600" }}>{source.college}</span>
                  {" · "}{source.branch}
                  {" · "}<span style={{ color: "#22c55e" }}>{source.category}</span>
                  {" · "}<strong>{source.percentile?.toFixed(2)}%</strong>
                  {" · "}{source.year}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FAQs after assistant message */}
        {!isUser && message.showFaqs && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
            {FAQS.map((faq, i) => (
              <button key={i} onClick={() => onFaqClick(faq)} style={{
                background: "transparent",
                border: `1px solid ${isDark ? "#2d3148" : "#cbd5e1"}`,
                borderRadius: "16px",
                padding: "6px 12px",
                fontSize: "11px",
                color: isDark ? "#94a3b8" : "#64748b",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
                onMouseEnter={e => {
                  e.target.style.borderColor = "#6366f1"
                  e.target.style.color = "#6366f1"
                }}
                onMouseLeave={e => {
                  e.target.style.borderColor = isDark ? "#2d3148" : "#cbd5e1"
                  e.target.style.color = isDark ? "#94a3b8" : "#64748b"
                }}
              >{faq}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TypingIndicator({ isDark }) {
  return (
    <div style={{ display: "flex", padding: "0 20px", marginBottom: "16px" }}>
      <div style={{
        width: "34px", height: "34px", borderRadius: "50%",
        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "16px", marginRight: "10px", flexShrink: 0,
      }}>🎓</div>
      <div style={{
        background: isDark ? "#1e2130" : "#f1f5f9",
        borderRadius: "18px 18px 18px 4px",
        padding: "14px 18px",
        display: "flex", gap: "5px", alignItems: "center",
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: "7px", height: "7px", borderRadius: "50%",
            background: "#6366f1",
            animation: "bounce 1.2s infinite",
            animationDelay: `${i * 0.2}s`,
          }} />
        ))}
      </div>
    </div>
  )
}

function Sidebar({ chats, activeChatId, onSelectChat, onNewChat, isDark, onToggleTheme }) {
  const bg = isDark ? "#0d0f1a" : "#f8fafc"
  const border = isDark ? "#1e2130" : "#e2e8f0"
  const text = isDark ? "#e2e8f0" : "#1e293b"
  const subtext = isDark ? "#64748b" : "#94a3b8"
  const hover = isDark ? "#1e2130" : "#f1f5f9"
  const active = isDark ? "#2d3148" : "#e0e7ff"

  return (
    <div style={{
      width: "260px",
      flexShrink: 0,
      background: bg,
      borderRight: `1px solid ${border}`,
      display: "flex",
      flexDirection: "column",
      height: "100vh",
    }}>
      {/* Logo */}
      <div style={{ padding: "20px 16px 12px", borderBottom: `1px solid ${border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "10px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px",
          }}>🎓</div>
          <div>
            <p style={{ fontSize: "13px", fontWeight: "700", color: text }}>MHT CET Bot</p>
            <p style={{ fontSize: "10px", color: subtext }}>Admission Assistant</p>
          </div>
          {/* Theme toggle */}
          <button onClick={onToggleTheme} style={{
            marginLeft: "auto",
            background: "transparent",
            border: `1px solid ${border}`,
            borderRadius: "8px",
            padding: "4px 8px",
            cursor: "pointer",
            fontSize: "14px",
            color: text,
          }}>{isDark ? "☀️" : "🌙"}</button>
        </div>

        {/* New chat button */}
        <button onClick={onNewChat} style={{
          width: "100%",
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          border: "none",
          borderRadius: "10px",
          padding: "10px",
          color: "#fff",
          fontSize: "13px",
          fontWeight: "600",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
        }}>
          ✏️ New Chat
        </button>
      </div>

      {/* Chat history */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 8px" }}>
        <p style={{ fontSize: "10px", color: subtext, fontWeight: "600", padding: "0 8px", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Recent Chats
        </p>
        {chats.length === 0 && (
          <p style={{ fontSize: "12px", color: subtext, padding: "8px", textAlign: "center" }}>
            No chats yet
          </p>
        )}
        {chats.map(chat => (
          <div key={chat.id} onClick={() => onSelectChat(chat.id)} style={{
            padding: "10px 12px",
            borderRadius: "10px",
            cursor: "pointer",
            background: chat.id === activeChatId ? active : "transparent",
            marginBottom: "2px",
            transition: "background 0.15s",
          }}
            onMouseEnter={e => {
              if (chat.id !== activeChatId)
                e.currentTarget.style.background = hover
            }}
            onMouseLeave={e => {
              if (chat.id !== activeChatId)
                e.currentTarget.style.background = "transparent"
            }}
          >
            <p style={{
              fontSize: "12px", color: text, fontWeight: "500",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>{chat.title}</p>
            <p style={{ fontSize: "10px", color: subtext, marginTop: "2px" }}>{chat.time}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: "12px 16px", borderTop: `1px solid ${border}` }}>
        <p style={{ fontSize: "10px", color: subtext, textAlign: "center" }}>
          Data: DTE Maharashtra · 2022–2025
        </p>
      </div>
    </div>
  )
}

let chatIdCounter = 1

function createWelcomeMessage() {
  return {
    role: "assistant",
    content: "Hi! I'm your MHT CET Admission Assistant 🎓\n\nI can help you with:\n• College recommendations based on your percentile\n• Cutoff data for 368+ colleges across 2022-2025\n• Category-wise cutoffs (General, OBC, SC, ST, EWS, TFWS)\n• CAP round guidance\n\nWhat would you like to know?",
    showFaqs: false,
  }
}

export default function App() {
  const [isDark, setIsDark] = useState(true)
  const [chats, setChats] = useState([])
  const [activeChatId, setActiveChatId] = useState(null)
  const [conversations, setConversations] = useState({})
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  // Initialize first chat
  useEffect(() => {
    createNewChat()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [conversations, activeChatId, loading])

  function createNewChat() {
    const id = `chat_${chatIdCounter++}`
    const now = new Date()
    const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

    const newChat = { id, title: "New conversation", time }
    setChats(prev => [newChat, ...prev])
    setConversations(prev => ({
      ...prev,
      [id]: [createWelcomeMessage()]
    }))
    setActiveChatId(id)
    setInput("")
  }

  const activeMessages = conversations[activeChatId] || []

  const sendMessage = async (text) => {
    const userMessage = text || input.trim()
    if (!userMessage || loading) return

    setInput("")

    // Update chat title from first user message
    setChats(prev => prev.map(c =>
      c.id === activeChatId && c.title === "New conversation"
        ? { ...c, title: userMessage.slice(0, 35) + (userMessage.length > 35 ? "..." : "") }
        : c
    ))

    // Add user message
    setConversations(prev => ({
      ...prev,
      [activeChatId]: [...(prev[activeChatId] || []), { role: "user", content: userMessage }]
    }))

    setLoading(true)

    try {
      const response = await axios.post(`${API_URL}/chat`, { message: userMessage })

      setConversations(prev => ({
        ...prev,
        [activeChatId]: [...(prev[activeChatId] || []), {
          role: "assistant",
          content: response.data.answer,
          sources: response.data.sources,
          showFaqs: true,
        }]
      }))
    } catch (error) {
      setConversations(prev => ({
        ...prev,
        [activeChatId]: [...(prev[activeChatId] || []), {
          role: "assistant",
          content: "Sorry, I couldn't connect to the server. Please make sure the backend is running.",
          showFaqs: false,
        }]
      }))
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const bg = isDark ? "#0f1117" : "#ffffff"
  const headerBg = isDark ? "#13151f" : "#f8fafc"
  const border = isDark ? "#1e2130" : "#e2e8f0"
  const inputBg = isDark ? "#1e2130" : "#f1f5f9"
  const text = isDark ? "#ffffff" : "#1e293b"
  const subtext = isDark ? "#64748b" : "#94a3b8"

  return (
    <div style={{ display: "flex", height: "100vh", background: bg, fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* Sidebar */}
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={setActiveChatId}
        onNewChat={createNewChat}
        isDark={isDark}
        onToggleTheme={() => setIsDark(d => !d)}
      />

      {/* Main chat area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Header */}
        <div style={{
          padding: "14px 24px",
          background: headerBg,
          borderBottom: `1px solid ${border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <h1 style={{ fontSize: "15px", fontWeight: "600", color: text }}>
              MHT CET Admission Assistant
            </h1>
            <p style={{ fontSize: "11px", color: subtext }}>
              Powered by RAG · Llama 3.1 · ChromaDB
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#22c55e" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e" }} />
            Online
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", paddingTop: "20px", paddingBottom: "8px" }}>
          {activeMessages.map((msg, i) => (
            <MessageBubble
              key={i}
              message={msg}
              onFaqClick={sendMessage}
              isDark={isDark}
            />
          ))}
          {loading && <TypingIndicator isDark={isDark} />}
          <div ref={bottomRef} />
        </div>

        {/* Suggested questions — only on new chat */}
        {activeMessages.length === 1 && (
          <div style={{ padding: "0 20px 12px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <button key={i} onClick={() => sendMessage(q)} style={{
                background: "transparent",
                border: `1px solid ${border}`,
                borderRadius: "20px",
                padding: "8px 14px",
                fontSize: "12px",
                color: subtext,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
                onMouseEnter={e => {
                  e.target.style.borderColor = "#6366f1"
                  e.target.style.color = "#6366f1"
                }}
                onMouseLeave={e => {
                  e.target.style.borderColor = border
                  e.target.style.color = subtext
                }}
              >{q}</button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{
          padding: "16px 20px",
          background: headerBg,
          borderTop: `1px solid ${border}`,
          display: "flex", gap: "10px", alignItems: "flex-end",
        }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about colleges, cutoffs, CAP rounds..."
            rows={1}
            style={{
              flex: 1,
              background: inputBg,
              border: `1px solid ${border}`,
              borderRadius: "12px",
              padding: "12px 16px",
              fontSize: "14px",
              color: text,
              resize: "none",
              outline: "none",
              fontFamily: "inherit",
              lineHeight: "1.5",
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            style={{
              width: "44px", height: "44px",
              borderRadius: "12px",
              background: loading || !input.trim()
                ? inputBg
                : "linear-gradient(135deg, #6366f1, #8b5cf6)",
              border: "none",
              cursor: loading || !input.trim() ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "18px",
              color: "#fff",
              transition: "all 0.2s",
            }}
          >➤</button>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-8px); }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { overflow: hidden; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2d3148; border-radius: 2px; }
        textarea:focus { border-color: #6366f1 !important; }
      `}</style>
    </div>
  )
}