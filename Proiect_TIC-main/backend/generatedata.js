const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const admin = require('firebase-admin')

const serviceAccount = require('./firebase/app-tic-51e3f-firebase-adminsdk-6mhzl-15cce25c7c.json')

initializeApp({
  credential: cert(serviceAccount)
});
const db = getFirestore();

var Chance = require('chance')
var chance = new Chance()

const bcrypt = require('bcrypt')
const saltRounds = 10

function generateRandomUser() {
  return {
    name: chance.name(),
    email: chance.email(),
    password: chance.string({ length: 8 }),
  }
}

function generateRandomReview(users) {
  const randomUser = chance.pickone(users);
  const genres = ["Science Fiction", "Mystery", "Romance", "Fantasy", "Thriller", "Adventure", "Drama", "Horror", "Non-fiction"];

  return {
    title: chance.sentence({ words: 3 }),
    authorOfBook: chance.name(),
    genre: chance.pickone(genres),
    date: chance.date({ year: new Date().getFullYear() }),
    review: chance.paragraph({ sentences: 3 }),
    likes: chance.integer({ min: 0, max: 15 }),
    author: randomUser.name,
  };
}


function generateRandomComment(users) {
  const randomUser = chance.pickone(users)
  return{
    userName: randomUser.name,
    comment: chance.paragraph({ sentences: 2 })
  }
}

async function populateUsersCollection() {
  try {
    let users = []
    const userPromises = []

    for (let i = 0; i < 5; i++) {   
      const randomUser = generateRandomUser()

      const promise = new Promise((resolve, reject) => {
        bcrypt.hash(randomUser.password, saltRounds, async function (err, hash) {
          if (err) {
            reject(err)
            return
          }

          randomUser.password = hash;
          const userRef = await db.collection('users').add(randomUser)
          randomUser.id = userRef.id
          users.push(randomUser)
          console.log('Added document with ID:', randomUser.id)
          resolve()
        });
      });

      userPromises.push(promise);
    }

    await Promise.all(userPromises)

    console.log('Users collection populated successfully.')
    console.log(users)

    return users 
  } catch (error) {
    console.error('Error populating users collection:', error)
  }
}


async function populateReviewCollection(users) {
  try {
    const reviewPromises = []

    for (let i = 0; i < 10; i++) { // !!!! 10 - 20
      const randomReview = generateRandomReview(users)
      const reviewRef = await db.collection('reviews').add(randomReview)
      randomReview.id = reviewRef.id

      const numComments = chance.integer({ min: 1, max: 7 }) //10

      const commentPromises = []

      for (let j = 0; j < numComments; j++) {
        const randomComment = generateRandomComment(users)
        const commentPromise = db.collection('reviews').doc(reviewRef.id).collection('comments').add(randomComment)
        commentPromises.push(commentPromise) 
      }

      const comments = await Promise.all(commentPromises)
      console.log(`${randomReview.id} - comments added: ${comments.length}`)

      reviewPromises.push(randomReview) 
      randomReview.comments = comments
    }

    const reviews = await Promise.all(reviewPromises)
    console.log('Reviews collection populated successfully:', reviews)
  } catch (error) {
    console.error('Error populating reviews collection:', error)
  }
}



populateUsersCollection()
    .then(users => {
      populateReviewCollection(users)
    })
    .catch(error => {
      console.error('Error:', error)
    })

