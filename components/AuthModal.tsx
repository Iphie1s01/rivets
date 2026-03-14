"use client";

import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogCloseTrigger,
} from "@/components/ui/dialog";
import { Button, Input, VStack, Text, Box, HStack } from "@chakra-ui/react";
import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useProjectStore } from "@/store/useProjectStore";
import { Cog } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState("");
  const supabase = createClient();
  const { projectId, messages, currentCode, setProject, refreshProjects } =
    useProjectStore();

  const handleAuth = async () => {
    setLoading(true);
    setMessage("");

    const {
      data: { user: authUser },
      error,
    } =
      mode === "signup"
        ? await supabase.auth
            .signUp({ email, password })
            .then((res) => ({ data: res.data, error: res.error }))
        : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (authUser) {
      setMessage(
        mode === "signup"
          ? "Account created! You can now save projects."
          : "Logged in successfully!",
      );

      if (!projectId && messages.length > 0) {
        const { data: newProject } = await supabase
          .from("projects")
          .insert({
            user_id: authUser.id,
            title: messages[0].content.slice(0, 50) + "...",
            current_code: currentCode,
          })
          .select()
          .single();

        if (newProject) {
          const msgsToSave = messages.map((m) => ({
            project_id: newProject.id,
            role: m.role,
            content: m.content,
          }));
          await supabase.from("messages").insert(msgsToSave);
          setProject(newProject.id, messages, currentCode);
        }
      }

      refreshProjects();
      setTimeout(onClose, 1000);
    }
    setLoading(false);
  };

  const isSuccess =
    message.toLowerCase().includes("success") ||
    message.toLowerCase().includes("account created");

  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={(e: { open: boolean }) => !e.open && onClose()}
    >
      <DialogContent
        bg="var(--surface)"
        border="1px solid var(--border)"
        borderRadius="16px"
        boxShadow="0 40px 80px rgba(0,0,0,0.6)"
        maxW="400px"
      >
        <DialogHeader pb={2}>
          <HStack gap={3} align="center">
            <Box
              w="36px"
              h="36px"
              borderRadius="8px"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Cog size={24} color="var(--accent)" />
            </Box>
            <DialogTitle
              fontFamily="var(--font-d)"
              fontSize="18px"
              fontWeight={700}
              color="var(--fg)"
              letterSpacing="-0.02em"
            >
              {mode === "signup" ? "Create Account" : "Welcome Back"}
            </DialogTitle>
          </HStack>
        </DialogHeader>
        <DialogBody>
          <VStack gap={3}>
            <Text
              fontSize="13px"
              color="var(--fg2)"
              fontFamily="var(--font-b)"
              fontWeight={300}
              alignSelf="flex-start"
            >
              {mode === "signup"
                ? "Sign up to save and manage your projects."
                : "Sign in to access your projects."}
            </Text>
            <Input
              placeholder="Email address"
              bg="var(--surface2)"
              borderColor="var(--border)"
              color="var(--fg)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              borderRadius="8px"
              fontSize="14px"
              fontFamily="var(--font-b)"
              _focus={{
                borderColor: "rgba(78,205,196,0.5)",
                boxShadow: "0 0 0 3px rgba(78,205,196,0.08)",
              }}
              _placeholder={{ color: "var(--fg3)" }}
            />
            <Input
              placeholder="Password"
              type="password"
              bg="var(--surface2)"
              borderColor="var(--border)"
              color="var(--fg)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              borderRadius="8px"
              fontSize="14px"
              fontFamily="var(--font-b)"
              _focus={{
                borderColor: "rgba(78,205,196,0.5)",
                boxShadow: "0 0 0 3px rgba(78,205,196,0.08)",
              }}
              _placeholder={{ color: "var(--fg3)" }}
            />

            {message && (
              <Text
                color={isSuccess ? "var(--accent)" : "rgba(248,113,113,0.9)"}
                fontSize="13px"
                fontFamily="var(--font-b)"
                alignSelf="flex-start"
              >
                {message}
              </Text>
            )}

            <Button
              w="full"
              h="42px"
              onClick={handleAuth}
              loading={loading}
              bg="var(--accent)"
              color="#080C10"
              fontWeight={600}
              fontSize="14px"
              fontFamily="var(--font-b)"
              borderRadius="8px"
              _hover={{
                bg: "#62D5CD",
                transform: "translateY(-1px)",
                boxShadow: "0 6px 20px rgba(78,205,196,0.3)",
              }}
              _active={{ transform: "translateY(0)" }}
              transition="all 0.2s ease"
            >
              {mode === "signup" ? "Sign Up" : "Log In"}
            </Button>

            <HStack justify="center" fontSize="13px" gap={1}>
              <Text color="var(--fg3)" fontFamily="var(--font-b)">
                {mode === "signup"
                  ? "Already have an account?"
                  : "Don't have an account?"}
              </Text>
              <Button
                variant="ghost"
                size="sm"
                color="var(--accent)"
                p={0}
                h="auto"
                minW="auto"
                fontSize="13px"
                fontFamily="var(--font-b)"
                _hover={{ bg: "transparent", textDecoration: "underline" }}
                onClick={() => {
                  setMode(mode === "signup" ? "login" : "signup");
                  setMessage("");
                }}
              >
                {mode === "signup" ? "Log In" : "Sign Up"}
              </Button>
            </HStack>
          </VStack>
        </DialogBody>
        <DialogCloseTrigger color="var(--fg2)" _hover={{ color: "var(--fg)" }} />
      </DialogContent>
    </DialogRoot>
  );
};
