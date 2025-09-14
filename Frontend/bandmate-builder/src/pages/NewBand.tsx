import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Settings, Play, Pause, Square } from "lucide-react";
import { MidiEditor } from "@/components/MidiSelector";
import { AiChatbox } from "@/components/AiChatbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { InstrumentSelector } from "@/components/instrumentSelector";

export default function NewBand() {
  const [progress, setProgress] = useState(25);
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showMidiEditor, setShowMidiEditor] = useState(false);

  const handleInstrumentSelect = (instruments: string[]) => {
    setSelectedInstruments(instruments);
    setProgress(50);
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Progress */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Create New Band
            </h1>
            <div className="flex items-center gap-3">
              <Dialog open={showMidiEditor} onOpenChange={setShowMidiEditor}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    MIDI Editor
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>Advanced MIDI Editor</DialogTitle>
                  </DialogHeader>
                  <MidiEditor />
                </DialogContent>
              </Dialog>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={togglePlayback}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button variant="outline" size="sm">
                  <Square className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Band Creation Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Instrument Selection */}
          <div className="lg:col-span-2 space-y-6">
            <InstrumentSelector
              selectedInstruments={selectedInstruments}
              onInstrumentSelect={handleInstrumentSelect}
            />
            
            {/* Waveform/Timeline Area */}
            <div className="bg-card rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">Audio Timeline</h3>
              <div className="h-32 bg-muted/20 rounded-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                <p className="text-muted-foreground">Audio waveform will appear here</p>
              </div>
            </div>
          </div>

          {/* Right Panel - xChatbox */}
          <div className="lg:col-span-1">
            <AiChatbox 
              selectedInstruments={selectedInstruments}
              onSuggestionApplied={() => setProgress(prev => Math.min(prev + 10, 100))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}