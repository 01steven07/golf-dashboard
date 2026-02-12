export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <span className="text-6xl mb-6" role="img" aria-label="golf">
        &#9971;
      </span>
      <h1 className="text-2xl font-bold mb-2">オフラインです</h1>
      <p className="text-muted-foreground">
        インターネット接続を確認して、もう一度お試しください。
      </p>
    </div>
  );
}
