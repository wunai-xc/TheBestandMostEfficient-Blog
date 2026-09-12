/**
 * 暗色模式星空背景
 *
 * 纯静态 SVG（服务端组件，零客户端 JS），只在暗色模式显示，
 * 显隐完全由 globals.css 里的 .starfield 规则控制（display:none 时浏览器不做滤镜栅格化）。
 *
 * 真实感来自几点：
 * - 恒星颜色按光谱型 O→M 的色温加权分布：蓝白 / 青白 / 纯白 / 黄白 / 黄 / 橙 / 橙红 / 深红。
 *   恒星可见色只由色温决定，因此色板中不含绿色（也没有紫色、青色等非黑体色）。
 * - 亮度按幂律分布：绝大多数是暗弱小星，亮星极少，且亮星带十字衍射星芒与色晕。
 * - 银河带：沿 -20° 方向的高密度暗星带 + 弥漫辉光 + 遮挡恒星的暗尘埃带。
 * - 星云：SVG 滤镜 feTurbulence 分形噪声塑形，feFlood 着色，feGaussianBlur 柔化；
 *   多支色彩（H-alpha 洋红 / O-III 青 / 紫 / 琥珀）由同一噪声场平移派生，形状互不相同。
 * - 星系：正面旋涡、椭圆、侧向（带尘埃分割线）三种形态。
 * - 由固定种子的 PRNG 生成，服务端与客户端输出完全一致，不存在 hydration 差异。
 */

/* ===== 可调参数 ===== */
const VB_W = 1600;
const VB_H = 1000;
const CX = VB_W / 2;
const CY = VB_H / 2;
const BAND_ANGLE = -20; // 银河带倾角（度）
const STAR_TOTAL = 1150; // 恒星总数
const BAND_RATIO = 0.45; // 其中落在银河带内的比例
const NEBULA_OPACITY = 0.55; // 星云整体强度（越大会越抢文字）

/* 恒星颜色：按光谱型 O→M 的色温分布（w 为相对权重，合计 100） */
const STAR_COLORS = [
  { hex: "#9db4ff", w: 3 }, // O/B  蓝白
  { hex: "#cbd9ff", w: 5 }, // B/A  青白
  { hex: "#f2f5ff", w: 8 }, // A    纯白
  { hex: "#fff3dd", w: 12 }, // F   黄白
  { hex: "#ffe0ae", w: 20 }, // G   黄（类太阳）
  { hex: "#ffc179", w: 28 }, // K   橙
  { hex: "#ff9c62", w: 22 }, // M   橙红
  { hex: "#ff6f4e", w: 2 }, // 红巨星 / 碳星 深红
];
const COLOR_TOTAL = STAR_COLORS.reduce((sum, c) => sum + c.w, 0);

/* 恒星视直径（viewBox 单位）与出现权重：小星为绝对多数 */
const STAR_WIDTHS = [1.2, 1.7, 2.4, 3.6];
const STAR_WIDTH_W = [62, 26, 9, 3];
const STAR_OPACITIES = [0.45, 0.7, 1];

/* 亮星（少数"有名有姓"的成员）：带色晕 + 十字星芒 */
const FEATURE_STARS = [
  { x: 1186, y: 248, color: "#dbe6ff", glow: "cool", core: 2.1, spike: 17, diag: true }, // 蓝超巨星
  { x: 424, y: 694, color: "#ff8a52", glow: "warm", core: 2.6, spike: 15, diag: true }, // 红巨星
  { x: 902, y: 512, color: "#fff8ee", glow: "white", core: 1.7, spike: 12, diag: false }, // 类太阳
  { x: 236, y: 318, color: "#c6d6ff", glow: "cool", core: 1.4, spike: 10, diag: false },
  { x: 1392, y: 612, color: "#ffd8a8", glow: "warm", core: 1.5, spike: 11, diag: false },
];

/* ===== 工具 ===== */

