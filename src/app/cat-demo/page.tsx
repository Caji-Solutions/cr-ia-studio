import OrangeCat from '@/components/ui/orange-cat';

export default function CatDemoPage() {
  return (
    <div className="hero-container">
      <div className="aurora-background">
        <div className="aurora-blob" />
        <div className="aurora-blob" />
        <div className="aurora-blob" />
      </div>

      <div className="character-container flex-col gap-6">
        <OrangeCat />
        <p className="text-white/60 text-sm text-center select-none">
          Mova o mouse para o gatinho seguir 🐱
        </p>
      </div>
    </div>
  );
}
