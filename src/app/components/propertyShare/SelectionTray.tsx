import React, { useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { X } from 'lucide-react';
import { Property } from '../../../types';
import { formatBhkLabel, titleCase } from '../../../utils/propertyShareFormat';

const CHIP_TYPE = 'property-share-chip';

interface DragItem {
  id: string;
  index: number;
}

interface ChipProps {
  id: string;
  index: number;
  property: Property;
  onRemove: (id: string) => void;
  moveChip: (dragIndex: number, hoverIndex: number) => void;
}

// Standard react-dnd reorderable-list pattern: each chip is both a drag
// source and a drop target over itself; hovering another chip during a drag
// swaps positions live (moveChip), and the drop itself is a no-op — the
// array is already in its final order by the time the drag ends.
const Chip: React.FC<ChipProps> = ({ id, index, property, onRemove, moveChip }) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: CHIP_TYPE,
    item: (): DragItem => ({ id, index }),
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  const [, drop] = useDrop<DragItem>({
    accept: CHIP_TYPE,
    hover: (item) => {
      if (item.index === index) return;
      moveChip(item.index, index);
      item.index = index;
    },
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      className="inline-flex cursor-move items-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-xs shadow-sm"
      style={{ opacity: isDragging ? 0.4 : 1, borderColor: '#e2e4e9' }}
      title="Drag to reorder"
    >
      <span className="font-medium">{titleCase(property.title)}</span>
      <span className="text-muted-foreground">{formatBhkLabel(property.bedrooms)}</span>
      <button
        type="button"
        onClick={() => onRemove(id)}
        aria-label={`Remove ${property.title}`}
        className="flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <X size={11} />
      </button>
    </div>
  );
};

interface SelectionTrayProps {
  order: string[];
  properties: Map<string, Property>;
  onRemove: (id: string) => void;
  onReorder: (nextOrder: string[]) => void;
}

export const SelectionTray: React.FC<SelectionTrayProps> = ({ order, properties, onRemove, onReorder }) => {
  const moveChip = (dragIndex: number, hoverIndex: number) => {
    const next = [...order];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(hoverIndex, 0, moved);
    onReorder(next);
  };

  if (order.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
        No properties selected yet — check properties below to add them here. Selections survive filter changes.
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-wrap gap-2 rounded-lg border bg-muted/30 p-3">
        {order.map((id, index) => {
          const property = properties.get(id);
          if (!property) return null;
          return <Chip key={id} id={id} index={index} property={property} onRemove={onRemove} moveChip={moveChip} />;
        })}
      </div>
    </DndProvider>
  );
};
