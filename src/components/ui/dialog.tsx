import * as React from "react"

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="surface-card rounded-xl shadow-xl max-w-2xl w-full p-0 relative">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-blue-500 text-2xl font-bold focus:outline-none"
          onClick={() => onOpenChange(false)}
          aria-label="Close"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  )
}

Dialog.Content = function DialogContent({ children }: { children: React.ReactNode }) {
  return <div className="p-8">{children}</div>
}

Dialog.Title = function DialogTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-2xl font-bold mb-6 text-blue-400 ${className || ''}`}>{children}</h2>
}

Dialog.Close = function DialogClose({ asChild, children }: { asChild?: boolean; children: React.ReactNode }) {
  return <>{children}</>
}
