const axios = require("axios")
const cheerio = require("cheerio")
const dotenv = require('dotenv')
const path = require("path")
const { SEO_SYSTEM_PROMPT, SEO_WEBSITE_PROMPT, seoUpdatePromptMaker } = require("../data/seoResult")
const { checkSubscription } = require("./paymentController")
dotenv.config({ path: path.resolve(__dirname, "../.env") })


class SEOAgent {

    constructor() {
        this.scores = {}
        this.issues = []
        this.recommendations = []
    }


    async analyzeSEO(url) {
        try {

            this.scores = {};
            this.issues = [];
            this.recommendations = [];
            console.log(`Analyzing SEO for: ${url}`);

            // Fetch the webpage
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 10000
            });

            const html = response.data;
            const $ = cheerio.load(html);

            // Run all SEO checks
            this.checkTitle($);
            this.checkMetaDescription($);
            this.checkHeadings($);
            this.checkImages($);
            this.checkLinks($);
            this.checkCanonical($);
            this.checkOpenGraph($);
            this.checkStructuredData($);
            this.checkContentQuality($);
            this.checkMobileViewport($);
            this.checkPageSpeed(response);

            const overallScore = this.calculateOverallScore();
            const seoResult = {
                url,
                overallScore,
                scores: this.scores,
                issues: this.issues,
                recommendations: this.recommendations,
                grade: this.getGrade(overallScore),
                $
            };
            return seoResult;
        } catch (error) {
            console.error('Error analyzing SEO:', error.message);
            throw new Error(`Failed to analyze SEO: ${error.message}`);
        }
    }



    checkTitle($) {
        const title = $("title").text().trim();
        let score = 0;

        if (!title) {
            this.issues.push('Missing title tag');
            this.recommendations.push('Add a descriptive title tag (50-60 characters)');
        } else if (title.length < 30) {
            score = 50
            this.issues.push('Title tag is too short');
            this.recommendations.push('Expand title to 50-60 characters for better SEO');
        } else if (title.length > 60) {
            score = 70
            this.issues.push('Title tag is too long (may be truncated in search results)');
            this.recommendations.push('Shorten title to under 60 characters');
        } else {
            score = 100
        }

        this.scores.title = score;
    }


    checkMetaDescription($) {
        const description = $('meta[name="description"]').attr('content') || '';
        let score = 0;

        if (!description) {
            this.issues.push('Missing meta description');
            this.recommendations.push('Add a meta description (150-160 characters)');
        } else if (description.length < 120) {
            score = 60;
            this.issues.push('Meta description is too short');
            this.recommendations.push('Expand meta description to 150-160 characters');
        } else if (description.length > 160) {
            score = 80;
            this.issues.push('Meta description is too long');
            this.recommendations.push('Shorten meta description to 150-160 characters');
        } else {
            score = 100;
        }

        this.scores.metaDescription = score;
    }

    checkHeadings($) {
        const h1Count = $('h1').length;
        const h2Count = $('h2').length;
        let score = 0;

        if (h1Count === 0) {
            this.issues.push('Missing H1 tag');
            this.recommendations.push('Add one H1 tag as the main page heading');
        } else if (h1Count > 1) {
            score = 70;
            this.issues.push('Multiple H1 tags found');
            this.recommendations.push('Use only one H1 tag per page');
        } else {
            score = 100;
        }

        if (h2Count === 0) {
            score = Math.min(score, 80);
            this.recommendations.push('Add H2 tags to structure your content');
        }

        this.scores.headings = score;
    }

    checkImages($) {
        const images = $('img');
        let imagesWithoutAlt = 0;
        let score = 100;

        images.each((i, img) => {
            const alt = $(img).attr('alt');
            if (!alt || alt.trim() === '') {
                imagesWithoutAlt++;
            }
        });

        if (images.length > 0) {
            const altPercentage = ((images.length - imagesWithoutAlt) / images.length) * 100;
            score = Math.round(altPercentage);

            if (imagesWithoutAlt > 0) {
                this.issues.push(`${imagesWithoutAlt} images missing alt text`);
                this.recommendations.push('Add descriptive alt text to all images');
            }
        }

        this.scores.images = score;
    }

    checkLinks($) {
        const internalLinks = $('a[href^="/"], a[href^="' + this.baseUrl + '"]').length;
        const externalLinks = $('a[href^="http"]').not('[href^="' + this.baseUrl + '"]').length;
        let brokenLinks = 0;

        $('a').each((i, link) => {
            const href = $(link).attr('href');
            if (!href || href === '#' || href === '') {
                brokenLinks++;
            }
        });

        let score = 100;

        if (brokenLinks > 0) {
            score = Math.max(70, 100 - (brokenLinks * 10));
            this.issues.push(`${brokenLinks} links with no href or empty href`);
            this.recommendations.push('Fix broken or empty links');
        }

        if (internalLinks === 0) {
            score = Math.min(score, 80);
            this.recommendations.push('Add internal links to improve site navigation');
        }

        this.scores.links = score;
    }

    checkCanonical($) {
        const canonical = $('link[rel="canonical"]').attr('href');
        let score = canonical ? 100 : 70;

        if (!canonical) {
            this.recommendations.push('Add a canonical URL to avoid duplicate content issues');
        }

        this.scores.canonical = score;
    }

    checkOpenGraph($) {
        const ogTitle = $('meta[property="og:title"]').attr('content');
        const ogDescription = $('meta[property="og:description"]').attr('content');
        const ogImage = $('meta[property="og:image"]').attr('content');

        let score = 0;
        const elements = [ogTitle, ogDescription, ogImage];
        const present = elements.filter(e => e).length;

        score = (present / elements.length) * 100;

        if (score < 100) {
            this.recommendations.push('Add Open Graph tags for better social media sharing');
        }

        this.scores.openGraph = Math.round(score);
    }

    checkStructuredData($) {
        const jsonLd = $('script[type="application/ld+json"]').length;
        let score = jsonLd > 0 ? 100 : 60;

        if (jsonLd === 0) {
            this.recommendations.push('Add structured data (JSON-LD) for rich snippets');
        }

        this.scores.structuredData = score;
    }

    checkContentQuality($) {
        const bodyText = $('body').text().trim();
        const wordCount = bodyText.split(/\s+/).length;
        let score = 0;

        if (wordCount < 300) {
            score = 50;
            this.issues.push('Content is too short (less than 300 words)');
            this.recommendations.push('Add more quality content (aim for 500+ words)');
        } else if (wordCount < 500) {
            score = 75;
            this.recommendations.push('Consider adding more content for better SEO');
        } else {
            score = 100;
        }

        this.scores.contentQuality = score;
    }

    checkMobileViewport($) {
        const viewport = $('meta[name="viewport"]').attr('content');
        let score = viewport ? 100 : 50;

        if (!viewport) {
            this.issues.push('Missing viewport meta tag');
            this.recommendations.push('Add viewport meta tag for mobile optimization');
        }

        this.scores.mobileViewport = score;
    }

    checkPageSpeed(response) {
        const contentLength = response.headers['content-length'] || response.data.length;
        const sizeInKB = contentLength / 1024;
        let score = 100;

        if (sizeInKB > 500) {
            score = 70;
            this.issues.push('Page size is large (may affect load time)');
            this.recommendations.push('Optimize images and minify CSS/JS to reduce page size');
        } else if (sizeInKB > 300) {
            score = 85;
            this.recommendations.push('Consider optimizing page size for faster loading');
        }

        this.scores.pageSpeed = score;
    }

    calculateOverallScore() {
        const weights = {
            title: 0.15,
            metaDescription: 0.12,
            headings: 0.10,
            images: 0.08,
            links: 0.08,
            canonical: 0.07,
            openGraph: 0.07,
            structuredData: 0.10,
            contentQuality: 0.15,
            mobileViewport: 0.05,
            pageSpeed: 0.03
        };

        let totalScore = 0;

        for (const [key, weight] of Object.entries(weights)) {
            totalScore += (this.scores[key] || 0) * weight;
        }

        return Math.round(totalScore);
    }

    getGrade(score) {
        if (score >= 90) return 'A';
        if (score >= 80) return 'B';
        if (score >= 70) return 'C';
        if (score >= 60) return 'D';
        return 'F';
    }

}
async function seoAgentFunc(seoResults, $) {
    const openaiKey = process.env.OPENAI_API_KEY;
    const claudeKey = process.env.ANTHROPIC_API_KEY;

    const title = $('title').text().trim();
    const h1 = $('h1').first().text().trim();
    const metaDescription = $('meta[name="description"]').attr('content') || '';
    const bodyText = $('body').text().trim().substring(0, 1000); // First 1000 chars

    const prompt = `You are an expert SEO consultant. Analyze this website's SEO performance and provide actionable insights.
            URL: ${seoResults.url}
            Overall Score: ${seoResults.overallScore}/100 (Grade: ${seoResults.grade})

            Page Content:
            - Title: "${title}"
            - H1: "${h1}"
            - Meta Description: "${metaDescription}"
            - Content Preview: "${bodyText.substring(0, 300)}..."

            Detailed Scores:
            ${JSON.stringify(seoResults.scores, null, 2)}

            Issues Found:
            ${seoResults.issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')}

            Current Recommendations:
            ${seoResults.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')}

            Please provide:
            1. Executive Summary (2-3 sentences on overall SEO health)
            2. Top 3 Priority Actions (most impactful improvements to make first)
            3. Content Strategy Advice (based on title, headings, and content preview)
            4. Technical SEO Insights (any critical technical issues)
            5. Competitive Edge Tips (suggestions to outrank competitors)

            Format your response in clear sections with actionable advice.`;

    const systemPrompt = 'You are an expert SEO consultant who provides clear, actionable advice. Focus on practical improvements that will have the biggest impact on search rankings.';

    try {
        // Try OpenAI first with 30 second timeout
        const gptResponse = await Promise.race([
            fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${openaiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "system",
                            content: systemPrompt
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: 0.7
                })
            }),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('OpenAI timeout')), 30000)
            )
        ]);

        const data = await gptResponse.json();

        if (gptResponse.ok) {
            const answer = data.choices[0].message.content;
            return answer;
        } else {
            console.error("OpenAI API Error:", data);
            throw new Error("OpenAI API failed");
        }

    } catch (error) {
        console.log("OpenAI failed or timed out, falling back to Claude:", error.message);

        // Fallback to Claude API
        try {
            const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": claudeKey,
                    "anthropic-version": "2023-06-01"
                },
                body: JSON.stringify({
                    model: "claude-sonnet-4-20250514",
                    max_tokens: 4096,
                    system: systemPrompt,
                    messages: [
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: 0.7
                })
            });

            const claudeData = await claudeResponse.json();

            if (!claudeResponse.ok) {
                console.error("Claude API Error:", claudeData);
                throw new Error("Claude API failed");
            }

            const answer = claudeData.content[0].text;
            return answer;

        } catch (claudeError) {
            console.error("Claude API Error:", claudeError);
            throw claudeError;
        }
    }
}

