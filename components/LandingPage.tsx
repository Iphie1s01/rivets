"use client";

import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Icon,
  Stack,
  Text,
  VStack,
  SimpleGrid,
} from "@chakra-ui/react";
import {
  Cog,
  MessageSquare,
  Rocket,
  CheckCircle2,
  ArrowRight,
  Play,
} from "lucide-react";
import { FaCog } from "react-icons/fa";
import { motion } from "framer-motion";

const MotionBox = motion(Box);
const MotionHeading = motion(Heading);
const MotionText = motion(Text);

interface LandingPageProps {
  onStart: () => void;
  onSeeDemo: () => void;
  onLogin: () => void;
}

export const LandingPage = ({
  onStart,
  onSeeDemo,
  onLogin,
}: LandingPageProps) => {
  return (
    <Box
      bg="black"
      color="white"
      minH="100vh"
      overflowY="auto"
      className="animate-slide-in"
    >
      {/* Navbar */}
      <Flex
        as="nav"
        align="center"
        justify="space-between"
        wrap="wrap"
        padding="1.5rem"
        bg="black"
        color="white"
        position="sticky"
        top="0"
        zIndex="100"
        borderBottom="1px solid rgba(255, 255, 255, 0.05)"
        backdropFilter="blur(10px)"
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

        <HStack gap={6}>
          <Button
            variant="ghost"
            color="whiteAlpha.800"
            _hover={{ color: "white" }}
            display={{ base: "none", md: "inline-flex" }}
          >
            Features
          </Button>
          <Button
            variant="ghost"
            color="whiteAlpha.800"
            _hover={{ color: "white" }}
            display={{ base: "none", md: "inline-flex" }}
          >
            Pricing
          </Button>
          <Button
            variant="outline"
            borderColor="whiteAlpha.300"
            _hover={{ bg: "whiteAlpha.100" }}
            onClick={onLogin}
          >
            Sign In
          </Button>
          <Button className="btn-primary" px={6} onClick={onStart}>
            Get Started
          </Button>
        </HStack>
      </Flex>

      {/* Hero Section */}
      <Container maxW="container.xl" pt={20} pb={32}>
        <VStack gap={8} textAlign="center" maxW="800px" mx="auto">
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Text
              color="brand.blue"
              fontSize="sm"
              fontWeight="bold"
              textTransform="uppercase"
              letterSpacing="widest"
              mb={4}
              className="glow-text"
            >
              The Future of Web Development
            </Text>
            <Heading as="h1" size="4xl" lineHeight="shorter" mb={6}>
              Build websites by <br />
              <span className="gradient-text">chatting with AI.</span>
            </Heading>
            <Text fontSize="xl" color="whiteAlpha.700" mb={10}>
              No code. No setup. No frustration. <br />
              Just type your vision and watch RivetsAI build it in seconds.
            </Text>
            <Stack
              direction={{ base: "column", sm: "row" }}
              gap={4}
              justify="center"
            >
              <Button
                size="lg"
                h="64px"
                px={10}
                fontSize="lg"
                className="btn-primary"
                onClick={onStart}
              >
                Try RivetsAI (Free){" "}
                <ArrowRight size={20} style={{ marginLeft: "8px" }} />
              </Button>
              <Button
                size="lg"
                h="64px"
                px={10}
                fontSize="lg"
                variant="outline"
                borderColor="whiteAlpha.300"
                _hover={{ bg: "whiteAlpha.100" }}
                onClick={onSeeDemo}
              >
                <Play size={20} style={{ marginRight: "8px" }} /> See Demo
              </Button>
            </Stack>
          </MotionBox>
        </VStack>

        {/* Hero Background Glow */}
        <Box
          position="absolute"
          top="-10%"
          left="50%"
          transform="translateX(-50%)"
          w="600px"
          h="600px"
          bg="rgba(0, 240, 255, 0.1)"
          filter="blur(150px)"
          borderRadius="full"
          zIndex="-1"
        />
      </Container>

      {/* How it works */}
      <Box py={24} bg="whiteAlpha.50">
        <Container maxW="container.xl">
          <VStack gap={16}>
            <VStack gap={4} textAlign="center">
              <Heading size="2xl">How it works</Heading>
              <Text color="whiteAlpha.600" fontSize="lg">
                Go from idea to live site in minutes.
              </Text>
            </VStack>

            <SimpleGrid columns={{ base: 1, md: 3 }} gap={10} w="full">
              {[
                {
                  icon: MessageSquare,
                  title: "1. Describe your site",
                  text: "Tell RivetsAI what you need. A portfolio, a landing page, or a full store.",
                },
                {
                  icon: Cog,
                  title: "2. RivetsAI generates it",
                  text: "Watch in real-time as the layout, styles, and content come to life.",
                },
                {
                  icon: Rocket,
                  title: "3. Refine & deploy",
                  text: "Ask for changes, tweak the design visually, and launch it to the world.",
                },
              ].map((step, i) => (
                <VStack
                  key={i}
                  p={8}
                  bg="whiteAlpha.50"
                  borderRadius="2xl"
                  align="flex-start"
                  gap={4}
                  className="glass-panel-enhanced hover-lift"
                  border="1px solid rgba(255, 255, 255, 0.05)"
                >
                  <Icon as={step.icon} w={8} h={8} color="blue.400" />
                  <Heading size="lg">{step.title}</Heading>
                  <Text color="whiteAlpha.600">{step.text}</Text>
                </VStack>
              ))}
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* Benefits */}
      <Container maxW="container.xl" py={32}>
        <SimpleGrid columns={{ base: 1, lg: 2 }} gap={16} alignContent="center">
          <MotionBox
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <VStack align="flex-start" gap={8}>
              <Heading size="2xl">Zero friction entry.</Heading>
              <Text fontSize="xl" color="whiteAlpha.700">
                Sign up only when you're ready. Start building right now with
                guest mode and see the value for yourself.
              </Text>
              <VStack align="flex-start" gap={4}>
                {[
                  "No credit card required",
                  "Instant live preview",
                  "Intelligent layout generation",
                  "Built-in visual editor",
                ].map((item, i) => (
                  <HStack key={i} gap={4}>
                    <Icon as={CheckCircle2} color="green.400" w={6} h={6} />
                    <Text fontSize="lg">{item}</Text>
                  </HStack>
                ))}
              </VStack>
              <Button
                size="lg"
                className="btn-primary"
                h="60px"
                px={8}
                onClick={onStart}
              >
                Experience RivetsAI
              </Button>
            </VStack>
          </MotionBox>

          <MotionBox
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-panel-enhanced"
            p={1}
            borderRadius="3xl"
            overflow="hidden"
            position="relative"
          >
            <Box
              bg="black"
              borderRadius="2xl"
              h="400px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              backgroundImage="url('https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=1200')"
              backgroundSize="cover"
              backgroundPosition="center"
              opacity={0.6}
            >
              <Box textAlign="center">
                <Button
                  bg="white"
                  color="black"
                  _hover={{ bg: "whiteAlpha.800" }}
                  size="lg"
                >
                  <Play style={{ marginRight: "8px" }} /> Watch Video
                </Button>
              </Box>
            </Box>
          </MotionBox>
        </SimpleGrid>
      </Container>

      {/* Final CTA */}
      <Box py={32} textAlign="center">
        <Container maxW="container.xl">
          <VStack
            gap={8}
            className="glass-panel-enhanced"
            py={20}
            borderRadius="3xl"
          >
            <Heading size="3xl">Ready to build something?</Heading>
            <Text fontSize="xl" color="whiteAlpha.600">
              Join thousands of creators using RivetsAI to ship faster.
            </Text>
            <Button
              size="lg"
              h="70px"
              px={12}
              fontSize="xl"
              className="btn-primary"
              onClick={onStart}
            >
              Start Building For Free
            </Button>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
};
