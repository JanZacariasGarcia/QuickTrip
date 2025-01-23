import express from 'express';
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
app.post('/upload-by-link', async (req, res) =>{
    const{link} = req.body;
    // Validate the link input
    if (!link || typeof link !== 'string' || link.trim() === '') {
        return res.status(400).json({ error: 'Invalid link provided.' });
    }
    const newName = 'Photo' + Date.now() + '.jpg'
    await download.image({
        url: link,
        dest : __dirname+'/uploads/' + newName,
    });
    res.json(newName);
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