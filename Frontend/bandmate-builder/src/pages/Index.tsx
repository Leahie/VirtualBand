import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Music, Users, Sparkles, Play, Upload, Mic } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-music-studio.jpg";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Music className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              BandForge
            </span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-foreground/80 hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-foreground/80 hover:text-foreground transition-colors">
              How It Works
            </a>
            <Button variant="ghost">Sign In</Button>
            <Button variant="hero">Get Started</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="absolute inset-0 bg-gradient-hero opacity-10"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                  Turn Your
                  <span className="bg-gradient-primary bg-clip-text text-transparent"> Solo </span>
                  Into a
                  <span className="bg-gradient-secondary bg-clip-text text-transparent"> Symphony</span>
                </h1>
                <p className="text-xl text-foreground/80 leading-relaxed max-w-lg">
                  Transform your solo recordings into full band arrangements with AI-powered musicians. 
                  Create, collaborate, and perfect your music with virtual band members.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  variant="hero" 
                  size="lg" 
                  className="group"
                  onClick={() => navigate('/dashboard')}
                >
                  Start Creating
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button variant="outline" size="lg" className="group">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </div>

              <div className="flex items-center space-x-8 text-sm text-foreground/60">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <span>AI-Powered</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                  <span>Real-time Collaboration</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary-glow rounded-full animate-pulse"></div>
                  <span>Professional Quality</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative z-10">
                <img
                  src={heroImage}
                  alt="AI Music Studio"
                  className="rounded-2xl shadow-card w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-primary opacity-20 rounded-2xl"></div>
              </div>
              <div className="absolute -inset-4 bg-gradient-primary opacity-20 rounded-3xl blur-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-gradient-subtle">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              From Solo to
              <span className="bg-gradient-primary bg-clip-text text-transparent"> Symphony</span>
            </h2>
            <p className="text-xl text-foreground/80 max-w-3xl mx-auto">
              Our AI-powered pipeline transforms your musical ideas into professional arrangements
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="p-8 bg-card/50 backdrop-blur-sm border-primary/20 hover:shadow-glow transition-all duration-500 group">
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Upload className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Upload & Convert</h3>
              <p className="text-foreground/80">
                Upload your video or audio recording. Our AI converts it to MIDI and analyzes the musical structure.
              </p>
            </Card>

            <Card className="p-8 bg-card/50 backdrop-blur-sm border-accent/20 hover:shadow-primary transition-all duration-500 group">
              <div className="w-16 h-16 bg-gradient-secondary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Sparkles className="h-8 w-8 text-background" />
              </div>
              <h3 className="text-2xl font-bold mb-4">AI Band Creation</h3>
              <p className="text-foreground/80">
                Choose your virtual band members. AI generates complementary instruments and arrangements.
              </p>
            </Card>

            <Card className="p-8 bg-card/50 backdrop-blur-sm border-primary-glow/20 hover:shadow-glow transition-all duration-500 group">
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Collaborate & Perfect</h3>
              <p className="text-foreground/80">
                Give feedback to your AI band members. Iterate and perfect until your vision comes to life.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Powerful Features for
              <span className="bg-gradient-secondary bg-clip-text text-transparent"> Creators</span>
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center mt-1">
                    <Mic className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Voice-Guided Feedback</h3>
                    <p className="text-foreground/80">
                      Speak naturally to give feedback to your AI musicians, just like directing real band members.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-gradient-secondary rounded-lg flex items-center justify-center mt-1">
                    <Music className="h-4 w-4 text-background" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Multi-Instrument Support</h3>
                    <p className="text-foreground/80">
                      Guitar, piano, drums, vocals, and more. Create rich, layered compositions with any instrument combination.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center mt-1">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">AI-Powered Suggestions</h3>
                    <p className="text-foreground/80">
                      Get intelligent suggestions for harmonies, rhythms, and arrangements to enhance your music.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="w-full h-96 bg-gradient-subtle rounded-2xl border border-primary/20 shadow-card"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
                    <Play className="h-12 w-12 text-white ml-1" />
                  </div>
                  <p className="text-foreground/60">Interactive Demo Coming Soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-background/90"></div>
        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-4xl lg:text-6xl font-bold">
              Ready to Build Your
              <span className="bg-gradient-primary bg-clip-text text-transparent"> Dream Band</span>?
            </h2>
            <p className="text-xl text-foreground/80">
              Join thousands of musicians already creating amazing music with AI-powered collaboration
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="hero" 
                size="lg" 
                className="text-lg px-8 py-6"
                onClick={() => navigate('/dashboard')}
              >
                Start Creating for Free
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Music className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold">BandForge</span>
            </div>
            <div className="text-sm text-foreground/60">
              © 2024 BandForge. Turning solos into symphonies with AI.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
