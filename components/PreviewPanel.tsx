import { Box, Text, IconButton, Button, HStack, Tooltip } from "@chakra-ui/react";
import { useProjectStore } from "@/store/useProjectStore";
import {
  Download,
  Undo2,
  Redo2,
  Pencil,
  Save,
  ExternalLink,
  Monitor,
} from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase";

export const PreviewPanel = () => {
  const { currentCode, setCurrentCode, undo, redo, past, future, projectId } =
    useProjectStore();
  const [isEditing, setIsEditing] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const supabase = createClient();

  // Script to inject for visual editing
  const EDIT_SCRIPT = `
    <script id="rivets-edit-script">
      let selectedElement = null;
      let toolbar = null;

      const FONT_LIST = [
        'Inherit', 'Syne', 'DM Sans', 'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 
        'Arial', 'Helvetica', 'Verdana', 'Georgia', 'serif', 'sans-serif'
      ];

      const GRADIENT_PRESETS = [
        { name: 'Rivets', val: 'linear-gradient(135deg, #4ECDC4 0%, #2CB5AC 100%)' },
        { name: 'Sunset', val: 'linear-gradient(45deg, #FF512F 0%, #DD2476 100%)' },
        { name: 'Ocean', val: 'linear-gradient(45deg, #2193b0 0%, #6dd5ed 100%)' },
        { name: 'Purple', val: 'linear-gradient(45deg, #834d9b 0%, #d04ed6 100%)' },
        { name: 'Night', val: 'linear-gradient(45deg, #232526 0%, #414345 100%)' },
        { name: 'None', val: 'none' }
      ];

      function rgbToHex(rgb) {
        if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return '#000000';
        if (rgb.startsWith('#')) return rgb;
        if(rgb.startsWith('rgba')) {
            const parts = rgb.match(/([\\d\\.]+)/g);
            if(!parts || parts.length < 3) return '#000000';
            rgb = \`rgb(\${parts[0]}, \${parts[1]}, \${parts[2]})\`;
        }
        const rgbValues = rgb.match(/\\d+/g);
        if (!rgbValues) return '#000000';
        return "#" + ((1 << 24) + (parseInt(rgbValues[0]) << 16) + (parseInt(rgbValues[1]) << 8) + parseInt(rgbValues[2])).toString(16).slice(1);
      }

      function createToolbar() {
         if(document.getElementById('rivets-toolbar')) return;
         toolbar = document.createElement('div');
         toolbar.id = 'rivets-toolbar';
         toolbar.contentEditable = "false";
         toolbar.style.cssText = 'position: absolute; background: rgba(15, 23, 33, 0.95); color: #EDF2F7; padding: 14px; border-radius: 12px; z-index: 2147483647; display: none; box-shadow: 0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(78, 205, 196, 0.2) inset; font-family: "DM Sans", system-ui, sans-serif; gap: 16px; align-items: flex-start; border: 1px solid rgba(78, 205, 196, 0.3); backdrop-filter: blur(20px); user-select: none; transform: translateX(-50%); transition: top 0.2s ease, left 0.2s ease;';
         
         const createSection = (label) => {
             const div = document.createElement('div');
             div.style.cssText = 'display: flex; flex-direction: column; gap: 6px; border-right: 1px solid rgba(255, 255, 255, 0.08); padding-right: 14px; min-width: 60px;';
             const span = document.createElement('span');
             span.innerText = label;
             span.style.cssText = 'font-size: 9px; text-transform: uppercase; color: #4ECDC4; font-weight: 700; letter-spacing: 0.05em; opacity: 0.8;';
             div.appendChild(span);
             return div;
         };

         const createRow = () => {
             const r = document.createElement('div');
             r.style.cssText = 'display: flex; align-items: center; gap: 8px;';
             return r;
         }

         // --- COMPONENT ADDER ---
         const addSection = createSection('Add');
         const addBtn = document.createElement('select');
         addBtn.style.cssText = 'background: rgba(255, 255, 255, 0.04); color: #EDF2F7; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 6px; padding: 5px 8px; font-size: 11px; outline: none; cursor: pointer;';
         const eOptions = ['+ Element', 'Button', 'Text', 'Heading', 'Input', 'Container'];
         eOptions.forEach(el => {
            const opt = document.createElement('option'); opt.value = el; opt.innerText = el; addBtn.appendChild(opt);
         });
         addBtn.onchange = (e) => {
            const type = e.target.value; if(type === '+ Element') return;
            insertElement(type); addBtn.value = '+ Element';
         };
         addBtn.onmousedown = (e) => e.stopPropagation();
         addSection.appendChild(addBtn);

         // --- COLORS ---
         const colorSection = createSection('Colors');
         const colorRow = createRow();
         const fg = createColorInput('Text');
         fg.input.oninput = (e) => { if(selectedElement) selectedElement.style.color = e.target.value; };
         const bg = createColorInput('Fill');
         bg.input.oninput = (e) => { if(selectedElement) selectedElement.style.backgroundColor = e.target.value; };
         colorRow.appendChild(fg.wrapper); colorRow.appendChild(bg.wrapper);
         colorSection.appendChild(colorRow);

         // --- ALIGN ---
         const alignSection = createSection('Align');
         const alignRow1 = createRow();
         const hAligns = [
             { icon: '⇠', title: 'Left', prop: 'textAlign', val: 'left' },
             { icon: '↔', title: 'Center', prop: 'textAlign', val: 'center' },
             { icon: '⇢', title: 'Right', prop: 'textAlign', val: 'right' }
         ];
         hAligns.forEach(a => {
             const btn = document.createElement('button');
             btn.innerHTML = a.icon; btn.title = a.title;
             btn.style.cssText = 'background: rgba(255, 255, 255, 0.04); color: #EDF2F7; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 5px; width: 24px; height: 24px; font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: center;';
             btn.onclick = (e) => { e.stopPropagation(); if(selectedElement) selectedElement.style[a.prop] = a.val; };
             btn.onmousedown = (e) => e.stopPropagation();
             alignRow1.appendChild(btn);
         });
         alignSection.appendChild(alignRow1);

         // --- ACTIONS ---
         const actSection = document.createElement('div');
         actSection.style.cssText = 'display: flex; gap: 8px; margin-left: 4px; align-self: center;';
         actSection.appendChild(createActionButton('✥', 'Drag', toggleDrag));
         actSection.appendChild(createActionButton('🗑', 'Delete', () => { if(selectedElement) { selectedElement.remove(); toolbar.style.display = 'none'; } }));

         toolbar.appendChild(addSection); toolbar.appendChild(colorSection); 
         toolbar.appendChild(alignSection);
         toolbar.appendChild(actSection);
         document.body.appendChild(toolbar);
      }

      function repositionToolbar(el) {
          if(!toolbar || !el) return;
          const rect = el.getBoundingClientRect();
          const scrollY = window.scrollY;
          const scrollX = window.scrollX;
          
          const tHeight = toolbar.offsetHeight || 60;
          let top = rect.top + scrollY - tHeight - 12;
          if (top < scrollY + 10) top = rect.bottom + scrollY + 12;
          
          let left = rect.left + scrollX + (rect.width / 2);
          toolbar.style.top = \`\${top}px\`;
          toolbar.style.left = \`\${left}px\`;
          toolbar.style.display = 'flex';
      }

      function createColorInput(label) {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'display: flex; flex-direction: column; align-items: center; gap: 3px;';
        const input = document.createElement('input');
        input.type = 'color';
        input.style.cssText = 'width: 24px; height: 24px; border: 1px solid rgba(255, 255, 255, 0.15); padding: 0; background: none; cursor: pointer; border-radius: 4px;';
        const subLabel = document.createElement('span');
        subLabel.innerText = label; subLabel.style.fontSize = '8px'; subLabel.style.opacity = '0.5';
        wrapper.appendChild(input); wrapper.appendChild(subLabel);
        return { wrapper, input };
      }

       function createActionButton(icon, title, onClick) {
          const btn = document.createElement('button');
          btn.innerHTML = icon; btn.title = title;
          btn.style.cssText = 'background: rgba(255,255,255,0.05); color: #EDF2F7; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; width: 28px; height: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px;';
          btn.onclick = (e) => { e.stopPropagation(); onClick(e, btn); };
          btn.onmousedown = (e) => e.stopPropagation();
          return btn;
       }

      function insertElement(type) {
        const el = document.createElement(
            type === 'Button' ? 'button' : 
            type === 'Heading' ? 'h2' : 
            type === 'Text' ? 'p' : 
            type === 'Input' ? 'input' : 'div'
        );
        if(type === 'Button') {
            el.innerText = 'New Button';
            el.style.cssText = 'padding: 10px 20px; border-radius: 8px; border: none; background: #4ECDC4; color: #080C10; cursor: pointer; font-family: inherit; font-weight: 600;';
        }
        if(type === 'Heading') { el.innerText = 'New Heading'; el.style.fontFamily = 'Syne, sans-serif'; }
        if(type === 'Text') el.innerText = 'New paragraph text...';
        if(type === 'Container') el.style.cssText = 'padding: 40px; border: 1px dashed rgba(78,205,196,0.3); min-height: 100px; background: rgba(78,205,196,0.03); border-radius: 12px;';
        el.style.margin = '10px';
        const container = (selectedElement && ['DIV', 'SECTION', 'MAIN', 'BODY'].includes(selectedElement.tagName)) ? selectedElement : document.body;
        container.appendChild(el);
      }

      function toggleDrag(e, btn) {
        if(!selectedElement) return;
        if(selectedElement.dataset.draggable) {
            delete selectedElement.dataset.draggable;
            selectedElement.removeEventListener('mousedown', onElementMouseDown);
            selectedElement.style.cursor = '';
            btn.style.background = 'rgba(255,255,255,0.05)';
        } else {
            selectedElement.dataset.draggable = 'true';
            selectedElement.addEventListener('mousedown', onElementMouseDown);
            selectedElement.style.cursor = 'move';
            btn.style.background = 'rgba(78, 205, 196, 0.4)';
        }
      }

      let isDragging = false;
      let startX, startY, initialLeft, initialTop, draggedEl = null;

      const onMouseMove = (e) => {
         if (!isDragging || !draggedEl) return;
         draggedEl.style.left = \`\${initialLeft + (e.clientX - startX)}px\`;
         draggedEl.style.top = \`\${initialTop + (e.clientY - startY)}px\`;
      };
      const onMouseUp = () => { isDragging = false; draggedEl = null; document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp); };
      const onElementMouseDown = (e) => {
         if (e.target.closest('#rivets-toolbar')) return;
         const el = e.currentTarget; if (!el.dataset.draggable) return;
         e.preventDefault(); isDragging = true; draggedEl = el; startX = e.clientX; startY = e.clientY;
         const c = window.getComputedStyle(el); if (c.position === 'static') el.style.position = 'relative';
         initialLeft = parseFloat(c.left) || 0; initialTop = parseFloat(c.top) || 0;
         document.addEventListener('mousemove', onMouseMove); document.addEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('message', (event) => {
        if (event.data.type === 'TOGGLE_EDIT') {
          document.body.contentEditable = event.data.isEditing;
          if (event.data.isEditing) { createToolbar(); } 
          else { if(toolbar) toolbar.style.display = 'none'; if(selectedElement) selectedElement.style.outline = 'none'; selectedElement = null; }
        }
        if (event.data.type === 'REQUEST_CODE') {
          if(toolbar) toolbar.remove();
          if(selectedElement) { selectedElement.style.outline = 'none'; selectedElement.style.cursor = ''; }
          document.body.removeAttribute('contenteditable');
          const myScript = document.getElementById('rivets-edit-script');
          if(myScript) myScript.remove();
          window.parent.postMessage({ type: 'SAVE_CODE', html: document.documentElement.outerHTML }, '*');
        }
      });

      document.addEventListener('click', (e) => {
        if (document.body.isContentEditable) {
           if(e.target.closest('#rivets-toolbar')) return;
           e.preventDefault(); e.stopPropagation();
           if (selectedElement) selectedElement.style.outline = 'none';
           selectedElement = e.target;
           selectedElement.style.outline = '2px solid #4ECDC4';
           if(toolbar) {
               repositionToolbar(selectedElement);
               const s = window.getComputedStyle(selectedElement);
               const ci = toolbar.querySelectorAll('input[type="color"]');
               if(ci[0]) ci[0].value = rgbToHex(s.color);
               if(ci[1]) ci[1].value = rgbToHex(s.backgroundColor);
           }
        }
      });
      window.addEventListener('scroll', () => { if(selectedElement && toolbar && toolbar.style.display !== 'none') repositionToolbar(selectedElement); });
    </script>
  `;

  const displayCode = currentCode.replace("</body>", `${EDIT_SCRIPT}</body>`);

  useEffect(() => {
    const handler = async (event: MessageEvent) => {
      if (event.data.type === "SAVE_CODE" && event.data.html) {
        setCurrentCode(event.data.html);
        setIsEditing(false);
        if (projectId) {
          await supabase
            .from("projects")
            .update({
              current_code: event.data.html,
              updated_at: new Date().toISOString(),
            })
            .eq("id", projectId);
        }
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [setCurrentCode, projectId]);

  const toggleEdit = () => {
    if (isEditing) {
      iframeRef.current?.contentWindow?.postMessage({ type: "REQUEST_CODE" }, "*");
    } else {
      setIsEditing(true);
      setTimeout(() => {
        iframeRef.current?.contentWindow?.postMessage(
          { type: "TOGGLE_EDIT", isEditing: true },
          "*",
        );
      }, 100);
    }
  };

  const handleOpenNewTab = () => {
    const blob = new Blob([currentCode], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  const handleDownload = async () => {
    const zip = new JSZip();
    zip.file("index.html", currentCode);
    zip.file("README.md", `# RivetsAI Project\n\nOpen index.html to view your website.`);
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "rivets-project.zip");
  };

  return (
    <Box h="full" w="full" bg="#0B1015" position="relative" overflow="hidden">
      {/* Container with shadow logic to look like a frame */}
      <Box 
        position="absolute" 
        inset={0} 
        bg="white"
        p={0}
      >
        <iframe
          ref={iframeRef}
          srcDoc={displayCode}
          style={{ width: "100%", height: "100%", border: "none" }}
          title="Live Preview"
          sandbox="allow-scripts allow-modals allow-same-origin allow-forms allow-popups"
        />
      </Box>

      {/* Main Toolbar */}
      <HStack 
        position="absolute" 
        bottom={6} 
        left="50%" 
        transform="translateX(-50%)"
        bg="rgba(15, 23, 33, 0.85)"
        backdropFilter="blur(16px)"
        border="1px solid rgba(78, 205, 196, 0.2)"
        px={4} 
        py={2} 
        borderRadius="14px"
        boxShadow="0 10px 30px rgba(0,0,0,0.4)"
        gap={3}
        zIndex={100}
      >
        <HStack gap={1} borderRight="1px solid rgba(255,255,255,0.1)" pr={2}>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <IconButton
                aria-label="Undo"
                onClick={undo}
                disabled={past.length === 0 || isEditing}
                size="sm"
                variant="ghost"
                color="var(--fg)"
                _hover={{ bg: "var(--surface)" }}
                _disabled={{ opacity: 0.2 }}
              >
                <Undo2 size={16} />
              </IconButton>
            </Tooltip.Trigger>
            <Tooltip.Positioner><Tooltip.Content>Undo</Tooltip.Content></Tooltip.Positioner>
          </Tooltip.Root>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <IconButton
                aria-label="Redo"
                onClick={redo}
                disabled={future.length === 0 || isEditing}
                size="sm"
                variant="ghost"
                color="var(--fg)"
                _hover={{ bg: "var(--surface)" }}
                _disabled={{ opacity: 0.2 }}
              >
                <Redo2 size={16} />
              </IconButton>
            </Tooltip.Trigger>
            <Tooltip.Positioner><Tooltip.Content>Redo</Tooltip.Content></Tooltip.Positioner>
          </Tooltip.Root>
        </HStack>

        <HStack gap={2}>
          <Button
            size="sm"
            // leftIcon={isEditing ? <Save size={15} /> : <Pencil size={15} />}
            onClick={toggleEdit}
            bg={isEditing ? "var(--accent)" : "var(--surface)"}
            color={isEditing ? "#080C10" : "var(--fg)"}
            border="1px solid"
            borderColor={isEditing ? "var(--accent)" : "var(--border)"}
            _hover={{ 
              bg: isEditing ? "#62D5CD" : "var(--surface2)",
              transform: "translateY(-1px)"
            }}
            borderRadius="8px"
            fontSize="12px"
            fontWeight={600}
            fontFamily="var(--font-b)"
            transition="all 0.2s"
          >
            {isEditing ? "Save Edits" : "Visual Edit"}
          </Button>

          <IconButton
            aria-label="Open in New Tab"
            onClick={handleOpenNewTab}
            size="sm"
            variant="ghost"
            bg="var(--surface)"
            color="var(--fg)"
            borderColor="var(--border)"
            border="1px solid"
            _hover={{ bg: "var(--surface2)" }}
            borderRadius="8px"
          >
            <ExternalLink size={15} />
          </IconButton>
        </HStack>

        <Box w="1px" h="20px" bg="rgba(255,255,255,0.1)" />

        <Button
          onClick={handleDownload}
          size="sm"
          variant="outline"
          borderColor="rgba(78, 205, 196, 0.4)"
          color="var(--accent)"
          _hover={{ bg: "var(--accent-dim)" }}
          borderRadius="8px"
          // leftIcon={<Download size={15} />}
          fontSize="12px"
          fontFamily="var(--font-b)"
        >
          Export
        </Button>
      </HStack>

      {/* Badge */}
      <HStack
        position="absolute"
        top={4}
        left={4}
        bg="rgba(15, 23, 33, 0.7)"
        backdropFilter="blur(10px)"
        border="1px solid rgba(255,255,255,0.08)"
        px={3}
        py={1.5}
        borderRadius="full"
        gap={2}
      >
        <Monitor size={12} color="var(--accent)" />
        <Text fontSize="10px" fontWeight={700} color="var(--fg2)" fontFamily="var(--font-b)" letterSpacing="0.05em">
          LIVE PREVIEW
        </Text>
      </HStack>
    </Box>
  );
};
