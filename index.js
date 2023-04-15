const express = require("express");
// const multer = require("multer");
// const path = require("path");
const cors = require("cors");
require("dotenv").config();
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;

// const UPLOADS_FOLDER = "./uploads";

// const storage = multer.diskStorage({
//   destination: (rew, file, cb) => {
//     cb(null, UPLOADS_FOLDER);
//   },
//   filename: (req, file, cb) => {
//     const fileExt = path.extname(file.originalname);
//     const fileName =
//       file.originalname
//         .replace(fileExt, "")
//         .toLowerCase()
//         .split(" ")
//         .join("-") +
//       "-" +
//       Date.now();
//     cb(null, (url = fileName + fileExt));
//   },
// });

// var upload = multer({
//   storage: storage,
//   limits: {
//     fieldSize: 1000000, //1mb
//   },
//   fileFilter: (req, file, cb) => {
//     if (
//       file.mimetype === "image/png" ||
//       file.mimetype === "image/jpg" ||
//       file.mimetype === "image/jpeg"
//     ) {
//       cb(null, true);
//     } else {
//       cb(new Error("Only .jpg, .png or .jpeg formate allowed!"));
//     }
//   },
// });

app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send("unauthorized access");
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@friitraining.a5d8fvh.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const usersCollection = client.db("frii-programming").collection("users");
    const courseCollection = client
      .db("frii-programming")
      .collection("courses");
    const lessonCollection = client
      .db("frii-programming")
      .collection("lessons");
    const enrolmentCollection = client
      .db("frii-programming")
      .collection("enrolments");
    const messageCollection = client
      .db("frii-programming")
      .collection("messages");
    const blogCollection = client.db("frii-programming").collection("blogs");
    const blogLikeCollection = client
      .db("frii-programming")
      .collection("blogLike");
    const liveClassCollection = client
      .db("frii-programming")
      .collection("liveClass");

    const verifyAdmin = async (req, res, next) => {
      const decodedEmail = req.decoded.email;
      const query = { email: decodedEmail };
      const user = await usersCollection.findOne(query);

      if (user?.userType !== "admin") {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const quary = { email: email };
      const user = await usersCollection.findOne(quary);
      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
          expiresIn: "365d",
        });
        return res.send({ accessToken: token });
      }
      res.status(403).send({ assessToken: "" });
    });

    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isAdmin: user?.userType === "admin" });
    });

    app.get("/users/female/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isFemale: user?.gender === "F" });
    });

    app.get("/users/verified/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isVerified: user?.status === "verified" });
    });

    app.get("/users/:userType", async (req, res) => {
      const userType = req.params.userType;
      const query = { userType };
      const users = await usersCollection.find(query).toArray();
      res.send(users);
    });

    app.get("/courses", async (req, res) => {
      const quary = {};
      const result = await courseCollection.find(quary).toArray();
      res.send(result);
    });

    app.get("/lessons", async (req, res) => {
      const quary = {};
      const result = await lessonCollection.find(quary).toArray();
      res.send(result);
    });

    app.get("/coursedetails/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await courseCollection.findOne(query);
      res.send(result);
    });

    app.get("/mycourses/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const result = await enrolmentCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/dashboard/studentsmessage", async (req, res) => {
      const query = {};
      const result = await messageCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/unreadsmessages", async (req, res) => {
      const query = { status: "unanswered" };
      const result = await messageCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/unverifiedstudents", async (req, res) => {
      const query = { status: "unverified" };
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/mymessages/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const cursor = messageCollection.find(query).limit(3);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/dashboard/coursemodules/:courseId", async (req, res) => {
      const courseId = req.params.courseId;
      const query = { courseId };
      const result = await lessonCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/search/:branch/:level/:section", async (req, res) => {
      const branch = req.params.branch;
      const level = req.params.level;
      const section = req.params.section;
      const query = { branch, level, section };
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/blogs", async (req, res) => {
      const query = {};
      const result = await blogCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/blog/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await blogCollection.findOne(query);
      res.send(result);
    });

    app.get("/bloglikecount/:blog", async (req, res) => {
      const blog = req.params.blog;
      const query = { blog };
      const users = await blogLikeCollection.find(query).toArray();
      res.send(users);
    });

    // app.get("/myusers/:email", async (req, res) => {
    //   const email = req.params.email;
    //   const query = { email };
    //   const users = await usersCollection.findOne(query);
    //   res.send(users);
    // });

    app.get("/liveclasslist", async (req, res) => {
      const query = {};
      const result = await liveClassCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/addliveclass", async (req, res) => {
      const LiveClass = req.body;
      const result = await liveClassCollection.insertOne(LiveClass);
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.post("/postcourse", async (req, res) => {
      const user = req.body;
      const result = await courseCollection.insertOne(user);
      res.send(result);
    });

    app.post("/postlesson", async (req, res) => {
      const user = req.body;
      const result = await lessonCollection.insertOne(user);
      res.send(result);
    });

    app.post("/postblog", async (req, res) => {
      const blog = req.body;
      const result = await blogCollection.insertOne(blog);
      res.send(result);
    });

    app.put("/enrolments/:email", async (req, res) => {
      const email = req.params.email;
      const courseId = req.body.courseId;
      const productName = req.body.productName;
      const image = req.body.image;
      const student = req.body.student;
      const filter = { email, courseId, productName, image, student };
      const options = { upsert: true };
      const updateData = {
        $set: {},
      };
      const result = await enrolmentCollection.updateOne(
        filter,
        updateData,
        options
      );
      res.send(result);
    });

    // app.put("/dashboard/:email", upload.single("file"), async (req, res) => {
    //   const email = req.params.email;
    //   const filter = { email };
    //   const options = { upsert: true };
    //   const updateData = {
    //     $set: {
    //       photoURL: `https://www.bihongo.net:2083/cpsess5427529532/frontend/jupiter/filemanager/showfile.html?file=${url}&fileop=&dir=%2Fhome%2Fbihongo%2Fserver.cpc.frii.edu.bd%2Fuploads`,
    //     },
    //   };
    //   const result = await usersCollection.updateOne(
    //     filter,
    //     updateData,
    //     options
    //   );
    //   res.send(result);
    // });

    app.put("/postlikes/:email", async (req, res) => {
      const email = req.params.email;
      const blog = req.body.blog;
      const filter = { email, blog };
      const options = { upsert: true };
      const updateData = {
        $set: {},
      };
      const result = await blogLikeCollection.updateOne(
        filter,
        updateData,
        options
      );
      res.send(result);
    });

    app.put("/postmessage/:email", async (req, res) => {
      const email = req.params.email;
      const message = req.body.message;
      const name = req.body.name;
      const date = req.body.date;
      const time = req.body.time;
      const filter = { email };
      const option = { upsert: true };
      const updateData = {
        $set: {
          message: message,
          name: name,
          date: date,
          time: time,
          status: "unanswered",
        },
      };
      const result = await messageCollection.updateOne(
        filter,
        updateData,
        option
      );
      res.send(result);
    });

    app.put("/replay/:email", async (req, res) => {
      const email = req.params.email;
      const replay = req.body.replay;
      const replayDate = req.body.replayDate;
      const replayTime = req.body.replayTime;
      const filter = { email };
      const option = { upsert: true };
      const updateData = {
        $set: {
          replay,
          replayDate,
          replayTime,
          status: "answered",
        },
      };
      const result = await messageCollection.updateOne(
        filter,
        updateData,
        option
      );
      res.send(result);
    });

    app.put("/user/status/:email", verifyJWT, verifyAdmin, async (req, res) => {
      const email = req.params.email;
      const filter = { email };
      const options = { upsert: true };
      const updatedProduct = {
        $set: {
          status: "unverified",
        },
      };
      const result = await usersCollection.updateOne(
        filter,
        updatedProduct,
        options
      );
      res.send(result);
    });

    app.put(
      "/user/status/verify/:email",
      verifyJWT,
      verifyAdmin,
      async (req, res) => {
        const email = req.params.email;
        const filter = { email };
        const options = { upsert: true };
        const updatedProduct = {
          $set: {
            status: "verified",
          },
        };
        const result = await usersCollection.updateOne(
          filter,
          updatedProduct,
          options
        );
        res.send(result);
      }
    );

    app.delete("/user/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });

    app.delete(
      "/deleteliveclass/:id",
      verifyJWT,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await liveClassCollection.deleteOne(query);
        res.send(result);
      }
    );
  } finally {
  }
}
run().catch(console.log);

app.get("/", (req, res) => {
  res.send("FRII Programming Club is Running");
});

app.listen(port, () => {
  console.log(`FRII Plrogramming Club is Running on Port ${port}`);
});
