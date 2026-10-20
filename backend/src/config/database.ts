import mongoose from 'mongoose';

export const connectDB = async () => {
    try{
        await mongoose.connect(process.env.MONGODB_URI as string)
        console.log("MondoDB connected")
    }catch(error){
        console.error('MongoDB Connection Error ', error);
        process.exit(1)
    }
}