async function seoAgent(req, res) {
    try {
        const agent = new SEOAgent();
        const { url, userId } = req.body;

        
      var checkSub= await checkSubscription(userId)
    if(!checkSub){
      return res.status(400).json({ error: "Kindly Check your Subscription" });
    }
        const result = await agent.analyzeSEO(url);
        const aiResponse = await seoAgentFunc(result, result.$);
        result.aiResponse = aiResponse;

        return res.status(200).json(result);

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    }
}

async function seoArticlesFunc(instruction) {
    const openaiKey = process.env.OPENAI_API_KEY;
    const claudeKey = process.env.ANTHROPIC_API_KEY;

    try {
        // Try OpenAI first with 30 second timeout
        const gptResponse = await Promise.race([
            fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${openaiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "system",
                            content: SEO_SYSTEM_PROMPT
                        },
                        {
                            role: "user",
                            content: instruction
                        }
                    ],
                    temperature: 0.7
                })
            }),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('OpenAI timeout')), 30000)
            )
        ]);

        const data = await gptResponse.json();

        if (gptResponse.ok) {
            const answer = data.choices[0].message.content;
            return answer;
        } else {
            console.error("OpenAI API Error:", data);
            throw new Error("OpenAI API failed");
        }

    } catch (error) {
        console.log("OpenAI failed or timed out, falling back to Claude:", error.message);

        // Fallback to Claude API
        try {
            const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": claudeKey,
                    "anthropic-version": "2023-06-01"
                },
                body: JSON.stringify({
                    model: "claude-sonnet-4-20250514",
                    max_tokens: 4096,
                    system: SEO_SYSTEM_PROMPT,
                    messages: [
                        {
                            role: "user",
                            content: instruction
                        }
                    ],
                    temperature: 0.7
                })
            });

            const claudeData = await claudeResponse.json();

            if (!claudeResponse.ok) {
                console.error("Claude API Error:", claudeData);
                throw new Error("Claude API failed");
            }

            const answer = claudeData.content[0].text;
            return answer;

        } catch (claudeError) {
            console.error("Claude API Error:", claudeError);
            throw claudeError;
        }
    }
}

