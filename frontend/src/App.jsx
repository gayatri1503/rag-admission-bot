import { useState, useRef, useEffect } from "react"
import axios from "axios"

const API_URL = "http://127.0.0.1:5000"

const SUGGESTED_QUESTIONS = [
  "Which colleges can I get with 85 percentile general category?",
  "What is VJTI cutoff for OBC category 2025?",
  "Best CS colleges in Pune for 90 percentile?",
  "What documents do I need for CAP round?",
]

function MessageBubble({ message }) {
  const isUser = message.role === "user"

  return (
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: "16px",
      padding: "0 16px",
    }}>
      {!isUser && (
        <div style={{
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "14px",
          marginRight: "8px",
          flexShrink: 0,
        }}>🎓</div>
      )}

      <div style={{
        maxWidth: "70%",
        background: isUser
          ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
          : "#1e2130",
        borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        padding: "12px 16px",
        fontSize: "14px",
        lineHeight: "1.6",
        color: "#ffffff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
      }}>
        <p style={{ whiteSpace: "pre-wrap" }}>{message.content}</p>

        {message.sources && message.sources.length > 0 && (
          <div style={{ marginTop: "12px", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "10px" }}>
            <p style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "6px" }}>Sources</p>
            {message.sources.slice(0, 3).map((source, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.05)",
                borderRadius: "8px",
                padding: "6px 10px",
                marginBottom: "4px",
                fontSize: "11px",
                color: "#cbd5e1",
              }}>
                <span style={{ color: "#a78bfa" }}>{source.college}</span>
                {" · "}{source.branch}
                {" · "}{source.category}
                {" · "}{source.percentile?.toFixed(2)}%
                {" · "}{source.year}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div style={{ display: "flex", padding: "0 16px", marginBottom: "16px" }}>
      <div style={{
        width: "32px", height: "32px", borderRadius: "50%",
        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "14px", marginRight: "8px", flexShrink: 0,
      }}>🎓</div>
      <div style={{
        background: "#1e2130", borderRadius: "18px 18px 18px 4px",
        padding: "14px 18px", display: "flex", gap: "4px", alignItems: "center",
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: "6px", height: "6px", borderRadius: "50%",
            background: "#6366f1",
            animation: "bounce 1.2s infinite",
            animationDelay: `${i * 0.2}s`,
          }} />
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I'm your MHT CET Admission Assistant 🎓\n\nI can help you with:\n• College recommendations based on your percentile\n• Cutoff data for 368+ colleges across 2022-2025\n• Category-wise cutoffs (General, OBC, SC, ST, EWS, TFWS)\n• CAP round guidance\n\nWhat would you like to know?",
    }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  const sendMessage = async (text) => {
    const userMessage = text || input.trim()
    if (!userMessage || loading) return

    setInput("")
    setMessages(prev => [...prev, { role: "user", content: userMessage }])
    setLoading(true)

    try {
      const response = await axios.post(`${API_URL}/chat`, {
        message: userMessage
      })

      setMessages(prev => [...prev, {
        role: "assistant",
        content: response.data.answer,
        sources: response.data.sources,
      }])
    } catch (error) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I couldn't connect to the server. Please make sure the backend is running.",
      }])
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

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#0f1117" }}>

      {/* Header */}
      <div style={{
        padding: "16px 24px",
        background: "#13151f",
        borderBottom: "1px solid #1e2130",
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}>
        <div style={{
          width: "40px", height: "40px", borderRadius: "12px",
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "20px",
        }}>🎓</div>
        <div>
          <h1 style={{ fontSize: "16px", fontWeight: "600", color: "#ffffff" }}>
            MHT CET Admission Assistant
          </h1>
          <p style={{ fontSize: "12px", color: "#64748b" }}>
            Powered by RAG · 368 colleges · 2022–2025 data
          </p>
        </div>
        <div style={{
          marginLeft: "auto",
          display: "flex", alignItems: "center", gap: "6px",
          fontSize: "12px", color: "#22c55e",
        }}>
          <div style={{
            width: "6px", height: "6px", borderRadius: "50%",
            background: "#22c55e",
          }} />
          Online
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", paddingTop: "16px" }}>
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Suggested questions — show only at start */}
      {messages.length === 1 && (
        <div style={{ padding: "0 16px 12px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {SUGGESTED_QUESTIONS.map((q, i) => (
            <button key={i} onClick={() => sendMessage(q)} style={{
              background: "#1e2130",
              border: "1px solid #2d3148",
              borderRadius: "20px",
              padding: "8px 14px",
              fontSize: "12px",
              color: "#94a3b8",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
              onMouseEnter={e => e.target.style.borderColor = "#6366f1"}
              onMouseLeave={e => e.target.style.borderColor = "#2d3148"}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{
        padding: "16px",
        background: "#13151f",
        borderTop: "1px solid #1e2130",
        display: "flex",
        gap: "10px",
        alignItems: "flex-end",
      }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about colleges, cutoffs, CAP rounds..."
          rows={1}
          style={{
            flex: 1,
            background: "#1e2130",
            border: "1px solid #2d3148",
            borderRadius: "12px",
            padding: "12px 16px",
            fontSize: "14px",
            color: "#ffffff",
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
              ? "#1e2130"
              : "linear-gradient(135deg, #6366f1, #8b5cf6)",
            border: "none",
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "18px",
            transition: "all 0.2s",
          }}
        >
          ➤
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2d3148; border-radius: 2px; }
      `}</style>
    </div>
  )
}