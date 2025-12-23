"use client"

import { Box, Flex, Portal } from "@chakra-ui/react";
import { Sidebar } from "@/components/Sidebar";
import { ChatPanel } from "@/components/ChatPanel";
import { PreviewPanel } from "@/components/PreviewPanel";
import { Dashboard } from "@/components/Dashboard";
import { LandingPage } from "@/components/LandingPage";
import { useState, useEffect } from "react";
import { useProjectStore } from "@/store/useProjectStore";
import { createClient } from "@/lib/supabase";

export default function Home() {
  const [view, setView] = useState<"landing" | "dashboard" | "editor">("landing");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [chatWidth, setChatWidth] = useState(450);
  const [isResizing, setIsResizing] = useState(false);
  const { setProject, setGuest } = useProjectStore();
  const [user, setUser] = useState<any>(null);

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        setView("dashboard");
        setGuest(false);
      } else {
        setView("landing");
        setGuest(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setGuest(false);
      } else {
        setGuest(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const stopResizing = () => {
    setIsResizing(false);
  };

  const resize = (e: React.MouseEvent) => {
    if (isResizing) {
      let sidebarWidth = 0;
      if (view === "editor") {
        sidebarWidth = isSidebarCollapsed ? 60 : 250;
      }
      const newWidth = e.clientX - sidebarWidth;
      // Allow shrinking it back down to 250
      if (newWidth > 250 && newWidth < window.innerWidth - 300) {
        setChatWidth(newWidth);
      }
    }
  };

  const handleNewProject = () => {
    setProject(
      null,
      [],
      '<!-- Your generated website will appear here -->\n<div style="display:flex;justify-content:center;align-items:center;height:100vh;color:#888;">Waiting for prompt...</div>'
    );
    setView("editor");
  };

  return (
    <Flex 
      h="100vh" 
      w="full" 
      bg="black" 
      overflow="hidden"
      onMouseMove={resize}
      onMouseUp={stopResizing}
      onMouseLeave={stopResizing}
      position="relative"
    >
      {/* Overlay to capture mouse events while resizing (fixes iframe issue) */}
      {isResizing && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          zIndex={9999}
          cursor="col-resize"
          bg="transparent"
        />
      )}

      {view === "landing" && (
        <LandingPage 
          onStart={handleNewProject}
          onSeeDemo={() => setView("landing")} // Placeholder for demo
          onLogin={() => {
             // For simplicity, we trigger the login flow via Sidebar/Dashboard
             // But for Landing, maybe we just go to Dashboard which has AuthModal
             setView("dashboard");
          }}
        />
      )}

      {/* Sidebar */}
      {view === "editor" && (
        <Box
          w={isSidebarCollapsed ? "60px" : "250px"}
          transition={isResizing ? "none" : "width 0.2s"}
          borderRight="1px solid"
          borderColor="whiteAlpha.100"
          display={{ base: "none", md: "block" }}
        >
          <Sidebar
            onViewDashboard={() => setView("dashboard")}
            isCollapsed={isSidebarCollapsed}
            onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        </Box>
      )}

      {view === "dashboard" && (
        <Dashboard
          onOpenProject={(proj) => {
            supabase.from("messages")
              .select("*")
              .eq("project_id", proj.id)
              .order("created_at", { ascending: true })
              .then(({ data: messages }) => {
                setProject(proj.id, messages || [], proj.current_code || "");
                setView("editor");
              });
          }}
          onNewProject={handleNewProject}
        />
      )}

      {view === "editor" && (
        <Flex
          flex="1"
          direction={{ base: "column", md: "row" }}
          overflow="hidden"
        >
          {/* Chat Panel */}
          <Box
            w={{ base: "full", md: `${chatWidth}px` }}
            borderRight="1px solid"
            borderColor="whiteAlpha.100"
            transition={isResizing ? "none" : "width 0.2s"}
          >
            <ChatPanel />
          </Box>

          {/* Resize Handle */}
          <Box
            w="4px"
            cursor="col-resize"
            bg={isResizing ? "blue.500" : "transparent"}
            _hover={{ bg: "blue.500" }}
            onMouseDown={startResizing}
            zIndex={10}
            transition="background 0.2s"
          />

          {/* Preview Panel */}
          <Box flex="1" position="relative">
            <PreviewPanel />
          </Box>
        </Flex>
      )}
    </Flex>
  );
}
