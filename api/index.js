import express, {text} from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import * as download from "image-downloader";
import path from 'path';
import {fileURLToPath} from 'url';
import {dirname} from 'path';
import * as fs from "node:fs";
import multer from 'multer';
import Groq from "groq-sdk";
import puppeteer from "puppeteer";
import playwright from 'playwright';
import SavedFlight from './models/SavedFlight.js';


const __filename = fileURLToPath(import.meta.url); // Get the current file's path
const __dirname = dirname(__filename); // Get the current directory

dotenv.config();
const app = express();

const bcryptSalt = bcrypt.genSaltSync(12);
const jwtSecret = 'habsdfjbaw4hb4hqjwhb';


// Ensure uploads directory exists
const uploadsDir = __dirname + '/uploads';
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'))
app.use(cors({
    credentials: true,
    origin: true  // frontend URL
}));

await mongoose.connect(process.env.MONGO_URL);

function getUserDataFromReq (req){
    return new Promise((resolve,reject) => {
        jwt.verify(req.cookies.token, jwtSecret, {}, async (err, userData) => {
            if(err) throw err;
            resolve(userData);
        });
    });
}

app.get('/test', (req,res) => {
    res.json('test ok');
})

app.post('/register', async (req,res) => {
    const {name,email,password} = req.body;
    try {
        const userDoc = await User.create({
            name,
            email,
            password: bcrypt.hashSync(password, bcryptSalt)
        });
        res.json(userDoc);
    }catch (e) {
        res.status(422).json(e);
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const userDoc = await User.findOne({ email });

    if (!userDoc) {
        return res.status(404).json({ error: 'User not found' });
    }

    const passOk = await bcrypt.compare(password, userDoc.password);
    if (!passOk) {
        return res.status(422).json({ error: 'Incorrect password' });
    }

    jwt.sign({ email: userDoc.email, id: userDoc._id }, jwtSecret, {}, (err, token) => {
        if (err) throw err;
        res.cookie('token', token, { httpOnly: true }).json({
            id: userDoc._id,
            email: userDoc.email
        });
    });
});

app.get('/profile', (req,res) => {
    const {token} = req.cookies;
    if(token){
        jwt.verify(token, jwtSecret, {}, async (err, userData) => {
            if(err) throw err;
            const {name, email, _id} = await User.findById(userData.id);
            res.json({name, email, _id});
        });
    }else{
        res.json(null);
    }
});
app.post('/logout', (req,res) => {
    res.cookie('token', '').json(true);
});
// app.post('/upload-by-link', async (req, res) =>{
//     const{link} = req.body;
//     // Validate the link input
//     if (!link || typeof link !== 'string' || link.trim() === '') {
//         return res.status(400).json({ error: 'Invalid link provided.' });
//     }
//     const newName = 'Photo' + Date.now() + '.jpg'
//     await download.image({
//         url: link,
//         dest : __dirname+'/uploads/' + newName,
//     });
//     res.json(newName);
// });


app.post('/cities', async (req, res) => {
    const { startDate, endDate, weather, budget } = req.body;
    const groq = new Groq({apiKey:'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'});
    console.log(weather);
    console.log(budget);
    console.log(startDate);
    console.log(endDate);

    try {
        const completion = await groq.chat.completions.create({
            messages: [{
                role: "user",
                content: `Please provide me a list of 20 different cities that I could travel to from Dublin with a budget` +
                    `for my flights of €${budget} or less that are forecasted to have temperatures of ${weather} ` +
                    `from ${startDate} to ${endDate}`,
            }],
            model: "llama-3.3-70b-versatile",
        });

        console.log(completion); // Log the entire response

        res.json({cities: completion.choices[0].message.content});
    } catch (error) {
        console.error(error); // Log the error
        res.status(500).json({ error: error.message });
    }

});

app.post('/airports', async (req, res) => {
    const { airports } = req.body;
    const groq = new Groq({apiKey:'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'});

    // Input validation
    if (!airports || !Array.isArray(airports) || airports.length === 0) {
        return res.status(400).json({ error: 'Invalid or empty airports array provided' });
    }

    // Format the cities list for better prompt readability
    const citiesList = airports.join(', ');

    try {
        const completion = await groq.chat.completions.create({
            messages: [{
                role: "user",
                content: `Please provide the IATA airport codes for the following cities in a clear format. 
                         Only include the main/largest airport for each city.
                         Cities: ${citiesList}
                         
                         Please format the response as a JSON array of objects, each with 'city' and 'code' properties.
                         Example format: [{"city": "Dublin", "code": "DUB"}, {"city": "London", "code": "LHR"}]`
            }],
            model: "llama-3.3-70b-versatile",
        });

        // Parse the response to ensure it's in the correct format
        let airportData;
        try {
            // The AI might return the JSON string with additional text, so try to extract just the JSON part
            const responseText = completion.choices[0].message.content;
            const jsonMatch = responseText.match(/\[.*\]/s);

            if (jsonMatch) {
                airportData = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('Could not find JSON array in response');
            }
        } catch (parseError) {
            console.error('Error parsing AI response:', parseError);
            // Fallback: return the raw response if parsing fails
            return res.json({
                airports: completion.choices[0].message.content
            });
        }

        // Return the structured data
        res.json({
            success: true,
            airports: airportData
        });

    } catch (error) {
        console.error('Groq API Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch airport codes',
            details: error.message
        });
    }
});

