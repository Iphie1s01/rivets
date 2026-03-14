import {
  Box,
  VStack,
  Text,
  Button,
  HStack,
  Spinner,
  Spacer,
  IconButton,
  Tooltip,
} from "@chakra-ui/react";
import {
  MessageSquare,
  Plus,
  LogOut,
  LayoutGrid,
  LogIn,
  ChevronLeft,
  ChevronRight,
  Rocket,
  ExternalLink,
  Cog,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useProjectStore } from "@/store/useProjectStore";
import { AuthModal } from "./AuthModal";

interface SidebarProps {
  onViewDashboard?: () => void;
  isCollapsed: boolean;
  onToggle: () => void;
}

export const Sidebar = ({
  onViewDashboard,
  isCollapsed,
  onToggle,
}: SidebarProps) => {
  const [isAuthOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();
  const { setProject, projectId, triggerRefresh, currentCode, isGuest } =
    useProjectStore();
  const [deploying, setDeploying] = useState(false);
  const [deploymentUrl, setDeploymentUrl] = useState<string | null>(null);

  const fetchProjects = async (userId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (data) setProjects(data);
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) fetchProjects(data.user.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProjects(session.user.id);
      } else {
        setProjects([]);
      }
    });
    return () => subscription.unsubscribe();
  }, [triggerRefresh]);

  const handleNewProject = () => {
    setProject(
      null,
      [],
      '<!-- Your generated website will appear here -->\n<div style="display:flex;justify-content:center;align-items:center;height:100vh;color:#888;">Waiting for prompt...</div>',
    );
  };

  const loadProject = async (proj: any) => {
    const { data: messages } = await supabase
      .from("messages")
      .select("*")
      .eq("project_id", proj.id)
      .order("created_at", { ascending: true });

    setProject(proj.id, messages || [], proj.current_code || "");
  };

  const handleDeploy = async () => {
    if (isGuest) {
      setAuthOpen(true);
      return;
    }
    setDeploying(true);
    try {
      const response = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: currentCode,
          projectName:
            projects.find((p) => p.id === projectId)?.title || "rivets-project",
        }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setDeploymentUrl(data.url);
      window.open(data.url, "_blank");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeploying(false);
    }
  };

  return (
    <Box
      h="full"
      bg="var(--bg)"
      color="var(--fg)"
      p={isCollapsed ? 2 : 4}
      display="flex"
      flexDirection="column"
      w={isCollapsed ? "60px" : "250px"}
      transition="width 0.2s"
      position="relative"
      borderRight="1px solid var(--border)"
    >
      {/* Toggle Button */}
      <IconButton
        aria-label="Toggle Sidebar"
        size="xs"
        position="absolute"
        right="-12px"
        top="45px"
        zIndex={10}
        borderRadius="full"
        bg="var(--surface2)"
        border="1px solid var(--border)"
        color="var(--fg2)"
        _hover={{ bg: "var(--surface)", color: "var(--fg)" }}
        onClick={onToggle}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </IconButton>

      {/* Brand */}
      <HStack
        mb={8}
        gap={3}
        onClick={onViewDashboard}
        cursor="pointer"
        justify={isCollapsed ? "center" : "flex-start"}
        _hover={{ opacity: 0.8 }}
        transition="opacity 0.2s"
      >
        <Box
          w="36px"
          h="36px"
          borderRadius="7px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
        >
          <Cog size={24} color="var(--accent)" />
        </Box>
        {!isCollapsed && (
          <Text
            fontFamily="var(--font-d)"
            fontSize="16px"
            fontWeight={700}
            letterSpacing="-0.02em"
            color="var(--fg)"
          >
            RivetsAI
          </Text>
        )}
      </HStack>

      {/* Dashboard Nav */}
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <Button
            variant="ghost"
            justifyContent={isCollapsed ? "center" : "flex-start"}
            mb={2}
            gap={2}
            px={isCollapsed ? 0 : 3}
            h="36px"
            color="var(--fg2)"
            _hover={{ color: "var(--fg)", bg: "var(--surface)" }}
            onClick={onViewDashboard}
            fontSize="13px"
            fontFamily="var(--font-b)"
            borderRadius="8px"
          >
            <LayoutGrid size={15} />
            {!isCollapsed && "Dashboard"}
          </Button>
        </Tooltip.Trigger>
        {isCollapsed && (
          <Tooltip.Positioner>
            <Tooltip.Content>Dashboard</Tooltip.Content>
          </Tooltip.Positioner>
        )}
      </Tooltip.Root>

      {/* New Project */}
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <Button
            w="full"
            mb={2}
            gap={2}
            px={isCollapsed ? 0 : 3}
            h="36px"
            justifyContent={isCollapsed ? "center" : "flex-start"}
            bg="var(--accent)"
            color="#080C10"
            fontWeight={600}
            fontSize="13px"
            fontFamily="var(--font-b)"
            borderRadius="8px"
            _hover={{
              bg: "#62D5CD",
              transform: "translateY(-1px)",
            }}
            _active={{ transform: "translateY(0)" }}
            transition="all 0.2s ease"
            onClick={handleNewProject}
          >
            <Plus size={15} />
            {!isCollapsed && "New Project"}
          </Button>
        </Tooltip.Trigger>
        {isCollapsed && (
          <Tooltip.Positioner>
            <Tooltip.Content>New Project</Tooltip.Content>
          </Tooltip.Positioner>
        )}
      </Tooltip.Root>

      {/* Deploy */}
      {projectId && (
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <Button
              variant="ghost"
              w="full"
              size="sm"
              gap={2}
              mb={2}
              color="var(--accent)"
              onClick={handleDeploy}
              loading={deploying}
              justifyContent={isCollapsed ? "center" : "flex-start"}
              px={isCollapsed ? 0 : 3}
              _hover={{ bg: "var(--accent-dim)", transform: "translateY(-1px)" }}
              _active={{ transform: "translateY(0)" }}
              transition="all 0.2s ease"
              fontSize="13px"
              fontFamily="var(--font-b)"
              borderRadius="8px"
              border="1px solid rgba(78,205,196,0.2)"
            >
              {deploymentUrl ? <ExternalLink size={14} /> : <Rocket size={14} />}
              {!isCollapsed && (deploymentUrl ? "View Live" : "Deploy Live")}
            </Button>
          </Tooltip.Trigger>
          {isCollapsed && <Tooltip.Content>Deploy</Tooltip.Content>}
        </Tooltip.Root>
      )}

      {/* Recent Projects */}
      <VStack
        mt={4}
        align="stretch"
        gap={1}
        overflowY="auto"
        flex="1"
        display={isCollapsed ? "none" : "flex"}
      >
        <Text
          fontSize="10px"
          color="var(--fg3)"
          fontWeight={500}
          textTransform="uppercase"
          letterSpacing="0.1em"
          px={2}
          mb={1}
          fontFamily="var(--font-b)"
        >
          Recent Projects
        </Text>

        {loading && <Spinner size="sm" color="var(--accent)" />}

        {!loading && projects.length === 0 && user && (
          <Text
            fontSize="12px"
            color="var(--fg3)"
            px={2}
            fontFamily="var(--font-b)"
          >
            No projects yet.
          </Text>
        )}

        {projects.map((p) => (
          <Button
            key={p.id}
            variant="ghost"
            justifyContent="flex-start"
            color={projectId === p.id ? "var(--fg)" : "var(--fg2)"}
            bg={projectId === p.id ? "var(--surface)" : "transparent"}
            border={projectId === p.id ? "1px solid var(--border)" : "1px solid transparent"}
            _hover={{ bg: "var(--surface)", color: "var(--fg)" }}
            h="auto"
            py={2.5}
            px={3}
            onClick={() => loadProject(p)}
            borderRadius="8px"
            fontSize="13px"
            fontFamily="var(--font-b)"
          >
            <MessageSquare size={13} style={{ marginRight: "8px", flexShrink: 0 }} />
            <Text truncate>{p.title}</Text>
          </Button>
        ))}

        {!user && (
          <Text
            fontSize="12px"
            color="var(--fg3)"
            px={2}
            fontFamily="var(--font-b)"
          >
            Sign in to save projects.
          </Text>
        )}
      </VStack>

      <Spacer />
      <AuthModal isOpen={isAuthOpen} onClose={() => setAuthOpen(false)} />

      {/* Auth */}
      {user ? (
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <Button
              w="full"
              variant="ghost"
              color="rgba(248,113,113,0.8)"
              px={isCollapsed ? 0 : 3}
              h="36px"
              onClick={() => {
                supabase.auth.signOut();
                setProject(null, [], "");
              }}
              justifyContent={isCollapsed ? "center" : "flex-start"}
              _hover={{ bg: "var(--surface)", color: "rgb(248,113,113)" }}
              fontSize="13px"
              fontFamily="var(--font-b)"
              borderRadius="8px"
            >
              <LogOut size={14} style={{ marginRight: isCollapsed ? 0 : "8px" }} />
              {!isCollapsed && "Sign Out"}
            </Button>
          </Tooltip.Trigger>
          {isCollapsed && (
            <Tooltip.Positioner>
              <Tooltip.Content>Sign Out</Tooltip.Content>
            </Tooltip.Positioner>
          )}
        </Tooltip.Root>
      ) : (
        <Button
          w="full"
          px={isCollapsed ? 0 : 3}
          h="36px"
          onClick={() => setAuthOpen(true)}
          justifyContent={isCollapsed ? "center" : "flex-start"}
          bg="var(--surface)"
          border="1px solid var(--border)"
          color="var(--fg)"
          _hover={{ borderColor: "rgba(255,255,255,0.15)", bg: "var(--surface2)" }}
          fontSize="13px"
          fontFamily="var(--font-b)"
          borderRadius="8px"
        >
          <LogIn size={14} style={{ marginRight: isCollapsed ? 0 : "8px" }} />
          {!isCollapsed && "Sign In"}
        </Button>
      )}
    </Box>
  );
};
