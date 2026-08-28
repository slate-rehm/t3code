import { normalizeSearchQuery } from "@t3tools/shared/searchRanking";
import { SearchIcon, XIcon } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import { cn } from "~/lib/utils";

import { filterProjectPickerOptions, type ProjectPickerOption } from "./ProjectPicker.logic";
import {
  Combobox,
  ComboboxClear,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxSeparator,
} from "./ui/combobox";

export type { ProjectPickerOption } from "./ProjectPicker.logic";

export const PROJECT_PICKER_ACTION_VALUE = "__project-picker-action__";

export interface ProjectPickerProps<T> {
  readonly options: readonly ProjectPickerOption<T>[];
  readonly value: string | null;
  readonly onValueChange: (value: string) => void;
  readonly trigger: ReactNode;
  readonly renderOption: (option: ProjectPickerOption<T>) => ReactNode;
  readonly popupAlign: "start" | "center";
  readonly popupClassName?: string;
  readonly emptyMessage: string;
  readonly action?: {
    readonly value: string;
    readonly label: string;
    readonly icon: ReactNode;
    readonly onSelect: () => void;
  };
  readonly open?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
}

export function ProjectPicker<T>({
  options,
  value,
  onValueChange,
  trigger,
  renderOption,
  popupAlign,
  popupClassName,
  emptyMessage,
  action,
  open: controlledOpen,
  onOpenChange,
}: ProjectPickerProps<T>) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [query, setQuery] = useState("");
  const open = controlledOpen ?? uncontrolledOpen;
  const normalizedQuery = useMemo(() => normalizeSearchQuery(query), [query]);
  const filteredOptions = useMemo(
    () => filterProjectPickerOptions(options, normalizedQuery),
    [normalizedQuery, options],
  );
  const optionByValue = useMemo(
    () => new Map(options.map((option) => [option.value, option] as const)),
    [options],
  );
  const items = useMemo(
    () => [...options.map((option) => option.value), ...(action ? [action.value] : [])],
    [action, options],
  );
  const filteredItems = useMemo(
    () => [...filteredOptions.map((option) => option.value), ...(action ? [action.value] : [])],
    [action, filteredOptions],
  );

  const handleOpenChange = (nextOpen: boolean) => {
    setUncontrolledOpen(nextOpen);
    if (!nextOpen) {
      setQuery("");
    }
    onOpenChange?.(nextOpen);
  };

  return (
    <Combobox
      autoHighlight={normalizedQuery.length > 0}
      filteredItems={filteredItems}
      inputValue={query}
      items={items}
      itemToStringLabel={(itemValue) =>
        optionByValue.get(itemValue)?.label ?? (itemValue === action?.value ? action.label : "")
      }
      onInputValueChange={setQuery}
      onOpenChange={handleOpenChange}
      onValueChange={(nextValue) => {
        if (typeof nextValue !== "string") {
          return;
        }
        if (action && nextValue === action.value) {
          handleOpenChange(false);
          action.onSelect();
          return;
        }
        handleOpenChange(false);
        onValueChange(nextValue);
      }}
      open={open}
      value={value}
    >
      {trigger}
      <ComboboxPopup align={popupAlign} className={cn("min-w-40 overflow-hidden", popupClassName)}>
        <div
          className={cn(
            "grid shrink-0 transition-[grid-template-rows,opacity] duration-150 ease-out motion-reduce:transition-none",
            query.length > 0
              ? "grid-rows-[1fr] opacity-100"
              : "pointer-events-none grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="min-w-0 px-3 pt-2.5">
              <div className="relative -translate-y-px border-b border-border/70 pb-1.5">
                <SearchIcon
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1.5 left-0 size-4 shrink-0 text-muted-foreground/55"
                />
                <ComboboxInput
                  aria-label="Search projects"
                  autoFocus
                  className="[&_input]:h-6.5 [&_input]:ps-5 [&_input]:pe-6 [&_input]:font-sans [&_input]:leading-6.5"
                  inputClassName="rounded-none bg-transparent text-sm"
                  placeholder="Search projects..."
                  showTrigger={false}
                  size="sm"
                  unstyled
                />
                <ComboboxClear
                  aria-label="Clear project search"
                  className="absolute top-0 right-0 inline-flex size-6 cursor-pointer items-center justify-center rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-3.5"
                >
                  <XIcon />
                </ComboboxClear>
              </div>
            </div>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <ComboboxList className="max-h-72 min-w-0 overflow-x-hidden">
            {filteredOptions.length === 0 ? (
              <div className="p-2 text-center text-base text-muted-foreground sm:text-sm">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <ComboboxItem
                  hideIndicator
                  index={index}
                  key={option.value}
                  value={option.value}
                  className="h-8 min-h-8 py-0 text-sm font-medium"
                  contentClassName="flex min-w-0 items-center gap-2"
                >
                  {renderOption(option)}
                </ComboboxItem>
              ))
            )}
            {action ? (
              <>
                <ComboboxSeparator />
                <ComboboxItem
                  hideIndicator
                  index={filteredOptions.length}
                  value={action.value}
                  className="h-8 min-h-8 py-0 text-sm"
                  contentClassName="flex min-w-0 items-center gap-2"
                >
                  {action.icon}
                  <span className="min-w-0 truncate">{action.label}</span>
                </ComboboxItem>
              </>
            ) : null}
          </ComboboxList>
        </div>
      </ComboboxPopup>
    </Combobox>
  );
}
