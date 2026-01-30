import { type IDockviewPanelProps } from "dockview"
import {
    ThemedMenuButton,
    ThemedIconButton,
    ThemedInput,
    ThemedNumberInput,
    ThemedLabeledInput,
    ThemedVectorInput,
    ThemedTextArea,
    ThemedSlider,
    ThemedCheckbox,
    ThemedToggle,
    ThemedSelect,
    ThemedCollapsible,
    ThemedScrollArea,
    ThemedColorPicker
} from "@/components/library"
import { Play, Pause, Square, Settings, Save, Trash2, Plus, Minus, Search, Home } from "lucide-react"
import { useState } from "react"

/**
 * ATLAS PANEL
 * A Component Library panel that displays Triton's themed UI components.
 * Useful for testing and implementing components in other tools.
 */
export const AtlasPanel = (_props: IDockviewPanelProps) => {
    // Demo state for interactive components
    const [sliderValue, setSliderValue] = useState(50)
    const [checkboxValue, setCheckboxValue] = useState(true)
    const [toggleValue, setToggleValue] = useState(false)
    const [selectValue, setSelectValue] = useState("option1")
    const [numberValue, setNumberValue] = useState(10)
    const [vectorValue, setVectorValue] = useState({ x: 0, y: 1.5, z: -2 })
    const [colorValue, setColorValue] = useState("#6b8cff")
    const [textAreaValue, setTextAreaValue] = useState("Multi-line text\neditor example")

    return (
        <ThemedScrollArea maxHeight="100%" className="h-full w-full bg-card p-4">
            <div className="space-y-6">
                <div className="border-b border-border pb-4">
                    <h1 className="text-xl font-bold text-foreground">Component Atlas</h1>
                    <p className="text-sm text-muted-foreground">Triton's themed component library</p>
                </div>

                {/* THEMED BUTTONS */}
                <ThemedCollapsible title="Buttons" defaultOpen>
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs text-muted-foreground mb-2">Menu Buttons</p>
                            <div className="flex flex-wrap gap-2">
                                <ThemedMenuButton>Normal</ThemedMenuButton>
                                <ThemedMenuButton hasDropdown>Dropdown</ThemedMenuButton>
                                <ThemedMenuButton disabled>Disabled</ThemedMenuButton>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-2">Icon Buttons (sm / md / lg)</p>
                            <div className="flex flex-wrap items-center gap-2">
                                <ThemedIconButton size="sm"><Play className="w-2.5 h-2.5 fill-current" /></ThemedIconButton>
                                <ThemedIconButton size="md"><Pause className="w-3 h-3 fill-current" /></ThemedIconButton>
                                <ThemedIconButton size="lg"><Square className="w-3.5 h-3.5 fill-current" /></ThemedIconButton>
                                <div className="w-px h-4 bg-border mx-1" />
                                <ThemedIconButton><Home className="w-3 h-3" /></ThemedIconButton>
                                <ThemedIconButton><Plus className="w-3 h-3" /></ThemedIconButton>
                                <ThemedIconButton><Minus className="w-3 h-3" /></ThemedIconButton>
                                <ThemedIconButton><Search className="w-3 h-3" /></ThemedIconButton>
                                <ThemedIconButton><Save className="w-3 h-3" /></ThemedIconButton>
                                <ThemedIconButton><Settings className="w-3 h-3" /></ThemedIconButton>
                                <ThemedIconButton><Trash2 className="w-3 h-3" /></ThemedIconButton>
                            </div>
                        </div>
                    </div>
                </ThemedCollapsible>

                {/* TEXT INPUTS */}
                <ThemedCollapsible title="Text Inputs" defaultOpen>
                    <div className="space-y-3 max-w-sm">
                        <div>
                            <p className="text-xs text-muted-foreground mb-2">Basic Input</p>
                            <ThemedInput placeholder="Enter text..." />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-2">Labeled Inputs</p>
                            <div className="space-y-2">
                                <ThemedLabeledInput label="Name" placeholder="GameObject" />
                                <ThemedLabeledInput label="Tag" placeholder="Untagged" />
                                <ThemedLabeledInput label="Layer" placeholder="Default" disabled />
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-2">Text Area</p>
                            <ThemedTextArea
                                value={textAreaValue}
                                onChange={(e) => setTextAreaValue(e.target.value)}
                                placeholder="Enter multi-line text..."
                            />
                        </div>
                    </div>
                </ThemedCollapsible>

                {/* NUMBER INPUTS */}
                <ThemedCollapsible title="Number & Vector Inputs" defaultOpen>
                    <div className="space-y-4">
                        <div className="max-w-xs">
                            <p className="text-xs text-muted-foreground mb-2">Number with Spinners</p>
                            <ThemedNumberInput
                                value={numberValue}
                                onChange={setNumberValue}
                                min={0}
                                max={100}
                            />
                        </div>

                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">Vector Inputs (drag labels to adjust, click 🔗 to link)</p>

                            <div className="space-y-2">
                                <p className="text-[10px] text-muted-foreground/70">1D Vector (X only)</p>
                                <ThemedVectorInput
                                    dimensions={1}
                                    label="Scale"
                                    value={vectorValue}
                                    onChange={setVectorValue}
                                    step={0.1}
                                />
                            </div>

                            <div className="space-y-2">
                                <p className="text-[10px] text-muted-foreground/70">2D Vector (X, Y)</p>
                                <ThemedVectorInput
                                    dimensions={2}
                                    label="Position"
                                    value={vectorValue}
                                    onChange={setVectorValue}
                                    step={0.1}
                                />
                            </div>

                            <div className="space-y-2">
                                <p className="text-[10px] text-muted-foreground/70">3D Vector (X, Y, Z)</p>
                                <ThemedVectorInput
                                    dimensions={3}
                                    label="Rotation"
                                    value={vectorValue}
                                    onChange={setVectorValue}
                                    step={0.1}
                                />
                            </div>
                        </div>
                    </div>
                </ThemedCollapsible>

                {/* CONTROLS */}
                <ThemedCollapsible title="Controls" defaultOpen>
                    <div className="space-y-3 max-w-sm">
                        <div>
                            <p className="text-xs text-muted-foreground mb-2">Slider: {sliderValue}</p>
                            <ThemedSlider
                                value={sliderValue}
                                onChange={setSliderValue}
                                min={0}
                                max={100}
                            />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-2">Checkbox</p>
                            <div className="flex gap-4">
                                <ThemedCheckbox
                                    checked={checkboxValue}
                                    onChange={setCheckboxValue}
                                    label="Is Active"
                                />
                                <ThemedCheckbox
                                    checked={false}
                                    label="Is Static"
                                    disabled
                                />
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-2">Toggle</p>
                            <div className="flex gap-4">
                                <ThemedToggle
                                    checked={toggleValue}
                                    onChange={setToggleValue}
                                    label="Enable Physics"
                                />
                                <ThemedToggle
                                    checked={true}
                                    label="Visible"
                                    disabled
                                />
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-2">Select</p>
                            <ThemedSelect
                                value={selectValue}
                                onChange={setSelectValue}
                                options={[
                                    { value: "option1", label: "Default Layer" },
                                    { value: "option2", label: "UI Layer" },
                                    { value: "option3", label: "Player Layer" },
                                    { value: "option4", label: "Enemy Layer" },
                                ]}
                            />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-2">Color Picker</p>
                            <ThemedColorPicker
                                value={colorValue}
                                onChange={setColorValue}
                            />
                        </div>
                    </div>
                </ThemedCollapsible>

                {/* SCROLL AREA DEMO */}
                <ThemedCollapsible title="Scroll Area" defaultOpen={false}>
                    <ThemedScrollArea maxHeight="120px" className="border border-border rounded-md p-2">
                        <div className="space-y-1">
                            {Array.from({ length: 15 }, (_, i) => (
                                <div key={i} className="text-xs text-muted-foreground py-1 border-b border-border/50">
                                    Scrollable item {i + 1}
                                </div>
                            ))}
                        </div>
                    </ThemedScrollArea>
                </ThemedCollapsible>

                {/* COLOR PALETTE */}
                <ThemedCollapsible title="Theme Colors" defaultOpen={false}>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { name: "bg", class: "bg-background" },
                            { name: "card", class: "bg-card" },
                            { name: "muted", class: "bg-muted" },
                            { name: "accent", class: "bg-accent" },
                            { name: "border", class: "bg-border" },
                        ].map(({ name, class: cls }) => (
                            <div key={name} className="flex flex-col items-center gap-1">
                                <div className={`w-10 h-10 rounded border ${cls}`} />
                                <span className="text-[10px] text-muted-foreground">{name}</span>
                            </div>
                        ))}
                    </div>
                </ThemedCollapsible>
            </div>
        </ThemedScrollArea>
    )
}
