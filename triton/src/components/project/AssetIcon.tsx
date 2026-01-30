import { FileCode, FileImage, Folder, Box, Cuboid, FileAudio, File } from "lucide-react"
import type { AssetType } from "@/lib/mockFileSystem"
import { cn } from "@/lib/utils"

interface AssetIconProps {
    type: AssetType
    className?: string
    hasChildren?: boolean
}

export const AssetIcon = ({ type, className, hasChildren }: AssetIconProps) => {
    switch (type) {
        case 'folder':
            return (
                <Folder
                    className={cn(
                        "text-muted-foreground",
                        hasChildren ? "fill-accent text-accent" : "fill-transparent", // Different fill for content
                        className
                    )}
                    strokeWidth={hasChildren ? 2 : 1.5}
                />
            )
        case 'script':
            return <FileCode className={cn("text-foreground/80", className)} />
        case 'image':
            return <FileImage className={cn("text-foreground/80", className)} />
        case 'scene':
            return <Cuboid className={cn("text-foreground/80", className)} />
        case 'material':
            return <div className={cn("rounded-full bg-foreground/20 border-2 border-foreground/40", className)} />
        case 'prefab':
            return <Box className={cn("text-foreground/80", className)} />
        case 'audio':
            return <FileAudio className={cn("text-foreground/80", className)} />
        case 'model':
            return <Box className={cn("text-foreground/80", className)} />
        default:
            return <File className={cn("text-muted-foreground", className)} />
    }
}
