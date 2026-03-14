import {
  Box,
  SimpleGrid,
  Text,
  VStack,
  Button,
  HStack,
  Spinner,
  Heading,
  IconButton,
  Input,
  Flex,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useProjectStore } from "@/store/useProjectStore";
import { createClient } from "@/lib/supabase";
import {
  Folder,
  ArrowRight,
  Trash2,
  Plus,
  LogIn,
  Edit2,
  Check,
  X,
  User,
  Cog,
} from "lucide-react";
import { AuthModal } from "./AuthModal";

interface DashboardProps {
  onOpenProject: (proj: any) => void;
  onNewProject: () => void;
}

export const Dashboard = ({ onOpenProject, onNewProject }: DashboardProps) => {
  const supabase = createClient();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isAuthOpen, setAuthOpen] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        fetchProjects(data.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProjects(session.user.id);
      } else {
        setProjects([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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

  const deleteProject = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this project?")) return;
    await supabase.from("projects").delete().eq("id", id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    useProjectStore.getState().refreshProjects();
  };

  const startEditing = (e: React.MouseEvent, project: any) => {
    e.stopPropagation();
    setEditingId(project.id);
    setEditTitle(project.title || "Untitled Project");
  };

  const saveTitle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editingId) return;
    await supabase
      .from("projects")
      .update({ title: editTitle })
      .eq("id", editingId);
    setProjects((prev) =>
      prev.map((p) => (p.id === editingId ? { ...p, title: editTitle } : p)),
    );
    setEditingId(null);
    useProjectStore.getState().refreshProjects();
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  // Not logged in
  if (!loading && !user) {
    return (
      <Box
        w="full"
        h="full"
        bg="var(--bg)"
        color="var(--fg)"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        position="relative"
        overflow="hidden"
      >
        {/* Background glow */}
        <Box
          position="absolute"
          top="30%"
          left="50%"
          transform="translate(-50%,-50%)"
          w="600px"
          h="400px"
          background="radial-gradient(ellipse, rgba(78,205,196,0.06) 0%, transparent 70%)"
          pointerEvents="none"
        />
        <Box textAlign="center" maxW="360px" position="relative">
          <Box
            w="80px"
            h="80px"
            borderRadius="20px"
            bg="var(--surface)"
            border="1px solid rgba(78,205,196,0.2)"
            display="flex"
            alignItems="center"
            justifyContent="center"
            mx="auto"
            mb={6}
            boxShadow="0 0 40px rgba(78,205,196,0.1)"
          >
            <LogIn size={32} color="var(--accent)" />
          </Box>
          <Heading
            fontFamily="var(--font-d)"
            fontSize="28px"
            fontWeight={700}
            letterSpacing="-0.03em"
            mb={3}
            color="var(--fg)"
          >
            Welcome to RivetsAI
          </Heading>
          <Text
            color="var(--fg2)"
            mb={8}
            fontSize="14px"
            fontFamily="var(--font-b)"
            fontWeight={300}
            lineHeight={1.75}
          >
            Sign in to save your websites, manage projects, and deploy your
            creations.
          </Text>
          <Button
            w="full"
            h="44px"
            borderRadius="8px"
            onClick={() => setAuthOpen(true)}
            bg="var(--accent)"
            color="#080C10"
            fontWeight={600}
            fontSize="14px"
            fontFamily="var(--font-b)"
            _hover={{
              bg: "#62D5CD",
              transform: "translateY(-1px)",
              boxShadow: "0 8px 24px rgba(78,205,196,0.3)",
            }}
            _active={{ transform: "translateY(0)" }}
            transition="all 0.2s ease"
          >
            Sign In / Sign Up
          </Button>
        </Box>
        <AuthModal isOpen={isAuthOpen} onClose={() => setAuthOpen(false)} />
      </Box>
    );
  }

  return (
    <Box w="full" h="full" overflowY="auto" bg="var(--bg)" color="var(--fg)">
      {/* Navbar */}
      <Flex
        as="nav"
        align="center"
        justify="space-between"
        px={{ base: 5, md: 8 }}
        py={4}
        position="sticky"
        top="0"
        zIndex={100}
        borderBottom="1px solid var(--border)"
        style={{
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          background: "rgba(8,12,16,0.82)",
        }}
      >
        <HStack gap={2}>
          <Box
            w="36px"
            h="36px"
            borderRadius="6px"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Cog size={24} color="var(--accent)" />
          </Box>
          <Text
            fontFamily="var(--font-d)"
            fontSize="16px"
            fontWeight={700}
            letterSpacing="-0.02em"
            color="var(--fg)"
          >
            RivetsAI
          </Text>
        </HStack>

        <HStack gap={3}>
          <IconButton
            borderRadius="full"
            variant="ghost"
            color="var(--fg2)"
            _hover={{ color: "var(--fg)", bg: "var(--surface)" }}
            aria-label="Profile"
          >
            <User size={18} />
          </IconButton>
          <Button
            variant="ghost"
            color="rgba(248,113,113,0.8)"
            _hover={{ bg: "var(--surface)", color: "rgb(248,113,113)" }}
            onClick={() => supabase.auth.signOut()}
            fontSize="13px"
            fontFamily="var(--font-b)"
            h="34px"
            px={3}
            borderRadius="8px"
          >
            Sign Out
          </Button>
        </HStack>
      </Flex>

      {/* Content */}
      <Box p={{ base: 5, md: 8 }}>
        {/* Header */}
        <HStack justify="space-between" mb={10} flexWrap="wrap" gap={4}>
          <VStack align="flex-start" gap={1}>
            <Heading
              fontFamily="var(--font-d)"
              fontSize={{ base: "28px", md: "36px" }}
              fontWeight={700}
              letterSpacing="-0.03em"
              color="var(--fg)"
            >
              My Projects
            </Heading>
            <Text
              color="var(--fg2)"
              fontSize="14px"
              fontFamily="var(--font-b)"
              fontWeight={300}
            >
              Manage and continue your AI-generated websites.
            </Text>
          </VStack>
          <Button
            onClick={onNewProject}
            px={5}
            h="40px"
            borderRadius="8px"
            fontSize="13px"
            fontFamily="var(--font-b)"
            fontWeight={600}
            bg="var(--accent)"
            color="#080C10"
            _hover={{
              bg: "#62D5CD",
              transform: "translateY(-1px)",
              boxShadow: "0 8px 24px rgba(78,205,196,0.3)",
            }}
            _active={{ transform: "translateY(0)" }}
            transition="all 0.2s ease"
            gap={2}
          >
            <Plus size={16} />
            New Project
          </Button>
        </HStack>

        {/* Loading */}
        {loading && (
          <Box py={20} textAlign="center">
            <Spinner size="lg" color="var(--accent)" />
            <Text
              mt={4}
              color="var(--fg2)"
              fontSize="14px"
              fontFamily="var(--font-b)"
            >
              Loading your projects...
            </Text>
          </Box>
        )}

        {/* Empty state */}
        {!loading && projects.length === 0 && (
          <Box
            border="1px dashed rgba(78,205,196,0.2)"
            borderRadius="16px"
            py={20}
            textAlign="center"
            bg="var(--surface)"
          >
            <Folder
              size={48}
              style={{
                margin: "0 auto 16px",
                opacity: 0.4,
                color: "var(--accent)",
              }}
            />
            <Text
              fontSize="16px"
              color="var(--fg2)"
              mb={6}
              fontFamily="var(--font-b)"
            >
              No projects found yet.
            </Text>
            <Button
              onClick={onNewProject}
              px={6}
              h="38px"
              borderRadius="8px"
              fontSize="13px"
              fontFamily="var(--font-b)"
              bg="var(--surface2)"
              color="var(--fg)"
              border="1px solid var(--border)"
              _hover={{ borderColor: "rgba(255,255,255,0.15)", bg: "rgba(255,255,255,0.04)" }}
            >
              Start Creating
            </Button>
          </Box>
        )}

        {/* Projects Grid */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={5}>
          {projects.map((project) => (
            <Box
              key={project.id}
              borderRadius="12px"
              overflow="hidden"
              cursor="pointer"
              onClick={() => onOpenProject(project)}
              role="group"
              bg="var(--surface)"
              border="1px solid var(--border)"
              _hover={{
                borderColor: "rgba(78,205,196,0.3)",
                boxShadow: "0 12px 40px rgba(78,205,196,0.08)",
                transform: "translateY(-2px)",
              }}
              transition="all 0.22s ease"
            >
              {/* Preview */}
              <Box
                h="180px"
                w="full"
                bg="var(--bg)"
                position="relative"
                overflow="hidden"
                borderBottom="1px solid var(--border)"
              >
                <iframe
                  srcDoc={project.current_code}
                  style={{
                    width: "200%",
                    height: "200%",
                    border: "none",
                    transform: "scale(0.5)",
                    transformOrigin: "top left",
                    pointerEvents: "none",
                    opacity: 0.85,
                  }}
                  title="Preview Thumbnail"
                  tabIndex={-1}
                />
                <Box
                  position="absolute"
                  inset="0"
                  bg="transparent"
                  _groupHover={{ bg: "rgba(78,205,196,0.02)" }}
                  transition="all 0.3s"
                />
                <Box
                  position="absolute"
                  inset="0"
                  boxShadow="inset 0 0 40px rgba(0,0,0,0.4)"
                  pointerEvents="none"
                />
              </Box>

              {/* Card Footer */}
              <Box p={4}>
                <HStack justify="space-between" mb={1.5} align="flex-start" h="32px">
                  {editingId === project.id ? (
                    <HStack w="full" onClick={(e) => e.stopPropagation()}>
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        size="xs"
                        autoFocus
                        bg="var(--bg)"
                        borderColor="rgba(78,205,196,0.4)"
                        color="var(--fg)"
                        _focus={{ borderColor: "var(--accent)" }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveTitle(e as any);
                          if (e.key === "Escape") cancelEdit(e as any);
                        }}
                      />
                      <IconButton
                        aria-label="Save"
                        size="xs"
                        color="var(--accent)"
                        variant="ghost"
                        onClick={saveTitle}
                      >
                        <Check size={13} />
                      </IconButton>
                      <IconButton
                        aria-label="Cancel"
                        size="xs"
                        color="rgba(248,113,113,0.8)"
                        variant="ghost"
                        onClick={cancelEdit}
                      >
                        <X size={13} />
                      </IconButton>
                    </HStack>
                  ) : (
                    <>
                      <Text
                        fontFamily="var(--font-d)"
                        fontWeight={600}
                        fontSize="15px"
                        color="var(--fg)"
                        truncate
                        maxW="70%"
                      >
                        {project.title || "Untitled Project"}
                      </Text>
                      <HStack gap={0}>
                        <IconButton
                          aria-label="Rename"
                          size="xs"
                          color="var(--fg3)"
                          variant="ghost"
                          _hover={{ color: "var(--fg2)" }}
                          onClick={(e) => startEditing(e, project)}
                        >
                          <Edit2 size={12} />
                        </IconButton>
                        <IconButton
                          aria-label="Delete"
                          size="xs"
                          color="var(--fg3)"
                          variant="ghost"
                          _hover={{ color: "rgba(248,113,113,0.8)" }}
                          onClick={(e) => deleteProject(e, project.id)}
                        >
                          <Trash2 size={13} />
                        </IconButton>
                      </HStack>
                    </>
                  )}
                </HStack>

                <Text
                  fontSize="11px"
                  color="var(--fg3)"
                  mb={3}
                  fontFamily="var(--font-b)"
                >
                  Last edited{" "}
                  {new Date(project.updated_at).toLocaleDateString()}
                </Text>

                <HStack
                  fontSize="12px"
                  fontWeight={500}
                  color="var(--accent)"
                  _groupHover={{ gap: "10px" }}
                  transition="gap 0.2s"
                  gap={2}
                  fontFamily="var(--font-b)"
                >
                  <Text>Open Editor</Text>
                  <ArrowRight size={14} />
                </HStack>
              </Box>
            </Box>
          ))}
        </SimpleGrid>
      </Box>

      <AuthModal isOpen={isAuthOpen} onClose={() => setAuthOpen(false)} />
    </Box>
  );
};
