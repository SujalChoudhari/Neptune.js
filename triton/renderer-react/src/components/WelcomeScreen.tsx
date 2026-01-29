import { Sparkles, FolderOpen, Gamepad2, Github, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store/useStore'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { useState } from 'react'

export function WelcomeScreen() {
    const setProject = useStore((state) => state.setProject)
    const [showNewProject, setShowNewProject] = useState(false)
    const [projectName, setProjectName] = useState('My Game')

    const handleOpenDemo = () => {
        setProject({
            projectPath: './demo',
            projectName: 'Platform Adventure Demo',
        })
    }

    const handleNewProject = () => {
        setProject({
            projectPath: './new-project',
            projectName: projectName,
        })
        setShowNewProject(false)
    }

    const handleOpenProject = () => {
        // In real app, this would trigger file dialog via IPC
        setProject({
            projectPath: './my-project',
            projectName: 'My Project',
        })
    }

    return (
        <div className="fixed inset-0 bg-[var(--bg-primary)] flex items-center justify-center">
            <div className="max-w-xl w-full px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <span className="text-5xl">🔱</span>
                        <h1 className="text-4xl font-light text-[var(--text-primary)]">Triton Editor</h1>
                    </div>
                    <p className="text-[var(--text-secondary)]">Visual Game Editor for Neptune.js</p>
                </div>

                {/* Actions */}
                <div className="space-y-3 mb-12">
                    <Dialog open={showNewProject} onOpenChange={setShowNewProject}>
                        <DialogTrigger asChild>
                            <Button
                                className="w-full h-16 justify-start gap-4 text-left"
                                variant="default"
                            >
                                <Sparkles className="h-6 w-6" />
                                <div className="flex flex-col">
                                    <span className="font-medium">New Project</span>
                                    <span className="text-xs opacity-80">Create a new game project</span>
                                </div>
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Project</DialogTitle>
                                <DialogDescription>
                                    Enter a name for your new game project.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                <label className="text-sm text-[var(--text-secondary)] mb-2 block">
                                    Project Name
                                </label>
                                <input
                                    type="text"
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                    className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                    placeholder="My Awesome Game"
                                />
                                <div className="mt-4">
                                    <label className="text-sm text-[var(--text-secondary)] mb-2 block">
                                        Template
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { id: 'blank', icon: '📄', name: 'Blank' },
                                            { id: 'platformer', icon: '🏃', name: 'Platformer' },
                                            { id: 'topdown', icon: '🎯', name: 'Top-Down' },
                                        ].map((template) => (
                                            <button
                                                key={template.id}
                                                className="flex flex-col items-center p-4 rounded-lg border-2 border-[var(--border-color)] hover:border-[var(--accent-primary)] bg-[var(--bg-tertiary)] transition-colors"
                                            >
                                                <span className="text-2xl mb-2">{template.icon}</span>
                                                <span className="text-xs text-[var(--text-primary)]">{template.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowNewProject(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleNewProject}>
                                    Create Project
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Button
                        className="w-full h-16 justify-start gap-4 text-left"
                        variant="outline"
                        onClick={handleOpenProject}
                    >
                        <FolderOpen className="h-6 w-6" />
                        <div className="flex flex-col">
                            <span className="font-medium">Open Project</span>
                            <span className="text-xs text-[var(--text-secondary)]">Open an existing project folder</span>
                        </div>
                    </Button>

                    <Button
                        className="w-full h-16 justify-start gap-4 text-left"
                        variant="outline"
                        onClick={handleOpenDemo}
                    >
                        <Gamepad2 className="h-6 w-6" />
                        <div className="flex flex-col">
                            <span className="font-medium">Open Demo Project</span>
                            <span className="text-xs text-[var(--text-secondary)]">Explore a sample platformer game</span>
                        </div>
                    </Button>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-center gap-6 text-sm text-[var(--text-secondary)]">
                    <a
                        href="#"
                        className="flex items-center gap-2 hover:text-[var(--accent-primary)] transition-colors"
                    >
                        <BookOpen className="h-4 w-4" />
                        Documentation
                    </a>
                    <a
                        href="#"
                        className="flex items-center gap-2 hover:text-[var(--accent-primary)] transition-colors"
                    >
                        <Github className="h-4 w-4" />
                        GitHub
                    </a>
                    <span className="opacity-50">v0.1.0</span>
                </div>
            </div>
        </div>
    )
}
