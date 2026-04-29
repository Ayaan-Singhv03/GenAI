"use client";

import { type FormEvent, useMemo, useState } from "react";
import { PERSONAS, type PersonaId } from "@/lib/personas";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const createId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;

export default function Home() {
  const [activePersonaId, setActivePersonaId] = useState<PersonaId>(
    PERSONAS[0].id
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activePersona = useMemo(
    () => PERSONAS.find((persona) => persona.id === activePersonaId)!,
    [activePersonaId]
  );

  const resetConversation = (personaId: PersonaId) => {
    setActivePersonaId(personaId);
    setMessages([]);
    setInput("");
    setError(null);
  };

  const sendMessage = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || isLoading) {
      return;
    }

    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      content: trimmed,
    };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personaId: activePersonaId,
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "Something went wrong.");
      }

      const payload = await response.json();
      const assistantMessage: ChatMessage = {
        id: createId(),
        role: "assistant",
        content: payload.message || "I could not generate a response.",
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(input);
  };

  return (
    <div className="flex min-h-screen w-full bg-white text-gray-900">
      {/* Sidebar */}
      <aside className="w-72 border-r border-gray-100 bg-gradient-to-b from-gray-50 to-white flex flex-col py-8 px-6 overflow-y-auto">
        <div className="mb-10">
          <h1 className="text-xl font-semibold tracking-tight mb-2">ChatBoat</h1>
          <p className="text-sm text-gray-500">Persona-driven conversations</p>
        </div>
        
        <div className="flex flex-col gap-3 mb-10">
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Personas</span>
          {PERSONAS.map((persona) => {
            const isActive = persona.id === activePersonaId;
            return (
              <button
                key={persona.id}
                type="button"
                onClick={() => resetConversation(persona.id)}
                className={`group flex flex-col items-start rounded-xl px-4 py-3 text-left transition-all ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                <span className={`text-xs font-semibold uppercase tracking-wider mb-1 ${isActive ? "text-gray-300" : "text-gray-400"}`}>
                  {persona.title}
                </span>
                <span className={`text-sm font-medium ${isActive ? "text-white" : "text-gray-800"}`}>{persona.name}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-200 pt-6">
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Suggestions</span>
          <div className="flex flex-col gap-2">
            {activePersona.suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => void sendMessage(suggestion)}
                className="rounded-lg bg-white border border-gray-200 px-3 py-2.5 text-left text-xs text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all group"
              >
                <span className="block truncate group-hover:text-gray-900">{suggestion}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col bg-white">
        <header className="border-b border-gray-100 bg-white px-10 py-6 shadow-xs">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{activePersona.name}</h2>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">{activePersona.description}</p>
          </div>
        </header>

        <div className="flex-1 flex flex-col overflow-y-auto px-10 py-8 bg-gradient-to-br from-white via-gray-50 to-white">
          <div className="mx-auto w-full max-w-3xl flex flex-col gap-6">
            {messages.length === 0 ? (
              <div className="mt-16 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Start a Conversation</h3>
                <p className="text-gray-500 text-sm max-w-xs mx-auto">
                  Ask {activePersona.name} anything. Pick a suggestion below to get started.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
                >
                  <div
                    className={`max-w-xl rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${
                      message.role === "user"
                        ? "bg-slate-900 text-white rounded-br-md shadow-sm"
                        : "bg-gray-100 text-gray-800 rounded-bl-md border border-gray-200"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "300ms" }} />
                </div>
                <span>{activePersona.name} is thinking...</span>
              </div>
            )}
          </div>
        </div>

        <div className="px-10 py-6 border-t border-gray-100 bg-white">
          <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600 font-medium">
                {error}
              </div>
            )}
            <div className="relative flex items-center gap-3">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={`Message ${activePersona.name}...`}
                className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-5 pr-14 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gray-200 transition"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="absolute right-2 rounded-lg bg-slate-900 hover:bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
