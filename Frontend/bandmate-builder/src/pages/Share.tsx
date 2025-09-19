import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Download,
  Share2,
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  Music,
  Play,
  Pause,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useBandContext } from "@/contexts/BandContext";

const Share: React.FC = () => {
  const {
    finalMixPath,
    finalMixAudio,
    playingAudio,
    bandMembers,
    onPlayFinalMix,
    onStopAllAudio,
    sessionId,
    userMidiPath,
  } = useBandContext();
  const [isGeneratingCover, setIsGeneratingCover] = useState<boolean>(false);
  const [albumCoverUrl, setAlbumCoverUrl] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [promptUsed, setPromptUsed] = useState<string>("");
  const [bandName, setBandName] = useState<string>("");
  const { toast } = useToast();

  // Auto-generate album cover and band name when component loads
  useEffect(() => {
    if (finalMixPath && !albumCoverUrl && !isGeneratingCover) {
      generateAlbumCover();
    }
    // Generate a default band name if none exists
    if (!bandName && bandMembers.length > 0) {
      const instruments = bandMembers
        .filter((member) => member.isSelected)
        .map((member) => member.instrument.replace("Your ", ""))
        .slice(0, 2);
      const randomNames = ["The Sonic", "Electric", "Digital", "Cosmic", "Neon", "Echo"];
      const randomSuffix = ["Collective", "Band", "Orchestra", "Ensemble", "Group"];
      const randomName = randomNames[Math.floor(Math.random() * randomNames.length)];
      const randomEnd = randomSuffix[Math.floor(Math.random() * randomSuffix.length)];
      setBandName(`${randomName} ${randomEnd}`);
    }
  }, [finalMixPath, bandMembers]);

  const generateAlbumCover = async () => {
    setIsGeneratingCover(true);
    try {
      const response = await fetch("/api/generate-album-cover", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          user_midi_path: userMidiPath,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAlbumCoverUrl(data.image_url);
        setPromptUsed(data.prompt_used || "MIDI-based generation");
        toast({
          title: "Success",
          description: "Album cover generated from your music!",
        });
      } else {
        // Check if it's an API key error
        if (data.error && data.error.includes("FAL_KEY")) {
          toast({
            title: "API Key Required",
            description:
              "Please set up your fal.ai API key to generate album covers. Contact the administrator.",
            variant: "destructive",
          });
        } else {
          throw new Error(data.error || "Failed to generate album cover");
        }
      }
    } catch (error) {
      console.error("Error generating album cover:", error);
      toast({
        title: "Error",
        description: "Failed to generate album cover. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingCover(false);
    }
  };

  const downloadFinalMix = async () => {
    if (!finalMixPath) {
      toast({
        title: "Error",
        description: "No final mix available to download",
        variant: "destructive",
      });
      return;
    }

    setIsDownloading(true);
    try {
      // Create a temporary link to download the file
      const link = document.createElement("a");
      link.href = finalMixPath;
      link.download = `my-band-mix-${
        new Date().toISOString().split("T")[0]
      }.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Success",
        description: "Final mix downloaded successfully!",
      });
    } catch (error) {
      console.error("Error downloading final mix:", error);
      toast({
        title: "Error",
        description: "Failed to download final mix. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const shareToSocial = () => {
    const shareText = `Checkout my band - ${bandName}. We just created a hit song!`;
    
    if (navigator.share && finalMixPath) {
      navigator.share({
        title: shareText,
        text: shareText,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(
        `${shareText} Listen here: ${window.location.href}`
      );
      toast({
        title: "Copied!",
        description: "Share message copied to clipboard",
      });
    }
  };

  const downloadBandPackage = async () => {
    if (!finalMixPath || !albumCoverUrl) {
      toast({
        title: "Error",
        description: "Both music and album cover must be ready to download the band package",
        variant: "destructive",
      });
      return;
    }

    setIsDownloading(true);
    try {
      // Download music file
      const musicLink = document.createElement("a");
      musicLink.href = finalMixPath;
      musicLink.download = `${bandName.replace(/\s+/g, '_')}_final_mix.wav`;
      document.body.appendChild(musicLink);
      musicLink.click();
      document.body.removeChild(musicLink);

      // Download album cover
      const coverLink = document.createElement("a");
      coverLink.href = albumCoverUrl;
      coverLink.download = `${bandName.replace(/\s+/g, '_')}_album_cover.png`;
      document.body.appendChild(coverLink);
      coverLink.click();
      document.body.removeChild(coverLink);

      toast({
        title: "Success",
        description: "Band package downloaded successfully!",
      });
    } catch (error) {
      console.error("Error downloading band package:", error);
      toast({
        title: "Error",
        description: "Failed to download band package. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if (!finalMixPath) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">
              No Final Mix Available
            </h2>
            <p className="text-muted-foreground">
              Please create a final mix first before sharing.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            Share Your{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Masterpiece
            </span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Download your final mix and create an AI-generated album cover
          </p>
        </div>

        {/* Band Name Input */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Your Band Name</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <Input
                  value={bandName}
                  onChange={(e) => setBandName(e.target.value)}
                  placeholder="Enter your band name..."
                  className="flex-1"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Social Share Preview */}
        {albumCoverUrl && bandName && (
          <div className="mb-8">
            <Card className="bg-gradient-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-center">Share Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 p-6 bg-white rounded-lg border">
                  <div className="w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={albumCoverUrl}
                      alt="Album cover"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-xl font-bold mb-2 text-black">
                      Checkout my band - {bandName}. We just created a hit song!
                    </h3>
                    <p className="text-muted-foreground">
                      🎵 Created with AI band members • BandForge
                    </p>
                  </div>
                </div>
                <div className="flex justify-center space-x-4 mt-4">
                  <Button onClick={shareToSocial} className="flex-1 max-w-xs">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share This
                  </Button>
                  <Button
                    onClick={downloadBandPackage}
                    disabled={isDownloading}
                    variant="outline"
                    className="flex-1 max-w-xs"
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download Package
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Music Player */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Music className="h-5 w-5 mr-2" />
                Your Final Mix
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Play Controls */}
              <div className="flex items-center space-x-4">
                <Button size="lg" onClick={onPlayFinalMix} className="flex-1">
                  {playingAudio === "final-mix" ? (
                    <>
                      <Pause className="h-5 w-5 mr-2" />
                      Pause Mix
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 mr-2" />
                      Play Mix
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={onStopAllAudio}
                  disabled={!playingAudio}
                >
                  Stop All
                </Button>
              </div>

              {/* Download Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Download className="h-4 w-4" />
                  <span className="font-medium">Download Options</span>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={downloadFinalMix}
                    disabled={isDownloading}
                    className="flex-1"
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download WAV
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={shareToSocial}
                    className="flex-1"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>

              {/* Band Info */}
              <div className="space-y-2">
                <h4 className="font-medium">Your Band Members:</h4>
                <div className="flex flex-wrap gap-2">
                  {bandMembers
                    .filter((member) => member.isSelected)
                    .map((member, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-primary/10 text-primary rounded-md text-sm"
                      >
                        {member.instrument}
                      </span>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Album Cover Generator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ImageIcon className="h-5 w-5 mr-2" />
                AI Album Cover
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cover Preview */}
              {albumCoverUrl ? (
                <div className="space-y-4">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={albumCoverUrl}
                      alt="Generated album cover"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">
                      Cover generated from your music's vibe!
                    </span>
                  </div>
                </div>
              ) : isGeneratingCover ? (
                <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <Loader2 className="h-12 w-12 mx-auto mb-2 animate-spin text-primary" />
                    <p>Analyzing your music...</p>
                    <p className="text-sm mt-2">Creating album cover from MIDI data</p>
                  </div>
                </div>
              ) : (
                <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                    <p>Album cover will auto-generate</p>
                  </div>
                </div>
              )}

              {/* Generation Info */}
              {promptUsed && (
                <div className="space-y-2">
                  <Label>Generated From Your Music</Label>
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-md">
                    <p className="text-sm text-muted-foreground">
                      This cover was automatically created by analyzing your MIDI composition and extracting its musical vibe.
                    </p>
                  </div>
                </div>
              )}

              {/* Regenerate Button */}
              {albumCoverUrl && (
                <Button
                  onClick={generateAlbumCover}
                  disabled={isGeneratingCover}
                  variant="outline"
                  className="w-full"
                >
                  {isGeneratingCover ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Regenerate Cover
                    </>
                  )}
                </Button>
              )}

              {/* Download Cover */}
              {albumCoverUrl && (
                <Button
                  variant="outline"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = albumCoverUrl;
                    link.download = `album-cover-${
                      new Date().toISOString().split("T")[0]
                    }.png`;
                    link.click();
                  }}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Cover
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Success Message */}
        <div className="mt-8 text-center">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-6">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                Congratulations!
              </h3>
              <p className="text-green-700">
                You've successfully created your AI-generated band and final
                mix. Share it with the world!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Share;
