"use client";

import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogCloseTrigger,
} from "@/components/ui/dialog";
import { Button, Input, VStack, Text, Box } from "@chakra-ui/react";
import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useProjectStore } from "@/store/useProjectStore";

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
          : "Logged in successfully!"
      );

      // Transfer Guest Project if it exists
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

  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={(e: { open: boolean }) => !e.open && onClose()}
    >
      <DialogContent
        bg="gray.900"
        border="1px solid"
        borderColor="whiteAlpha.100"
      >
        <DialogHeader>
          <DialogTitle color="white">
            {mode === "signup" ? "Create Account" : "Welcome Back"}
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <VStack gap={4}>
            <Input
              placeholder="Email"
              bg="whiteAlpha.50"
              borderColor="whiteAlpha.200"
              color="white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              _focus={{ borderColor: "blue.400" }}
            />
            <Input
              placeholder="Password"
              type="password"
              bg="whiteAlpha.50"
              borderColor="whiteAlpha.200"
              color="white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              _focus={{ borderColor: "blue.400" }}
            />
            {message && (
              <Text
                color={
                  message.toLowerCase().includes("success") ||
                  message.toLowerCase().includes("account created")
                    ? "green.400"
                    : "red.400"
                }
                fontSize="sm"
              >
                {message}
              </Text>
            )}

            <Button
              w="full"
              onClick={handleAuth}
              loading={loading}
              bg="blue.500"
              _hover={{ bg: "blue.600" }}
              color="white"
            >
              {mode === "signup" ? "Sign Up" : "Log In"}
            </Button>

            <Box textAlign="center" fontSize="sm">
              <Text color="gray.400">
                {mode === "signup"
                  ? "Already have an account?"
                  : "Don't have an account?"}{" "}
                <Button
                  variant="ghost"
                  size="sm"
                  color="blue.400"
                  p={0}
                  _hover={{ bg: "transparent", textDecoration: "underline" }}
                  onClick={() => {
                    setMode(mode === "signup" ? "login" : "signup");
                    setMessage("");
                  }}
                >
                  {mode === "signup" ? "Log In" : "Sign Up"}
                </Button>
              </Text>
            </Box>
          </VStack>
        </DialogBody>
        <DialogCloseTrigger color="white" />
      </DialogContent>
    </DialogRoot>
  );
};
