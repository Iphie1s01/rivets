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
  Cog,
  User,
} from "lucide-react";
import { FaCog } from "react-icons/fa";
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

  // Rename State
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

  if (!loading && !user) {
    return (
      <Box
        w="full"
        h="full"
        p={8}
        bg="black"
        color="white"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
      >
        <Box textAlign="center" maxW="md">
          <Box
            className="glass-panel-enhanced"
            w="100px"
            h="100px"
            borderRadius="full"
            display="flex"
            alignItems="center"
            justifyContent="center"
            mx="auto"
            mb={8}
            boxShadow="0 0 30px rgba(0, 240, 255, 0.2)"
          >
            <LogIn size={40} color="#00f0ff" />
          </Box>
          <Heading size="xl" mb={4}>
            RivetsAI
          </Heading>
          <Text color="gray.400" mb={8} fontSize="lg">
            Sign in to save your websites, manage projects, and deploy your
            creations.
          </Text>
          <Button
            size="lg"
            w="full"
            h="60px"
            borderRadius="xl"
            onClick={() => setAuthOpen(true)}
            className="btn-primary"
          >
            Sign In / Sign Up
          </Button>
        </Box>
        <AuthModal isOpen={isAuthOpen} onClose={() => setAuthOpen(false)} />
      </Box>
    );
  }

  return (
    <Box w="full" h="full" overflowY="auto" bg="black" color="white">
      <Flex
        as="nav"
        align="center"
        justify="space-between"
        wrap="wrap"
        padding="1.5rem 2rem"
        bg="rgba(0, 0, 0, 0.7)"
        color="white"
        position="sticky"
        top="0"
        zIndex="100"
        borderBottom="1px solid rgba(0, 240, 255, 0.15)"
        backdropFilter="blur(20px)"
      >
        <HStack gap={2}>
          <Box
            bg="blue.500"
            p={1.5}
            borderRadius="lg"
            boxShadow="0 0 15px rgba(0, 240, 255, 0.5)"
          >
            <FaCog size={20} fill="white" />
          </Box>
          <Text fontSize="xl" fontWeight="bold">
            RivetsAI
          </Text>
        </HStack>

        <HStack gap={4}>
          <IconButton
            borderRadius="full"
            variant="ghost"
            color="whiteAlpha.800"
            _hover={{ color: "#00f0ff", bg: "whiteAlpha.100" }}
          >
            <User size={20} cursor="pointer" />
          </IconButton>

          <Button
            variant="ghost"
            color="red.400"
            _hover={{ bg: "whiteAlpha.100", color: "red.300" }}
            onClick={() => supabase.auth.signOut()}
            fontSize="sm"
            fontWeight="600"
          >
            Sign Out
          </Button>
        </HStack>
      </Flex>
      <Box p={8}>
        <HStack justify="space-between" mb={10}>
          <VStack align="flex-start" gap={1}>
            <Heading size="2xl" fontWeight="bold" className="gradient-text">
              My Projects
            </Heading>
            <Text color="whiteAlpha.600" fontSize="lg">
              Manage and continue your AI-generated websites.
            </Text>
          </VStack>
          <Button
            onClick={onNewProject}
            px={8}
            py={7}
            borderRadius="xl"
            fontSize="lg"
            className="btn-primary"
          >
            <Plus size={22} style={{ marginRight: "10px" }} />
            New Project
          </Button>
        </HStack>

        {loading && (
          <Box py={20} textAlign="center">
            <Spinner
              size="xl"
              color="#00f0ff"
              boxShadow="0 0 20px rgba(0, 240, 255, 0.2)"
            />
            <Text mt={6} color="whiteAlpha.600" fontSize="lg">
              Loading your masterpieces...
            </Text>
          </Box>
        )}

        {!loading && projects.length === 0 && (
          <Box
            border="2px dashed"
            borderColor="rgba(0, 240, 255, 0.2)"
            borderRadius="2xl"
            py={32}
            textAlign="center"
            color="whiteAlpha.400"
            className="glass-panel"
          >
            <Folder
              size={64}
              style={{ margin: "0 auto 24px", opacity: 0.5, color: "#00f0ff" }}
            />
            <Text fontSize="xl" mb={6}>
              No projects found yet.
            </Text>
            <Button className="btn-secondary" onClick={onNewProject} px={8}>
              Start Creating
            </Button>
          </Box>
        )}

        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
          {projects.map((project) => (
            <Box
              key={project.id}
              className="glass-panel-enhanced hover-lift"
              borderRadius="2xl"
              overflow="hidden"
              cursor="pointer"
              onClick={() => onOpenProject(project)}
              role="group"
              border="1px solid rgba(0, 240, 255, 0.1)"
              _hover={{
                borderColor: "rgba(0, 240, 255, 0.4)",
                boxShadow: "0 12px 40px rgba(0, 240, 255, 0.15)",
              }}
            >
              {/* Mock Preview Window */}
              <Box
                h="200px"
                w="full"
                bg="#050505"
                position="relative"
                overflow="hidden"
                borderBottom="1px solid rgba(255, 255, 255, 0.05)"
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
                    opacity: 0.8,
                  }}
                  title="Preview Thumbnail"
                  tabIndex={-1}
                />
                <Box
                  position="absolute"
                  inset="0"
                  bg="transparent"
                  _groupHover={{ bg: "rgba(0, 240, 255, 0.03)" }}
                  transition="all 0.3s"
                />
                <Box
                  position="absolute"
                  inset="0"
                  boxShadow="inset 0 0 40px rgba(0, 0, 0, 0.5)"
                  pointerEvents="none"
                />
              </Box>

              <Box p={5}>
                <HStack
                  justify="space-between"
                  mb={2}
                  align="flex-start"
                  h="32px"
                >
                  {editingId === project.id ? (
                    <HStack w="full" onClick={(e) => e.stopPropagation()}>
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        size="xs"
                        autoFocus
                        bg="black"
                        borderColor="blue.500"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveTitle(e as any);
                          if (e.key === "Escape") cancelEdit(e as any);
                        }}
                      />
                      <IconButton
                        aria-label="Save"
                        size="xs"
                        color="green.400"
                        variant="ghost"
                        onClick={saveTitle}
                      >
                        <Check size={14} />
                      </IconButton>
                      <IconButton
                        aria-label="Cancel"
                        size="xs"
                        color="red.400"
                        variant="ghost"
                        onClick={cancelEdit}
                      >
                        <X size={14} />
                      </IconButton>
                    </HStack>
                  ) : (
                    <>
                      <Text fontWeight="bold" fontSize="lg" truncate maxW="70%">
                        {project.title || "Untitled Project"}
                      </Text>
                      <HStack gap={0} _groupHover={{ opacity: 0.1 }}>
                        <IconButton
                          aria-label="Rename"
                          size="xs"
                          color="gray.400"
                          variant="ghost"
                          onClick={(e) => startEditing(e, project)}
                        >
                          <Edit2 size={14} />
                        </IconButton>
                        <IconButton
                          aria-label="Delete"
                          size="xs"
                          color="red.400"
                          variant="ghost"
                          onClick={(e) => deleteProject(e, project.id)}
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </HStack>
                    </>
                  )}
                </HStack>

                <Text
                  fontSize="xs"
                  color="whiteAlpha.400"
                  mb={4}
                  fontWeight="500"
                >
                  Last edited{" "}
                  {new Date(project.updated_at).toLocaleDateString()}
                </Text>

                <HStack
                  fontSize="sm"
                  fontWeight="bold"
                  color="#00f0ff"
                  transition="all 0.3s"
                  _groupHover={{ gap: 3 }}
                >
                  <Text className="hover-glow">Open Editor</Text>
                  <ArrowRight size={16} />
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
