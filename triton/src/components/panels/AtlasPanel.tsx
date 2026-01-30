import { type IDockviewPanelProps } from "dockview"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

/**
 * ATLAS PANEL
 * A Component Library / Storybook-style panel that displays all UI components in their various states.
 * This is useful for debugging and verifying style changes across the entire design system.
 */
export const AtlasPanel = (_props: IDockviewPanelProps) => {
    return (
        <div className="h-full w-full bg-card overflow-auto p-4 space-y-6">
            <div className="border-b border-border pb-4">
                <h1 className="text-xl font-bold text-foreground">Component Atlas</h1>
                <p className="text-sm text-muted-foreground">A visual catalog of all UI components and their states.</p>
            </div>

            {/* BUTTONS SECTION */}
            <section className="space-y-3">
                <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Buttons</h2>
                <div className="flex flex-wrap gap-2">
                    <Button variant="default">Default</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="destructive">Destructive</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="link">Link</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button size="sm">Small</Button>
                    <Button size="default">Default Size</Button>
                    <Button size="lg">Large</Button>
                    <Button size="icon">🔥</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button disabled>Disabled</Button>
                    <Button variant="outline" disabled>Disabled Outline</Button>
                </div>
            </section>

            {/* INPUTS SECTION */}
            <section className="space-y-3">
                <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Inputs</h2>
                <div className="flex flex-wrap gap-2 max-w-md">
                    <Input placeholder="Default input" />
                    <Input placeholder="Disabled" disabled />
                    <Input type="password" placeholder="Password" />
                </div>
            </section>

            {/* CARDS SECTION */}
            <section className="space-y-3">
                <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Cards</h2>
                <div className="grid grid-cols-2 gap-4 max-w-xl">
                    <Card>
                        <CardHeader>
                            <CardTitle>Card Title</CardTitle>
                            <CardDescription>Card description goes here</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm">Card content body.</p>
                        </CardContent>
                    </Card>
                    <Card className="border-primary/50">
                        <CardHeader>
                            <CardTitle className="text-primary">Accent Card</CardTitle>
                            <CardDescription>With primary border</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button size="sm" className="w-full">Action</Button>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* TYPOGRAPHY */}
            <section className="space-y-3">
                <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Typography</h2>
                <div className="space-y-1">
                    <p className="text-foreground">Foreground Text</p>
                    <p className="text-muted-foreground">Muted Foreground Text</p>
                    <p className="text-primary">Primary Text</p>
                    <p className="text-destructive">Destructive Text</p>
                </div>
            </section>

            {/* COLORS */}
            <section className="space-y-3">
                <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Color Palette</h2>
                <div className="flex flex-wrap gap-2">
                    <div className="w-16 h-16 rounded bg-background border" title="background" />
                    <div className="w-16 h-16 rounded bg-card border" title="card" />
                    <div className="w-16 h-16 rounded bg-popover border" title="popover" />
                    <div className="w-16 h-16 rounded bg-primary" title="primary" />
                    <div className="w-16 h-16 rounded bg-secondary" title="secondary" />
                    <div className="w-16 h-16 rounded bg-muted" title="muted" />
                    <div className="w-16 h-16 rounded bg-accent" title="accent" />
                    <div className="w-16 h-16 rounded bg-destructive" title="destructive" />
                </div>
            </section>
        </div>
    )
}
