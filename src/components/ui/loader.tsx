export function Loader({ text = "Cargando..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-2 border-[#3d2020]" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#e84118] animate-spin" />
      </div>
      {text && <p className="text-sm text-white/40 animate-pulse">{text}</p>}
    </div>
  )
}

export function FullPageLoader() {
  return (
    <div className="min-h-screen bg-[#120505] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-[#3d2020]" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#e84118] animate-spin" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[#e84118] font-bold text-sm">Frailin</span>
          <span className="text-white/60 font-medium text-sm">Studio</span>
        </div>
      </div>
    </div>
  )
}
