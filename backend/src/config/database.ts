import mongoose from 'mongoose';

export const connectDB = async () => {
    try{

        const mongoDB_URL = process.env.MONGODB_URI!;
        if(!mongoDB_URL){
            throw new Error("MONGODB_URI is not defined in the environment variables");
        } 

        await mongoose.connect(mongoDB_URL)
        console.log("MondoDB connected")
    }catch(error){
        console.error('MongoDB Connection Error ', error);
        process.exit(1)
    }
}