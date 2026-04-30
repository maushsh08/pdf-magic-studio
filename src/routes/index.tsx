import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Combine, Scissors, ShieldCheck, Zap, Smartphone } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const cards = [
    {
      to: "/merge" as const,
      title: "PDFを結合する",
      desc: "複数のPDFや画像を1つのPDFにまとめます。順番もドラッグで自由に。",
      icon: Combine,
      gradient: "linear-gradient(135deg, oklch(0.58 0.20 265), oklch(0.72 0.18 285))",
    },
    {
      to: "/split" as const,
      title: "PDFを分割する",
      desc: "ページをプレビューして、必要なページだけを抽出した新しいPDFを作成。",
      icon: Scissors,
      gradient: "linear-gradient(135deg, oklch(0.65 0.17 155), oklch(0.72 0.18 200))",
    },
  ];

  const features = [
    { icon: ShieldCheck, label: "完全プライベート", desc: "ファイルはブラウザ内のみで処理" },
    { icon: Zap, label: "高速", desc: "サーバー往復なしで即ダウンロード" },
    { icon: Smartphone, label: "PWA対応", desc: "ホーム画面に追加してアプリのように" },
  ];

  return (
    <AppShell>
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10 sm:mb-14"
      >
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
          スマホで完結する <br className="sm:hidden" />
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            PDFツール
          </span>
        </h1>
        <p className="mt-4 text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
          結合・分割をすべてブラウザ内で。アップロード不要、安心・安全。
        </p>
      </motion.section>

      <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div
              key={c.to}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1, duration: 0.4 }}
            >
              <Link
                to={c.to}
                className="group block rounded-2xl bg-card border border-border p-6 sm:p-8 transition-all hover:-translate-y-1"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div
                  className="inline-flex h-12 w-12 items-center justify-center rounded-xl text-primary-foreground mb-4"
                  style={{ background: c.gradient }}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-semibold">{c.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{c.desc}</p>
                <span className="mt-4 inline-flex items-center text-sm font-medium text-primary group-hover:underline">
                  はじめる →
                </span>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.label} className="rounded-xl bg-card/60 border border-border p-4 flex items-start gap-3">
              <Icon className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <div className="text-sm font-semibold">{f.label}</div>
                <div className="text-xs text-muted-foreground">{f.desc}</div>
              </div>
            </div>
          );
        })}
      </motion.div>
    </AppShell>
  );
}
