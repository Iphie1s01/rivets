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
  Zap,
  LayoutGrid,
  LogIn,
  ChevronLeft,
  ChevronRight,
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
  const { setProject, projectId, triggerRefresh } = useProjectStore();

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
      '<!-- Your generated website will appear here -->\n<div style="display:flex;justify-content:center;align-items:center;height:100vh;color:#888;">Waiting for prompt...</div>'
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

  return (
    <Box
      h="full"
      bg="black"
      color="white"
      p={isCollapsed ? 2 : 4}
      display="flex"
      flexDirection="column"
      w={isCollapsed ? "60px" : "250px"}
      transition="width 0.2s"
      position="relative"
      borderRight="1px solid #222"
    >
      <IconButton
        aria-label="Toggle Sidebar"
        size="xs"
        position="absolute"
        right="-12px"
        top="45px"
        zIndex={10}
        borderRadius="full"
        bg="gray.800"
        _hover={{ bg: "gray.700" }}
        onClick={onToggle}
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </IconButton>

      {/* Brand */}
      <HStack
        mb={8}
        gap={3}
        onClick={onViewDashboard}
        cursor="pointer"
        justify={isCollapsed ? "center" : "flex-start"}
        _hover={{ opacity: 0.8 }}
      >
        <Box
          bg="blue.500"
          p={1.5}
          borderRadius="lg"
          boxShadow="0 0 15px rgba(59, 130, 246, 0.5)"
        >
          <Zap size={20} fill="white" />
        </Box>
        {!isCollapsed && (
          <Text fontSize="xl" fontWeight="bold" letterSpacing="tight">
            ZappyAI
          </Text>
        )}
      </HStack>

      {/* Nav Actions */}
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <Button
            variant="ghost"
            color="gray.400"
            justifyContent={isCollapsed ? "center" : "flex-start"}
            mb={2}
            gap={2}
            px={isCollapsed ? 0 : 4}
            _hover={{ color: "white", bg: "whiteAlpha.100" }}
            onClick={onViewDashboard}
          >
            <LayoutGrid size={16} />
            {!isCollapsed && "Dashboard"}
          </Button>
        </Tooltip.Trigger>
        {isCollapsed && (
          <Tooltip.Positioner>
            <Tooltip.Content>Dashboard</Tooltip.Content>
          </Tooltip.Positioner>
        )}
      </Tooltip.Root>

      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <Button
            colorScheme="blue"
            variant="solid"
            w="full"
            mb={6}
            gap={2}
            px={isCollapsed ? 0 : 4}
            justifyContent={isCollapsed ? "center" : "flex-start"}
            bg="linear-gradient(to r, #3B82F6, #8B5CF6)"
            _hover={{ opacity: 0.9 }}
            onClick={handleNewProject}
          >
            <Plus size={16} />
            {!isCollapsed && "New Project"}
          </Button>
        </Tooltip.Trigger>
        {isCollapsed && (
          <Tooltip.Positioner>
            <Tooltip.Content>New Project</Tooltip.Content>
          </Tooltip.Positioner>
        )}
      </Tooltip.Root>

      <VStack
        mt={6}
        align="stretch"
        gap={2}
        overflowY="auto"
        flex="1"
        display={isCollapsed ? "none" : "flex"}
      >
        <Text
          fontSize="xs"
          color="whiteAlpha.500"
          fontWeight="bold"
          textTransform="uppercase"
          letterSpacing="wider"
        >
          Recent Projects
        </Text>

        {loading && <Spinner size="sm" color="whiteAlpha.500" />}

        {!loading && projects.length === 0 && user && (
          <Text fontSize="xs" color="whiteAlpha.400" px={2}>
            No projects yet.
          </Text>
        )}

        {projects.map((p) => (
          <Button
            key={p.id}
            variant={projectId === p.id ? "surface" : "ghost"}
            justifyContent="flex-start"
            color={projectId === p.id ? "white" : "whiteAlpha.800"}
            bg={projectId === p.id ? "whiteAlpha.200" : "transparent"}
            _hover={{ bg: "whiteAlpha.100" }}
            h="auto"
            py={3}
            onClick={() => loadProject(p)}
          >
            <MessageSquare size={16} style={{ marginRight: "8px" }} />
            <Text truncate>{p.title}</Text>
          </Button>
        ))}

        {!user && (
          <Text fontSize="xs" color="whiteAlpha.400" px={2}>
            Sign in to save projects.
          </Text>
        )}
      </VStack>

      <Spacer />

      <AuthModal isOpen={isAuthOpen} onClose={() => setAuthOpen(false)} />

      {user ? (
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <Button
              w="full"
              variant="ghost"
              color="red.300"
              px={isCollapsed ? 0 : 4}
              onClick={() => {
                supabase.auth.signOut();
                setProject(null, [], "");
              }}
              justifyContent={isCollapsed ? "center" : "flex-start"}
            >
              <LogOut
                size={16}
                style={{ marginRight: isCollapsed ? 0 : "8px" }}
              />
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
          variant="solid"
          colorScheme="blue"
          px={isCollapsed ? 0 : 4}
          onClick={() => setAuthOpen(true)}
          justifyContent={isCollapsed ? "center" : "flex-start"}
        >
          <LogIn size={16} style={{ marginRight: isCollapsed ? 0 : "8px" }} />
          {!isCollapsed && "Sign In"}
        </Button>
      )}
    </Box>
  );
};
