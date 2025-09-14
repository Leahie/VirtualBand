import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  Music,
  Play,
  Pause,
  Volume2,
  Users,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BandMember {
  instrument: string;
  prompt: string;
  wavFile?: string;
  isGenerating: boolean;
  isGenerated: boolean;
}

interface BandBuilderProps {
  sessionId: string;
  userInstrument: string;
  userMidiPath: string;
  userWavUrl?: string;
  onComplete: (finalMixPath: string) => void;
  onBack: () => void;
}

const BandBuilder: React.FC<BandBuilderProps> = ({
  sessionId,
  userInstrument,
  userMidiPath,
  userWavUrl,
  onComplete,
  onBack,
}) => {
  const [bandMembers, setBandMembers] = useState<BandMember[]>([]);
  const [isGeneratingBand, setIsGeneratingBand] = useState(false);
  const [isCombining, setIsCombining] = useState(false);
  const [audioRefs, setAudioRefs] = useState<{
    [key: string]: HTMLAudioElement | null;
  }>({});
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [finalMixPath, setFinalMixPath] = useState<string | null>(null);
  const [finalMixAudio, setFinalMixAudio] = useState<HTMLAudioElement | null>(
    null
  );
  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Generate band members on component mount
  useEffect(() => {
    generateBandMembers();
  }, []);

  // Cleanup audio on component unmount
  useEffect(() => {
    return () => {
      Object.values(audioRefs).forEach((audio) => {
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      });
      if (finalMixAudio) {
        finalMixAudio.pause();
        finalMixAudio.currentTime = 0;
      }
    };
  }, [audioRefs, finalMixAudio]);

  const generateBandMembers = async () => {
    setIsGeneratingBand(true);
    try {
      const response = await fetch("/api/generate-band", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instrument: userInstrument,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const aiMembers: BandMember[] = data.band_instruments.map(
          (instrument: string) => ({
            instrument,
            prompt: `Create complementary ${instrument} music that works well with ${userInstrument}`,
            isGenerating: false,
            isGenerated: false,
          })
        );

        // Add user as the first member if they have a WAV file
        const allMembers: BandMember[] = [];
        if (userWavUrl) {
          allMembers.push({
            instrument: `Your ${userInstrument}`,
            prompt: `Your original ${userInstrument} recording`,
            wavFile: userWavUrl,
            isGenerating: false,
            isGenerated: true, // Already "generated" since it's the user's recording
          });

          // Create audio element for user's recording
          const userAudio = new Audio(userWavUrl);
          userAudio.addEventListener("play", () => {
            console.log("User audio started playing");
            setPlayingAudio(`Your ${userInstrument}`);
          });
          userAudio.addEventListener("pause", () => {
            console.log("User audio paused");
            setPlayingAudio(null);
          });
          userAudio.addEventListener("ended", () => {
            console.log("User audio ended");
            setPlayingAudio(null);
          });
          userAudio.addEventListener("error", (e) => {
            console.error("User audio error:", e);
          });

          setAudioRefs((prev) => ({
            ...prev,
            [`Your ${userInstrument}`]: userAudio,
          }));
        }

        // Add AI members
        allMembers.push(...aiMembers);

        setBandMembers(allMembers);

        // Initialize selected tracks - select all by default
        const allTrackNames = allMembers.map((member) => member.instrument);
        setSelectedTracks(new Set(allTrackNames));
      } else {
        throw new Error(data.error || "Failed to generate band members");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate band members. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingBand(false);
    }
  };

  const generateMemberMusic = async (index: number) => {
    const member = bandMembers[index];
    if (!member) return;

    // Update member state to show generating
    setBandMembers((prev) =>
      prev.map((m, i) => (i === index ? { ...m, isGenerating: true } : m))
    );

    try {
      const response = await fetch("/api/generate-ai-music", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          ai_instrument: member.instrument,
          prompt: member.prompt,
          user_midi_path: userMidiPath,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setBandMembers((prev) =>
          prev.map((m, i) =>
            i === index
              ? {
                  ...m,
                  wavFile: data.output_wav,
                  isGenerating: false,
                  isGenerated: true,
                }
              : m
          )
        );

        // Create audio element for playback - now using direct public URL
        const audioUrl = data.output_wav;
        console.log("Creating audio element for:", audioUrl);

        const audio = new Audio(audioUrl);

        // Add event listeners for audio state management
        audio.addEventListener("play", () => {
          console.log("Audio started playing:", member.instrument);
          setPlayingAudio(member.instrument);
        });

        audio.addEventListener("pause", () => {
          console.log("Audio paused:", member.instrument);
          setPlayingAudio(null);
        });

        audio.addEventListener("ended", () => {
          console.log("Audio ended:", member.instrument);
          setPlayingAudio(null);
        });

        audio.addEventListener("error", (e) => {
          console.error("Audio error for", member.instrument, ":", e);
          toast({
            title: "Audio Error",
            description: `Could not load audio for ${member.instrument}. Please try regenerating.`,
            variant: "destructive",
          });
        });

        audio.addEventListener("loadstart", () => {
          console.log("Audio loading started:", member.instrument);
        });

        audio.addEventListener("canplay", () => {
          console.log("Audio can play:", member.instrument);
        });

        setAudioRefs((prev) => ({ ...prev, [member.instrument]: audio }));

        toast({
          title: "Success",
          description: `${member.instrument} music generated successfully!`,
        });
      } else {
        throw new Error(data.error || "Failed to generate music");
      }
    } catch (error) {
      setBandMembers((prev) =>
        prev.map((m, i) => (i === index ? { ...m, isGenerating: false } : m))
      );
      toast({
        title: "Error",
        description: `Failed to generate ${member.instrument} music. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const updateMemberPrompt = (index: number, prompt: string) => {
    setBandMembers((prev) =>
      prev.map((m, i) => (i === index ? { ...m, prompt } : m))
    );
  };

  const toggleTrackSelection = (instrument: string) => {
    setSelectedTracks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(instrument)) {
        newSet.delete(instrument);
      } else {
        newSet.add(instrument);
      }
      return newSet;
    });
  };

  const regenerateMemberMusic = async (index: number) => {
    const member = bandMembers[index];
    if (!member) return;

    // Reset the member's generated state
    setBandMembers((prev) =>
      prev.map((m, i) =>
        i === index
          ? { ...m, isGenerated: false, wavFile: undefined, isGenerating: true }
          : m
      )
    );

    // Remove existing audio reference
    if (audioRefs[member.instrument]) {
      audioRefs[member.instrument]?.pause();
      setAudioRefs((prev) => {
        const newRefs = { ...prev };
        delete newRefs[member.instrument];
        return newRefs;
      });
    }

    // Generate new music
    await generateMemberMusic(index);
  };

  const playAudio = (instrument: string) => {
    const audio = audioRefs[instrument];
    if (audio) {
      // Stop any currently playing audio
      if (playingAudio && playingAudio !== instrument) {
        const currentAudio = audioRefs[playingAudio];
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        }
      }

      if (audio.paused) {
        audio.play().catch((error) => {
          console.error("Error playing audio:", error);
          toast({
            title: "Playback Error",
            description: "Could not play the audio file. Please try again.",
            variant: "destructive",
          });
        });
      } else {
        audio.pause();
      }
    }
  };

  const stopAllAudio = () => {
    Object.values(audioRefs).forEach((audio) => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    if (finalMixAudio) {
      finalMixAudio.pause();
      finalMixAudio.currentTime = 0;
    }
    setPlayingAudio(null);
  };

  const playFinalMix = () => {
    if (finalMixAudio) {
      if (playingAudio === "final-mix") {
        finalMixAudio.pause();
      } else {
        // Stop any other playing audio
        stopAllAudio();
        finalMixAudio.play().catch((error) => {
          console.error("Error playing final mix:", error);
          toast({
            title: "Playback Error",
            description: "Could not play final mix. Please try again.",
            variant: "destructive",
          });
        });
      }
    }
  };

  const testAudioConnection = async () => {
    try {
      console.log("Testing audio connection...");
      const response = await fetch("/api/health");
      const data = await response.json();
      console.log("Health check:", data);

      // Try to load a test audio file
      const testAudio = new Audio("/audio/test_audio.wav");
      testAudio.addEventListener("loadstart", () =>
        console.log("Test audio loading...")
      );
      testAudio.addEventListener("canplay", () =>
        console.log("Test audio can play!")
      );
      testAudio.addEventListener("error", (e) =>
        console.error("Test audio error:", e)
      );

      toast({
        title: "Audio Test",
        description: "Check console for audio connection details",
      });
    } catch (error) {
      console.error("Audio test failed:", error);
      toast({
        title: "Audio Test Failed",
        description: "Could not connect to audio server",
        variant: "destructive",
      });
    }
  };

  const combineAllMusic = async () => {
    setIsCombining(true);
    try {
      const wavFiles = bandMembers
        .filter(
          (member) => member.wavFile && selectedTracks.has(member.instrument)
        )
        .map((member) => member.wavFile!);

      console.log("Files to combine:", wavFiles);

      if (wavFiles.length === 0) {
        throw new Error("No music generated yet");
      }

      const response = await fetch("/api/combine-music", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          wav_files: wavFiles,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setFinalMixPath(data.final_mix_path);

        // Create audio element for final mix
        const finalMixAudioElement = new Audio(data.final_mix_path);
        finalMixAudioElement.addEventListener("play", () => {
          console.log("Final mix started playing");
          setPlayingAudio("final-mix");
        });
        finalMixAudioElement.addEventListener("pause", () => {
          console.log("Final mix paused");
          setPlayingAudio(null);
        });
        finalMixAudioElement.addEventListener("ended", () => {
          console.log("Final mix ended");
          setPlayingAudio(null);
        });
        finalMixAudioElement.addEventListener("error", (e) => {
          console.error("Final mix audio error:", e);
          toast({
            title: "Audio Error",
            description: "Could not load final mix audio. Please try again.",
            variant: "destructive",
          });
        });

        setFinalMixAudio(finalMixAudioElement);

        toast({
          title: "Success",
          description: "Final mix created successfully! You can now play it.",
        });
      } else {
        throw new Error(data.error || "Failed to combine music");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to combine music. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCombining(false);
    }
  };

  const allMembersGenerated = bandMembers.every((member) => member.isGenerated);
  const selectedTracksCount = selectedTracks.size;
  const hasSelectedTracks = selectedTracksCount > 0;

  if (isGeneratingBand) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold mb-2">Generating Your Band</h2>
            <p className="text-foreground/60">
              AI is selecting the perfect musicians for your music...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Music className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                BandForge
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">
              Your{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                AI Band
              </span>
            </h1>
            <p className="text-xl text-foreground/80">
              Direct your musicians, hear their music, and create your final mix
            </p>
          </div>

          {/* Band Members */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {bandMembers.map((member, index) => (
              <Card key={index} className="space-y-4">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedTracks.has(member.instrument)}
                        onChange={() => toggleTrackSelection(member.instrument)}
                        className="w-4 h-4 text-primary"
                      />
                      <span className="capitalize">{member.instrument}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {member.isGenerating && (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      )}
                      {member.isGenerated && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`prompt-${index}`}>
                      Instructions for {member.instrument}
                    </Label>
                    <Textarea
                      id={`prompt-${index}`}
                      value={member.prompt}
                      onChange={(e) =>
                        updateMemberPrompt(index, e.target.value)
                      }
                      placeholder="Describe what you want this musician to play..."
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    {member.instrument.startsWith("Your ") ? (
                      // User's recording - no generate button needed
                      <div className="flex-1 text-center py-2 px-4 bg-green-50 border border-green-200 rounded-md">
                        <span className="text-green-700 font-medium">
                          Your Original Recording
                        </span>
                      </div>
                    ) : (
                      // AI member - show generate/regenerate button
                      <Button
                        onClick={() =>
                          member.isGenerated
                            ? regenerateMemberMusic(index)
                            : generateMemberMusic(index)
                        }
                        disabled={member.isGenerating}
                        className="flex-1"
                      >
                        {member.isGenerating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {member.isGenerated
                              ? "Regenerating..."
                              : "Generating..."}
                          </>
                        ) : (
                          <>
                            <Music className="h-4 w-4 mr-2" />
                            {member.isGenerated
                              ? "Regenerate"
                              : "Generate Music"}
                          </>
                        )}
                      </Button>
                    )}

                    {member.wavFile && (
                      <Button
                        variant="outline"
                        onClick={() => playAudio(member.instrument)}
                        size="icon"
                      >
                        {playingAudio === member.instrument ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>

                  {member.wavFile && (
                    <div className="text-sm text-green-600 flex items-center justify-between">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Music generated successfully
                      </div>
                      {playingAudio === member.instrument && (
                        <div className="flex items-center text-primary">
                          <div className="w-2 h-2 bg-primary rounded-full animate-pulse mr-2"></div>
                          Playing...
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Final Mix Section */}
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-center">Final Mix</CardTitle>
              <p className="text-center text-foreground/60">
                {userWavUrl
                  ? `Your ${userInstrument} + ${
                      bandMembers.length - 1
                    } AI musicians`
                  : `${bandMembers.length} AI musicians`}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Track Selection Summary */}
              <div className="text-center">
                <p className="text-sm text-foreground/60 mb-2">
                  Selected tracks for final mix: {selectedTracksCount} of{" "}
                  {bandMembers.length}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {Array.from(selectedTracks).map((track) => (
                    <span
                      key={track}
                      className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                    >
                      {track}
                    </span>
                  ))}
                </div>
              </div>

              {/* Final Mix Controls */}
              <div className="flex justify-center space-x-4">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={testAudioConnection}
                  className="group"
                >
                  <Volume2 className="h-5 w-5 mr-2" />
                  Test Audio
                </Button>

                {playingAudio && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={stopAllAudio}
                    className="group"
                  >
                    <Pause className="h-5 w-5 mr-2" />
                    Stop All Audio
                  </Button>
                )}

                {!finalMixPath ? (
                  <Button
                    size="lg"
                    onClick={combineAllMusic}
                    disabled={isCombining || !hasSelectedTracks}
                    className="group"
                  >
                    {isCombining ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Creating Final Mix...
                      </>
                    ) : (
                      <>
                        <Volume2 className="h-5 w-5 mr-2" />
                        Create Final Mix
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="flex space-x-3">
                    <Button size="lg" onClick={playFinalMix} className="group">
                      {playingAudio === "final-mix" ? (
                        <>
                          <Pause className="h-5 w-5 mr-2" />
                          Pause Final Mix
                        </>
                      ) : (
                        <>
                          <Play className="h-5 w-5 mr-2" />
                          Play Final Mix
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => onComplete(finalMixPath)}
                      className="group"
                    >
                      <ArrowRight className="h-5 w-5 mr-2" />
                      Finish & Save Band
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default BandBuilder;
