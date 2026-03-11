import Link from "next/link";

type FeatureCardProps = {
  title: string;
  description: string;
  status: "Available" | "Coming Soon";
  accent: "blue" | "purple" | "pink" | "slate";
  href?: string;
};

const accentMap = {
  blue: "border-brandBlue/30 text-brandBlue bg-brandBlue/10",
  purple: "border-brandPurple/30 text-brandPurple bg-brandPurple/10",
  pink: "border-brandPink/30 text-brandPink bg-brandPink/10",
  slate: "border-slate-400/30 text-slate-300 bg-slate-300/10",
};

export default function FeatureCard({ title, description, status, accent, href }: FeatureCardProps) {
  const card = (
    <div className={`rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl transition hover:-translate-y-1 hover:border-brandBlue/40 hover:shadow-glow${href ? " cursor-pointer" : ""}`}>
      <div
        className={`mb-4 inline-flex rounded-xl border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${accentMap[accent]}`}
      >
        {status}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
      <p className="text-sm text-slate-300">{description}</p>
    </div>
  );

  if (href) {
    return <Link href={href}>{card}</Link>;
  }

  return card;
}
