import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Lightbulb, Music, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AiChatboxProps {
  selectedInstruments: string[];
  onSuggestionApplied: () => void;
}

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  suggestions?: string[];
  timestamp: Date;
}

export function AiChatbox({ selectedInstruments, onSuggestionApplied }: AiChatboxProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hello! I'm your AI music producer. I can help you create amazing compositions with your selected instruments. What kind of vibe are you going for?",
      suggestions: ["Jazz fusion", "Rock ballad", "Electronic pop", "Classical crossover"],
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateAIResponse = (userMessage: string): Message => {
    const responses = [
      {
        content: `Great choice! For a ${userMessage.toLowerCase()} style, I suggest adding some chord progressions in the ${selectedInstruments[0] || 'piano'}. Try a vi-IV-I-V progression to start.`,
        suggestions: ["Add chord progression", "Adjust tempo to 110 BPM", "Layer harmonies", "Add rhythm variation"]
      },
      {
        content: `I can hear the potential! Let's enhance the ${selectedInstruments.join(' and ')} arrangement. Consider adding some syncopated rhythms to create more interest.`,
        suggestions: ["Apply syncopation", "Add bass line", "Create melody variation", "Adjust dynamics"]
      },
      {
        content: `Perfect! Based on your selection, I recommend starting with a strong foundation. The ${selectedInstruments[0]} should carry the main melody while the other instruments provide harmony and rhythm.`,
        suggestions: ["Generate melody", "Create harmony parts", "Add rhythmic elements", "Balance mix levels"]
      }
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    return {
      id: Date.now().toString(),
      type: 'ai',
      content: randomResponse.content,
      suggestions: randomResponse.suggestions,
      timestamp: new Date()
    };
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI processing
    setTimeout(() => {
      const aiResponse = generateAIResponse(input);
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1000);
  };

  const handleApplySuggestion = (suggestion: string) => {
    toast({
      title: "Suggestion Applied",
      description: `Applied: ${suggestion}`,
    });
    onSuggestionApplied();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="w-5 h-5 text-primary" />
          AI Music Producer
        </CardTitle>
        {selectedInstruments.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {selectedInstruments.map((instrument) => (
              <Badge key={instrument} variant="secondary" className="text-xs">
                {instrument}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-4 space-y-4">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((message) => (
            <div key={message.id} className={`flex items-start gap-3 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                {message.type === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              
              <div className={`flex-1 space-y-2 ${message.type === 'user' ? 'text-right' : ''}`}>
                <div className={`inline-block p-3 rounded-lg max-w-[80%] ${
                  message.type === 'user' 
                    ? 'bg-primary text-primary-foreground ml-auto' 
                    : 'bg-muted'
                }`}>
                  <p className="text-sm">{message.content}</p>
                </div>
                
                {message.suggestions && message.type === 'ai' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Lightbulb className="w-3 h-3" />
                      Suggestions:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {message.suggestions.map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => handleApplySuggestion(suggestion)}
                        >
                          <Wand2 className="w-3 h-3 mr-1" />
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Music className="w-4 h-4 animate-pulse" />
                  Analyzing your music...
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask for music suggestions..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!input.trim() || isLoading}
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}