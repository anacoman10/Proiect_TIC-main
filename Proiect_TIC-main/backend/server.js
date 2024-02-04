const { initializeApp, applicationDefault, cert } = require('firebase-admin/app')
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore')
const admin = require('firebase-admin')

const serviceAccount = require('./firebase/app-tic-51e3f-firebase-adminsdk-6mhzl-15cce25c7c.json')

initializeApp({
  credential:cert(serviceAccount)
});
const db=getFirestore();

const express=require("express")
const app = express()
const logger=require("morgan")
const cors=require('cors')
const port = 3001;

app.use(logger('dev'))
app.use(cors())
app.use(express.urlencoded({extended:false}))
app.use(express.json())

const bcrypt=require("bcrypt")
const saltRounds=10

let jwt = require("jsonwebtoken")
const fs=require("fs")
const privateKey = fs.readFileSync('private-key.key');
const publicKey = fs.readFileSync('public-key.key');
const crypto = require('crypto');


// GET: getAllReviews, getReviewFromUser?, getReviewWithAuthor?, getReviewDetails (+getComments)
// POST: OK-postRegister, OK-postLogin, OK-postReview, OK-postComment, postReviewsList?
// PUT: OK-putReview, OK-putLike, OK-putComment
// DELETE: OK-deleteReview, deleteComment

function checkAuthorization(req, res, next)
{
    console.log("Passing through middleware")
    let token = req.headers.authorization
    console.log(token)
    if(token && token.startsWith('Bearer '))
    {
      token=token.slice(7)
    }

    jwt.verify(token, publicKey, { algorithms: ['RS256'] }, (err, decoded) => {
      if (err) {
        if (err.expiredAt) {
          res.status(401).json(({error: "expired token"}))
        } else {
          res.status(401).json({error: "unauthorized"})
        }
      } else {
        req.userName = decoded.data
        console.log("Authorized user: "+req.userName)
        next()
      }
    })
  }
//GET ROUTES 

