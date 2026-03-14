"use client";

import { useRef } from "react";
import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  Heading,
  HStack,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  Zap,
  Code2,
  RefreshCw,
  Globe,
  Database,
  Rocket,
  MessageSquare,
  Cog,
} from "lucide-react";


const M = {
  Box: motion(Box),
  Flex: motion(Flex),
};

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
});

function AnimatedSection({ children }: { children: React.ReactNode }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <M.Box
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
    >
      {children}
    </M.Box>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <HStack gap={2} mb={4}>
      <Box w="16px" h="1px" bg="var(--accent)" />
      <Text
        fontSize="11px"
        color="var(--accent)"
        textTransform="uppercase"
        letterSpacing="0.12em"
        fontWeight={500}
        fontFamily="var(--font-b)"
      >
        {children}
      </Text>
    </HStack>
  );
}


const FEATURES = [
  {
    icon: MessageSquare,
    label: "AI Generation",
    title: "Describe it. Done.",
    desc: "Type what you need in plain language. Our model understands design intent, layout logic, and brand nuance to produce real, publish-ready websites.",
    accent: false,
  },
  {
    icon: Code2,
    label: "Live Preview",
    title: "See it as you build.",
    desc: "Every prompt update instantly reflects in a live preview. No refresh, no guesswork. Click any element to inspect and modify it in real time.",
    accent: true,
  },
  {
    icon: RefreshCw,
    label: "Iteration",
    title: "Keep prompting to refine.",
    desc: "Made a change you don't like? Just describe what to fix. RivetsAI keeps your edits in full context so every iteration builds on the last.",
    accent: false,
  },
  {
    icon: Zap,
    label: "Instant Deploy",
    title: "Live in under 60 seconds.",
    desc: "One click to push your site live. RivetsAI handles hosting, CDN, and delivery automatically so you focus on what matters.",
    accent: false,
  },
  {
    icon: Code2,
    label: "Code Export",
    title: "Own your code, always.",
    desc: "Export production-ready HTML at any time. No lock-in. Hand off to a developer or host it anywhere you like.",
    accent: false,
  },
  {
    icon: Rocket,
    label: "Guest Mode",
    title: "Zero friction entry.",
    desc: "Start building right now with no sign-up required. Guest mode lets you see the value immediately before committing to an account.",
    accent: false,
  },
];


const STEPS = [
  {
    n: "01",
    title: "Describe your site",
    desc: 'Type a prompt like "a portfolio site for a UX designer, minimal, dark, with case study cards." Be as brief or as detailed as you like.',
  },
  {
    n: "02",
    title: "Review the result",
    desc: "RivetsAI generates a fully structured website in seconds — real HTML, not a template. Preview it live in your browser before publishing.",
  },
  {
    n: "03",
    title: "Refine with follow-ups",
    desc: 'Type follow-up prompts to adjust anything. "Make the hero section larger." "Change the color scheme to dark navy." Every change is instant.',
  },
  {
    n: "04",
    title: "Export or deploy",
    desc: "Download your code or deploy it live with one click. Your site goes live instantly, or export clean HTML to host anywhere.",
  },
];


const TESTIMONIALS = [
  {
    q: "We shipped our entire marketing site in a single afternoon. I described our product and RivetsAI handled the rest.",
    name: "Jordan Mills",
    role: "Head of Marketing",
    initials: "JM",
  },
  {
    q: "As a designer who can't code, RivetsAI is genuinely life-changing. I can build the things I've been mocking up in Figma for years.",
    name: "Priya Shankar",
    role: "Senior UX Designer",
    initials: "PS",
  },
  {
    q: "I replaced our agency contract with RivetsAI. The quality is better and we iterate 10x faster. Absolutely worth it.",
    name: "Carlos Vega",
    role: "Co-founder & CEO",
    initials: "CV",
  },
  {
    q: "The live preview feels like Webflow without the 3-month learning curve. I was shipping pages in under an hour.",
    name: "Sarah Kim",
    role: "Freelance Web Designer",
    initials: "SK",
  },
  {
    q: "RivetsAI handles about 80% of our landing page work now. Our devs focus on the product, not the marketing site.",
    name: "Tobi Adeyemi",
    role: "Engineering Manager",
    initials: "TA",
  },
  {
    q: "I used to dread client requests for quick website changes. Now I just open RivetsAI and it's done in minutes.",
    name: "Elena Russo",
    role: "Freelance Developer",
    initials: "ER",
  },
];

