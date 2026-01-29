import { useState } from 'react'
import { useStore } from '@/store/useStore'
import { FolderOpen, Image, Music, FileCode, FileJson, Grid, Plus, Search, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Mock assets for demo
const mockAssets = [
    { id: '1', name: 'player.png', type: 'image', path: 'assets/sprites/player.png' },
    { id: '2', name: 'enemy_slime.png', type: 'image', path: 'assets/sprites/enemy_slime.png' },
    { id: '3', name: 'coin.png', type: 'image', path: 'assets/sprites/coin.png' },
    { id: '4', name: 'tileset_ground.png', type: 'image', path: 'assets/tilesets/tileset_ground.png' },
    { id: '5', name: 'jump.wav', type: 'audio', path: 'assets/sounds/jump.wav' },
    { id: '6', name: 'coin_collect.wav', type: 'audio', path: 'assets/sounds/coin_collect.wav' },
    { id: '7', name: 'playerController.js', type: 'script', path: 'scripts/playerController.js' },
    { id: '8', name: 'enemyAI.js', type: 'script', path: 'scripts/enemyAI.js' },
    { id: '9', name: 'level1.json', type: 'data', path: 'data/level1.json' },
]

type AssetType = 'all' | 'image' | 'audio' | 'script' | 'data'

const ASSET_ICONS: Record<string, React.ReactNode> = {
    image: <Image className="h-4 w-4" />,
    audio: <Music className="h-4 w-4" />,
    script: <FileCode className="h-4 w-4" />,
    data: <FileJson className="h-4 w-4" />,
}

export function AssetsPanel() {
    const isProjectOpen = useStore((state) => state.project.isOpen)
    const selectedAssetId = useStore((state) => state.assets.selectedAssetId)
    const selectAsset = useStore((state) => state.selectAsset)

    const [filter, setFilter] = useState<AssetType>('all')
    const [search, setSearch] = useState('')
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

    if (!isProjectOpen) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-[var(--text-secondary)]">
                <FolderOpen className="h-12 w-12 mb-4 opacity-30" />
                <p className="text-sm mb-2">No project open</p>
                <Button variant="outline" size="sm">
                    Open Project
                </Button>
            </div>
        )
    }

    const filteredAssets = mockAssets.filter((asset) => {
        if (filter !== 'all' && asset.type !== filter) return false
        if (search && !asset.name.toLowerCase().includes(search.toLowerCase())) return false
        return true
    })

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="h-10 px-2 flex items-center gap-2 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]">
                {/* Search */}
                <div className="flex-1 relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
                    <input
                        type="text"
                        placeholder="Search assets..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-primary)]"
                    />
                </div>

                {/* Filter buttons */}
                <div className="flex items-center gap-1 border-l border-[var(--border-color)] pl-2">
                    {(['all', 'image', 'audio', 'script', 'data'] as AssetType[]).map((type) => (
                        <Button
                            key={type}
                            variant={filter === type ? 'secondary' : 'ghost'}
                            size="icon"
                            className={cn('h-7 w-7', filter === type && 'bg-[var(--accent-primary)] text-white')}
                            onClick={() => setFilter(type)}
                            title={type === 'all' ? 'All' : type}
                        >
                            {type === 'all' ? (
                                <Grid className="h-3 w-3" />
                            ) : (
                                ASSET_ICONS[type]
                            )}
                        </Button>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 border-l border-[var(--border-color)] pl-2">
                    <Button variant="ghost" size="icon" className="h-7 w-7" title="Import Asset">
                        <Upload className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" title="New Folder">
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Assets Grid */}
            <div className="flex-1 overflow-auto p-2">
                {filteredAssets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-[var(--text-secondary)]">
                        <p className="text-sm">No assets found</p>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-6 gap-2">
                        {filteredAssets.map((asset) => (
                            <AssetCard
                                key={asset.id}
                                asset={asset}
                                isSelected={selectedAssetId === asset.id}
                                onSelect={() => selectAsset(asset.id)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-1">
                        {filteredAssets.map((asset) => (
                            <AssetRow
                                key={asset.id}
                                asset={asset}
                                isSelected={selectedAssetId === asset.id}
                                onSelect={() => selectAsset(asset.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

interface AssetItemProps {
    asset: { id: string; name: string; type: string; path: string }
    isSelected: boolean
    onSelect: () => void
}

function AssetCard({ asset, isSelected, onSelect }: AssetItemProps) {
    return (
        <div
            className={cn(
                'flex flex-col items-center p-2 rounded-lg cursor-pointer transition-colors',
                isSelected
                    ? 'bg-[var(--accent-primary)] text-white'
                    : 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)]'
            )}
            onClick={onSelect}
            onDoubleClick={() => console.log('Open asset:', asset.path)}
        >
            {/* Thumbnail */}
            <div className={cn(
                'w-12 h-12 flex items-center justify-center rounded mb-1',
                isSelected ? 'bg-white/20' : 'bg-[var(--bg-secondary)]'
            )}>
                {asset.type === 'image' ? (
                    <Image className="h-6 w-6" />
                ) : (
                    ASSET_ICONS[asset.type]
                )}
            </div>
            {/* Name */}
            <span className="text-xs text-center truncate w-full">{asset.name}</span>
        </div>
    )
}

function AssetRow({ asset, isSelected, onSelect }: AssetItemProps) {
    return (
        <div
            className={cn(
                'flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors',
                isSelected
                    ? 'bg-[var(--accent-primary)] text-white'
                    : 'hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
            )}
            onClick={onSelect}
        >
            {ASSET_ICONS[asset.type]}
            <span className="text-sm flex-1 truncate">{asset.name}</span>
            <span className="text-xs text-[var(--text-secondary)]">{asset.type}</span>
        </div>
    )
}
