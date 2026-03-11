import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StudyWithAI | AI PDF RAG Platform",
  description: "Upload PDFs and chat with them using production-ready Retrieval-Augmented Generation.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="relative min-h-screen overflow-x-hidden">{children}</div>
      </body>
    </html>
  );
}