async function seoWebsiteFunc(instruction) {
    const openaiKey = process.env.OPENAI_API_KEY;
    const claudeKey = process.env.ANTHROPIC_API_KEY;

    try {
        // Try OpenAI first with 30 second timeout
        const gptResponse = await Promise.race([
            fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${openaiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "system",
                            content: SEO_WEBSITE_PROMPT
                        },
                        {
                            role: "user",
                            content: instruction
                        }
                    ],
                    temperature: 0.7
                })
            }),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('OpenAI timeout')), 30000)
            )
        ]);

        const data = await gptResponse.json();

        if (gptResponse.ok) {
            const answer = data.choices[0].message.content;
            return answer;
        } else {
            console.error("OpenAI API Error:", data);
            throw new Error("OpenAI API failed");
        }

    } catch (error) {
        console.log("OpenAI failed or timed out, falling back to Claude:", error.message);

        // Fallback to Claude API
        try {
            const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": claudeKey,
                    "anthropic-version": "2023-06-01"
                },
                body: JSON.stringify({
                    model: "claude-sonnet-4-20250514",
                    max_tokens: 4096,
                    system: SEO_WEBSITE_PROMPT,
                    messages: [
                        {
                            role: "user",
                            content: instruction
                        }
                    ],
                    temperature: 0.7
                })
            });

            const claudeData = await claudeResponse.json();

            if (!claudeResponse.ok) {
                console.error("Claude API Error:", claudeData);
                throw new Error("Claude API failed");
            }

            const answer = claudeData.content[0].text;
            return answer;

        } catch (claudeError) {
            console.error("Claude API Error:", claudeError);
            throw claudeError;
        }
    }
}

