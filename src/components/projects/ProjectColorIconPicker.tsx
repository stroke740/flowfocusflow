import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PRESET_COLORS = [
  { hex: "#6366f1", name: "Indigo" },
  { hex: "#8b5cf6", name: "Violet" },
  { hex: "#ec4899", name: "Pink" },
  { hex: "#ef4444", name: "Red" },
  { hex: "#f97316", name: "Orange" },
  { hex: "#eab308", name: "Yellow" },
  { hex: "#22c55e", name: "Green" },
  { hex: "#14b8a6", name: "Teal" },
  { hex: "#06b6d4", name: "Cyan" },
  { hex: "#3b82f6", name: "Blue" },
  { hex: "#64748b", name: "Slate" },
  { hex: "#78716c", name: "Stone" },
];

const EMOJI_CATEGORIES: Record<string, string[]> = {
  "Work": ["📁", "💼", "📊", "📈", "🏢", "💻", "⚙️", "📧", "📋", "🗂️", "📝", "✏️", "📎", "🔗", "📌"],
  "Life": ["🏠", "🛒", "🍳", "🧹", "🌱", "🐾", "👨‍👩‍👧", "💰", "🎯", "💡", "📦", "🔑", "🎁", "💪", "❤️"],
  "Creative": ["🎨", "🎵", "📸", "🎬", "✍️", "📚", "🎭", "🎸", "🖌️", "🎤", "🎮", "🎲", "🧩", "🪄", "⭐"],
  "Travel": ["✈️", "🚗", "🏖️", "⛺", "🗺️", "🧳", "🏔️", "🌍", "🚀", "🎿", "🚲", "⛵", "🏕️", "🌅", "🗿"],
};

interface Props {
  color: string;
  icon: string;
  onColorChange: (c: string) => void;
  onIconChange: (i: string) => void;
}

const ProjectColorIconPicker = ({ color, icon, onColorChange, onIconChange }: Props) => {
  const [emojiSearch, setEmojiSearch] = useState("");

  const filteredEmojis = emojiSearch
    ? Object.values(EMOJI_CATEGORIES)
        .flat()
        .filter(() => true) // emoji search is visual only
    : null;

  return (
    <Tabs defaultValue="color" className="w-full">
      <TabsList className="w-full grid grid-cols-2 h-8">
        <TabsTrigger value="color" className="text-xs">Color</TabsTrigger>
        <TabsTrigger value="icon" className="text-xs">Icon</TabsTrigger>
      </TabsList>

      <TabsContent value="color" className="mt-2">
        <div className="grid grid-cols-4 gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c.hex}
              onClick={() => onColorChange(c.hex)}
              title={c.name}
              className={cn(
                "h-8 rounded-lg transition-all flex items-center justify-center",
                color === c.hex && "ring-2 ring-offset-2 ring-offset-background"
              )}
              style={{ backgroundColor: c.hex, boxShadow: color === c.hex ? `0 0 0 2px ${c.hex}` : undefined }}
            >
              {color === c.hex && <span className="text-white text-xs">✓</span>}
            </button>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="icon" className="mt-2">
        <Input
          value={emojiSearch}
          onChange={(e) => setEmojiSearch(e.target.value)}
          placeholder="Search icons…"
          className="h-7 text-xs mb-2"
        />
        <div className="max-h-40 overflow-y-auto space-y-2">
          {Object.entries(EMOJI_CATEGORIES).map(([cat, emojis]) => (
            <div key={cat}>
              <p className="text-[10px] text-muted-foreground font-medium mb-1">{cat}</p>
              <div className="grid grid-cols-8 gap-1">
                {emojis.map((e) => (
                  <button
                    key={e}
                    onClick={() => onIconChange(e)}
                    className={cn(
                      "w-7 h-7 rounded-md text-base flex items-center justify-center hover:bg-muted transition-colors",
                      icon === e && "bg-primary/10 ring-1 ring-primary"
                    )}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default ProjectColorIconPicker;
export { PRESET_COLORS };