const deg2rad = (d: number) => (d * Math.PI) / 180;
const BAND_U = { x: Math.cos(deg2rad(BAND_ANGLE)), y: Math.sin(deg2rad(BAND_ANGLE)) };
const BAND_N = { x: -Math.sin(deg2rad(BAND_ANGLE)), y: Math.cos(deg2rad(BAND_ANGLE)) };

/* 固定种子 PRNG（mulberry32）：结果可复现，服务端/客户端一致 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeighted(r: number, weights: number[]): number {
  let acc = 0;
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i];
    if (r < acc) return i;
  }
  return weights.length - 1;
}

type Star = { x: number; y: number; ci: number; wi: number; oi: number };

function buildStars(): Star[] {
  const rnd = mulberry32(0x51a7c3);
  const stars: Star[] = [];
  const bandCount = Math.round(STAR_TOTAL * BAND_RATIO);

  const push = (x: number, y: number, inBand: boolean) => {
    const ci = pickWeighted(rnd() * COLOR_TOTAL, STAR_COLORS.map((c) => c.w));
    // 银河带内多为远景恒星：整体更小更暗
    const wi = inBand ? (rnd() < 0.85 ? 0 : 1) : pickWeighted(rnd() * 100, STAR_WIDTH_W);
    const faintBias = inBand ? 0.25 : 0;
    const oi = rnd() < 0.42 + faintBias ? 0 : rnd() < 0.6 ? 1 : 2;
    stars.push({ x, y, ci, wi, oi });
  };

  for (let i = 0; i < STAR_TOTAL; i++) {
    if (i < bandCount) {
      // 沿带方向均匀展开；垂直方向用三次均匀分布之和近似高斯
      const t = (rnd() * 2 - 1) * 1000;
      const g = (rnd() + rnd() + rnd()) / 3 - 0.5;
      const p = g * 300;
      push(CX + BAND_U.x * t + BAND_N.x * p, CY + BAND_U.y * t + BAND_N.y * p, true);
    } else {
      // 视场外留 120 单位余量，切片裁切时边缘不会显得空
      push(-120 + rnd() * (VB_W + 240), -120 + rnd() * (VB_H + 240), false);
    }
  }

  // 疏散星团：一小片聚集恒星，中心有淡蓝雾
  const cluster = mulberry32(0x7c1e5b);
  for (let i = 0; i < 28; i++) {
    const a = cluster() * Math.PI * 2;
    const r = Math.pow(cluster(), 0.7) * 78;
    const x = 512 + Math.cos(a) * r;
    const y = 306 + Math.sin(a) * r * 0.75;
    const ci = pickWeighted(cluster() * COLOR_TOTAL, STAR_COLORS.map((c) => c.w));
    stars.push({ x, y, ci, wi: cluster() < 0.9 ? 0 : 1, oi: cluster() < 0.5 ? 0 : 1 });
  }

  return stars;
}

type StarGroup = { ci: number; wi: number; oi: number; d: string };

/* 按「颜色 + 视直径 + 亮度」分桶，每桶合成一条 path：用 round linecap 的极短线段当点，
   这样 1100 多颗星只需几十个 DOM 节点，而不是一千多个 <circle> */
function groupStars(stars: Star[]): StarGroup[] {
  const map = new Map<string, StarGroup>();
  for (const s of stars) {
    const key = `${s.ci}|${s.wi}|${s.oi}`;
    let g = map.get(key);
    if (!g) {
      g = { ci: s.ci, wi: s.wi, oi: s.oi, d: "" };
      map.set(key, g);
    }
    g.d += `M${s.x.toFixed(1)} ${s.y.toFixed(1)}h.01`;
  }
  return Array.from(map.values());
}

const STAR_GROUPS = groupStars(buildStars());

