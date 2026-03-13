export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border-default bg-bg-secondary/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
        <span className="text-xl font-bold tracking-tight text-text-primary">
          milli
        </span>
        <span className="text-xs text-text-secondary">
          Call Center Simulator
        </span>
      </div>
    </header>
  );
}
