import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
  type ChangeEvent,
} from 'react'
import {
  Send,
  Square,
  Settings,
  ChevronDown,
  X,
  Bot,
  Loader2,
  Zap,
  Info,
  Sun,
  Moon,
  ExternalLink,
} from 'lucide-react'
import type { Message, Model } from './types'
import { MODELS, SUGGESTIONS, DEFAULT_API_URL } from './constants'
import { streamChat } from './services/api'
import './index.css'

// ─── Helpers ────────────────────────────────────────────────────────────────

function genId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function genUserId(): string {
  return `user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

// ─── ThinkingIndicator ───────────────────────────────────────────────────────

interface ThinkingIndicatorProps {
  activity?: string
}

function ThinkingIndicator({ activity }: ThinkingIndicatorProps) {
  return (
    <div className="thinking-indicator">
      <div className="thinking-row">
        <svg
          className="thinking-spinner"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
        >
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
        <span className="thinking-label">
          {activity ? '' : 'Thinking…'}
        </span>
      </div>
      {activity && (
        <div className="thinking-activity">
          <span className="thinking-dot" />
          {activity}
        </div>
      )}
    </div>
  )
}

// ─── WelcomeScreen ───────────────────────────────────────────────────────────

interface WelcomeScreenProps {
  onSend: (q: string) => void
}

function WelcomeScreen({ onSend }: WelcomeScreenProps) {
  return (
    <div className="welcome-screen">
      <div className="welcome-avatar">🤖</div>
      <h1 className="welcome-title">Streaming Chat</h1>
      <p className="welcome-subtitle">
        Connected to your AI agent backend. Real-time streaming,
        tool calls, and memory all work out of the box.
      </p>
      <div className="suggestions-grid">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            className="suggestion-chip"
            onClick={() => onSend(s)}
            type="button"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── SettingsPanel ───────────────────────────────────────────────────────────

interface SettingsPanelProps {
  apiUrl:        string
  onApiUrlChange: (url: string) => void
  onClose:       () => void
}

function SettingsPanel({ apiUrl, onApiUrlChange, onClose }: SettingsPanelProps) {
  const [draft, setDraft] = useState(apiUrl)
  const [saved, setSaved] = useState(false)

  function handleSave() {
    const trimmed = draft.trim().replace(/\/$/, '')
    onApiUrlChange(trimmed || DEFAULT_API_URL)
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  return (
    <>
      <div className="settings-overlay" onClick={onClose} />
      <div className="settings-panel" role="dialog" aria-label="Settings">
        <div className="settings-header">
          <span className="settings-title">Settings</span>
          <button className="icon-btn" onClick={onClose} type="button" aria-label="Close settings">
            <X size={18} />
          </button>
        </div>

        <div className="settings-body">
          {/* Backend URL */}
          <div className="settings-group">
            <label className="settings-label" htmlFor="api-url-input">
              Backend URL
            </label>
            <input
              id="api-url-input"
              className="settings-input"
              type="url"
              value={draft}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)}
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter') handleSave()
              }}
              placeholder="http://localhost:8000"
              autoComplete="off"
              spellCheck={false}
            />
            <p className="settings-hint">
              The base URL of your SSE streaming backend.
              Default: <code style={{ fontFamily: 'inherit', color: 'var(--accent)' }}>http://localhost:8000</code>
            </p>
            <button
              className="settings-save-btn"
              onClick={handleSave}
              type="button"
            >
              {saved ? '✓ Saved' : 'Save'}
            </button>
          </div>

          <div className="settings-divider" />

          {/* SSE Event format reference */}
          <div className="settings-group">
            <div className="settings-info-box">
              <div className="settings-info-title">
                <Info size={13} />
                Expected SSE event types
              </div>
              <ul className="settings-info-list">
                <li>type: "info" — agent status</li>
                <li>type: "tool", stage: "start"|"end" — tool calls</li>
                <li>type: "llm", stage: "stream" — token chunks</li>
                <li>type: "done" — stream finished</li>
                <li>type: "error" — error message</li>
              </ul>
            </div>
          </div>

          <div className="settings-divider" />

          {/* About */}
          <div className="settings-group">
            <div className="settings-info-box">
              <div className="settings-info-title">
                <Zap size={13} />
                Compatible backends
              </div>
              <ul className="settings-info-list">
                <li>react-streaming-chat backend</li>
                <li>Any FastAPI + SSE streaming server</li>
                <li>Any Express + SSE backend</li>
              </ul>
            </div>
          </div>

          <div className="settings-version">
            React Streaming Chat · MIT License
          </div>
        </div>
      </div>
    </>
  )
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [messages,      setMessages]      = useState<Message[]>([])
  const [input,         setInput]         = useState('')
  const [isLoading,     setIsLoading]     = useState(false)
  const [selectedModel, setSelectedModel] = useState<Model>(MODELS[0])
  const [showModelMenu, setShowModelMenu] = useState(false)
  const [showSettings,  setShowSettings]  = useState(false)
  const [apiUrl,        setApiUrl]        = useState(DEFAULT_API_URL)
  const [isDark,        setIsDark]        = useState(true)

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  // Stable user ID for the session
  const [userId] = useState<string>(genUserId)

  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef      = useRef<HTMLTextAreaElement>(null)
  const abortRef      = useRef<AbortController | null>(null)
  const modelMenuRef  = useRef<HTMLDivElement>(null)

  // ── Auto-resize textarea ────────────────────────────────────────────────
  useEffect(() => {
    const ta = inputRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`
  }, [input])

  // ── Close model menu on outside click ──────────────────────────────────
  useEffect(() => {
    if (!showModelMenu) return
    function handler(e: MouseEvent) {
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target as Node)) {
        setShowModelMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showModelMenu])

  // ── Scroll to bottom helper ─────────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      const el = scrollAreaRef.current
      if (el) el.scrollTop = el.scrollHeight
    })
  }, [])

  // ── Update a single message field immutably ─────────────────────────────
  const updateMessage = useCallback(
    (id: string, patch: Partial<Message>) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...patch } : m)),
      )
    },
    [],
  )

  // ── handleSend ──────────────────────────────────────────────────────────
  const handleSend = useCallback(
    async (text?: string) => {
      const query = (text ?? input).trim()
      if (!query || isLoading) return

      setInput('')
      setIsLoading(true)

      const userMsg: Message = {
        id:        genId(),
        role:      'user',
        content:   query,
        isLoading: false,
      }
      const assistantId = genId()
      const assistantMsg: Message = {
        id:        assistantId,
        role:      'assistant',
        content:   '',
        isLoading: true,
        activity:  undefined,
      }

      setMessages((prev) => [...prev, userMsg, assistantMsg])

      // Scroll after paint
      requestAnimationFrame(() => {
        const el = document.getElementById(assistantId)
        el?.scrollIntoView({ block: 'start', behavior: 'smooth' })
      })

      // Set up abort controller
      const controller = new AbortController()
      abortRef.current = controller

      await streamChat(
        apiUrl,
        query,
        userId,
        selectedModel.id,
        {
          onInfo: (message) => {
            updateMessage(assistantId, { activity: message })
            scrollToBottom()
          },
          onTool: (tool, message, stage) => {
            const label =
              stage === 'start'
                ? `Running tool: ${tool || message}`
                : `Tool done: ${tool || message}`
            updateMessage(assistantId, { activity: label })
            scrollToBottom()
          },
          onToken: (token) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: m.content + token, activity: undefined }
                  : m,
              ),
            )
            scrollToBottom()
          },
          onDone: () => {
            updateMessage(assistantId, { isLoading: false, activity: undefined })
            setIsLoading(false)
            abortRef.current = null
            requestAnimationFrame(() => inputRef.current?.focus())
          },
          onError: (msg) => {
            updateMessage(assistantId, {
              content:   `⚠ ${msg}`,
              isLoading: false,
              activity:  undefined,
            })
            setIsLoading(false)
            abortRef.current = null
          },
        },
        controller.signal,
      )
    },
    [input, isLoading, apiUrl, userId, selectedModel, updateMessage, scrollToBottom],
  )

  // ── handleStop ──────────────────────────────────────────────────────────
  const handleStop = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setIsLoading(false)
    // Mark the last loading message as done
    setMessages((prev) =>
      prev.map((m) =>
        m.isLoading ? { ...m, isLoading: false, activity: undefined } : m,
      ),
    )
  }, [])

  // ── Keyboard handler ────────────────────────────────────────────────────
  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const canSend = input.trim().length > 0 && !isLoading

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="app-shell">
      {/* ── Navigation ── */}
      <nav className="nav">
        <div className="nav-logo">
          <div className="nav-logo-icon">🤖</div>
          <span className="nav-logo-text">Streaming Chat</span>
          <span className="nav-logo-badge">SSE</span>
        </div>
        <div className="nav-actions">
          <a
            className="icon-btn"
            href="https://github.com/bhaskararaorebba/react-streaming-chat"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            title="View on GitHub"
          >
            <ExternalLink size={18} />
          </a>
          <button
            className="icon-btn"
            onClick={() => setIsDark(d => !d)}
            type="button"
            aria-label="Toggle theme"
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            className="icon-btn"
            onClick={() => setShowSettings(true)}
            type="button"
            aria-label="Open settings"
            title="Settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </nav>

      {/* ── Messages Area ── */}
      <div className="messages-area" ref={scrollAreaRef}>
        <div className="messages-inner">
          {messages.length === 0 ? (
            <WelcomeScreen onSend={handleSend} />
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                id={msg.id}
                className={`message-row ${msg.role}`}
              >
                {/* AI avatar */}
                {msg.role === 'assistant' && (
                  <div className="msg-avatar ai" aria-hidden="true">
                    <Bot size={17} color="#fff" />
                  </div>
                )}

                <div className="msg-content-wrapper">
                  {/* Thinking indicator */}
                  {msg.role === 'assistant' && msg.isLoading && (
                    <ThinkingIndicator activity={msg.activity} />
                  )}

                  {/* Message text */}
                  {msg.content && (
                    <div
                      className={`msg-bubble${
                        msg.role === 'assistant' && msg.isLoading
                          ? ' streaming-cursor'
                          : ''
                      }`}
                    >
                      {msg.content}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Input Area ── */}
      <div className="input-area">
        <div className="input-area-inner">
          <div className="input-box">
            <textarea
              ref={inputRef}
              className="input-textarea"
              placeholder="Write a message..."
              value={input}
              rows={1}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                setInput(e.target.value)
              }
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              aria-label="Chat input"
            />

            <div className="input-toolbar">
              {/* Left: model selector */}
              <div className="input-toolbar-left">
                <div className="model-selector-wrap" ref={modelMenuRef}>
                  <button
                    className={`model-btn${showModelMenu ? ' open' : ''}`}
                    onClick={() => setShowModelMenu((v) => !v)}
                    type="button"
                    aria-label="Select model"
                    aria-expanded={showModelMenu}
                  >
                    <span className="model-dot" />
                    {selectedModel.label}
                    <ChevronDown size={13} />
                  </button>

                  {/* Dropdown */}
                  {showModelMenu && (
                    <div className="model-dropdown" role="listbox" aria-label="Model options">
                      <div className="model-dropdown-header">Model</div>
                      {MODELS.map((m) => (
                        <button
                          key={m.id}
                          className={`model-option${
                            m.id === selectedModel.id ? ' active' : ''
                          }`}
                          onClick={() => {
                            setSelectedModel(m)
                            setShowModelMenu(false)
                          }}
                          type="button"
                          role="option"
                          aria-selected={m.id === selectedModel.id}
                        >
                          {m.label}
                          {m.id === selectedModel.id && (
                            <span className="model-check" aria-hidden="true">
                              <span className="model-check-inner" />
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: send / stop */}
              <div className="input-toolbar-right">
                {isLoading ? (
                  <button
                    className="send-btn stop"
                    onClick={handleStop}
                    type="button"
                    aria-label="Stop generation"
                    title="Stop"
                  >
                    <Square size={14} fill="currentColor" />
                  </button>
                ) : (
                  <button
                    className={`send-btn ${canSend ? 'active' : 'inactive'}`}
                    onClick={() => handleSend()}
                    disabled={!canSend}
                    type="button"
                    aria-label="Send message"
                    title="Send"
                  >
                    {isLoading ? (
                      <Loader2 size={16} className="thinking-spinner" />
                    ) : (
                      <Send size={15} />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Settings Panel ── */}
      {showSettings && (
        <SettingsPanel
          apiUrl={apiUrl}
          onApiUrlChange={(url) => setApiUrl(url)}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}
