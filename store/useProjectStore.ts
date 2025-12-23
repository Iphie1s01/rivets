import { create } from 'zustand';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ProjectState {
  currentCode: string;
  messages: Message[];
  isGenerating: boolean;
  projectId: string | null;
  past: string[];
  future: string[];
  isGuest: boolean;
  messageCount: number;
  triggerRefresh: number;
  setCurrentCode: (code: string) => void;
  addMessage: (message: Message) => void;
  setGenerating: (isGenerating: boolean) => void;
  setProject: (id: string | null, messages: Message[], code: string) => void;
  undo: () => void;
  redo: () => void;
  incrementMessageCount: () => void;
  setGuest: (isGuest: boolean) => void;
  refreshProjects: () => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  currentCode: '<!-- Your generated website will appear here -->\n<div style="display:flex;justify-content:center;align-items:center;height:100vh;color:#888;">Waiting for prompt...</div>',
  messages: [],
  isGenerating: false,
  projectId: null,
  past: [],
  future: [],
  isGuest: true,
  messageCount: 0,
  triggerRefresh: 0,
  setCurrentCode: (code) => set((state) => ({ 
      past: [...state.past, state.currentCode],
      currentCode: code,
      future: [] 
  })),
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message]
  })),
  incrementMessageCount: () => set((state) => ({ messageCount: state.messageCount + 1 })),
  setGuest: (isGuest) => set({ isGuest }),
  refreshProjects: () => set((state) => ({ triggerRefresh: state.triggerRefresh + 1 })),
  setGenerating: (isGenerating) => set({ isGenerating }),
  setProject: (id, messages, code) => set({ 
      projectId: id, 
      messages, 
      currentCode: code,
      past: [],
      future: [],
      isGuest: id === null,
      messageCount: messages.length
  }),
  undo: () => set((state) => {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, -1);
      return {
          past: newPast,
          currentCode: previous,
          future: [state.currentCode, ...state.future]
      };
  }),
  redo: () => set((state) => {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      return {
          past: [...state.past, state.currentCode],
          currentCode: next,
          future: newFuture
      };
  }),
}));
