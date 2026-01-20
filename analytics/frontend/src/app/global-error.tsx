'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl text-white mb-4">Something went wrong!</h2>
            <button
              onClick={() => reset()}
              className="px-4 py-2 bg-[#2962ff] text-white rounded hover:bg-[#2962ff]/80"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
