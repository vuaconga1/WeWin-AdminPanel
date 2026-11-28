# WeWIN Admin Panel — Frontend Design Guide

Tài liệu này mô tả phong cách giao diện hiện tại của **WeWIN Admin Panel** để designer / frontend giữ layout, màu sắc và cảm giác thương hiệu đồng nhất khi làm màn mới hoặc sản phẩm anh em trong hệ WeWIN.

Nguồn chân lý trong code: `src/app/globals.css`, `src/components/admin-shell.tsx`, `src/components/hub-home.tsx`, `src/components/login-form.tsx`.

---

## 1. Tính cách thương hiệu

| Thuộc tính | Mô tả |
|---|---|
| **Tone** | Giáo dục uy tín, admin chuyên nghiệp, không “startup neon” |
| **Palette cảm xúc** | Navy đậm (uy tín) + vàng gold (WeWIN) + nền sáng lạnh |
| **Không khí** | Glass nhẹ trên sidebar, gradient nền tinh tế, hero navy đậm |
| **Tránh** | Purple-on-white mặc định AI, cream/terracotta, dark mode toàn app, glow mạnh, pill cluster dày |

**Brand signal bắt buộc trên header:** dòng nhỏ `WeWIN Education` (gold, uppercase tracking rộng) + tên sản phẩm bên dưới (trắng).

---

## 2. Màu sắc (Design tokens)

Dùng đúng token CSS / Tailwind dưới đây. Không invent màu brand mới nếu chưa thống nhất.

### Brand & surface

| Token | Hex / giá trị | Vai trò |
|---|---|---|
| `--wewin-navy` | `#0d1b3e` | Primary: header, CTA, tab active, text brand |
| `--wewin-navy-hover` | `#0a1530` | Hover của navy |
| `--wewin-gold` | `#d4af37` | Accent brand (eyebrow, icon nhấn) |
| `--wewin-gold-soft` | `#e8d48b` | Gold nhạt trên nền tối (hero eyebrow) |
| `--wewin-bg` | `#f3f5f8` | Nền app (đi cùng gradient body) |
| `--wewin-white` | `#ffffff` | Card / panel |
| `--wewin-border` | `#e5e7eb` | Viền panel, divider |
| `--wewin-accent-blue` | `#2d74da` | Focus ring / accent phụ |
| `--wewin-accent-blue-bg` | `#e6f0ff` | Nền icon tile nhỏ |
| Foreground | `#18181b` | Text chính |

### Tailwind classes tương ứng

`bg-wewin-navy`, `text-wewin-navy`, `bg-wewin-gold`, `text-wewin-gold`, `border-wewin-border`, `bg-wewin-accent-blue-bg`, …

### Semantic (trạng thái — không phải brand)

| Mục đích | Pattern |
|---|---|
| Success / điểm số | `text-emerald-800`, avatar `bg-emerald-50` |
| Warning / fallback data | `border-amber-200 bg-amber-50 text-amber-900` |
| Error | `border-rose-200 bg-rose-50 text-rose-800` |
| Badge NTL | `bg-sky-50 text-sky-800` |
| Badge XVNT | `bg-violet-50 text-violet-800` |
| Badge Admin (role) | `bg-violet-100 text-violet-700` |
| Mute text | `text-zinc-500` / `text-zinc-600` |
| Hover row | `hover:bg-zinc-50/80` |

### Nền trang (body)

Không flat một màu. Dùng stack gradient:

1. Radial gold mềm góc trên-trái (~12% opacity)
2. Radial accent-blue mềm góc trên-phải
3. Linear `160deg`: `#e8eefc` → `--wewin-bg` → `#eef1f7`

### Sidebar surface

Glass: trắng/xanh nhạt + `backdrop-filter: blur(16px) saturate(1.4)`, viền phải trắng mờ, shadow nhẹ navy.

### Nav item active

Gradient ngang navy → navy mid → gold (`#0a1530` → `#1a2b55` → `#b8902f`), chữ trắng, shadow nhẹ. Shape: **pill** (`rounded-full`).

---

## 3. Typography

| Mục | Quy ước |
|---|---|
| **Font** | Be Vietnam Pro (variable `--font-manrope` trong code) |
| **Weights** | 400 / 500 / 600 / 700 |
| **Body** | `text-sm` mặc định cho UI mật độ admin |
| **Page title (hero)** | `text-2xl sm:text-3xl font-bold tracking-tight` |
| **Section title** | `text-lg` hoặc `text-base font-bold text-zinc-900` |
| **Eyebrow / brand micro** | `text-[11px]` hoặc `text-xs`, `font-bold uppercase`, `tracking-[0.18em]`–`[0.2em]`, màu gold |
| **Nav section label** | `text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400` |
| **Table header** | `text-[10px] font-bold uppercase tracking-wide text-zinc-500` |
| **Số liệu** | `tabular-nums`, `text-2xl font-bold` trên stat card |

