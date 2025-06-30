const express = require('express')
const router = express.Router();
const {Admin, Book,Review,Subscribe} = require('../models/model')
const jwt = require('jsonwebtoken');
const {JWT_SECRET } = require("../config/config")
const adminMiddleware  = require('../middlewares/admin');
const nodemailer = require('nodemailer');
const axios = require('axios');
const bcrypt = require('bcrypt');


/*****************************************file uploads********************************************************/ 
const cloudinary = require('cloudinary').v2;
const config = require('../config/config');
cloudinary.config({ 
    cloud_name: config.cloudinary.cloudName, // Correctly access cloudName
    api_key: config.cloudinary.apiKey,       // Correctly access apiKey
    api_secret: config.cloudinary.apiSecret   // Correctly access apiSecret
});
    const multer = require('multer');
    const { CloudinaryStorage } = require('multer-storage-cloudinary');
    
    // Cloudinary storage configuration
    const storage = new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: 'bookstore',  // Folder name where images and PDFs will be stored
        allowed_formats: ['jpg', 'png', 'pdf'],  // Allowed file formats
        resource_type: 'auto'  // Auto-detect file type (useful for images and PDFs)
      }
    });
    
    // Initialize multer with Cloudinary storage
    const upload = multer({ storage });    

/********************************************************************************************** */

//admin signup route
// router.post('/signup',async (req,res)=>{
//     const {username,password} = req.body;
//     await Admin.create({
//         username,
//         password
//     })   
//     res.json({
//         message :"Admin created successfully!"
//     }) 
// });
// router.post('/signup', async (req, res) => {
//     const { username, password } = req.body;

//     try {
//         // Check if the username already exists
//         const existingAdmin = await Admin.findOne({ username });
//         if (existingAdmin) {
//             return res.status(400).json({ message: 'Username already exists' });
//         }

//         // Create a new admin
//         await Admin.create({
//             username,
//             password
//         });

//         res.status(201).json({
//             message: "Admin created successfully!"
//         });
//     } catch (error) {
//         console.error(error); // Log the error for debugging
//         res.status(500).json({
//             message: 'Server error, please try again later.'
//         });
//     }
// });


// router.post('/signin',async (req,res)=>{
//     const {username,password} = req.body;
//     const user = await Admin.findOne({username,password});
    
//     if(user){
//         const token = jwt.sign({
//             username: user.username,
//             _id: user._id
//         },JWT_SECRET)

//         res.json({
//             token,
//             userId: user._id
//         });
//     }else{
//         res.status(401).json({
//             msg : "incorrect username or  password"
//         });
//     }
// });
router.post('/signup', async (req, res) => {
    const { username, password} = req.body;
    try {
        // Check if the username already exists
        const existingUser = await Admin.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the new user with hashed password
        await Admin.create({
            username,
            password:hashedPassword,
        });

        res.status(201).json({
            message: "Admin created successfully!"
        });
    } catch (error) {
        console.error(error); // Log the error for debugging
        res.status(500).json({
            message: 'Server error, please try again later.'
        });
    }
});

router.post('/signin', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Find the user by username
        const user = await Admin.findOne({ username });

        if (!user) {
            return res.status(401).json({ msg: "Incorrect username or password" });
        }

        // Compare the provided password with the hashed password in the database
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ msg: "Incorrect username or password" });
        }

        // If password matches, generate a JWT token
        const token = jwt.sign(
            {
                _id: user._id,
                username: user.username,
            },
            JWT_SECRET,
            { expiresIn: '2h' } // Token expires in 2 hours
        );

        // Send the token and user information to the client
        res.status(200).json({
            token,
            user: {
                _id: user._id,
                username: user.username,
            },
        });
    } catch (error) {
        console.error("Error during sign-in:", error);
        res.status(500).json({ msg: "Server error, please try again later." });
    }
});


/*
router.post("/uploadBooks",adminMiddleware,async (req,res)=>{
    const {title,description,author,publication,publishedDate,price,category}= req.body;
    const newBook = await Book.create({
        title,
        description,
        author,
        publication,
        publishedDate,
        price,
        category
    })
    res.json({
        message:"book added successfully",
        BookId : newBook._id
    })
})
*/



router.post("/uploadBooks", adminMiddleware, upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'pdf', maxCount: 1 }
]), async (req, res) => {
    try {
        const { title, description, author, publication, publishedDate, price, category, premium } = req.body;

        // Validate required fields
        if (!title || !description || !author || !price || !category || !req.files?.thumbnail || !req.files?.pdf) {
            return res.status(400).json({ error: "All fields are required, including thumbnail and PDF." });
        }

        // Extract file paths
        const thumbnailUrl = req.files.thumbnail[0]?.path;
        const pdfUrl = req.files.pdf[0]?.path;

        if (!thumbnailUrl || !pdfUrl) {
            return res.status(400).json({ error: "File upload failed. Please try again." });
        }

        const uploadedBy = req.user._id; // Set by adminMiddleware

        // Create new book
        const newBook = await Book.create({
            title,
            description,
            author,
            publication,
            publishedDate,
            price,
            category,
            thumbnail: thumbnailUrl,
            pdf: pdfUrl,
            uploadedBy,
            premium: premium || false,
        });

        res.json({
            message: "Book added successfully",
            bookId: newBook._id
        });
    } catch (error) {
        console.error("Error in /uploadBooks route:", error);
        res.status(500).json({ error: "Internal Server Error: " + error.message });
    }
});





