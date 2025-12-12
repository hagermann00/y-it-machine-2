/**
 * Demo Mode Service
 * Provides simulated research data and placeholder images for demonstration purposes
 * Zero API calls - instant results for showing off the app
 */

import { ResearchData, Book, Chapter, PodcastEpisode, PodcastScriptLine } from '../../types';

// Placeholder image service - creates colorful SVG placeholders
const createPlaceholderImage = (width: number, height: number, label: string, color: string = '#FFD700'): string => {
    // Note: Using only ASCII characters to avoid btoa() issues
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
        <stop offset="100%" style="stop-color:#1a1a1a;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#grad)"/>
    <text x="50%" y="45%" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle" opacity="0.8">[IMG]</text>
    <text x="50%" y="60%" font-family="Arial, sans-serif" font-size="14" fill="white" text-anchor="middle" opacity="0.6">${label}</text>
    <text x="50%" y="75%" font-family="Arial, sans-serif" font-size="10" fill="white" text-anchor="middle" opacity="0.4">[DEMO]</text>
  </svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
};

// Alternative: Use real placeholder images from picsum
const getPlaceholderUrl = (width: number, height: number, seed: number): string => {
    return `https://picsum.photos/seed/${seed}/${width}/${height}`;
};

export const DEMO_TOPICS = [
    'Dropshipping',
    'Amazon FBA',
    'Crypto Day Trading',
    'Print on Demand',
    'Affiliate Marketing',
    'TikTok Shop',
    'AI Content Creation',
    'Forex Trading'
];

export const generateDemoResearch = (topic: string): ResearchData => {
    return {
        summary: `## Executive Summary: The ${topic} Reality Check\n\nAfter analyzing 847 Reddit posts, 23 industry reports, and interviewing 12 failed practitioners, we found that **${topic}** has a 94.7% failure rate within the first 18 months. The median monthly income for the bottom 80% is $127, while the top 1% (who you see on YouTube) earn six figures. The math doesn't lie.\n\n**Key Finding:** The most profitable entity in the ${topic} ecosystem isn't the practitioners—it's the people selling courses about ${topic}.`,

        ethicalRating: 4,
        profitPotential: "Low-Medium (High variance, skill-dependent)",

        marketStats: [
            { label: "Failure Rate (18mo)", value: "94.7%", context: "Based on platform churn data and self-reported income surveys" },
            { label: "Median Monthly Income", value: "$127", context: "Bottom 80% of active participants" },
            { label: "Avg. Startup Cost (Real)", value: "$2,847", context: "Actual first 90-day spend vs. advertised '$50 start'" },
            { label: "Time to First Dollar", value: "4.2 months", context: "For those who ever make a sale" },
            { label: "Course Buyers Who Quit", value: "78%", context: "Never complete the course they purchased" }
        ],

        hiddenCosts: [
            { label: "Software Stack", value: "$197-497/mo", context: "Essential tools: design, analytics, automation" },
            { label: "Paid Advertising Minimum", value: "$500-2000/mo", context: "To achieve statistical significance on ad tests" },
            { label: "Lost Opportunity Cost", value: "$3,200/mo", context: "Median wage you're NOT earning while trying this" },
            { label: "Course/Mentorship", value: "$997-4997", context: "The real product being sold in this ecosystem" }
        ],

        caseStudies: [
            {
                name: "Marcus T., Former Software Engineer",
                type: "LOSER",
                background: "Left $145k job to pursue ${topic} full-time after watching YouTube success stories",
                strategy: "Followed a $2,997 course 'to the letter' for 8 months",
                outcome: "Made $3,400 total revenue, spent $12,000 on ads and tools. Returned to software engineering.",
                revenue: "-$8,600 net"
            },
            {
                name: "Sarah K., Top 0.1% Earner",
                type: "WINNER",
                background: "Already had 500K Instagram following in the niche BEFORE starting",
                strategy: "Leveraged existing audience, hired team of 4, reinvested aggressively",
                outcome: "Built 7-figure business in 14 months",
                revenue: "$1.2M/year"
            },
            {
                name: "David R., 'The Pivoted'",
                type: "LOSER",
                background: "Tried ${topic} for 6 months after losing job",
                strategy: "Bootstrapped with $500, followed free YouTube tutorials",
                outcome: "Made first sale in month 4, but unit economics never worked. Now teaches ${topic} courses.",
                revenue: "$890 from ${topic}, $47k from course sales"
            }
        ],

        affiliates: [
            { program: "Popular ${topic} Course", type: "WRITER", commission: "40% ($400-2000 per sale)", potential: "High", notes: "This is why you see so many 'honest reviews'" },
            { program: "Essential Software Tool", type: "PARTICIPANT", commission: "30% recurring", potential: "Medium", notes: "Anyone teaching ${topic} links to these" },
            { program: "Web Hosting Partner", type: "WRITER", commission: "$65-125 per signup", potential: "Low-Medium", notes: "Standard affiliate play" }
        ]
    };
};

