import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";

export default function connect() {
    const database = process.env.DB_CONNECTION;

    mongoose
    .connect(database, {
        dbName: "sals-brews",
    })
    
    .then(() => {
        console.log("Connected to database");
    })
    .catch((error) => {
        console.log(error);
    });
}