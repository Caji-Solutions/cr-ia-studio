"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUp,
  Layers,
  LayoutTemplate,
  Smartphone,
  Video,
  FileText,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const placeholders = [
  "Crie um carrossel sobre tendências de marketing digital...",
  "Vídeo para Reels sobre dicas de produtividade...",
  "Post para LinkedIn sobre liderança e inovação...",
  "Story interativo para aumentar o engajamento da marca...",
];

const FORMAT_PILLS = [
  {
    id:       "carousel",
    label:    "Carrossel",
    icon:     Layers,
    gradient: "linear-gradient(135deg,#8b5cf6,#7c3aed)",
    shadow:   "0 2px 10px #8b5cf650",
  },
  {
    id:       "post",
    label:    "Post",
    icon:     LayoutTemplate,
    gradient: "linear-gradient(135deg,#6366f1,#4f46e5)",
    shadow:   "0 2px 10px #6366f150",
  },
  {
    id:       "story",
    label:    "Story",
    icon:     Smartphone,
    gradient: "linear-gradient(135deg,#ec4899,#db2777)",
    shadow:   "0 2px 10px #ec489950",
  },
  {
    id:       "video_16_9",
    label:    "Vídeo",
    icon:     Video,
    gradient: "linear-gradient(135deg,#3b82f6,#2563eb)",
    shadow:   "0 2px 10px #3b82f650",
  },
  {
    id:       "caption",
    label:    "Legenda",
    icon:     FileText,
    gradient: "linear-gradient(135deg,#f59e0b,#d97706)",
    shadow:   "0 2px 10px #f59e0b50",
  },
];

export function HeroCommand() {
  const router = useRouter();

  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isAnimating, setIsAnimating]           = useState(false);
  const [selectedFormat, setSelectedFormat]     = useState<string | null>(null);
  const [value, setValue]                       = useState("");
  const textareaRef                             = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
        setIsAnimating(false);
      }, 350);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.max(88, ta.scrollHeight) + "px";
  }, [value]);

  const canSubmit = value.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const params = new URLSearchParams();
    params.set("command", value.trim());
    if (selectedFormat) params.set("format", selectedFormat);
    router.push(`/create?${params.toString()}`);
  };

  return (
    <div className="relative max-w-2xl w-full mx-auto mt-2 mb-8">
      <div
        className={cn(
          "relative bg-card/80 backdrop-blur-md rounded-2xl border flex flex-col overflow-hidden",
          "transition-all duration-300",
          "border-border/70",
          "focus-within:border-primary/50",
          "focus-within:shadow-[0_0_0_3px_hsl(var(--primary)/0.12),0_12px_48px_hsl(var(--primary)/0.14)]",
          "shadow-[0_4px_24px_hsl(var(--primary)/0.06)]",
        )}
      >
        {/* Sparkle indicator */}
        <div className="absolute top-4 right-4 pointer-events-none">
          <Sparkles className="h-3.5 w-3.5 text-primary/25" />
        </div>

        {/* Textarea */}
        <div className="relative px-5 pt-5 pb-2">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            className={cn(
              "w-full resize-none border-0 focus:outline-none focus:ring-0",
              "text-base bg-transparent leading-relaxed text-foreground",
              "min-h-[88px] pr-8 placeholder-transparent",
            )}
            style={{ lineHeight: "1.75" }}
            aria-label="Descreva o conteúdo que deseja criar"
          />
          {/* Animated placeholder overlay */}
          {!value && (
            <div
              className="absolute top-5 left-5 pointer-events-none pr-10 text-base leading-relaxed"
              style={{ lineHeight: "1.75" }}
              aria-hidden
            >
              <span
                className={cn(
                  "block transition-all duration-350",
                  isAnimating
                    ? "opacity-0 translate-y-1"
                    : "opacity-40 translate-y-0",
                  "text-muted-foreground",
                )}
              >
                {placeholders[placeholderIndex]}
              </span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="mx-5 h-px bg-border/50" />

        {/* Bottom bar */}
        <div className="flex items-center gap-2 px-4 py-3">
          {/* Format pills */}
          <div className="flex items-center gap-1.5 flex-1 overflow-x-auto">
            {FORMAT_PILLS.map(({ id, label, icon: Icon, gradient, shadow }) => {
              const active = selectedFormat === id;
              return (
                <button
                  key={id}
                  data-no-scale
                  type="button"
                  onClick={() => setSelectedFormat(id === selectedFormat ? null : id)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
                    "whitespace-nowrap shrink-0 transition-all duration-200",
                    active
                      ? "text-white border border-transparent scale-105"
                      : "text-muted-foreground hover:text-foreground border border-border/60 hover:border-border",
                  )}
                  style={active ? { background: gradient, boxShadow: shadow } : {}}
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </button>
              );
            })}
          </div>

          {/* Submit button */}
          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className={cn(
              "flex items-center justify-center h-9 w-9 rounded-xl shrink-0",
              "transition-all duration-200",
              canSubmit
                ? "text-white shadow-[0_4px_16px_#8b5cf660] hover:opacity-90 hover:scale-105 active:scale-95"
                : "bg-muted text-muted-foreground cursor-not-allowed",
            )}
            style={canSubmit ? {
              background: "linear-gradient(135deg,#8b5cf6,#ec4899)",
            } : {}}
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Keyboard hint */}
      <p className="text-center text-[11px] text-muted-foreground/35 mt-2 select-none">
        Enter para gerar · Shift+Enter para nova linha
      </p>
    </div>
  );
}