export const generateDemoBook = (topic: string, researchData: ResearchData): Book => {
    const chapters: Chapter[] = [
        {
            number: 1,
            title: "THE LIE THEY SOLD YOU",
            content: `## The $47 Billion Illusion\n\nEvery year, millions of hopeful entrepreneurs are sold a dream. The pitch is simple: **Work from anywhere. Be your own boss. Make money while you sleep.**\n\nThe reality? For every success story screenshot you've seen on Instagram, there are 94 people who lost money, time, and sometimes their savings trying the same thing.\n\n### The Math They Don't Show You\n\nWhen a guru shows you their "$50,000 month," they conveniently forget to mention:\n- The $15,000 they spent on ads\n- The $3,000 in software subscriptions\n- The 80 hours of work that week\n- The 18 months of losses before that screenshot\n\n> "The best time to start ${topic} was 5 years ago. The second best time is never." — Someone who actually did the math\n\n### Who Actually Profits?\n\nHere's the dirty secret: The most reliable way to make money in ${topic} is to **teach other people how to do ${topic}**. The course sellers, software providers, and "mentors" are the ones laughing to the bank.`,
            posiBotQuotes: [
                { position: 'RIGHT', text: "But those are just statistics! YOU'RE different! 🌟" },
                { position: 'LEFT', text: "Winners don't look at failure rates, they manifest success! ✨" }
            ],
            visuals: [
                { type: 'HERO', description: `Dark, moody image of a laptop showing fake income screenshots`, imageUrl: createPlaceholderImage(600, 400, 'CH1: The Lie', '#8B0000') },
                { type: 'CHART', description: 'Pie chart: 94% Lose Money, 5% Break Even, 1% Profit', imageUrl: createPlaceholderImage(500, 300, 'Income Distribution', '#4A4A4A') }
            ]
        },
        {
            number: 2,
            title: "THE ROADMAP (WHAT THEY PROMISE)",
            content: `## The 10-Step Method Every Guru Sells\n\nHere it is. For free. The exact "secret system" that courses charge $997-$4997 to teach you.\n\n### Step 1: Find Your Niche\nPick something "passionate" that's also "profitable."\n\n### Step 2: Research the Competition\nSpy on successful players. Copy what works.\n\n### Step 3: Set Up Your Infrastructure\n$0 according to YouTube. $497/month in reality.\n\n### Step 4: Create Your Offer\nThe thing that will "print money while you sleep."\n\n### Step 5: Build an Audience\nJust go viral. Simple.\n\n### Step 6: Launch\nTo the sound of crickets, usually.\n\n### Step 7: Iterate Based on Data\nAssumes you have data. Assumes you have sales.\n\n### Step 8: Scale with Paid Ads\nWhere 90% of people lose their remaining money.\n\n### Step 9: Automate Everything\nSo you can lose money hands-free.\n\n### Step 10: Repeat and Expand\nOr pivot to selling courses about this method.`,
            posiBotQuotes: [
                { position: 'RIGHT', text: "See? It's only 10 steps! You've got this! 💪" }
            ],
            visuals: [
                { type: 'HERO', description: 'A roadmap that leads off a cliff', imageUrl: createPlaceholderImage(600, 400, 'CH2: Roadmap', '#2F4F4F') },
                { type: 'DIAGRAM', description: 'The 10-step funnel with reality annotations', imageUrl: createPlaceholderImage(500, 350, 'Funnel Diagram', '#1a1a1a') }
            ]
        },
        {
            number: 3,
            title: "THE REAL MATH",
            content: `## What It Actually Costs (First 90 Days)\n\n### The "$50 Startup" Myth\n\nEvery ${topic} guru loves to say "you can start for less than $50." Let's break down reality:\n\n| Expense | "Guru" Price | Reality |\n|---------|--------------|----------|\n| Platform/Tools | "Free tier!" | $97-297/mo |\n| Design Software | "Use Canva free!" | $12.99/mo |\n| Ads (Testing) | "Start with $5/day" | $500 minimum |\n| Samples/Inventory | "Dropship!" | $200-500 |\n| Course (The Real Product) | "Optional" | $997-2997 |\n\n### The Opportunity Cost\n\nLet's say you spend 20 hours/week on ${topic} for 6 months:\n- **Hours invested:** 480 hours\n- **Median hourly wage:** $22/hr\n- **Opportunity cost:** $10,560\n\nAdd your actual expenses (~$3,000) and most people are **-$13,000** before their first real profit.`,
            posiBotQuotes: [
                { position: 'LEFT', text: "Math is for people who don't BELIEVE! 🚀" },
                { position: 'RIGHT', text: "Debt is just future investment in yourself! 💰" }
            ],
            visuals: [
                { type: 'HERO', description: 'A calculator on fire with money burning', imageUrl: createPlaceholderImage(600, 400, 'CH3: Real Math', '#FF4500') },
                { type: 'CHART', description: 'Bar chart: advertised vs actual costs', imageUrl: createPlaceholderImage(500, 300, 'Cost Comparison', '#333333') }
            ]
        },
        {
            number: 4,
            title: "CASE STUDIES: WINNERS & LOSERS",
            content: `## Real Stories, Real Numbers\n\n### 🏆 THE WINNER: Sarah K.\n**Background:** Already had 500K Instagram followers\n**Strategy:** Leveraged existing audience, hired team of 4\n**Result:** $1.2M/year\n**Reality:** Spent 4 years building her audience FIRST.\n\n---\n\n### 💀 THE LOSER: Marcus T.\n**Background:** Software engineer earning $145K, quit to "follow passion"\n**Strategy:** Bought $2,997 course, followed it "exactly"\n**Investment:** $12,000 over 8 months\n**Revenue:** $3,400 total\n**Net Result:** -$8,600 and had to beg for his old job back\n\n---\n\n### 🔄 THE PIVOT: David R.\n**Background:** Laid off, tried ${topic} as emergency income\n**Revenue from ${topic}:** $890 over 6 months\n**What Happened Next:** Started teaching others. Made $47,000 from courses.\n**The Lesson:** The real money is selling the dream, not living it.`,
            posiBotQuotes: [],
            visuals: [
                { type: 'HERO', description: 'Split image: luxury vs dark room', imageUrl: createPlaceholderImage(600, 400, 'CH4: Case Studies', '#4B0082') },
                { type: 'PORTRAIT', description: 'Person at computer with head in hands', imageUrl: createPlaceholderImage(400, 500, 'The Struggle', '#2d2d2d') }
            ]
        },
        {
            number: 5,
            title: "THE PLATFORM DEEP DIVE",
            content: `## How The ${topic} Ecosystem Actually Works\n\n### The Food Chain\n\nAt the top of every ${topic} ecosystem sits a small group of early movers who got in before saturation. They've built:\n- Massive audiences\n- Brand recognition\n- Economies of scale\n\nBelow them? Everyone else fighting for scraps.\n\n### Platform Changes Are Your Enemy\n\nEvery platform update, algorithm change, or policy shift can wipe out months of work overnight. Successful practitioners spend 40%+ of their time just keeping up with changes.\n\n### The Real Timeline\n\n| Milestone | Guru Promise | Reality |\n|-----------|--------------|----------|\n| First sale | Week 1 | Month 3-6 |\n| Break even | Month 1 | Year 1-2 |\n| Full-time income | Month 3 | Never (for 94%) |\n\n### What The Algorithms Really Want\n\nThe platforms don't care about your success. They care about:\n1. User engagement (keeping people scrolling)\n2. Ad revenue (from people like you paying to be seen)\n3. Content volume (to keep the machine fed)`,
            posiBotQuotes: [
                { position: 'RIGHT', text: "The algorithm loves you! Just keep posting! 📱" }
            ],
            visuals: [
                { type: 'HERO', description: 'Corporate machine eating small entrepreneurs', imageUrl: createPlaceholderImage(600, 400, 'CH5: Platform', '#1565C0') },
                { type: 'DIAGRAM', description: 'The platform food chain pyramid', imageUrl: createPlaceholderImage(500, 350, 'Food Chain', '#0D47A1') }
            ]
        },
        {
            number: 6,
            title: "THE GURU ECONOMY",
            content: `## Following The Money\n\n### Who Profits From Your Failure?\n\nEvery time you fail at ${topic}, someone else profits:\n\n1. **Course Creators** - $997-4997 per sale\n2. **Software Providers** - $97-497/month recurring\n3. **Platform Ads** - Your testing budget goes to them\n4. **"Coaches"** - $200-500/hour to tell you what Google could\n\n### The Affiliate Web\n\nEver notice how every "honest review" of ${topic} tools ends with affiliate links? That's not a coincidence.\n\n**Average Affiliate Commissions:**\n- Courses: 30-50% ($300-2500 per sale)\n- Software: 20-30% recurring monthly\n- Hosting: $65-125 per signup\n\n### The Real Product Is You\n\nIn the ${topic} economy, you're not the entrepreneur. You're the customer. The gurus, software companies, and platforms are the real entrepreneurs—selling to you.\n\n> "If you can't identify who the product is, you're the product." — Silicon Valley Proverb`,
            posiBotQuotes: [
                { position: 'LEFT', text: "They just want to help you succeed! 🙏" },
                { position: 'RIGHT', text: "Investing in yourself is never a waste! 💎" }
            ],
            visuals: [
                { type: 'HERO', description: 'Money flowing from many to few', imageUrl: createPlaceholderImage(600, 400, 'CH6: Guru Economy', '#FF6F00') },
                { type: 'CHART', description: 'Where your money actually goes pie chart', imageUrl: createPlaceholderImage(500, 300, 'Money Flow', '#E65100') }
            ]
        },
        {
            number: 7,
            title: "THE ALTERNATIVES",
            content: `## What You Could Do Instead\n\n### Side Hustles That Actually Work\n\nIf you have 10-20 hours per week and need extra income, consider:\n\n1. **Freelancing Your Current Skills** - Immediate income, no learning curve\n2. **Tutoring/Consulting** - $50-200/hour for expertise you already have\n3. **Part-Time Work** - Guaranteed hourly wage, no risk\n4. **Investing** - S&P 500 averages 10% annually with zero effort\n\n### The Math That Actually Works\n\n| Option | Monthly Effort | Expected Income | Risk |\n|--------|---------------|-----------------|------|\n| ${topic} | 80+ hours | $0-127 (median) | Very High |\n| Freelancing | 20 hours | $1,000-3,000 | Low |\n| Part-time job | 20 hours | $800-1,200 | None |\n| Index investing | 30 minutes | 10% annual | Low |\n\n### If You Still Want To Try\n\n1. **Keep your day job** - Never quit until you match your salary for 6 months\n2. **Set a loss limit** - Decide how much you're willing to lose before you start\n3. **Give yourself a deadline** - 12 months max, then honest evaluation\n4. **Track everything** - Time, money, mental health`,
            posiBotQuotes: [
                { position: 'RIGHT', text: "But those are BORING! Where's the passive income? 😴" }
            ],
            visuals: [
                { type: 'HERO', description: 'Fork in the road - risky vs safe paths', imageUrl: createPlaceholderImage(600, 400, 'CH7: Alternatives', '#2E7D32') },
                { type: 'CHART', description: 'Comparison table of alternatives', imageUrl: createPlaceholderImage(500, 300, 'Alternative Paths', '#1B5E20') }
            ]
        },
        {
            number: 8,
            title: "THE FINAL VERDICT",
            content: `## So... Should You Try ${topic}?\n\n### The Honest Answer\n\n**For 95% of people: No.**\n\nNot because you're not smart enough, hardworking enough, or special enough. But because the math simply doesn't work for most people, and the opportunity cost is too high.\n\n### The 5% Who Might Succeed\n\nYou might be in the minority who can make this work if:\n\n✅ You already have an audience (10K+ followers)\n✅ You have 12+ months of living expenses saved\n✅ You have directly relevant skills (marketing, design, sales)\n✅ You're treating this as a 3-5 year project, not a quick fix\n✅ You have a backup plan and a loss limit\n\n### The Questions To Ask Yourself\n\n1. Would you do this even if you never made money?\n2. Can you afford to lose $10,000 and 500 hours?\n3. Are you running toward something, or away from something?\n4. Is this your best use of time and capital?\n\n### Our Final Recommendation\n\n**If you're reading this report, you've already shown more research discipline than 90% of people who fail at ${topic}.** That's a good sign.\n\nBut awareness isn't enough. Take the skills you've shown here—research, analysis, skepticism—and apply them to something with better odds.\n\n> "The best investment you can make is in your own abilities." — Warren Buffett\n\n(But he probably wasn't talking about ${topic}.)`,
            posiBotQuotes: [
                { position: 'LEFT', text: "Don't let fear hold you back! YOLO! 🚀" },
                { position: 'RIGHT', text: "See you at the top! (I'll be selling courses there) 💫" }
            ],
            visuals: [
                { type: 'HERO', description: 'Sunrise over crossroads - choice moment', imageUrl: createPlaceholderImage(600, 400, 'CH8: Verdict', '#512DA8') },
                { type: 'DIAGRAM', description: 'Decision flowchart: Should you try this?', imageUrl: createPlaceholderImage(500, 400, 'Decision Tree', '#311B92') }
            ]
        }
    ];

    return {
        title: `THE ${topic.toUpperCase()} TRAP`,
        subtitle: `A Forensic Investigation Into The $47 Billion Dream Machine`,
        frontCover: {
            titleText: `THE ${topic.toUpperCase()} TRAP`,
            subtitleText: "A Y-It Forensic Report",
            blurb: "What 94.7% of success stories won't tell you",
            visualDescription: `Dark, noir-style cover with a golden mousetrap and ${topic} symbols`,
            imageUrl: createPlaceholderImage(600, 900, 'FRONT COVER', '#FFD700')
        },
        backCover: {
            titleText: "THE BRUTAL TRUTH",
            subtitleText: "No Affiliate Links. No Courses To Sell. Just Math.",
            blurb: `"I wish I had read this before I spent $12,000 learning the hard way."\n— Marcus T., Former ${topic} Enthusiast\n\nThis isn't a hater's guide. This is a mathematician's guide. We did the research so you don't have to lose your savings finding out the truth.`,
            visualDescription: 'Minimalist back cover with testimonial and barcode',
            imageUrl: createPlaceholderImage(600, 900, 'BACK COVER', '#1a1a1a')
        },
        chapters
    };
};

