import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Music, Guitar, Piano, Drum, Mic, Music2, Music4 } from "lucide-react";

interface InstrumentSelectorProps {
  selectedInstruments: string[];
  focusedInstrument?: string | null;
  onInstrumentSelect: (instruments: string[]) => void;
  onInstrumentFocus?: (instrumentId: string) => void;
}

const instruments = [
  { id: "guitar", name: "Guitar", icon: Guitar, description: "Electric or acoustic", color: "bg-orange-500/10 text-orange-500" },
  { id: "piano", name: "Piano", icon: Piano, description: "Keys and chords", color: "bg-blue-500/10 text-blue-500" },
  { id: "drums", name: "Drums", icon: Drum, description: "Rhythm and beats", color: "bg-red-500/10 text-red-500" },
  { id: "vocals", name: "Vocals", icon: Mic, description: "Lead and harmony", color: "bg-purple-500/10 text-purple-500" },
  { id: "violin", name: "Violin", icon: Music2, description: "Strings and melody", color: "bg-green-500/10 text-green-500" },
  { id: "saxophone", name: "Saxophone", icon: Music4, description: "Jazz and soul", color: "bg-yellow-500/10 text-yellow-500" },
];

export function InstrumentSelector({ 
  selectedInstruments, 
  focusedInstrument, 
  onInstrumentSelect, 
  onInstrumentFocus 
}: InstrumentSelectorProps) {
  const [tempSelected, setTempSelected] = useState<string[]>(selectedInstruments);

  const toggleInstrument = (instrumentId: string) => {
    // If instruments are already selected, focus on clicked instrument
    if (selectedInstruments.length > 0 && selectedInstruments.includes(instrumentId)) {
      onInstrumentFocus?.(instrumentId);
      return;
    }
    
    // Otherwise, toggle selection
    setTempSelected(prev => 
      prev.includes(instrumentId)
        ? prev.filter(id => id !== instrumentId)
        : [...prev, instrumentId]
    );
  };

  const applySelection = () => {
    onInstrumentSelect(tempSelected);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="w-5 h-5 text-primary" />
          Choose Instruments
        </CardTitle>
        <CardDescription>
          Select the instruments you want to include in your band
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {instruments.map((instrument) => {
            const Icon = instrument.icon;
            const isSelected = selectedInstruments.includes(instrument.id);
            const isTempSelected = tempSelected.includes(instrument.id);
            const isFocused = focusedInstrument === instrument.id;
            const isDisabled = selectedInstruments.length > 0 && !isSelected;
            
            return (
              <div
                key={instrument.id}
                className={`p-4 rounded-lg border cursor-pointer transition-all hover:scale-105 ${
                  isFocused
                    ? 'border-primary bg-primary/20 ring-2 ring-primary/40 shadow-lg shadow-primary/20'
                    : isSelected
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : isDisabled
                    ? 'border-border/50 bg-muted/30 opacity-50 cursor-not-allowed'
                    : isTempSelected && selectedInstruments.length === 0
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => !isDisabled && toggleInstrument(instrument.id)}
              >
                <div className="text-center space-y-2">
                  <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${
                    isFocused ? 'bg-primary/30' : instrument.color
                  }`}>
                    <Icon className={`w-6 h-6 ${isFocused ? 'text-primary' : ''}`} />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{instrument.name}</h4>
                    <p className="text-xs text-muted-foreground">{instrument.description}</p>
                  </div>
                  {isFocused && (
                    <Badge className="text-xs bg-primary">
                      Focused
                    </Badge>
                  )}
                  {isSelected && !isFocused && (
                    <Badge variant="secondary" className="text-xs">
                      Selected
                    </Badge>
                  )}
                  {isTempSelected && selectedInstruments.length === 0 && (
                    <Badge variant="outline" className="text-xs">
                      To Select
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {selectedInstruments.length === 0 && tempSelected.length > 0 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {tempSelected.length} instrument{tempSelected.length !== 1 ? 's' : ''} selected
            </div>
            <Button onClick={applySelection} className="hero-button">
              Apply Selection
            </Button>
          </div>
        )}

        {selectedInstruments.length > 0 && (
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">
              Click on any selected instrument to focus and edit its track
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedInstruments.map(id => {
                const instrument = instruments.find(i => i.id === id);
                return instrument ? (
                  <Badge 
                    key={id} 
                    variant={focusedInstrument === id ? "default" : "secondary"}
                    className="cursor-pointer"
                    onClick={() => onInstrumentFocus?.(id)}
                  >
                    {instrument.name}
                  </Badge>
                ) : null;
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}