async function seoUpdateWebsiteFunc(instruction, existingCode, url) {
    const openaiKey = process.env.OPENAI_API_KEY;
    const claudeKey = process.env.ANTHROPIC_API_KEY;
    const SEO_UPDATE_WEBSITE_PROMPT = seoUpdatePromptMaker(existingCode, url)
    try {
        // Try OpenAI first with 30 second timeout
        const gptResponse = await Promise.race([
            fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${openaiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "system",
                            content: SEO_UPDATE_WEBSITE_PROMPT
                        },
                        {
                            role: "user",
                            content: instruction
                        }
                    ],
                    temperature: 0.7
                })
            }),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('OpenAI timeout')), 30000)
            )
        ]);

        const data = await gptResponse.json();

        if (gptResponse.ok) {
            const answer = data.choices[0].message.content;
            return answer;
        } else {
            console.error("OpenAI API Error:", data);
            throw new Error("OpenAI API failed");
        }

    } catch (error) {
        console.log("OpenAI failed or timed out, falling back to Claude:", error.message);

        // Fallback to Claude API
        try {
            const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": claudeKey,
                    "anthropic-version": "2023-06-01"
                },
                body: JSON.stringify({
                    model: "claude-sonnet-4-20250514",
                    max_tokens: 4096,
                    system: SEO_WEBSITE_PROMPT,
                    messages: [
                        {
                            role: "user",
                            content: instruction
                        }
                    ],
                    temperature: 0.7
                })
            });

            const claudeData = await claudeResponse.json();

            if (!claudeResponse.ok) {
                console.error("Claude API Error:", claudeData);
                throw new Error("Claude API failed");
            }

            const answer = claudeData.content[0].text;
            return answer;

        } catch (claudeError) {
            console.error("Claude API Error:", claudeError);
            throw claudeError;
        }
    }
}

async function seoArticles(req, res) {
    try {
        const { instruction, userId } = req.body;

        var checkSub = await checkSubscription(userId)
        if (!checkSub) {
            return res.status(400).json({ error: "Kindly Check your Subscription" });
        }
        const result = await seoArticlesFunc(instruction);
        return res.status(200).json(result);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    }
}

async function seoWebsites(req, res) {
    try {
        const { instruction, userId } = req.body;

        var checkSub = await checkSubscription(userId)
        if (!checkSub) {
            return res.status(400).json({ error: "Kindly Check your Subscription" });
        }
        const result = await seoWebsiteFunc(instruction);
        return res.status(200).json(result);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    }
}


async function updateSeoWebsites(req, res) {
    try {
        const { instruction, existingCode, url, userId } = req.body;


        var checkSub = await checkSubscription(userId)
        if (!checkSub) {
            return res.status(400).json({ error: "Kindly Check your Subscription" });
        }
        const result = await seoUpdateWebsiteFunc(instruction, existingCode, url);
        return res.status(200).json(result);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    }
}

module.exports = { seoAgent, seoArticles, seoWebsites, updateSeoWebsites };