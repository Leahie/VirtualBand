import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Pause, Square, Volume2, Scissors, Copy, Undo, Redo } from "lucide-react";

export function MidiEditor() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState([120]);
  const [volume, setVolume] = useState([70]);
  const [selectedTrack, setSelectedTrack] = useState("piano");

  const tracks = [
    { id: "piano", name: "Piano", color: "bg-blue-500", notes: 24 },
    { id: "guitar", name: "Guitar", color: "bg-orange-500", notes: 18 },
    { id: "drums", name: "Drums", color: "bg-red-500", notes: 32 },
    { id: "bass", name: "Bass", color: "bg-green-500", notes: 16 },
  ];

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={togglePlayback}>
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button variant="outline" size="sm">
              <Square className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="h-6 w-px bg-border" />
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Undo className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Redo className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Copy className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Scissors className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Tempo:</span>
            <div className="w-20">
              <Slider
                value={tempo}
                onValueChange={setTempo}
                max={200}
                min={60}
                step={1}
                className="w-full"
              />
            </div>
            <span className="text-sm font-mono w-10">{tempo[0]}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-muted-foreground" />
            <div className="w-16">
              <Slider
                value={volume}
                onValueChange={setVolume}
                max={100}
                min={0}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Track Panel */}
        <div className="w-48 border-r bg-muted/10">
          <div className="p-3 border-b">
            <h3 className="font-semibold text-sm">Tracks</h3>
          </div>
          <div className="space-y-1 p-2">
            {tracks.map((track) => (
              <div
                key={track.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedTrack === track.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedTrack(track.id)}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${track.color}`} />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{track.name}</div>
                    <div className="text-xs text-muted-foreground">{track.notes} notes</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Piano Roll */}
        <div className="flex-1 flex flex-col">
          <div className="h-10 border-b bg-muted/10 flex items-center px-4">
            <div className="text-sm text-muted-foreground">Piano Roll - {tracks.find(t => t.id === selectedTrack)?.name}</div>
          </div>
          
          <div className="flex-1 relative overflow-auto">
            {/* Grid Background */}
            <div className="absolute inset-0 bg-grid-pattern opacity-20" />
            
            {/* Piano Keys */}
            <div className="absolute left-0 top-0 w-16 h-full bg-muted/30 border-r">
              {Array.from({ length: 88 }, (_, i) => {
                const noteNumber = 88 - i;
                const isBlackKey = [1, 3, 6, 8, 10].includes(noteNumber % 12);
                
                return (
                  <div
                    key={i}
                    className={`h-4 border-b border-border/20 flex items-center justify-end px-1 text-xs ${
                      isBlackKey ? 'bg-muted text-muted-foreground' : 'bg-background'
                    }`}
                  >
                    {!isBlackKey && <span>{['C', 'D', 'E', 'F', 'G', 'A', 'B'][noteNumber % 7]}</span>}
                  </div>
                );
              })}
            </div>
            
            {/* Note Grid */}
            <div className="ml-16 p-4">
              <div className="grid grid-cols-32 gap-px">
                {Array.from({ length: 88 * 32 }, (_, i) => {
                  const hasNote = Math.random() > 0.95; // Simulate some notes
                  return (
                    <div
                      key={i}
                      className={`h-4 border border-border/10 ${
                        hasNote ? 'bg-primary/60' : 'hover:bg-muted/20 cursor-pointer'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Properties Panel */}
      <div className="h-32 border-t bg-muted/10 p-4">
        <Tabs defaultValue="note" className="h-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="note">Note</TabsTrigger>
            <TabsTrigger value="velocity">Velocity</TabsTrigger>
            <TabsTrigger value="timing">Timing</TabsTrigger>
          </TabsList>
          <TabsContent value="note" className="mt-2">
            <div className="text-sm text-muted-foreground">Note properties will appear here</div>
          </TabsContent>
          <TabsContent value="velocity" className="mt-2">
            <div className="text-sm text-muted-foreground">Velocity controls will appear here</div>
          </TabsContent>
          <TabsContent value="timing" className="mt-2">
            <div className="text-sm text-muted-foreground">Timing adjustments will appear here</div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}