"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  chatThemes,
  type ChatTheme,
  type ChatThemeMode,
} from "@/lib/chat-theme";

interface ChatThemeContextValue {
  mode: ChatThemeMode;
  t: ChatTheme;
  toggleMode: () => void;
}

const ChatThemeContext = createContext<ChatThemeContextValue>({
  mode: "dark",
  t: chatThemes.dark,
  toggleMode: () => {},
});

export function ChatThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ChatThemeMode>("dark");

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const t = chatThemes[mode];

  return (
    <ChatThemeContext.Provider value={{ mode, t, toggleMode }}>
      {children}
    </ChatThemeContext.Provider>
  );
}

export function useChatTheme() {
  return useContext(ChatThemeContext);
}
