import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, Image as ImageIcon, GripVertical, Trash2, Combine, Loader2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { mergeFiles, downloadBlob, type MergeItem } from "@/lib/pdf";

export const Route = createFileRoute("/merge")({
  component: MergePage,
  head: () => ({
    meta: [
      { title: "PDFを結合 — PDF Manager" },
      { name: "description", content: "複数のPDFや画像をブラウザ内で1つのPDFに結合します。" },
    ],
  }),
});

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function classifyFile(file: File): MergeItem["kind"] | null {
  const t = file.type;
  const n = file.name.toLowerCase();
  if (t === "application/pdf" || n.endsWith(".pdf")) return "pdf";
  if (t === "image/png" || t === "image/jpeg" || n.endsWith(".png") || n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image";
  return null;
}

function SortableRow({ item, onRemove }: { item: MergeItem; onRemove: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  const Icon = item.kind === "pdf" ? FileText : ImageIcon;
  const sizeKb = (item.file.size / 1024).toFixed(0);
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
    >
      <button
        {...attributes}
        {...listeners}
        className="touch-none cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1"
        aria-label="並べ替え"
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{item.file.name}</div>
        <div className="text-xs text-muted-foreground">{item.kind.toUpperCase()} · {sizeKb} KB</div>
      </div>
      <button
        onClick={() => onRemove(item.id)}
        className="text-muted-foreground hover:text-destructive p-1.5 rounded-md"
        aria-label="削除"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function MergePage() {
  const [items, setItems] = useState<MergeItem[]>([]);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  );

  const addFiles = useCallback((files: FileList | File[]) => {
    const accepted: MergeItem[] = [];
    Array.from(files).forEach((f) => {
      const kind = classifyFile(f);
      if (kind) accepted.push({ id: uid(), file: f, kind });
    });
    if (accepted.length === 0) {
      toast.error("PDF・JPG・PNGのみ対応しています");
      return;
    }
    setItems((prev) => [...prev, ...accepted]);
  }, []);

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const oldIdx = prev.findIndex((p) => p.id === active.id);
      const newIdx = prev.findIndex((p) => p.id === over.id);
      return arrayMove(prev, oldIdx, newIdx);
    });
  };

  const handleMerge = async () => {
    if (items.length < 1) return;
    setBusy(true);
    setProgress(0);
    try {
      const bytes = await mergeFiles(items, (p) => setProgress(Math.round(p * 100)));
      downloadBlob(bytes, `merged-${Date.now()}.pdf`);
      toast.success("結合したPDFをダウンロードしました");
    } catch (err) {
      console.error(err);
      toast.error("結合に失敗しました。ファイルを確認してください。");
    } finally {
      setBusy(false);
      setTimeout(() => setProgress(0), 800);
    }
  };

  return (
    <AppShell>
      <Toaster />
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">PDFを結合</h1>
        <p className="text-sm text-muted-foreground mt-1">複数のPDFや画像を1つのPDFにまとめます。</p>
      </motion.div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
        }}
        className={`mt-6 rounded-2xl border-2 border-dashed transition-all p-8 text-center cursor-pointer ${
          dragOver ? "border-primary bg-primary/5" : "border-border bg-card/60 hover:bg-card"
        }`}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        <div
          className="inline-flex h-12 w-12 items-center justify-center rounded-xl text-primary-foreground mb-3"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Upload className="h-6 w-6" />
        </div>
        <div className="text-sm font-medium">タップしてファイルを選択</div>
        <div className="text-xs text-muted-foreground mt-1">またはここにドラッグ&ドロップ（PDF・JPG・PNG）</div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="application/pdf,image/png,image/jpeg"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {items.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground">
              {items.length}件のファイル · ドラッグで並べ替え
            </h2>
            <button
              onClick={() => setItems([])}
              className="text-xs text-muted-foreground hover:text-destructive"
            >
              すべてクリア
            </button>
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                <AnimatePresence>
                  {items.map((it) => (
                    <motion.div
                      key={it.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <SortableRow item={it} onRemove={(id) => setItems((p) => p.filter((x) => x.id !== id))} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {busy && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-center gap-2 text-sm font-medium mb-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            結合中… {progress}%
          </div>
          <Progress value={progress} />
        </motion.div>
      )}

      <div className="mt-8 sticky bottom-20 sm:bottom-6 z-30">
        <Button
          onClick={handleMerge}
          disabled={busy || items.length < 1}
          className="w-full h-12 text-base font-semibold text-primary-foreground border-0"
          style={{ background: items.length && !busy ? "var(--gradient-primary)" : undefined, boxShadow: "var(--shadow-elegant)" }}
        >
          <Combine className="h-5 w-5 mr-2" />
          1つのPDFとして結合して保存
        </Button>
      </div>
    </AppShell>
  );
}