import React, { createContext, useContext, useState, ReactNode } from "react";

interface ChatContextType {
    contextData: any;
    setContextData: (data: any) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
    const [contextData, setContextData] = useState<any>(null);

    return (
        <ChatContext.Provider value={{ contextData, setContextData }}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChatContext() {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error("useChatContext must be used within a ChatProvider");
    }
    return context;
}
