import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, X, Bot, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatProps {
  userId: string;
}

const Chat: React.FC<ChatProps> = ({ userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am your Energy AI Assistant. How can I help you save on your bill today?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {

      const chatHistory = updatedMessages.filter(m => m.role === 'user' || m.role === 'assistant');

      const response = await fetch('http://localhost:3005/agents/energy-agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatHistory,
          userId: userId,
          resourceId: 'energy-agent',
          threadId: `thread-${userId}`,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to fetch AI response');
      }

      const data = await response.json();
  
      const replyText = data.text || data.content || 'I couldn\'t generate a response. Please try again.';

      setMessages(prev => [...prev, { role: 'assistant', content: replyText }]);
    } catch (error) {
      console.error('Chat Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Sorry, I'm having trouble connecting right now. Error: ${(error as Error).message}` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="w-16 h-16 bg-[#c084fc] border-4 border-slate-900 rounded-none flex items-center justify-center neo-shadow-hover"
          >
            <MessageSquare className="text-slate-900 w-8 h-8 stroke-[3px]" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="w-[400px] h-[600px] bg-white border-4 border-slate-900 flex flex-col neo-shadow"
          >
           
            <div className="p-4 bg-[#f472b6] border-b-4 border-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white border-2 border-slate-900 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                  <Bot className="text-slate-900 w-6 h-6 stroke-[3px]" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 uppercase tracking-wider">Energy Assistant</h3>
                  <p className="text-[10px] font-bold text-slate-900 flex items-center gap-1 uppercase">
                    <span className="w-2 h-2 bg-[#4ade80] border border-slate-900" />
                    Online
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 bg-white border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
              >
                <X className="text-slate-900 w-5 h-5 stroke-[3px]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#f4f0ec]">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 text-sm font-bold border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] ${
                    msg.role === 'user' 
                      ? 'bg-[#c084fc] text-slate-900 rounded-none' 
                      : 'bg-white text-slate-900 rounded-none'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border-2 border-slate-900 p-3 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                    <Loader2 className="w-5 h-5 text-slate-900 animate-spin stroke-[3px]" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

        
            <div className="p-4 bg-white border-t-4 border-slate-900">
              <div className="relative flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about your usage..."
                  className="flex-1 bg-white border-2 border-slate-900 p-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#f472b6] shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="p-3 bg-[#c084fc] border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] disabled:opacity-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center"
                >
                  <Send className="w-5 h-5 text-slate-900 stroke-[3px] ml-1" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chat;
