import React, { createContext, useContext, useState, ReactNode } from "react";

interface BandMember {
  instrument: string;
  prompt: string;
  isSelected: boolean;
}

interface BandContextType {
  finalMixPath: string | null;
  finalMixAudio: HTMLAudioElement | null;
  playingAudio: string | null;
  bandMembers: BandMember[];
  sessionId: string | null;
  userMidiPath: string | null;
  setFinalMixPath: (path: string | null) => void;
  setFinalMixAudio: (audio: HTMLAudioElement | null) => void;
  setPlayingAudio: (audio: string | null) => void;
  setBandMembers: (members: BandMember[]) => void;
  setSessionId: (id: string | null) => void;
  setUserMidiPath: (path: string | null) => void;
  onPlayFinalMix: () => void;
  onStopAllAudio: () => void;
}

const BandContext = createContext<BandContextType | undefined>(undefined);

export const useBandContext = () => {
  const context = useContext(BandContext);
  if (!context) {
    throw new Error("useBandContext must be used within a BandProvider");
  }
  return context;
};

interface BandProviderProps {
  children: ReactNode;
}

export const BandProvider: React.FC<BandProviderProps> = ({ children }) => {
  const [finalMixPath, setFinalMixPath] = useState<string | null>(null);
  const [finalMixAudio, setFinalMixAudio] = useState<HTMLAudioElement | null>(
    null
  );
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [bandMembers, setBandMembers] = useState<BandMember[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userMidiPath, setUserMidiPath] = useState<string | null>(null);

  const onPlayFinalMix = () => {
    if (finalMixAudio) {
      if (playingAudio === "final-mix") {
        finalMixAudio.pause();
      } else {
        finalMixAudio.play().catch((error) => {
          console.error("Error playing final mix:", error);
        });
      }
    }
  };

  const onStopAllAudio = () => {
    if (finalMixAudio) {
      finalMixAudio.pause();
      finalMixAudio.currentTime = 0;
    }
    setPlayingAudio(null);
  };

  return (
    <BandContext.Provider
      value={{
        finalMixPath,
        finalMixAudio,
        playingAudio,
        bandMembers,
        sessionId,
        userMidiPath,
        setFinalMixPath,
        setFinalMixAudio,
        setPlayingAudio,
        setBandMembers,
        setSessionId,
        setUserMidiPath,
        onPlayFinalMix,
        onStopAllAudio,
      }}
    >
      {children}
    </BandContext.Provider>
  );
};
