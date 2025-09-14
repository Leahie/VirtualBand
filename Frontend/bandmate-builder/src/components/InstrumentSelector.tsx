import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Music, Guitar, Piano, Drum, Mic, Music2, Music4 } from "lucide-react";

interface InstrumentSelectorProps {
  selectedInstruments: string[];
  onInstrumentSelect: (instruments: string[]) => void;
}

const instruments = [
  { id: "guitar", name: "Guitar", icon: Guitar, description: "Electric or acoustic", color: "bg-orange-500/10 text-orange-500" },
  { id: "piano", name: "Piano", icon: Piano, description: "Keys and chords", color: "bg-blue-500/10 text-blue-500" },
  { id: "drums", name: "Drums", icon: Drum, description: "Rhythm and beats", color: "bg-red-500/10 text-red-500" },
  { id: "vocals", name: "Vocals", icon: Mic, description: "Lead and harmony", color: "bg-purple-500/10 text-purple-500" },
  { id: "violin", name: "Violin", icon: Music2, description: "Strings and melody", color: "bg-green-500/10 text-green-500" },
  { id: "saxophone", name: "Saxophone", icon: Music4, description: "Jazz and soul", color: "bg-yellow-500/10 text-yellow-500" },
];

export function InstrumentSelector({ selectedInstruments, onInstrumentSelect }: InstrumentSelectorProps) {
  const [tempSelected, setTempSelected] = useState<string[]>(selectedInstruments);

  const toggleInstrument = (instrumentId: string) => {
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
            const isSelected = tempSelected.includes(instrument.id);
            
            return (
              <div
                key={instrument.id}
                className={`p-4 rounded-lg border cursor-pointer transition-all hover:scale-105 ${
                  isSelected 
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => toggleInstrument(instrument.id)}
              >
                <div className="text-center space-y-2">
                  <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${instrument.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{instrument.name}</h4>
                    <p className="text-xs text-muted-foreground">{instrument.description}</p>
                  </div>
                  {isSelected && (
                    <Badge variant="secondary" className="text-xs">
                      Selected
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {tempSelected.length > 0 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {tempSelected.length} instrument{tempSelected.length !== 1 ? 's' : ''} selected
            </div>
            <Button onClick={applySelection} className="hero-button">
              Apply Selection
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}