import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  Music,
  Users,
  Calendar,
  MoreVertical,
  Upload, Loader2,
} from "lucide-react";
import { UploadModal } from "@/components/UploadModal";
import { getBands, deleteBand } from "@/lib/api";

// Define the Band type for better type safety
interface Band {
  id: string;
  name: string;
  members: number;
  genre: string;
  lastModified: string;
}

const Dashboard = () => {
  const [bands, setBands] = useState<Band[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBands = async () => {
      try {
        setIsLoading(true);
        const response = await getBands();
        console.log(response);
        setBands(response.data.bands || []);
      } catch (err) {
        setError('Failed to fetch bands');
        console.error('Error fetching bands:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBands();
  }, []);

  const handleDeleteBand = async (id: string) => {
    console.log(id)
    try {
      await deleteBand(id.$oid); // Calls your API
      setBands(bands.filter(band => band._id !== id)); // Remove from state
    } catch (err) {
      setError('Failed to delete band');
      console.error('Error deleting band:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading your bands...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-500">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }
  const [currentView, setCurrentView] = useState<"dashboard" | "band-builder">(
    "dashboard"
  );
  const [bandData, setBandData] = useState<{
    sessionId: string;
    userInstrument: string;
    userMidiPath: string;
    userWavUrl?: string;
  } | null>(null);

  const handleUploadComplete = (
    sessionId: string,
    userInstrument: string,
    userMidiPath: string,
    userWavUrl?: string
  ) => {
    setBandData({ sessionId, userInstrument, userMidiPath, userWavUrl });
    setCurrentView("band-builder");
  };

  const handleBackToDashboard = () => {
    setCurrentView("dashboard");
    setBandData(null);
  };

  const handleBandComplete = (finalMixPath: string) => {
    // Handle the completed band - could save to user's bands, show success, etc.
    console.log("Band completed! Final mix:", finalMixPath);
    setCurrentView("dashboard");
    setBandData(null);
  };

  if (currentView === "band-builder" && bandData) {
    return (
      <BandBuilder
        sessionId={bandData.sessionId}
        userInstrument={bandData.userInstrument}
        userMidiPath={bandData.userMidiPath}
        userWavUrl={bandData.userWavUrl}
        onComplete={handleBandComplete}
        onBack={handleBackToDashboard}
      />
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
              <Button variant="hero" onClick={() => setIsUploadModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Band
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold">
              Welcome back to your
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                {" "}
                Studio
              </span>
            </h1>
            <p className="text-xl text-foreground/80">
              Continue working on your bands or create something new
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-primary/10 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground/60">Total Bands</p>
                    <p className="text-3xl font-bold text-primary">{bands.length}</p>
                  </div>
                  <Music className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-secondary/10 border-accent/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <Users className="h-8 w-8 text-accent" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-primary/10 border-primary-glow/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground/60">This Week</p>
                    <p className="text-3xl font-bold text-primary-glow">2</p>
                  </div>
                  <Calendar className="h-8 w-8 text-primary-glow" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bands Grid */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Your Bands</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsUploadModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Create New Band Card */}
              <Card
                className="border-dashed border-2 border-primary/30 hover:border-primary/60 transition-all duration-300 cursor-pointer group bg-gradient-primary/5 hover:bg-gradient-primary/10"
                onClick={() => setIsUploadModalOpen(true)}
              >
                <CardContent className="p-8 text-center">
                  <div className="space-y-4 pt-10">
                    <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                      <Plus className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Create New Band</h3>
                      <p className="text-sm text-foreground/60">
                        Upload your recording to get started
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Existing Band Cards */}
              {bands.map((band) => (
                <>
                    <Card 
                  key={band.id}
                  className="hover:shadow-glow transition-all duration-300 cursor-pointer group bg-card/50 backdrop-blur-sm border-primary/20"
                >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg group-hover:text-primary transition-colors">
                            {band.name}
                          </CardTitle>
                        </div>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="w-full h-32 bg-gradient-subtle rounded-lg border border-primary/10 flex items-center justify-center">
                        <Music className="h-8 w-8 text-foreground/40" />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground/60">
                          Modified {band.lastModified}
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteBand(band._id)}>
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </>
                
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadComplete={handleUploadComplete}
      />
    </div>
  );
};

export default Dashboard;