Luôn hỗ trợ tiếng Việt (font đã load subset `vietnamese`).

---

## 4. Layout khung app

### Cấu trúc tổng

```
┌─────────────────────────────────────────────┐
│  Header sticky — navy, h-16 (4rem)          │
├──────────┬──────────────────────────────────┤
│ Sidebar  │  Main                            │
│ 260px    │  px-4/6 py-5/7                   │
│ (68px    │  max-w-[1400px] mx-auto          │
│ collapse)│  children                        │
└──────────┴──────────────────────────────────┘
```

| Vùng | Spec |
|---|---|
| **Header** | Sticky top, `z-40`, `bg-wewin-navy`, border-b `white/10`, text trắng |
| **Sidebar** | Desktop `lg+`: sticky dưới header, width `260px` / collapsed `68px`, transition 250ms |
| **Mobile nav** | Drawer trái `max 280px` + overlay `navy/40` |
| **Main** | `flex-1`, content `max-w-[1400px]` |
| **Login** | Không shell; card giữa màn `max-w-lg`, `min-h-screen` center |

### Header nội dung (trái → phải)

1. Menu button (mobile only)
2. Brand block: eyebrow gold `WeWIN Education` + title trắng
3. Chip `WeWIN Admin` (border `white/15`, bg `white/5`) — ẩn mobile nhỏ
4. Locale label (vd. `VI`)
5. Logout: border `white/20`, hover `white/10`

### Sidebar nội dung (trên → dưới)

1. Avatar initials (circle navy) + tên + badge `Admin`
2. Box status tài khoản (compact ẩn khi collapse)
3. Nav: Home → section label “Sản phẩm” → product links
4. Nút collapse ở đáy

---

## 5. Spacing, radius, elevation

| Token ý niệm | Giá trị thường dùng |
|---|---|
| **Page stack** | `space-y-5` giữa các khối lớn |
| **Card padding** | `px-4 py-3` → `px-5 py-4` / hero `px-5 py-6 sm:px-7 sm:py-8` |
| **Form gap** | `space-y-3` |
| **Radius panel** | `rounded-xl` hoặc `rounded-2xl` (hero, login) |
| **Radius control** | `rounded-lg` (button, input, tab) |
| **Radius nav / avatar** | `rounded-full` |
| **Shadow panel** | `shadow-sm` — không multi-layer nặng |
| **Touch target** | nút/tab tối thiểu ~`min-h-10` |

---

## 6. Patterns màn hình

### 6.1 Hero banner (trang nội dung)

- Block full-width trong main: `rounded-2xl`
- Nền: `bg-gradient-to-br from-wewin-navy via-[#142852] to-wewin-navy-hover`
- Eyebrow gold-soft → H1 trắng → mô tả `text-white/80 text-sm`
- Icon trang trí lớn (gold ~40% opacity) góc phải, chỉ desktop — **không** badge nổi chồng lên hero

### 6.2 Section tabs (cấp trang)

Hàng pill/button ngang:

- Active: `bg-wewin-navy text-white`
- Idle: `border border-wewin-border bg-white text-zinc-700 hover:bg-zinc-50`
- Có icon Lucide `h-4 w-4` + label

### 6.3 Nested tabs (trong panel, vd. IELTS / Cambridge)

- Nằm dưới header panel, `rounded-t-lg`
- Active navy / idle `bg-zinc-100`

### 6.4 Stat cards

- Grid `1 → 3` cột
- `rounded-xl border border-wewin-border bg-white shadow-sm`
- Icon tile `h-10 w-10 rounded-lg bg-wewin-accent-blue-bg`
- Label nhỏ zinc-500 + số lớn zinc-900

### 6.5 Data panel + table

```
┌─ Panel (white, border, rounded-xl, shadow-sm) ─┐
│ Header: title + subtitle                         │
│ Tabs (optional)                                  │
│ Toolbar: search + select + primary button        │
│ Table                                            │
└──────────────────────────────────────────────────┘
```

- Thead: nền `zinc-50`, chữ uppercase siêu nhỏ
- Row: `border-t border-zinc-100`, hover zinc-50
- Cột học viên: avatar initials circle + tên đậm + id phụ
- Link hành động: `text-wewin-navy font-semibold` + icon `ExternalLink`

