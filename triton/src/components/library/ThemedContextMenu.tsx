import React, { useState, useEffect, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { cn } from "@/lib/utils";

// Context to manage menu state
interface ContextMenuContextType {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    position: { x: number; y: number };
    setPosition: (pos: { x: number; y: number }) => void;
    closeMenu: () => void;
}

const ContextMenuContext = createContext<ContextMenuContextType | undefined>(undefined);

// ============================================================================
// COMPONENTS
// ============================================================================

export interface ThemedContextMenuProps {
    children: React.ReactNode;
}

export const ThemedContextMenu = ({ children }: ThemedContextMenuProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const closeMenu = () => setIsOpen(false);

    // Close on click outside (or anywhere else)
    useEffect(() => {
        if (isOpen) {
            const handleClick = () => setIsOpen(false);
            const handleScroll = () => setIsOpen(false);
            const handleResize = () => setIsOpen(false);
            const handleContextMenu = () => setIsOpen(false);

            document.addEventListener('click', handleClick);
            document.addEventListener('contextmenu', handleContextMenu);
            document.addEventListener('scroll', handleScroll, true);
            window.addEventListener('resize', handleResize);

            return () => {
                document.removeEventListener('click', handleClick);
                document.removeEventListener('contextmenu', handleContextMenu);
                document.removeEventListener('scroll', handleScroll, true);
                window.removeEventListener('resize', handleResize);
            };
        }
    }, [isOpen]);

    return (
        <ContextMenuContext.Provider value={{ isOpen, setIsOpen, position, setPosition, closeMenu }}>
            {children}
        </ContextMenuContext.Provider>
    );
};

export const ThemedContextMenuTrigger = ({
    children,
    className
}: {
    children: React.ReactNode;
    className?: string;
}) => {
    const context = useContext(ContextMenuContext);

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (context) {
            context.setPosition({ x: e.clientX, y: e.clientY });
            context.setIsOpen(true);
        }
    };

    return (
        <div onContextMenu={handleContextMenu} className={className}>
            {children}
        </div>
    );
};

export const ThemedContextMenuContent = ({
    children,
    className,
    width = 200
}: {
    children: React.ReactNode;
    className?: string;
    width?: number;
}) => {
    const context = useContext(ContextMenuContext);
    if (!context || !context.isOpen) return null;

    // Adjust position to keep on screen
    let { x, y } = context.position;

    if (typeof window !== 'undefined') {
        const padding = 10
        if (x + width > window.innerWidth) {
            x = x - width
        }
        if (y + 300 > window.innerHeight) {
            // Heuristic: if close to bottom, move up. 
            // Currently we don't know height, but 300 is safe bet for small menu
            y = y - 200 // Shift up
        }

        // Hard Clamp
        x = Math.max(padding, Math.min(x, window.innerWidth - width - padding))
        y = Math.max(padding, Math.min(y, window.innerHeight - 50)) // At least show top
    }

    return createPortal(
        <div
            className={cn(
                "fixed z-[9999] min-w-[10rem] overflow-hidden rounded-md p-1 text-popover-foreground animate-in fade-in-80 zoom-in-95 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
                // 3D Beveled Container - Matching Modal Style
                "bg-gradient-to-b from-[hsl(0,0%,18%)] to-[hsl(0,0%,14%)]",
                "border border-[hsl(0,0%,8%)] border-t-[hsl(0,0%,28%)]",
                "shadow-[0_12px_24px_-4px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.05)]",
                className
            )}
            style={{
                top: y,
                left: x,
                width: width
            }}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => {
                e.preventDefault()
                e.stopPropagation()
            }}
        >
            <div className="flex flex-col gap-0.5">
                {children}
            </div>
        </div>,
        document.body
    );
};

export const ThemedContextMenuItem = ({
    children,
    className,
    onClick,
    disabled,
    inset
}: {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    disabled?: boolean;
    inset?: boolean;
}) => {
    const context = useContext(ContextMenuContext);

    const handleClick = () => {
        if (disabled) return;
        onClick?.();
        context?.closeMenu();
    }

    return (
        <button
            type="button"
            disabled={disabled}
            onClick={handleClick}
            className={cn(
                "relative flex cursor-default select-none items-center rounded px-2 py-1.5 text-[12px] outline-none transition-all duration-75",
                "text-foreground/70 hover:text-foreground",
                // Reset default hover
                "hover:bg-transparent",

                // 3D Hover State (Monochrome Pressed Look)
                "hover:bg-gradient-to-b hover:from-[hsl(0,0%,32%)] hover:to-[hsl(0,0%,25%)]",
                "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_1px_3px_rgba(0,0,0,0.4)]",
                "hover:border-t hover:border-white/10",

                "focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
                inset && "pl-8",
                className
            )}
        >
            {children}
        </button>
    );
};

export const ThemedContextMenuSeparator = ({ className }: { className?: string }) => (
    // Grooved Separator (Etched look)
    <div className={cn("-mx-1 my-1 border-t border-black/40 border-b border-white/5 h-0", className)} />
);

export const ThemedContextMenuLabel = ({
    children,
    className,
    inset
}: {
    children: React.ReactNode;
    className?: string;
    inset?: boolean;
}) => (
    <div className={cn(
        "px-2 py-2 text-[10px] font-bold uppercase tracking-widest text-foreground/40",
        inset && "pl-8",
        className
    )}>
        {children}
    </div>
);

// Shortcut info
export const ThemedContextMenuShortcut = ({
    children,
    className
}: {
    children: React.ReactNode;
    className?: string;
}) => (
    <span className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)}>
        {children}
    </span>
);
