export default function TypingDots() {
  return (
    <div className="flex items-center gap-1" aria-live="polite" aria-label="Assistant is typing">
      <span className="h-1.5 w-1.5 rounded-full bg-brandBlue animate-typing" />
      <span className="h-1.5 w-1.5 rounded-full bg-brandBlue animate-typing [animation-delay:0.2s]" />
      <span className="h-1.5 w-1.5 rounded-full bg-brandBlue animate-typing [animation-delay:0.4s]" />
    </div>
  );
}