router.get("/books/:userId", adminMiddleware, async (req, res) => {
    const {userId} = req.params;
    try {
        const response = await Book.find({ uploadedBy: userId }); // Filter by logged-in user ID
        res.json({ Books: response });
    } catch (error) {
        res.status(500).json({ msg: "Error fetching books" });
    }
});


router.get("/allemails", async (req, res) => {
    try {
        const response = await Subscribe.find().lean(); // Fetch all emails efficiently
        res.json({ emails: response.map(user => user.email) });
    } catch (error) {
        res.status(500).json({ msg: "Error fetching emails", error: error.message });
    }
});



router.post('/send-newsletter', async (req, res) => {
    try {
        const { title, message } = req.body;

        // Fetch all subscribed emails
        const { data } = await axios.get('http://localhost:5000/admin/allemails');
        console.log("Raw response from /allemails:", data); // Debugging

        const emails = data.emails; // ✅ Ensure correct key name

        if (!emails || emails.length === 0) {
            return res.status(400).json({ data: data, success: false, message: 'No subscribed emails found.' });
        }

        console.log("Emails to send:", emails); // Debugging

        // Configure nodemailer
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: config.EMAIL_USER,
                pass: config.EMAIL_PASS
            }
        });

        // Email HTML Template
        const emailHTML = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #2c3e50; text-align: center;">📢 ${title} 📢</h2>
                <p style="font-size: 16px; color: #444;">${message}</p>
                
                <hr style="border: 0; height: 1px; background: #ddd;">
                
                <p style="font-size: 14px; text-align: center; color: #666;">
                    📰 Stay updated with <strong>Our Website</strong> for more newsletters!<br>
                    <a href="https://yourwebsite.com" style="color: #3498db; text-decoration: none;">Visit Our Website</a>
                </p>

                <p style="text-align: center;">
                    <a href="https://yourwebsite.com/unsubscribe" style="color: #e74c3c; text-decoration: none;">Unsubscribe</a>
                </p>
            </div>
        `;

        // Set up email options
        const mailOptions = {
            from: `"Your Website" <${config.EMAIL_USER}>`,
            to: emails.join(','), // Convert array to comma-separated string
            subject: title,
            text: message, // Fallback for plain text
            html: emailHTML, // Rich HTML email
        };

        // Send email
        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true, message: 'Newsletter sent successfully!' });

    } catch (error) {
        console.error('Error sending newsletter:', error);
        res.status(500).json({ success: false, message: 'Error sending newsletter', error: error.message });
    }
});



router.put('/books/:id', adminMiddleware, async (req, res) => {
    const { id } = req.params;
    const updatedData = req.body;

    try {
        const updatedBook = await Book.findByIdAndUpdate(
            id,
            { ...updatedData },
            { new: true, runValidators: true }
        );

        if (!updatedBook) {
            return res.status(404).json({ msg: "Book not found" });
        }

        res.status(200).json({
            msg: "Book updated successfully",
            book: updatedBook,
        });
    } catch (error) {
        console.error("Error updating book:", error);
        res.status(500).json({ msg: "Error updating book" });
    }
});
router.delete('/books/:id', adminMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        const deletedBook = await Book.findByIdAndDelete(id);

        if (!deletedBook) {
            return res.status(404).json({ msg: "Book not found" });
        }

        res.status(200).json({
            msg: "Book deleted successfully",
            book: deletedBook,
        });
    } catch (error) {
        console.error("Error deleting book:", error);
        res.status(500).json({ msg: "Error deleting book" });
    }
});





router.get('/review/:bookName',adminMiddleware, async (req, res) => {
    try {
        const bookName = req.params.bookName; // Correctly retrieve bookName from params

        // Find the book by its name
        const book = await Book.findOne({ title: bookName });

        if (!book) {
            return res.status(404).json({
                message: "Book not found"
            });
        }

        // Fetch reviews associated with the found book
        const reviews = await Review.find({ book: book._id }).populate('user', 'username'); // Populate user for better readability
        
        // Map the reviews to only include username, rating, and comment
        const responseReviews = reviews.map(review => ({
            username: review.user.username,
            rating: review.rating,
            comment: review.comment
        }));

        // Send the reviews as a response
        res.status(200).json({
            book: book.title,
            reviews: responseReviews
        });
        
    } catch (error) {
        res.status(500).json({
            message: "Error retrieving reviews",
            error: error.message
        });
    }
});
module.exports = router;