Layout hub điển hình: **main list `1fr` + aside `260px`** từ breakpoint `xl`.

### 6.6 Aside widgets

- Panel trắng chuẩn (danh sách link nền tảng)
- Hoặc panel soft amber (`border-amber-200 bg-amber-50/40`) cho tài nguyên / callout phụ — dùng có chủ đích, không lạm dụng

### 6.7 Login card

- `rounded-2xl border bg-white p-8 shadow-sm`
- Eyebrow gold `WeWIN` → title navy → mô tả zinc-600
- Input: `rounded-lg border`, focus `ring-2 ring-wewin-accent-blue/30`
- Submit full-width navy; disabled `opacity-60`
- Form: `noValidate` + lỗi inline semantic rose

### 6.8 Alerts

| Loại | Class gợi ý |
|---|---|
| Warning | `rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900` |
| Error | `rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800` |

---

## 7. Components & tương tác

### Buttons

| Variant | Style |
|---|---|
| **Primary** | `bg-wewin-navy text-white hover:bg-wewin-navy-hover rounded-lg font-semibold` |
| **Ghost on navy** | `border white/20 bg-white/5 hover:bg-white/10` |
| **Secondary / idle tab** | white + border wewin-border |
| **Soft accent (material)** | white + `border-amber-300 text-amber-900` |

Disable khi đang submit; không double-submit.

### Inputs

- Border `zinc-300` hoặc `wewin-border`
- Focus: `border-wewin-navy` + ring accent-blue mờ
- Search debounce ~300ms (pattern hub)

### Icons

- Thư viện: **Lucide React**
- Kích thước UI: `h-3.5`–`h-5` (thường `h-4 w-4`)
- Decorative hero: `h-16 w-16`

### Motion

Giữ tối giản: sidebar width 250ms ease, hover màu/background. Không animation ồn, không glow pulse.

---

## 8. Responsive

| Breakpoint | Hành vi |
|---|---|
| `< lg` | Ẩn sidebar rail; dùng drawer + overlay |
| `sm+` | Hiện chip header, logout text, padding lớn hơn |
| `xl+` | Hub: list + aside 260px cạnh nhau |
| Mọi size | Table `overflow-x-auto`, `min-w` hợp lý; tránh tràn ngang body |

---

## 9. Checklist khi thiết kế màn mới

1. Có eyebrow gold + hierarchy chữ giống hero/header không?
2. Primary action có dùng **navy** (không tím / không gradient CTA lạ) không?
3. Panel có `rounded-xl/2xl` + `border-wewin-border` + `shadow-sm` không?
4. Nền trang có cảm giác gradient nhẹ (không flat xám) không?
5. Tab active = navy đặc; idle = trắng/zinc — nhất quán chưa?
6. Badge trạng thái dùng semantic (emerald / amber / rose / sky / violet theo bảng trên)?
7. Mobile: toolbar wrap được, table scroll ngang, không phá header sticky?
8. Copy UI tiếng Việt rõ; số giờ theo **Asia/Bangkok (UTC+7)** nếu hiện thời gian?

---

## 10. Ví dụ nhanh (Tailwind mental model)

**Primary button**

```html
<button class="rounded-lg bg-wewin-navy px-3 py-2 text-sm font-semibold text-white hover:bg-wewin-navy-hover">
  Làm mới
</button>
```

**Panel**

```html
<section class="rounded-xl border border-wewin-border bg-white shadow-sm">
  ...
</section>
```

**Hero**

```html
<section class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-wewin-navy via-[#142852] to-wewin-navy-hover px-5 py-6 text-white sm:px-7 sm:py-8">
  <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-wewin-gold-soft">WeWIN · …</p>
  <h1 class="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">…</h1>
  <p class="mt-2 max-w-xl text-sm text-white/80">…</p>
</section>
```

---

## 11. File tham chiếu trong repo

| File | Nội dung |
|---|---|
| `src/app/globals.css` | Tokens, body gradient, sidebar, nav-active |
| `src/app/layout.tsx` | Font Be Vietnam Pro |
| `src/components/admin-shell.tsx` | Header + sidebar + main frame |
| `src/components/hub-home.tsx` | Hero, tabs, stats, table, aside |
| `src/components/login-form.tsx` | Auth card |
| `src/components/fastbots-chats.tsx` | List/filter/detail pattern phụ |

Khi thiết kế Figma / wireframe: đặt **navy `#0D1B3E`** và **gold `#D4AF37`** làm cặp brand cố định; surface sáng `#F3F5F8` / trắng; radius 12–16px cho panel; nav active dạng pill gradient navy→gold.
