"""
Generate Docaya EDMS Technical Architecture diagrams (v1.2) as PNG images.

All diagrams reflect the updated Functional Business Design:
- NO AI / RAG / Azure OpenAI / vector search anywhere.
- Search = Azure metadata + full-text over approved content.
- Modules M1..M16 including review-chain, SLA engine, correspondence,
  change requests, Power BI Embedded analytics, audit & compliance.
- Configurable 3-4 level review chain and working-day SLA/timeline engine.

Rendered with Pillow only (no external graph engine needed) so it runs on any
machine with python-docx + Pillow installed.
"""
from __future__ import annotations

import os
from PIL import Image, ImageDraw, ImageFont

OUT_DIR = os.path.join(os.path.dirname(__file__), "_tad_assets")
os.makedirs(OUT_DIR, exist_ok=True)

# ---- Brand palette -------------------------------------------------------
NAVY = (16, 42, 67)
BLUE = (0, 120, 212)
TEAL = (0, 153, 168)
GREEN = (46, 125, 50)
ORANGE = (216, 120, 20)
PURPLE = (98, 60, 148)
SLATE = (71, 85, 105)
LIGHT = (241, 245, 249)
CARD = (255, 255, 255)
INK = (30, 41, 59)
WHITE = (255, 255, 255)
GREY = (148, 163, 184)
ZONE_BG = (247, 250, 252)


def _font(size: int, bold: bool = False):
    candidates = (
        ["segoeuib.ttf", "arialbd.ttf", "DejaVuSans-Bold.ttf"]
        if bold
        else ["segoeui.ttf", "arial.ttf", "DejaVuSans.ttf"]
    )
    for name in candidates:
        try:
            return ImageFont.truetype(name, size)
        except Exception:
            continue
    return ImageFont.load_default()


