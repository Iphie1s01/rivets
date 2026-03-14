import { Box, Text, IconButton, Button, HStack, Tooltip } from "@chakra-ui/react";
import { useProjectStore } from "@/store/useProjectStore";
import {
  Download,
  Undo2,
  Redo2,
  Save,
  ExternalLink,
  Monitor,
  Pencil,
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

  // ─── Injected Edit Script ─────────────────────────────────────────────────
  const EDIT_SCRIPT = `
<script id="rivets-edit-script">
(function() {
  // ── State ──────────────────────────────────────────────────────────────────
  let selectedEl = null;
  let toolbar    = null;
  let activeTab  = 'style';

  // ── Helpers ────────────────────────────────────────────────────────────────
  const FONTS = ['Inherit','Syne','DM Sans','Inter','Roboto','Open Sans',
                 'Lato','Montserrat','Playfair Display','Georgia','serif','sans-serif'];

  function px(val) { return parseFloat(val) || 0; }

  function rgbToHex(rgb) {
    if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return '#000000';
    if (rgb.startsWith('#')) return rgb;
    const parts = rgb.match(/[\\d\\.]+/g);
    if (!parts || parts.length < 3) return '#000000';
    return '#' + [parts[0], parts[1], parts[2]]
      .map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
  }

  // What "category" is this element?
  function getCategory(el) {
    const tag = el.tagName.toLowerCase();
    if (['img','picture','svg','canvas','video'].includes(tag)) return 'image';
    if (tag === 'button' || (tag === 'a' && el.getAttribute('role') === 'button')) return 'button';
    if (['p','span','label','li','td','th','caption','blockquote','pre','code'].includes(tag)) return 'text';
    if (['h1','h2','h3','h4','h5','h6'].includes(tag)) return 'heading';
    if (['div','section','article','main','header','footer','aside','nav','ul','ol','form','fieldset'].includes(tag)) return 'container';
    return 'generic';
  }

  // Which tabs are shown per category
  const TAB_MAP = {
    text:      ['style', 'typography', 'border', 'spacing'],
    heading:   ['style', 'typography', 'border', 'spacing'],
    button:    ['style', 'typography', 'border', 'spacing'],
    image:     ['style', 'border', 'spacing'],
    container: ['style', 'border', 'layout', 'spacing'],
    generic:   ['style', 'border', 'spacing'],
  };

  const TAB_LABELS = {
    style:      '✦ Style',
    typography: 'Aa Type',
    border:     '⬡ Border',
    layout:     '⊞ Layout',
    spacing:    '↔ Space',
  };

  // ── DOM Builders ───────────────────────────────────────────────────────────
  function mkEl(tag, css, attrs = {}) {
    const e = document.createElement(tag);
    if (css) e.style.cssText = css;
    Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
    return e;
  }

  function mkLabel(text) {
    const s = mkEl('span', 'font-size:9px;text-transform:uppercase;color:#4ECDC4;font-weight:700;letter-spacing:.06em;opacity:.75;display:block;margin-bottom:4px;');
    s.textContent = text;
    return s;
  }

  function mkRow(gap = 8) {
    return mkEl('div', 'display:flex;align-items:center;gap:' + gap + 'px;flex-wrap:wrap;');
  }

  function mkNumInput(val, unit, min, max, onChange) {
    const wrap = mkEl('div', 'display:flex;align-items:center;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:6px;overflow:hidden;');
    const inp = mkEl('input', 'width:36px;background:none;border:none;outline:none;color:#EDF2F7;font-size:11px;padding:4px 4px;text-align:center;', { type: 'number', min: min, max: max, value: val });
    const unitLbl = mkEl('span', 'font-size:9px;color:#4ECDC4;padding:0 5px 0 0;opacity:.8;');
    unitLbl.textContent = unit;
    inp.oninput = (e) => { e.stopPropagation(); onChange(e.target.value); };
    inp.onmousedown = (e) => e.stopPropagation();
    wrap.appendChild(inp); wrap.appendChild(unitLbl);
    return { wrap, inp };
  }

  function mkSelect(options, current, onChange) {
    const s = mkEl('select', 'background:rgba(255,255,255,.04);color:#EDF2F7;border:1px solid rgba(255,255,255,.1);border-radius:6px;padding:4px 6px;font-size:11px;outline:none;cursor:pointer;max-width:130px;');
    options.forEach(o => {
      const opt = document.createElement('option');
      opt.value = o; opt.textContent = o;
      if (o === current) opt.selected = true;
      s.appendChild(opt);
    });
    s.onchange = (e) => { e.stopPropagation(); onChange(e.target.value); };
    s.onmousedown = (e) => e.stopPropagation();
    return s;
  }

  function mkColorSwatch(labelText, initVal, onChange) {
    const wrap = mkEl('div', 'display:flex;flex-direction:column;align-items:center;gap:3px;');
    const inp = mkEl('input', 'width:26px;height:26px;border:1px solid rgba(255,255,255,.15);padding:0;background:none;cursor:pointer;border-radius:5px;', { type: 'color', value: initVal });
    const lbl = mkEl('span', 'font-size:8px;color:#aaa;');
    lbl.textContent = labelText;
    inp.oninput = (e) => { e.stopPropagation(); onChange(e.target.value); };
    inp.onmousedown = (e) => e.stopPropagation();
    wrap.appendChild(inp); wrap.appendChild(lbl);
    return { wrap, inp };
  }

  function mkIconBtn(icon, title, onClick, active) {
    const bg = active ? 'rgba(78,205,196,.35)' : 'rgba(255,255,255,.05)';
    const bc = active ? 'rgba(78,205,196,.6)' : 'rgba(255,255,255,.1)';
    const b = mkEl('button',
      'background:' + bg + ';color:#EDF2F7;border:1px solid ' + bc + ';border-radius:5px;width:26px;height:26px;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s;'
    );
    b.innerHTML = icon; b.title = title;
    b.onclick = (e) => { e.stopPropagation(); onClick(e, b); };
    b.onmousedown = (e) => e.stopPropagation();
    return b;
  }

  // ── Tab Pane Builders ──────────────────────────────────────────────────────

  // STYLE tab — colors, size, opacity, actions
  function buildStylePane(s) {
    const pane = mkEl('div', 'display:flex;flex-direction:column;gap:10px;');

    // Colors
    const clrRow = mkRow(10);
    const fg = mkColorSwatch('Text', rgbToHex(s.color), v => selectedEl && (selectedEl.style.color = v));
    const bg = mkColorSwatch('Fill', rgbToHex(s.backgroundColor), v => selectedEl && (selectedEl.style.backgroundColor = v));
    clrRow.appendChild(fg.wrap); clrRow.appendChild(bg.wrap);

    // Opacity
    const opRow = mkRow(6);
    const opInp = mkEl('input', 'width:90px;accent-color:#4ECDC4;cursor:pointer;', { type: 'range', min: '0', max: '1', step: '0.05', value: s.opacity || 1 });
    const opVal = mkEl('span', 'font-size:10px;color:#aaa;min-width:28px;');
    opVal.textContent = parseFloat(s.opacity || 1).toFixed(2);
    opInp.oninput = (e) => {
      e.stopPropagation();
      if (selectedEl) { selectedEl.style.opacity = e.target.value; opVal.textContent = parseFloat(e.target.value).toFixed(2); }
    };
    opInp.onmousedown = (e) => e.stopPropagation();
    opRow.appendChild(opInp); opRow.appendChild(opVal);

    // Size
    const szRow = mkRow(8);
    const wInp = mkNumInput(px(s.width) || '', 'W', 0, 9999, v => selectedEl && (selectedEl.style.width = v ? v + 'px' : ''));
    const hInp = mkNumInput(px(s.height) || '', 'H', 0, 9999, v => selectedEl && (selectedEl.style.height = v ? v + 'px' : ''));
    szRow.appendChild(wInp.wrap); szRow.appendChild(hInp.wrap);

    // Cursor
    const cursorSel = mkSelect(['default','pointer','text','move','not-allowed','crosshair','grab'],
      s.cursor || 'default',
      v => selectedEl && (selectedEl.style.cursor = v));

    // Actions
    const actRow = mkRow(6);
    actRow.appendChild(mkIconBtn('✥', 'Toggle drag', toggleDrag));
    actRow.appendChild(mkIconBtn('⎘', 'Duplicate', () => {
      if (selectedEl) {
        const clone = selectedEl.cloneNode(true);
        selectedEl.parentNode.insertBefore(clone, selectedEl.nextSibling);
      }
    }));
    actRow.appendChild(mkIconBtn('🗑', 'Delete', () => {
      if (selectedEl) { selectedEl.remove(); hideToolbar(); }
    }));

    pane.appendChild(mkLabel('Colors'));    pane.appendChild(clrRow);
    pane.appendChild(mkLabel('Opacity'));   pane.appendChild(opRow);
    pane.appendChild(mkLabel('Size'));      pane.appendChild(szRow);
    pane.appendChild(mkLabel('Cursor'));    pane.appendChild(cursorSel);
    pane.appendChild(mkLabel('Actions'));   pane.appendChild(actRow);
    return pane;
  }

  // TYPOGRAPHY tab
  function buildTypographyPane(s) {
    const pane = mkEl('div', 'display:flex;flex-direction:column;gap:10px;');

    const fontSel = mkSelect(FONTS,
      s.fontFamily ? s.fontFamily.split(',')[0].trim().replace(/['"]/g,'') : 'Inherit',
      v => selectedEl && (selectedEl.style.fontFamily = v === 'Inherit' ? '' : v));

    // Size + weight
    const swRow = mkRow(8);
    const szInp = mkNumInput(px(s.fontSize) || 16, 'px', 6, 200,
      v => selectedEl && (selectedEl.style.fontSize = v + 'px'));
    const weightSel = mkSelect(['100','200','300','400','500','600','700','800','900'],
      s.fontWeight || '400',
      v => selectedEl && (selectedEl.style.fontWeight = v));
    swRow.appendChild(szInp.wrap); swRow.appendChild(weightSel);

    // Line-height + letter-spacing
    const lsRow = mkRow(8);
    const lhVal = parseFloat(s.lineHeight) || 1.5;
    const lhInp = mkNumInput(lhVal, 'lh', 0.5, 5,
      v => selectedEl && (selectedEl.style.lineHeight = v));
    const lsInp = mkNumInput(px(s.letterSpacing) || 0, 'ls', -5, 20,
      v => selectedEl && (selectedEl.style.letterSpacing = v + 'px'));
    lsRow.appendChild(lhInp.wrap); lsRow.appendChild(lsInp.wrap);

    // Style toggles (bold / italic / underline / strikethrough)
    const styleRow = mkRow(4);
    styleRow.appendChild(mkIconBtn('<b style="font-family:serif">B</b>', 'Bold',
      () => selectedEl && (selectedEl.style.fontWeight = s.fontWeight === '700' ? '400' : '700'),
      s.fontWeight === '700'));
    styleRow.appendChild(mkIconBtn('<i>I</i>', 'Italic',
      () => selectedEl && (selectedEl.style.fontStyle = s.fontStyle === 'italic' ? '' : 'italic'),
      s.fontStyle === 'italic'));
    styleRow.appendChild(mkIconBtn('<u>U</u>', 'Underline',
      () => selectedEl && (selectedEl.style.textDecoration = s.textDecoration.includes('underline') ? '' : 'underline'),
      s.textDecoration.includes('underline')));
    styleRow.appendChild(mkIconBtn('<s>S</s>', 'Strikethrough',
      () => selectedEl && (selectedEl.style.textDecoration = s.textDecoration.includes('line-through') ? '' : 'line-through'),
      s.textDecoration.includes('line-through')));

    // Alignment
    const alignRow = mkRow(4);
    [['⇤','left'],['↔','center'],['⇥','right'],['≡','justify']].forEach(function(pair) {
      alignRow.appendChild(mkIconBtn(pair[0], 'Align ' + pair[1],
        () => selectedEl && (selectedEl.style.textAlign = pair[1]),
        s.textAlign === pair[1]));
    });

    // Transform
    const transformSel = mkSelect(['none','uppercase','lowercase','capitalize'],
      s.textTransform || 'none',
      v => selectedEl && (selectedEl.style.textTransform = v));

    pane.appendChild(mkLabel('Font Family'));        pane.appendChild(fontSel);
    pane.appendChild(mkLabel('Size & Weight'));      pane.appendChild(swRow);
    pane.appendChild(mkLabel('Line-height & Tracking')); pane.appendChild(lsRow);
    pane.appendChild(mkLabel('Style'));              pane.appendChild(styleRow);
    pane.appendChild(mkLabel('Align'));              pane.appendChild(alignRow);
    pane.appendChild(mkLabel('Transform'));          pane.appendChild(transformSel);
    return pane;
  }

  // BORDER tab
  function buildBorderPane(s) {
    const pane = mkEl('div', 'display:flex;flex-direction:column;gap:10px;');

    // Radius — four corners + link toggle
    const radRow = mkRow(6);
    let linked = true;
    const corners = [
      ['tl','borderTopLeftRadius'],
      ['tr','borderTopRightRadius'],
      ['bl','borderBottomLeftRadius'],
      ['br','borderBottomRightRadius'],
    ];
    const radInputs = corners.map(function(pair) {
      const inp = mkNumInput(px(s[pair[1]]) || 0, pair[0], 0, 200, function(v) {
        if (!selectedEl) return;
        if (linked) {
          selectedEl.style.borderRadius = v + 'px';
          radInputs.forEach(function(r) { r.inp.value = v; });
        } else {
          selectedEl.style[pair[1]] = v + 'px';
        }
      });
      radRow.appendChild(inp.wrap);
      return inp;
    });
    const lockBtn = mkIconBtn('🔗', 'Link corners', function(e, b) {
      linked = !linked;
      b.style.background = linked ? 'rgba(78,205,196,.35)' : 'rgba(255,255,255,.05)';
    }, true);
    radRow.appendChild(lockBtn);

    // Width + style + color
    const bRow = mkRow(8);
    const bwInp = mkNumInput(px(s.borderWidth) || 0, 'px', 0, 40,
      v => selectedEl && (selectedEl.style.borderWidth = v + 'px'));
    const bsSel = mkSelect(['none','solid','dashed','dotted','double','groove','ridge'],
      s.borderStyle || 'none',
      v => selectedEl && (selectedEl.style.borderStyle = v));
    bRow.appendChild(bwInp.wrap); bRow.appendChild(bsSel);

    const bcRow = mkRow(8);
    const bc = mkColorSwatch('Color', rgbToHex(s.borderColor), v => selectedEl && (selectedEl.style.borderColor = v));
    bcRow.appendChild(bc.wrap);

    // Box shadow quick presets
    const shadowRow = mkRow(4);
    const shadows = [
      { n: 'None', v: 'none' },
      { n: 'Sm',   v: '0 1px 3px rgba(0,0,0,.3)' },
      { n: 'Md',   v: '0 4px 16px rgba(0,0,0,.35)' },
      { n: 'Lg',   v: '0 8px 32px rgba(0,0,0,.45)' },
      { n: 'Glow', v: '0 0 20px rgba(78,205,196,.5)' },
    ];
    shadows.forEach(function(sh) {
      const b = mkEl('button',
        'background:rgba(255,255,255,.04);color:#EDF2F7;border:1px solid rgba(255,255,255,.1);border-radius:5px;padding:3px 8px;font-size:10px;cursor:pointer;white-space:nowrap;'
      );
      b.textContent = sh.n;
      b.onclick = (e) => { e.stopPropagation(); if (selectedEl) selectedEl.style.boxShadow = sh.v; };
      b.onmousedown = (e) => e.stopPropagation();
      shadowRow.appendChild(b);
    });

    // Outline (useful for focus rings etc.)
    const outlineRow = mkRow(8);
    const owInp = mkNumInput(px(s.outlineWidth) || 0, 'px', 0, 20,
      v => selectedEl && (selectedEl.style.outlineWidth = v + 'px'));
    const osSel = mkSelect(['none','solid','dashed','dotted'],
      s.outlineStyle || 'none',
      v => selectedEl && (selectedEl.style.outlineStyle = v));
    outlineRow.appendChild(owInp.wrap); outlineRow.appendChild(osSel);

    pane.appendChild(mkLabel('Radius (TL TR BL BR + link)')); pane.appendChild(radRow);
    pane.appendChild(mkLabel('Border Width & Style'));         pane.appendChild(bRow);
    pane.appendChild(mkLabel('Border Color'));                 pane.appendChild(bcRow);
    pane.appendChild(mkLabel('Box Shadow'));                   pane.appendChild(shadowRow);
    pane.appendChild(mkLabel('Outline'));                      pane.appendChild(outlineRow);
    return pane;
  }

  // LAYOUT tab (containers)
  function buildLayoutPane(s) {
    const pane = mkEl('div', 'display:flex;flex-direction:column;gap:10px;');

    const dispSel = mkSelect(['block','flex','grid','inline','inline-flex','inline-block','none'],
      s.display || 'block',
      v => selectedEl && (selectedEl.style.display = v));

    const dirSel = mkSelect(['row','row-reverse','column','column-reverse'],
      s.flexDirection || 'row',
      v => selectedEl && (selectedEl.style.flexDirection = v));

    const justSel = mkSelect(['flex-start','center','flex-end','space-between','space-around','space-evenly'],
      s.justifyContent || 'flex-start',
      v => selectedEl && (selectedEl.style.justifyContent = v));

    const alignSel = mkSelect(['stretch','flex-start','center','flex-end','baseline'],
      s.alignItems || 'stretch',
      v => selectedEl && (selectedEl.style.alignItems = v));

    const wrapSel = mkSelect(['nowrap','wrap','wrap-reverse'],
      s.flexWrap || 'nowrap',
      v => selectedEl && (selectedEl.style.flexWrap = v));

    const gapInp = mkNumInput(px(s.gap) || 0, 'px', 0, 200,
      v => selectedEl && (selectedEl.style.gap = v + 'px'));

    // Grid columns shorthand
    const gridRow = mkRow(8);
    const gcInp = mkNumInput(0, 'cols', 1, 12, function(v) {
      if (selectedEl) selectedEl.style.gridTemplateColumns = 'repeat(' + v + ', 1fr)';
    });
    gridRow.appendChild(gcInp.wrap);

    // Position
    const posSel = mkSelect(['static','relative','absolute','fixed','sticky'],
      s.position || 'static',
      v => selectedEl && (selectedEl.style.position = v));

    const posOffsetRow = mkRow(8);
    const topInp  = mkNumInput(px(s.top) || 0,  'top',  -9999, 9999, v => selectedEl && (selectedEl.style.top  = v + 'px'));
    const leftInp = mkNumInput(px(s.left) || 0, 'left', -9999, 9999, v => selectedEl && (selectedEl.style.left = v + 'px'));
    posOffsetRow.appendChild(topInp.wrap); posOffsetRow.appendChild(leftInp.wrap);

    // Overflow
    const overflowSel = mkSelect(['visible','hidden','scroll','auto','clip'],
      s.overflow || 'visible',
      v => selectedEl && (selectedEl.style.overflow = v));

    pane.appendChild(mkLabel('Display'));          pane.appendChild(dispSel);
    pane.appendChild(mkLabel('Flex Direction'));   pane.appendChild(dirSel);
    pane.appendChild(mkLabel('Justify Content'));  pane.appendChild(justSel);
    pane.appendChild(mkLabel('Align Items'));      pane.appendChild(alignSel);
    pane.appendChild(mkLabel('Flex Wrap'));        pane.appendChild(wrapSel);
    pane.appendChild(mkLabel('Gap'));              pane.appendChild(gapInp.wrap);
    pane.appendChild(mkLabel('Grid Columns'));     pane.appendChild(gridRow);
    pane.appendChild(mkLabel('Position'));         pane.appendChild(posSel);
    pane.appendChild(mkLabel('Top / Left'));       pane.appendChild(posOffsetRow);
    pane.appendChild(mkLabel('Overflow'));         pane.appendChild(overflowSel);
    return pane;
  }

  // SPACING tab — padding + margin with box-model diagram
  function buildSpacingPane(s) {
    const pane = mkEl('div', 'display:flex;flex-direction:column;gap:10px;');

    function makeEdgeRow(prop, sides) {
      const r = mkRow(4);
      sides.forEach(function(side) {
        const fullProp = prop + side;
        const inp = mkNumInput(px(s[fullProp]) || 0, side.slice(0,1).toLowerCase(), 0, 500,
          function(v) { if (selectedEl) selectedEl.style[fullProp] = v + 'px'; });
        r.appendChild(inp.wrap);
      });
      return r;
    }

    // Box model diagram
    const diagram = mkEl('div',
      'position:relative;width:100%;height:90px;border:1px dashed rgba(78,205,196,.25);border-radius:6px;display:flex;align-items:center;justify-content:center;background:rgba(78,205,196,.03);margin-bottom:4px;'
    );
    const inner = mkEl('div',
      'width:70px;height:44px;background:rgba(78,205,196,.14);border:1px solid rgba(78,205,196,.55);border-radius:3px;display:flex;align-items:center;justify-content:center;'
    );
    const innerTxt = mkEl('span','font-size:8px;color:#4ECDC4;opacity:.8;');
    innerTxt.textContent = 'element';
    inner.appendChild(innerTxt);
    diagram.appendChild(inner);
    const mLbl = mkEl('span','position:absolute;top:3px;left:50%;transform:translateX(-50%);font-size:8px;color:#888;');
    mLbl.textContent = '— margin —';
    const pLbl = mkEl('span','position:absolute;bottom:3px;left:50%;transform:translateX(-50%);font-size:8px;color:#4ECDC4;opacity:.6;');
    pLbl.textContent = '— padding —';
    diagram.appendChild(mLbl); diagram.appendChild(pLbl);

    pane.appendChild(diagram);
    pane.appendChild(mkLabel('Padding (T R B L)'));
    pane.appendChild(makeEdgeRow('padding', ['Top','Right','Bottom','Left']));
    pane.appendChild(mkLabel('Margin (T R B L)'));
    pane.appendChild(makeEdgeRow('margin', ['Top','Right','Bottom','Left']));
    return pane;
  }

  // ── Toolbar core ────────────────────────────────────────────────────────────
  function createToolbar() {
    if (document.getElementById('rivets-toolbar')) return;

    toolbar = mkEl('div', [
      'position:absolute',
      'background:rgba(10,16,23,.97)',
      'color:#EDF2F7',
      'padding:0',
      'border-radius:14px',
      'z-index:2147483647',
      'display:none',
      'flex-direction:column',
      'box-shadow:0 24px 60px rgba(0,0,0,.65),0 0 0 1px rgba(78,205,196,.18) inset',
      'font-family:"DM Sans",system-ui,sans-serif',
      'border:1px solid rgba(78,205,196,.25)',
      'backdrop-filter:blur(24px)',
      'user-select:none',
      'transform:translateX(-50%)',
      'width:280px',
      'overflow:hidden',
    ].join(';'));
    toolbar.id = 'rivets-toolbar';

    // Header
    const header = mkEl('div',
      'display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-bottom:1px solid rgba(255,255,255,.06);background:rgba(78,205,196,.05);'
    );
    const tagBadge = mkEl('span',
      'font-size:10px;font-weight:700;color:#4ECDC4;letter-spacing:.06em;text-transform:uppercase;'
    );
    tagBadge.id = 'rivets-tag-badge';
    const closeBtn = mkEl('button',
      'background:none;border:none;color:#aaa;cursor:pointer;font-size:14px;padding:0 2px;line-height:1;'
    );
    closeBtn.textContent = '✕';
    closeBtn.title = 'Deselect';
    closeBtn.onclick = (e) => { e.stopPropagation(); deselectEl(); };
    closeBtn.onmousedown = (e) => e.stopPropagation();
    header.appendChild(tagBadge); header.appendChild(closeBtn);

    // Tab bar
    const tabBar = mkEl('div', 'display:flex;border-bottom:1px solid rgba(255,255,255,.06);');
    tabBar.id = 'rivets-tab-bar';

    // Content
    const content = mkEl('div', 'padding:14px;overflow-y:auto;max-height:380px;');
    content.id = 'rivets-content';

    // Add-element footer
    const addRow = mkEl('div',
      'display:flex;align-items:center;gap:8px;padding:8px 12px;border-top:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.02);'
    );
    const addLbl = mkEl('span','font-size:9px;color:#aaa;text-transform:uppercase;letter-spacing:.05em;');
    addLbl.textContent = 'Add:';
    const addSel = mkSelect(['Element…','Button','Text','Heading','Input','Container'], 'Element…', function(v) {
      if (v !== 'Element…') { insertElement(v); addSel.value = 'Element…'; }
    });
    addRow.appendChild(addLbl); addRow.appendChild(addSel);

    toolbar.appendChild(header);
    toolbar.appendChild(tabBar);
    toolbar.appendChild(content);
    toolbar.appendChild(addRow);
    document.body.appendChild(toolbar);
  }

  function buildTabBtn(tabKey, isActive, onClick) {
    const t = mkEl('button', [
      'flex:1',
      'background:none',
      'border:none',
      'border-bottom:2px solid ' + (isActive ? '#4ECDC4' : 'transparent'),
      'color:' + (isActive ? '#4ECDC4' : '#888'),
      'padding:7px 4px',
      'font-size:10px',
      'cursor:pointer',
      'font-family:inherit',
      'font-weight:600',
      'letter-spacing:.03em',
      'transition:color .15s,border-color .15s',
      'white-space:nowrap',
    ].join(';'));
    t.textContent = TAB_LABELS[tabKey];
    t.onclick = (e) => { e.stopPropagation(); onClick(); };
    t.onmousedown = (e) => e.stopPropagation();
    return t;
  }

  function renderToolbar(target) {
    if (!toolbar) return;
    const s = window.getComputedStyle(target);
    const cat = getCategory(target);
    const tabs = TAB_MAP[cat] || TAB_MAP.generic;
    if (!tabs.includes(activeTab)) activeTab = tabs[0];

    const badge = document.getElementById('rivets-tag-badge');
    if (badge) badge.textContent = '<' + target.tagName.toLowerCase() + '> · ' + cat;

    const tabBar = document.getElementById('rivets-tab-bar');
    if (tabBar) {
      tabBar.innerHTML = '';
      tabs.forEach(function(tabKey) {
        tabBar.appendChild(buildTabBtn(tabKey, tabKey === activeTab, function() {
          activeTab = tabKey;
          renderToolbar(selectedEl);
        }));
      });
    }

    const content = document.getElementById('rivets-content');
    if (content) {
      content.innerHTML = '';
      let pane;
      if      (activeTab === 'style')      pane = buildStylePane(s);
      else if (activeTab === 'typography') pane = buildTypographyPane(s);
      else if (activeTab === 'border')     pane = buildBorderPane(s);
      else if (activeTab === 'layout')     pane = buildLayoutPane(s);
      else if (activeTab === 'spacing')    pane = buildSpacingPane(s);
      if (pane) content.appendChild(pane);
    }

    toolbar.style.display = 'flex';
    repositionToolbar(target);
  }

  function repositionToolbar(target) {
    if (!toolbar || !target) return;
    const elRect = target.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    const tbH = toolbar.offsetHeight || 200;
    let top = elRect.top + scrollY - tbH - 12;
    if (top < scrollY + 8) top = elRect.bottom + scrollY + 12;
    const maxLeft = document.body.scrollWidth - 150;
    let left = elRect.left + scrollX + elRect.width / 2;
    left = Math.max(150, Math.min(left, maxLeft));
    toolbar.style.top  = top + 'px';
    toolbar.style.left = left + 'px';
  }

  function hideToolbar() {
    if (toolbar) toolbar.style.display = 'none';
    if (selectedEl) { selectedEl.style.outline = ''; selectedEl = null; }
  }

  function deselectEl() { hideToolbar(); }

  // ── Drag ────────────────────────────────────────────────────────────────────
  let isDragging = false, startX, startY, initLeft, initTop, dragEl = null;

  function onMouseMove(e) {
    if (!isDragging || !dragEl) return;
    dragEl.style.left = (initLeft + (e.clientX - startX)) + 'px';
    dragEl.style.top  = (initTop  + (e.clientY - startY)) + 'px';
  }
  function onMouseUp() {
    isDragging = false; dragEl = null;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup',   onMouseUp);
  }
  function onElMouseDown(e) {
    if (e.target.closest('#rivets-toolbar')) return;
    const target = e.currentTarget;
    if (!target.dataset.draggable) return;
    e.preventDefault();
    isDragging = true; dragEl = target;
    startX = e.clientX; startY = e.clientY;
    const c = window.getComputedStyle(target);
    if (c.position === 'static') target.style.position = 'relative';
    initLeft = parseFloat(c.left) || 0;
    initTop  = parseFloat(c.top)  || 0;
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup',   onMouseUp);
  }

  function toggleDrag(e, btn) {
    if (!selectedEl) return;
    if (selectedEl.dataset.draggable) {
      delete selectedEl.dataset.draggable;
      selectedEl.removeEventListener('mousedown', onElMouseDown);
      selectedEl.style.cursor = '';
      btn.style.background = 'rgba(255,255,255,.05)';
    } else {
      selectedEl.dataset.draggable = 'true';
      selectedEl.addEventListener('mousedown', onElMouseDown);
      selectedEl.style.cursor = 'move';
      btn.style.background = 'rgba(78,205,196,.35)';
    }
  }

  // ── Insert element ──────────────────────────────────────────────────────────
  function insertElement(type) {
    const tagMap = { Button:'button', Heading:'h2', Text:'p', Input:'input', Container:'div' };
    const newEl = document.createElement(tagMap[type] || 'div');
    if (type === 'Button') {
      newEl.textContent = 'New Button';
      newEl.style.cssText = 'padding:10px 20px;border-radius:8px;border:none;background:#4ECDC4;color:#080C10;cursor:pointer;font-family:inherit;font-weight:600;';
    } else if (type === 'Heading') {
      newEl.textContent = 'New Heading';
      newEl.style.fontFamily = 'Syne, sans-serif';
    } else if (type === 'Text') {
      newEl.textContent = 'New paragraph text...';
    } else if (type === 'Container') {
      newEl.style.cssText = 'padding:40px;border:1px dashed rgba(78,205,196,.3);min-height:100px;background:rgba(78,205,196,.03);border-radius:12px;';
    }
    newEl.style.margin = '10px';
    const container = (selectedEl && ['DIV','SECTION','MAIN','BODY'].includes(selectedEl.tagName))
      ? selectedEl : document.body;
    container.appendChild(newEl);
  }

  // ── Click selection ─────────────────────────────────────────────────────────
  document.addEventListener('click', function(e) {
    if (!document.body.isContentEditable) return;
    if (e.target.closest('#rivets-toolbar')) return;
    e.preventDefault(); e.stopPropagation();
    if (selectedEl) selectedEl.style.outline = '';
    selectedEl = e.target;
    selectedEl.style.outline = '2px solid #4ECDC4';
    activeTab = (TAB_MAP[getCategory(selectedEl)] || ['style'])[0];
    renderToolbar(selectedEl);
  });

  window.addEventListener('scroll', function() {
    if (selectedEl && toolbar && toolbar.style.display !== 'none') repositionToolbar(selectedEl);
  });

  // ── Message bridge ──────────────────────────────────────────────────────────
  window.addEventListener('message', function(event) {
    if (event.data.type === 'TOGGLE_EDIT') {
      document.body.contentEditable = event.data.isEditing;
      if (event.data.isEditing) { createToolbar(); }
      else { hideToolbar(); }
    }
    if (event.data.type === 'REQUEST_CODE') {
      hideToolbar();
      if (toolbar) toolbar.remove();
      document.body.removeAttribute('contenteditable');
      const myScript = document.getElementById('rivets-edit-script');
      if (myScript) myScript.remove();
      window.parent.postMessage({ type: 'SAVE_CODE', html: document.documentElement.outerHTML }, '*');
    }
  });
})();
</script>`;

  const displayCode = currentCode.replace("</body>", `${EDIT_SCRIPT}</body>`);

  // ─── Message listener ──────────────────────────────────────────────────────
  useEffect(() => {
    const handler = async (event: MessageEvent) => {
      if (event.data.type === "SAVE_CODE" && event.data.html) {
        setCurrentCode(event.data.html);
        setIsEditing(false);
        if (projectId) {
          try {
            await supabase
              .from("projects")
              .update({
                current_code: event.data.html,
                updated_at: new Date().toISOString(),
              })
              .eq("id", projectId);
          } catch (err) {
            console.error("Failed to save project:", err);
          }
        }
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [setCurrentCode, projectId, supabase]);

  // ─── Handlers ──────────────────────────────────────────────────────────────
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

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <Box h="full" w="full" bg="#0B1015" position="relative" overflow="hidden">
      <Box position="absolute" inset={0} bg="white" p={0}>
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
            onClick={toggleEdit}
            bg={isEditing ? "var(--accent)" : "var(--surface)"}
            color={isEditing ? "#080C10" : "var(--fg)"}
            border="1px solid"
            borderColor={isEditing ? "var(--accent)" : "var(--border)"}
            _hover={{
              bg: isEditing ? "#62D5CD" : "var(--surface2)",
              transform: "translateY(-1px)",
            }}
            borderRadius="8px"
            fontSize="12px"
            fontWeight={600}
            fontFamily="var(--font-b)"
            transition="all 0.2s"
          >
            {isEditing
              ? <><Save size={13} style={{ marginRight: 4 }} />Save Edits</>
              : <><Pencil size={13} style={{ marginRight: 4 }} />Visual Edit</>}
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
          fontSize="12px"
          fontFamily="var(--font-b)"
        >
          <Download size={13} style={{ marginRight: 4 }} />
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
        <Text
          fontSize="10px"
          fontWeight={700}
          color="var(--fg2)"
          fontFamily="var(--font-b)"
          letterSpacing="0.05em"
        >
          LIVE PREVIEW
        </Text>
      </HStack>
    </Box>
  );
};