
export default function Home({ setCurrentView }) {
  return (
    <div className="w-full flex flex-col items-center justify-center text-center py-20 px-4">
      <div className="max-w-3xl space-y-6">
        <span className="bg-sky-100 text-sky-800 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
          Self-Photography Studio
        </span>
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight">
          Capture Your Moments, <span className="text-sky-500">Your Way.</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-xl mx-auto">
          Step into our minimalist self-photography studio. Professional lighting, premium backdrops, and complete creative control at your fingertips.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <button 
            onClick={() => setCurrentView("packages")}
            className="bg-slate-900 hover:bg-sky-600 text-white px-8 py-3 rounded-lg font-semibold transition shadow-md"
          >
            Explore Packages
          </button>
          <button 
            onClick={() => setCurrentView("poses")}
            className="border border-slate-300 hover:border-sky-500 text-slate-700 hover:text-sky-600 px-8 py-3 rounded-lg font-semibold transition"
          >
            View Pose Ideas
          </button>
        </div>
      </div>
    </div>
  );
}