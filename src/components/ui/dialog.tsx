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
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-black border border-white/10 rounded-xl shadow-2xl max-w-2xl w-full p-0 relative">
        <button
          className="absolute top-4 right-4 text-gray-300 hover:text-blue-400 text-2xl font-bold focus:outline-none"
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
  return <div className="p-8 text-white">{children}</div>
}

Dialog.Title = function DialogTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-2xl font-bold mb-6 text-blue-300">{children}</h2>
}

Dialog.Close = function DialogClose({ asChild, children }: { asChild?: boolean; children: React.ReactNode }) {
  return <>{children}</>
} 