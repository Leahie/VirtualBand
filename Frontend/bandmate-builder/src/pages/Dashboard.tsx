import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Music, Users, Calendar, MoreVertical, Upload } from "lucide-react";
import { UploadModal } from "@/components/UploadModal";

// Mock data for existing bands
const mockBands = [
  {
    id: 1,
    name: "Midnight Symphony",
    members: 4,
    lastModified: "2 days ago",
    genre: "Rock",
    image: "/api/placeholder/300/200"
  },
  {
    id: 2,
    name: "Electric Dreams",
    members: 3,
    lastModified: "1 week ago", 
    genre: "Electronic",
    image: "/api/placeholder/300/200"
  },
  {
    id: 3,
    name: "Jazz Collective",
    members: 5,
    lastModified: "3 days ago",
    genre: "Jazz", 
    image: "/api/placeholder/300/200"
  }
];

const Dashboard = () => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

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
              <Button variant="outline">Profile</Button>
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
              <span className="bg-gradient-primary bg-clip-text text-transparent"> Studio</span>
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
                    <p className="text-3xl font-bold text-primary">{mockBands.length}</p>
                  </div>
                  <Music className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-secondary/10 border-accent/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground/60">AI Musicians</p>
                    <p className="text-3xl font-bold text-accent">
                      {mockBands.reduce((total, band) => total + band.members, 0)}
                    </p>
                  </div>
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
                  <div className="space-y-4">
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
              {mockBands.map((band) => (
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
                        <div className="flex items-center space-x-2 text-sm text-foreground/60">
                          <Users className="h-3 w-3" />
                          <span>{band.members} members</span>
                          <span>•</span>
                          <span>{band.genre}</span>
                        </div>
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
                      <Button variant="ghost" size="sm">
                        Open
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Upload Modal */}
      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
      />
    </div>
  );
};

export default Dashboard;
