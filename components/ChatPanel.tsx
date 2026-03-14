"use client";

import {
  Box,
  VStack,
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
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

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

      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
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
    addMessage(userMsg);
    incrementMessageCount();
    setInput("");
    setGenerating(true);

    const { data: { session } } = await supabase.auth.getSession();

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
          projectId,
          userId: session?.user?.id,
          currentCode,
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      if (data.projectId && data.projectId !== projectId) {
        setProject(
          data.projectId,
          [...messages, userMsg, { role: "assistant", content: data.explanation }],
          data.code,
        );
        refreshProjects();
      } else {
        addMessage({ role: "assistant", content: data.explanation });
        setCurrentCode(data.code);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const SUGGESTED_PROMPTS = [
    "Build a modern portfolio for a frontend developer",
    "Create a landing page for a SaaS startup",
    "Design a restaurant website with online booking",
    "Make a dark-themed blog for a photographer",
  ];

  return (
    <Box
      h="full"
      display="flex"
      flexDirection="column"
      bg="var(--bg)"
      p={4}
      gap={3}
    >
      {/* Messages Area */}
      <Box
        flex="1"
        overflowY="auto"
        borderRadius="12px"
        bg="var(--surface)"
        border="1px solid var(--border)"
        p={5}
        position="relative"
      >
        <VStack align="stretch" gap={4}>
          {messages.length === 0 && (
            <Box textAlign="center" py={10} color="var(--fg2)">
              <VStack gap={5}>
                <Box
                  w="48px"
                  h="48px"
                  borderRadius="12px"
                  bg="var(--accent-dim)"
                  border="1px solid rgba(78,205,196,0.2)"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  mx="auto"
                >
                  <Sparkles size={22} color="var(--accent)" />
                </Box>
                <Box>
                  <Text
                    fontSize="16px"
                    fontWeight={600}
                    color="var(--fg)"
                    fontFamily="var(--font-d)"
                    mb={1}
                  >
                    Hi, I'm RivetsAI.
                  </Text>
                  <Text
                    fontSize="13px"
                    color="var(--fg2)"
                    fontFamily="var(--font-b)"
                    fontWeight={300}
                  >
                    Tell me what kind of website you want to build.
                  </Text>
                </Box>

                <SimpleGrid columns={{ base: 1, md: 2 }} gap={2} w="full">
                  {SUGGESTED_PROMPTS.map((prompt, i) => (
                    <Button
                      key={i}
                      variant="ghost"
                      size="sm"
                      border="1px solid var(--border)"
                      color="var(--fg2)"
                      bg="var(--surface2)"
                      _hover={{
                        bg: "var(--accent-dim)",
                        color: "var(--fg)",
                        borderColor: "rgba(78,205,196,0.3)",
                      }}
                      onClick={() => setInput(prompt)}
                      fontSize="12px"
                      h="auto"
                      py={2.5}
                      px={3}
                      whiteSpace="normal"
                      textAlign="left"
                      borderRadius="8px"
                      fontFamily="var(--font-b)"
                      fontWeight={300}
                      transition="all 0.2s ease"
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
              maxW="88%"
            >
              <Box
                bg={
                  msg.role === "user"
                    ? "var(--accent)"
                    : "var(--surface2)"
                }
                color={msg.role === "user" ? "#080C10" : "var(--fg)"}
                px={4}
                py={3}
                borderRadius={msg.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px"}
                border={msg.role === "user" ? "none" : "1px solid var(--border)"}
                boxShadow={
                  msg.role === "user"
                    ? "0 4px 16px rgba(78,205,196,0.25)"
                    : "none"
                }
              >
                <Text
                  fontSize="14px"
                  fontWeight={msg.role === "user" ? 500 : 300}
                  lineHeight={1.7}
                  fontFamily="var(--font-b)"
                  color={msg.role === "user" ? "#080C10" : "var(--fg)"}
                >
                  {msg.content}
                </Text>
              </Box>
            </Box>
          ))}

          {isGenerating && (
            <Box
              alignSelf="flex-start"
              bg="var(--surface2)"
              border="1px solid var(--border)"
              px={4}
              py={3}
              borderRadius="12px 12px 12px 2px"
            >
              <HStack gap={1}>
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </HStack>
            </Box>
          )}
          <div ref={bottomRef} />
        </VStack>
      </Box>

      {/* Input Area */}
      <HStack gap={2} w="full" align="flex-end">
        <IconButton
          aria-label="Voice Input"
          onClick={toggleListening}
          h="46px"
          w="46px"
          borderRadius="10px"
          bg={isListening ? "rgba(248,113,113,0.15)" : "var(--surface)"}
          color={isListening ? "rgb(248,113,113)" : "var(--fg2)"}
          border="1px solid"
          borderColor={
            isListening ? "rgba(248,113,113,0.4)" : "var(--border)"
          }
          _hover={{
            bg: isListening ? "rgba(248,113,113,0.2)" : "var(--surface2)",
            color: isListening ? "rgb(248,113,113)" : "var(--fg)",
            borderColor: isListening
              ? "rgba(248,113,113,0.6)"
              : "rgba(255,255,255,0.14)",
          }}
          transition="all 0.2s ease"
        >
          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
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
              height: "46px",
              minHeight: "46px",
              maxHeight: "180px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              color: "var(--fg)",
              padding: "12px 16px",
              fontSize: "14px",
              fontFamily: "var(--font-b)",
              outline: "none",
              resize: "none",
              display: "block",
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "rgba(78,205,196,0.4)";
              e.target.style.boxShadow = "0 0 0 3px rgba(78,205,196,0.08)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "var(--border)";
              e.target.style.boxShadow = "none";
            }}
          />
        </Box>

        <IconButton
          aria-label="Send"
          onClick={handleSend}
          h="46px"
          w="46px"
          borderRadius="10px"
          bg="var(--accent)"
          color="#080C10"
          _hover={{
            bg: "#62D5CD",
            transform: "translateY(-1px)",
            boxShadow: "0 6px 20px rgba(78,205,196,0.35)",
          }}
          _active={{ transform: "translateY(0)" }}
          transition="all 0.2s ease"
        >
          <Send size={18} />
        </IconButton>
      </HStack>

      <AuthModal isOpen={isAuthOpen} onClose={() => setAuthOpen(false)} />
    </Box>
  );
};
