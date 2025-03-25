import express, {text} from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import * as download from "image-downloader";
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
app.post('/login', async (req,res) => {
    const {email,password} = req.body;
    const userDoc = await User.findOne({email});
    if(userDoc){
        const passOk = bcrypt.compareSync(password, userDoc.password);
        if(passOk){
            jwt.sign({email:userDoc.email, id:userDoc._id}, jwtSecret, {},
                (err,token) => {
                    if(err) throw err;
                    res.cookie('token', token).json(userDoc);
                });
        }else{
            res.status(422).json('pas not ok')
        }
    }
    else{res.json('not found');}
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
// endpoint  index.js
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

async function scrape(destination, from, to, budget) {
    const browser = await playwright.chromium.launch({
        headless: false,
    });

    const MY_CITY = 'dublin-ireland';
    const DEFAULT_TIMEOUT = 2000;
    let cookiesAccepted = false;

    const page = await browser.newPage();
    if (destination === 'anywhere') {
        if (from === 0 || to === 0) {
            await page.goto(`https://www.kiwi.com/en/search/tiles/${MY_CITY}/anywhere?sortAggregateBy=price`);
            await page.waitForTimeout(DEFAULT_TIMEOUT);
        } else {
            await page.goto(`https://www.kiwi.com/en/search/tiles/${MY_CITY}/anywhere/${from}/${to}?sortAggregateBy=price`);
            await page.waitForTimeout(DEFAULT_TIMEOUT);
        }

        if (!cookiesAccepted) {
            await page.locator('#cookies_accept').click();
            cookiesAccepted = true;
            await page.waitForTimeout(DEFAULT_TIMEOUT);
        }

        const cityCardLocator = page.locator('[data-test=PictureCard]');
        const cityCardsCount = await cityCardLocator.count();

        for (let i = 0; i < cityCardsCount; i++) {
            const currentCityCardLocator = cityCardLocator.nth(i);
            const textContent = await currentCityCardLocator.textContent();
            const price = Number(textContent.substring(textContent.indexOf('€') + 1));
            if (price < budget) {
                await currentCityCardLocator.click();
                await page.waitForTimeout(DEFAULT_TIMEOUT);

                await page.locator('text=Cheapest').click();
                await page.waitForTimeout(DEFAULT_TIMEOUT);

                const city = textContent.substring(textContent.indexOf(MY_CITY) + MY_CITY.length, textContent.indexOf('From'))
                    .replaceAll(' ', '-');
                const cheapestFlightCardLocator = page.locator('[data-test=ResultCardWrapper]').first();
                const actualPriceWithDollarSign = await cheapestFlightCardLocator.locator('[data-test=ResultCardPrice] > div:nth-child(1)').textContent();

                const actualPrice = Number(actualPriceWithDollarSign.replace('€', ''));
                if (actualPrice < budget) {
                    await cheapestFlightCardLocator.screenshot({ path: `${from} ${to}(${city})-${actualPrice}.png` });
                }

                await page.goto(`https://www.kiwi.com/en/search/tiles/${MY_CITY}/anywhere/${from}/${to}?sortAggregateBy=price`);
                await page.waitForTimeout(DEFAULT_TIMEOUT);
            }
        }

        await browser.close();
        //return results; // Return the results array
    }
}



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