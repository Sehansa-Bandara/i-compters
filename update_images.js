import mongoose from 'mongoose';

const mongoUri = "mongodb://admin:1234@ac-pbqfgym-shard-00-00.gxyr7vy.mongodb.net:27017,ac-pbqfgym-shard-00-01.gxyr7vy.mongodb.net:27017,ac-pbqfgym-shard-00-02.gxyr7vy.mongodb.net:27017/?ssl=true&replicaSet=atlas-tv180s-shard-0&authSource=admin&appName=Cluster0";

async function run() {
    const conn = await mongoose.connect(mongoUri);
    const result = await conn.connection.db.collection('users').updateMany(
        { image: { $in: ['/userGirl.jpg', '/images/default-profile.png', '/images/userGirl.jpg'] } },
        { $set: { image: '/user.jpg' } }
    );
    console.log('Updated users count:', result.modifiedCount);
    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
