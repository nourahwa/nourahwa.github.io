/* Drawings for the desktop version: the sun mark, desktop icons and dock tiles.
   Folders take their colour from --folder and --folder-top, set by the chosen background. */
(function () {
  "use strict";
  var n = 0;
  function uid(p) { n++; return p + n; }

  function sun() {
    var rays = [[4.5, 22.4, 0.7, 21], [10.5, 14.5, 8.2, 11.2], [20, 11.5, 20, 7.5], [29.5, 14.5, 31.8, 11.2], [35.5, 22.4, 39.3, 21]];
    return '<svg class="sun" viewBox="0 0 40 32" overflow="visible" aria-hidden="true"><path d="M8 28 A12 12 0 0 1 32 28 Z" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/>' +
      '<g stroke="currentColor" stroke-width="2.4" stroke-linecap="round">' +
      rays.map(function (r) { return '<line class="ray" x1="' + r[0] + '" y1="' + r[1] + '" x2="' + r[2] + '" y2="' + r[3] + '"/>'; }).join("") + "</g></svg>";
  }

  function folder(locked) {
    var g = uid("f");
    return '<svg viewBox="0 0 64 52" aria-hidden="true"><defs><linearGradient id="' + g + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" style="stop-color:var(--folder-top)"/><stop offset="1" style="stop-color:var(--folder)"/></linearGradient></defs>' +
      '<path d="M4 10a4 4 0 0 1 4-4h15.5l5 5H56a4 4 0 0 1 4 4v29a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" style="fill:var(--folder-back)"/>' +
      '<rect x="4" y="16" width="56" height="32" rx="4" fill="url(#' + g + ')"/>' +
      '<rect x="4" y="16" width="56" height="1.4" fill="rgba(255,255,255,.55)"/>' +
      (locked ? '<g transform="translate(25 23)"><rect x="1" y="7" width="12" height="10" rx="2" fill="rgba(13,30,47,.55)"/><path d="M3.5 7V5a3.5 3.5 0 0 1 7 0v2" fill="none" stroke="rgba(13,30,47,.55)" stroke-width="2"/></g>' : "") +
      "</svg>";
  }

  /* desktop app icons: rounded squares with a soft gradient and a clean white mark */
  function tileBg(id, top, bottom) {
    return '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + top + '"/><stop offset="1" stop-color="' + bottom + '"/></linearGradient></defs>' +
      '<rect x="6" y="6" width="52" height="52" rx="13" fill="url(#' + id + ')"/><rect x="6.5" y="6.5" width="51" height="51" rx="12.5" fill="none" stroke="rgba(255,255,255,.35)"/>';
  }
  function svg(body) { return '<svg viewBox="0 0 64 64" aria-hidden="true">' + body + "</svg>"; }
  var ICONS = {
    sticky: function () {
      /* two soft sticky notes, off-white and blush, with a strip of tape: calm and modern */
      var g = uid("i"), sh = uid("s");
      return svg('<defs><linearGradient id="' + g + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBF8F1"/><stop offset="1" stop-color="#EFE9DC"/></linearGradient>' +
        '<filter id="' + sh + '" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1.5" stdDeviation="1.4" flood-color="#5B4E36" flood-opacity=".18"/></filter></defs>' +
        '<rect x="4" y="4" width="56" height="56" rx="14" fill="url(#' + g + ')"/>' +
        '<rect x="20" y="15" width="28" height="28" rx="3.5" fill="#F3D9D2" transform="rotate(8 34 29)" filter="url(#' + sh + ')"/>' +
        '<rect x="15" y="20" width="29" height="29" rx="3.5" fill="#FFFDF8" transform="rotate(-5 29.5 34.5)" filter="url(#' + sh + ')"/>' +
        '<g transform="rotate(-5 29.5 34.5)" stroke-linecap="round"><path d="M20 31h17" stroke="#C9BFAE" stroke-width="1.8"/><path d="M20 36h13" stroke="#D7CEBF" stroke-width="1.8"/><path d="M20 41h9" stroke="#D7CEBF" stroke-width="1.8"/></g>' +
        '<rect x="23" y="16.5" width="13" height="6" rx="1" fill="#E7C9A0" opacity=".75" transform="rotate(-11 29.5 19.5)"/>');
    },
    notes: function () {
      var g = uid("n");
      return svg(tileBg(g, "#FFFFFF", "#F1F0EC") + '<path d="M6 19a13 13 0 0 1 13-13h26a13 13 0 0 1 13 13v3H6z" fill="#F5C84C"/>' +
        '<g stroke="#D5D3CC" stroke-width="1.4"><line x1="16" y1="32" x2="48" y2="32"/><line x1="16" y1="40" x2="48" y2="40"/><line x1="16" y1="48" x2="36" y2="48"/></g>' +
        '<path d="M38 50l10-12 3 2.5-10 12-4.2 1.6z" fill="#3F6650"/><path d="M48 38l1.8-2.2a1.6 1.6 0 0 1 2.3-.2l.7.6a1.6 1.6 0 0 1 .2 2.3L51 40.5z" fill="#E5776A"/>');
    },
    resume: function () {
      var g = uid("r");
      return svg(tileBg(g, "#4F8FE0", "#2563B8") + '<path d="M22 14h15l7 7v27a3 3 0 0 1-3 3H22a3 3 0 0 1-3-3V17a3 3 0 0 1 3-3z" fill="#FFFFFF"/><path d="M37 14v5a2 2 0 0 0 2 2h5" fill="#DCE8F8"/>' +
        '<circle cx="27" cy="25" r="3.4" fill="#9DBCE6"/><path d="M21.8 33a5.4 5.4 0 0 1 10.4 0z" fill="#9DBCE6"/>' +
        '<g fill="#C9D9EE"><rect x="23" y="37" width="17" height="2.4" rx="1.2"/><rect x="23" y="42" width="12" height="2.4" rx="1.2"/></g>' +
        '<circle cx="44" cy="45" r="8" fill="#1F2E3D"/><rect x="40.4" y="44" width="7.2" height="5.6" rx="1.2" fill="#FFFFFF"/><path d="M41.8 44v-1.6a2.2 2.2 0 0 1 4.4 0V44" fill="none" stroke="#FFFFFF" stroke-width="1.5"/>');
    },
    sudoku: function () {
      var g = uid("s"), cells = "", nums = { 0: "5", 2: "9", 4: "3", 6: "1", 8: "7" };
      for (var i = 0; i < 9; i++) {
        var x = 15 + (i % 3) * 12, y = 15 + Math.floor(i / 3) * 12;
        cells += '<rect x="' + x + '" y="' + y + '" width="10" height="10" rx="2.4" fill="' + (nums[i] ? "#FFFFFF" : "rgba(255,255,255,.22)") + '"/>';
        if (nums[i]) cells += '<text x="' + (x + 5) + '" y="' + (y + 7.8) + '" font-family="Inter,Arial,sans-serif" font-size="7.6" font-weight="700" text-anchor="middle" fill="#2C5A43">' + nums[i] + "</text>";
      }
      return svg(tileBg(g, "#4E8A66", "#2A4E3B") + cells);
    },
    gallery: function () {
      var g = uid("g");
      return svg(tileBg(g, "#F3A65A", "#E0607E") + '<rect x="15" y="17" width="34" height="30" rx="5" fill="#FFFFFF"/>' +
        '<g fill="#E0607E"><rect x="20" y="33" width="5" height="9" rx="1.5"/><rect x="27.5" y="27" width="5" height="15" rx="1.5"/><rect x="35" y="30" width="5" height="12" rx="1.5"/></g>' +
        '<rect x="42.5" y="22" width="2" height="20" rx="1" fill="#F3A65A"/><circle cx="22" cy="23" r="2.4" fill="#F3A65A"/>');
    },
    sql: function () {
      var g = uid("q");
      return svg(tileBg(g, "#33475C", "#16222E") + '<g fill="none" stroke="#7DC3E6" stroke-width="2.6"><ellipse cx="32" cy="20" rx="12" ry="4.6"/><path d="M20 20v12c0 2.6 5.4 4.6 12 4.6s12-2 12-4.6V20M20 26c0 2.6 5.4 4.6 12 4.6s12-2 12-4.6"/></g>' +
        '<text x="32" y="50" font-family="Menlo,monospace" font-size="9" font-weight="700" text-anchor="middle" fill="#FFFFFF" letter-spacing=".5">SQL</text>');
    },
    lab: function () {
      var g = uid("l");
      return svg(tileBg(g, "#3FB6B0", "#1F7A86") + '<path d="M27 14h10M28.5 14v11L18.6 42.4A4 4 0 0 0 22 48.5h20a4 4 0 0 0 3.4-6.1L35.5 25V14" fill="none" stroke="#FFFFFF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path d="M22.4 38h19.2l3 5.2a2.3 2.3 0 0 1-2 3.4H21.4a2.3 2.3 0 0 1-2-3.4z" fill="#FFFFFF" opacity=".92"/>' +
        '<circle cx="29" cy="42" r="1.6" fill="#1F7A86"/><circle cx="35" cy="41" r="1.1" fill="#1F7A86"/><circle cx="33" cy="31" r="1.4" fill="#FFFFFF"/>');
    },
    badges: function () {
      var g = uid("b");
      return svg(tileBg(g, "#F7CD5B", "#E08A2E") + '<path d="M24 12h6l4 12h-6zM40 12h-6l-4 12h6z" fill="#FFFFFF" opacity=".75"/>' +
        '<circle cx="32" cy="36" r="13" fill="#FFFFFF"/><circle cx="32" cy="36" r="9.5" fill="none" stroke="#E08A2E" stroke-width="1.6"/>' +
        '<path d="M32 29.8l1.9 3.9 4.3.6-3.1 3 .7 4.3-3.8-2-3.8 2 .7-4.3-3.1-3 4.3-.6z" fill="#E08A2E"/>');
    },
    github: function () {
      var g = uid("h");
      return svg(tileBg(g, "#2D333B", "#0D1117") + '<path transform="translate(17 17) scale(1.25)" d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" fill="#FFFFFF"/>');
    },
    /* a mail icon in the style of Outlook: blue panels with a white O */
    mail: function () {
      return '<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="ol1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#28A8EA"/><stop offset="1" stop-color="#0364B8"/></linearGradient></defs>' +
        '<rect x="20" y="10" width="36" height="44" rx="5" fill="url(#ol1)"/>' +
        '<path d="M20 30l18 11 18-11v19a5 5 0 0 1-5 5H25a5 5 0 0 1-5-5z" fill="#1490DF"/><path d="M20 30l18 11 18-11" fill="none" stroke="#50D9FF" stroke-width="1.4" opacity=".7"/>' +
        '<rect x="8" y="19" width="26" height="26" rx="4" fill="#0A5FB4"/>' +
        '<ellipse cx="21" cy="32" rx="6.2" ry="7.4" fill="none" stroke="#FFFFFF" stroke-width="3.4"/></svg>';
    },
  };
  /* dock tiles. Notion, Tableau, Claude and ChatGPT use the marks from Simple Icons (CC0); the others are drawn here */
  var TILE = {
    excel: ["Excel", "#FFFFFF", "#FFFFFF", '<rect x="22" y="14" width="30" height="36" rx="3" fill="#21A366"/><rect x="22" y="14" width="30" height="9" rx="3" fill="#33C481"/><rect x="22" y="23" width="30" height="9" fill="#21A366"/><rect x="22" y="32" width="30" height="9" fill="#107C41"/><rect x="22" y="41" width="30" height="9" rx="3" fill="#185C37"/><rect x="37" y="14" width="1.4" height="36" fill="#FFFFFF" opacity=".35"/><rect x="11" y="21" width="22" height="22" rx="3" fill="#107C41"/><path d="M16.5 26.5l11 11M27.5 26.5l-11 11" stroke="#FFFFFF" stroke-width="3.2" stroke-linecap="round"/>'],
    sql: ["SQL", "#1F4E79", "#3E7CB1", '<g fill="none" stroke="#FFFFFF" stroke-width="2.6"><ellipse cx="32" cy="20" rx="12" ry="5"/><path d="M20 20v24c0 2.8 5.4 5 12 5s12-2.2 12-5V20M20 32c0 2.8 5.4 5 12 5s12-2.2 12-5"/></g>'],
    python: ["Python", "#FFFFFF", "#FFFFFF", '<path d="M31.6 12c-8.2 0-7.7 3.6-7.7 3.6v3.7h7.9v1.1H20.8s-5.3-.6-5.3 7.7 4.6 8 4.6 8h2.8v-3.9s-.1-4.6 4.5-4.6h7.8s4.3.1 4.3-4.2v-7S40.2 12 31.6 12zm-4.3 2.5a1.4 1.4 0 1 1 0 2.8 1.4 1.4 0 0 1 0-2.8z" fill="#3776AB"/><path d="M32.4 52c8.2 0 7.7-3.6 7.7-3.6v-3.7h-7.9v-1.1h11s5.3.6 5.3-7.7-4.6-8-4.6-8h-2.8v3.9s.1 4.6-4.5 4.6h-7.8s-4.3-.1-4.3 4.2v7S23.8 52 32.4 52zm4.3-2.5a1.4 1.4 0 1 1 0-2.8 1.4 1.4 0 0 1 0 2.8z" fill="#FFD43B"/>'],
    powerbi: ["Power BI", "#FFFFFF", "#FFFFFF", '<defs><linearGradient id="pb1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EBBB14"/><stop offset="1" stop-color="#B25400"/></linearGradient><linearGradient id="pb2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F9E583"/><stop offset="1" stop-color="#DE9800"/></linearGradient><linearGradient id="pb3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F9E68B"/><stop offset="1" stop-color="#F3CD32"/></linearGradient></defs><rect x="36" y="12" width="12" height="40" rx="3" fill="url(#pb1)"/><rect x="26" y="22" width="12" height="30" rx="3" fill="url(#pb2)"/><rect x="16" y="32" width="12" height="20" rx="3" fill="url(#pb3)"/>'],
    tableau: ["Tableau", "#FFFFFF", "#FFFFFF", '<path transform="translate(14 14) scale(1.5)" d="M11.654.174V2.377H9.682v.58h1.972V5.16h.696V2.957h1.97v-.58h-1.97V.174h-.348zm6.03 2.262l-.002 1.623v1.623h-2.957v.927h2.957v3.188H18.725l.011-1.582.02-1.576 1.465-.02 1.46-.01v-.927H18.728V2.436h-.522zm-12.407.06V5.686H2.291v.925H5.277V9.801h.985V6.61h3.013v-.925H6.262V2.496H5.77zm6.086 5.27v3.593H8.06v1.188h3.304v3.596h1.28v-3.596H15.953v-1.188H12.643V7.766h-.637zm9.721 1.55v2.221h-2.012v.811h2.012v2.261h.887v-2.261H24v-.811h-2.029V9.317h-.422zm-19.111.131V11.621H0v.621H1.973v2.194H2.64v-2.194h2v-.62H2.609V9.446h-.318zm15.709 4.516v3.254h-3.016v.927h3.016v3.217h1.072v-3.216H21.74v-.928H18.754v-3.254h-.533zm-12.463.008v3.246H2.262v.928h2.957v3.189H6.32v-3.189h2.955v-.928H6.32V13.97h-.55zm6.316 4.578l.002 1.103v1.1H9.566v.812h1.971v2.262h.928l.012-1.119.017-1.143H14.463v-.812h-2V18.549h-.465z" fill="#E97627"/>'],
    notion: ["Notion", "#FFFFFF", "#FFFFFF", '<path transform="translate(14 14) scale(1.5)" d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z" fill="#000000"/>'],
    claude: ["Claude", "#F4EFE6", "#FAF6EE", '<path transform="translate(14.6 14.6) scale(1.45)" d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z" fill="#D97757"/>'],
    figma: ["Figma", "#FFFFFF", "#FFFFFF", '<path d="M32 17h-5a5 5 0 0 0 0 10h5z" fill="#F24E1E"/><path d="M32 17h5a5 5 0 0 1 0 10h-5z" fill="#FF7262"/><path d="M32 27h-5a5 5 0 0 0 0 10h5z" fill="#A259FF"/><circle cx="37" cy="32" r="5" fill="#1ABCFE"/><path d="M27 37h5v5a5 5 0 1 1-5-5z" fill="#0ACF83"/>'],
    framer: ["Framer", "#0A0A0A", "#262626", '<path transform="translate(16.4 16.4) scale(1.3)" d="M4 0h16v8h-8zM4 8h8l8 8H4zM4 16h8v8z" fill="#FFFFFF"/>'],
    chatgpt: ["ChatGPT", "#0D0D0D", "#2A2A2A", '<path transform="translate(14.6 14.6) scale(1.45)" d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" fill="#FFFFFF"/>']
  };
  function tile(key) {
    var t = TILE[key], g = uid("t");
    return '<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="' + g + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + t[2] + '"/><stop offset="1" stop-color="' + t[1] + '"/></linearGradient></defs>' +
      '<rect x="4" y="4" width="56" height="56" rx="14" fill="url(#' + g + ')"/>' + t[3] + "</svg>";
  }

  function globe() {
    return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/></svg>';
  }
  function lock() {
    return '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  }
  /* a project as a file icon: a page with its dashboard as the preview */
  function file(src) {
    var g = uid("c");
    return '<svg viewBox="0 0 64 80" aria-hidden="true"><defs><clipPath id="' + g + '"><rect x="9" y="22" width="46" height="34" rx="2"/></clipPath></defs>' +
      '<path d="M8 4h36l14 14v54a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4z" fill="#FFFFFF"/>' +
      '<path d="M44 4v10a4 4 0 0 0 4 4h10" fill="#E3E8EC"/>' +
      (src ? '<image href="' + String(src).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;") + '" x="9" y="22" width="46" height="34" preserveAspectRatio="xMidYMin slice" clip-path="url(#' + g + ')"/>'
           : '<g fill="#C9D6DE"><rect x="12" y="44" width="6" height="9" rx="1"/><rect x="21" y="36" width="6" height="17" rx="1"/><rect x="30" y="40" width="6" height="13" rx="1"/><rect x="39" y="30" width="6" height="23" rx="1"/></g>') +
      '<g fill="#E3E8EC"><rect x="9" y="61" width="34" height="3" rx="1.5"/><rect x="9" y="67" width="24" height="3" rx="1.5"/></g></svg>';
  }

  /* portrait: the plain "unknown user" picture, like the default account picture on a Mac */
  function avatar() {
    return '<svg class="me-art" viewBox="0 0 100 100" role="img" aria-label="User">' +
      '<circle cx="50" cy="38" r="17" fill="#FFFFFF"/>' +
      '<path d="M16 100c0-21 15-36 34-36s34 15 34 36z" fill="#FFFFFF"/></svg>';
  }
  function photos() {
    return '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="14" y="10" width="40" height="32" rx="4" fill="#DDE7EC" transform="rotate(8 34 26)"/>' +
      '<rect x="8" y="16" width="44" height="36" rx="4" fill="#FFFFFF"/><rect x="12" y="20" width="36" height="24" rx="2" fill="#21392E"/>' +
      '<g fill="#F6E7A1"><rect x="16" y="34" width="5" height="7"/><rect x="23" y="29" width="5" height="12"/><rect x="30" y="32" width="5" height="9"/><rect x="37" y="25" width="5" height="16"/></g></svg>';
  }
  function help() { return '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.1-2.4 3.6"/><circle cx="12" cy="17" r=".6" fill="currentColor"/></svg>'; }
  function speaker(on) { return '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 10v4h4l5 4V6l-5 4z" fill="currentColor"/>' + (on ? '<path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/>' : '<path d="M16.5 9.5l5 5M21.5 9.5l-5 5"/>') + "</svg>"; }

  window.ART = { avatar: avatar, photos: function () { return ICONS.gallery(); }, help: help, speaker: speaker, globe: globe, lock: lock, file: file, sun: sun, folder: folder, icon: function (k) { return ICONS[k](); }, tile: tile, tileName: function (k) { return TILE[k][0]; } };
})();
