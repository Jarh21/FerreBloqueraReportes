"use client"

import React, { useEffect, useRef, useState } from "react"
import { useAuth } from "../../../context/AuthContext"
import axios from "axios"
import { buildApiUrl } from '../../../config/api';

type Message = {
  id: string
  role: "user" | "assistant"
  text: string
  createdAt: number
}

const ChatBotGpt: React.FC = () => {
  function generateId() {
    return Math.random().toString(36).slice(2, 9)
  } 
    const { usuario, empresaActual } = useAuth()
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const listRef = useRef<HTMLDivElement | null>(null)

    const storageKey = `chat_history:${empresaActual?.id || 'none'}:${usuario?.id || 'anon'}`

    useEffect(() => {
      try {
        const raw = localStorage.getItem(storageKey)
        if (raw) setMessages(JSON.parse(raw))
      } catch (err) {
        console.error("Error cargando historial de chat", err)
      }
    }, [storageKey])

    useEffect(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(messages))
      } catch (err) {
        console.error("Error guardando historial de chat", err)
      }
      // scroll al final
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight
      }
    }, [messages, storageKey])

    const sendMessage = async () => {
      const text = input.trim()
      if (!text) return

      const userMsg: Message = {
        id: generateId(),
        role: "user",
        text,
        createdAt: Date.now(),
      }

      // Añadimos el mensaje del usuario de forma optimista
      setMessages((m) => [...m, userMsg])
      setInput("")

      try {
        const response = await axios.post(
          buildApiUrl(`/chatbot/obtener-respuesta`),
          { empresaId: empresaActual?.id, pregunta: text },
          { withCredentials: true }
        )

        // Normalizamos la respuesta en un arreglo de mensajes assistant
        const data = response.data
        let assistantMsgs: Message[] = []

        if (Array.isArray(data)) {
          // Si el backend devuelve un array de mensajes
          assistantMsgs = data.map((item: any) => ({
            id: generateId(),
            role: item.role === 'user' ? 'user' : 'assistant',
            text: item.text || item.message || String(item),
            createdAt: item.createdAt ? new Date(item.createdAt).getTime() : Date.now(),
          }))
        } else if (typeof data === 'object' && data !== null) {
          // Si devuelve un objeto con campos conocidos
          if (data.text || data.message) {
            assistantMsgs = [{
              id: generateId(),
              role: 'assistant',
              text: String(data.text || data.message),
              createdAt: data.createdAt ? new Date(data.createdAt).getTime() : Date.now(),
            }]
          } else if (data.messageList && Array.isArray(data.messageList)) {
            assistantMsgs = data.messageList.map((item: any) => ({
              id: generateId(),
              role: 'assistant',
              text: item.text || String(item),
              createdAt: item.createdAt ? new Date(item.createdAt).getTime() : Date.now(),
            }))
          }
        } else if (typeof data === 'string') {
          assistantMsgs = [{ id: generateId(), role: 'assistant', text: data, createdAt: Date.now() }]
        }

        if (assistantMsgs.length > 0) {
          setMessages((m) => [...m, ...assistantMsgs])
        } else {
          // Si no pudimos normalizar, mostramos fallback
          setMessages((m) => [
            ...m,
            { id: generateId(), role: 'assistant', text: 'Respuesta recibida, pero con formato inesperado.', createdAt: Date.now() },
          ])
        }

        console.log("Respuesta del chatbot:", data)
      } catch (error) {
        console.error("Error fetching chatbot response:", error)
        setMessages((m) => [
          ...m,
          { id: generateId(), role: 'assistant', text: 'No se pudo obtener respuesta del servidor.', createdAt: Date.now() },
        ])
      }
    }

    const clearHistory = () => {
      setMessages([])
      try {
        localStorage.removeItem(storageKey)
      } catch (err) {
        console.error("Error limpiando historial", err)
      }
    }
    
    return (
      <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-800">ChatBotGpt</h2>
                <p className="text-sm text-slate-500 mt-1">Asistente de ayuda — historial guardado localmente</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                disabled
                  onClick={clearHistory}
                  className="px-3 py-2 text-sm bg-rose-50 text-rose-600 border border-rose-100 rounded-xl hover:bg-rose-100 transition"
                >
                  Limpiar historial
                </button>
              </div>
            </div>

            <div className="flex flex-col h-[60vh] md:h-[70vh] border border-slate-100 rounded-lg overflow-hidden">
              <div ref={listRef} className="flex-1 p-4 overflow-y-auto bg-slate-50">
                {messages.length === 0 && (
                  <div className="text-center text-sm text-slate-400 mt-8">No hay mensajes. Escribe abajo para comenzar.</div>
                )}

                <div className="flex flex-col gap-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[80%] px-4 py-2 rounded-xl shadow-sm ${
                          msg.role === 'user'
                            ? 'bg-primary-600 text-white rounded-br-none'
                            : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none'
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{msg.text}</div>
                        <div className="text-[11px] text-slate-400 mt-1 text-right">{new Date(msg.createdAt).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-white border-t border-slate-100">
                <div className="flex gap-3">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                    placeholder="Escribe tu pregunta aquí... (Enter para enviar, Shift+Enter para nueva línea)"
                    className="flex-1 resize-none min-h-[44px] max-h-36 py-2 px-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />

                  <div className="flex flex-col items-stretch gap-2">
                    <button
                      onClick={sendMessage}
                      className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition"
                    >
                      Enviar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
export default ChatBotGpt
