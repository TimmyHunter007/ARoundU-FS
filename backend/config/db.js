const mongoose = require("mongoose");

const connectDB = async () =>
{
    try
    {
        await mongoose.connect(process.env.DB_URI,
            {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
            console.log("Connected");
    }
    catch (error)
    {
        console.error("Connection failed:", error.message);
        process.exit(1);
    }
};

module.export = connectDB;