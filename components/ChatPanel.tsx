"use client";

import {
  Box,
  VStack,
  Input,
  HStack,
  IconButton,
  Text,
  SimpleGrid,
  Button,
} from "@chakra-ui/react";
import { Send, Sparkles, Mic, MicOff } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useProjectStore } from "@/store/useProjectStore";
import { createClient } from "@/lib/supabase";
import { AuthModal } from "./AuthModal";

export const ChatPanel = () => {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const {
    messages,
    addMessage,
    setGenerating,
    isGenerating,
    projectId,
    setProject,
    currentCode,
    isGuest,
    messageCount,
    incrementMessageCount,
    refreshProjects,
    setCurrentCode,
  } = useProjectStore();
  const [isAuthOpen, setAuthOpen] = useState(false);
  const supabase = createClient();

  // Speech Recognition Reference
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => prev + (prev ? " " : "") + transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech Error:", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    if (isGuest && messageCount >= 5) {
      setAuthOpen(true);
      return;
    }

    const userMsg = { role: "user" as const, content: input };

    // Optimistic Update
    addMessage(userMsg);
    incrementMessageCount();
    setInput("");
    setGenerating(true);

    // Check auth
    const {
      data: { session },
    } = await supabase.auth.getSession();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token && {
            Authorization: `Bearer ${session.access_token}`,
          }),
        },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          projectId, // Pass current project ID
          userId: session?.user?.id, // Pass user ID to associate new project
          currentCode, // Pass current code for context (future proofing)
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // If we just created a NEW project, the API should return the new projectId
      if (data.projectId && data.projectId !== projectId) {
        setProject(
          data.projectId,
          [
            ...messages,
            userMsg,
            { role: "assistant", content: data.explanation },
          ],
          data.code,
        );
        refreshProjects();
      } else {
        // Standard update
        addMessage({ role: "assistant", content: data.explanation });
        setCurrentCode(data.code);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Box
      h="full"
      display="flex"
      flexDirection="column"
      bg="black"
      p={4}
      color="white"
    >
      {/* Messages Area */}
      <Box
        flex="1"
        overflowY="auto"
        mb={4}
        className="glass-panel-enhanced"
        borderRadius="2xl"
        p={6}
        position="relative"
        css={{
          "&::-webkit-scrollbar-thumb": {
            background: "rgba(0, 240, 255, 0.3)",
          },
        }}
      >
        <VStack align="stretch" gap={5}>
          {messages.length === 0 && (
            <Box textAlign="center" py={12} color="whiteAlpha.500">
              <VStack gap={6}>
                <Sparkles
                  size={40}
                  style={{ margin: "0 auto", opacity: 0.4 }}
                />
                <Box>
                  <Text fontSize="xl" fontWeight="medium" color="white">
                    Hi, I'm RivetsAI.
                  </Text>
                  <Text fontSize="sm" opacity={0.7}>
                    Tell me what kind of website you want to build.
                  </Text>
                </Box>

                <SimpleGrid
                  columns={{ base: 1, md: 2 }}
                  gap={3}
                  w="full"
                  px={4}
                >
                  {[
                    "Build a modern portfolio for a frontend developer",
                    "Create a landing page for a SaaS startup",
                    "Design a restaurant website with online booking",
                    "Make a dark-themed blog for a photographer",
                  ].map((prompt, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      borderColor="whiteAlpha.200"
                      color="whiteAlpha.700"
                      _hover={{
                        bg: "whiteAlpha.100",
                        color: "white",
                        borderColor: "blue.400",
                      }}
                      onClick={() => setInput(prompt)}
                      fontSize="xs"
                      h="auto"
                      py={2}
                      px={3}
                      whiteSpace="normal"
                      textAlign="left"
                    >
                      {prompt}
                    </Button>
                  ))}
                </SimpleGrid>
              </VStack>
            </Box>
          )}

          {messages.map((msg, idx) => (
            <Box
              key={idx}
              alignSelf={msg.role === "user" ? "flex-end" : "flex-start"}
              maxW="85%"
            >
              <Box
                className={
                  msg.role === "user" ? "" : "glass-panel-enhanced hover-lift"
                }
                bg={
                  msg.role === "user"
                    ? "linear-gradient(135deg, #00f0ff 0%, #0099ff 100%)"
                    : "rgba(255, 255, 255, 0.03)"
                }
                color={msg.role === "user" ? "black" : "white"}
                px={msg.role === "user" ? 5 : 6}
                py={msg.role === "user" ? 3 : 4}
                borderRadius="2xl"
                borderBottomRightRadius={msg.role === "user" ? "4px" : "2xl"}
                borderBottomLeftRadius={msg.role === "user" ? "2xl" : "4px"}
                border={
                  msg.role === "user"
                    ? "none"
                    : "1px solid rgba(0, 240, 255, 0.2)"
                }
                boxShadow={
                  msg.role === "user"
                    ? "0 4px 20px rgba(0, 240, 255, 0.4)"
                    : "none"
                }
              >
                <Text
                  fontSize="0.95rem"
                  fontWeight={msg.role === "user" ? "600" : "400"}
                  lineHeight="tall"
                >
                  {msg.content}
                </Text>
              </Box>
            </Box>
          ))}
          {isGenerating && (
            <Box
              alignSelf="flex-start"
              bg="rgba(255, 255, 255, 0.05)"
              px={4}
              py={3}
              borderRadius="xl"
              borderBottomLeftRadius="sm"
            >
              <HStack gap={1}>
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </HStack>
            </Box>
          )}
        </VStack>
      </Box>

      {/* Input Area */}
      <HStack gap={3} w="full">
        <IconButton
          aria-label="Voice Input"
          onClick={toggleListening}
          h="56px"
          w="56px"
          borderRadius="2xl"
          bg={isListening ? "red.500" : "rgba(0, 240, 255, 0.1)"}
          color={isListening ? "white" : "#00f0ff"}
          border="1px solid"
          borderColor={isListening ? "red.600" : "rgba(0, 240, 255, 0.3)"}
          _hover={{
            bg: isListening ? "red.600" : "rgba(0, 240, 255, 0.2)",
            borderColor: isListening ? "red.700" : "rgba(0, 240, 255, 0.5)",
            transform: "scale(1.05)",
          }}
          transition="all 0.2s"
          boxShadow={
            isListening
              ? "0 0 20px rgba(239, 68, 68, 0.4)"
              : "0 0 20px rgba(0, 240, 255, 0.2)"
          }
        >
          {isListening ? <MicOff size={22} /> : <Mic size={22} />}
        </IconButton>

        <Box flex={1} position="relative">
          <textarea
            placeholder="Describe your website..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            style={{
              width: "100%",
              height: "56px",
              minHeight: "56px",
              maxHeight: "200px",
              background: "rgba(0, 240, 255, 0.03)",
              border: "1px solid rgba(0, 240, 255, 0.2)",
              borderRadius: "16px",
              color: "white",
              padding: "16px 20px",
              fontSize: "0.95rem",
              outline: "none",
              resize: "none",
              display: "block",
              transition: "all 0.3s",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "rgba(0, 240, 255, 0.5)";
              e.target.style.boxShadow = "0 0 30px rgba(0, 240, 255, 0.2)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "rgba(0, 240, 255, 0.2)";
              e.target.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.2)";
            }}
          />
        </Box>
        <IconButton
          aria-label="Send"
          onClick={handleSend}
          h="56px"
          w="56px"
          borderRadius="2xl"
          bg="linear-gradient(135deg, #00f0ff 0%, #0099ff 100%)"
          color="black"
          _hover={{
            transform: "translateY(-2px) scale(1.05)",
            boxShadow: "0 8px 30px rgba(0, 240, 255, 0.5)",
          }}
          _active={{ transform: "translateY(0) scale(1)" }}
          boxShadow="0 4px 20px rgba(0, 240, 255, 0.4)"
          transition="all 0.2s"
          fontWeight="bold"
        >
          <Send size={22} />
        </IconButton>
      </HStack>
      <AuthModal isOpen={isAuthOpen} onClose={() => setAuthOpen(false)} />
    </Box>
  );
};
