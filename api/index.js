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
    origin: true  // Your frontend URL
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

async function scrape(destination, from, to, budget) {
    const browser = await playwright.chromium.launch({
        headless: false, // Run headful for debugging
        slowMo: 50 // Optional: slow down actions so you can see them
    });

    const MY_CITY = 'dublin-ireland';
    const DEFAULT_TIMEOUT = 200;
    const results = [];

    try {
        // Create context with user agent
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            viewport: { width: 1280, height: 720 }
        });

        const page = await context.newPage();

        const searchUrl = destination === 'anywhere'
            ? (from === 0 || to === 0
                ? `https://www.kiwi.com/en/search/tiles/${MY_CITY}/anywhere?sortAggregateBy=price`
                : `https://www.kiwi.com/en/search/tiles/${MY_CITY}/anywhere/${from}/${to}?sortAggregateBy=price`)
            : `https://www.kiwi.com/en/search/results/${MY_CITY}/${destination}/${from}/${to}?sortBy=price`;

        console.log("Navigating to URL:", searchUrl);

        // Try different wait strategies
        try {
            await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
            console.log("Page loaded (domcontentloaded)");
        } catch (error) {
            console.error("Navigation failed:", error.message);
            console.log("Trying with 'load' strategy...");
            await page.goto(searchUrl, { waitUntil: 'load', timeout: 60000 });
        }

        // Wait a bit for dynamic content
        await page.waitForTimeout(3000);
        console.log("Waited for initial page load");

        // Check what's actually on the page
        const title = await page.title();
        console.log("Page title:", title);

        const url = page.url();
        console.log("Current URL:", url);

        // Accept cookies if present
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

            let cookieAccepted = false;
            for (const selector of cookieSelectors) {
                try {
                    const cookieButton = page.locator(selector).first();
                    if (await cookieButton.isVisible({ timeout: 2000 })) {
                        await cookieButton.click();
                        console.log(`Cookies accepted using selector: ${selector}`);
                        cookieAccepted = true;
                        await page.waitForTimeout(DEFAULT_TIMEOUT);
                        break;
                    }
                } catch (e) {
                    // Continue to next selector
                }
            }

            if (!cookieAccepted) {
                console.log("No cookie banner found with any selector");
            }
        } catch (e) {
            console.warn("Cookie handling error:", e.message);
        }

        console.log("Waiting for PictureCards...");

        // Try multiple selectors for the cards
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
            // Take a screenshot for debugging
            await page.screenshot({ path: `debug-no-cards-${Date.now()}.png`, fullPage: true });
            console.log("No PictureCards found. Screenshot saved for debugging.");

            // Log available elements for debugging
            const allElements = await page.$eval('*[data-test], *[data-testid], *[class*="Card"], *[class*="card"]',
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

        // Find cards using the successful selector
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

        const limitedCardsCount = Math.min(cityCardsCount, 10); // Process up to 10 cards

        for (let i = 0; i < limitedCardsCount; i++) {
            try {
                console.log(`Processing card ${i + 1}/${limitedCardsCount}`);

                const currentCityCardLocator = cityCardLocator.nth(i);

                // Wait for the card to be visible
                await currentCityCardLocator.waitFor({ state: 'visible', timeout: 5000 });

                const textContent = await currentCityCardLocator.textContent();
                console.log(`Card ${i} text:`, textContent?.substring(0, 100));
                console.log(`Full card text for debugging: "${textContent}"`); // Added for debugging

                // EXTRACT CITY NAME FIRST - before clicking
                let city = "unknown";

                if (textContent) {
                    // Normalize spacing
                    const cleanedText = textContent.replace(/\s+/g, ' ').trim();

                    // Try slicing out the destination between "Dublin" and "Tickets" or "from"
                    const origin = 'dublin';
                    let afterOrigin = cleanedText.toLowerCase().includes(origin)
                        ? cleanedText.substring(cleanedText.toLowerCase().indexOf(origin) + origin.length).trim()
                        : cleanedText;

                    // Remove leading junk like "Loading"
                    afterOrigin = afterOrigin.replace(/^loading/i, '').trim();

                    // Try to isolate city portion before "Tickets" or "from"
                    const splitKeywords = ['tickets', 'from'];
                    for (const keyword of splitKeywords) {
                        const index = afterOrigin.toLowerCase().indexOf(keyword);
                        if (index !== -1) {
                            afterOrigin = afterOrigin.substring(0, index).trim();
                        }
                    }

                    // Clean final result
                    const potentialCity = afterOrigin.replace(/[→,:\-]+$/, '').trim();

                    if (potentialCity && potentialCity.toLowerCase() !== origin) {
                        city = potentialCity;
                        console.log(`Extracted city using string slicing: "${city}"`);
                    }

                    // Fallback: aria-label
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

                    // Fallback: inner element selectors
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
                    // Try multiple price patterns with proper global flags
                    const pricePatterns = [
                        /from\s+(\d+)\s*€/gi,      // "from 165 €"
                        /(\d+)\s*€/g,              // "165 €"
                        /€\s*(\d+)/g,              // "€ 165" or "€165"
                        /tickets?\s+from\s+(\d+)/gi, // "Tickets from 165"
                    ];

                    for (const pattern of pricePatterns) {
                        const matches = Array.from(textContent.matchAll(pattern));
                        if (matches.length > 0) {
                            // Get the last match (often the price we want)
                            const lastMatch = matches[matches.length - 1];
                            price = Number(lastMatch[1]);
                            if (price > 0) {
                                console.log(`Extracted price €${price} using pattern: ${pattern}`);
                                break;
                            }
                        }
                    }

                    // If still no price, try a more aggressive approach
                    if (price === 0) {
                        const numbers = textContent.match(/\d+/g);
                        if (numbers) {
                            // Look for numbers that could be prices (typically > 10 and < 10000)
                            const potentialPrices = numbers.map(n => Number(n)).filter(n => n >= 10 && n <= 10000);
                            if (potentialPrices.length > 0) {
                                price = potentialPrices[potentialPrices.length - 1]; // Take the last reasonable number
                                console.log(`Extracted price €${price} using fallback method`);
                            }
                        }
                    }
                }

                console.log(`Card ${i} - City: "${city}", Price: €${price}, Budget: €${budget}`);

                if (price > 0 && price < budget) {
                    console.log(`Price ${price} is within budget ${budget}, clicking card...`);

                    // Scroll to element first
                    await currentCityCardLocator.scrollIntoViewIfNeeded();
                    await page.waitForTimeout(1000);

                    await currentCityCardLocator.click();
                    console.log("Card clicked, waiting for page to load...");
                    await page.waitForTimeout(DEFAULT_TIMEOUT * 2);

                    // Try different selectors for the "Cheapest" button
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
                            // Continue to next selector
                        }
                    }

                    if (!cheapestClicked) {
                        console.log("Could not find Cheapest button, taking screenshot...");
                        await page.screenshot({ path: `debug-no-cheapest-${Date.now()}.png`, fullPage: true });
                    }

                    await page.waitForTimeout(DEFAULT_TIMEOUT);

                    // Try different selectors for result cards
                    const resultSelectors = [
                        '[data-test=ResultCardWrapper]',
                        '[data-test="ResultCardWrapper"]',
                        '.ResultCardWrapper',
                        '[class*="ResultCard"]',
                        '[data-test*="Result"]'
                    ];

                    let resultCardLocator;
                    for (const selector of resultSelectors) {
                        try {
                            await page.waitForSelector(selector, { timeout: 5000 });
                            resultCardLocator = page.locator(selector).first();
                            console.log(`Found results with selector: ${selector}`);
                            break;
                        } catch (e) {
                            console.log(`No results found with: ${selector}`);
                        }
                    }

                    if (!resultCardLocator) {
                        console.log("No result cards found, taking screenshot...");
                        await page.screenshot({ path: `debug-no-results-${Date.now()}.png`, fullPage: true });
                        throw new Error("Could not find result cards");
                    }

                    // More robust price extraction from results
                    let actualPrice = 0;
                    try {
                        const priceSelectors = [
                            '[data-test=ResultCardPrice] > div:nth-child(1)',
                            '[data-test="ResultCardPrice"]',
                            '[class*="price"]',
                            'div:has-text("€")'
                        ];

                        for (const priceSelector of priceSelectors) {
                            try {
                                const priceElement = resultCardLocator.locator(priceSelector).first();
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

                    // Ensure screenshots dir
                    const screenshotsDir = path.join(__dirname, 'screenshots');
                    if (!fs.existsSync(screenshotsDir)) {
                        fs.mkdirSync(screenshotsDir, { recursive: true });
                    }

                    const screenshotFilename = `flight-${city}-${from}-${to}-${actualPrice || price}-${Date.now()}.png`;
                    const screenshotPath = path.join(screenshotsDir, screenshotFilename);

                    await resultCardLocator.screenshot({ path: screenshotPath });
                    console.log(`Screenshot saved: ${screenshotFilename}`);

                    results.push({
                        city,  // Now we have the correct city name extracted before clicking
                        price: actualPrice || price,
                        screenshotPath: screenshotFilename,
                        pageUrl: page.url()
                    });

                    // Go back to the search page
                    console.log("Going back to search page...");
                    await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
                    await page.waitForTimeout(DEFAULT_TIMEOUT);
                } else {
                    console.log(`Skipping card ${i}: price €${price} exceeds budget €${budget}`);
                }
            } catch (err) {
                console.error(`Error processing city card ${i}:`, err.message);
                await page.screenshot({ path: `error-card-${i}-${Date.now()}.png`, fullPage: true });

                // Try to go back to search page if we're lost
                try {
                    await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
                    await page.waitForTimeout(DEFAULT_TIMEOUT);
                } catch (e) {
                    console.error("Could not return to search page:", e.message);
                }
                continue;
            }
        }

        console.log("Scrape complete:", results);
        return results;
    } catch (error) {
        console.error('Scraping error:', error.message);
        throw error;
    } finally {
        await browser.close();
    }
}