def _rr(draw, box, radius, fill=None, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def _text_wrap(draw, text, font, max_w):
    words = text.split()
    lines, cur = [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if draw.textlength(trial, font=font) <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def _center_text(draw, box, text, font, fill, max_w=None, line_gap=3):
    x0, y0, x1, y1 = box
    max_w = max_w or (x1 - x0 - 12)
    lines = _text_wrap(draw, text, font, max_w)
    ascent, descent = font.getmetrics()
    lh = ascent + descent + line_gap
    total_h = lh * len(lines) - line_gap
    ty = y0 + ((y1 - y0) - total_h) / 2
    for ln in lines:
        tw = draw.textlength(ln, font=font)
        draw.text((x0 + ((x1 - x0) - tw) / 2, ty), ln, font=font, fill=fill)
        ty += lh


def card(draw, box, title, subtitle=None, fill=CARD, title_fill=INK,
         sub_fill=SLATE, outline=GREY, accent=None):
    x0, y0, x1, y1 = box
    _rr(draw, box, 10, fill=fill, outline=outline, width=2)
    if accent:
        _rr(draw, (x0, y0, x0 + 8, y1), 10, fill=accent)
        draw.rectangle((x0 + 6, y0 + 2, x0 + 10, y1 - 2), fill=fill)
    ft = _font(15, bold=True)
    fs = _font(12)
    if subtitle:
        _center_text(draw, (x0 + 6, y0 + 6, x1 - 4, y0 + (y1 - y0) * 0.55),
                     title, ft, title_fill, max_w=x1 - x0 - 16)
        _center_text(draw, (x0 + 6, y0 + (y1 - y0) * 0.52, x1 - 4, y1 - 4),
                     subtitle, fs, sub_fill, max_w=x1 - x0 - 16)
    else:
        _center_text(draw, (x0 + 6, y0 + 4, x1 - 4, y1 - 4), title, ft,
                     title_fill, max_w=x1 - x0 - 16)


def zone(draw, box, label, color):
    x0, y0, x1, y1 = box
    _rr(draw, box, 14, fill=ZONE_BG, outline=color, width=2)
    fb = _font(15, bold=True)
    pad = 10
    draw.rounded_rectangle((x0 + pad, y0 - 14, x0 + pad + 14 +
                            draw.textlength(label, font=fb), y0 + 14),
                           radius=8, fill=color)
    draw.text((x0 + pad + 8, y0 - 8), label, font=fb, fill=WHITE)


def arrow(draw, p0, p1, color=SLATE, width=3, dashed=False, label=None,
          label_fill=None):
    x0, y0 = p0
    x1, y1 = p1
    if dashed:
        _dashed_line(draw, p0, p1, color, width)
    else:
        draw.line([p0, p1], fill=color, width=width)
    import math
    ang = math.atan2(y1 - y0, x1 - x0)
    size = 9
    draw.polygon(
        [
            (x1, y1),
            (x1 - size * math.cos(ang - 0.5), y1 - size * math.sin(ang - 0.5)),
            (x1 - size * math.cos(ang + 0.5), y1 - size * math.sin(ang + 0.5)),
        ],
        fill=color,
    )
    if label:
        fl = _font(11, bold=True)
        mx, my = (x0 + x1) / 2, (y0 + y1) / 2
        tw = draw.textlength(label, font=fl)
        _rr(draw, (mx - tw / 2 - 5, my - 11, mx + tw / 2 + 5, my + 9), 6,
            fill=WHITE, outline=color, width=1)
        draw.text((mx - tw / 2, my - 8), label, font=fl,
                  fill=label_fill or color)


def _dashed_line(draw, p0, p1, color, width, dash=10, gap=7):
    import math
    x0, y0 = p0
    x1, y1 = p1
    total = math.hypot(x1 - x0, y1 - y0)
    if total == 0:
        return
    dx, dy = (x1 - x0) / total, (y1 - y0) / total
    dist = 0
    while dist < total:
        sx, sy = x0 + dx * dist, y0 + dy * dist
        ed = min(dist + dash, total)
        ex, ey = x0 + dx * ed, y0 + dy * ed
        draw.line([(sx, sy), (ex, ey)], fill=color, width=width)
        dist += dash + gap


def header_banner(draw, W, title, subtitle):
    draw.rectangle((0, 0, W, 64), fill=NAVY)
    draw.text((28, 14), "DOCAYA", font=_font(22, bold=True), fill=WHITE)
    draw.text((28, 42), title, font=_font(13), fill=(200, 214, 229))
    fs = _font(12)
    tw = draw.textlength(subtitle, font=fs)
    draw.text((W - tw - 28, 26), subtitle, font=fs, fill=(160, 190, 220))


def legend(draw, box, items):
    x0, y0, x1, y1 = box
    _rr(draw, box, 8, fill=CARD, outline=GREY, width=1)
    fl = _font(11)
    fx = x0 + 12
    for label, color, dashed in items:
        cy = y0 + 15
        if dashed:
            _dashed_line(draw, (fx, cy), (fx + 26, cy), color, 3)
        else:
            draw.line([(fx, cy), (fx + 26, cy)], fill=color, width=4)
        draw.text((fx + 32, cy - 7), label, font=fl, fill=INK)
        fx += 44 + draw.textlength(label, font=fl)


# =========================================================================
# Figure 1 — Solution Architecture
# =========================================================================
def build_solution_architecture():
    W, H = 1750, 1150
    img = Image.new("RGB", (W, H), LIGHT)
    d = ImageDraw.Draw(img)
    header_banner(d, W, "Technical Architecture Document · v1.2",
                  "Figure 1 — Solution Architecture")

    # Zone 1: Users & Channels
    zone(d, (40, 100, 470, 250), "1 · Users & Channels", BLUE)
    card(d, (60, 130, 250, 235), "Web SPA (Docaya)",
         "Capture · Review · Search · Analytics", accent=BLUE)
    card(d, (265, 130, 455, 235), "Teams / Outlook",
         "Reviews & notifications", accent=BLUE)

    # Zone 2: Identity & SSO
    zone(d, (500, 100, 900, 250), "2 · Identity & SSO", PURPLE)
    card(d, (520, 130, 690, 235), "UAE PASS",
         "National SSO", accent=PURPLE)
    card(d, (705, 130, 880, 235), "Microsoft Entra ID",
         "Tokens · MFA · CA", accent=PURPLE)

    # Zone 3: Security Edge
    zone(d, (930, 100, 1710, 250), "3 · Security Edge", NAVY)
    card(d, (950, 130, 1140, 235), "Azure Front Door",
         "Global entry · CDN", accent=NAVY)
    card(d, (1155, 130, 1345, 235), "Web App Firewall",
         "OWASP · bot control", accent=NAVY)
    card(d, (1360, 130, 1690, 235), "Azure API Management",
         "JWT validation · throttling · versioning", accent=NAVY)

    # Zone 4: Application Services (M1..M16)
    zone(d, (40, 300, 1090, 560), "4 · Application Services  (Modules M1–M16)", BLUE)
    mods = [
        "M1 Capture &\nRegistration", "M2 Classification\n(manual)",
        "M3 Workflow &\nReview Chain", "M4 Promotion &\nPublishing",
        "M5 Staging\nLifecycle", "M6 Text Extraction\n& Search Data",
        "M7 Notification\nCenter", "M8 Correspondence\nManagement",
        "M9 Records &\nRetention", "M10 Search &\nDiscovery",
        "M11 Identity &\nSharePoint", "M12 Access Control\nRBAC+ABAC",
        "M13 Admin Center\n& Level Designer", "M14 Existing-Doc\nModification",
        "M15 Analytics\n(Power BI)", "M16 Audit &\nCompliance",
    ]
    cols, cw, ch, gx, gy = 8, 118, 92, 12, 14
    ox, oy = 62, 340
    for i, m in enumerate(mods):
        r, c = divmod(i, cols)
        x0 = ox + c * (cw + gx)
        y0 = oy + r * (ch + gy)
        parts = m.split("\n", 1)
        title = parts[0]
        sub = parts[1] if len(parts) > 1 else None
        card(d, (x0, y0, x0 + cw, y0 + ch), title, sub, accent=TEAL)

    # Zone 5: Async orchestration & messaging
    zone(d, (1120, 300, 1710, 560), "5 · Async Orchestration & Messaging", ORANGE)
    card(d, (1140, 335, 1330, 425), "Durable Functions",
         "Review-chain & promotion orchestration", accent=ORANGE)
    card(d, (1345, 335, 1690, 425), "Azure Service Bus",
         "Queues · topics · domain events", accent=ORANGE)
    card(d, (1140, 445, 1330, 545), "Timer Functions",
         "SLA & timeline engine · staging cleanup", accent=ORANGE)
    card(d, (1345, 445, 1690, 545), "Azure SignalR",
         "Real-time review & notification push", accent=ORANGE)

    # Zone 6: Data & Content
    zone(d, (40, 610, 1090, 860), "6 · Data & Content", GREEN)
    card(d, (62, 645, 300, 760), "Azure SQL Database",
         "Registry · metadata · workflow · SLA timers · comments · hash-chained audit",
         accent=GREEN)
    card(d, (315, 645, 540, 760), "Blob Storage (Staging)",
         "Original files pre-approval · lifecycle rules", accent=GREEN)
    card(d, (555, 645, 790, 760), "Azure metadata &\nfull-text search".replace("\n", " "),
         "Full-text + metadata index over approved content (no AI/vectors)",
         accent=GREEN)
    card(d, (805, 645, 1070, 760), "Azure Cache for Redis",
         "Sessions · presence · unread counts", accent=GREEN)
    card(d, (62, 775, 540, 850), "Content-safety gate",
         "Malware scan + DLP / classification checks before commit", accent=GREEN)
    card(d, (555, 775, 1070, 850), "Power BI semantic model",
         "Analytics dataset over Azure SQL · row-level security mirrors RBAC+ABAC",
         accent=GREEN)

    # Zone 7: Microsoft 365 System of Record
    zone(d, (1120, 610, 1710, 860), "7 · Microsoft 365 — System of Record", TEAL)
    card(d, (1140, 645, 1690, 720), "SharePoint Online",
         "Governed libraries · native versioning · content system of record",
         accent=TEAL)
    card(d, (1140, 735, 1410, 850), "Microsoft Graph",
         "Drive-item APIs for promotion & retrieval (OBO / app-only)", accent=TEAL)
    card(d, (1425, 735, 1690, 850), "Comm. Services + Graph",
         "Email · Teams/Outlook notifications", accent=TEAL)

    # Zone 8: Cross-cutting platform
    zone(d, (40, 910, 1710, 1010), "8 · Cross-Cutting Platform", SLATE)
    xcut = [
        ("Key Vault", "secrets · keys · certs"),
        ("Managed Identity", "secretless workload auth"),
        ("Defender for Cloud", "threat & malware protection"),
        ("Microsoft Purview", "sensitivity labels · DLP"),
        ("Power BI Embedded", "in-app dashboards · RLS"),
        ("Azure Monitor", "OpenTelemetry · Log Analytics"),
    ]
    xw = (1710 - 40 - 40) / 6
    for i, (t, s) in enumerate(xcut):
        x0 = 60 + i * xw
        card(d, (x0, 935, x0 + xw - 16, 1000), t, s, accent=SLATE)

    # Flow arrows
    arrow(d, (255, 190), (515, 190), color=PURPLE, width=3)          # users->identity
    arrow(d, (895, 190), (945, 190), color=NAVY, width=3)            # identity->edge
    arrow(d, (1360, 235), (560, 305), color=NAVY, width=3)          # edge->app
    arrow(d, (565, 555), (565, 640), color=GREEN, width=4,
          label="capture → SQL + staging")
    # staging-first promotion path (orange)
    arrow(d, (1090, 470), (1130, 470), color=ORANGE, width=4)
    arrow(d, (1410, 555), (1410, 640), color=ORANGE, width=4,
          label="promote on final approval")
    # search-data path (teal, no AI)
    arrow(d, (1140, 690), (795, 700), color=TEAL, width=3, dashed=True,
          label="published content")
    arrow(d, (675, 760), (675, 640), color=TEAL, width=3, dashed=True,
          label="full-text + metadata index")
    # analytics path
    arrow(d, (300, 760), (555, 810), color=GREEN, width=3, dashed=True)
    arrow(d, (810, 810), (900, 700), color=(0, 90, 40), width=2, dashed=True,
          label="Power BI dataset")

    legend(d, (40, 1030, 1710, 1075), [
        ("Synchronous request flow", NAVY, False),
        ("Staging-first promotion", ORANGE, False),
        ("Search-data & analytics (no AI)", TEAL, True),
    ])
    d.text((44, 1090), "No AI/RAG, embeddings or vector search at any stage. "
           "Search is Azure metadata + full-text over approved content only.",
           font=_font(12, bold=True), fill=NAVY)

    path = os.path.join(OUT_DIR, "fig1_solution_architecture.png")
    img.save(path, "PNG")
    return path


# =========================================================================
# Figure 2 — Application Architecture (layered)
# =========================================================================
def build_application_architecture():
    W, H = 1750, 1150
    img = Image.new("RGB", (W, H), LIGHT)
    d = ImageDraw.Draw(img)
    header_banner(d, W, "Technical Architecture Document · v1.2",
                  "Figure 2 — Application Architecture")

    def layer(y0, y1, label, color):
        zone(d, (40, y0, 1560, y1), label, color)

    # Presentation
    layer(100, 250, "Presentation Tier — React 18 + TypeScript + Fluent UI (Azure Static Web Apps)", BLUE)
    feats = ["Dashboard", "Capture & Register", "My Documents",
             "Reviews & Approvals", "Search & Discovery", "Correspondence",
             "Notification Center", "Records & Retention",
             "Analytics (Power BI)", "Audit Trail", "Admin Center",
             "Change Requests"]
    fw = (1560 - 40 - 40) / 6
    for i, f in enumerate(feats):
        r, c = divmod(i, 6)
        x0 = 60 + c * fw
        y0 = 135 + r * 55
        card(d, (x0, y0, x0 + fw - 14, y0 + 46), f, accent=BLUE)

    # API / BFF
    layer(275, 400, "API Gateway & Backend-for-Frontend (behind Azure API Management)", NAVY)
    stages = ["Authentication", "Authorization\nRBAC+ABAC", "Validation",
              "Rate limiting", "Correlation ID", "Error envelope"]
    sw = (1560 - 40 - 40) / 6
    for i, s in enumerate(stages):
        x0 = 60 + i * sw
        title = s.replace("\n", " ")
        card(d, (x0, 315, x0 + sw - 14, 388), title, accent=NAVY)

    # Application services
    layer(425, 605, "Application Services — Domain Modules (M1–M16)", TEAL)
    mods = ["M1 Capture &\nRegistration", "M2 Classification", "M3 Workflow &\nReview Chain",
            "M4 Promotion", "M5 Staging\nLifecycle", "M6 Text Extraction\n& Search Data",
            "M7 Notification", "M8 Correspondence", "M9 Records &\nRetention",
            "M10 Search &\nDiscovery", "M11 Identity &\nSharePoint", "M12 Access Control",
            "M13 Admin &\nLevel Designer", "M14 Existing-Doc\nModification",
            "M15 Analytics", "M16 Audit &\nCompliance"]
    cols = 8
    cw = (1560 - 40 - 40) / cols
    for i, m in enumerate(mods):
        r, c = divmod(i, cols)
        x0 = 60 + c * cw
        y0 = 465 + r * 68
        title, *sub = m.split("\n")
        card(d, (x0, y0, x0 + cw - 12, y0 + 58), title,
             sub[0] if sub else None, accent=TEAL)

    # Domain model & business logic
    layer(630, 760, "Domain Model & Business Logic (infrastructure-independent)", PURPLE)
    dom = [("Workflow engine", "states · transitions · guards"),
           ("Review-chain engine", "3–4 configurable levels · return-to-stage"),
           ("SLA & timeline engine", "working-day timers · extensions · bottlenecks"),
           ("Routing & rules", "class/standard → library & reviewers"),
           ("Policy engine", "retention · legal hold · ABAC"),
           ("Domain entities", "Document · Version · ReviewStage · CommentThread")]
    dw = (1560 - 40 - 40) / 3
    for i, (t, s) in enumerate(dom):
        r, c = divmod(i, 3)
        x0 = 60 + c * dw
        y0 = 668 + r * 46
        card(d, (x0, y0, x0 + dw - 14, y0 + 40), t, s, accent=PURPLE)

    # Integration adapters
    layer(785, 890, "Integration & Anti-Corruption Adapters", ORANGE)
    adapters = [("Graph Adapter", "SharePoint drive-items"),
                ("Search Adapter", "metadata + full-text"),
                ("Analytics Adapter", "Power BI Embedded"),
                ("Notification Providers", "email · Teams · SignalR"),
                ("Storage Adapter", "Blob staging streaming"),
                ("Identity Adapter", "UAE PASS · Entra · MI")]
    aw = (1560 - 40 - 40) / 6
    for i, (t, s) in enumerate(adapters):
        x0 = 60 + i * aw
        card(d, (x0, 820, x0 + aw - 14, 880), t, s, accent=ORANGE)

    # Data access
    layer(915, 1010, "Data Access & Persistence (repository + unit-of-work, EF Core)", GREEN)
    stores = ["Azure SQL\n(registry/metadata/\naudit/SLA/comments)",
              "Blob Staging\n(original files)",
              "Metadata + full-text\nsearch index",
              "Redis\n(cache)",
              "SharePoint Online\n(published records)",
              "Power BI\n(semantic model)"]
    stw = (1560 - 40 - 40) / 6
    for i, s in enumerate(stores):
        x0 = 60 + i * stw
        title = s.replace("\n", " ")
        card(d, (x0, 945, x0 + stw - 14, 1002), title, accent=GREEN)

    # Cross-cutting rail (right)
    zone(d, (1590, 100, 1710, 1010), "Cross-cutting", SLATE)
    xitems = ["Security", "Observability", "Secrets", "Caching &\nResilience",
              "Content Safety", "Audit", "DevOps"]
    for i, x in enumerate(xitems):
        y0 = 140 + i * 120
        card(d, (1600, y0, 1700, y0 + 100), x.replace("\n", " "), accent=SLATE)

    # dependency arrows down
    for y in (250, 400, 605, 760, 890):
        arrow(d, (800, y), (800, y + 25), color=SLATE, width=3)

    d.text((44, 1030), "Clean dependency direction (top→bottom). Domain depends on nothing; "
           "adapters isolate providers. No AI/RAG layer — search is metadata + full-text only.",
           font=_font(13, bold=True), fill=NAVY)
    d.text((44, 1058), "Async workers (Durable Functions, Service Bus consumers, timer functions) drive "
           "the review chain, SLA/timeline engine, promotion, notifications and staging cleanup.",
           font=_font(12), fill=SLATE)

    path = os.path.join(OUT_DIR, "fig2_application_architecture.png")
    img.save(path, "PNG")
    return path


# =========================================================================
# Figure 3 — Configurable Review Chain & SLA / Timeline
# =========================================================================
def build_review_chain():
    W, H = 1750, 900
    img = Image.new("RGB", (W, H), LIGHT)
    d = ImageDraw.Draw(img)
    header_banner(d, W, "Technical Architecture Document · v1.2",
                  "Figure 3 — Configurable Review Chain & SLA / Timeline Engine")

    stages = [
        ("Editor", "Author / owner\nprepares & submits", BLUE),
        ("Document Owner /\nApprover", "Level 1 review\napprove · return", TEAL),
        ("Assurance", "Level 2 review\napprove · return\ngrant extensions", ORANGE),
        ("Authoriser\n(typically CEO)", "Final approval\napprove · return", PURPLE),
        ("Published", "Promoted to\nSharePoint · v1.0", GREEN),
    ]
    n = len(stages)
    cw, ch = 250, 150
    gap = (W - 80 - n * cw) / (n - 1)
    y0 = 150
    centers = []
    for i, (t, s, col) in enumerate(stages):
        x0 = 40 + i * (cw + gap)
        card(d, (x0, y0, x0 + cw, y0 + ch), t.replace("\n", " "),
             s.replace("\n", " "), accent=col)
        centers.append((x0, x0 + cw))

    # forward arrows
    for i in range(n - 1):
        arrow(d, (centers[i][1], y0 + ch / 2), (centers[i + 1][0], y0 + ch / 2),
              color=GREEN, width=4, label="approve")

    # return-to-editor / previous-stage arrows (below)
    ry = y0 + ch + 70
    d.text((44, ry - 34), "Return path — any review stage can send the item back to the "
           "Editor or the immediately preceding stage with mandatory comments:",
           font=_font(13, bold=True), fill=ORANGE)
    for i in range(1, n - 1):
        sx = (centers[i][0] + centers[i][1]) / 2
        ex = (centers[0][0] + centers[0][1]) / 2
        d.line([(sx, y0 + ch), (sx, ry)], fill=ORANGE, width=2)
        _dashed_line(d, (sx, ry), (ex, ry), ORANGE, 3)
        arrow(d, (ex + 40, ry), (ex, ry), color=ORANGE, width=3)
        d.line([(ex, ry), (ex, y0 + ch)], fill=ORANGE, width=2)

    # SLA panel
    sy = 560
    zone(d, (40, sy, 860, sy + 250), "Working-Day SLA & Timeline Engine", NAVY)
    card(d, (60, sy + 30, 300, sy + 120), "Urgent",
         "12 working days (configurable)", accent=ORANGE)
    card(d, (315, sy + 30, 555, sy + 120), "Normal",
         "30 working days (configurable)", accent=BLUE)
    card(d, (570, sy + 30, 840, sy + 120), "Stage timing",
         "Per-stage duration captured automatically for bottleneck reporting",
         accent=TEAL)
    card(d, (60, sy + 135, 440, sy + 230), "At-risk & overdue flags",
         "Warning window + overdue flags feed the Notification Center",
         accent=PURPLE)
    card(d, (455, sy + 135, 840, sy + 230), "Extensions (Assurance only)",
         "Mandatory recorded reason · logged as distinct event · original target never overwritten",
         accent=GREEN)

    # Comments / audit panel
    zone(d, (890, sy, 1710, sy + 250), "Threaded Comments · Audit · Version History", GREEN)
    card(d, (910, sy + 30, 1300, sy + 120), "Per-document comment thread",
         "actor · role/stage · action · comment · timestamp", accent=TEAL)
    card(d, (1315, sy + 30, 1690, sy + 120), "Retained with",
         "stage timings · SLA/extension events · audit history", accent=BLUE)
    card(d, (910, sy + 135, 1300, sy + 230), "SharePoint version history",
         "native versioning linked to registry", accent=ORANGE)
    card(d, (1315, sy + 135, 1690, sy + 230), "Hash-chained audit",
         "tamper-evident · exportable to immutable storage", accent=PURPLE)

    d.text((44, sy + 262), "Review levels, stages, SLA classes and durations are configured per "
           "document type / department in the Admin Center (M13) approval-level designer.",
           font=_font(12, bold=True), fill=NAVY)

    path = os.path.join(OUT_DIR, "fig3_review_chain_sla.png")
    img.save(path, "PNG")
    return path


# =========================================================================
# Figure 4 — End-to-end runtime lifecycle (no AI)
# =========================================================================
def build_lifecycle():
    W, H = 1750, 620
    img = Image.new("RGB", (W, H), LIGHT)
    d = ImageDraw.Draw(img)
    header_banner(d, W, "Technical Architecture Document · v1.2",
                  "Figure 4 — End-to-End Runtime Lifecycle")

    steps = [
        ("1 Capture /\nRegister", "Blob staging · SHA-256 · tracking no. · SQL registry", BLUE),
        ("2 Classify", "class · standard · sensitivity · department (manual)", TEAL),
        ("3 Submit", "routing resolves library, reviewers & SLA class", PURPLE),
        ("4 Review Chain", "3–4 configurable levels · comments · SLA timers", ORANGE),
        ("5 Decide", "approve / return with mandatory comments", NAVY),
        ("6 Promote", "Graph upload of original · v1.0 write-back", GREEN),
        ("7 Cleanup", "staging reconciled · owner notified", TEAL),
        ("8 Text & Search Data", "extract machine-readable text · metadata · preview (no AI)", BLUE),
        ("9 Analytics & Govern", "Power BI · RBAC+ABAC · retention · legal hold", PURPLE),
    ]
    per_row = 5
    cw, ch = 300, 150
    gx, gy = 30, 60
    ox, oy = 40, 110
    centers = []
    for i, (t, s, col) in enumerate(steps):
        r, c = divmod(i, per_row)
        # serpentine
        if r % 2 == 1:
            c = per_row - 1 - c
        x0 = ox + c * (cw + gx)
        y0 = oy + r * (ch + gy)
        card(d, (x0, y0, x0 + cw, y0 + ch), t.replace("\n", " "),
             s, accent=col)
        centers.append((i, x0, y0, x0 + cw, y0 + ch, r, c))

    # connect serpentine
    order = sorted(centers, key=lambda z: z[0])
    for i in range(len(order) - 1):
        _, x0a, y0a, x1a, y1a, ra, ca = order[i]
        _, x0b, y0b, x1b, y1b, rb, cb = order[i + 1]
        if ra == rb:
            if x0b > x0a:
                arrow(d, (x1a, (y0a + y1a) / 2), (x0b, (y0b + y1b) / 2),
                      color=SLATE, width=3)
            else:
                arrow(d, (x0a, (y0a + y1a) / 2), (x1b, (y0b + y1b) / 2),
                      color=SLATE, width=3)
        else:
            # drop down
            arrow(d, ((x0a + x1a) / 2, y1a), ((x0b + x1b) / 2, y0b),
                  color=SLATE, width=3)

    d.text((44, 560), "AI/RAG removed: step 8 extracts machine-readable text, metadata and a "
           "preview for full-text search only — no chunking, embeddings or vectors.",
           font=_font(13, bold=True), fill=NAVY)

    path = os.path.join(OUT_DIR, "fig4_lifecycle.png")
    img.save(path, "PNG")
    return path


if __name__ == "__main__":
    paths = [
        build_solution_architecture(),
        build_application_architecture(),
        build_review_chain(),
        build_lifecycle(),
    ]
    for p in paths:
        print("wrote", p)