// API Endpoint
app.post("/api/flights", async (req, res) => {
    const { home, destination, departure, returnDate } = req.body;

    if (!home || !destination || !departure || !returnDate) {
        return res.status(400).json({ error: "Missing required parameters" });
    }
});

async function scrape(airports, from, to, budget, maxResults = 1) {
    const browser = await playwright.chromium.launch({
        headless: false,
        slowMo: 50
    });

    const MY_CITY = 'dublin-ireland';
    const DEFAULT_TIMEOUT = 200;
    const MAX_SCRAPE_TIME = 1.5 * 60 * 1000; // 3 minutes in milliseconds
    const results = [];
    const startTime = Date.now();

    // Helper function to format city names for Kiwi.com URLs
    // Fixed formatCityForUrl function
    const formatCityForUrl = (cityName) => {
        console.log(`Input cityName: "${cityName}"`);

        // Handle cities that already include country (e.g., "Lisbon, Portugal")
        let cleanCityName = cityName;
        if (cityName.includes(',')) {
            const parts = cityName.split(',');
            cleanCityName = parts[0].trim(); // Take just the city part
            console.log(`Extracted city part: "${cleanCityName}"`);
        }

        // Convert city name to lowercase and replace spaces with hyphens
        let formatted = cleanCityName.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]/g, ''); // Remove special characters except hyphens

        console.log(`Formatted city: "${formatted}"`);

        // Add common country mappings - expand this based on your cities
        const cityCountryMap = {
            // Original tourist cities
            'barcelona': 'barcelona-spain',
            'london': 'london-united-kingdom',
            'rome': 'rome-italy',
            'amsterdam': 'amsterdam-netherlands',
            'madrid': 'madrid-spain',
            'lisbon': 'lisbon-portugal',
            'vienna': 'vienna-austria',
            'prague': 'prague-czechia',
            'budapest': 'budapest-hungary',
            'warsaw': 'warsaw-poland',
            'stockholm': 'stockholm-sweden',
            'oslo': 'oslo-norway',
            'copenhagen': 'copenhagen-denmark',
            'reykjavik': 'reykjavik-iceland',
            'zurich': 'zurich-switzerland',
            'brussels': 'brussels-belgium',
            'athens': 'athens-greece',
            'milan': 'milan-italy',
            'florence': 'florence-italy',
            'venice': 'venice-italy',
            'naples': 'naples-italy',
            'nice': 'nice-france',
            'marseille': 'marseille-france',
            'lyon': 'lyon-france',
            'munich': 'munich-germany',
            'frankfurt': 'frankfurt-germany',
            'hamburg': 'hamburg-germany',
            'cologne': 'cologne-germany',
            'seville': 'seville-spain',
            'valencia': 'valencia-spain',
            'bilbao': 'bilbao-spain',
            'porto': 'porto-portugal',
            'malaga': 'malaga-spain',
            'alicante': 'alicante-spain',
            'toulouse': 'toulouse-france',
            'krakow': 'krakow-poland',
            'gdansk': 'gdansk-poland',
            'dubrovnik': 'dubrovnik-croatia',
            'split': 'split-croatia',
            'ibiza': 'ibiza-spain',

            // ALL capitals including dependencies (not duplicated)
            'kabul': 'kabul-afghanistan',
            'tirana': 'tirana-albania',
            'algiers': 'algiers-algeria',
            'andorra la vella': 'andorra-la-vella-andorra',
            'luanda': 'luanda-angola',
            "saint john's": 'saint-johns-antigua-and-barbuda',
            'buenos aires': 'buenos-aires-argentina',
            'yerevan': 'yerevan-armenia',
            'oranjestad': 'oranjestad-aruba',
            'canberra': 'canberra-australia',
            'baku': 'baku-azerbaijan',
            'nassau': 'nassau-bahamas',
            'manama': 'manama-bahrain',
            'dhaka': 'dhaka-bangladesh',
            'bridgetown': 'bridgetown-barbados',
            'minsk': 'minsk-belarus',
            'belmopan': 'belmopan-belize',
            'port-au-prince': 'port-au-prince-haiti',
            'sucre': 'sucre-bolivia',
            'sarajevo': 'sarajevo-bosnia-and-herzegovina',
            'gaborone': 'gaborone-botswana',
            'brasilia': 'brasilia-brazil',
            'bandar seri begawan': 'bandar-seri-begawan-brunei',
            'sofia': 'sofia-bulgaria',
            'ouagadougou': 'ouagadougou-burkina-faso',
            'gitega': 'gitega-burundi',
            'praia': 'praia-cabo-verde',
            'phnom penh': 'phnom-penh-cambodia',
            'yaounde': 'yaounde-cameroon',
            'ottawa': 'ottawa-canada',
            'georgetown': 'georgetown-cayman-islands',
            'bangui': 'bangui-central-african-republic',
            'ndjamena': 'ndjamena-chad',
            'santiago': 'santiago-chile',
            'beijing': 'beijing-china',
            'flying fish cove': 'flying-fish-cove-christmas-island',
            'west island': 'west-island-cocos-keeling-islands',
            'bogota': 'bogota-colombia',
            'moroni': 'moroni-comoros',
            'kinshasa': 'kinshasa-democratic-republic-of-the-congo',
            'brazzaville': 'brazzaville-republic-of-the-congo',
            'avarua': 'avarua-cook-islands',
            'san josé': 'san-jose-costa-rica',
            'zagreb': 'zagreb-croatia', // this matches existing key but it's the same value, no changes
            'san salvador': 'san-salvador-el-salvador',
            'quito': 'quito-ecuador',
            'cairo': 'cairo-egypt',
            'malabo': 'malabo-equatorial-guinea',
            'asmara': 'asmara-eritrea',
            'tallinn': 'tallinn-estonia',
            'mbabane': 'mbabane-eswatini',
            'addis ababa': 'addis-ababa-ethiopia',
            'stanley': 'stanley-falkland-islands',
            'torshavn': 'torshavn-faroe-islands',
            'suva': 'suva-fiji',
            'helsinki': 'helsinki-finland', // duplicate of existing; same value
            'paris': 'paris-france', // duplicate; same value
            'cayenne': 'cayenne-french-guiana',
            'papeete': 'papeete-french-polynesia',
            'port-aux-français': 'port-aux-francais-french-southern-territories',
            'libreville': 'libreville-gabon',
            'banjul': 'banjul-gambia',
            'tbilisi': 'tbilisi-georgia',
            'berlin': 'berlin-germany', // duplicate; same value
            'accra': 'accra-ghana',
            'gibraltar': 'gibraltar-gibraltar',
            'nuuk': 'nuuk-greenland',
            'hamilton': 'hamilton-bermuda',
            'hong kong': 'hong-kong-china',
            'kingston': 'kingston-jamaica',
            'tokyo': 'tokyo-japan',
            'saint helier': 'saint-helier-jersey',
            'amman': 'amman-jordan',
            'nairobi': 'nairobi-kenya',
            'riyadh': 'riyadh-saudi-arabia',
            'belgrade': 'belgrade-serbia',
            'victoria': 'victoria-seychelles',
            'freetown': 'freetown-sierra-leone',
            'singapore': 'singapore-singapore',
            'bratislava': 'bratislava-slovakia',
            'ljubljana': 'ljubljana-slovenia',
            'honiara': 'honiara-solomon-islands',
            'mogadishu': 'mogadishu-somalia',
            'pretoria': 'pretoria-south-africa',
            'cape town': 'cape-town-south-africa',
            'bloemfontein': 'bloemfontein-south-africa',
            'king edward point': 'king-edward-point-south-georgia-and-south-sandwich-islands',
            'seoul': 'seoul-south-korea',
            'juba': 'juba-south-sudan',
            'colombo': 'colombo-sri-lanka',
            'sri jayawardenepura kotte': 'sri-jayawardenepura-kotte-sri-lanka',
            'khartoum': 'khartoum-sudan',
            'paramaribo': 'paramaribo-suriname',
            'longyearbyen': 'longyearbyen-svalbard-and-jan-mayen',
            'bern': 'bern-switzerland',
            'damascus': 'damascus-syria',
            'taipei': 'taipei-taiwan',
            'dushanbe': 'dushanbe-tajikistan',
            'dodoma': 'dodoma-tanzania',
            'bangkok': 'bangkok-thailand',
            'dili': 'dili-timor-leste',
            'lome': 'lome-togo',
            "nuku'alofa": 'nukualofa-tonga',
            'port-of-spain': 'port-of-spain-trinidad-and-tobago',
            'tunis': 'tunis-tunisia',
            'ankara': 'ankara-turkey',
            'ashgabat': 'ashgabat-turkmenistan',
            'cockburn town': 'cockburn-town-turks-and-caicos-islands',
            'funafuti': 'funafuti-tuvalu',
            'kampala': 'kampala-uganda',
            'kyiv': 'kyiv-ukraine',
            'abu dhabi': 'abu-dhabi-united-arab-emirates',
            'washington, d.c.': 'washington-dc-united-states',
            'montevideo': 'montevideo-uruguay',
            'tashkent': 'tashkent-uzbekistan',
            'port vila': 'port-vila-vanuatu',
            'caracas': 'caracas-venezuela',
            'hanoi': 'hanoi-vietnam',
            'road town': 'road-town-british-virgin-islands',
            'charlotte amalie': 'charlotte-amalie-us-virgin-islands',
            'mata-utu': 'mata-utu-wallis-and-futuna',
            'ramallah': 'ramallah-palestine',

            'istanbul': 'istanbul-turkey',
            'mecca': 'mecca-saudi-arabia',
            'antalya': 'antalya-turkey',
            'macau': 'macau-china',
            'kuala lumpur': 'kuala-lumpur-malaysia',
            'new york city': 'new-york-united-states',
            'delhi': 'delhi-india',
            'shenzhen': 'shenzhen-china',
            'mumbai': 'mumbai-india',
            'phuket': 'phuket-thailand',
            'pattaya': 'pattaya-thailand',
            'los angeles': 'los-angeles-united-states',
            'las vegas': 'las-vegas-united-states',
            'orlando': 'orlando-united-states',
            'miami': 'miami-united-states',
            'san francisco': 'san-francisco-united-states',
            'sydney': 'sydney-australia',
            'melbourne': 'melbourne-australia',
            'mexico city': 'mexico-city-mexico',
            'shanghai': 'shanghai-china',
            'vancouver': 'vancouver-canada',
            'são paulo': 'sao-paulo-brazil',
            'cancún': 'cancun-mexico',
            'honolulu': 'honolulu-united-states',
            'toronto': 'toronto-canada',
            'jerusalem': 'jerusalem-israel',
            'marrakech': 'marrakech-morocco',
            'lima': 'lima-peru',
        };


        console.log(`Looking up "${formatted}" in cityCountryMap...`);
        console.log(`Found mapping: ${cityCountryMap[formatted] || 'NOT FOUND'}`);

        const result = cityCountryMap[formatted] || formatted;
        console.log(`Final result: "${result}"`);

        return result;
    };

    try {
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            viewport: { width: 1280, height: 720 }
        });

        const page = await context.newPage();

        // Helper function to check if we should continue
        const shouldContinue = () => {
            const elapsed = Date.now() - startTime;
            return elapsed < MAX_SCRAPE_TIME && results.length < maxResults;
        };

        // If airports array is provided, search specific destinations
        if (airports && airports.length > 0) {
            console.log(`Received airports data:`, airports);
            console.log(`Searching specific destinations: ${airports.map(a => a.city).join(', ')}`);
            console.log(`Date parameters: from=${from}, to=${to}, budget=${budget}`);

            for (const airport of airports) {
                if (!shouldContinue()) {
                    console.log(`Stopping search: ${results.length >= maxResults ? 'reached max results' : 'timeout reached'}`);
                    break;
                }

                console.log(`\n=== Processing airport: ${JSON.stringify(airport)} ===`);

                try {
                    // Convert city name to city-country format for Kiwi.com URL
                    const cityCountry = formatCityForUrl(airport.city);
                    const searchUrl = `https://www.kiwi.com/en/search/results/${MY_CITY}/${cityCountry}/${from}/${to}?sortBy=price`;

                    console.log(`Searching flights to ${airport.city}:`, searchUrl);
                    console.log(`Formatted city-country: ${cityCountry}`);
                    console.log(`Date parameters: from=${from}, to=${to}`);

                    // Navigate to the URL and check if it worked
                    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

                    // Check if we actually navigated to the right page
                    const currentUrl = page.url();
                    console.log(`Actually navigated to: ${currentUrl}`);

                    // If we got redirected back to homepage, the URL format might be wrong
                    if (currentUrl.includes('/en') && !currentUrl.includes('/search/')) {
                        console.warn(`URL redirect detected for ${airport.city}. Trying alternative format...`);

                        // Try alternative URL format
                        const altSearchUrl = `https://www.kiwi.com/en/search/${MY_CITY}/${cityCountry}/${from}/${to}`;
                        console.log(`Trying alternative URL: ${altSearchUrl}`);
                        await page.goto(altSearchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

                        const newUrl = page.url();
                        console.log(`Alternative navigation result: ${newUrl}`);
                    }

                    await page.waitForTimeout(3000);

                    // Accept cookies
                    await handleCookies(page);

                    // Check if page shows "no results" or similar messages
                    const noResultsSelectors = [
                        'text=No results found',
                        'text=No flights found',
                        '[data-test*="NoResults"]',
                        'text=Sorry, no flights available',
                        '.no-results',
                        '[class*="no-results"]',
                        '[class*="NoResults"]'
                    ];

                    let hasNoResults = false;
                    for (const selector of noResultsSelectors) {
                        try {
                            const noResultsElement = page.locator(selector).first();
                            if (await noResultsElement.isVisible({ timeout: 2000 })) {
                                console.log(`No results found for ${airport.city} using selector: ${selector}`);
                                hasNoResults = true;
                                break;
                            }
                        } catch (e) {
                            continue;
                        }
                    }

                    if (hasNoResults) {
                        console.log(`Skipping ${airport.city} - no flights available for these dates`);
                        continue; // Move to next airport
                    }

                    // Look for result cards directly (since we're on a specific route search)
                    const resultSelectors = [
                        '[data-test=ResultCardWrapper]',
                        '[data-test="ResultCardWrapper"]',
                        '.ResultCardWrapper',
                        '[class*="ResultCard"]',
                        '[data-test*="Result"]'
                    ];

                    let resultCardLocator;
                    let foundResults = false;

                    for (const selector of resultSelectors) {
                        try {
                            // Reduced timeout to 5 seconds per selector
                            await page.waitForSelector(selector, { timeout: 5000 });
                            resultCardLocator = page.locator(selector);
                            const count = await resultCardLocator.count();
                            if (count > 0) {
                                console.log(`Found ${count} results with selector: ${selector}`);
                                foundResults = true;
                                break;
                            }
                        } catch (e) {
                            console.log(`No results with selector: ${selector}`);
                            continue;
                        }
                    }

                    // If no results found after trying all selectors, move to next city
                    if (!foundResults) {
                        console.log(`No result cards found for ${airport.city} after 5 seconds, moving to next city`);
                        continue;
                    }

                    if (resultCardLocator) {
                        const resultCount = await resultCardLocator.count();
                        console.log(`Found ${resultCount} results for ${airport.city}`);

                        // Process first result that's within budget
                        let foundValidFlight = false;
                        for (let i = 0; i < Math.min(resultCount, 3) && shouldContinue() && !foundValidFlight; i++) {
                            const currentResult = resultCardLocator.nth(i);

                            // Extract price from result with timeout - using the working method from original code
                            let price = 0;
                            try {
                                // Get the full text content of the result card first
                                const resultText = await currentResult.textContent({ timeout: 2000 });
                                console.log(`Result card text for ${airport.city}:`, resultText?.substring(0, 200));

                                if (resultText) {
                                    // Use the same price extraction patterns that worked in your original code
                                    const pricePatterns = [
                                        /from\s+(\d+)\s*€/gi,      // "from 165 €"
                                        /(\d+)\s*€/g,              // "165 €"
                                        /€\s*(\d+)/g,              // "€ 165" or "€165"
                                        /tickets?\s+from\s+(\d+)/gi, // "Tickets from 165"
                                    ];

                                    for (const pattern of pricePatterns) {
                                        const matches = Array.from(resultText.matchAll(pattern));
                                        if (matches.length > 0) {
                                            // Get the last match (often the price we want)
                                            const lastMatch = matches[matches.length - 1];
                                            price = Number(lastMatch[1]);
                                            if (price > 0) {
                                                console.log(`Extracted price €${price} for ${airport.city} using pattern: ${pattern}`);
                                                break;
                                            }
                                        }
                                    }

                                    // If still no price, try a more aggressive approach
                                    if (price === 0) {
                                        const numbers = resultText.match(/\d+/g);
                                        if (numbers) {
                                            // Look for numbers that could be prices (typically > 10 and < 10000)
                                            const potentialPrices = numbers.map(n => Number(n)).filter(n => n >= 10 && n <= 10000);
                                            if (potentialPrices.length > 0) {
                                                price = potentialPrices[0]; // Take the first reasonable number
                                                console.log(`Extracted price €${price} for ${airport.city} using fallback method`);
                                            }
                                        }
                                    }
                                } else {
                                    console.log(`No text content found for ${airport.city} result card`);
                                }
                            } catch (e) {
                                console.warn(`Could not extract price for ${airport.city}:`, e.message);
                            }

                            if (price > 0) {
                                // Take screenshot regardless of budget
                                const screenshotsDir = path.join(__dirname, 'screenshots');
                                if (!fs.existsSync(screenshotsDir)) {
                                    fs.mkdirSync(screenshotsDir, { recursive: true });
                                }

                                const screenshotFilename = `flight-${airport.city.replace(/\s+/g, '-')}-${from}-${to}-${price}-${Date.now()}.png`;
                                const screenshotPath = path.join(screenshotsDir, screenshotFilename);

                                try {
                                    await currentResult.screenshot({ path: screenshotPath, timeout: 5000 });
                                    console.log(`Screenshot saved: ${screenshotFilename}`);
                                } catch (screenshotError) {
                                    console.warn(`Screenshot failed for ${airport.city}:`, screenshotError.message);
                                }

                                results.push({
                                    city: airport.city,
                                    code: airport.code,
                                    price: price,
                                    screenshotPath: screenshotFilename,
                                    pageUrl: page.url()
                                });

                                console.log(`✓ Added result ${results.length}/${maxResults}: ${airport.city} - €${price}`);
                                foundValidFlight = true;
                                break; // Move to next airport after finding one result
                            } else {
                                console.log(`Invalid price €${price} for ${airport.city}`);
                            }
                        }

                        if (!foundValidFlight) {
                            console.log(`No flights with valid prices found for ${airport.city}`);
                        }
                    } else {
                        console.log(`No results found for ${airport.city} - moving to next city`);
                    }

                } catch (err) {
                    console.error(`Error searching ${airport.city}:`, err.message);
                    console.log(`Skipping ${airport.city} and moving to next city`);
                    // Don't break the entire loop, just continue to next city
                    continue;
                }
            }
        } else {
            // Fallback to "anywhere" search if no specific airports provided
            console.log("No specific airports provided, searching 'anywhere'");
            const searchUrl = from === 0 || to === 0
                ? `https://www.kiwi.com/en/search/tiles/${MY_CITY}/anywhere?sortAggregateBy=price`
                : `https://www.kiwi.com/en/search/tiles/${MY_CITY}/anywhere/${from}/${to}?sortAggregateBy=price`;

            console.log("Navigating to URL:", searchUrl);

            try {
                await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
                console.log("Page loaded (domcontentloaded)");
            } catch (error) {
                console.error("Navigation failed:", error.message);
                console.log("Trying with 'load' strategy...");
                await page.goto(searchUrl, { waitUntil: 'load', timeout: 60000 });
            }

            await page.waitForTimeout(3000);
            console.log("Waited for initial page load");

            const title = await page.title();
            console.log("Page title:", title);

            const url = page.url();
            console.log("Current URL:", url);

            await handleCookies(page);

            console.log("Waiting for PictureCards...");

            const cardSelectors = [
                '[data-test=PictureCard]',
                '[data-test="PictureCard"]',
                '.PictureCard',
                '[class*="PictureCard"]',
                '[data-testid="PictureCard"]'
            ];

            let cardsFound = false;
            for (const selector of cardSelectors) {
                try {
                    await page.waitForSelector(selector, { timeout: 10000 });
                    console.log(`PictureCards found with selector: ${selector}`);
                    cardsFound = true;
                    break;
                } catch (e) {
                    console.log(`No cards found with selector: ${selector}`);
                }
            }

            if (!cardsFound) {
                await page.screenshot({ path: `debug-no-cards-${Date.now()}.png`, fullPage: true });
                console.log("No PictureCards found. Screenshot saved for debugging.");

                const allElements = await page.$$eval('*[data-test], *[data-testid], *[class*="Card"], *[class*="card"]',
                    elements => elements.map(el => ({
                        tagName: el.tagName,
                        dataTest: el.getAttribute('data-test'),
                        dataTestId: el.getAttribute('data-testid'),
                        className: el.className,
                        textContent: el.textContent?.substring(0, 100)
                    }))
                );
                console.log("Available elements:", allElements.slice(0, 10));

                throw new Error("Could not find PictureCards with any selector");
            }

            let cityCardLocator;
            for (const selector of cardSelectors) {
                try {
                    const locator = page.locator(selector);
                    const count = await locator.count();
                    if (count > 0) {
                        cityCardLocator = locator;
                        console.log(`Using selector ${selector}, found ${count} cards`);
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }

            if (!cityCardLocator) {
                throw new Error("Could not locate any PictureCards");
            }

            const cityCardsCount = await cityCardLocator.count();
            const limitedCardsCount = Math.min(cityCardsCount, 20);

            for (let i = 0; i < limitedCardsCount && shouldContinue(); i++) {
                try {
                    console.log(`Processing card ${i + 1}/${limitedCardsCount}`);

                    const currentCityCardLocator = cityCardLocator.nth(i);

                    await currentCityCardLocator.waitFor({ state: 'visible', timeout: 5000 });

                    const textContent = await currentCityCardLocator.textContent();
                    console.log(`Card ${i} text:`, textContent?.substring(0, 100));
                    console.log(`Full card text for debugging: "${textContent}"`);

                    // EXTRACT CITY NAME FIRST - before clicking
                    let city = "unknown";

                    if (textContent) {
                        const cleanedText = textContent.replace(/\s+/g, ' ').trim();

                        const origin = 'dublin';
                        let afterOrigin = cleanedText.toLowerCase().includes(origin)
                            ? cleanedText.substring(cleanedText.toLowerCase().indexOf(origin) + origin.length).trim()
                            : cleanedText;

                        afterOrigin = afterOrigin.replace(/^loading/i, '').trim();

                        const splitKeywords = ['tickets', 'from'];
                        for (const keyword of splitKeywords) {
                            const index = afterOrigin.toLowerCase().indexOf(keyword);
                            if (index !== -1) {
                                afterOrigin = afterOrigin.substring(0, index).trim();
                            }
                        }

                        const potentialCity = afterOrigin.replace(/[→,:\-]+$/, '').trim();

                        if (potentialCity && potentialCity.toLowerCase() !== origin) {
                            city = potentialCity;
                            console.log(`Extracted city using string slicing: "${city}"`);
                        }

                        if (city === "unknown") {
                            try {
                                const ariaLabel = await currentCityCardLocator.getAttribute('aria-label');
                                if (ariaLabel) {
                                    const match = ariaLabel.match(/to\s+([A-Za-zÀ-ÿ\s'-]+)/i);
                                    if (match && match[1]) {
                                        city = match[1].trim();
                                        console.log(`Extracted city from aria-label: "${city}"`);
                                    }
                                }
                            } catch (e) {
                                console.warn("Could not get aria-label:", e.message);
                            }
                        }

                        if (city === "unknown") {
                            const citySelectors = [
                                '[data-test*="destination"]',
                                '[class*="destination"]',
                                'h2', 'h3', 'h4',
                                '[class*="title"]',
                                '[class*="city"]'
                            ];

                            for (const selector of citySelectors) {
                                try {
                                    const cityElement = currentCityCardLocator.locator(selector).first();
                                    if (await cityElement.isVisible({ timeout: 1000 })) {
                                        const cityText = await cityElement.textContent();
                                        if (cityText && cityText.trim()) {
                                            const cleanCity = cityText.trim().replace(/[→,]/g, '').trim();
                                            if (cleanCity.toLowerCase() !== origin && cleanCity.length > 1) {
                                                city = cleanCity;
                                                console.log(`Found city using selector ${selector}: "${city}"`);
                                                break;
                                            }
                                        }
                                    }
                                } catch (e) {
                                    continue;
                                }
                            }
                        }
                    }

                    // More robust price extraction - look for patterns like "from 165 €" or "165 €"
                    let price = 0;
                    if (textContent) {
                        const pricePatterns = [
                            /from\s+(\d+)\s*€/gi,
                            /(\d+)\s*€/g,
                            /€\s*(\d+)/g,
                            /tickets?\s+from\s+(\d+)/gi,
                        ];

                        for (const pattern of pricePatterns) {
                            const matches = Array.from(textContent.matchAll(pattern));
                            if (matches.length > 0) {
                                const lastMatch = matches[matches.length - 1];
                                price = Number(lastMatch[1]);
                                if (price > 0) {
                                    console.log(`Extracted price €${price} using pattern: ${pattern}`);
                                    break;
                                }
                            }
                        }

                        if (price === 0) {
                            const numbers = textContent.match(/\d+/g);
                            if (numbers) {
                                const potentialPrices = numbers.map(n => Number(n)).filter(n => n >= 10 && n <= 10000);
                                if (potentialPrices.length > 0) {
                                    price = potentialPrices[potentialPrices.length - 1];
                                    console.log(`Extracted price €${price} using fallback method`);
                                }
                            }
                        }
                    }

                    console.log(`Card ${i} - City: "${city}", Price: €${price}, Budget: €${budget}`);

                    if (price > 0 && price < budget) {
                        console.log(`Price ${price} is within budget ${budget}, clicking card...`);

                        await currentCityCardLocator.scrollIntoViewIfNeeded();
                        await page.waitForTimeout(1000);

                        await currentCityCardLocator.click();
                        console.log("Card clicked, waiting for page to load...");
                        await page.waitForTimeout(DEFAULT_TIMEOUT * 2);

                        const cheapestSelectors = [
                            'text=Cheapest',
                            'button:has-text("Cheapest")',
                            '[data-test*="cheapest"]',
                            '[data-test*="Cheapest"]',
                            'button:has-text("Price")'
                        ];

                        let cheapestClicked = false;
                        for (const selector of cheapestSelectors) {
                            try {
                                const cheapestButton = page.locator(selector).first();
                                if (await cheapestButton.isVisible({ timeout: 3000 })) {
                                    await cheapestButton.click();
                                    console.log(`Cheapest button clicked using: ${selector}`);
                                    cheapestClicked = true;
                                    break;
                                }
                            } catch (e) {
                                continue;
                            }
                        }

                        if (!cheapestClicked) {
                            console.log("Could not find Cheapest button, taking screenshot...");
                            await page.screenshot({ path: `debug-no-cheapest-${Date.now()}.png`, fullPage: true });
                        }

                        await page.waitForTimeout(DEFAULT_TIMEOUT);

                        const resultSelectors2 = [
                            '[data-test=ResultCardWrapper]',
                            '[data-test="ResultCardWrapper"]',
                            '.ResultCardWrapper',
                            '[class*="ResultCard"]',
                            '[data-test*="Result"]'
                        ];

                        let resultCardLocator2;
                        for (const selector of resultSelectors2) {
                            try {
                                await page.waitForSelector(selector, { timeout: 5000 });
                                resultCardLocator2 = page.locator(selector).first();
                                console.log(`Found results with selector: ${selector}`);
                                break;
                            } catch (e) {
                                console.log(`No results found with: ${selector}`);
                            }
                        }

                        if (!resultCardLocator2) {
                            console.log("No result cards found, taking screenshot...");
                            await page.screenshot({ path: `debug-no-results-${Date.now()}.png`, fullPage: true });
                            throw new Error("Could not find result cards");
                        }

                        let actualPrice = 0;
                        try {
                            const priceSelectors = [
                                '[data-test=ResultCardPrice] > div:nth-child(1)',
                                '[data-test="ResultCardPrice"]',
                                // '[class*="price"]',
                                // 'div:has-text("€")'
                            ];

                            for (const priceSelector of priceSelectors) {
                                try {
                                    const priceElement = resultCardLocator2.locator(priceSelector).first();
                                    const actualPriceText = await priceElement.textContent({ timeout: 3000 });
                                    if (actualPriceText && actualPriceText.includes('€')) {
                                        const priceMatch = actualPriceText.match(/€?(\d+)/);
                                        if (priceMatch) {
                                            actualPrice = Number(priceMatch[1]);
                                            console.log(`Found actual price: €${actualPrice} using ${priceSelector}`);
                                            break;
                                        }
                                    }
                                } catch (e) {
                                    continue;
                                }
                            }
                        } catch (e) {
                            console.warn("Could not extract actual price:", e.message);
                        }

                        const screenshotsDir = path.join(__dirname, 'screenshots');
                        if (!fs.existsSync(screenshotsDir)) {
                            fs.mkdirSync(screenshotsDir, { recursive: true });
                        }

                        const screenshotFilename = `flight-${city}-${from}-${to}-${actualPrice || price}-${Date.now()}.png`;
                        const screenshotPath = path.join(screenshotsDir, screenshotFilename);

                        await resultCardLocator2.screenshot({ path: screenshotPath });
                        console.log(`Screenshot saved: ${screenshotFilename}`);

                        results.push({
                            city,
                            price: actualPrice || price,
                            screenshotPath: screenshotFilename,
                            pageUrl: page.url()
                        });

                        console.log("Going back to search page...");
                        const searchUrl = from === 0 || to === 0
                            ? `https://www.kiwi.com/en/search/tiles/${MY_CITY}/anywhere?sortAggregateBy=price`
                            : `https://www.kiwi.com/en/search/tiles/${MY_CITY}/anywhere/${from}/${to}?sortAggregateBy=price`;
                        await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
                        await page.waitForTimeout(DEFAULT_TIMEOUT);
                    } else {
                        console.log(`Skipping card ${i}: price €${price} exceeds budget €${budget}`);
                    }
                } catch (err) {
                    console.error(`Error processing city card ${i}:`, err.message);
                    await page.screenshot({ path: `error-card-${i}-${Date.now()}.png`, fullPage: true });

                    try {
                        const searchUrl = from === 0 || to === 0
                            ? `https://www.kiwi.com/en/search/tiles/${MY_CITY}/anywhere?sortAggregateBy=price`
                            : `https://www.kiwi.com/en/search/tiles/${MY_CITY}/anywhere/${from}/${to}?sortAggregateBy=price`;
                        await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
                        await page.waitForTimeout(DEFAULT_TIMEOUT);
                    } catch (e) {
                        console.error("Could not return to search page:", e.message);
                    }
                    continue;
                }
            }
        }

        const elapsed = Date.now() - startTime;
        console.log(`Scrape completed in ${elapsed}ms. Found ${results.length} results.`);

        if (results.length === 0) {
            console.warn("No flights found within budget and time constraints");
        }

        return results.slice(0, maxResults);

    } catch (error) {
        console.error('Scraping error:', error.message);
        throw error;
    } finally {
        await browser.close();
    }
}

// Helper function to handle cookies
async function handleCookies(page) {
    try {
        console.log("Looking for cookie banner...");
        const cookieSelectors = [
            '#cookies_accept',
            '[data-test="CookiesPopup"] button',
            'button:has-text("Accept")',
            'button:has-text("I agree")',
            '.cookie-banner button',
            '[id*="cookie"] button',
            '[class*="cookie"] button'
        ];

        for (const selector of cookieSelectors) {
            try {
                const cookieButton = page.locator(selector).first();
                if (await cookieButton.isVisible({ timeout: 2000 })) {
                    await cookieButton.click();
                    console.log(`Cookies accepted using selector: ${selector}`);
                    await page.waitForTimeout(200);
                    return;
                }
            } catch (e) {
                continue;
            }
        }
        console.log("No cookie banner found");
    } catch (e) {
        console.warn("Cookie handling error:", e.message);
    }
}

// Updated Express route
app.post('/api/scrape', async (req, res) => {
    try {
        const { airports, from, to, budget } = req.body;
        console.log('Scrape request:', { airports, from, to, budget });

        const results = await scrape(airports, from, to, budget, 10);
        res.json({ success: true, results });
    } catch (error) {
        console.error('Scraping error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Save a flight
app.post('/api/save-flight', async (req, res) => {
    try {
        const userData = await getUserDataFromReq(req);
        const { city, code, price, pageUrl, departureDate, returnDate } = req.body;

        // Validate required fields
        if (!city || !price || !pageUrl || !departureDate || !returnDate) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        // Check if flight is already saved by this user
        const existingFlight = await SavedFlight.findOne({
            userId: userData.id,
            city: city,
            departureDate: departureDate,
            returnDate: returnDate
        });

        if (existingFlight) {
            return res.status(409).json({
                success: false,
                error: 'Flight already saved'
            });
        }

        // Parse departure date to check if it's in the past
        const depDate = new Date(departureDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (depDate < today) {
            return res.status(400).json({
                success: false,
                error: 'Cannot save flights with past departure dates'
            });
        }

        const savedFlight = new SavedFlight({
            userId: userData.id,
            city,
            code,
            price,
            pageUrl,
            departureDate,
            returnDate,
            scrapedAt: new Date()
        });

        await savedFlight.save();

        res.json({
            success: true,
            message: 'Flight saved successfully',
            savedFlight: {
                id: savedFlight._id,
                city: savedFlight.city,
                code: savedFlight.code,
                price: savedFlight.price,
                scrapedAt: savedFlight.scrapedAt
            }
        });

    } catch (error) {
        console.error('Error saving flight:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to save flight'
        });
    }
});

// Remove a saved flight
app.delete('/api/save-flight/:flightId', async (req, res) => {
    try {
        const userData = await getUserDataFromReq(req);
        const { flightId } = req.params;

        const deletedFlight = await SavedFlight.findOneAndDelete({
            _id: flightId,
            userId: userData.id
        });

        if (!deletedFlight) {
            return res.status(404).json({
                success: false,
                error: 'Flight not found'
            });
        }

        res.json({
            success: true,
            message: 'Flight removed from saved flights'
        });

    } catch (error) {
        console.error('Error removing flight:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to remove flight'
        });
    }
});

// Get user's saved flights
app.get('/api/saved-flights', async (req, res) => {
    try {
        const userData = await getUserDataFromReq(req);

        const savedFlights = await SavedFlight.find({
            userId: userData.id
        }).sort({ createdAt: -1 });

        // Filter out flights where departure date has passed
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const validFlights = savedFlights.filter(flight => {
            const depDate = new Date(flight.departureDate);
            return depDate >= today;
        });

        // Clean up expired flights in background
        if (validFlights.length !== savedFlights.length) {
            const expiredFlights = savedFlights.filter(flight => {
                const depDate = new Date(flight.departureDate);
                return depDate < today;
            });

            // Delete expired flights
            await SavedFlight.deleteMany({
                _id: { $in: expiredFlights.map(f => f._id) }
            });
        }

        res.json({
            success: true,
            savedFlights: validFlights
        });

    } catch (error) {
        console.error('Error fetching saved flights:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch saved flights'
        });
    }
});

// Check if specific flights are saved (for displaying star states)
app.post('/api/check-saved-flights', async (req, res) => {
    try {
        const userData = await getUserDataFromReq(req);
        const { flights } = req.body; // Array of flight objects

        if (!flights || !Array.isArray(flights)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid flights array'
            });
        }

        // Create lookup criteria for each flight
        const lookupCriteria = flights.map(flight => ({
            userId: userData.id,
            city: flight.city,
            departureDate: flight.departureDate,
            returnDate: flight.returnDate
        }));

        // Find saved flights
        const savedFlights = await SavedFlight.find({
            $or: lookupCriteria
        });

        // Create a map of saved flights
        const savedFlightMap = {};
        savedFlights.forEach(sf => {
            const key = `${sf.city}-${sf.departureDate}-${sf.returnDate}`;
            savedFlightMap[key] = sf._id;
        });

        // Map results back to the original flights
        const results = flights.map(flight => {
            const key = `${flight.city}-${flight.departureDate}-${flight.returnDate}`;
            return {
                ...flight,
                isSaved: !!savedFlightMap[key],
                savedFlightId: savedFlightMap[key] || null
            };
        });

        res.json({
            success: true,
            flights: results
        });

    } catch (error) {
        console.error('Error checking saved flights:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check saved flights'
        });
    }
});

// Cleanup job - run periodically to remove expired flights
// You can call this manually or set up a cron job
app.post('/api/cleanup-expired-flights', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const result = await SavedFlight.deleteMany({
            departureDate: { $lt: today.toISOString().split('T')[0] }
        });

        res.json({
            success: true,
            message: `Cleaned up ${result.deletedCount} expired flights`
        });

    } catch (error) {
        console.error('Error during cleanup:', error);
        res.status(500).json({
            success: false,
            error: 'Cleanup failed'
        });
    }
});

app.listen(4000);