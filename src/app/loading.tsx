export default function Loading() {
  return (
    <div className="sf-boot relative flex min-h-[calc(100dvh-var(--header-h))] flex-1 flex-col overflow-hidden" role="status" aria-live="polite">
      <div className="sf-boot-wash pointer-events-none absolute inset-0" aria-hidden />
      <div className="sf-boot-grid pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative z-10 mx-auto flex w-full max-w-[var(--page-max-wide)] flex-1 flex-col justify-center px-6 py-16 md:px-10 lg:px-14">
        <p className="sf-boot-brand font-[family-name:var(--font-display)] text-5xl font-bold tracking-[-0.04em] md:text-7xl">
          RACKET FORM
        </p>
        <p className="mt-4 max-w-md text-base text-[var(--muted)] md:text-lg">
          Loading form rails and gear intelligence…
        </p>

        <div className="sf-boot-rail mt-10" aria-hidden>
          {["Ready", "Unit", "Accel", "Contact", "Finish"].map((phase, i) => (
            <div key={phase} className="sf-boot-phase" style={{ animationDelay: `${i * 0.12}s` }}>
              <span className="sf-boot-phase-dot" />
              <span>{phase}</span>
            </div>
          ))}
        </div>

        <div className="sf-boot-meter mt-8" aria-hidden>
          <div className="sf-boot-meter-fill" />
        </div>
      </div>
    </div>
  );
}
