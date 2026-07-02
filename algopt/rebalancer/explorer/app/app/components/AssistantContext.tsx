'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

type AssistantView = 'chat' | 'history';

interface AssistantContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  view: AssistantView;
  showChat: () => void;
  showHistory: () => void;
  toggleHistory: () => void;
  conversationId: string | undefined;
  setConversationId: (id: string | undefined) => void;
}

const AssistantContext = createContext<AssistantContextValue | null>(null);

export function useAssistantContext() {
  const context = useContext(AssistantContext);
  if (!context) {
    throw new Error('useAssistantContext must be used within AssistantProvider');
  }
  return context;
}

export function AssistantProvider({children}: {children: React.ReactNode}) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<AssistantView>('chat');
  const [conversationId, setConversationId] = useState<string | undefined>(
    undefined,
  );

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  const showChat = useCallback(() => setView('chat'), []);
  const showHistory = useCallback(() => setView('history'), []);
  const toggleHistory = useCallback(
    () => setView(prev => (prev === 'history' ? 'chat' : 'history')),
    [],
  );

  const value = useMemo<AssistantContextValue>(
    () => ({
      isOpen,
      open,
      close,
      toggle,
      view,
      showChat,
      showHistory,
      toggleHistory,
      conversationId,
      setConversationId,
    }),
    [
      isOpen,
      open,
      close,
      toggle,
      view,
      showChat,
      showHistory,
      toggleHistory,
      conversationId,
    ],
  );

  return (
    <AssistantContext.Provider value={value}>
      {children}
    </AssistantContext.Provider>
  );
}
