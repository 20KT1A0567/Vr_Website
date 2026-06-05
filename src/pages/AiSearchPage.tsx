import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Sparkles, Send, Bot, User, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ProductCard } from "components/catalog/ProductCard";
import { ProductCardSkeleton } from "components/catalog/ProductCardSkeleton";
import type { Product } from "types";
import { vrTechnologiesLogo } from "../constants/siteConfig";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  isStreaming?: boolean;
  products?: Product[];
}

export function AiSearchPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "Welcome to VR AI Search! I can help you find exactly what you need. Just tell me your budget, use case, or preferred specs.",
    },
  ]);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const streamResponse = (fullText: string, productsToDisplay: Product[] = []) => {
    const streamId = Math.random().toString(36).substring(7);
    setMessages((prev) => [
      ...prev,
      { id: streamId, sender: "ai", text: "", isStreaming: true },
    ]);

    let i = 0;
    const interval = setInterval(() => {
      setMessages((prev) => {
        const newArr = [...prev];
        const lastMsg = newArr[newArr.length - 1];
        if (lastMsg && lastMsg.id === streamId) {
          lastMsg.text = fullText.slice(0, i + 1);
        }
        return newArr;
      });
      i++;
      if (i === fullText.length) {
        clearInterval(interval);
        setMessages((prev) => {
          const newArr = [...prev];
          const lastMsg = newArr[newArr.length - 1];
          if (lastMsg && lastMsg.id === streamId) {
            lastMsg.isStreaming = false;
            lastMsg.products = productsToDisplay;
          }
          return newArr;
        });
        setIsTyping(false);
      }
    }, 15);
  };

  const handleSendMessage = async () => {
    if (!inputVal.trim() || isTyping) return;

    const textToSend = inputVal.trim();
    setMessages((prev) => [
      ...prev,
      { id: Math.random().toString(36).substring(7), sender: "user", text: textToSend },
    ]);
    setInputVal("");
    setIsTyping(true);

    try {
      let apiBase = "/api";
      if (typeof window !== "undefined") {
        if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
          apiBase = "http://localhost:8080/api";
        } else if (window.location.hostname === "myadmin.anushatechnologies.com") {
          apiBase = "https://vr.anushatechnologies.com/api";
        } else {
          const envUrl = import.meta.env.VITE_API_BASE_URL;
          apiBase = envUrl ? envUrl.replace(/\/+$/, "") : "/api";
        }
      }

      const conversationHistory = messages.map(m => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text
      })).filter(m => m.content);
      
      conversationHistory.push({ role: "user", content: textToSend });

      const response = await axios.post(`${apiBase}/public/support/chat`, {
        message: textToSend,
        history: conversationHistory
      });

      const { replyText, products: matchedProducts } = response.data;
      streamResponse(replyText, matchedProducts);
    } catch (err) {
      console.warn("Realtime support chat endpoint failed.", err);
      streamResponse("I am currently experiencing technical difficulties connecting to my AI brain. Please try again later!", []);
    }
  };

  const PRESET_PROMPTS = [
    { label: "Gaming Laptop", text: "Recommend a high performance gaming laptop under 60k" },
    { label: "MacBook", text: "Show me Apple MacBooks" },
    { label: "Coding", text: "Help me find a laptop with 16GB RAM for coding" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#F9FAFB]">
      <div className="flex-1 overflow-y-auto pt-8 pb-32">
        <div ref={containerRef} className="max-w-4xl mx-auto w-full px-4 sm:px-6 flex flex-col gap-8">
          
          {messages.length === 1 && (
            <div className="flex flex-col items-center justify-center pt-16 pb-8">
              <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 mb-6">
                <Sparkles className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3 text-center tracking-tight">
                How can I help you today?
              </h1>
              <p className="text-gray-500 text-center max-w-lg mb-10">
                I am your personal AI shopping assistant. Describe what you're looking for, and I'll search our entire live inventory to find the perfect match.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-3xl">
                {PRESET_PROMPTS.map((prompt) => (
                  <button
                    key={prompt.label}
                    onClick={() => setInputVal(prompt.text)}
                    className="flex flex-col items-start p-4 bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition text-left group"
                  >
                    <span className="font-semibold text-gray-800 text-sm mb-1">{prompt.label}</span>
                    <span className="text-gray-400 text-xs line-clamp-2">{prompt.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 sm:gap-6 ${msg.sender === "user" ? "flex-row-reverse" : ""}`}
            >
              <div className={`shrink-0 h-10 w-10 rounded-full flex items-center justify-center shadow-sm ${msg.sender === "user" ? "bg-gray-100" : "bg-white border border-gray-100"}`}>
                {msg.sender === "user" ? (
                  <User className="w-5 h-5 text-gray-500" />
                ) : (
                  <img src={vrTechnologiesLogo} alt="AI" className="w-6 h-6 object-contain" />
                )}
              </div>
              <div className={`flex flex-col gap-4 max-w-[85%] sm:max-w-[75%] ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                <div className={`px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed shadow-sm ${msg.sender === "user" ? "bg-[#0A0A0A] text-white rounded-tr-none font-medium" : "bg-white border border-gray-100 text-gray-800 rounded-tl-none prose prose-sm max-w-none"}`}>
                  {msg.sender === "user" ? msg.text : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.text + (msg.isStreaming ? " ▍" : "")}
                    </ReactMarkdown>
                  )}
                </div>
                
                {msg.products && msg.products.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full mt-2">
                    {msg.products.map(product => (
                      <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
                        <ProductCard product={product} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          
          {isTyping && messages[messages.length - 1]?.sender === "user" && (
            <div className="flex gap-4 sm:gap-6">
              <div className="shrink-0 h-10 w-10 bg-white border border-gray-100 rounded-full flex items-center justify-center shadow-sm">
                <img src={vrTechnologiesLogo} alt="AI" className="w-6 h-6 object-contain opacity-50" />
              </div>
              <div className="flex flex-col gap-4 max-w-[85%] sm:max-w-[75%] items-start">
                <div className="flex gap-1 items-center px-4 py-3 bg-white border border-gray-100 rounded-2xl rounded-tl-none shadow-sm h-[48px]">
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full mt-2 opacity-60">
                  <ProductCardSkeleton />
                  <ProductCardSkeleton />
                  <div className="hidden lg:block"><ProductCardSkeleton /></div>
                </div>
              </div>
            </div>
          )}
          
          {!isTyping && messages.length > 1 && messages[messages.length - 1].sender === "ai" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-2 mt-2 sm:ml-[64px]"
            >
              {["What's the battery life?", "Are there cheaper alternatives?", "Compare these models"].map((chip) => (
                <button
                  key={chip}
                  onClick={() => {
                    setInputVal(chip);
                  }}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors shadow-sm"
                >
                  {chip}
                </button>
              ))}
            </motion.div>
          )}
          
          <div ref={endOfMessagesRef} />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent pb-8">
        <div className="max-w-3xl mx-auto relative">
          <input
            type="text"
            className="w-full bg-white border border-gray-200 rounded-[1.5rem] py-4 pl-6 pr-16 text-[15px] shadow-[0_8px_30px_rgb(0,0,0,0.08)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 placeholder:text-gray-400"
            placeholder="Ask about any laptop, budget, or specifications..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSendMessage();
            }}
            disabled={isTyping}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputVal.trim() || isTyping}
            className="absolute right-2 top-2 bottom-2 aspect-square rounded-full bg-[#0A0A0A] text-white flex items-center justify-center disabled:opacity-30 disabled:bg-gray-200 disabled:text-gray-500 transition-all hover:bg-black"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
        <div className="text-center mt-3 text-[11px] text-gray-400 font-medium">
          VR AI can make mistakes. Consider verifying important specifications.
        </div>
      </div>
    </div>
  );
}
