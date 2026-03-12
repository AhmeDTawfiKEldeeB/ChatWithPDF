"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

interface TypingMessageProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
}

export default function TypingMessage({ text, speed = 12, onComplete }: TypingMessageProps) {
  const [charIndex, setCharIndex] = useState(0);
  const completed = useRef(false);

  useEffect(() => {
    setCharIndex(0);
    completed.current = false;
  }, [text]);

  useEffect(() => {
    if (charIndex >= text.length) {
      if (!completed.current) {
        completed.current = true;
        onComplete?.();
      }
      return;
    }
    const timer = setTimeout(() => setCharIndex((i) => i + 1), speed);
    return () => clearTimeout(timer);
  }, [charIndex, text, speed, onComplete]);

  const displayed = text.slice(0, charIndex);

  return (
    <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-pre:my-2 prose-pre:bg-white/10 prose-pre:rounded-lg prose-code:text-brandBlue prose-code:before:content-none prose-code:after:content-none prose-a:text-brandBlue prose-strong:text-white">
      {/* Invisible full text to lock the final width/height */}
      <div aria-hidden className="invisible h-0 overflow-hidden">
        <ReactMarkdown>{text}</ReactMarkdown>
      </div>
      {/* Visible typing text */}
      <ReactMarkdown>{displayed}</ReactMarkdown>
      {charIndex < text.length && (
        <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-brandBlue align-middle" />
      )}
    </div>
  );
}
