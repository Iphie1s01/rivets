import { Box, Text, IconButton, HStack, Tooltip } from "@chakra-ui/react";
import { useProjectStore } from "@/store/useProjectStore";
import {
  Download,
  Undo2,
  Redo2,
  Pencil,
  Save,
  Maximize,
  ExternalLink,
} from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase";

export const PreviewPanel = () => {
  const { currentCode, setCurrentCode, undo, redo, past, future, projectId } =
    useProjectStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const supabase = createClient();

  // Script to inject for visual editing
  const EDIT_SCRIPT = `
    <script id="rivets-edit-script">
      let selectedElement = null;
      let toolbar = null;

      const FONT_LIST = [
        'Inherit', 'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 
        'Arial', 'Helvetica', 'Verdana', 'Georgia', 'serif', 'sans-serif', 
        'Playfair Display', 'Merriweather', 'Lora', 'Oswald', 'Poppins',
        'Source Code Pro', 'Courier New', 'Monospace', 'Comic Sans MS', 'Impact'
      ];

      const GRADIENT_PRESETS = [
        { name: 'Sunset', val: 'linear-gradient(45deg, #FF512F 0%, #DD2476 100%)' },
        { name: 'Ocean', val: 'linear-gradient(45deg, #2193b0 0%, #6dd5ed 100%)' },
        { name: 'Purple', val: 'linear-gradient(45deg, #834d9b 0%, #d04ed6 100%)' },
        { name: 'Lush', val: 'linear-gradient(45deg, #56ab2f 0%, #a8e063 100%)' },
        { name: 'Fire', val: 'linear-gradient(45deg, #f12711 0%, #f5af19 100%)' },
        { name: 'Frost', val: 'linear-gradient(45deg, #00c6ff 0%, #0072ff 100%)' },
        { name: 'Night', val: 'linear-gradient(45deg, #232526 0%, #414345 100%)' },
        { name: 'Peach', val: 'linear-gradient(45deg, #ed4264 0%, #ffedbc 100%)' },
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
         toolbar.style.cssText = 'position: absolute; background: linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(15, 15, 15, 0.98) 100%); color: white; padding: 16px; border-radius: 16px; z-index: 2147483647; display: none; box-shadow: 0 12px 48px rgba(0,0,0,0.8), 0 0 0 1px rgba(0, 240, 255, 0.15) inset; font-family: system-ui, -apple-system, sans-serif; gap: 20px; align-items: flex-start; border: 1px solid rgba(0, 240, 255, 0.2); flex-wrap: wrap; max-width: 95vw; backdrop-filter: blur(20px); user-select: none; transform: translateX(-50%); transition: top 0.25s cubic-bezier(0.4, 0, 0.2, 1), left 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s;';
         
         const createSection = (label) => {
             const div = document.createElement('div');
             div.style.cssText = 'display: flex; flex-direction: column; gap: 8px; border-right: 1px solid rgba(0, 240, 255, 0.15); padding-right: 16px; padding-left: 4px; min-width: 70px;';
             const span = document.createElement('span');
             span.innerText = label;
             span.style.cssText = 'font-size: 10px; text-transform: uppercase; color: rgba(0, 240, 255, 0.7); font-weight: 800; letter-spacing: 1px; text-shadow: 0 0 10px rgba(0, 240, 255, 0.3);';
             div.appendChild(span);
             return div;
         };

         const createRow = () => {
             const r = document.createElement('div');
             r.style.cssText = 'display: flex; align-items: center; gap: 10px;';
             return r;
         }

         // --- COMPONENT ADDER ---
         const addSection = createSection('Add');
         const addBtn = document.createElement('select');
         addBtn.style.cssText = 'background: rgba(0, 240, 255, 0.1); color: #00f0ff; border: 1px solid rgba(0, 240, 255, 0.3); border-radius: 8px; padding: 6px 10px; font-size: 11px; outline: none; cursor: pointer; transition: all 0.2s; font-weight: 500;';
         const eOptions = ['+ Add', 'Button', 'Text', 'Heading', 'Checkbox', 'Radio', 'Input', 'Textarea', 'Container', 'Link'];
         eOptions.forEach(el => {
            const opt = document.createElement('option'); opt.value = el; opt.innerText = el; addBtn.appendChild(opt);
         });
         addBtn.onchange = (e) => {
            const type = e.target.value; if(type === '+ Add') return;
            insertElement(type); addBtn.value = '+ Add';
         };
         addBtn.onmousedown = (e) => e.stopPropagation();
         addSection.appendChild(addBtn);

         // --- COLORS ---
         const colorSection = createSection('Color');
         const colorRow = createRow();
         const fg = createColorInput('Text');
         fg.input.oninput = (e) => { if(selectedElement) selectedElement.style.color = e.target.value; };
         const bg = createColorInput('Fill');
         bg.input.oninput = (e) => { if(selectedElement) selectedElement.style.backgroundColor = e.target.value; };
         colorRow.appendChild(fg.wrapper); colorRow.appendChild(bg.wrapper);
         colorSection.appendChild(colorRow);

         // --- GRADIENTS ---
         const gradSection = createSection('Gradients');
         const gradRow = createRow();
         gradRow.style.flexWrap = 'wrap'; gradRow.style.maxWidth = '100px';
         GRADIENT_PRESETS.forEach(g => {
             const btn = document.createElement('div'); btn.title = g.name;
             btn.style.cssText = 'width: 22px; height: 22px; border-radius: 50%; cursor: pointer; border: 2px solid rgba(0, 240, 255, 0.3); transition: all 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.3);';
             if(g.val === 'none') {
                 btn.style.background = '#333'; btn.innerHTML = '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(45deg);width:1px;height:12px;background:red;"></div>';
                 btn.style.position = 'relative';
             } else btn.style.background = g.val;
             btn.onclick = (e) => { e.stopPropagation(); if(selectedElement) selectedElement.style.background = g.val; };
             btn.onmousedown = (e) => e.stopPropagation();
             btn.onmouseover = () => { btn.style.transform = 'scale(1.15)'; btn.style.boxShadow = '0 4px 12px rgba(0, 240, 255, 0.4)'; };
             btn.onmouseout = () => { btn.style.transform = 'scale(1)'; btn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)'; };
             gradRow.appendChild(btn);
         });
         gradSection.appendChild(gradRow);

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
             btn.style.cssText = 'background: rgba(0, 240, 255, 0.1); color: #00f0ff; border: 1px solid rgba(0, 240, 255, 0.3); border-radius: 6px; width: 26px; height: 26px; font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;';
             btn.onclick = (e) => { e.stopPropagation(); if(selectedElement) selectedElement.style[a.prop] = a.val; };
             btn.onmouseover = () => { btn.style.background = 'rgba(0, 240, 255, 0.2)'; btn.style.borderColor = 'rgba(0, 240, 255, 0.5)'; };
             btn.onmouseout = () => { btn.style.background = 'rgba(0, 240, 255, 0.1)'; btn.style.borderColor = 'rgba(0, 240, 255, 0.3)'; };
             btn.onmousedown = (e) => e.stopPropagation();
             alignRow1.appendChild(btn);
         });
         const alignRow2 = createRow();
         const vAligns = [
             { icon: '⇡', title: 'Top', val: 'flex-start' },
             { icon: '↕', title: 'Middle', val: 'center' },
             { icon: '⇣', title: 'Bottom', val: 'flex-end' }
         ];
         vAligns.forEach(a => {
             const btn = document.createElement('button');
             btn.innerHTML = a.icon; btn.title = a.title;
             btn.style.cssText = 'background: rgba(0, 240, 255, 0.1); color: #00f0ff; border: 1px solid rgba(0, 240, 255, 0.3); border-radius: 6px; width: 26px; height: 26px; font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;';
             btn.onclick = (e) => { 
                 e.stopPropagation(); 
                 if(!selectedElement) return;
                 selectedElement.style.display = 'flex';
                 selectedElement.style.flexDirection = 'column';
                 selectedElement.style.justifyContent = a.val;
             };
             btn.onmouseover = () => { btn.style.background = 'rgba(0, 240, 255, 0.2)'; btn.style.borderColor = 'rgba(0, 240, 255, 0.5)'; };
             btn.onmouseout = () => { btn.style.background = 'rgba(0, 240, 255, 0.1)'; btn.style.borderColor = 'rgba(0, 240, 255, 0.3)'; };
             btn.onmousedown = (e) => e.stopPropagation();
             alignRow2.appendChild(btn);
         });
         alignSection.appendChild(alignRow1);
         alignSection.appendChild(alignRow2);

         // --- SHAPE ---
         const shapeSection = createSection('Border');
         const radiusInput = document.createElement('input');
         radiusInput.type = 'range'; radiusInput.min = '0'; radiusInput.max = '50'; radiusInput.value = '0';
         radiusInput.style.cssText = 'width: 80px; height: 6px; accent-color: #00f0ff; cursor: pointer; border-radius: 3px;';
         radiusInput.oninput = (e) => { if(selectedElement) selectedElement.style.borderRadius = e.target.value + 'px'; };
         radiusInput.onmousedown = (e) => e.stopPropagation();
         
         const borderRow = createRow();
         const bSize = document.createElement('input');
         bSize.style.cssText = 'width: 38px; background: rgba(0, 240, 255, 0.05); border: 1px solid rgba(0, 240, 255, 0.3); color: #00f0ff; border-radius: 6px; padding: 4px; font-size: 11px; text-align: center; outline: none;';
         const bColor = document.createElement('input');
         bColor.style.cssText = 'width: 26px; height: 26px; border: 2px solid rgba(0, 240, 255, 0.3); border-radius: 6px; background: none; cursor: pointer;';
         const updateBorder = () => { if(selectedElement) selectedElement.style.border = \`\${bSize.value || 0}px solid \${bColor.value}\`; };
         bSize.oninput = updateBorder; bColor.oninput = updateBorder;
         bSize.onmousedown = (e) => e.stopPropagation();
         borderRow.appendChild(bSize); borderRow.appendChild(bColor);
         shapeSection.appendChild(radiusInput); shapeSection.appendChild(borderRow);

         // --- TYPOGRAPHY ---
         const typeSection = createSection('Font');
         const fontRow = createRow();
         const fontWeight = document.createElement('select');
         fontWeight.style.cssText = 'background: rgba(0, 240, 255, 0.05); color: #00f0ff; border: 1px solid rgba(0, 240, 255, 0.3); border-radius: 6px; padding: 4px 6px; font-size: 11px; outline: none; cursor: pointer;';
         [300, 400, 500, 600, 700, 800, 900].forEach(w => {
            const opt = document.createElement('option'); opt.value = w; opt.innerText = w; fontWeight.appendChild(opt);
         });
         fontWeight.onchange = (e) => { if(selectedElement) selectedElement.style.fontWeight = e.target.value; };
         fontWeight.onmousedown = (e) => e.stopPropagation();
         const fontSelect = document.createElement('select');
         fontSelect.style.cssText = 'background: rgba(0, 240, 255, 0.05); color: #00f0ff; border: 1px solid rgba(0, 240, 255, 0.3); border-radius: 6px; padding: 4px 6px; font-size: 11px; max-width: 90px; outline: none; cursor: pointer;';
         FONT_LIST.forEach(f => {
            const opt = document.createElement('option'); opt.value = f==='Inherit'?'':f; opt.innerText = f; fontSelect.appendChild(opt);
         });
         fontSelect.onchange = (e) => { if(selectedElement) selectedElement.style.fontFamily = e.target.value; };
         fontSelect.onmousedown = (e) => e.stopPropagation();
         fontRow.appendChild(fontSelect); fontRow.appendChild(fontWeight);
         typeSection.appendChild(fontRow);

         // --- VARIANTS (for Buttons) ---
         const variantSection = createSection('Variant');
         variantSection.style.display = 'none';
         const vRow = createRow();
         const variants = [
             { name: 'Solid', style: { background: '#3b82f6', color: 'white', border: 'none' } },
             { name: 'Outline', style: { background: 'transparent', color: '#3b82f6', border: '2px solid #3b82f6' } },
             { name: 'Ghost', style: { background: 'transparent', color: '#3b82f6', border: 'none' } }
         ];
         variants.forEach(v => {
             const vBtn = document.createElement('button');
             vBtn.innerText = v.name;
             vBtn.style.cssText = 'background: rgba(0, 240, 255, 0.1); color: #00f0ff; border: 1px solid rgba(0, 240, 255, 0.3); border-radius: 6px; padding: 4px 10px; font-size: 10px; cursor: pointer; transition: all 0.2s; font-weight: 500;';
             vBtn.onclick = (e) => {
                 e.stopPropagation(); if(!selectedElement) return;
                 Object.assign(selectedElement.style, v.style);
             };
             vBtn.onmouseover = () => { vBtn.style.background = 'rgba(0, 240, 255, 0.2)'; vBtn.style.borderColor = 'rgba(0, 240, 255, 0.5)'; };
             vBtn.onmouseout = () => { vBtn.style.background = 'rgba(0, 240, 255, 0.1)'; vBtn.style.borderColor = 'rgba(0, 240, 255, 0.3)'; };
             vBtn.onmousedown = (e) => e.stopPropagation();
             vRow.appendChild(vBtn);
         });
         variantSection.appendChild(vRow);

         // --- ACTIONS ---
         const actSection = document.createElement('div');
         actSection.style.cssText = 'display: flex; gap: 10px; margin-left: 8px; border-left: 1px solid rgba(0, 240, 255, 0.15); padding-left: 16px; align-self: stretch; align-items: center;';
         actSection.appendChild(createActionButton('✥', 'Drag', toggleDrag));
         actSection.appendChild(createActionButton('⤡', 'Resize', toggleResize));
         actSection.appendChild(createActionButton('🗑', 'Delete', () => { if(selectedElement) { selectedElement.remove(); toolbar.style.display = 'none'; } }));

         toolbar.appendChild(addSection); toolbar.appendChild(colorSection); toolbar.appendChild(gradSection);
         toolbar.appendChild(alignSection);
         toolbar.appendChild(shapeSection); toolbar.appendChild(typeSection); 
         toolbar.appendChild(variantSection);
         toolbar.appendChild(actSection);
         document.body.appendChild(toolbar);
      }

      function repositionToolbar(el) {
          if(!toolbar || !el) return;
          const rect = el.getBoundingClientRect();
          const scrollY = window.scrollY;
          const scrollX = window.scrollX;
          
          const tHeight = toolbar.offsetHeight || 80;
          let top = rect.top + scrollY - tHeight - 15; // Place above with gap
          if (top < scrollY + 10) {
              top = rect.bottom + scrollY + 15; // Place below if no space above
          }
          
          let left = rect.left + scrollX + (rect.width / 2);
          
          toolbar.style.top = \`\${top}px\`;
          toolbar.style.left = \`\${left}px\`;
          toolbar.style.display = 'flex';
          
          // Ensure it stays in view (since we use translateX(-50%), 'left' is the center)
          setTimeout(() => {
              const tRect = toolbar.getBoundingClientRect();
              if (tRect.left < 10) toolbar.style.left = \`\${tRect.width / 2 + 10}px\`;
              if (tRect.right > window.innerWidth - 10) toolbar.style.left = \`\${window.innerWidth - tRect.width / 2 - 10}px\`;
          }, 0);
      }

      function createColorInput(label) {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'display: flex; flex-direction: column; align-items: center; gap: 4px;';
        const input = document.createElement('input');
        input.type = 'color';
        input.style.cssText = 'width: 32px; height: 32px; border: 2px solid rgba(0, 240, 255, 0.3); padding: 0; background: none; cursor: pointer; border-radius: 8px;';
        const subLabel = document.createElement('span');
        subLabel.innerText = label; subLabel.style.fontSize = '9px'; subLabel.style.opacity = '0.7'; subLabel.style.color = 'rgba(0, 240, 255, 0.8)';
        wrapper.appendChild(input); wrapper.appendChild(subLabel);
        return { wrapper, input };
      }

       function createActionButton(icon, title, onClick) {
          const btn = document.createElement('button');
          btn.innerHTML = icon; btn.title = title;
          btn.style.cssText = 'background: rgba(0, 240, 255, 0.1); color: #00f0ff; border: 1px solid rgba(0, 240, 255, 0.3); border-radius: 8px; width: 32px; height: 32px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; transition: all 0.2s;';
          btn.onclick = (e) => { e.stopPropagation(); onClick(e, btn); };
          btn.onmouseover = () => { btn.style.background = 'rgba(0, 240, 255, 0.2)'; btn.style.borderColor = 'rgba(0, 240, 255, 0.5)'; btn.style.transform = 'scale(1.05)'; };
          btn.onmouseout = () => { btn.style.background = 'rgba(0, 240, 255, 0.1)'; btn.style.borderColor = 'rgba(0, 240, 255, 0.3)'; btn.style.transform = 'scale(1)'; };
          btn.onmousedown = (e) => e.stopPropagation();
          return btn;
       }

      function insertElement(type) {
        const el = document.createElement(
            type === 'Button' ? 'button' : 
            type === 'Heading' ? 'h2' : 
            type === 'Text' ? 'p' : 
            type === 'Input' ? 'input' : 
            type === 'Textarea' ? 'textarea' : 
            type === 'Checkbox' ? 'input' : 
            type === 'Radio' ? 'input' : 
            type === 'Link' ? 'a' : 'div'
        );
        if(type === 'Checkbox') el.type = 'checkbox';
        if(type === 'Radio') el.type = 'radio';
        if(type === 'Button') {
            el.innerText = 'New Button';
            el.style.cssText = 'padding: 10px 20px; border-radius: 8px; border: none; background: #3b82f6; color: white; cursor: pointer; font-family: inherit;';
        }
        if(type === 'Heading') el.innerText = 'New Heading';
        if(type === 'Text') el.innerText = 'New paragraph text...';
        if(type === 'Link') { el.innerText = 'New Link'; el.href = '#'; }
        if(type === 'Container') el.style.cssText = 'padding: 20px; border: 1px dashed rgba(255,255,255,0.2); min-height: 50px; background: rgba(255,255,255,0.02); border-radius: 8px;';
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
            btn.style.background = 'rgba(59, 130, 246, 0.4)';
        }
      }

      function toggleResize(e, btn) {
        if(!selectedElement) return;
        if(selectedElement.style.resize === 'both') {
            selectedElement.style.resize = '';
            selectedElement.style.overflow = '';
            btn.style.background = 'rgba(255,255,255,0.05)';
        } else {
            selectedElement.style.resize = 'both';
            selectedElement.style.overflow = 'hidden';
            btn.style.background = 'rgba(59, 130, 246, 0.4)';
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
          if(selectedElement) { selectedElement.style.outline = 'none'; selectedElement.style.cursor = ''; delete selectedElement.dataset.draggable; }
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
           selectedElement.style.outline = '2px solid #3b82f6';
           if(toolbar) {
               repositionToolbar(selectedElement);
               const s = window.getComputedStyle(selectedElement);
               const ci = toolbar.querySelectorAll('input[type="color"]');
               if(ci[0]) ci[0].value = rgbToHex(s.color);
               if(ci[1]) ci[1].value = rgbToHex(s.backgroundColor);
               const ri = toolbar.querySelector('input[type="range"]'); if(ri) ri.value = parseInt(s.borderRadius) || 0;
               const fs = toolbar.querySelectorAll('select');
               if(fs[2]) {
                    const fam = s.fontFamily.toLowerCase();
                    for(let i=0; i<fs[2].options.length; i++) {
                        if(fs[2].options[i].value && fam.includes(fs[2].options[i].value.toLowerCase())) { fs[2].value = fs[2].options[i].value; break; }
                    }
               }

               // Show/Hide Variant Section
               const sections = toolbar.querySelectorAll('div > span');
               let vs = null;
               for(let span of sections) { 
                   if(span.innerText.toUpperCase() === 'VARIANT') vs = span.parentElement; 
               }
               if(vs) vs.style.display = selectedElement.tagName === 'BUTTON' ? 'flex' : 'none';
           }
        }
      });
      window.addEventListener('scroll', () => { if(selectedElement && toolbar && toolbar.style.display !== 'none') repositionToolbar(selectedElement); });
      window.addEventListener('resize', () => { if(selectedElement && toolbar && toolbar.style.display !== 'none') repositionToolbar(selectedElement); });

    </script>
  `;

  // Inject script into code without saving it to store permanent record
  // We place it before </body>
  const displayCode = currentCode.replace("</body>", `${EDIT_SCRIPT}</body>`);

  useEffect(() => {
    const handler = async (event: MessageEvent) => {
      if (event.data.type === "SAVE_CODE" && event.data.html) {
        // The script removed itself, so the HTML is clean
        setCurrentCode(event.data.html);
        setIsEditing(false);

        // PERSIST TO DB
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
      // We are TURNING OFF editing -> Request code to save
      iframeRef.current?.contentWindow?.postMessage(
        { type: "REQUEST_CODE" },
        "*",
      );
    } else {
      // We are TURNING ON editing
      setIsEditing(true);
      // Timeout to allow potential re-render if needed, though usually not with direct ref
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

  // Monitor fullscreen changes
  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const handleDownload = async () => {
    const zip = new JSZip();
    zip.file("index.html", currentCode);
    zip.file(
      "README.md",
      `# RivetsAI Generated Project\n\nTo run this project:\n1. Open index.html in your browser.\n2. That's it!`,
    );
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "rivets-project.zip");
  };

  return (
    <Box h="full" w="full" bg="white" position="relative">
      <iframe
        ref={iframeRef}
        srcDoc={displayCode}
        style={{ width: "100%", height: "100%", border: "none" }}
        title="Live Preview"
        sandbox="allow-scripts allow-modals allow-same-origin allow-forms allow-popups"
      />
      <HStack position="absolute" top={4} right={4} gap={2}>
        <HStack bg="black" p={1} borderRadius="md" boxShadow="lg" gap={1}>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <IconButton
                aria-label="Undo"
                onClick={undo}
                disabled={past.length === 0 || isEditing}
                size="xs"
                variant="ghost"
                color="white"
                _hover={{ bg: "whiteAlpha.200" }}
                _disabled={{ opacity: 0.3, cursor: "not-allowed" }}
              >
                <Undo2 size={14} />
              </IconButton>
            </Tooltip.Trigger>
            <Tooltip.Positioner>
              <Tooltip.Content>Undo</Tooltip.Content>
            </Tooltip.Positioner>
          </Tooltip.Root>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <IconButton
                aria-label="Redo"
                onClick={redo}
                disabled={future.length === 0 || isEditing}
                size="xs"
                variant="ghost"
                color="white"
                _hover={{ bg: "whiteAlpha.200" }}
                _disabled={{ opacity: 0.3, cursor: "not-allowed" }}
              >
                <Redo2 size={14} />
              </IconButton>
            </Tooltip.Trigger>
            <Tooltip.Positioner>
              <Tooltip.Content>Redo</Tooltip.Content>
            </Tooltip.Positioner>
          </Tooltip.Root>
        </HStack>

        <HStack bg="black" p={1} borderRadius="md" boxShadow="lg">
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <IconButton
                aria-label={isEditing ? "Save Edits" : "Visual Edit"}
                onClick={toggleEdit}
                size="xs"
                variant="ghost"
                color={isEditing ? "green.300" : "white"}
                _hover={{ bg: "whiteAlpha.200" }}
              >
                {isEditing ? <Save size={14} /> : <Pencil size={14} />}
              </IconButton>
            </Tooltip.Trigger>
            <Tooltip.Positioner>
              <Tooltip.Content>
                {isEditing ? "Save Changes" : "Visual Edit"}
              </Tooltip.Content>
            </Tooltip.Positioner>
          </Tooltip.Root>
        </HStack>

        <Box bg="black" p={1} borderRadius="md" boxShadow="lg">
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <IconButton
                aria-label="Open in New Tab"
                onClick={handleOpenNewTab}
                size="xs"
                variant="ghost"
                color="white"
                _hover={{ bg: "whiteAlpha.200" }}
              >
                <ExternalLink size={14} />
              </IconButton>
            </Tooltip.Trigger>
            <Tooltip.Positioner>
              <Tooltip.Content>Open in New Tab</Tooltip.Content>
            </Tooltip.Positioner>
          </Tooltip.Root>
        </Box>

        <Box bg="black" px={3} py={2} borderRadius="md" boxShadow="lg">
          <Text fontSize="xs" color="white" fontWeight="bold">
            Live Preview
          </Text>
        </Box>
        <IconButton
          aria-label="Download Project"
          onClick={handleDownload}
          bg="black"
          color="white"
          _hover={{ bg: "gray.800" }}
          borderRadius="md"
          boxShadow="lg"
          size="sm"
        >
          <Download size={16} />
        </IconButton>
      </HStack>
    </Box>
  );
};
