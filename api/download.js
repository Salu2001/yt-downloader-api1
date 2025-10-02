const axios = require('axios');
const cheerio = require('cheerio');

async function fetchYTDownloadLinks(videoUrl) {
    const sources = [
        'https://9convert.com',
        'https://yt5s.com',
        'https://y2mate.is'
    ];
    
    let downloadLinks = [];
    
    for (const source of sources) {
        try {
            console.log(`Trying source: ${source}`);
            const response = await axios.post(`${source}/en`, {
                url: videoUrl,
                token: await generateToken(source)
            }, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
                },
                timeout: 10000
            });
            
            const $ = cheerio.load(response.data);
            $('a[href*="download"]').each((i, elem) => {
                const link = $(elem).attr('href');
                const quality = $(elem).text().match(/\d+p/);
                if (link && quality) {
                    downloadLinks.push({
                        url: link.startsWith('http') ? link : `${source}${link}`,
                        quality: quality[0],
                        source: source
                    });
                }
            });
            
            if (downloadLinks.length > 0) break;
            
        } catch (error) {
            console.log(`Source ${source} failed:`, error.message);
            continue;
        }
    }
    
    return downloadLinks;
}

async function generateToken(source) {
    const tokenMap = {
        'https://9convert.com': '9c' + Date.now(),
        'https://yt5s.com': 'yt5s_' + Math.random().toString(36).substring(2),
        'https://y2mate.is': 'y2m_' + Date.now().toString(16)
    };
    return tokenMap[source] || 'default_token';
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const videoUrl = req.query.url;
    
    if (!videoUrl) {
        return res.status(400).json({ 
            error: 'No YouTube URL provided. Use: /api/download?url=YOUTUBE_URL' 
        });
    }

    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    if (!youtubeRegex.test(videoUrl)) {
        return res.status(400).json({ 
            error: 'Invalid YouTube URL' 
        });
    }

    try {
        console.log('Fetching download links for:', videoUrl);
        const links = await fetchYTDownloadLinks(videoUrl);
        
        if (links.length === 0) {
            return res.status(404).json({ 
                error: 'No download links found' 
            });
        }

        const sortedLinks = links.sort((a, b) => {
            const aQuality = parseInt(a.quality) || 0;
            const bQuality = parseInt(b.quality) || 0;
            return bQuality - aQuality;
        });

        res.json({
            success: true,
            videoUrl: videoUrl,
            downloadLinks: sortedLinks,
            bestQuality: sortedLinks[0]
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch download links',
            message: error.message 
        });
    }
};
