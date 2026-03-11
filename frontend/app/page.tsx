"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import FeatureCard from "../components/FeatureCard";
import ParticleBackground from "../components/ParticleBackground";

const features = [
  {
    title: "Ask PDF",
    description: "Chat with your documents and get accurate answers grounded in retrieved context.",
    status: "Available" as const,
    accent: "blue" as const,
    href: "/dashboard",
  },
  {
    title: "AI Notes Generator",
    description: "Convert dense textbooks into concise, exam-ready notes with one click.",
    status: "Coming Soon" as const,
    accent: "purple" as const,
  },
  {
    title: "Smart Flashcards",
    description: "Generate spaced repetition cards from any chapter and review faster.",
    status: "Coming Soon" as const,
    accent: "pink" as const,
  },
  {
    title: "Research Assistant",
    description: "Cross-reference multiple papers and discover hidden conceptual links.",
    status: "Coming Soon" as const,
    accent: "slate" as const,
  },
];

export default function HomePage() {
  return (
    <main className="relative overflow-hidden">
      <ParticleBackground className="pointer-events-none fixed inset-0 -z-20" />
      <div className="grid-pattern pointer-events-none fixed inset-0 -z-30 opacity-20" />

      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brandBlue to-brandPurple font-black text-black">
            S
          </div>
          <p className="text-lg font-bold">EasyStudy</p>
        </div>
        <div className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
          <a href="#features" className="transition hover:text-white">
            Features
          </a>
          <Link href="/dashboard" className="rounded-full border border-white/15 px-4 py-2 transition hover:bg-white/10">
            Open App
          </Link>
        </div>
      </header>

      <section className="mx-auto flex max-w-7xl flex-col items-center px-6 pb-24 pt-10 text-center md:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-7 rounded-full border border-brandBlue/30 bg-brandBlue/10 px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-brandBlue"
        >
          Next Gen Learning Platform
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05 }}
          className="max-w-5xl text-5xl font-extrabold leading-tight md:text-7xl"
        >
          Ask Your PDFs
          <span className="gradient-text block">Anything with AI</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mt-7 max-w-2xl text-lg text-slate-300"
        >
          Upload documents, retrieve the right chunks, and get instant answers powered by a production-ready RAG pipeline.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-10 flex flex-col gap-4 sm:flex-row"
        >
          <Link
            href="/dashboard"
            className="rounded-2xl bg-white px-8 py-4 text-lg font-semibold text-black transition hover:scale-[1.02]"
          >
            Upload PDF
          </Link>
          <Link
            href="/dashboard"
            className="rounded-2xl border border-white/15 px-8 py-4 text-lg font-medium text-slate-200 transition hover:border-white/35"
          >
            Watch Demo
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-16 w-full max-w-5xl animate-float"
        >
          <div className="rounded-3xl border border-brandPurple/35 bg-gradient-to-r from-brandBlue/10 via-brandPurple/10 to-brandPink/10 p-1">
            <div className="glass-panel grid min-h-72 grid-cols-1 gap-4 rounded-[22px] p-4 md:grid-cols-2">
              <div className="rounded-2xl bg-white/5" />
              <div className="space-y-4">
                <div className="h-9 w-2/3 rounded-xl bg-brandBlue/30" />
                <div className="h-28 w-full rounded-xl bg-white/10" />
                <div className="h-9 w-1/2 rounded-xl bg-brandPurple/30" />
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 pb-24">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Supercharge Your Learning</h2>
          <p className="mt-3 text-slate-300">Everything you need to master your material faster.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </section>
    </main>
  );
}
