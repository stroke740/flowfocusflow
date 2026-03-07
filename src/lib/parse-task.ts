import { addDays, parse, isValid, startOfDay } from "date-fns";
import { TaskPriority } from "@/types/task";

interface ParsedTask {
  title: string;
  dueDate?: Date;
  priority: TaskPriority;
  tags: string[];
}

export function parseNaturalLanguageTask(input: string): ParsedTask {
  let title = input.trim();
  let dueDate: Date | undefined;
  let priority: TaskPriority = "p4";
  const tags: string[] = [];

  // Extract tags (#tag)
  const tagRegex = /#(\w+)/g;
  let match;
  while ((match = tagRegex.exec(title)) !== null) {
    tags.push(match[1]);
  }
  title = title.replace(tagRegex, "").trim();

  // Extract priority (p1-p4)
  const prioMatch = title.match(/\bp([1-4])\b/i);
  if (prioMatch) {
    priority = `p${prioMatch[1]}` as TaskPriority;
    title = title.replace(prioMatch[0], "").trim();
  }

  // Extract relative dates
  const today = startOfDay(new Date());
  const lower = title.toLowerCase();

  if (/\btomorrow\b/.test(lower)) {
    dueDate = addDays(today, 1);
    title = title.replace(/\btomorrow\b/i, "").trim();
  } else if (/\btoday\b/.test(lower)) {
    dueDate = today;
    title = title.replace(/\btoday\b/i, "").trim();
  } else if (/\bnext week\b/.test(lower)) {
    dueDate = addDays(today, 7);
    title = title.replace(/\bnext week\b/i, "").trim();
  }

  // Clean up extra spaces
  title = title.replace(/\s+/g, " ").trim();

  return { title, dueDate, priority, tags };
}
