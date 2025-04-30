import mongoose from "mongoose";
config();
import{config} from 'dotenv';


mongoose.set('strictQuery',false);


const connectToDb=async()=>{
    try{
        console.log('connect',process.env.MONGO_URI2);

        // const {connection}=await mongoose.connect('mongodb://localhost:27017/lms3334');
        const { connection } = await mongoose.connect('mongodb://127.0.0.1:27017/lms3334');



        if(connection){
            console.log('Connecting to mongodb: ${connection.host}');
        }
    } catch(e){
        console.log(e);
        process.exit(1);
    }
};


export default connectToDb;