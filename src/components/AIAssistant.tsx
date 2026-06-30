import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

const SUGGESTIONS = [
  "What loan can I get with ₹50,000 income?",
  "Best SIP for 10 years?",
  "How to file ITR?",
  "Compare car insurance",
];

const AIAssistant = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "👋 Namaste! I'm your Mahajan Finance AI Assistant. Ask me anything about loans, investments, insurance, or accounting." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    const userMsg: Msg = { role: "user", content: trimmed };
    setMessages(p => [...p, userMsg]);
    setInput("");
    setBusy(true);

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });
      if (!resp.ok || !resp.body) {
        if (resp.status === 429) toast.error("Too many requests. Please wait a moment.");
        else if (resp.status === 402) toast.error("AI credits exhausted. Please contact support.");
        else toast.error("Assistant unavailable right now.");
        setBusy(false);
        return;
      }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let acc = "";
      setMessages(p => [...p, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const j = line.slice(6).trim();
          if (j === "[DONE]") { buf = ""; break; }
          try {
            const parsed = JSON.parse(j);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              acc += delta;
              setMessages(p => p.map((m, i) => i === p.length - 1 ? { ...m, content: acc } : m));
            }
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Connection error");
    }
    setBusy(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open AI Assistant"
        className="fixed bottom-24 right-6 md:bottom-6 md:right-24 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
      >
        <Bot size={26} />
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-success animate-pulse" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-4 right-4 left-4 md:left-auto md:right-6 md:bottom-6 md:w-[380px] z-50 bg-card rounded-2xl border-2 border-golden/40 shadow-2xl flex flex-col overflow-hidden"
            style={{ height: "min(560px, 80vh)" }}
          >
            <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot size={20} className="text-golden" />
                <div>
                  <p className="font-bold text-sm">Mahajan AI Assistant</p>
                  <p className="text-[11px] opacity-70">Powered by Lovable AI</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/10 rounded-full">
                <X size={18} />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-background">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"}`}>
                    {m.content || (busy && i === messages.length - 1 ? <Loader2 size={14} className="animate-spin" /> : "")}
                  </div>
                </div>
              ))}
              {messages.length === 1 && (
                <div className="pt-2 space-y-1.5">
                  <p className="text-[11px] text-muted-foreground font-semibold">Try asking:</p>
                  {SUGGESTIONS.map(s => (
                    <button key={s} onClick={() => send(s)} className="block w-full text-left text-xs px-3 py-2 rounded-lg bg-muted hover:bg-golden/10 border border-border transition-colors">
                      💡 {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); send(input); }}
              className="border-t border-border p-2 flex gap-2 bg-card"
            >
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask anything about finance..."
                disabled={busy}
                className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button type="submit" disabled={busy || !input.trim()} className="px-3 rounded-lg bg-accent text-accent-foreground disabled:opacity-50 hover:scale-105 transition-transform">
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIAssistant;
