import { useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { QUICK_QUESTIONS, TOPICS } from '../data/courses'

type Message = {
  id: string
  role: 'user' | 'assistant'
  text: string
}

const initialMessages: Message[] = [
  {
    id: 'assistant-1',
    role: 'assistant',
    text: "Hi! I'm your AI tutor. Ask me anything about blockchain, DeFi, smart contracts, or AI."
  }
]

const cannedResponse =
  'Great question! Use the dedicated AI Tutor page for full AI-powered answers with streaming.'

export function AITutorPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<'chat' | 'quiz'>('chat')
  const idCounterRef = useRef(2)

  const hasMessages = useMemo(
    () => messages.some((message) => message.role === 'user'),
    [messages]
  )

  const sendMessage = (text: string) => {
    if (!text.trim()) {
      return
    }

    const userMessageId = `user-${idCounterRef.current}`
    idCounterRef.current += 1
    const assistantMessageId = `assistant-${idCounterRef.current}`
    idCounterRef.current += 1

    const nextMessages: Message[] = [
      ...messages,
      { id: userMessageId, role: 'user', text },
      { id: assistantMessageId, role: 'assistant', text: cannedResponse },
    ]

    setMessages(nextMessages)
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    sendMessage(input)
    setInput('')
  }

  return (
    <main className="container ai-tutor">
      <section className="ai-tutor__header">
        <div className="ai-badge" aria-hidden="true">
          AI
        </div>
        <div>
          <h1>AI Tutor</h1>
          <p>Powered by AI • 24/7 learning assistant</p>
        </div>
        <button
          className="button button--ghost"
          type="button"
          onClick={() => setMessages(initialMessages)}
        >
          Clear chat
        </button>
      </section>

      <section className="ai-tutor__modes" aria-label="Tutor mode">
        <button
          className={`chip ${mode === 'chat' ? 'chip--active' : ''}`}
          type="button"
          onClick={() => setMode('chat')}
        >
          Chat
        </button>
        <button
          className={`chip ${mode === 'quiz' ? 'chip--active' : ''}`}
          type="button"
          onClick={() => setMode('quiz')}
        >
          Quiz Generator
        </button>
      </section>

      {mode === 'chat' ? (
        <section className="ai-tutor__chat" aria-live="polite">
          <div className="chat-log">
            {messages.map((message) => (
              <article
                key={message.id}
                className={`chat-message chat-message--${message.role}`}
              >
                <p>{message.text}</p>
              </article>
            ))}
          </div>

          {!hasMessages && (
            <div className="quick-prompts">
              <p>Ask me anything!</p>
              <div className="quick-prompts__grid">
                {QUICK_QUESTIONS.map((prompt) => (
                  <button
                    key={prompt}
                    className="prompt"
                    type="button"
                    onClick={() => sendMessage(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form className="chat-input" onSubmit={handleSubmit}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about this lesson..."
              aria-label="Message AI tutor"
            />
            <button className="button button--primary" type="submit">
              Send
            </button>
          </form>
        </section>
      ) : (
        <section className="ai-tutor__quiz">
          <h2>Generate a Quiz</h2>
          <p>Pick a topic or type your own to generate 5 questions.</p>
          <div className="topic-tags">
            {TOPICS.map((topic) => (
              <button key={topic} className="topic-tag" type="button">
                {topic}
              </button>
            ))}
          </div>
          <p className="quiz-help">
            Quiz generation is currently in demo mode. For now, explore{' '}
            <Link to="/courses/blockchain-fundamentals">Blockchain Fundamentals</Link>.
          </p>
        </section>
      )}
    </main>
  )
}