// Updated Express route to use the new scrape function
app.post('/api/scrape', async (req, res) => {
    try {
        const { destination, from, to, budget } = req.body;
        const results = await scrape(destination, from, to, budget);
        res.json({ success: true, results });
    } catch (error) {
        console.error('Scraping error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});



const photosMiddleware = multer({ dest: 'uploads/' });
// app.post('/upload', photosMiddleware.array('photos', 100),async (req, res) =>{
//     const uploadedFiles = [];
//     for(let i = 0; i<req.files.length; i++){
//         const {path, originalname} = req.files[i];
//         const parts = originalname.split('.')
//         const ext = parts[parts.length-1];
//         const newPath = path +'.'+ ext;
//         fs.renameSync(path, newPath);
//         uploadedFiles.push(newPath.replace('uploads/',''));
//     }
//     res.json(uploadedFiles);
// });
// app.post('/places', (req, res) => {
//     const { token } = req.cookies;
//     const { title, address, addedPhotos, description, perks, extraInfo, checkIn, checkOut, guests, price } = req.body;
//     jwt.verify(token, jwtSecret, {}, async (err, userData) => {
//         if (err) throw err;
//         const placeDoc = await Place.create({
//             owner: userData.id,
//             title, address, photos: addedPhotos,
//             description, perks, extraInfo,
//             checkIn, checkOut, guests, price
//         });
//         res.json(placeDoc);
//     });
// });
// app.get('/user-places', (req,res)=>{
//     const {token} = req.cookies;
//     jwt.verify(token, jwtSecret, {}, async (err, userData) => {
//         if (err) throw err;
//         const {id} = userData;
//         res.json(await Place.find({owner:id}));
//     });
// });
// app.get('/places/:id', async (req, res) => {
//     const {id} = req.params;
//     res.json(await Place.findById(id));
// });
// app.put('/places', async (req, res) => {
//     const {token} = req.cookies;
//     const {
//         id,
//         title,address,addedPhotos,
//         description,perks,extraInfo,
//         checkIn,checkOut,guests, price
//     } = req.body;
//     await jwt.verify(token, jwtSecret, {}, async (err, userData) => {
//         if (err) throw err;
//         const placeDoc = await Place.findById(id);
//         if (userData.id === placeDoc.owner.toString()) {
//             placeDoc.set({
//                 title, address, photos: addedPhotos,
//                 description, perks, extraInfo,
//                 checkIn, checkOut, guests, price
//             })
//             await placeDoc.save();
//             res.json('ok');
//         }
//     });
// });

// app.get('/places', async (req, res) => {
//     res.json(await Place.find());
// });

// app.post('/bookings', async (req,res) => {
//     const userData = await getUserDataFromReq(req);
//     const {
//         place, checkIn, checkOut, name, guests, phone, price,
//     } = req.body;
//     Booking.create({
//         place, checkIn, checkOut, name, guests, phone, price,
//         user: userData.id,
//     }).then((doc) => {
//         res.json(doc);
//     }).catch((err) => {
//         throw err;
//     });
// });

// app.get('/bookings', async (req,res) => {
//     const userData = await getUserDataFromReq(req);
//     res.json(await Booking.find({user:userData.id}).populate('place'));
// })

app.listen(4000);