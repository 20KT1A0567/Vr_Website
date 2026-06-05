import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { catalogApi, customerApi } from "api/client";
import { useAuthStore } from "store/authStore";
import { useCartStore } from "store/cartStore";
import { useCompareStore } from "store/compareStore";
import { showCartToast } from "utils/cartNotifications";
import { formatCurrency, getProductPrimaryImage } from "utils/catalog";
import type { Product } from "types";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  isStreaming?: boolean;
  products?: Product[];
}

const PRESET_PROMPTS = [
  { label: "🎮 Gaming Rig", text: "Recommend a high performance gaming laptop" },
  { label: "🍎 Premium MacBook", text: "Show me Apple MacBooks" },
  { label: "💼 Professional/Coding", text: "Help me find a laptop with 16GB RAM for coding" },
  { label: "🪙 Best Budget Deal", text: "Show me budget laptops under ₹35,000" },
];

export function AiConcierge() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "Hello! I'm your VR AI Concierge. Tell me what you're looking for — gaming, programming, budget under 35k — and I'll find the perfect match!",
    },
  ]);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [addingToCartId, setAddingToCartId] = useState<number | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const addGuestCartItem = useCartStore((state) => state.addGuestCartItem);
  const { compareList } = useCompareStore();

  // When CompareBar is open, shift buttons up above it.
  // Mobile bar is 2-row (~88px), tablet/desktop is 1-row (~64px).
  // Using 5.5rem (88px) as a universal safe offset.
  const compareOpen = compareList.length > 0;
  const baseBottom = "1.5rem";                          // no compare bar
  const liftedBottom = "7rem";                          // with compare bar (5.5rem offset + 1.5rem base)
  const triggerBottom = compareOpen ? liftedBottom : baseBottom;
  // Chat panel opens directly above the trigger button (trigger h=52px + 12px gap)
  const panelBottom = compareOpen ? "11rem" : "5.5rem";

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["ai-concierge-catalog"],
    queryFn: () => catalogApi.getProducts(),
  });

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const handleAddToCart = async (product: Product) => {
    if (addingToCartId !== null) return;
    setAddingToCartId(product.id);

    if (!user) {
      addGuestCartItem(product, 1);
      toast.success(`${product.title} added to guest cart!`);
      showCartToast({ variant: "saved", productTitle: product.title, items: useCartStore.getState().guestCart });
      setAddingToCartId(null);
      return;
    }

    try {
      const nextCart = await customerApi.addToCart(product.id, 1);
      queryClient.setQueryData(["cart"], nextCart);
      toast.success(`${product.title} added to your cart!`);
      showCartToast({ variant: "added", productTitle: product.title, items: nextCart });
    } catch {
      toast.error("Could not add product to cart");
    } finally {
      setAddingToCartId(null);
    }
  };

  const streamResponse = (replyText: string, matchedProducts: Product[]) => {
    setIsTyping(false);
    const messageId = `ai-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      { id: messageId, sender: "ai", text: "", isStreaming: true },
    ]);

    let currentIndex = 0;
    const words = replyText.split(" ");

    const interval = setInterval(() => {
      if (currentIndex >= words.length - 1) {
        clearInterval(interval);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, text: replyText, isStreaming: false, products: matchedProducts }
              : msg
          )
        );
      } else {
        currentIndex++;
        const currentText = words.slice(0, currentIndex + 1).join(" ");
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, text: currentText } : msg
          )
        );
      }
    }, 40);
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, sender: "user", text: textToSend },
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

  return (
    <>
      {/* Floating trigger button */}
      <div
        className="fixed right-4 z-[65] transition-[bottom] duration-300 sm:right-5"
        style={{ bottom: triggerBottom }}
      >
        <motion.button
          onClick={() => setIsOpen((prev) => !prev)}
          className="relative flex h-13 w-13 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white shadow-[0_8px_24px_rgba(79,70,229,0.4)] outline-none"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
          aria-label="Toggle AI Concierge"
          style={{ height: 52, width: 52 }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {isOpen ? (
              <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }}>
                <X className="h-5 w-5" />
              </motion.span>
            ) : (
              <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.18 }}>
                <Sparkles className="h-5 w-5" />
              </motion.span>
            )}
          </AnimatePresence>
          {!isOpen && (
            <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-pink-500" />
            </span>
          )}
        </motion.button>
      </div>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            className="fixed left-4 right-4 z-[66] transition-[bottom] duration-300 sm:left-auto sm:right-6 sm:w-[380px]"
            style={{
              bottom: panelBottom,
            }}
          >
            <div
              className="flex flex-col overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.2)]"
              style={{ height: compareOpen ? "min(520px, calc(100vh - 200px))" : "min(520px, calc(100vh - 100px))" }}
            >
              {/* ── Header ── */}
              <div className="flex shrink-0 items-center justify-between bg-gradient-to-r from-slate-900 to-indigo-900 px-4 py-3 text-white">
                <div className="flex items-center gap-2.5">
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 shadow-inner">
                    <Bot className="h-4 w-4 text-white" />
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-900 bg-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-widest leading-none">VR AI Concierge</p>
                    <p className="mt-0.5 text-[10px] text-indigo-300">Online · Ready to recommend</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Link
                    to="/ai-search"
                    onClick={() => setIsOpen(false)}
                    className="rounded-lg px-2 py-1 text-[10px] font-bold bg-white/10 hover:bg-white/20 transition text-white"
                  >
                    Full Screen
                  </Link>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="rounded-full p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* ── Chat Body ── */}
              <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3.5" style={{ minHeight: 0 }}>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2 ${msg.sender === "user" ? "flex-row-reverse" : ""}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                        msg.sender === "user" ? "bg-slate-200 text-slate-600" : "bg-indigo-100 text-indigo-600"
                      }`}
                    >
                      {msg.sender === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                    </div>

                    {/* Bubble + products */}
                    <div className="max-w-[80%] space-y-2">
                      <div
                        className={`rounded-2xl px-3.5 py-2.5 text-[12px] leading-5 shadow-sm ${
                          msg.sender === "user"
                            ? "rounded-tr-sm bg-slate-900 text-white"
                            : "rounded-tl-sm border border-slate-100 bg-slate-50 text-slate-800"
                        }`}
                      >
                        {msg.text || (msg.isStreaming ? "" : "…")}
                        {msg.isStreaming && (
                          <span className="ml-1 inline-block h-3 w-1 animate-pulse bg-indigo-500 align-middle rounded-sm" />
                        )}
                      </div>

                      {msg.products && msg.products.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-indigo-500">
                            <TrendingUp className="h-3 w-3" />
                            Concierge Matches ({msg.products.length})
                          </div>
                          {msg.products.map((product) => {
                            const img = getProductPrimaryImage(product);
                            return (
                              <div
                                key={product.id}
                                className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-white p-2 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
                              >
                                {img && (
                                  <img
                                    src={img}
                                    alt=""
                                    className="h-11 w-11 shrink-0 rounded-lg border border-slate-50 bg-white object-contain"
                                  />
                                )}
                                <div className="min-w-0 flex-1">
                                  <Link
                                    to={`/products/${product.id}`}
                                    onClick={() => setIsOpen(false)}
                                    className="block truncate text-[11px] font-bold text-slate-800 hover:text-indigo-600"
                                  >
                                    {product.title}
                                  </Link>
                                  <div className="mt-0.5 flex items-center gap-1.5">
                                    <span className="text-[11px] font-black text-slate-900">
                                      {formatCurrency(product.price)}
                                    </span>
                                    {product.discountPercent != null && product.discountPercent > 0 && (
                                      <span className="rounded bg-rose-50 px-1 text-[8px] font-bold text-rose-600">
                                        {product.discountPercent}% OFF
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleAddToCart(product)}
                                  disabled={addingToCartId === product.id}
                                  title="Add to cart"
                                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition hover:bg-indigo-600 hover:text-white disabled:opacity-50"
                                >
                                  {addingToCartId === product.id ? (
                                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                                  ) : (
                                    <ShoppingCart className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-start gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm border border-slate-100 bg-slate-50 px-3.5 py-2.5 text-[11px] text-slate-400">
                      <span className="inline-flex items-center gap-0.5">
                        Analyzing
                        <span className="animate-bounce ml-0.5">.</span>
                        <span className="animate-bounce" style={{ animationDelay: "0.15s" }}>.</span>
                        <span className="animate-bounce" style={{ animationDelay: "0.3s" }}>.</span>
                      </span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* ── Footer: Presets + Input ── */}
              <div className="shrink-0 border-t border-slate-100 bg-slate-50/80 px-3 pb-3 pt-2.5 space-y-2">
                {/* Quick inquiry chips — only show on initial state */}
                {messages.length <= 1 && (
                  <div>
                    <p className="mb-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400">Quick Inquiries</p>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_PROMPTS.map((prompt) => (
                        <button
                          key={prompt.label}
                          onClick={() => handleSendMessage(prompt.text)}
                          className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600 shadow-sm transition hover:border-indigo-400 hover:text-indigo-600"
                        >
                          {prompt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input row */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage(inputVal);
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    placeholder="Ask for gaming, budget, ram..."
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] shadow-inner outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
                  />
                  <button
                    type="submit"
                    disabled={!inputVal.trim() || isTyping}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm transition hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
