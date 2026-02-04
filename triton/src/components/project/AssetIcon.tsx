import {
    FileCode,
    FileImage,
    Folder,
    Box,
    Cuboid,
    FileAudio,
    File,
    Map as MapIcon,
    Gamepad2,
    Settings,
    Package,
    ScrollText,
    Clapperboard,
    Cpu
} from "lucide-react"
import type { AssetType } from "@/context/FileSystemContext"
import { cn } from "@/lib/utils"

interface AssetIconProps {
    type: AssetType
    name?: string
    path?: string
    className?: string
    hasChildren?: boolean
}

const BadgedFolder = ({
    badge: Badge,
    badgeColor,
    className,
    hasChildren
}: {
    badge: React.ElementType,
    badgeColor: string,
    className?: string,
    hasChildren?: boolean
}) => (
    <div className={cn("relative w-full h-full flex items-center justify-center", className)}>
        <Folder
            className={cn(
                "text-foreground/90 w-full h-full",
                hasChildren ? "fill-foreground/10" : "fill-transparent"
            )}
            strokeWidth={hasChildren ? 2 : 1.5}
        />
        <Badge
            className={cn(
                "absolute -bottom-1 -right-1 w-[50%] h-[50%] bg-background rounded-full p-[2px] shadow-sm",
                badgeColor
            )}
            strokeWidth={2}
        />
    </div>
)

export const AssetIcon = ({ type, name, path, className, hasChildren }: AssetIconProps) => {
    // Check extensions and names first for specific overrides
    if (name) {
        const lowerName = name.toLowerCase();

        // --- Manager Overrides (Files or Folders) ---
        if (lowerName.includes('manager')) {
            if (type === 'folder') {
                return <BadgedFolder badge={Settings} badgeColor="text-slate-500" className={className} hasChildren={hasChildren} />
            }
            return <Settings className={cn("text-slate-400", className)} />
        }

        // --- File Extension Overrides ---
        if (lowerName.endsWith('.map')) {
            return <MapIcon className={cn("text-yellow-500", className)} />
        }
        if (lowerName.endsWith('.scn') || lowerName.endsWith('.scene')) {
            return <Gamepad2 className={cn("text-orange-500", className)} />
        }

        // Web files
        if (lowerName.endsWith('.js') || lowerName.endsWith('.ts') || lowerName.endsWith('.tsx') || lowerName.endsWith('.jsx')) {
            return <FileCode className={cn("text-yellow-400", className)} />
        }
        if (lowerName.endsWith('.html')) {
            return <FileCode className={cn("text-orange-600", className)} />
        }
        if (lowerName.endsWith('.css')) {
            return <FileCode className={cn("text-blue-500", className)} />
        }

        // --- Folder Name Overrides ---
        if (type === 'folder') {
            if (lowerName === 'assets') {
                return <BadgedFolder badge={Package} badgeColor="text-emerald-500" className={className} hasChildren={hasChildren} />
            }
            if (lowerName === 'scenes') {
                return <BadgedFolder badge={Clapperboard} badgeColor="text-orange-500" className={className} hasChildren={hasChildren} />
            }
            if (lowerName === 'scripts') {
                return <BadgedFolder badge={ScrollText} badgeColor="text-blue-400" className={className} hasChildren={hasChildren} />
            }
        }
    }

    if (type === 'image' && path) {
        // Thumbnail logic
        // Normalize path for Windows if it doesn't start with http
        // We use Vite's /@fs/ protocol to serve local files
        const src = path.startsWith('http')
            ? path
            : `/@fs/${path.replace(/\\/g, '/').replace(/^\/?/, '')}`;

        return (
            <div className={cn("relative overflow-hidden rounded", className)}>
                <img
                    src={src}
                    alt={name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                />
            </div>
        )
    }

    switch (type) {
        case 'folder':
            return (
                <Folder
                    className={cn(
                        "text-foreground/90", // White/Contrast color defaults
                        hasChildren ? "fill-foreground/10" : "fill-transparent",
                        className
                    )}
                    strokeWidth={hasChildren ? 2 : 1.5}
                />
            )
        case 'script':
            return <FileCode className={cn("text-blue-400", className)} /> // C# or other scripts
        case 'image':
            return <FileImage className={cn("text-purple-400", className)} />
        case 'scene':
            return <Cuboid className={cn("text-orange-500", className)} />
        case 'material':
            return <div className={cn("rounded-full bg-pink-500/50 border-2 border-pink-400", className)} />
        case 'prefab':
            return <Box className={cn("text-blue-300", className)} />
        case 'audio':
            return <FileAudio className={cn("text-red-400", className)} />
        case 'model':
            return <Box className={cn("text-cyan-400", className)} />
        case 'file':
        default:
            return <File className={cn("text-muted-foreground", className)} />
    }
}
