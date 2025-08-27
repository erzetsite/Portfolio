import { Router } from 'itty-router';

const router = Router();

// --- CORS Helper ---
function handleCORS(request) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers });
    }
    return { headers };
}

// --- CSV to JSON Parser ---
function csvToJSON(csv, config = {}) {
    const { header = true, keyField = null } = config;
    const lines = csv.replace(/\r/g, '').split('\n');
    const headers = header ? lines.shift().split(',') : [];
    
    const result = lines.filter(line => line).map(line => {
        const values = line.match(/("[^"]+"|[^,]+)/g).map(v => v.replace(/^"|"$/g, ''));
        const obj = {};
        headers.forEach((h, i) => {
            obj[h.trim()] = values[i] ? values[i].trim() : '';
        });
        return obj;
    });

    if (keyField) {
        return result.reduce((acc, item) => {
            acc[item[keyField]] = item;
            return acc;
        }, {});
    }
    return result;
}

// --- Google Sheets Fetcher ---
async function fetchSheet(spreadsheetId, gid) {
    const url = `https://docs.google.com/spreadsheets/d/e/${spreadsheetId}/pub?gid=${gid}&single=true&output=csv`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch sheet with gid: ${gid}`);
    }
    return await response.text();
}

// --- API Routes ---

// Route for portfolio content
router.get('/content/:lang', async ({ params }, env) => {
    const { lang } = params;
    const SPREADSHEET_ID = env.SPREADSHEET_ID;

    try {
        // Fetch meta sheet to get GIDs and supported languages
        const metaCsv = await fetchSheet(SPREADSHEET_ID, 0); // Assume _meta is always gid=0
        const meta = csvToJSON(metaCsv, { keyField: 'key' });
        
        const supportedLangs = meta.supported_langs.value.split(',');
        const targetLang = supportedLangs.includes(lang) ? lang : meta.default_lang.value;

        const sheetGids = {
            Home: meta.Home_gid.value,
            About: meta.About_gid.value,
            Projects: meta.Projects_gid.value,
            Contact: meta.Contact_gid.value,
        };

        const [homeCsv, aboutCsv, projectsCsv, contactCsv] = await Promise.all([
            fetchSheet(SPREADSHEET_ID, sheetGids.Home),
            fetchSheet(SPREADSHEET_ID, sheetGids.About),
            fetchSheet(SPREADSHEET_ID, sheetGids.Projects),
            fetchSheet(SPREADSHEET_ID, sheetGids.Contact),
        ]);

        // Process key-value sheets
        const processKeyValueSheet = (csv) => {
            const data = csvToJSON(csv, { keyField: 'key' });
            const result = {};
            for (const key in data) {
                result[key] = data[key][targetLang] || data[key]['en'];
            }
            return result;
        };

        const content = {
            Home: { ...processKeyValueSheet(homeCsv), site_name: meta.site_name.value },
            About: processKeyValueSheet(aboutCsv),
            Contact: processKeyValueSheet(contactCsv),
            Projects: csvToJSON(projectsCsv).map(p => ({
                id: p.id,
                title: p[`title_${targetLang}`] || p.title_en,
                description: p[`description_${targetLang}`] || p.description_en,
                tags: p.tags,
                repo_url: p.repo_url,
                live_url: p.live_url,
                image_url: p.image_url,
            }))
        };

        return new Response(JSON.stringify(content), { headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});

// Route for GitHub stats
router.get('/github', async (req, env) => {
    const GITHUB_USERNAME = env.GITHUB_USERNAME;
    const GITHUB_PAT = env.GITHUB_PAT;

    const query = `
      query($username: String!) {
        user(login: $username) {
          followers {
            totalCount
          }
          repositories(first: 100, ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC) {
            totalCount
          }
          contributionsCollection {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  contributionCount
                  contributionLevel
                  date
                }
              }
            }
          }
        }
      }
    `;

    try {
        const response = await fetch('https://api.github.com/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GITHUB_PAT}`,
                'User-Agent': 'Cloudflare-Worker',
            },
            body: JSON.stringify({ 
                query, 
                variables: { username: GITHUB_USERNAME } 
            }),
        });

        const { data } = await response.json();
        const user = data.user;

        const result = {
            followers: user.followers.totalCount,
            publicRepos: user.repositories.totalCount,
            totalContributions: user.contributionsCollection.contributionCalendar.totalContributions,
            contributionCalendar: user.contributionsCollection.contributionCalendar,
        };

        return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to fetch GitHub data' }), { status: 500 });
    }
});

// Catch-all for 404s
router.all('*', () => new Response('Not Found.', { status: 404 }));

export default {
    fetch: (request, env, ctx) => {
        const cors = handleCORS(request);
        if (cors.status === 200) return cors; // It was an OPTIONS request

        return router.handle(request, env, ctx)
            .then(response => {
                // Append CORS headers to the actual response
                Object.entries(cors.headers).forEach(([key, value]) => {
                    response.headers.set(key, value);
                });
                return response;
            })
            .catch(err => new Response('Internal Server Error', { status: 500 }));
    },
};
