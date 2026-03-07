import { useState } from "react";
import { Filter, SortAsc, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { FilterState, DEFAULT_FILTERS, TaskPriority, PRIORITY_CONFIG, SortOption } from "@/types/task";
import { Tag } from "@/types/task";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

interface FilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  tags: Tag[];
  projects: string[];
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "manual", label: "Manual" },
  { value: "priority", label: "Priority" },
  { value: "due_asc", label: "Due Date ↑" },
  { value: "due_desc", label: "Due Date ↓" },
  { value: "created", label: "Created" },
  { value: "alpha", label: "A → Z" },
];

const DUE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "this_week", label: "This Week" },
  { value: "next_week", label: "Next Week" },
  { value: "no_date", label: "No Date" },
] as const;

const FilterBar = ({ filters, onChange, tags, projects }: FilterBarProps) => {
  const [open, setOpen] = useState(false);
  const activeCount =
    filters.priorities.length +
    filters.tagIds.length +
    filters.projects.length +
    (filters.dueDateRange ? 1 : 0);

  const togglePriority = (p: TaskPriority) => {
    const next = filters.priorities.includes(p)
      ? filters.priorities.filter((x) => x !== p)
      : [...filters.priorities, p];
    onChange({ ...filters, priorities: next });
  };

  const toggleTag = (id: string) => {
    const next = filters.tagIds.includes(id)
      ? filters.tagIds.filter((x) => x !== id)
      : [...filters.tagIds, id];
    onChange({ ...filters, tagIds: next });
  };

  const toggleProject = (name: string) => {
    const next = filters.projects.includes(name)
      ? filters.projects.filter((x) => x !== name)
      : [...filters.projects, name];
    onChange({ ...filters, projects: next });
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Filter popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs gap-1.5">
            <Filter size={13} />
            Filter
            {activeCount > 0 && (
              <Badge className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                {activeCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 p-0">
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold">Filters</span>
              {activeCount > 0 && (
                <button
                  onClick={() => onChange(DEFAULT_FILTERS)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Priority */}
            <div className="mb-3">
              <span className="text-xs text-muted-foreground mb-1.5 block">Priority</span>
              <div className="flex gap-1.5">
                {(["p1", "p2", "p3", "p4"] as TaskPriority[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => togglePriority(p)}
                    className={cn(
                      "flex-1 h-7 rounded-lg text-[11px] font-medium border transition-colors",
                      filters.priorities.includes(p)
                        ? "bg-primary/10 border-primary text-primary"
                        : "border-border text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {PRIORITY_CONFIG[p].emoji || "—"} {p.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Due date */}
            <div className="mb-3">
              <span className="text-xs text-muted-foreground mb-1.5 block">Due Date</span>
              <div className="flex flex-wrap gap-1.5">
                {DUE_OPTIONS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => onChange({ ...filters, dueDateRange: filters.dueDateRange === d.value ? null : d.value })}
                    className={cn(
                      "h-7 px-2.5 rounded-lg text-[11px] font-medium border transition-colors",
                      filters.dueDateRange === d.value
                        ? "bg-primary/10 border-primary text-primary"
                        : "border-border text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-muted-foreground">Tags</span>
                  <button
                    onClick={() => onChange({ ...filters, tagLogic: filters.tagLogic === "and" ? "or" : "and" })}
                    className="text-[10px] text-primary font-medium"
                  >
                    {filters.tagLogic.toUpperCase()}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className={cn(
                        "h-6 px-2 rounded-md text-[11px] font-medium border transition-colors",
                        filters.tagIds.includes(tag.id)
                          ? "bg-primary/10 border-primary text-primary"
                          : "border-border text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            {projects.length > 0 && (
              <div>
                <span className="text-xs text-muted-foreground mb-1.5 block">Projects</span>
                <div className="flex flex-wrap gap-1.5">
                  {projects.map((p) => (
                    <button
                      key={p}
                      onClick={() => toggleProject(p)}
                      className={cn(
                        "h-6 px-2 rounded-md text-[11px] font-medium border transition-colors",
                        filters.projects.includes(p)
                          ? "bg-primary/10 border-primary text-primary"
                          : "border-border text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Sort dropdown */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs gap-1.5">
            <SortAsc size={13} />
            {SORT_OPTIONS.find((s) => s.value === filters.sort)?.label || "Sort"}
            <ChevronDown size={11} />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-40 p-1">
          {SORT_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => onChange({ ...filters, sort: s.value })}
              className={cn(
                "w-full text-left px-3 py-1.5 rounded-md text-xs transition-colors",
                filters.sort === s.value
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {s.label}
            </button>
          ))}
        </PopoverContent>
      </Popover>

      {/* Active filter chips */}
      {activeCount > 0 && (
        <>
          <Separator orientation="vertical" className="h-5" />
          {filters.priorities.map((p) => (
            <Badge key={p} variant="secondary" className="text-[10px] gap-1 cursor-pointer" onClick={() => togglePriority(p)}>
              {PRIORITY_CONFIG[p].emoji} {p.toUpperCase()}
              <X size={10} />
            </Badge>
          ))}
          {filters.dueDateRange && (
            <Badge variant="secondary" className="text-[10px] gap-1 cursor-pointer" onClick={() => onChange({ ...filters, dueDateRange: null })}>
              {DUE_OPTIONS.find((d) => d.value === filters.dueDateRange)?.label}
              <X size={10} />
            </Badge>
          )}
        </>
      )}
    </div>
  );
};

export default FilterBar;