export const generateDemoPodcast = (topic: string): PodcastEpisode => {
    const script: PodcastScriptLine[] = [
        { speaker: 'Host 1', text: `Welcome back to The Reality Check. I'm your host, and today we're diving deep into ${topic}. My co-host has been researching this for weeks.` },
        { speaker: 'Host 2', text: `Yeah, and honestly? I went into this thinking it might be one of the "good" ones. I was wrong.` },
        { speaker: 'Host 1', text: `Let's start with the headline number. What's the failure rate?` },
        { speaker: 'Host 2', text: `94.7%. Within 18 months, nearly 95 out of 100 people who try ${topic} will have quit or be losing money.` },
        { speaker: 'Host 1', text: `But we've all seen those income screenshots on Instagram, right? The "$50K months"?` },
        { speaker: 'Host 2', text: `That's the genius of it. Those screenshots are real—for about 1% of people. The algorithm shows you the winners. It doesn't show you the 94 people crying in their apartments.` },
        { speaker: 'Host 1', text: `What about the startup costs? I've seen people say you can start for $50.` },
        { speaker: 'Host 2', text: `Yeah, $50 gets you... nothing useful. Our research shows the actual 90-day cost is around $2,800 on average. And that's before you've made a single real sale.` },
        { speaker: 'Host 1', text: `So who DOES make money in this space?` },
        { speaker: 'Host 2', text: `The course sellers. The software companies. The "mentors." They've figured out that it's more profitable to sell the dream than to live it.` },
        { speaker: 'Host 1', text: `That's dark. Any silver lining?` },
        { speaker: 'Host 2', text: `If you have an existing audience, existing skills, and 6-12 months of savings to burn, you MIGHT be in that 5% that breaks even. But for most people? Get a side job instead.` }
    ];

    return {
        id: `demo_${Date.now()}`,
        title: `The Reality Check: ${topic} Exposed`,
        script,
        audioUrl: null, // No audio in demo mode
        settings: {
            host1Voice: 'Charon',
            host2Voice: 'Kore',
            host1Name: 'Alex',
            host2Name: 'Jordan',
            conversationStyle: 'Investigative & Skeptical',
            lengthLevel: 2
        },
        timestamp: Date.now()
    };
};

// Flag to check if demo mode is enabled
export const isDemoMode = (): boolean => {
    return localStorage.getItem('YIT_DEMO_MODE') === 'true';
};

export const setDemoMode = (enabled: boolean): void => {
    localStorage.setItem('YIT_DEMO_MODE', enabled ? 'true' : 'false');
};

export const toggleDemoMode = (): boolean => {
    const current = isDemoMode();
    setDemoMode(!current);
    return !current;
};
