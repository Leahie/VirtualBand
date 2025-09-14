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
  userAudioUrl?: string;
  onComplete: (finalMixPath: string) => void;
  onBack: () => void;
}

const BandBuilder: React.FC<BandBuilderProps> = ({
  sessionId,
  userInstrument,
  userMidiPath,
  userAudioUrl,
  onComplete,
  onBack,
}) => {
  const [bandMembers, setBandMembers] = useState<BandMember[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isGeneratingBand, setIsGeneratingBand] = useState(false);
  const [isCombining, setIsCombining] = useState(false);
  const [audioRefs, setAudioRefs] = useState<{
    [key: string]: HTMLAudioElement | null;
  }>({});
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [userAudio, setUserAudio] = useState<HTMLAudioElement | null>(null);
  const [finalMixPath, setFinalMixPath] = useState<string | null>(null);
  const [finalMixAudio, setFinalMixAudio] = useState<HTMLAudioElement | null>(
    null
  );
  const { toast } = useToast();

  // Generate band members on component mount
  useEffect(() => {
    generateBandMembers();
  }, []);

  // Setup user audio if provided
  useEffect(() => {
    console.log("BandBuilder userAudioUrl:", userAudioUrl);
    if (userAudioUrl) {
      console.log("Setting up user audio with URL:", userAudioUrl);
      const audio = new Audio(userAudioUrl);
      audio.addEventListener("play", () => setPlayingAudio("user"));
      audio.addEventListener("pause", () => setPlayingAudio(null));
      audio.addEventListener("ended", () => setPlayingAudio(null));
      audio.addEventListener("error", (e) => {
        console.error("User audio error:", e);
        toast({
          title: "Audio Error",
          description: "Could not load your uploaded audio.",
          variant: "destructive",
        });
      });
      setUserAudio(audio);
    } else {
      console.log("No userAudioUrl provided to BandBuilder");
    }
  }, [userAudioUrl]);

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
      if (userAudio) {
        userAudio.pause();
        userAudio.currentTime = 0;
      }
    };
  }, [audioRefs, finalMixAudio, userAudio]);

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
        const members: BandMember[] = data.band_instruments.map(
          (instrument: string) => ({
            instrument,
            prompt: `Create complementary ${instrument} music that works well with ${userInstrument}`,
            isGenerating: false,
            isGenerated: false,
          })
        );
        setBandMembers(members);
        setCurrentStep(1);
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

  const playAudio = (instrument: string) => {
    if (instrument === "user" && userAudio) {
      // Stop any currently playing audio
      if (playingAudio && playingAudio !== "user") {
        const currentAudio = audioRefs[playingAudio];
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        }
      }

      if (userAudio.paused) {
        userAudio.play().catch((error) => {
          console.error("Error playing user audio:", error);
          toast({
            title: "Playback Error",
            description: "Could not play your uploaded audio. Please try again.",
            variant: "destructive",
          });
        });
      } else {
        userAudio.pause();
      }
      return;
    }

    const audio = audioRefs[instrument];
    if (audio) {
      // Stop any currently playing audio
      if (playingAudio && playingAudio !== instrument) {
        if (playingAudio === "user" && userAudio) {
          userAudio.pause();
          userAudio.currentTime = 0;
        } else {
          const currentAudio = audioRefs[playingAudio];
          if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
          }
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
    if (userAudio) {
      userAudio.pause();
      userAudio.currentTime = 0;
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
        .filter((member) => member.wavFile)
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
          user_audio_url: userAudioUrl,
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

      {/* Progress */}
      <div className="container mx-auto px-6 py-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Step {currentStep + 1} of 3</span>
            <span>
              {currentStep === 0
                ? "Generating Band"
                : currentStep === 1
                ? "Creating Music"
                : "Final Mix"}
            </span>
          </div>
          <Progress value={(currentStep + 1) * 33.33} className="h-2" />
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {currentStep === 0 && (
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold">
                Your{" "}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  AI Band
                </span>{" "}
                is Ready!
              </h1>
              <p className="text-xl text-foreground/80">
                We've selected 4 complementary musicians for your{" "}
                {userInstrument} music
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {bandMembers.map((member, index) => (
                <Card key={index} className="text-center">
                  <CardContent className="p-6">
                    <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                      <Music className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold capitalize">
                      {member.instrument}
                    </h3>
                    <p className="text-sm text-foreground/60">AI Musician</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button
              size="lg"
              onClick={() => setCurrentStep(1)}
              className="group"
            >
              Start Creating Music
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold">
                Direct Your{" "}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  AI Musicians
                </span>
              </h1>
              <p className="text-xl text-foreground/80">
                Give each band member specific instructions and hear their music
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* User's uploaded audio - Always show for debugging */}
              <Card className="space-y-4 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="capitalize">Your {userInstrument}</span>
                    <div className="flex items-center space-x-2">
                      {userAudioUrl ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <div className="text-sm text-red-500">No audio URL</div>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Your uploaded audio</Label>
                    <div className="p-3 bg-muted rounded-md text-sm">
                      {userAudioUrl ? (
                        <>This is your original {userInstrument} recording that will be included in the final mix.</>
                      ) : (
                        <div className="text-red-500">
                          Audio URL not provided: {JSON.stringify(userAudioUrl)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => playAudio("user")}
                      className="flex-1"
                      disabled={!userAudioUrl}
                    >
                      {playingAudio === "user" ? (
                        <>
                          <Pause className="h-4 w-4 mr-2" />
                          Pause Your Audio
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          {userAudioUrl ? "Play Your Audio" : "No Audio Available"}
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="text-sm text-green-600 flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {userAudioUrl ? "Ready for mixing" : "Audio not loaded"}
                    </div>
                    {playingAudio === "user" && (
                      <div className="flex items-center text-primary">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse mr-2"></div>
                        Playing...
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* User's uploaded audio - Original conditional version */}
              {userAudioUrl && false && (
                <Card className="space-y-4 border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="capitalize">Your {userInstrument}</span>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Your uploaded audio</Label>
                      <div className="p-3 bg-muted rounded-md text-sm">
                        This is your original {userInstrument} recording that will be included in the final mix.
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => playAudio("user")}
                        className="flex-1"
                      >
                        {playingAudio === "user" ? (
                          <>
                            <Pause className="h-4 w-4 mr-2" />
                            Pause Your Audio
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Play Your Audio
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="text-sm text-green-600 flex items-center justify-between">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Ready for mixing
                      </div>
                      {playingAudio === "user" && (
                        <div className="flex items-center text-primary">
                          <div className="w-2 h-2 bg-primary rounded-full animate-pulse mr-2"></div>
                          Playing...
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {bandMembers.map((member, index) => (
                <Card key={index} className="space-y-4">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="capitalize">{member.instrument}</span>
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
                      <Button
                        onClick={() => generateMemberMusic(index)}
                        disabled={member.isGenerating}
                        className="flex-1"
                      >
                        {member.isGenerating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Music className="h-4 w-4 mr-2" />
                            Generate Music
                          </>
                        )}
                      </Button>

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

              <Button
                size="lg"
                onClick={() => setCurrentStep(2)}
                disabled={!allMembersGenerated}
                className="group"
              >
                {allMembersGenerated ? (
                  <>
                    Create Final Mix
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                ) : (
                  <>
                    Generate All Music First
                    <AlertCircle className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold">
                Your{" "}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  Masterpiece
                </span>{" "}
                is Ready!
              </h1>
              <p className="text-xl text-foreground/80">
                All your AI band members have created their parts. Ready to hear
                the final mix?
              </p>
            </div>

            <Card className="max-w-md mx-auto">
              <CardContent className="p-8">
                <div className="space-y-4">
                  <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
                    <Music className="h-12 w-12 text-white" />
                  </div>

                  <h3 className="text-xl font-semibold">Final Mix</h3>
                  <p className="text-foreground/60">
                    Your {userInstrument} + {bandMembers.length} AI musicians
                  </p>

                  {!finalMixPath ? (
                    <Button
                      size="lg"
                      onClick={combineAllMusic}
                      disabled={isCombining}
                      className="w-full group"
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
                    <div className="space-y-3">
                      <Button
                        size="lg"
                        onClick={playFinalMix}
                        className="w-full group"
                      >
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
                        className="w-full group"
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
        )}
      </main>
    </div>
  );
};

export default BandBuilder;
