import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { CloudRain, Coffee, Wind, Waves, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";

interface Sound {
  id: string;
  label: string;
  icon: typeof CloudRain;
  frequency: number;
  type: OscillatorType;
}

const SOUNDS: Sound[] = [
  { id: "rain", label: "Rain", icon: CloudRain, frequency: 200, type: "sawtooth" },
  { id: "cafe", label: "Café", icon: Coffee, frequency: 300, type: "triangle" },
  { id: "wind", label: "Wind", icon: Wind, frequency: 150, type: "sine" },
  { id: "waves", label: "Waves", icon: Waves, frequency: 100, type: "sine" },
];

// Simple noise generator using Web Audio API
class NoiseGenerator {
  private ctx: AudioContext | null = null;
  private nodes: { source: AudioBufferSourceNode; gain: GainNode } | null = null;

  start(frequency: number, type: string, volume: number) {
    this.stop();
    this.ctx = new AudioContext();
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Generate brownian noise for natural sound
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gain = this.ctx.createGain();
    gain.gain.value = volume;

    // Filter for different sound characters
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = frequency;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    source.start();

    this.nodes = { source, gain };
  }

  setVolume(v: number) {
    if (this.nodes) this.nodes.gain.gain.value = v;
  }

  stop() {
    try {
      this.nodes?.source.stop();
      this.ctx?.close();
    } catch {}
    this.nodes = null;
    this.ctx = null;
  }
}

const AmbientSounds = () => {
  const [activeSound, setActiveSound] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.3);
  const generatorRef = useRef(new NoiseGenerator());

  useEffect(() => {
    return () => generatorRef.current.stop();
  }, []);

  const toggleSound = (sound: Sound) => {
    if (activeSound === sound.id) {
      generatorRef.current.stop();
      setActiveSound(null);
    } else {
      generatorRef.current.start(sound.frequency, sound.type, volume);
      setActiveSound(sound.id);
    }
  };

  const handleVolumeChange = (v: number[]) => {
    setVolume(v[0]);
    generatorRef.current.setVolume(v[0]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
        <Volume2 size={12} />
        <span className="font-medium">Ambient Sounds</span>
      </div>
      <div className="flex gap-2">
        {SOUNDS.map((sound) => (
          <motion.button
            key={sound.id}
            whileTap={{ scale: 0.9 }}
            onClick={() => toggleSound(sound)}
            className={cn(
              "flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl transition-all border",
              activeSound === sound.id
                ? "bg-primary/10 border-primary/30 text-primary"
                : "border-border bg-card hover:bg-muted text-muted-foreground"
            )}
          >
            <sound.icon size={16} />
            <span className="text-[10px] font-medium">{sound.label}</span>
          </motion.button>
        ))}
      </div>
      {activeSound && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="flex items-center gap-3"
        >
          <Volume2 size={12} className="text-muted-foreground flex-shrink-0" />
          <Slider
            value={[volume]}
            onValueChange={handleVolumeChange}
            min={0}
            max={1}
            step={0.05}
            className="flex-1"
          />
        </motion.div>
      )}
    </div>
  );
};

export default AmbientSounds;
