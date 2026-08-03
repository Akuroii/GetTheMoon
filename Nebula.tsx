export function Nebula() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-20 overflow-hidden">
      <div
        className="absolute left-[-10%] top-[10%] h-[60vh] w-[60vh] rounded-full blur-[120px]"
        style={{
          background: "radial-gradient(circle, rgba(107,79,255,0.12), transparent 70%)",
          animation: "nebula-drift 90s ease-in-out infinite alternate",
        }}
      />
      <div
        className="absolute bottom-[5%] right-[-15%] h-[50vh] w-[50vh] rounded-full blur-[120px]"
        style={{
          background: "radial-gradient(circle, rgba(255,94,168,0.08), transparent 70%)",
          animation: "nebula-drift 120s ease-in-out infinite alternate-reverse",
        }}
      />
    </div>
  );
}
