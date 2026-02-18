import { useState, type ReactNode } from "react";
import { Drawer } from "antd";
import type { DrawerProps } from "antd";
import { useIsMobile } from "./useIsMobile";

export interface ResizableDrawerProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  /** Default width in pixels. Default: 600 */
  defaultWidth?: number;
  /** Minimum width in pixels. Default: 360 */
  minWidth?: number;
  /** Maximum width in pixels. Default: 1200 */
  maxWidth?: number;
  /** localStorage key for persisting width. Omit to disable persistence. */
  storageKey?: string;
  /** Enable/disable resize. Default: true on desktop, false on mobile. */
  resizable?: boolean;
  /** Extra content in the drawer header (right side). */
  extra?: ReactNode;
  /** Footer content. */
  footer?: ReactNode;
  /** z-index override. */
  zIndex?: number;
  /** Destroy content when drawer is hidden. Default: false. */
  destroyOnHidden?: boolean;
  /** Additional antd Drawer props. */
  drawerProps?: Omit<
    DrawerProps,
    | "open"
    | "onClose"
    | "title"
    | "extra"
    | "footer"
    | "size"
    | "width"
    | "resizable"
    | "maxSize"
    | "zIndex"
    | "destroyOnHidden"
    | "children"
  >;
}

function readStoredWidth(key: string | undefined, fallback: number): number {
  if (!key) return fallback;
  try {
    const saved = localStorage.getItem(`drawer-width-${key}`);
    if (saved) {
      const n = Number(saved);
      if (Number.isFinite(n) && n > 0) return n;
    }
  } catch {
    // localStorage unavailable
  }
  return fallback;
}

export function ResizableDrawer({
  open,
  onClose,
  title,
  children,
  defaultWidth = 600,
  minWidth = 360,
  maxWidth = 1200,
  storageKey,
  resizable,
  extra,
  footer,
  zIndex,
  destroyOnHidden,
  drawerProps,
}: ResizableDrawerProps) {
  const isMobile = useIsMobile();
  const [width, setWidth] = useState(() => readStoredWidth(storageKey, defaultWidth));

  const clamp = (val: number) => Math.min(Math.max(val, minWidth), maxWidth);
  const isResizable = resizable ?? !isMobile;

  const handleResize = (newSize: number) => {
    setWidth(clamp(newSize));
  };

  const handleResizeEnd = () => {
    if (storageKey) {
      try {
        localStorage.setItem(`drawer-width-${storageKey}`, String(width));
      } catch {
        // localStorage unavailable
      }
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={title}
      extra={extra}
      footer={footer}
      size={isMobile ? "100%" : width}
      maxSize={maxWidth}
      resizable={
        isResizable
          ? { onResize: handleResize, onResizeEnd: handleResizeEnd }
          : false
      }
      zIndex={zIndex}
      destroyOnHidden={destroyOnHidden}
      {...drawerProps}
    >
      {children}
    </Drawer>
  );
}

export interface MultiLevelDrawerProps extends ResizableDrawerProps {
  /** Props for the second-level drawer. */
  secondLevelProps?: Omit<ResizableDrawerProps, "drawerProps">;
}

export function MultiLevelDrawer({
  secondLevelProps,
  zIndex,
  ...level1Props
}: MultiLevelDrawerProps) {
  const baseZIndex = zIndex ?? 1000;

  return (
    <>
      <ResizableDrawer {...level1Props} zIndex={baseZIndex} />
      {secondLevelProps && (
        <ResizableDrawer {...secondLevelProps} zIndex={baseZIndex + 1} />
      )}
    </>
  );
}