function Navbar({
  onLogin,
  onStart,
}: {
  onLogin: () => void;
  onStart: () => void;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <M.Box
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      position="fixed"
      top={0}
      left={0}
      right={0}
      zIndex={100}
      py={4}
      style={{
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        background: "rgba(8,12,16,0.82)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <Container maxW="1200px" px={{ base: 5, md: 8 }}>
        <Flex align="center" justify="space-between">
          <HStack gap={2}>
            <Box
              w="26px"
              h="26px"
              borderRadius="7px"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Cog size={26} color="#62D5CD" />
            </Box>
            <Text
              fontFamily="var(--font-d)"
              fontWeight={700}
              fontSize="17px"
              letterSpacing="-0.02em"
              color="var(--fg)"
            >
              RivetsAI
            </Text>
          </HStack>

          <HStack gap={0} display={{ base: "none", md: "flex" }}>
            {["Features", "How it works", "Pricing"].map((l) => (
              <Button
                key={l}
                variant="ghost"
                size="sm"
                fontSize="13px"
                fontWeight={400}
                px={4}
                color="var(--fg2)"
                _hover={{ color: "#62D5CD", bg: "transparent" }}
                fontFamily="var(--font-b)"
              >
                {l}
              </Button>
            ))}
          </HStack>

          <HStack gap={3}>
            <Button
              variant="ghost"
              size="sm"
              fontSize="13px"
              fontWeight={400}
              display={{ base: "none", md: "flex" }}
              color="var(--fg2)"
              _hover={{ color: "#62D5CD", bg: "transparent" }}
              onClick={onLogin}
              fontFamily="var(--font-b)"
            >
              Sign in
            </Button>
            <Button
              size="sm"
              fontSize="13px"
              px={5}
              h="34px"
              bg="var(--accent)"
              color="#ffffffff"
              fontWeight={600}
              fontFamily="var(--font-b)"
              borderRadius="8px"
              border="1px solid #62D5CD"
              _hover={{
                bg: "#62D5CD",
                transform: "translateY(-1px)",
                boxShadow: "0 8px 24px rgba(78,205,196,0.3)",
              }}
              _active={{ transform: "translateY(0)" }}
              transition="all 0.2s ease"
              onClick={onStart}
            >
              Get started
            </Button>
          </HStack>
        </Flex>
      </Container>
    </M.Box>
  );
}


function Hero({
  onStart,
  onLogin,
}: {
  onStart: () => void;
  onLogin: () => void;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <Box
      pt={{ base: "130px", md: "170px" }}
      pb={{ base: "80px", md: "120px" }}
      position="relative"
      overflow="hidden"
    >
      {/* Glow */}
      <Box
        position="absolute"
        top="5%"
        left="50%"
        transform="translateX(-50%)"
        w="900px"
        h="500px"
        background="radial-gradient(ellipse, rgba(78,205,196,0.07) 0%, transparent 68%)"
        pointerEvents="none"
      />
      {/* Grid */}
      <Box
        position="absolute"
        inset={0}
        opacity={0.025}
        backgroundImage="linear-gradient(var(--fg) 1px, transparent 1px), linear-gradient(90deg, var(--fg) 1px, transparent 1px)"
        backgroundSize="56px 56px"
        pointerEvents="none"
      />

      <Container maxW="1200px" px={{ base: 5, md: 8 }} position="relative">
        <VStack gap={0} align="center" textAlign="center">
          

          <M.Box
            ref={ref}
            initial={{ opacity: 1, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            mb={6}
          >
            <HStack
              gap={2}
              px={4}
              py={2}
              borderRadius="full"
              border="1px solid var(--border)"
              bg="var(--surface)"
              display="inline-flex"
            >
              <Box w="6px" h="6px" borderRadius="full" bg="var(--accent)" />
              <Text
                fontSize="12px"
                color="var(--fg2)"
                fontWeight={400}
                letterSpacing="0.03em"
                fontFamily="var(--font-b)"
              >
                AI-powered website builder
              </Text>
            </HStack>
          </M.Box>

          {/* Headline */}
          <M.Box
            ref={ref}
            initial={{ opacity: 1, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            mb={6}
          >
            <Heading
              fontFamily="var(--font-d)"
              fontWeight={800}
              fontSize={{ base: "46px", md: "74px", lg: "88px" }}
              lineHeight={1.0}
              letterSpacing="-0.04em"
              maxW="860px"
              color="var(--fg)"
            >
              Your website,{" "}
              <Box as="span" color="var(--accent)">
                described.
              </Box>
              <br />
              Instantly built.
            </Heading>
          </M.Box>

          {/* Subheading */}
          <M.Box
            ref={ref}
            initial={{ opacity: 1, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            mb={10}
          >
            <Text
              fontSize={{ base: "15px", md: "18px" }}
              color="var(--fg2)"
              fontWeight={300}
              maxW="500px"
              lineHeight={1.75}
              fontFamily="var(--font-b)"
            >
              Type a prompt. Watch your site appear. Refine every detail with
              follow-up messages.
            </Text>
          </M.Box>

          <M.Box
            ref={ref}
            initial={{ opacity: 1, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            mb={16}
          >
            <HStack gap={3} justify="center" flexWrap="wrap">
              <Button
                size="lg"
                px={8}
                h="48px"
                fontSize="15px"
                bg="var(--accent)"
                color="#080C10"
                fontWeight={600}
                fontFamily="var(--font-b)"
                borderRadius="8px"
                _hover={{
                  bg: "#62D5CD",
                  transform: "translateY(-1px)",
                  boxShadow: "0 8px 30px rgba(78,205,196,0.3)",
                }}
                _active={{ transform: "translateY(0)" }}
                transition="all 0.2s ease"
                onClick={onStart}
              >
                Start building free
              </Button>
              <Button
                size="lg"
                px={8}
                h="48px"
                fontSize="15px"
                fontWeight={400}
                fontFamily="var(--font-b)"
                borderRadius="8px"
                border="1px solid var(--border)"
                color="var(--fg2)"
                bg="transparent"
                _hover={{
                  borderColor: "rgba(255,255,255,0.18)",
                  color: "var(--fg)",
                  bg: "var(--surface)",
                }}
                onClick={onLogin}
              >
                Sign in ↗
              </Button>
            </HStack>
          </M.Box>

          {/* Browser Mockup */}
          <M.Box
            ref={ref}
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            w="100%"
            maxW="920px"
          >
            <Box
              borderRadius="16px"
              border="1px solid var(--border)"
              bg="var(--surface)"
              overflow="hidden"
              boxShadow="0 40px 120px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.025)"
            >
              {/* Chrome bar */}
              <Box
                px={4}
                py={3}
                borderBottom="1px solid var(--border)"
                bg="var(--surface2)"
              >
                <HStack gap={2}>
                  {[0, 1, 2].map((i) => (
                    <Box
                      key={i}
                      w="9px"
                      h="9px"
                      borderRadius="full"
                      bg="rgba(255,255,255,0.07)"
                    />
                  ))}
                  <Box flex={1} mx={3}>
                    <Box
                      bg="var(--surface)"
                      borderRadius="5px"
                      h="20px"
                      display="flex"
                      alignItems="center"
                      px={3}
                    >
                      <Text
                        fontSize="10px"
                        color="var(--fg3)"
                        fontFamily="var(--font-b)"
                      >
                        app.rivets.ai/editor
                      </Text>
                    </Box>
                  </Box>
                </HStack>
              </Box>
              {/* Editor layout */}
              <Flex h={{ base: "260px", md: "400px" }}>
                {/* Left: Prompt panel */}
                <Box
                  w={{ base: "130px", md: "210px" }}
                  borderRight="1px solid var(--border)"
                  bg="var(--bg2)"
                  p={4}
                  flexShrink={0}
                >
                  <Text
                    fontSize="9px"
                    color="var(--fg3)"
                    textTransform="uppercase"
                    letterSpacing="0.1em"
                    mb={3}
                    fontFamily="var(--font-b)"
                  >
                    Prompt
                  </Text>
                  <Box
                    bg="var(--surface)"
                    borderRadius="8px"
                    p={3}
                    border="1px solid rgba(78,205,196,0.18)"
                    mb={3}
                    boxShadow="0 0 18px rgba(78,205,196,0.04)"
                  >
                    <Text
                      fontSize="11px"
                      color="var(--fg2)"
                      lineHeight={1.65}
                      fontFamily="var(--font-b)"
                    >
                      "A clean SaaS landing page for a project management tool,
                      dark theme, professional"
                    </Text>
                  </Box>
                  <Box
                    h="30px"
                    bg="var(--accent)"
                    borderRadius="5px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text
                      fontSize="11px"
                      fontWeight={600}
                      color="#080C10"
                      fontFamily="var(--font-b)"
                    >
                      Generate →
                    </Text>
                  </Box>
                  <Box mt={5}>
                    <Text
                      fontSize="9px"
                      color="var(--fg3)"
                      textTransform="uppercase"
                      letterSpacing="0.1em"
                      mb={3}
                      fontFamily="var(--font-b)"
                    >
                      Chat
                    </Text>
                    {[
                      "Build navbar",
                      "Add hero section",
                      "Make it dark",
                      "Deploy",
                    ].map((l, i) => (
                      <Box
                        key={l}
                        py={1.5}
                        px={2}
                        borderRadius="4px"
                        bg={i === 1 ? "var(--accent-dim)" : "transparent"}
                        mb={0.5}
                      >
                        <Text
                          fontSize="11px"
                          color={i === 1 ? "var(--accent)" : "var(--fg3)"}
                          fontFamily="var(--font-b)"
                        >
                          {l}
                        </Text>
                      </Box>
                    ))}
                  </Box>
                </Box>
                {/* Center: Canvas */}
                <Box
                  flex={1}
                  bg="var(--bg)"
                  position="relative"
                  overflow="hidden"
                  p={6}
                >
                  <Flex justify="space-between" align="center" mb={8}>
                    <Box
                      w="56px"
                      h="7px"
                      bg="var(--surface2)"
                      borderRadius="4px"
                    />
                    <HStack gap={2}>
                      {[36, 28, 22].map((w, i) => (
                        <Box
                          key={i}
                          w={`${w}px`}
                          h="5px"
                          bg="var(--surface2)"
                          borderRadius="3px"
                        />
                      ))}
                    </HStack>
                  </Flex>
                  <VStack
                    gap={3}
                    align="flex-start"
                    maxW="380px"
                    mx="auto"
                    pt={2}
                  >
                    <Box
                      w="78%"
                      h="11px"
                      bg="var(--surface2)"
                      borderRadius="4px"
                    />
                    <Box
                      w="58%"
                      h="11px"
                      bg="var(--surface2)"
                      borderRadius="4px"
                    />
                    <Box
                      w="66%"
                      h="7px"
                      bg="var(--surface)"
                      borderRadius="3px"
                      mt={1}
                    />
                    <Box
                      w="50%"
                      h="7px"
                      bg="var(--surface)"
                      borderRadius="3px"
                    />
                    <HStack gap={2} mt={2}>
                      <Box
                        w="72px"
                        h="22px"
                        bg="var(--accent)"
                        borderRadius="5px"
                        opacity={0.7}
                      />
                      <Box
                        w="72px"
                        h="22px"
                        bg="var(--surface2)"
                        borderRadius="5px"
                      />
                    </HStack>
                  </VStack>
                  {/* Selection ring */}
                  <Box
                    position="absolute"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                    w="300px"
                    h="110px"
                    border="1.5px solid var(--accent)"
                    borderRadius="7px"
                    opacity={0.4}
                    pointerEvents="none"
                  />
                </Box>
              </Flex>
            </Box>
          </M.Box>

          {/* Social Proof */}
          <M.Box
            ref={ref}
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            mt={10}
          >
            <HStack gap={5} justify="center" flexWrap="wrap">
              {/* <Text
                fontSize="12px"
                color="var(--fg3)"
                fontFamily="var(--font-b)"
              >
                Trusted by 12,000+ creators
              </Text>
              <Box w="1px" h="14px" bg="var(--border)" /> */}
              <HStack gap={0.5}>
                {[...Array(5)].map((_, i) => (
                  <Text key={i} color="var(--accent)" fontSize="11px">
                    ★
                  </Text>
                ))}
                <Text
                  fontSize="12px"
                  color="var(--fg3)"
                  ml={1.5}
                  fontFamily="var(--font-b)"
                >
                  4.9 / 5
                </Text>
              </HStack>
              <Box w="1px" h="14px" bg="var(--border)" />
              <Text
                fontSize="12px"
                color="var(--fg3)"
                fontFamily="var(--font-b)"
              >
                No credit card required
              </Text>
            </HStack>
          </M.Box>
        </VStack>
      </Container>
    </Box>
  );
}



function FeaturesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-70px" });
  return (
    <Box py={{ base: "80px", md: "120px" }} bg="var(--bg)">
      <Container maxW="1200px" px={{ base: 5, md: 8 }} ref={ref}>
        <AnimatedSection>
          <Box mb={16} maxW="540px">
            <SectionLabel>Features</SectionLabel>
            <Heading
              fontFamily="var(--font-d)"
              fontWeight={700}
              fontSize={{ base: "32px", md: "44px" }}
              lineHeight={1.15}
              letterSpacing="-0.03em"
              mb={4}
              color="var(--fg)"
            >
              Everything to ship{" "}
              <Box as="span" color="var(--fg2)" fontWeight={400}>
                faster than ever.
              </Box>
            </Heading>
            <Text
              fontSize="16px"
              color="var(--fg2)"
              fontWeight={300}
              lineHeight={1.75}
              fontFamily="var(--font-b)"
            >
              From blank canvas to deployed website in minutes.
            </Text>
          </Box>
        </AnimatedSection>
        <Grid
          templateColumns={{
            base: "1fr",
            md: "repeat(2, 1fr)",
            lg: "repeat(3, 1fr)",
          }}
          gap={4}
        >
          {FEATURES.map((f, i) => (
            <M.Box
              key={f.label}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.08 * i }}
            >
              <Box
                p={6}
                borderRadius="12px"
                h="100%"
                border={`1px solid ${f.accent ? "rgba(78,205,196,0.22)" : "var(--border)"}`}
                bg={f.accent ? "var(--accent-dim)" : "var(--surface)"}
                position="relative"
                overflow="hidden"
                _hover={{
                  borderColor: f.accent
                    ? "rgba(78,205,196,0.4)"
                    : "rgba(255,255,255,0.1)",
                  transform: "translateY(-2px)",
                }}
                transition="all 0.22s ease"
              >
                {f.accent && (
                  <Box
                    position="absolute"
                    top={0}
                    left={0}
                    right={0}
                    h="1px"
                    bg="linear-gradient(90deg, transparent, var(--accent), transparent)"
                  />
                )}
                <Box
                  w="34px"
                  h="34px"
                  borderRadius="8px"
                  bg={f.accent ? "rgba(78,205,196,0.12)" : "var(--surface2)"}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  mb={4}
                >
                  <f.icon
                    size={16}
                    color={f.accent ? "var(--accent)" : "var(--fg2)"}
                  />
                </Box>
                <Text
                  fontSize="10px"
                  color={f.accent ? "var(--accent)" : "var(--fg3)"}
                  textTransform="uppercase"
                  letterSpacing="0.1em"
                  mb={2}
                  fontWeight={500}
                  fontFamily="var(--font-b)"
                >
                  {f.label}
                </Text>
                <Heading
                  fontFamily="var(--font-d)"
                  fontSize="17px"
                  fontWeight={600}
                  letterSpacing="-0.02em"
                  mb={2}
                  lineHeight={1.3}
                  color="var(--fg)"
                >
                  {f.title}
                </Heading>
                <Text
                  fontSize="13px"
                  color="var(--fg2)"
                  fontWeight={300}
                  lineHeight={1.75}
                  fontFamily="var(--font-b)"
                >
                  {f.desc}
                </Text>
              </Box>
            </M.Box>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}


function HowItWorksSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-70px" });
  return (
    <Box
      py={{ base: "80px", md: "120px" }}
      bg="var(--bg2)"
      borderTop="1px solid var(--border)"
      borderBottom="1px solid var(--border)"
    >
      <Container maxW="1200px" px={{ base: 5, md: 8 }} ref={ref}>
        <AnimatedSection>
          <Box mb={14}>
            <Text color="var(--accent)">How it works</Text>
            <Heading
              fontFamily="var(--font-d)"
              fontWeight={700}
              fontSize={{ base: "32px", md: "44px" }}
              lineHeight={1.15}
              letterSpacing="-0.03em"
              color="var(--fg)"
            >
              From idea to live site{" "}
              <Box as="span" color="var(--fg2)" fontWeight={400}>
                in four steps.
              </Box>
            </Heading>
          </Box>
        </AnimatedSection>
        <VStack gap={3} align="stretch">
          {STEPS.map((s, i) => (
            <M.Box
              key={s.n}
              initial={{ opacity: 0, x: -16 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.09 }}
            >
              <Flex
                direction={{ base: "column", md: "row" }}
                gap={6}
                p={6}
                borderRadius="12px"
                bg="var(--surface)"
                border="1px solid var(--border)"
                align={{ base: "flex-start", md: "center" }}
                _hover={{ borderColor: "rgba(255,255,255,0.1)" }}
                transition="border-color 0.2s"
              >
                <Text
                  fontFamily="var(--font-d)"
                  fontSize={{ base: "40px", md: "56px" }}
                  fontWeight={800}
                  color="var(--surface2)"
                  lineHeight={1}
                  letterSpacing="-0.04em"
                  flexShrink={0}
                  style={{ WebkitTextStroke: "1px rgba(78,205,196,0.15)" }}
                >
                  {s.n}
                </Text>
                <Box>
                  <Heading
                    fontFamily="var(--font-d)"
                    fontSize="19px"
                    fontWeight={600}
                    letterSpacing="-0.02em"
                    mb={1.5}
                    color="var(--fg)"
                  >
                    {s.title}
                  </Heading>
                  <Text
                    fontSize="14px"
                    color="var(--fg2)"
                    fontWeight={300}
                    lineHeight={1.75}
                    maxW="560px"
                    fontFamily="var(--font-b)"
                  >
                    {s.desc}
                  </Text>
                </Box>
              </Flex>
            </M.Box>
          ))}
        </VStack>
      </Container>
    </Box>
  );
}


function TestimonialsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <Box py={{ base: "80px", md: "120px" }} bg="var(--bg)">
      <Container maxW="1200px" px={{ base: 5, md: 8 }} ref={ref}>
        <AnimatedSection>
          <Box mb={14}>
            <SectionLabel>Testimonials</SectionLabel>
            <Heading
              fontFamily="var(--font-d)"
              fontWeight={700}
              fontSize={{ base: "32px", md: "44px" }}
              lineHeight={1.15}
              letterSpacing="-0.03em"
              color="var(--fg)"
            >
              Loved by builders.{" "}
              <Box as="span" color="var(--fg2)" fontWeight={400}>
                Trusted by teams.
              </Box>
            </Heading>
          </Box>
        </AnimatedSection>
        <Grid
          templateColumns={{
            base: "1fr",
            md: "repeat(2, 1fr)",
            lg: "repeat(3, 1fr)",
          }}
          gap={4}
        >
          {TESTIMONIALS.map((t, i) => (
            <M.Box
              key={t.name}
              initial={{ opacity: 0, y: 18 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: 0.05 * i }}
            >
              <Box
                p={6}
                borderRadius="12px"
                bg="var(--surface)"
                border="1px solid var(--border)"
                h="100%"
                _hover={{
                  borderColor: "rgba(255,255,255,0.1)",
                  transform: "translateY(-2px)",
                }}
                transition="all 0.2s ease"
              >
                <HStack gap={0.5} mb={4}>
                  {[...Array(5)].map((_, j) => (
                    <Text key={j} fontSize="11px" color="var(--accent)">
                      ★
                    </Text>
                  ))}
                </HStack>
                <Text
                  fontSize="14px"
                  color="var(--fg2)"
                  fontWeight={300}
                  lineHeight={1.78}
                  mb={5}
                  fontStyle="italic"
                  fontFamily="var(--font-b)"
                >
                  "{t.q}"
                </Text>
                <HStack gap={3}>
                  <Box
                    w="34px"
                    h="34px"
                    borderRadius="full"
                    bg="var(--surface2)"
                    border="1px solid var(--border)"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flexShrink={0}
                  >
                    <Text
                      fontSize="10px"
                      fontWeight={600}
                      color="var(--fg2)"
                      fontFamily="var(--font-d)"
                    >
                      {t.initials}
                    </Text>
                  </Box>
                  <Box>
                    <Text
                      fontSize="13px"
                      fontWeight={500}
                      color="var(--fg)"
                      fontFamily="var(--font-b)"
                    >
                      {t.name}
                    </Text>
                    <Text
                      fontSize="11px"
                      color="var(--fg3)"
                      fontFamily="var(--font-b)"
                    >
                      {t.role}
                    </Text>
                  </Box>
                </HStack>
              </Box>
            </M.Box>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}


function CTASection({ onStart }: { onStart: () => void }) {
  return (
    <Box py={{ base: "80px", md: "120px" }} bg="var(--bg)">
      <Container maxW="1200px" px={{ base: 5, md: 8 }}>
        <AnimatedSection>
          <Box
            borderRadius="20px"
            border="1px solid rgba(78,205,196,0.14)"
            bg="var(--surface)"
            p={{ base: 10, md: 20 }}
            textAlign="center"
            position="relative"
            overflow="hidden"
          >
            <Box
              position="absolute"
              bottom="-80px"
              left="50%"
              transform="translateX(-50%)"
              w="700px"
              h="350px"
              background="radial-gradient(ellipse, rgba(78,205,196,0.07) 0%, transparent 68%)"
              pointerEvents="none"
            />
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              h="1px"
              bg="linear-gradient(90deg, transparent, rgba(78,205,196,0.28), transparent)"
            />
            <VStack gap={6} position="relative">
              <Heading
                fontFamily="var(--font-d)"
                fontWeight={800}
                fontSize={{ base: "38px", md: "62px" }}
                lineHeight={1.08}
                letterSpacing="-0.04em"
                color="var(--fg)"
              >
                Start building today.
                <br />
                <Box as="span" color="var(--accent)">
                  It's free.
                </Box>
              </Heading>
              <Text
                fontSize={{ base: "15px", md: "17px" }}
                color="var(--fg2)"
                fontWeight={300}
                maxW="420px"
                lineHeight={1.75}
                fontFamily="var(--font-b)"
              >
                No credit card. No setup. Just describe your website and watch
                it appear.
              </Text>
              <HStack gap={3} pt={2} flexWrap="wrap" justify="center">
                <Button
                  size="lg"
                  px={8}
                  h="48px"
                  fontSize="15px"
                  bg="var(--accent)"
                  color="#080C10"
                  fontWeight={600}
                  fontFamily="var(--font-b)"
                  borderRadius="8px"
                  _hover={{
                    bg: "#62D5CD",
                    transform: "translateY(-1px)",
                    boxShadow: "0 8px 24px rgba(78,205,196,0.3)",
                  }}
                  _active={{ transform: "translateY(0)" }}
                  transition="all 0.2s ease"
                  onClick={onStart}
                >
                  Create your site — free
                </Button>
              </HStack>
              {/* <Text
                fontSize="12px"
                color="var(--fg3)"
                fontFamily="var(--font-b)"
              >
                12,000+ sites built this month
              </Text> */}
            </VStack>
          </Box>
        </AnimatedSection>
      </Container>
    </Box>
  );
}


const FOOTER_LINKS: Record<string, string[]> = {
  Product: ["Features", "Pricing", "Changelog", "Roadmap"],
  // Resources: ["Docs", "Blog", "Examples", "Templates"],
  // Company: ["About", "Careers", "Press", "Contact"],
  // Legal: ["Privacy", "Terms", "Cookies"],
};

function Footer() {
  return (
    <Box borderTop="1px solid var(--border)" py={16} bg="var(--bg)">
      <Container maxW="1200px" px={{ base: 5, md: 8 }}>
        <Flex
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          gap={12}
          mb={14}
        >
          <Box maxW="220px">
            <HStack gap={2} mb={4}>
              <Box
                w="22px"
                h="22px"
                borderRadius="6px"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Cog size={24} color="var(--accent)" />
              </Box>
              <Text
                fontFamily="var(--font-d)"
                fontWeight={700}
                fontSize="15px"
                color="var(--fg)"
              >
                RivetsAI
              </Text>
            </HStack>
            <Text
              fontSize="13px"
              color="var(--fg3)"
              fontWeight={300}
              lineHeight={1.75}
              fontFamily="var(--font-b)"
            >
              Build beautiful websites with AI. No code required.
            </Text>
          </Box>
          <Grid
            templateColumns="repeat(4, 1fr)"
            gap={8}
            display={{ base: "none", md: "grid" }}
          >
            {Object.entries(FOOTER_LINKS).map(([cat, items]) => (
              <Box key={cat}>
                <Text
                  fontSize="10px"
                  color="var(--fg)"
                  fontWeight={500}
                  textTransform="uppercase"
                  letterSpacing="0.1em"
                  mb={4}
                  fontFamily="var(--font-b)"
                >
                  {cat}
                </Text>
                <VStack align="flex-start" gap={2.5}>
                  {items.map((item) => (
                    <Text
                      key={item}
                      fontSize="13px"
                      color="var(--fg3)"
                      fontWeight={300}
                      cursor="pointer"
                      _hover={{ color: "var(--fg2)" }}
                      transition="color 0.15s"
                      fontFamily="var(--font-b)"
                    >
                      {item}
                    </Text>
                  ))}
                </VStack>
              </Box>
            ))}
          </Grid>
        </Flex>
        <Flex
          borderTop="1px solid var(--border)"
          pt={8}
          justify="space-between"
          align="center"
          direction={{ base: "column", md: "row" }}
          gap={4}
        >
          <Text fontSize="12px" color="var(--fg3)" fontFamily="var(--font-b)">
            © 2025 RivetsAI. All rights reserved.
          </Text>
          <HStack gap={5}>
            {["Twitter", "GitHub", "LinkedIn"].map((s) => (
              <Text
                key={s}
                fontSize="12px"
                color="var(--fg3)"
                cursor="pointer"
                _hover={{ color: "var(--fg2)" }}
                transition="color 0.15s"
                fontFamily="var(--font-b)"
              >
                {s}
              </Text>
            ))}
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
}



interface LandingPageProps {
  onStart: () => void;
  onSeeDemo: () => void;
  onLogin: () => void;
}

export const LandingPage = ({ onStart, onLogin }: LandingPageProps) => {
  return (
    <Box
      bg="var(--bg)"
      color="var(--fg)"
      w="100vw"     
      h="100vh"           
      overflowY="auto"
      overflowX="hidden"
      position="relative" 
    >
      <Navbar onLogin={onLogin} onStart={onStart} />
      <Hero onStart={onStart} onLogin={onLogin} />
      <FeaturesSection />
      <HowItWorksSection />
      {/* <TestimonialsSection /> */}
      <CTASection onStart={onStart} />
      <Footer />
    </Box>
  );
};
