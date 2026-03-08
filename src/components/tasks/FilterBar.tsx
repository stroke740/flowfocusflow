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
  { value: "due_asc", label: "Date ↑" },
  { value: "due_desc", label: "Date ↓" },
  { value: "created", label: "Added" },
  { value: "alpha", label: "Name" },
];

const DUE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "this_week", label: "This week" },
  { value: "next_week", label: "Next week" },
  { value: "no_date", label: "No date" },
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
    <div className="flex items-center gap-1.5 flex-wrap">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 rounded-md text-[11px] gap-1 text-muted-foreground hover:text-foreground">
            <Filter size={12} />
            Filter
            {activeCount > 0 && (
              <span className="ml-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 p-0">
          <div className="p-3">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[12px] font-semibold">Filters</span>
              {activeCount > 0 && (
                <button
                  onClick={() => onChange(DEFAULT_FILTERS)}
                  className="text-[11px] text-primary hover:underline"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="mb-2.5">
              <span className="text-[11px] text-muted-foreground mb-1 block">Priority</span>
              <div className="flex gap-1">
                {(["p1", "p2", "p3", "p4"] as TaskPriority[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => togglePriority(p)}
                    className={cn(
                      "flex-1 h-6 rounded-md text-[10px] font-medium transition-colors",
                      filters.priorities.includes(p)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    P{p[1]}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-2.5">
              <span className="text-[11px] text-muted-foreground mb-1 block">Due date</span>
              <div className="flex flex-wrap gap-1">
                {DUE_OPTIONS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => onChange({ ...filters, dueDateRange: filters.dueDateRange === d.value ? null : d.value })}
                    className={cn(
                      "h-6 px-2 rounded-md text-[10px] font-medium transition-colors",
                      filters.dueDateRange === d.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {tags.length > 0 && (
              <div className="mb-2.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-muted-foreground">Labels</span>
                  <button
                    onClick={() => onChange({ ...filters, tagLogic: filters.tagLogic === "and" ? "or" : "and" })}
                    className="text-[9px] text-primary font-bold uppercase"
                  >
                    {filters.tagLogic}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className={cn(
                        "h-5 px-1.5 rounded text-[10px] font-medium transition-colors",
                        filters.tagIds.includes(tag.id)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      @{tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {projects.length > 0 && (
              <div>
                <span className="text-[11px] text-muted-foreground mb-1 block">Projects</span>
                <div className="flex flex-wrap gap-1">
                  {projects.map((p) => (
                    <button
                      key={p}
                      onClick={() => toggleProject(p)}
                      className={cn(
                        "h-5 px-1.5 rounded text-[10px] font-medium transition-colors",
                        filters.projects.includes(p)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
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

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 rounded-md text-[11px] gap-1 text-muted-foreground hover:text-foreground">
            <SortAsc size={12} />
            {SORT_OPTIONS.find((s) => s.value === filters.sort)?.label || "Sort"}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-36 p-1">
          {SORT_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => onChange({ ...filters, sort: s.value })}
              className={cn(
                "w-full text-left px-2.5 py-1.5 rounded-md text-[11px] transition-colors",
                filters.sort === s.value
                  ? "bg-muted text-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted/60"
              )}
            >
              {s.label}
            </button>
          ))}
        </PopoverContent>
      </Popover>

      {activeCount > 0 && (
        <>
          <Separator orientation="vertical" className="h-4" />
          {filters.priorities.map((p) => (
            <button key={p} onClick={() => togglePriority(p)} className="inline-flex items-center gap-0.5 h-5 px-1.5 rounded bg-muted text-[10px] font-medium text-muted-foreground hover:bg-muted/80">
              P{p[1]} <X size={8} />
            </button>
          ))}
          {filters.dueDateRange && (
            <button onClick={() => onChange({ ...filters, dueDateRange: null })} className="inline-flex items-center gap-0.5 h-5 px-1.5 rounded bg-muted text-[10px] font-medium text-muted-foreground hover:bg-muted/80">
              {DUE_OPTIONS.find((d) => d.value === filters.dueDateRange)?.label} <X size={8} />
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default FilterBar;
