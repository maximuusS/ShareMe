var mongoose=require("mongoose");
var pictureSchema= new mongoose.Schema({
	title:String,
	image:String,
	likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
	description:String,
	
	comments:[
		{
			type:mongoose.Schema.Types.ObjectId,
			ref:"Comment"
		}
	],	
	createdAt: { type: Date, default: Date.now },
	author:{
		id:{
			type:mongoose.Schema.Types.ObjectId,
			ref:"User"
		},
		username:String
	}
});
module.exports =mongoose.model("Picture", pictureSchema);