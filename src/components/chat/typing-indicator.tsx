"use client";

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-7 h-7 md:w-8 md:h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20">
        <div className="flex gap-0.5">
          <span
            className="w-1.5 h-1.5 rounded-full bg-emerald-400/80"
            style={{ animation: "typing-dot 1.4s ease-in-out 0s infinite" }}
          />
          <span
            className="w-1.5 h-1.5 rounded-full bg-emerald-400/80"
            style={{ animation: "typing-dot 1.4s ease-in-out 0.2s infinite" }}
          />
          <span
            className="w-1.5 h-1.5 rounded-full bg-emerald-400/80"
            style={{ animation: "typing-dot 1.4s ease-in-out 0.4s infinite" }}
          />
        </div>
      </div>
      <div className="bg-secondary/60 border border-border/40 rounded-2xl px-4 py-3">
        <div className="flex gap-1">
          <span
            className="w-2 h-2 rounded-full bg-muted-foreground/40"
            style={{ animation: "typing-dot 1.4s ease-in-out 0s infinite" }}
          />
          <span
            className="w-2 h-2 rounded-full bg-muted-foreground/40"
            style={{ animation: "typing-dot 1.4s ease-in-out 0.2s infinite" }}
          />
          <span
            className="w-2 h-2 rounded-full bg-muted-foreground/40"
            style={{ animation: "typing-dot 1.4s ease-in-out 0.4s infinite" }}
          />
        </div>
      </div>
    </div>
  );
}
