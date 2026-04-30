import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, Loader2, Scissors, Check, Square, CheckSquare2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { extractPages, renderPageThumbnails, downloadBlob } from "@/lib/pdf";

export const Route = createFileRoute("/split")({
  component: SplitPage,
  head: () => ({
    meta: [
      { title: "PDFを分割 — PDF Manager" },
      { name: "description", content: "PDFのページをプレビューして必要なページだけを抽出します。" },
    ],
  }),
});

interface PageMeta {
  index: number;
  width: number;
  height: number;
}

function SplitPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageMeta[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadFile = useCallback(async (f: File) => {
    setLoading(true);
    setPages([]);
    setSelected(new Set());
    try {
      const metas = await renderPageThumbnails(f);
      setFile(f);
      setPages(metas);
    } catch (err) {
      console.error(err);
      toast.error("PDFを読み込めませんでした");
      setFile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const togglePage = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(pages.map((p) => p.index)));
  const clearAll = () => setSelected(new Set());

  const handleExtract = async () => {
    if (!file || selected.size === 0) return;
    setBusy(true);
    setProgress(0);
    try {
      const bytes = await extractPages(file, Array.from(selected), (p) =>
        setProgress(Math.round(p * 100)),
      );
      const base = file.name.replace(/\.pdf$/i, "");
      downloadBlob(bytes, `${base}-extracted-${Date.now()}.pdf`);
      toast.success(`${selected.size}ページを抽出しました`);
    } catch (err) {
      console.error(err);
      toast.error("抽出に失敗しました");
    } finally {
      setBusy(false);
      setTimeout(() => setProgress(0), 800);
    }
  };

  // Reset when file removed
  useEffect(() => {
    if (!file) {
      setPages([]);
      setSelected(new Set());
    }
  }, [file]);

  return (
    <AppShell>
      <Toaster />
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">PDFを分割</h1>
        <p className="text-sm text-muted-foreground mt-1">ページを選んで抽出した新しいPDFを作成します。</p>
      </motion.div>

      {!file && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f && (f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"))) loadFile(f);
            else toast.error("PDFファイルを選んでください");
          }}
          onClick={() => inputRef.current?.click()}
          className="mt-6 rounded-2xl border-2 border-dashed border-border bg-card/60 hover:bg-card transition-all p-8 text-center cursor-pointer"
          role="button"
          tabIndex={0}
        >
          <div
            className="inline-flex h-12 w-12 items-center justify-center rounded-xl text-primary-foreground mb-3"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Upload className="h-6 w-6" />
          </div>
          <div className="text-sm font-medium">PDFファイルを選択</div>
          <div className="text-xs text-muted-foreground mt-1">またはここにドラッグ&ドロップ</div>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) loadFile(f);
              e.target.value = "";
            }}
          />
        </div>
      )}

      {loading && (
        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> ページを読み込み中…
        </div>
      )}

      {file && !loading && (
        <div className="mt-6">
          <div className="flex items-center justify-between gap-3 flex-wrap rounded-xl border border-border bg-card p-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{file.name}</div>
                <div className="text-xs text-muted-foreground">
                  {pages.length}ページ · {selected.size}ページ選択中
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={selectAll}>
                <CheckSquare2 className="h-4 w-4 mr-1" /> 全選択
              </Button>
              <Button size="sm" variant="outline" onClick={clearAll}>
                <Square className="h-4 w-4 mr-1" /> 解除
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setFile(null)}>
                変更
              </Button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            <AnimatePresence>
              {pages.map((p) => {
                const isSel = selected.has(p.index);
                const ratio = p.height / p.width;
                return (
                  <motion.button
                    key={p.index}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: Math.min(p.index * 0.01, 0.3) }}
                    onClick={() => togglePage(p.index)}
                    className={`relative rounded-xl border-2 overflow-hidden transition-all text-left ${
                      isSel
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-border hover:border-primary/40"
                    }`}
                    style={{ background: "white" }}
                  >
                    <div
                      className="w-full"
                      style={{
                        paddingTop: `${ratio * 100}%`,
                        background: "repeating-linear-gradient(180deg, oklch(0.99 0 0) 0 12px, oklch(0.95 0.005 250) 12px 13px)",
                      }}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <FileText className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                    <div
                      className={`absolute top-2 right-2 h-7 w-7 rounded-full flex items-center justify-center transition-all ${
                        isSel
                          ? "bg-primary text-primary-foreground scale-100"
                          : "bg-background/80 backdrop-blur border border-border scale-90"
                      }`}
                    >
                      {isSel && <Check className="h-4 w-4" />}
                    </div>
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-background/80 backdrop-blur text-xs font-semibold">
                      P.{p.index + 1}
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>

          {busy && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center gap-2 text-sm font-medium mb-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                抽出中… {progress}%
              </div>
              <Progress value={progress} />
            </motion.div>
          )}

          <div className="mt-6 sticky bottom-20 sm:bottom-6 z-30">
            <Button
              onClick={handleExtract}
              disabled={busy || selected.size === 0}
              className="w-full h-12 text-base font-semibold text-primary-foreground border-0"
              style={{
                background: selected.size && !busy ? "var(--gradient-primary)" : undefined,
                boxShadow: "var(--shadow-elegant)",
              }}
            >
              <Scissors className="h-5 w-5 mr-2" />
              選択したページを抽出して保存
            </Button>
          </div>
        </div>
      )}
    </AppShell>
  );
}