app.get('/reviews', async (req, res) => {
  try {
    const reviewsSnapshot = await db.collection('reviews').get();
    if (reviewsSnapshot.empty) {
      res.status(404).send({ error: "No reviews found" });
    } else {
      let reviews = [];
      reviewsSnapshot.forEach((doc) => {
        let review = doc.data();
        review.id = doc.id;
        console.log("Review: ", review);
        reviews.push(review);
      });
      res.status(200).send(reviews);
    }
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

//GET reviews comments 

app.get("/review/reviewId/comments", async(req, res)=>
{
    try{
      let reviewId = req.params.reviewId

      const reviewRef = db.collection("reviews").doc(reviewId)
      const reviewDoc=await reviewRef.get()

      if(!reviewDoc.exists)
      {
        res.status(404).send({error:"Review not found"})
      }
      else{
        const commentsSnapshot=await reviewRef.collection('comments').get()
        if(commentsSnapshot.empty)
        {
          res.status(404).send({error:"No comments found"})
        }
        else{
          let comments=[]
          commentsSnapshot.forEach((doc)=>
          {
            comment=doc.data()
            comment.id=doc.id
            console.log("Comment: ", comment)
            comments.push(comment)
          })
          res.status(200).send(comments)
        }
      }
    }
    catch(error)
    {
      res.status(500).send({error:error.message})
    }

});


// register a new user 
app.post('/register', async(req, res) => {
  try {
      if(!req.body.hasOwnProperty("name") || !req.body.hasOwnProperty("email") || !req.body.hasOwnProperty("password")){
          return res.status(400).json({ error: 'Name, email and password are required' })
      }else{
          let user = req.body
          console.log('Trying to post the following data:', user)

          let emailField="email"
          const usersRef = db.collection('users');
          const snapshot = await usersRef.where(emailField, '==', user.email).get()
          if (!snapshot.empty) {
              res.status(409).send({error:'User with the same email already exists'})
          } else {
              bcrypt.hash(user.password, saltRounds, async function (err, hash) {
                  if (err) {
                      console.error(err)
                      res.status(500).send({error:'Internal Server Error'})
                      return;
                  }

                  user.password = hash
                  const newUser = await db.collection('users').add(user)
                  console.log('Added document with ID:', newUser.id)

                  const token = jwt.sign({
                      data: user.name,
                      exp: Math.floor(Date.now() / 1000) + (60 * 60)
                  }, privateKey, {
                      algorithm: 'RS256' // asymmetric
                  })

                  res.status(200).json({
                      token: token,
                      userName: newUser
                  })
              });
          }
      }
  } catch (error) {
      console.error(error)
      res.status(500).send({error:'Internal Server Error'})
  }
})

// OK! -> Login an existing user (username + token)
app.post ('/login', async(req, res) => {
  if(!req.body.hasOwnProperty("email") || !req.body.hasOwnProperty("password")){
      return res.status(400).json({ error: 'Email and password are required' })
  }else{
      let user = req.body
      console.log('Trying to login with: ', user)

      const usersRef = db.collection('users');
      const snapshot = await usersRef.where('email', '==', user.email).limit(1).get()
      if (snapshot.empty) {
          res.status(404).send({error:'No user found with this email'})
      }  else{
          let document ={}
          snapshot.forEach(doc => {
              document = doc.data()
          });
          
          console.log(document)
              if (document) {
                  let dbHash = document.password
                  bcrypt.compare(user.password, dbHash, function(err, result) {
                      if (result) {
                          const token = jwt.sign({
                          data: document.name,
                          exp: Math.floor(Date.now() / 1000) + (60 * 60)
                          }, privateKey, {
                          algorithm: 'RS256' //asymetric
                          })
                          console.log("TOKEN: "+token+" NAME "+document.name)
  
                          res.status(200).json({
                          token: token,
                          userName: document.name
                          })
                      } else {
                          res.status(401).json({error: 'Wrong password'})
                      }
                  });
              } else {
                  res.status(401).json({error: "The user doesn't exist"})
              }
      }
  }
})

// ADD A NEW REVIEW
app.post('/review', checkAuthorization, async (req, res) => {
  try {
    if (
      !req.body.hasOwnProperty("title") ||
      !req.body.hasOwnProperty("authorOfBook") ||
      !req.body.hasOwnProperty("genre") ||
      !req.body.hasOwnProperty("review") ||
      !req.body.hasOwnProperty("author") 
    ) {
      return res.status(400).json({ error: "Title, author, genre, review are required" });
    } else {
      let review = req.body;
      console.log('Trying to post the following data: ', review);
      const newReview = await db.collection('reviews').add(review);
      console.log("Added a new document with ID: ", newReview.id);
      res.status(201).send(newReview);
    }
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.post("/review/:reviewId/comments", async (req, res) => {
  try {
    if (!req.body.hasOwnProperty("comment")) {
      return res.status(400).json({ error: "Comment is required" });
    } else {
      let reviewId = req.params.reviewId;
      let comment = req.body;
      console.log("Review ID: " + reviewId + " Trying to post the following data: " + comment);

      const reviewRef = db.collection('reviews').doc(reviewId);
      const reviewDoc = await reviewRef.get();

      if (!reviewDoc.exists) {
        res.status(404).send({ error: 'Review not found' });
      } else {
        const commentsCollection = reviewRef.collection('comments');
        const newComment = await commentsCollection.add(comment);
        comment.id = newComment.id;
        console.log('Added document with ID:', newComment.id);

        res.status(201).send(comment);
      }
    }
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});


//EDIT A REVIEW
app.put('/review/:reviewId', checkAuthorization, async (req, res) => {
  try {
    const {
      title,
      authorOfBook,
      genre,
      review,
      author,
    } = req.body;

    if (!title || !authorOfBook || !genre || !review || !author) {
      return res.status(400).json({ error: "Title, author, genre, and review are required" });
    } else {
      const reviewId = req.params.reviewId;
      const date = admin.firestore.FieldValue.serverTimestamp();

      const reviewRef = db.collection('reviews').doc(reviewId);
      const reviewDoc = await reviewRef.get();

      if (!reviewDoc.exists) {
        res.status(404).send({ error: 'Review not found' });
        return;
      }

      if (reviewDoc.data().author !== req.userName) {
        res.status(403).send({ error: 'Unauthorized to edit this review' });
        return;
      }

      const updatedReview = await reviewRef.update({
        title: title,
        authorOfBook: authorOfBook,
        genre: genre,
        review: review,
        date: date, 
        author:author,
      });

      res.status(200).send({ message: 'Review updated successfully' });
    }
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

//like a review 
app.put('/review/:reviewId/like', async (req, res) => {
  try {
    const reviewId = req.params.reviewId;

    const reviewRef = db.collection('reviews').doc(reviewId);
    const reviewDoc = await reviewRef.get();

    if (!reviewDoc.exists) {
      res.status(404).send({ error: 'Review not found' });
      return;
    }

    const updatedReview = await reviewRef.update({
      likes: admin.firestore.FieldValue.increment(1)
    });

    res.status(200).send(updatedReview);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});


// -> OK! - Edit a comment
app.put('/review/:reviewId/comments/:commentId', checkAuthorization, async (req, res) => {
  try {
      if(!req.body.hasOwnProperty("comment")){
          return res.status(400).json({ error: 'Comment is required' })
      }else{
          const reviewId = req.params.reviewId
          const commentId = req.params.commentId
          const comment=req.body.comment

          const reviewRef = db.collection('reviews').doc(reviewId)
          const reviewDoc = await reviewRef.get()

          if (!reviewDoc.exists) {
              res.status(404).send({error:'Review not found'})
              return
          }

          const commentRef = reviewRef.collection("comments").doc(commentId)
          const commentDoc = await commentRef.get()

          if (!commentDoc.exists) {
              res.status(404).send({error:'Comment not found'})
              return
          }

          if (commentDoc.data().userName !== req.userName) { 
              res.status(403).send({ error: 'Unauthorized to edit this comment' })
              return
          }

          const updatedReview = await commentRef.update({
          comment: comment
          })

          res.status(200).send(updatedReview)
   }
  } catch (error) {
      console.error(error);
      res.status(500).send({error:'Internal Server Error'});
  }
})

//--------------------DELETE ROUTES------------------------

// -> OK! - Delete a Post
app.delete('/review/:reviewId', checkAuthorization, async (req, res) => {
  try {
      const reviewId = req.params.reviewId

      const reviewRef = db.collection('reviews').doc(reviewId)
      const reviewDoc = await reviewRef.get();

      if (!reviewDoc.exists) {
          res.status(404).send({error:'Review not found'})
          return
      }

      if (reviewDoc.data().author !== req.userName) { 
          res.status(403).send({ error: 'Unauthorized to delete this post' })
          return
      }

      const commentsRef = reviewRef.collection('comments');
      const commentsSnapshot = await commentsRef.get();

      const batch = db.batch()

      commentsSnapshot.forEach(commentDoc => {
          batch.delete(commentDoc.ref)
      });

      batch.delete(reviewRef)

      await batch.commit()

      res.status(204).send({message:'Review deleted successfully'})
  } catch (error) {
      console.error(error)
      res.status(500).send({error:'Internal Server Error'})
  }
})

// -> OK! - Delete a Comment
app.delete('/review/:reviewId/comments/:commentId', checkAuthorization, async (req, res) => {
  try {
      const reviewId = req.params.reviewId;
      const commentId = req.params.commentId

      const reviewRef = db.collection('reviews').doc(reviewId)
      const reviewDoc = await reviewRef.get();

      if (!reviewDoc.exists) {
          res.status(404).send({error:'Review not found'})
          return
      }

      const commentRef = reviewRef.collection("comments").doc(commentId)
      const commentDoc = await commentRef.get()

      if (!commentDoc.exists) {
          res.status(404).send({error:'Comment not found'})
          return
      }

      if (commentDoc.data().userName !== req.userName) { 
          res.status(403).send({ error: 'Unauthorized to delete this comment' })
          return
      }

      const deletedComment = await commentRef.delete()

      res.status(204).send({message:'Comment deleted successfully'})
  } catch (error) {
      console.error(error)
      res.status(500).send({error:'Internal Server Error'})
  }
})

// PORNIRE SERVER
app.listen(port, () => {
  console.log(`App listening on port ${port}!`)
})