export default function StarfieldBackground() {
  return (
    <div className="starfield" aria-hidden="true">
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMidYMid slice"
        width="100%"
        height="100%"
      >
        <defs>
          {/* ===== 星云滤镜 =====
              大尺度分形噪声塑形 → 模糊 → feFlood 着色 → feComposite 取交集；
              三支色彩由同一噪声场平移派生，因此形状各不相同又同源。
              成本主要在 feTurbulence 与 feGaussianBlur：若要在低端机上进一步降开销，
              可把 numOctaves 降到 2、stdDeviation 降到 4，或整体去掉本滤镜改用纯渐变。 */}
          <filter
            id="sf-nebula"
            x="0"
            y="0"
            width="100%"
            height="100%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.004 0.006"
              numOctaves="3"
              seed="17"
              result="n1"
            />
            <feColorMatrix in="n1" type="saturate" values="0" result="g1" />
            <feComponentTransfer in="g1" result="shape1">
              <feFuncA type="table" tableValues="0 0.03 0.22 0.7" />
            </feComponentTransfer>
            <feGaussianBlur in="shape1" stdDeviation="7" result="cloud1" />

            <feFlood floodColor="#d92b6a" result="cRed" />
            <feComposite in="cRed" in2="cloud1" operator="in" result="red" />

            <feOffset in="cloud1" dx="300" dy="-160" result="cloud2" />
            <feFlood floodColor="#2f9fb8" result="cTeal" />
            <feComposite in="cTeal" in2="cloud2" operator="in" result="teal" />

            <feOffset in="cloud1" dx="-360" dy="200" result="cloud3" />
            <feFlood floodColor="#6a52d8" result="cViolet" />
            <feComposite in="cViolet" in2="cloud3" operator="in" result="violet" />

            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.015 0.021"
              numOctaves="2"
              seed="43"
              result="n2"
            />
            <feColorMatrix in="n2" type="saturate" values="0" result="g2" />
            <feComponentTransfer in="g2" result="shape2">
              <feFuncA type="table" tableValues="0 0.02 0.1 0.34" />
            </feComponentTransfer>
            <feGaussianBlur in="shape2" stdDeviation="4" result="cloud4" />
            <feFlood floodColor="#ffab5e" result="cAmber" />
            <feComposite in="cAmber" in2="cloud4" operator="in" result="amber" />

            <feMerge>
              <feMergeNode in="red" />
              <feMergeNode in="teal" />
              <feMergeNode in="violet" />
              <feMergeNode in="amber" />
            </feMerge>
          </filter>

          {/* 星系旋臂 / 星芒用的轻量柔化（作用区域很小，开销可忽略） */}
          <filter id="sf-soft" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.5" />
          </filter>

          {/* ===== 渐变 ===== */}
          <linearGradient id="sf-sky" x1="0" y1="0" x2="0.7" y2="1">
            <stop offset="0" stopColor="#05070f" />
            <stop offset="0.45" stopColor="#080b18" />
            <stop offset="1" stopColor="#04050b" />
          </linearGradient>

          <radialGradient id="sf-haze" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#8ea8ff" stopOpacity="0.16" />
            <stop offset="0.55" stopColor="#6d86d8" stopOpacity="0.07" />
            <stop offset="1" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="sf-band" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#93a9ff" stopOpacity="0" />
            <stop offset="0.28" stopColor="#aebfff" stopOpacity="0.1" />
            <stop offset="0.5" stopColor="#d6e0ff" stopOpacity="0.17" />
            <stop offset="0.72" stopColor="#a9bbff" stopOpacity="0.1" />
            <stop offset="1" stopColor="#93a9ff" stopOpacity="0" />
          </linearGradient>

          <radialGradient id="sf-cluster" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#bcd0ff" stopOpacity="0.14" />
            <stop offset="1" stopColor="#bcd0ff" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="sf-dust" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#05060c" stopOpacity="0.85" />
            <stop offset="0.6" stopColor="#05060c" stopOpacity="0.45" />
            <stop offset="1" stopColor="#05060c" stopOpacity="0" />
          </radialGradient>

          {/* 亮星色晕：按色温分暖/冷/白三种 */}
          <radialGradient id="sf-glow-cool" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#b7c8ff" stopOpacity="0.6" />
            <stop offset="0.35" stopColor="#8fa8ff" stopOpacity="0.18" />
            <stop offset="1" stopColor="#8fa8ff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sf-glow-warm" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#ffd7a6" stopOpacity="0.6" />
            <stop offset="0.35" stopColor="#ffb066" stopOpacity="0.18" />
            <stop offset="1" stopColor="#ffb066" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sf-glow-white" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.6" />
            <stop offset="0.35" stopColor="#e8eeff" stopOpacity="0.18" />
            <stop offset="1" stopColor="#e8eeff" stopOpacity="0" />
          </radialGradient>

          {/* 星系：核心 / 盘面 / 侧向薄盘 */}
          <radialGradient id="sf-gal-core" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#fff6e2" stopOpacity="0.85" />
            <stop offset="0.3" stopColor="#ffd9a0" stopOpacity="0.35" />
            <stop offset="1" stopColor="#ffb066" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sf-gal-disk" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#c9d6ff" stopOpacity="0.34" />
            <stop offset="0.5" stopColor="#8ea3e8" stopOpacity="0.14" />
            <stop offset="1" stopColor="#7f92d8" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="sf-gal-edge" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#aebdff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#e6ecff" stopOpacity="0.45" />
            <stop offset="1" stopColor="#aebdff" stopOpacity="0" />
          </linearGradient>

          {/* 暗角：边缘压暗，画面更有纵深 */}
          <radialGradient id="sf-vignette" cx="0.5" cy="0.45" r="0.78">
            <stop offset="0" stopColor="#000000" stopOpacity="0" />
            <stop offset="0.62" stopColor="#000000" stopOpacity="0.12" />
            <stop offset="1" stopColor="#000000" stopOpacity="0.55" />
          </radialGradient>
        </defs>

        {/* 1) 深空底色 */}
        <rect x="0" y="0" width={VB_W} height={VB_H} fill="url(#sf-sky)" />

        {/* 2) 银河带弥漫辉光（倾斜条带 + 中心宽雾） */}
        <g transform={`rotate(${BAND_ANGLE} ${CX} ${CY})`}>
          <rect x={-200} y={CY - 150} width={VB_W + 400} height={300} fill="url(#sf-band)" opacity="0.85" />
          <rect x={-200} y={CY - 52} width={VB_W + 400} height={104} fill="url(#sf-band)" opacity="0.7" />
        </g>
        <ellipse cx={CX} cy={CY - 40} rx={760} ry={380} fill="url(#sf-haze)" />

        {/* 3) 星云：SVG 滤镜生成的分形云团 */}
        <rect
          x="0"
          y="0"
          width={VB_W}
          height={VB_H}
          fill="#000000"
          filter="url(#sf-nebula)"
          opacity={NEBULA_OPACITY}
          style={{ mixBlendMode: "screen" }}
        />

        {/* 4) 疏散星团雾 */}
        <ellipse cx="512" cy="306" rx="130" ry="96" fill="url(#sf-cluster)" />

        {/* 5) 星系 */}
        {/* 5.1 正面旋涡星系 */}
        <g transform="rotate(-26 1120 286)">
          <ellipse cx="1120" cy="286" rx="122" ry="54" fill="url(#sf-gal-disk)" opacity="0.75" />
          <ellipse cx="1120" cy="286" rx="98" ry="41" fill="url(#sf-gal-disk)" opacity="0.55" />
          <g filter="url(#sf-soft)" stroke="#c3d1ff" fill="none" strokeLinecap="round">
            <path d="M1120 286 Q1166 262 1176 316 Q1182 356 1138 368" strokeWidth="5" opacity="0.16" />
            <path d="M1120 286 Q1074 310 1064 256 Q1058 216 1102 204" strokeWidth="5" opacity="0.16" />
            <path d="M1120 286 Q1140 250 1096 236" strokeWidth="3" opacity="0.12" />
            <path d="M1120 286 Q1100 322 1144 336" strokeWidth="3" opacity="0.12" />
          </g>
          <ellipse cx="1120" cy="286" rx="30" ry="16" fill="url(#sf-gal-core)" />
          <ellipse cx="1120" cy="286" rx="5" ry="4" fill="#fffaf0" opacity="0.9" />
        </g>

        {/* 5.2 椭圆星系（老年恒星为主，偏暖） */}
        <g transform="rotate(18 332 762)">
          <ellipse cx="332" cy="762" rx="62" ry="40" fill="url(#sf-gal-disk)" opacity="0.5" />
          <ellipse cx="332" cy="762" rx="40" ry="26" fill="url(#sf-gal-core)" opacity="0.7" />
          <ellipse cx="332" cy="762" rx="4" ry="3.4" fill="#fff3dd" opacity="0.85" />
        </g>

        {/* 5.3 侧向星系（薄盘 + 中央尘埃分割线） */}
        <g transform="rotate(-38 1400 642)">
          <ellipse cx="1400" cy="642" rx="80" ry="14" fill="url(#sf-gal-disk)" opacity="0.55" />
          <ellipse cx="1400" cy="642" rx="74" ry="2.6" fill="url(#sf-gal-edge)" />
          <ellipse cx="1400" cy="642" rx="68" ry="1.7" fill="#05060c" opacity="0.55" />
          <ellipse cx="1400" cy="642" rx="18" ry="8" fill="url(#sf-gal-core)" opacity="0.8" />
        </g>

        {/* 6) 恒星场：按颜色/大小/亮度分桶的极短线段，round linecap 即圆点 */}
        <g shapeRendering="geometricPrecision">
          {STAR_GROUPS.map((g, i) => (
            <path
              key={i}
              d={g.d}
              stroke={STAR_COLORS[g.ci].hex}
              strokeWidth={STAR_WIDTHS[g.wi]}
              strokeLinecap="round"
              opacity={STAR_OPACITIES[g.oi]}
            />
          ))}
        </g>

        {/* 7) 暗尘埃带：遮挡银河带后方的恒星（真实银河照片的关键特征） */}
        <g style={{ mixBlendMode: "multiply" }} opacity="0.8">
          <ellipse cx="760" cy="470" rx="300" ry="42" fill="url(#sf-dust)" transform="rotate(-20 760 470)" />
          <ellipse cx="1090" cy="420" rx="220" ry="30" fill="url(#sf-dust)" transform="rotate(-20 1090 420)" />
          <ellipse cx="520" cy="620" rx="260" ry="36" fill="url(#sf-dust)" transform="rotate(-20 520 620)" />
        </g>

        {/* 8) 亮星：色晕 + 星核 + 十字（最亮的另加对角星芒） */}
        {FEATURE_STARS.map((s, i) => (
          <g key={i}>
            <circle cx={s.x} cy={s.y} r={s.spike * 1.5} fill={`url(#sf-glow-${s.glow})`} opacity="0.9" />
            <circle cx={s.x} cy={s.y} r={s.core * 0.75} fill="#ffffff" opacity="0.92" />
            <circle cx={s.x} cy={s.y} r={s.core} fill={s.color} opacity="0.75" />
            <path
              d={`M${s.x - s.spike} ${s.y}h${s.spike * 2}M${s.x} ${s.y - s.spike}v${s.spike * 2}`}
              stroke={s.color}
              strokeWidth="0.7"
              opacity="0.32"
            />
            {s.diag && (
              <path
                d={`M${s.x - s.spike * 0.55} ${s.y - s.spike * 0.55}l${s.spike * 1.1} ${s.spike * 1.1}M${s.x - s.spike * 0.55} ${s.y + s.spike * 0.55}l${s.spike * 1.1} -${s.spike * 1.1}`}
                stroke={s.color}
                strokeWidth="0.5"
                opacity="0.2"
              />
            )}
          </g>
        ))}

        {/* 9) 双星：一颗橙红 + 一颗蓝白，视觉上互相绕转 */}
        <g>
          <circle cx="668" cy="836" r="26" fill="url(#sf-glow-warm)" opacity="0.7" />
          <circle cx="662" cy="836" r="1.9" fill="#ffc179" />
          <circle cx="674" cy="832" r="1.4" fill="#cbd9ff" />
        </g>

        {/* 10) 暗角 */}
        <rect x="0" y="0" width={VB_W} height={VB_H} fill="url(#sf-vignette)" />
      </svg>
    </div>
  );
}
