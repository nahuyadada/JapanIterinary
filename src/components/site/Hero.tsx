// Chūreitō Pagoda with Mt. Fuji and cherry blossoms at sunset. Served from public/,
// so the hero no longer depends on a third-party CDN staying up.
const HERO_IMAGE = "/76402941-japan-wallpaper.jpg";

export default function Hero() {
  return (
    <section
      id="home"
      className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden"
    >
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url("${HERO_IMAGE}")` }}
        aria-hidden
      />
      <div className="absolute inset-0 z-0 bg-black/30" aria-hidden />
      <div className="relative z-10 text-center text-white px-4 max-w-3xl">
        <h1 className="text-5xl md:text-7xl font-medium mb-6 drop-shadow-lg">Discover Japan</h1>
        <p className="text-lg md:text-2xl mb-10 text-white/90 drop-shadow">
          Experience the perfect blend of ancient traditions and modern wonders
        </p>
        <a
          href="#plan"
          className="inline-block bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full text-lg font-medium shadow-lg transition-colors"
        >
          Start Your Journey
        </a>
      </div>
    </section>
  );
}
