import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { X } from "lucide-react"
import { ThemedMenuButton, ThemedIconButton } from "./ThemedButton"

interface ModalOptions {
    title: string
    content: ReactNode
    onConfirm?: () => void
    confirmText?: string
    cancelText?: string
    showCancel?: boolean
}

interface ModalContextType {
    showModal: (options: ModalOptions) => void
    hideModal: () => void
}

const ModalContext = createContext<ModalContextType | undefined>(undefined)

export function useModal() {
    const context = useContext(ModalContext)
    if (!context) {
        throw new Error("useModal must be used within a ModalProvider")
    }
    return context
}

export function ModalProvider({ children }: { children: ReactNode }) {
    const [modal, setModal] = useState<ModalOptions | null>(null)

    const showModal = useCallback((options: ModalOptions) => {
        setModal(options)
    }, [])

    const hideModal = useCallback(() => {
        setModal(null)
    }, [])

    return (
        <ModalContext.Provider value={{ showModal, hideModal }}>
            {children}
            {modal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
                    <div className="triton-raised min-w-[320px] max-w-[500px] overflow-hidden animate-in fade-in zoom-in duration-200 rounded-md shadow-2xl">
                        {/* Header */}
                        <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-card/50">
                            <h3 className="text-[11px] font-bold uppercase tracking-wider text-foreground/70">{modal.title}</h3>
                            <ThemedIconButton
                                size="sm"
                                onClick={hideModal}
                                className="bg-transparent border-transparent shadow-none hover:bg-accent/50"
                            >
                                <X className="w-3.5 h-3.5" />
                            </ThemedIconButton>
                        </div>

                        {/* Content */}
                        <div className="px-4 py-5 text-[13px] text-foreground/90 leading-relaxed">
                            {modal.content}
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-1.5 px-3 py-2 bg-background/40 border-t border-border">
                            {modal.showCancel !== false && (
                                <ThemedMenuButton
                                    variant="minimal"
                                    onClick={hideModal}
                                    className="px-3 py-1"
                                >
                                    {modal.cancelText || "Cancel"}
                                </ThemedMenuButton>
                            )}
                            <ThemedMenuButton
                                onClick={() => {
                                    modal.onConfirm?.()
                                    hideModal()
                                }}
                                className="px-3 py-1 font-bold"
                            >
                                {modal.confirmText || "Confirm"}
                            </ThemedMenuButton>
                        </div>
                    </div>
                </div>
            )}
        </ModalContext.Provider>
    )
}
