export default function Loading() {
  return (
    <main className="page-shell">
      <div className="loading-line" />
      <div className="skeleton-grid">
        {Array.from({ length: 8 }, (_, index) => <div className="skeleton" key={index} />)}
      </div>
    </main>
  );
}
