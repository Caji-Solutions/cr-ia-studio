"use client";

import { useEffect, useRef, useState } from "react";
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
  { id: "carousel",   label: "Carrossel", icon: Layers         },
  { id: "post",       label: "Post",      icon: LayoutTemplate },
  { id: "story",      label: "Story",     icon: Smartphone     },
  { id: "video_16_9", label: "Vídeo",     icon: Video          },
  { id: "caption",    label: "Legenda",   icon: FileText       },
];

export function HeroCommand() {
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

  return (
    <div className="relative max-w-2xl w-full mx-auto mt-2 mb-10">
      <div
        className={cn(
          "relative bg-card rounded-2xl border flex flex-col overflow-hidden",
          "transition-all duration-300",
          "border-border",
          "focus-within:border-primary/40",
          "focus-within:shadow-[0_0_0_3px_hsl(var(--primary)/0.12),0_8px_40px_hsl(var(--primary)/0.10)]",
        )}
      >
        {/* Sparkle indicator */}
        <div className="absolute top-4 right-4 pointer-events-none">
          <Sparkles className="h-3.5 w-3.5 text-primary/30" />
        </div>

        {/* Textarea */}
        <div className="relative px-5 pt-5 pb-2">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) e.preventDefault();
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
        <div className="mx-5 h-px bg-border/60" />

        {/* Bottom bar */}
        <div className="flex items-center gap-2 px-4 py-3">
          {/* Format pills */}
          <div className="flex items-center gap-1.5 flex-1 overflow-x-auto">
            {FORMAT_PILLS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                data-no-scale
                type="button"
                onClick={() =>
                  setSelectedFormat(id === selectedFormat ? null : id)
                }
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                  "whitespace-nowrap shrink-0 transition-all duration-150",
                  selectedFormat === id
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent",
                )}
              >
                <Icon className="h-3 w-3" />
                {label}
              </button>
            ))}
          </div>

          {/* Submit button */}
          <button
            type="button"
            disabled={!canSubmit}
            className={cn(
              "flex items-center justify-center h-8 w-8 rounded-xl shrink-0",
              "transition-all duration-200",
              canSubmit
                ? "bg-primary text-primary-foreground shadow-[0_2px_16px_hsl(var(--primary)/0.45)] hover:opacity-90"
                : "bg-muted text-muted-foreground cursor-not-allowed",
            )}
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
